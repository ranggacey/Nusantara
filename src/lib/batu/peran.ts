// Peran zaman batu — 18 peran (10 lama + 8 baru ronde 4: nelayan,
// petani, penjaga, pengukir, penjelajah, pemanjat, penenun, penjerat).
// Tidak ada presiden/VP parodi, polisi, sekolah, kantor, atau pekerjaan modern.
// ROLE-FIT MMORPG: tiap peran punya SYARAT stat minimum. Peran yang syaratnya
// jauh di bawah stat warga DIKECUALIKAN dari gacha (bobot 0); peran yang
// syaratnya terpenuhi sebagian masih mungkin tapi performanya turun (0.6x).
// Contoh user: INT tinggi + AGI/STR kecil TIDAK MUNGKIN jadi pemburu/penambang
// (syarat STR/AGI/STA mereka tinggi) — cocoknya peramu/juru_masak (INT).
// TARGET KHUSUS (bukan node biasa): nelayan memancing di SUNGAI (tile air
// terdekat, pseudo-node — lihat sim.ts), petani bekerja di LADANG bila ada
// (placement, pseudo-node; bila belum ada ladang, fallback semak beri),
// penjaga BERPATROLI keliling kampung (waypoint, pseudo-node, tanpa kumpul).
// Ketiganya nodeKinds kosong/nominal + ditangani khusus di sim.ts —
// pilihNodeTerbaik tidak pernah dipakai untuk mereka.
export type PeranId =
  | "kepala_suku"
  | "pemburu"
  | "pengumpul"
  | "penebang"
  | "penambang"
  | "perajin"
  | "tabib"
  | "penjaga_api"
  | "peramu"
  | "juru_masak"
  | "nelayan"
  | "pemancing"
  | "petani"
  | "penjaga"
  | "pengukir"
  | "penjelajah"
  | "pemanjat"
  | "penenun"
  | "penjerat";

export type NodeKind =
  | "pohon"
  | "semak_beri"
  | "padang_buruan"
  | "singkapan_batu"
  | "urat_emas"
  | "urat_besi";

export type ResourceId = "kayu" | "batu" | "emas" | "besi" | "pangan" | "kulit";

export type StatKey = "int" | "str" | "agi" | "sta";

export interface Peran {
  id: PeranId;
  label: string;
  nodeKinds: NodeKind[];
  stat: "int" | "str" | "agi";
  bobot: number;
  deskripsi: string;
  // Syarat stat minimum (role-fit). Kosong = tanpa syarat keras.
  syarat: Partial<Record<StatKey, number>>;
  // Perkakas kerja peran ini (visual 3D + crafting).
  alat: string;
}

