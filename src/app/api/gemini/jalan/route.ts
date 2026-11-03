// GEMINI TUKANG MIKIR — JALAN (2026-11-03, permintaan user).
// Penasihat, bukan auto-builder: Gemini memilih segmen jalan yang
// paling bagus dibangun berikutnya + alasan, jalurnya dihitung BFS
// oleh kode (jalurSegmen) dan divalidasi. Tanpa key / gagal LLM,
// fallback scripted = urutan prioritas tetap rencanaJalan.
// Route ini TIDAK menulis database; pembangunan tetap lewat sim
// (karakter pinter) dan alur bangunan normal.
import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { SEGMEN_JALAN, jalurSegmen, type PlacementMini } from "@/lib/batu/jalan";

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

export async function POST() {
  try {
    const tilesCol = await getCollection("peta_tile");
    const jalanCol = await getCollection("jalan");
    const duniaCol = await getCollection("dunia");

    const placements = (await tilesCol.find({}).toArray()) as any[];
    const jalanDocs = (await jalanCol.find({}).toArray()) as any[];
    const dunia = (await duniaCol.findOne({})) as any;

    const minis: PlacementMini[] = placements.map((p: any) => ({
      kind: String(p.kind),
      gx: Number(p.gx),
      gy: Number(p.gy),
      w: Number(p.w ?? 2),
      h: Number(p.h ?? 2),
    }));
    const jalanSelesai = new Set<string>(jalanDocs.map((j: any) => `${j.gx},${j.gy}`));
    const nodeKeys = new Set<string>(Object.keys(dunia?.node_sisa ?? {}));

    const kandidat = SEGMEN_JALAN.map((s) => jalurSegmen(s.id, minis, jalanSelesai, nodeKeys)).filter(
      (r): r is NonNullable<typeof r> => r !== null
    );
    if (kandidat.length === 0) {
      return NextResponse.json({ ok: false, message: "Semua jalan sudah selesai atau ujungnya belum ada." });
    }

    let pilihan = kandidat[0];
    let alasan = `Jalan ${pilihan.segmen} diprioritaskan karena menghubungkan bangunan penting yang paling sering dilalui warga.`;
    let sumber: "llm" | "scripted" = "scripted";

    const keys = bacaKeys();
    if (keys.length > 0) {
      const daftar = kandidat.map((k) => `- ${k.segmen}: ${k.tiles.length} ubin tersisa`).join("\n");
      const prompt = [
        `Kamu adalah Kepala Suku Kampung Suka Maju di era zaman batu Nusantara.`,
        `Pilih SATU segmen jalan berikut yang paling bagus dibangun berikutnya (paling sering dilalui, paling menghubungkan, paling berguna untuk gotong royong):`,
        daftar,
        `Jawab baris pertama dengan id segmen persis, baris kedua dengan 1-2 kalimat alasan gaya manusia purba Nusantara yang arif dan hangat, tanpa kata modern.`,
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
          const cocok = kandidat.find((k) => t.includes(k.segmen));
          if (cocok) {
            pilihan = cocok;
            const bersih = t.replace(cocok.segmen, "").replace(/[\r\n]+/g, " ").trim();
            if (bersih) alasan = bersih.slice(0, 300);
            sumber = "llm";
          }
        }
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      segmen: pilihan.segmen,
      tiles: pilihan.tiles,
      jumlahUbin: pilihan.tiles.length,
      alasan,
      sumber,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
