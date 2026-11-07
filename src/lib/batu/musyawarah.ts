// Musyawarah Bulanan Pemimpin Kampung — Diskusi Aksi Tokoh Terhebat via Gemini API
import { getCollection } from "../db";
import { BANGUNAN, bangunanById, tingkat5Terbuka, type Bangunan } from "./sumberdaya";
import { getDuniaDoc } from "./sim";

const MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 25000;

export interface TokohMusyawarah {
  id: string;
  nama: string;
  peran: string;
  gelar: string;
  keunggulan: string;
  stat: { int: number; str: number; agi: number; sta: number };
}

export interface DialogTurn {
  pembicara: string;
  peran: string;
  gelar: string;
  teks: string;
}

export interface HasilMusyawarah {
  id: string;
  bulan: number;
  hari: number;
  tema: string;
  tokoh: TokohMusyawarah[];
  dialog: DialogTurn[];
  kesimpulan: {
    bangunan_id: string;
    bangunan_nama: string;
    alasan: string;
  };
  dibuat_pada: Date;
  sumber: "gemini" | "fallback";
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

// Cari tokoh-tokoh terhebat di kampung berdasarkan keunggulan jurusannya
export async function cariTokohTerhebat(): Promise<TokohMusyawarah[]> {
  const wargaCol = await getCollection("warga");
  const warga = await wargaCol.find({}).toArray();
  if (warga.length === 0) return [];

  const list = warga.map((w) => ({
    id: String(w._id),
    nama: String(w.nama ?? "Warga"),
    peran: String(w.peran ?? "pengumpul"),
    sifat: String(w.sifat ?? "tekun"),
    stat: {
      int: Number(w.stat?.int ?? 5),
      str: Number(w.stat?.str ?? 5),
      agi: Number(w.stat?.agi ?? 5),
      sta: Number(w.stat?.sta ?? 5),
    },
  }));

  const tokohSet = new Map<string, TokohMusyawarah>();

  // 1. Si Paling Pintar (INT Tertinggi)
  const pintar = [...list].sort((a, b) => b.stat.int - a.stat.int)[0];
  if (pintar) {
    tokohSet.set(pintar.id, {
      id: pintar.id,
      nama: pintar.nama,
      peran: pintar.peran,
      gelar: "Si Paling Pintar",
      keunggulan: `Kecerdasan tertinggi (INT: ${pintar.stat.int})`,
      stat: pintar.stat,
    });
  }

  // 2. Si Paling Kuat (STR Tertinggi)
  const kuat = [...list].filter((w) => !tokohSet.has(w.id)).sort((a, b) => b.stat.str - a.stat.str)[0] || [...list].sort((a, b) => b.stat.str - a.stat.str)[0];
  if (kuat && !tokohSet.has(kuat.id)) {
    tokohSet.set(kuat.id, {
      id: kuat.id,
      nama: kuat.nama,
      peran: kuat.peran,
      gelar: "Si Paling Kuat",
      keunggulan: `Kekuatan fisik tertinggi (STR: ${kuat.stat.str})`,
      stat: kuat.stat,
    });
  }

  // 3. Si Paling Tangkas (AGI Tertinggi)
  const tangkas = [...list].filter((w) => !tokohSet.has(w.id)).sort((a, b) => b.stat.agi - a.stat.agi)[0];
  if (tangkas) {
    tokohSet.set(tangkas.id, {
      id: tangkas.id,
      nama: tangkas.nama,
      peran: tangkas.peran,
      gelar: "Si Paling Tangkas",
      keunggulan: `Kelincahan tertinggi (AGI: ${tangkas.stat.agi})`,
      stat: tangkas.stat,
    });
  }

  // 4. Kepala Suku atau Sesepuh (STA/INT)
  const kepala = list.find((w) => w.peran === "kepala_suku" && !tokohSet.has(w.id));
  if (kepala) {
    tokohSet.set(kepala.id, {
      id: kepala.id,
      nama: kepala.nama,
      peran: kepala.peran,
      gelar: "Kepala Suku",
      keunggulan: "Pemimpin bijaksana kampung",
      stat: kepala.stat,
    });
  } else if (tokohSet.size < 4) {
    const sesepuh = [...list].filter((w) => !tokohSet.has(w.id)).sort((a, b) => b.stat.sta - a.stat.sta)[0];
    if (sesepuh) {
      tokohSet.set(sesepuh.id, {
        id: sesepuh.id,
        nama: sesepuh.nama,
        peran: sesepuh.peran,
        gelar: "Sesepuh Kampung",
        keunggulan: `Ketahanan & pengalaman (STA: ${sesepuh.stat.sta})`,
        stat: sesepuh.stat,
      });
    }
  }

  return Array.from(tokohSet.values());
}

// Jalankan Musyawarah Bulanan dengan Gemini API
export async function jalankanMusyawarahBulanan(bulanKe?: number): Promise<HasilMusyawarah> {
  const dunia = await getDuniaDoc();
  const jamTotal = Number((dunia as any).jam_total ?? dunia.sim_jam ?? 0);
  const hari = Math.floor(jamTotal / 24);
  const bulan = bulanKe ?? Math.floor(hari / 30) + 1;

  const tokoh = await cariTokohTerhebat();
  const tilesCol = await getCollection("peta_tile");
  const placements = await tilesCol.find({}).toArray();
  const bangunanAda = new Set(placements.map((p) => p.kind));

  const wargaCol = await getCollection("warga");
  const totalWarga = await wargaCol.countDocuments({});

  // RONDE 62 — gerbang tingkat 5 (DESAIN-EKONOMI §2, Ide 77): Bengkel
  // Besi + Tugu Leluhur Agung hanya boleh ditawarkan ke Gemini bila
  // tingkat5Terbuka terpenuhi (penambang aktif + paviliun makan
  // berdiri + populasi 20). Tanpa kunci ini musyawarah bisa
  // memutuskan monumen akhir jauh sebelum kampung siap.
  const adaPenambang = (await wargaCol.countDocuments({ peran: "penambang" })) > 0;
  const tingkat5Buka = tingkat5Terbuka(totalWarga, Array.from(bangunanAda), adaPenambang);

  let kapasitasTotal = 0;
  for (const p of placements) {
    const b = bangunanById(p.kind);
    if (b && b.kapasitas !== null) kapasitasTotal += b.kapasitas;
  }
  const tunawisma = Math.max(0, totalWarga - kapasitasTotal);

  const stok = dunia.stok ?? { kayu: 0, batu: 0, pangan: 0, kulit: 0, emas: 0, besi: 0 };

  // Daftar opsi bangunan yang belum ada atau bisa ditambah
  const kandidat = BANGUNAN.filter((b) => {
    // RONDE 62 — kunci tingkat 5: Bengkel Besi + Tugu Leluhur Agung
    // tidak masuk kandidat sebelum gerbang tingkat 5 terbuka.
    if ((b.id === "bengkel_besi" || b.id === "tugu_leluhur_agung") && !tingkat5Buka) return false;
    if (b.kapasitas !== null && tunawisma > 0) return true; // butuh rumah
    return !bangunanAda.has(b.id) || b.id === "gubuk" || b.id === "lumbung" || b.id === "menara_jaga";
  }).map((b) => ({ id: b.id, label: b.label, deskripsi: b.deskripsi }));

  const prompt = `
Kamu adalah narator dunia fantasi zaman batu prasejarah Nusantara.
Bulan ke-${bulan} telah tiba. Di Balai Musyawarah Kampung Suka Maju, para pemimpin dan tokoh terhebat berkumpul untuk bermusyawarah menentukan proyek pembangunan kampung berikutnya.

Daftar Tokoh yang Hadir:
${tokoh.map((t, idx) => `${idx + 1}. ${t.nama} (${t.gelar}, Peran: ${t.peran}, ${t.keunggulan})`).join("\n")}

Kondisi Kampung Saat Ini:
- Jumlah Warga: ${totalWarga} orang
- Warga Tanpa Rumah (Tunawisma): ${tunawisma} orang
- Cadangan Sumber Daya: Kayu: ${stok.kayu}, Batu: ${stok.batu}, Pangan: ${stok.pangan}, Kulit: ${stok.kulit}, Emas: ${stok.emas ?? 0}, Besi: ${stok.besi ?? 0}
- Bangunan yang sudah ada: ${Array.from(bangunanAda).join(", ")}

Kandidat Bangunan Pilihan:
${kandidat.map((k) => `- ${k.id} (${k.label}): ${k.deskripsi}`).join("\n")}

PEDOMAN PENTING:
- Dunia ini adalah ZAMAN BATU FANTASI (alat batu/kayu, hewan buas, sungai, api unggun). JANGAN SEBUT hal modern (uang, rupiah, mesin, presiden, modern).
- Masing-masing tokoh berdebat sesuai gelar dan keunggulannya:
  * Si Paling Kuat mengutamakan benteng, lumbung kokoh, atau perkakas keras.
  * Si Paling Pintar menganalisis kebutuhan warga tunawisma, logistik, atau pondok tabib bila warga terluka.
  * Si Paling Tangkas menceritakan ekspedisi hutan, tepi sungai, dan bahaya predator.
  * Kepala Suku / Sesepuh memimpin mufakat dengan arif.
- Dialog harus saling menanggapi, hidup, dan mencapai KESEPAKATAN BULAT (konsensus).
- Balas HANYA dengan format JSON valid berikut (tanpa pembuka, tanpa markdown block):

{
  "tema": "Musyawarah Bulanan Bulan ke-${bulan}: [Judul Musyawarah Menarik]",
  "dialog": [
    {
      "pembicara": "[Nama Tokoh]",
      "peran": "[Peran Tokoh]",
      "gelar": "[Gelar Tokoh]",
      "teks": "[Pendapat atau tanggapan tokoh 1-2 kalimat alami]"
    }
  ],
  "kesimpulan": {
    "bangunan_id": "[Salah satu id kandidat]",
    "bangunan_nama": "[Nama Bangunan]",
    "alasan": "[Alasan ringkas dan bijak atas keputusan bersama]"
  }
}
`.trim();

  const keys = bacaKeys();
  let hasilLlm: any = null;

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
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096, responseMimeType: 'application/json' },
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error('[Gemini Musyawarah Error]', res.status, errText.slice(0, 160));
        continue;
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        hasilLlm = JSON.parse(jsonMatch[0]);
        break;
      }
    } catch (err) {
      console.error('[Gemini Musyawarah Fetch Exception]', err instanceof Error ? err.message : err);
      continue;
    }
  }

  const defaultKandidat = tunawisma > 0 ? "gubuk" : !bangunanAda.has("lumbung") ? "lumbung" : !bangunanAda.has("paviliun_makan") ? "paviliun_makan" : "menara_jaga";
  const def = bangunanById(hasilLlm?.kesimpulan?.bangunan_id ?? defaultKandidat) ?? BANGUNAN[0];

  const hasil: HasilMusyawarah = {
    id: `musyawarah-${bulan}-${Date.now()}`,
    bulan,
    hari,
    tema: hasilLlm?.tema ?? `Musyawarah Bulanan Bulan ke-${bulan}: Membangun Ketahanan Kampung`,
    tokoh,
    dialog: Array.isArray(hasilLlm?.dialog) && hasilLlm.dialog.length > 0
      ? hasilLlm.dialog
      : [
          {
            pembicara: tokoh[0]?.nama ?? "Cendekiawan",
            peran: tokoh[0]?.peran ?? "perajin",
            gelar: tokoh[0]?.gelar ?? "Si Paling Pintar",
            teks: tunawisma > 0 ? `Warga bertambah dan ada yang belum punya gubuk berteduh. Kita harus bangun gubuk baru di tepi jalan!` : `Stok kita stabil, saatnya mendirikan fasilitas umum yang kokoh.`,
          },
          {
            pembicara: tokoh[1]?.nama ?? "Pendekar",
            peran: tokoh[1]?.peran ?? "pemburu",
            gelar: tokoh[1]?.gelar ?? "Si Paling Kuat",
            teks: `Aku setuju. Hutan penuh binatang buas, kampung kita butuh keamanan dan tempat tinggal yang rapat dan terlindung.`,
          },
          {
            pembicara: tokoh[2]?.nama ?? "Pelari",
            peran: tokoh[2]?.peran ?? "penjelajah",
            gelar: tokoh[2]?.gelar ?? "Si Paling Tangkas",
            teks: `Sungai dan jalan setapak sudah ramai, mari gotong royong menyelesaikan proyek ini bersama seluruh warga!`,
          },
        ],
    kesimpulan: {
      bangunan_id: def.id,
      bangunan_nama: def.label,
      alasan: hasilLlm?.kesimpulan?.alasan ?? (tunawisma > 0 ? `Memberi tempat berteduh yang layak bagi warga yang belum memiliki hunian.` : `Memperkuat infrastruktur dan kemakmuran Kampung Suka Maju.`),
    },
    dibuat_pada: new Date(),
    sumber: hasilLlm ? "gemini" : "fallback",
  };

  // Simpan ke collection musyawarah
  const musyCol = await getCollection("musyawarah");
  await musyCol.insertOne({ ...hasil });

  // Siarkan kabar ke kampung
  const kabarCol = await getCollection("kabar");
  await kabarCol.insertOne({
    jenis: "musyawarah",
    teks: `🏛️ Musyawarah Bulanan Bulan ke-${bulan} selesai: Dewan Tokoh sepakat membangun ${hasil.kesimpulan.bangunan_nama}!`,
    hari,
    dibuat_pada: new Date(),
  });

  return hasil;
}
