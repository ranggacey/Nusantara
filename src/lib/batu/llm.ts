// Otak dialog LLM zaman batu — Gemini API gratis dengan rotasi key.
// Kunci HANYA dibaca dari process.env.GEMINI_API_KEYS saat runtime
import { getCollection } from "../db";
import { berisiModern } from "./dialog";

const MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 20000;
const COOLDOWN_MS = 60000;
const MAKS_TEKS = 400;

export interface LlmPersona {
  nama: string;
  peran?: string;
  sifat?: string;
  status_teks?: string;
  kejadian?: string;
  pesan?: string;
}

interface RotasiDoc {
  key_index_terakhir?: number;
  cooldown?: Record<string, number>;
}

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

async function bacaRotasi(): Promise<RotasiDoc> {
  try {
    const doc = await getCollection<{ _id: string; key_index_terakhir?: number; cooldown?: Record<string, number> }>(
      "llm_rotasi"
    ).then((c) => c.findOne({ _id: "utama" }));
    if (!doc) return {};
    return {
      key_index_terakhir: typeof doc.key_index_terakhir === "number" ? doc.key_index_terakhir : undefined,
      cooldown: (doc.cooldown as Record<string, number> | undefined) ?? {},
    };
  } catch {
    return {};
  }
}

async function tulisRotasi(patch: RotasiDoc): Promise<void> {
  try {
    await getCollection<{ _id: string; key_index_terakhir?: number; cooldown?: Record<string, number> }>(
      "llm_rotasi"
    ).then((c) => c.updateOne({ _id: "utama" }, { $set: patch }, { upsert: true }));
  } catch {
    /* state rotasi best-effort */
  }
}

function promptPersona(p: LlmPersona): string {
  const baris = [
    `Kamu adalah ${p.nama}, seorang ${p.peran ?? "warga"} di Kampung Suka Maju, era dunia fantasi zaman batu prasejarah Nusantara.`,
    p.sifat ? `Sifatmu: ${p.sifat}.` : "",
    p.status_teks ? `Saat ini kamu sedang: ${p.status_teks}.` : "",
    p.kejadian ? `Kabar terbaru di kampung: ${p.kejadian}.` : "",
    p.pesan ? `Seorang pengamat menyapamu: "${p.pesan}".` : "Seorang pengamat menyapamu.",
    "KAMU HIDUP DI ERA ZAMAN BATU FANTASI. Kamu TIDAK mengenal benda, lembaga, atau kata modern apa pun.",
    "JANGAN PERNAH menyebut: mie, HP, motor, mobil, presiden, uang, rupiah, gaji, sekolah, kantor, polisi, puskesmas, listrik, internet, pasar, toko, jualan modern, dan hal modern lainnya.",
    "Bicaralah tentang hutan, sungai, api unggun, berburu, mengumpulkan, ramuan obat tabib, hewan buas, perkakas batu, gubuk, dan kehidupan kampung saja.",
    "Balas dengan 1-2 kalimat pendek, santai, sesuai peranmu, dalam Bahasa Indonesia.",
    "Jangan pernah menyebut dirimu AI, model, atau program. Jangan keluar dari dunia game.",
  ];
  return baris.filter(Boolean).join("\n");
}

export async function chatWargaLLM(p: LlmPersona): Promise<{ teks: string; sumber: "llm" } | null> {
  const keys = bacaKeys();
  if (keys.length === 0) return null;
  const rotasi = await bacaRotasi();
  const now = Date.now();
  const cooldown = { ...(rotasi.cooldown ?? {}) };
  const start = ((rotasi.key_index_terakhir ?? -1) + 1) % keys.length;
  const urutan: number[] = [];
  for (let i = 0; i < keys.length; i++) urutan.push((start + i) % keys.length);

  const prompt = promptPersona(p);
  for (const idx of urutan) {
    const sampai = cooldown[String(idx)] ?? 0;
    if (sampai > now) continue;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": keys[idx],
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 800 },
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        }
      );
      if (!res.ok) {
        if (res.status === 429) cooldown[String(idx)] = Date.now() + COOLDOWN_MS;
        continue;
      }
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const teks = (data.candidates?.[0]?.content?.parts ?? [])
        .map((part) => part.text ?? "")
        .join("")
        .trim()
        .slice(0, MAKS_TEKS);
      if (!teks || berisiModern(teks)) {
        await tulisRotasi({ key_index_terakhir: idx, cooldown });
        continue;
      }
      await tulisRotasi({ key_index_terakhir: idx, cooldown });
      return { teks, sumber: "llm" };
    } catch {
      continue;
    }
  }
  await tulisRotasi({ cooldown });
  return null;
}

