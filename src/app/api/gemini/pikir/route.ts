import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { hitungKapasitasStok } from "@/lib/batu/sumberdaya";

export const dynamic = "force-dynamic";

const MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 15000;

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
    const { nama, peran, status_teks, aksi_sekarang, lapar, stamina, sifat, bakat } = body;

    const keys = bacaKeys();
    if (keys.length === 0) {
      return NextResponse.json({
        ok: true,
        pikiran: "Hutan ini tenang, angin bertiup sepoi-sepoi menemani langkahku menjaga desa.",
        sumber: "fallback",
      });
    }

    // Ambil konteks dunia & lumbung
    const duniaCol = await getCollection("dunia");
    const dunia = await duniaCol.findOne({});
    const stok = dunia?.stok ?? {};

    const tilesCol = await getCollection("peta_tile");
    const placements = await tilesCol.find({}).toArray();
    const kapasitas = hitungKapasitasStok(placements as any);

    // Cek kondisi stok penuh
    const stokPenuhList: string[] = [];
    for (const [k, v] of Object.entries(stok)) {
      if (typeof v === "number" && v >= (kapasitas as Record<string, number>)[k]) {
        stokPenuhList.push(k);
      }
    }
    const infoStok =
      stokPenuhList.length > 0
        ? `Lumbung untuk ${stokPenuhList.join(", ")} sudah PENUH!`
        : `Lumbung desa masih memiliki ruang simpan.`;

    const prompt = [
      `Kamu adalah ${nama || "Warga"}, seorang ${peran || "pekerja"} di Kampung Zaman Batu Prasejarah Nusantara.`,
      `Sifatmu: ${sifat || "pekerja keras"}. Bakat: ${bakat || "alamiah"}.`,
      `Kondisi tubuh: Lapar ${lapar ?? 0}%, Stamina ${stamina ?? 100}%.`,
      `Aksi/status saat ini: ${status_teks || aksi_sekarang || "sedang beristirahat"}.`,
      `Kondisi lumbung desa: ${infoStok}`,
      `Jika lumbung penuh, kamu memilih untuk beristirahat santai, menikmati hidangan di restoran Sichuan, atau berkumpul di perapian daripada memaksakan diri bekerja.`,
      `Pikirkan apa yang ada di benakmu sekarang dan nasihat bijakmu untuk kampung.`,
      `PENTING: Gunakan sudut pandang orang pertama ("Aku"), gaya bahasa zaman batu fantasi Nusantara yang bersahaja, hangat, dan bijak. JANGAN PERNAH menyebut hal modern.`,
      `Jawab dalam 1-2 kalimat padat & menyentuh hati.`,
    ].join("\n");

    for (const key of keys) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": key,
            },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.8, maxOutputTokens: 250 },
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
          }
        );

        if (!res.ok) continue;

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return NextResponse.json({
            ok: true,
            pikiran: text.replace(/[\r\n]+/g, " "),
            sumber: "gemini",
            model: MODEL,
          });
        }
      } catch {
        continue;
      }
    }

    return NextResponse.json({
      ok: true,
      pikiran: "Saat lumbung penuh dan tenaga terkuras, duduk di dekat perapian adalah anugerah terbesar bagi warga rimba.",
      sumber: "fallback",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