export const PERAN: Peran[] = [
  { id: "kepala_suku", label: "Kepala Suku", nodeKinds: ["padang_buruan"], stat: "int", bobot: 1, deskripsi: "Memimpin rombongan berburu dan membagi hasil.", syarat: { int: 6, sta: 4 }, alat: "tongkat_suku" },
  { id: "pemburu", label: "Pemburu", nodeKinds: ["padang_buruan"], stat: "str", bobot: 3, deskripsi: "Berburu di padang dan memburu hewan, membawa daging dan kulit.", syarat: { str: 6, agi: 5, sta: 5 }, alat: "tombak" },
  { id: "pengumpul", label: "Pengumpul", nodeKinds: ["semak_beri"], stat: "agi", bobot: 3, deskripsi: "Mengumpulkan buah beri dan umbi.", syarat: { agi: 5, sta: 3 }, alat: "keranjang" },
  { id: "penebang", label: "Penebang", nodeKinds: ["pohon"], stat: "str", bobot: 3, deskripsi: "Menebang pohon dengan kapak batu.", syarat: { str: 5, sta: 5 }, alat: "kapak" },
  { id: "penambang", label: "Penambang", nodeKinds: ["singkapan_batu", "urat_emas", "urat_besi"], stat: "str", bobot: 3, deskripsi: "Memahat batu, emas, dan besi dari tanah.", syarat: { str: 6, sta: 6 }, alat: "beliung" },
  { id: "perajin", label: "Perajin", nodeKinds: ["singkapan_batu"], stat: "int", bobot: 2, deskripsi: "Memilih batu bagus untuk perkakas; mempercepat pembangunan.", syarat: { int: 5, str: 3 }, alat: "palu" },
  { id: "tabib", label: "Tabib", nodeKinds: ["semak_beri"], stat: "int", bobot: 2, deskripsi: "Meramu tumbuhan obat untuk kampung.", syarat: { int: 6, agi: 3 }, alat: "tongkat" },
  { id: "penjaga_api", label: "Penjaga Api", nodeKinds: ["pohon"], stat: "str", bobot: 2, deskripsi: "Mengumpulkan kayu bakar, menjaga api unggun tetap menyala.", syarat: { str: 3, sta: 4 }, alat: "obor" },
  { id: "peramu", label: "Peramu", nodeKinds: ["semak_beri"], stat: "int", bobot: 2, deskripsi: "Meramu tumbuhan menjadi ramuan obat dengan lumpang batu.", syarat: { int: 7 }, alat: "lumpang" },
  { id: "juru_masak", label: "Juru Masak", nodeKinds: ["semak_beri", "padang_buruan"], stat: "int", bobot: 2, deskripsi: "Memasak beri dan daging menjadi masakan di periuk tanah.", syarat: { int: 6, agi: 3 }, alat: "periuk" },
  { id: "pemancing", label: "Pemancing", nodeKinds: [], stat: "agi", bobot: 3, deskripsi: "Memancing ikan segar di sungai dengan joran pancing bambu.", syarat: { agi: 4, sta: 3 }, alat: "joran_pancing" },
  { id: "nelayan", label: "Pemancing", nodeKinds: [], stat: "agi", bobot: 2, deskripsi: "Memancing ikan segar di sungai dengan joran dan jala.", syarat: { agi: 4, sta: 3 }, alat: "joran_pancing" },
  { id: "petani", label: "Petani", nodeKinds: ["semak_beri"], stat: "int", bobot: 2, deskripsi: "Bercocok tanam di ladang bila ada; bila belum, mengumpulkan buah beri.", syarat: { int: 5, sta: 3 }, alat: "cangkul" },
  { id: "penjaga", label: "Penjaga Kampung", nodeKinds: [], stat: "str", bobot: 2, deskripsi: "Berpatroli keliling kampung dan mengusir hewan buas yang mendekat.", syarat: { str: 5, sta: 5 }, alat: "tombak" },
  { id: "pengukir", label: "Pengukir Batu", nodeKinds: ["singkapan_batu"], stat: "int", bobot: 2, deskripsi: "Mengukir batu menjadi perkakas dan totem.", syarat: { int: 6, str: 3 }, alat: "pahat" },
  { id: "penjelajah", label: "Penjelajah", nodeKinds: ["pohon", "semak_beri", "padang_buruan", "singkapan_batu", "urat_emas", "urat_besi"], stat: "agi", bobot: 2, deskripsi: "Menjelajah jauh, mengambil sumber apa pun yang ditemukan.", syarat: { agi: 6, sta: 4 }, alat: "tongkat_jalan" },
  { id: "pemanjat", label: "Pemanjat", nodeKinds: ["pohon"], stat: "agi", bobot: 2, deskripsi: "Memanjat pohon mengambil kayu dan buah.", syarat: { agi: 6, sta: 4 }, alat: "tali_panjat" },
  { id: "penenun", label: "Penenun", nodeKinds: ["padang_buruan"], stat: "int", bobot: 2, deskripsi: "Menenun serat dan mengolah hasil padang menjadi kulit tambahan.", syarat: { int: 5, agi: 3 }, alat: "alat_tenun" },
  { id: "penjerat", label: "Penjerat", nodeKinds: ["padang_buruan"], stat: "agi", bobot: 2, deskripsi: "Memasang jerat di padang untuk daging dan kulit.", syarat: { agi: 6, int: 3 }, alat: "jerat" },
];

export function peranById(id: string): Peran | undefined {
  return PERAN.find((p) => p.id === id);
}

export function labelPeran(id: string): string {
  return peranById(id)?.label ?? id;
}

export function labelNode(kind: string): string {
  const m: Record<string, string> = {
    pohon: "hutan",
    semak_beri: "semak beri",
    padang_buruan: "padang buruan",
    singkapan_batu: "singkapan batu",
    urat_emas: "urat emas",
    urat_besi: "urat besi",
  };
  return m[kind] ?? kind;
}

// Hasil node: resource utama + bonus kulit (hanya padang buruan).
export function nodeHasil(kind: NodeKind): { resource: ResourceId; kulitBonus: number } {
  switch (kind) {
    case "pohon":
      return { resource: "kayu", kulitBonus: 0 };
    case "semak_beri":
      return { resource: "pangan", kulitBonus: 0 };
    case "padang_buruan":
      return { resource: "pangan", kulitBonus: 2 };
    case "singkapan_batu":
      return { resource: "batu", kulitBonus: 0 };
    case "urat_emas":
      return { resource: "emas", kulitBonus: 0 };
    case "urat_besi":
      return { resource: "besi", kulitBonus: 0 };
  }
}