export interface KeputusanNPC {
  pilihan: string; // salah satu kandidat
  alasan: string;
}

export async function keputusanNPC(
  konteks: string,
  kandidat: string[]
): Promise<{ keputusan: KeputusanNPC; sumber: "llm" } | null> {
  const keys = bacaKeys();
  if (keys.length === 0 || kandidat.length === 0) return null;
  const rotasi = await bacaRotasi();
  const now = Date.now();
  const cooldown = { ...(rotasi.cooldown ?? {}) };
  const start = ((rotasi.key_index_terakhir ?? -1) + 1) % keys.length;
  const urutan: number[] = [];
  for (let i = 0; i < keys.length; i++) urutan.push((start + i) % keys.length);

  const prompt = [
    `Kamu adalah kepala suku yang bijaksana di Kampung Suka Maju, dunia fantasi zaman batu Nusantara.`,
    `Keadaan kampung saat ini: ${konteks}`,
    `Pilih SATU bangunan terbaik dari daftar kandidat berikut: ${kandidat.join(", ")}.`,
    `Pedoman prioritas:`,
    `- Bila ada warga sakit/terluka atau diserang hewan buas: prioritaskan pondok_tabib.`,
    `- Bila cadangan pangan kritis atau warga lapar: prioritaskan lumbung atau ladang.`,
    `- Bila warga melebihi kapasitas tempat tinggal: prioritaskan gubuk atau gubuk_besar.`,
    `- Bila terancam hewan buas liar: prioritaskan pagar atau menara_jaga.`,
    `- Bila perajin butuh alat: prioritaskan bengkel_batu atau bengkel_kayu.`,
    "KAMU HIDUP DI ERA ZAMAN BATU FANTASI. Jangan sebut hal modern apa pun.",
    "Balas HANYA dengan format berikut (tanpa pembuka dan tanpa markdown):",
    "PILIHAN: <satu_kandidat_persis> | ALASAN: <alasan bijak 1 kalimat>",
  ].join("\n");

  for (const idx of urutan) {
    const sampai = cooldown[String(idx)] ?? 0;
    if (sampai > now) continue;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": keys[idx],
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        }
      );
      if (!res.ok) {
        if (res.status === 429) cooldown[String(idx)] = Date.now() + COOLDOWN_MS;
        continue;
      }
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const teks = (data.candidates?.[0]?.content?.parts ?? [])
        .map((part) => part.text ?? "")
        .join("")
        .trim();
      if (!teks || berisiModern(teks)) {
        await tulisRotasi({ key_index_terakhir: idx, cooldown });
        continue;
      }
      const m = teks.match(/PILIHAN:\s*([a-z_]+)[\s|:\n]+ALASAN:\s*([\s\S]+)/i);
      const chosen = m ? m[1].trim() : kandidat.find((k) => teks.toLowerCase().includes(k));
      if (!chosen || !kandidat.includes(chosen)) {
        await tulisRotasi({ key_index_terakhir: idx, cooldown });
        continue;
      }
      const rawAlasan = m ? m[2].trim() : teks;
      const alasan = rawAlasan.replace(/[\r\n]+/g, " ").slice(0, 140);
      await tulisRotasi({ key_index_terakhir: idx, cooldown });
      return { keputusan: { pilihan: chosen, alasan }, sumber: "llm" };
    } catch {
      continue;
    }
  }
  await tulisRotasi({ cooldown });
  return null;
}
