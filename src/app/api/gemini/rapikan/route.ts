// GEMINI TUKANG MIKIR — RAPIKAN (2026-11-04, permintaan user).
// Bila ada bangunan yang footprint-nya menabrak bangunan lain, Gemini
// sendiri yang menggesernya: ia menilai kenapa penempatan lama jelek,
// memilih petak baru dari kandidat yang sudah divalidasi kode (tidak
// menabrak bangunan lain, bukan air, bukan gunung), lalu route
// MEMINDAHKAN bangunan itu + menulis kabar kampung. Tanpa key / gagal
// LLM / jawaban tidak valid, fallback scripted = kandidat pertama.
// Bila tidak ada tumpukan, route mengembalikan ok:false dengan pesan
// (tidak ada yang dipindah).
import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { bangunanById } from "@/lib/batu/sumberdaya";
import { isWater, isGunung, pasanganTumpuk, dedupePlacement, ukuranPetak, petakBangunan, occupiedDariPlacements } from "@/lib/batu/dunia";

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
    const semua = (await tilesCol.find({}).toArray()) as any[];
    const placements = dedupePlacement(semua);
    const jalanDocs = (await jalanCol.find({}).toArray()) as any[];
    const dunia = (await duniaCol.findOne({})) as any;

    const tumpuk = pasanganTumpuk(placements);
    if (!tumpuk) {
      return NextResponse.json({ ok: false, message: "Tidak ada bangunan yang bertumpuk saat ini." });
    }
    const { tetap, geser } = tumpuk;
    // r38: ukuran dari helper petak kanonik — SAMA dengan yang dipakai
    // sim saat menempatkan (w/h baris, kalau tidak ada footprint
    // katalog). Dulu default 2 di sini vs 1 di sim: dua sumber
    // kebenaran, jadi AI bisa berkata "tidak ada yang menumpuk"
    // sementara bangunan lain menembus.
    const { w: gw, h: gh } = ukuranPetak(geser);
    const labelGeser = bangunanById(geser.kind)?.label ?? geser.kind;
    const labelTetap = bangunanById(tetap.kind)?.label ?? tetap.kind;

    const occupied = occupiedDariPlacements(placements.filter((p) => p !== geser));
    // r38: bangunan yang sedang DIBANGUN (koleksi `bangunan` status
    // antre/dibangun, gx/gy sudah ditetapkan) ikut menghalangi —
    // inilah yang kemungkinan user lihat "dibangun menembus
    // restoran": rapikan lama hanya memeriksa peta_tile.
    const bangunanCol = await getCollection("bangunan");
    const konstruksi = (await bangunanCol.find({ status: { $in: ["antre", "dibangun"] } }).toArray()) as any[];
    for (const k of konstruksi) {
      if (k.gx === null || k.gx === undefined || k.gy === null || k.gy === undefined) continue;
      for (const key of petakBangunan({ kind: k.tipe, gx: Number(k.gx), gy: Number(k.gy), w: k.w ?? undefined, h: k.h ?? undefined })) occupied.add(key);
    }
    const roadTiles = jalanDocs.map((j: any) => ({ gx: Number(j.gx), gy: Number(j.gy) }));

    const bebas = (gx: number, gy: number): boolean => {
      for (let dy = 0; dy < gh; dy++) {
        for (let dx = 0; dx < gw; dx++) {
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
        { gx: rt.gx - gw, gy: rt.gy },
        { gx: rt.gx, gy: rt.gy + 1 },
        { gx: rt.gx, gy: rt.gy - gh },
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
      return NextResponse.json({ ok: false, message: "Ada bangunan bertumpuk, tapi belum ada petak kosong di tepi jalan untuk memindahkannya." });
    }

    let tujuan = kandidat[0];
    let penilaian = `${labelGeser} menumpuk dengan ${labelTetap} di (${geser.gx},${geser.gy}) — dua bangunan tidak bisa menempati ubin yang sama, jadi yang satu harus pindah.`;
    let alasan = `${labelGeser} dipindahkan ke tepi jalan (${tujuan.gx},${tujuan.gy}) agar tidak lagi menimpa bangunan lain dan mudah dijangkau warga.`;
    let sumber: "llm" | "scripted" = "scripted";

    const keys = bacaKeys();
    if (keys.length > 0) {
      const daftar = kandidat.map((k) => `(${k.gx},${k.gy})`).join(", ");
      const prompt = [
        `Kamu adalah Kepala Suku Kampung Suka Maju di era zaman batu Nusantara.`,
        `Ada masalah: ${labelGeser} di (${geser.gx},${geser.gy}) MENUMPUK dengan ${labelTetap} di (${tetap.gx},${tetap.gy}) — footprint keduanya saling menimpa, penempatan ini jelek dan harus diperbaiki dengan menggeser ${labelGeser}.`,
        `Pilih SATU petak terbaik dari daftar ini (petak kosong di tepi jalan, selebar ${gw}x${gh} ubin): ${daftar}.`,
        `Jawab baris pertama dengan koordinat persis seperti (x,y), baris kedua dengan 1 kalimat penilaian kenapa penempatan lama itu jelek, baris ketiga dengan 1-2 kalimat alasan kenapa petak baru itu bagus. Gaya manusia purba Nusantara yang arif dan hangat, tanpa kata modern.`,
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
              generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
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
              tujuan = cocok;
              const sisa = t
                .replace(m[0], "")
                .split(/[\r\n]+/)
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
              if (sisa[0]) penilaian = sisa[0].slice(0, 300);
              if (sisa[1]) alasan = sisa.slice(1).join(" ").slice(0, 300);
              sumber = "llm";
            }
          }
        }
      } catch {}
    }

    await tilesCol.updateOne({ _id: geser._id }, { $set: { gx: tujuan.gx, gy: tujuan.gy } });
    const hari = dunia?.sim_hari ?? 1;
    const kabarCol = await getCollection("kabar");
    await kabarCol.insertOne({
      jenis: "gemini_rapikan",
      teks: `🔧 Rapikan Gemini: ${labelGeser} digeser dari (${geser.gx},${geser.gy}) ke (${tujuan.gx},${tujuan.gy}) karena menumpuk dengan ${labelTetap}. "${penilaian} ${alasan}"`,
      hari,
      dibuat_pada: new Date(),
    });

    return NextResponse.json({
      ok: true,
      dipindah: { kind: geser.kind, label: labelGeser, dari: { gx: geser.gx, gy: geser.gy }, ke: tujuan },
      tumpang: { kind: tetap.kind, label: labelTetap, posisi: { gx: tetap.gx, gy: tetap.gy } },
      penilaian,
      alasan,
      sumber,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