export const SIFAT = [
  "ramah",
  "pemberani",
  "tekun",
  "ceria",
  "pendiam",
  "penasaran",
  "sabar",
  "gesit",
  "bijak",
  "jenaka",
  "setia",
  "mandiri",
];

// ---- Role-fit: syarat, bobot, pengali performa --------------------------
// Total kekurangan stat terhadap syarat (0 = semua syarat terpenuhi).
export function defisitSyarat(peranId: string, stat: { int: number; str: number; agi: number; sta?: number }): number {
  const p = peranById(peranId);
  if (!p) return 99;
  const rec = stat as unknown as Record<string, number>;
  let d = 0;
  for (const [k, min] of Object.entries(p.syarat)) {
    const punya = rec[k] ?? 0;
    if (punya < (min ?? 0)) d += (min ?? 0) - punya;
  }
  return d;
}

// Bobot gacha menghormati fit: defisit >= 3 -> dikecualikan (0);
// defisit 1-2 -> bobot dipotong drastis (0.3x); tanpa defisit -> 1.5x.
export function bobotFit(peranId: string, stat: { int: number; str: number; agi: number; sta?: number }): number {
  const p = peranById(peranId);
  if (!p) return 0;
  const d = defisitSyarat(peranId, stat);
  if (d >= 3) return 0;
  if (d > 0) return p.bobot * 0.3;
  return p.bobot * 1.5;
}

// Pengali performa kerja: syarat terpenuhi = 1.0, belum = 0.6 (warga lama
// yang perannya tidak fit tetap bisa bekerja, hanya lebih pelan).
export function pengaliFit(peranId: string, stat: { int: number; str: number; agi: number; sta?: number }): number {
  return defisitSyarat(peranId, stat) === 0 ? 1 : 0.6;
}

export function perkakasPeran(peranId: string): string {
  return peranById(peranId)?.alat ?? "tongkat";
}

export const LABEL_ALAT: Record<string, string> = {
  tongkat_suku: "Tongkat Suku",
  tombak_iblis: "Tombak Iblis Merah",
  tombak: "Tombak",
  busur: "Busur",
  keranjang: "Keranjang",
  kapak: "Kapak Batu",
  beliung: "Beliung",
  palu: "Palu Batu",
  tongkat: "Tongkat Tabib",
  obor: "Obor",
  lumpang: "Lumpang Batu",
  periuk: "Periuk Tanah",
  jala: "Jala Ikan",
  cangkul: "Cangkul Batu",
  pahat: "Pahat Batu",
  tongkat_jalan: "Tongkat Jalan",
  tali_panjat: "Tali Panjat",
  alat_tenun: "Alat Tenun",
  jerat: "Jerat Rotan",
};

// Resep crafting perkakas (level 1 = perkakas bagus, dari resource).
// Warga baru mulai dengan perkakas kasar level 0; crafting menaikkan level.
export const RESEP_PERKAKAS: Record<string, Partial<Record<ResourceId, number>>> = {
  tongkat_suku: { kayu: 8, kulit: 2 },
  tombak: { kayu: 10, batu: 4 },
  busur: { kayu: 12, kulit: 4 },
  keranjang: { kayu: 6, kulit: 2 },
  kapak: { kayu: 6, batu: 6 },
  beliung: { kayu: 6, batu: 8 },
  palu: { kayu: 4, batu: 6 },
  tongkat: { kayu: 8 },
  obor: { kayu: 4, kulit: 1 },
  lumpang: { batu: 10 },
  periuk: { batu: 4, kulit: 2 },
  jala: { kayu: 8, kulit: 4 },
  cangkul: { kayu: 8, batu: 4 },
  pahat: { kayu: 4, batu: 8 },
  tongkat_jalan: { kayu: 10 },
  tali_panjat: { kulit: 6 },
  alat_tenun: { kayu: 10, kulit: 2 },
  jerat: { kayu: 6, kulit: 4 },
};

// RONDE 64 — Biaya tempa besi (Ide 79, DESAIN-EKONOMI.md §2 tingkat 5):
// menaikkan perkakas peran level 1 -> level 2 (perkakas besi) saat
// istirahat, HANYA bila bengkel besi berdiri. Satu angka saja (1 besi):
// gagangnya sudah dibayar resep level 1, yang ditempa hanya mata
// besinya — dan besi adalah gerbang kelangkaan tingkat 5 (rata-rata
// 0,23/hari), jadi biayanya tidak perlu ditambah kayu/batu.
export const BIAYA_TEMPA_BESI: Partial<Record<ResourceId, number>> = { besi: 1 };
