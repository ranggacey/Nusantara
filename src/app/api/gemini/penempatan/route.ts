// GEMINI TUKANG MIKIR — PENEMPATAN (2026-11-03, permintaan user).
// Penasihat: Gemini memilih petak terbaik untuk bangunan baru dari
// kandidat petak kosong di tepi jalan yang sudah divalidasi kode
// (tidak menabrak bangunan, bukan air, bukan gunung). Tanpa key /
// gagal LLM / jawaban tidak valid, fallback scripted = kandidat
// pertama. Route ini TIDAK menulis database; pembangunan tetap
// lewat alur bangunan normal.
import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { bangunanById } from "@/lib/batu/sumberdaya";
import { isWater, isGunung } from "@/lib/batu/dunia";

export const dynamic = "force-dynamic";

const MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 25000;

function bacaKeys(): string[] {
  let raw = process.env.GEMINI_API_KEYS ?? "";
  if (!raw && typeof window === "undefined") {
    try {
      const fs = require("fs");
      const envPath = ".env";
      if (fs.existsSync(envPath)) {
        const envStr = fs.readFileSync(envPath, "utf8");
        const m = envStr.match(/GEMINI_API_KEYS=(.+)/);
        if (m) raw = m[1].trim();
      }
    } catch {}
  }
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const kind = String(body?.kind ?? "");
    const def = bangunanById(kind);
    if (!def) {
      return NextResponse.json({ ok: false, error: `Bangunan tidak dikenal: ${kind}` }, { status: 400 });
    }
    const fp = Number((def as any).footprint ?? 2);

    const tilesCol = await getCollection("peta_tile");
    const jalanCol = await getCollection("jalan");
    const placements = (await tilesCol.find({}).toArray()) as any[];
    const jalanDocs = (await jalanCol.find({}).toArray()) as any[];

    const occupied = new Set<string>();
    for (const p of placements) {
      const pw = Number(p.w ?? 2);
      const ph = Number(p.h ?? 2);
      for (let dy = 0; dy < ph; dy++) {
        for (let dx = 0; dx < pw; dx++) {
          occupied.add(`${p.gx + dx},${p.gy + dy}`);
        }
      }
    }
    const roadTiles = jalanDocs.map((j: any) => ({ gx: Number(j.gx), gy: Number(j.gy) }));

    const bebas = (gx: number, gy: number): boolean => {
      for (let dy = 0; dy < fp; dy++) {
        for (let dx = 0; dx < fp; dx++) {
          const x = gx + dx;
          const y = gy + dy;
          if (occupied.has(`${x},${y}`) || isWater(x, y) || isGunung(x, y)) return false;
        }
      }
      return true;
    };

    // Kandidat: petak kosong selebar footprint yang menempel jalan.
    const kandidat: { gx: number; gy: number }[] = [];
    const seen = new Set<string>();
    for (const rt of roadTiles.slice(0, 300)) {
      if (kandidat.length >= 6) break;
      const tetangga = [
        { gx: rt.gx + 1, gy: rt.gy },
        { gx: rt.gx - fp, gy: rt.gy },
        { gx: rt.gx, gy: rt.gy + 1 },
        { gx: rt.gx, gy: rt.gy - fp },
      ];
      for (const c of tetangga) {
        const key = `${c.gx},${c.gy}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (bebas(c.gx, c.gy)) kandidat.push(c);
        if (kandidat.length >= 6) break;
      }
    }
    if (kandidat.length === 0) {
      return NextResponse.json({ ok: false, message: "Belum ada petak kosong di tepi jalan untuk bangunan ini." });
    }

    let saran = kandidat[0];
    let alasan = `${def.label} diletakkan di tepi jalan (${saran.gx},${saran.gy}) agar mudah dijangkau warga dan tidak menutup jalur.`;
    let sumber: "llm" | "scripted" = "scripted";

    const keys = bacaKeys();
    if (keys.length > 0) {
      const konteks = placements
        .slice(0, 40)
        .map((p: any) => `${p.kind}@(${p.gx},${p.gy})`)
        .join(", ");
      const daftar = kandidat.map((k) => `(${k.gx},${k.gy})`).join(", ");
      const prompt = [
        `Kamu adalah Kepala Suku Kampung Suka Maju di era zaman batu Nusantara.`,
        `Sebuah ${def.label} baru akan dibangun. Bangunan yang sudah ada: ${konteks}.`,
        `Pilih SATU petak terbaik dari daftar ini (petak kosong di tepi jalan, selebar ${fp} ubin): ${daftar}.`,
        `Pertimbangkan: dekat lumbung dan paviliun untuk bangunan pangan, dekat hunian untuk bangunan warga, tidak menutup jalan, tidak terlalu jauh dari kampung.`,
        `Jawab baris pertama dengan koordinat persis seperti (x,y), baris kedua dengan 1-2 kalimat alasan gaya manusia purba Nusantara yang arif dan hangat, tanpa kata modern.`,
      ].join("\n");
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": keys[0],
            },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 250 },
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const t = (data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "") as string;
          const m = t.match(/\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/);
          if (m) {
            const gx = Number(m[1]);
            const gy = Number(m[2]);
            const cocok = kandidat.find((k) => k.gx === gx && k.gy === gy);
            if (cocok) {
              saran = cocok;
              const bersih = t
                .replace(m[0], "")
                .replace(/[\r\n]+/g, " ")
                .trim();
              if (bersih) alasan = bersih.slice(0, 300);
              sumber = "llm";
            }
          }
        }
      } catch {}
    }

    return NextResponse.json({ ok: true, kind, label: def.label, saran, alasan, sumber });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
