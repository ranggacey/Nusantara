import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { findHousePlotBesideRoad, ukuranPetak, petakBangunan, occupiedDariPlacements } from "@/lib/batu/dunia";

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
    const keys = bacaKeys();
    if (keys.length === 0) {
      return NextResponse.json({ ok: false, error: "GEMINI_API_KEYS tidak tersedia" }, { status: 400 });
    }

    const tilesCol = await getCollection("peta_tile");
    const jalanCol = await getCollection("jalan");
    const duniaCol = await getCollection("dunia");

    const allTiles = (await tilesCol.find({}).toArray()) as any[];
    const jalanDocs = (await jalanCol.find({}).toArray()) as any[];
    const dunia = await duniaCol.findOne({});

    const roadTiles = new Set<string>(jalanDocs.map((j: any) => `${j.gx},${j.gy}`));
    // r38: occupied dari helper petak kanonik — SAMA dengan yang
    // dipakai sim saat menempatkan. Dulu default 2 di sini vs 1 di
    // sim: dua sumber kebenaran.
    const occupied = occupiedDariPlacements(allTiles);
    // r38: bangunan yang sedang DIBANGUN ikut menghalangi (koleksi
    // `bangunan` status antre/dibangun, gx/gy sudah ditetapkan).
    const bangunanCol = await getCollection("bangunan");
    const konstruksi = (await bangunanCol.find({ status: { $in: ["antre", "dibangun"] } }).toArray()) as any[];
    for (const k of konstruksi) {
      if (k.gx === null || k.gx === undefined || k.gy === null || k.gy === undefined) continue;
      for (const key of petakBangunan({ kind: k.tipe, gx: Number(k.gx), gy: Number(k.gy), w: k.w ?? undefined, h: k.h ?? undefined })) occupied.add(key);
    }

    // Filter hunian yang berpotensi direlokasi agar berada di tepi jalan
    const hunianList = allTiles.filter((p: any) =>
      ["gubuk", "gubuk_besar", "tenda_kulit", "tenda_besar"].includes(p.kind)
    );

    if (hunianList.length === 0) {
      return NextResponse.json({ ok: false, message: "Tidak ada hunian yang perlu ditata." });
    }

    // Cari hunian yang belum menempel jalan
    let targetHunian = hunianList.find((h: any) => {
      let nempel = false;
      const { w: hw, h: hh } = ukuranPetak(h);
      for (let dx = 0; dx < hw; dx++) {
        if (roadTiles.has(`${h.gx + dx},${h.gy - 1}`) || roadTiles.has(`${h.gx + dx},${h.gy + hh}`)) nempel = true;
      }
      for (let dy = 0; dy < hh; dy++) {
        if (roadTiles.has(`${h.gx - 1},${h.gy + dy}`) || roadTiles.has(`${h.gx + hw},${h.gy + dy}`)) nempel = true;
      }
      return !nempel;
    }) ?? hunianList[0];

    const { w, h } = ukuranPetak(targetHunian);

    // Hapus occupied milik target sementara
    for (const k of petakBangunan(targetHunian)) occupied.delete(k);

    const plotBaru = findHousePlotBesideRoad(occupied, new Set(), roadTiles, w, h, 1);
    if (!plotBaru) {
      return NextResponse.json({ ok: false, message: "Belum ada petak jalan yang cukup lapang untuk relokasi." });
    }

    // Tanya Gemini untuk justifikasi arsitektur zaman batu
    const prompt = [
      `Kamu adalah Arsitek dan Kepala Suku Kampung Suka Maju di era zaman batu Nusantara.`,
      `Kamu memimpin gotong royong warga desa untuk menata tata kota permukiman.`,
      `Sebuah ${targetHunian.kind} yang sebelumnya berada di (${targetHunian.gx}, ${targetHunian.gy}) dipindahkan ke pinggir jalan setapak di (${plotBaru.gx}, ${plotBaru.gy}) dengan pintu menghadap jalan.`,
      `Berikan sepatah kalimat bijak dan alasan mengapa penataan rumah di tepi jalan ini membuat desa semakin asri, sehat, dan memudahkan warga saling tolong-menolong.`,
      `Gaya bahasa: manusia purba Nusantara yang arif, hangat, dan bersahaja (Bahasa Indonesia). Maksimal 2 kalimat pendek tanpa kata modern.`
    ].join("\n");

    let alasanGemini = "Rumah dipindahkan ke tepi jalan setapak agar warga lebih mudah berlalu-lalang dan saling bertegur sapa.";
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
        const t = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (t) alasanGemini = t.replace(/[\r\n]+/g, " ");
      }
    } catch {}

    // Update lokasi hunian di database
    await tilesCol.updateOne(
      { _id: targetHunian._id },
      {
        $set: {
          gx: plotBaru.gx,
          gy: plotBaru.gy,
          rotasi: plotBaru.rotasi,
        },
      }
    );

    // Tambahkan kabar kampung
    const hari = dunia?.sim_hari ?? 1;
    const kabarBaru = {
      jenis: "tatakota",
      teks: `🏡 Tata Kota Kampung: ${targetHunian.kind} dipindahkan ke samping jalan (${plotBaru.gx},${plotBaru.gy}). "${alasanGemini}"`,
      hari,
      dibuat_pada: new Date(),
    };

    const kabarCol = await getCollection("kabar");
    await kabarCol.insertOne(kabarBaru);

    return NextResponse.json({
      ok: true,
      relokasi: {
        id: targetHunian._id,
        kind: targetHunian.kind,
        dari: { gx: targetHunian.gx, gy: targetHunian.gy },
        ke: { gx: plotBaru.gx, gy: plotBaru.gy, rotasi: plotBaru.rotasi },
        alasan: alasanGemini,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
