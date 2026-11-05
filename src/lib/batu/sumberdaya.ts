// Sumber daya + bangunan zaman batu. Ekonomi berbasis resource, BUKAN uang.
// Tidak ada Rp, gaji, kas desa uang, atau harga modern.
// Bangunan: 14 lama + 7 baru ronde 4 (gubuk_besar, tenda_besar, balai,
// dapur_umum, menara_jaga, sumur_batu, gapura) + 1 ronde 10 (paviliun_makan,
// paviliun kayu adaptasi dari aset user) + 1 ronde 17 (kebun_rempah,
// rantai masak setelah paviliun) = 23.
// Keputusan membangun = NPC (sim), BUKAN pemain — POST /api/bangunan pemain
// ditolak 403 (lihat route). UI bangunan = lihat saja.
import type { ResourceId } from "./peran";

export type { ResourceId };

export interface Resource {
  id: ResourceId;
  label: string;
  icon: string;
}

export const RESOURCES: Resource[] = [
  { id: "kayu", label: "Kayu", icon: "/batu/icons/kayu.png" },
  { id: "batu", label: "Batu", icon: "/batu/icons/batu.png" },
  { id: "emas", label: "Emas", icon: "/batu/icons/emas.png" },
  { id: "besi", label: "Besi", icon: "/batu/icons/besi.png" },
  { id: "pangan", label: "Pangan", icon: "/batu/icons/pangan.png" },
  { id: "kulit", label: "Kulit", icon: "/batu/icons/kulit.png" },
];

export type Stok = Record<ResourceId, number>;

export function stokKosong(): Stok {
  return { kayu: 0, batu: 0, emas: 0, besi: 0, pangan: 0, kulit: 0 };
}

export interface Bangunan {
  id: string;
  label: string;
  biaya: Partial<Record<ResourceId, number>>;
  kapasitas: number | null; // hunian saja; null = bukan hunian
  footprint: number; // 3 = paviliun (butuh ruang dalam + pintu + meja)
  sprite: string;
  deskripsi: string;
  // Jenis penempatan khusus: "darat" (default, via findPlot), "jembatan"
  // (melintasi sungai, via findBridgePlot), "perahu" (di air, via findBoatSpot).
  penempatan?: "darat" | "jembatan" | "perahu";
}

export const BANGUNAN: Bangunan[] = [
  { id: "gubuk", label: "Gubuk", biaya: { kayu: 30, kulit: 10 }, kapasitas: 2, footprint: 2, sprite: "/batu/gubuk.png", deskripsi: "Hunian jerami untuk 2 warga (maksimal 2 orang per rumah)." },
  { id: "tenda_kulit", label: "Tenda Kulit", biaya: { kulit: 20, kayu: 10 }, kapasitas: 2, footprint: 2, sprite: "/batu/tenda-kulit.png", deskripsi: "Hunian kulit hewan untuk 2 warga." },
  { id: "api_unggun", label: "Api Unggun", biaya: { kayu: 10, batu: 5 }, kapasitas: null, footprint: 1, sprite: "/batu/api-unggun.png", deskripsi: "Titik kumpul dan penerangan malam." },
  { id: "lumbung", label: "Lumbung", biaya: { kayu: 40, batu: 10 }, kapasitas: null, footprint: 2, sprite: "/batu/lumbung.png", deskripsi: "Tempat menyimpan hasil kumpul bersama. Ketuk di peta untuk melihat isi." },
  { id: "bengkel_batu", label: "Bengkel Batu", biaya: { batu: 30, kayu: 20 }, kapasitas: null, footprint: 2, sprite: "/batu/bengkel-batu.png", deskripsi: "Tempat kerja perajin membuat perkakas." },
  { id: "pondok_tabib", label: "Pondok Tabib", biaya: { kayu: 20, kulit: 10 }, kapasitas: null, footprint: 2, sprite: "/batu/pondok-tabib.png", deskripsi: "Tempat kerja tabib meramu obat." },
  { id: "pagar", label: "Pagar Kayu", biaya: { kayu: 15 }, kapasitas: null, footprint: 2, sprite: "/batu/pagar.png", deskripsi: "Pagar pembatas kampung dari kayu." },
  { id: "rak_jemur", label: "Rak Jemur", biaya: { kayu: 8, kulit: 2 }, kapasitas: null, footprint: 1, sprite: "/batu/rak-jemur.png", deskripsi: "Rak untuk mengeringkan daging dan kulit." },
  { id: "lingkaran_batu", label: "Lingkaran Batu", biaya: { batu: 20 }, kapasitas: null, footprint: 2, sprite: "/batu/lingkaran-batu.png", deskripsi: "Lingkaran batu tempat musyawarah kampung." },
  { id: "totem", label: "Totem Leluhur", biaya: { kayu: 20, batu: 5 }, kapasitas: null, footprint: 1, sprite: "/batu/totem.png", deskripsi: "Totem ukiran penghormatan leluhur." },
  { id: "ladang", label: "Ladang", biaya: { kayu: 10 }, kapasitas: null, footprint: 2, sprite: "/batu/ladang.png", deskripsi: "Ladang tanaman pangan dekat kampung." },
  { id: "bengkel_kayu", label: "Bengkel Kayu", biaya: { kayu: 30, batu: 5 }, kapasitas: null, footprint: 2, sprite: "/batu/bengkel-kayu.png", deskripsi: "Tempat kerja penebang dan perajin kayu." },
  { id: "jembatan", label: "Jembatan", biaya: { kayu: 40, batu: 10 }, kapasitas: null, footprint: 2, sprite: "/batu/jembatan.png", deskripsi: "Jembatan kayu melintasi sungai — warga lewat tanpa berenang.", penempatan: "jembatan" },
  { id: "perahu", label: "Perahu", biaya: { kayu: 30, kulit: 10 }, kapasitas: null, footprint: 2, sprite: "/batu/perahu.png", deskripsi: "Perahu tambat di sungai — warga naik perahu saat menyeberang.", penempatan: "perahu" },
  { id: "gubuk_besar", label: "Gubuk Besar", biaya: { kayu: 50, kulit: 15 }, kapasitas: 2, footprint: 2, sprite: "/batu/gubuk-besar.png", deskripsi: "Hunian besar jerami untuk 2 warga (maksimal 2 orang per rumah)." },
  { id: "tenda_besar", label: "Tenda Besar", biaya: { kulit: 30, kayu: 15 }, kapasitas: 2, footprint: 2, sprite: "/batu/tenda-besar.png", deskripsi: "Tenda kulit besar untuk 2 warga (maksimal 2 orang per rumah)." },
  { id: "balai", label: "Balai Musyawarah", biaya: { kayu: 50, batu: 20 }, kapasitas: null, footprint: 2, sprite: "/batu/balai.png", deskripsi: "Balai tempat musyawarah kampung berkumpul." },
  { id: "dapur_umum", label: "Dapur Umum", biaya: { kayu: 30, batu: 15 }, kapasitas: null, footprint: 2, sprite: "/batu/dapur-umum.png", deskripsi: "Dapur bersama dengan periuk besar dan bara." },
  { id: "menara_jaga", label: "Menara Jaga", biaya: { kayu: 40, batu: 10 }, kapasitas: null, footprint: 1, sprite: "/batu/menara-jaga.png", deskripsi: "Menara kayu tempat penjaga mengawasi kampung." },
  { id: "sumur_batu", label: "Sumur Batu", biaya: { batu: 25 }, kapasitas: null, footprint: 1, sprite: "/batu/sumur-batu.png", deskripsi: "Sumur batu sumber air kampung." },
  { id: "gapura", label: "Gapura Kampung", biaya: { kayu: 20, batu: 10 }, kapasitas: null, footprint: 2, sprite: "/batu/gapura.png", deskripsi: "Gapura kayu penanda gerbang kampung." },
  // RONDE 10 — paviliun makan: adaptasi Zaman Batu dari paviliun kayu
  // user (Paviliun Rimba Nirwana, versi mewah modern DIPANGKAS: tanpa
  // mezanin, tanpa bar kasir, tanpa plang emas — tinggal alas batu, dek
  // kayu, 4 tiang soko, atap 2 tingkat, meja makan, dapur periuk).
  // Footprint 3x3: kolom tengah = jalur pintu (selatan) -> tengah (meja)
  // -> dapur (utara); warga lapar makan DI DALAM, juru masak memasak
  // di dapur. Bukan hunian (kapasitas null).
  { id: "paviliun_makan", label: "Paviliun Makan", biaya: { kayu: 60, batu: 20 }, kapasitas: null, footprint: 8, sprite: "/batu/paviliun-makan.png", deskripsi: "Paviliun kayu mewah megah tempat warga makan bersama dengan dapur periuk besar, kolam refleksi, dan gazebo bambu." },
  // RONDE 17 — kebun rempah: rantai masak berikutnya setelah paviliun
  // (makan bersama -> bahan masak sendiri). Petak tanah berpagar
  // patok kayu berisi rumpun rempah warna-warni; juru masak/peramu
  // memetiknya untuk masakan kampung. Murni bangunan variasi dulu
  // (tanpa kaitan kerja — kaitan fungsional menyusul ronde berikut).
  // Footprint 2x2, bukan hunian.
  { id: "kebun_rempah", label: "Kebun Rempah", biaya: { kayu: 15, batu: 5 }, kapasitas: null, footprint: 2, sprite: "/batu/kebun-rempah.png", deskripsi: "Petak rempah juru masak dan peramu — bahan masakan kampung tumbuh di sini." },
  { id: "sawah_luas", label: "Sawah Padi Luas", biaya: { kayu: 30, batu: 10 }, kapasitas: null, footprint: 4, sprite: "/batu/ladang.png", deskripsi: "Sawah padi terasering sangat luas dengan saluran irigasi bambu, pematang tanah liat, dan rumpun padi keemasan." },
  { id: "peternakan_luas", label: "Peternakan Luas", biaya: { kayu: 35, kulit: 15 }, kapasitas: null, footprint: 4, sprite: "/batu/pagar.png", deskripsi: "Peternakan berpagar kayu luas untuk hewan jinak kampung: kambing purba, babi ternak, dan unggas bernaung aman." },
  { id: "perkebunan_luas", label: "Perkebunan Luas", biaya: { kayu: 25, batu: 5 }, kapasitas: null, footprint: 4, sprite: "/batu/kebun-rempah.png", deskripsi: "Perkebunan buah dan rempah sangat luas dengan pepohonan buah lebat dan bedengan terawat." },
];

export function bangunanById(id: string): Bangunan | undefined {
  return BANGUNAN.find((b) => b.id === id);
}

// ── Papan kebutuhan kampung (2026-11-04, Ide 6 / DESAIN-EKONOMI langkah 2,
// irisan display-only) ────────────────────────────────────────────────
// Fungsi MURNI, display-only: membaca tangga progresi DESAIN-EKONOMI.md
// §2 dan mengembalikan SATU tingkat berikutnya yang syaratnya belum
// terpenuhi, beserta apa yang masih kurang. TIDAK mengunci apa pun:
// bangunan tetap bisa berdiri lewat sim seperti biasa; panel ini hanya
// memberi tahu pemain target berikutnya supaya progresi tidak terasa
// datar. Kunci tingkat yang sesungguhnya (menolak bangun sebelum syarat)
// tetap pekerjaan terpisah, bukan di sini.
// Syarat dibaca harfiah dari spesifikasi: tingkat 1 butuh "gubuk" (bukan
// tenda), tingkat 2 butuh lumbung + populasi 8, tingkat 3 butuh satu
// bengkel + populasi 12, tingkat 4 butuh balai + dapur umum, tingkat 5
// butuh penambang aktif + paviliun makan + populasi 20.
export interface KebutuhanKampung {
  selesai: boolean;
  tingkat: string;
  target: string;
  kurang: string[];
}

function labelBangunan(id: string): string {
  return bangunanById(id)?.label ?? id;
}

export function kebutuhanKampungBerikutnya(
  populasi: number,
  jenisBerdiri: string[],
  adaPenambang: boolean
): KebutuhanKampung {
  const pop = Number.isFinite(populasi) ? Math.max(0, Math.floor(populasi)) : 0;
  const ada = (id: string) => jenisBerdiri.includes(id);
  const kurangPop = (min: number) => (pop >= min ? [] : [`populasi ${min} (sekarang ${pop})`]);

  // Tingkat 1 — Kampung menetap.
  if (!ada("gubuk") || !ada("api_unggun")) {
    const kurang = [
      ...(!ada("gubuk") ? [`1 ${labelBangunan("gubuk")}`] : []),
      ...(!ada("api_unggun") ? [`1 ${labelBangunan("api_unggun")}`] : []),
    ];
    return { selesai: false, tingkat: "Kampung menetap", target: `${labelBangunan("lumbung")}, ${labelBangunan("ladang")}, ${labelBangunan("sumur_batu")}`, kurang };
  }
  // Tingkat 2 — Pertukangan.
  if (!ada("lumbung") || pop < 8) {
    return { selesai: false, tingkat: "Pertukangan", target: `${labelBangunan("bengkel_kayu")}, ${labelBangunan("bengkel_batu")}`, kurang: [...(!ada("lumbung") ? [`1 ${labelBangunan("lumbung")}`] : []), ...kurangPop(8)] };
  }
  // Tingkat 3 — Kampung besar.
  if (!ada("bengkel_kayu") && !ada("bengkel_batu")) {
    return { selesai: false, tingkat: "Kampung besar", target: `${labelBangunan("balai")}, ${labelBangunan("dapur_umum")}`, kurang: ["1 bengkel (kayu/batu)", ...kurangPop(12)] };
  }
  if (pop < 12) {
    return { selesai: false, tingkat: "Kampung besar", target: `${labelBangunan("balai")}, ${labelBangunan("dapur_umum")}`, kurang: kurangPop(12) };
  }
  // Tingkat 4 — Pangan skala besar.
  if (!ada("balai") || !ada("dapur_umum")) {
    const kurang = [
      ...(!ada("balai") ? [`1 ${labelBangunan("balai")}`] : []),
      ...(!ada("dapur_umum") ? [`1 ${labelBangunan("dapur_umum")}`] : []),
    ];
    return { selesai: false, tingkat: "Pangan skala besar", target: `${labelBangunan("paviliun_makan")}, ${labelBangunan("sawah_luas")}`, kurang };
  }
  // Tingkat 5 — Zaman besi & monumen (bangunan tingkat 5 masih proposal,
  // belum ada di katalog — panel menampilkannya sebagai rencana).
  if (!adaPenambang || !ada("paviliun_makan") || pop < 20) {
    const kurang = [
      ...(!adaPenambang ? ["penambang aktif"] : []),
      ...(!ada("paviliun_makan") ? [`1 ${labelBangunan("paviliun_makan")}`] : []),
      ...kurangPop(20),
    ];
    return { selesai: false, tingkat: "Zaman besi & monumen", target: "Bengkel Besi, Tugu Leluhur Agung (rencana)", kurang };
  }
  return { selesai: true, tingkat: "Zaman besi & monumen", target: "Tugu Leluhur Agung", kurang: [] };
}

// Satu aksi pertama "Mulai dari sini" (Ide 12, 2026-11-04) — turunan
// display-only dari kebutuhanKampungBerikutnya. ADAPTASI JUJUR dari
// spesifikasi awal: pemain di game ini adalah PENGAMAT (bangunan hanya
// diputuskan + diantrekan NPC lewat musyawarah, lihat page.tsx), jadi
// tidak ada tombol "bangun Gubuk" yang bisa ditunjuk. Yang bisa
// dilakukan pemain sungguhan hanya dua: (a) kalau populasi yang
// kurang, tambah warga lewat tombol ＋ di kanan-bawah layar (di luar
// kartu menu, jadi ketukan baris ini cukup menutup menu supaya tombol
// itu kelihatan); (b) kalau bukan populasi, buka Musyawarah — forum
// tempat arah kampung dan bangunan berikutnya diputuskan. Selesai
// (ujung tangga) -> null, baris disembunyikan. Populasi didahulukan
// karena itu satu-satunya kekurangan yang bisa diatasi pemain langsung.
// Kekurangan bangunan/penambang saja -> Musyawarah.
export interface AksiPertama {
  tombol: string;
  teks: string;
  aksi: "musyawarah" | "tambah";
}

export function aksiPertamaBerikutnya(kb: KebutuhanKampung): AksiPertama | null {
  if (kb.selesai) return null;
  const kurangPop = kb.kurang.find((k) => k.startsWith("populasi"));
  if (kurangPop) {
    return {
      tombol: "Tambah karakter",
      teks: `Tambah warga dulu — masih kurang ${kurangPop}. Tombolnya ＋ di kanan-bawah layar.`,
      aksi: "tambah",
    };
  }
  return {
    tombol: "Musyawarah",
    teks: "Arah kampung dan bangunan berikutnya diputuskan tetua kampung di forum ini.",
    aksi: "musyawarah",
  };
}

// Tonggak kampung (2026-11-05, Ide 29): rekam kemajuan kumulatif,
// display-only, TANPA hadiah ekonomi (dunia bersama — hadiah klaim
// bisa digandakan lintas perangkat, dan DESAIN-EKONOMI.md melarang
// pengali di luar cap). Fungsi MURNI dari data poll yang sudah ada
// (populasi + jenis bangunan berdiri): 7 tonggak dari tangga
// DESAIN-EKONOMI §2, diurutkan dari yang paling awal. `berikutnya`
// = tonggak pertama yang belum tercapai (pola "paling dekat" dari
// riset run ini: Saltwick + panduan Android — progres terlihat +
// satu target terdekat, bukan daftar terkunci yang panjang).
// Nama tonggak adalah peristiwa kampung, bukan angka mentah
// (Doomscroll: angka mentah membosankan, kait emosional yang
// membuatnya bermakna).
export interface Tonggak {
  id: string;
  nama: string;
  tercapai: boolean;
}

export interface TonggakKampung {
  daftar: Tonggak[];
  tercapai: number;
  total: number;
  berikutnya: string | null;
}

export function tonggakKampung(populasi: number, jenisBerdiri: string[]): TonggakKampung {
  const pop = Number.isFinite(populasi) ? Math.max(0, Math.floor(populasi)) : 0;
  const ada = (id: string) => jenisBerdiri.includes(id);
  const daftar: Tonggak[] = [
    { id: "api_pertama", nama: "Api pertama menyala", tercapai: ada("api_unggun") },
    { id: "gubuk_pertama", nama: "Gubuk pertama berdiri", tercapai: ada("gubuk") },
    { id: "lumbung", nama: "Lumbung berdiri", tercapai: ada("lumbung") },
    { id: "populasi_10", nama: "Populasi 10 warga", tercapai: pop >= 10 },
    { id: "bengkel_pertama", nama: "Bengkel pertama", tercapai: ada("bengkel_kayu") || ada("bengkel_batu") },
    { id: "balai", nama: "Balai berdiri", tercapai: ada("balai") },
    { id: "paviliun", nama: "Paviliun makan berdiri", tercapai: ada("paviliun_makan") },
  ];
  const tercapai = daftar.filter((t) => t.tercapai).length;
  const berikutnya = daftar.find((t) => !t.tercapai)?.nama ?? null;
  return { daftar, tercapai, total: daftar.length, berikutnya };
}

// ── "Selama kamu pergi" (2026-11-05, Ide 22 / riset kembali bermain)
// Fungsi MURNI, display-only: membandingkan cuplikan kampung dari
// kunjungan terakhir (localStorage, ditulis saat tab disembunyikan /
// ditutup / blok ditutup) dengan keadaan poll terbaru, lalu
// mengembalikan maksimal 3 baris ringkas — atau null bila tidak ada
// yang berubah. TANPA hadiah offline (dunia bersama jalan terus
// untuk semua orang) dan TANPA selisih stok mentah ("yang didapat"
// akan menyesatkan karena stok membusuk/ter-clamp). Yang dilaporkan:
// hari game yang berlalu, perubahan populasi, dan jenis bangunan
// SELESAI yang baru (placements /api/map memang hanya bangunan
// selesai, jadi "baru" di sini otomatis berarti selesai dibangun).
export interface CuplikanKampung {
  hari: number;
  populasi: number;
  bangunan: string[];
}

export function selamaKamuPergi(
  sebelum: CuplikanKampung | null | undefined,
  sekarang: CuplikanKampung
): string[] | null {
  if (!sebelum) return null;
  const hariLalu = Number.isFinite(sebelum.hari) ? Math.max(0, Math.floor(sebelum.hari)) : 0;
  const hariKini = Number.isFinite(sekarang.hari) ? Math.max(0, Math.floor(sekarang.hari)) : 0;
  if (hariKini <= hariLalu) return null;
  const baris: string[] = [`Hari ${hariLalu} → ${hariKini}`];
  const popLalu = Number.isFinite(sebelum.populasi) ? Math.max(0, Math.floor(sebelum.populasi)) : 0;
  const popKini = Number.isFinite(sekarang.populasi) ? Math.max(0, Math.floor(sekarang.populasi)) : 0;
  if (popKini !== popLalu) baris.push(`Penduduk ${popLalu} → ${popKini}`);
  const dulu = new Set((sebelum.bangunan ?? []).map(String));
  const baru = [...new Set((sekarang.bangunan ?? []).map(String))].filter((k) => !dulu.has(k));
  if (baru.length > 0) {
    const nama = baru.map((k) => labelBangunan(k));
    const tampil = nama.slice(0, 2);
    const sisa = nama.length - tampil.length;
    baris.push(`Bangunan selesai: ${tampil.join(", ")}${sisa > 0 ? ` dan ${sisa} lagi` : ""}`);
  }
  return baris.slice(0, 3);
}

// Kronik kampung (2026-11-05, Ide 23 / riset fitur baru run ini): satu
// baris "cerita hari ini" di kartu menu — pola kronik satu baris Plai:
// Village Tale (ticker lakonis yang bereaksi pada keadaan game).
// Fungsi MURNI, display-only, deterministik (input sama -> baris sama):
// aturan prioritas sederhana, BUKAN LLM, dan setiap kalimat berasal
// dari data poll yang sudah ada — tidak ada karangan. Prioritas:
// (1) pangan habis/menipis, (2) bangunan sedang dibangun, (3) warga
// tanpa tugas, (4) ada stok yang penuh, (5) tonggak berikutnya,
// (6) keadaan hari ini (hari + populasi + fase + cuaca). Tanpa ubah
// sim, tanpa fetch baru.
export interface BangunanDibangun {
  label: string;
  progres: number; // 0..100
}

export interface KeadaanKampung {
  hari: number;
  populasi: number;
  kampung: string;
  fase: string; // label fase, mis. "Pagi"
  cuaca: string; // label cuaca, mis. "Cerah"
  stok: Partial<Record<ResourceId, number>>;
  kapasitas: Partial<Record<ResourceId, number>>;
  dibangun: BangunanDibangun[];
  tanpaTugas: number;
  tonggakBerikutnya: string | null;
}

export function kronikKampung(k: KeadaanKampung): string {
  const hari = Number.isFinite(k.hari) ? Math.max(1, Math.floor(k.hari)) : 1;
  const pop = Number.isFinite(k.populasi) ? Math.max(0, Math.floor(k.populasi)) : 0;
  const kampung = (k.kampung ?? "").trim() || "kampung ini";
  const fase = (k.fase ?? "").trim().toLowerCase();
  const cuaca = (k.cuaca ?? "").trim().toLowerCase();
  const stok = k.stok ?? {};
  const kap = k.kapasitas ?? {};
  const pangan = Number(stok.pangan ?? 0);
  const kapPangan = Number(kap.pangan ?? 0);
  // (1) Pangan habis / menipis — paling mendesak, mengalahkan yang lain.
  if (pangan <= 0) return "Pangan habis — warga menahan lapar, pengumpul dan pemburu sedang bekerja keras.";
  if (kapPangan > 0 && pangan <= kapPangan * 0.25) return `Pangan menipis (${pangan}/${kapPangan}) — ladang dan hutan jadi tumpuan hari ini.`;
  // (2) Bangunan sedang dibangun (progres terbesar dulu).
  const dibangun = (k.dibangun ?? []).filter((b) => b && String(b.label ?? "").trim() !== "");
  if (dibangun.length > 0) {
    const b = [...dibangun].sort((a, b2) => (Number(b2.progres ?? 0) - Number(a.progres ?? 0)))[0];
    const prog = Number.isFinite(b.progres) ? Math.max(0, Math.min(100, Math.round(b.progres))) : 0;
    return `${b.label} sedang dibangun (${prog}%) — palu berdentang di ${kampung}.`;
  }
  // (3) Warga tanpa tugas.
  const tanpa = Number.isFinite(k.tanpaTugas) ? Math.max(0, Math.floor(k.tanpaTugas)) : 0;
  if (tanpa > 0) return `${tanpa} warga tanpa tugas — mereka membantu tetangga sambil menunggu kerja.`;
  // (4) Ada stok yang penuh (urutan katalog RESOURCES).
  for (const r of RESOURCES) {
    const isi = Number(stok[r.id] ?? 0);
    const maks = Number(kap[r.id] ?? 0);
    if (maks > 0 && isi >= maks) return `${r.label} penuh (${isi}/${maks}) — lumbung tidak muat lagi, waktunya membangun.`;
  }
  // (5) Tonggak berikutnya.
  const berikut = (k.tonggakBerikutnya ?? "").trim();
  if (berikut) return `Selangkah lagi: ${berikut}.`;
  // (6) Keadaan hari ini — selalu ada baris, tidak pernah kosong.
  const suasana = [fase, cuaca].filter(Boolean).join(" ");
  return suasana
    ? `Hari ${hari} di ${kampung} — ${pop} warga, ${suasana}.`
    : `Hari ${hari} di ${kampung} — ${pop} warga menjalani harinya.`;
}

// Kekurangan stok untuk satu biaya: {resource: jumlah_kurang}.
export function kurangDariBiaya(stok: Partial<Record<ResourceId, number>>, biaya: Partial<Record<ResourceId, number>>): Partial<Record<ResourceId, number>> {
  const kurang: Partial<Record<ResourceId, number>> = {};
  for (const [k, v] of Object.entries(biaya)) {
    const punya = stok[k as ResourceId] ?? 0;
    if (punya < (v ?? 0)) kurang[k as ResourceId] = (v ?? 0) - punya;
  }
  return kurang;
}

export function cukupBiaya(stok: Partial<Record<ResourceId, number>>, biaya: Partial<Record<ResourceId, number>>): boolean {
  return Object.keys(kurangDariBiaya(stok, biaya)).length === 0;
}

// Kapasitas Dasar Penyimpanan Desa (Tanpa Lumbung)
export const KAPASITAS_DASAR_KAMPUNG: Record<ResourceId, number> = {
  kayu: 40,
  batu: 30,
  pangan: 50,
  kulit: 25,
  emas: 10,
  besi: 15,
};

// Bonus Kapasitas Lumbung per Level (Level 1 - 3)
export const BONUS_KAPASITAS_LUMBUNG: Record<number, Record<ResourceId, number>> = {
  1: { kayu: 120, batu: 100, pangan: 150, kulit: 70, emas: 30, besi: 40 },
  2: { kayu: 300, batu: 250, pangan: 350, kulit: 180, emas: 80, besi: 100 },
  3: { kayu: 700, batu: 600, pangan: 800, kulit: 400, emas: 200, besi: 250 },
};

// Hitung total kapasitas penyimpanan desa berdasarkan semua lumbung & levelnya
export function hitungKapasitasStok(placements: { kind: string; level?: number }[]): Record<ResourceId, number> {
  const cap: Record<ResourceId, number> = { ...KAPASITAS_DASAR_KAMPUNG };
  for (const p of placements) {
    if (p.kind === "lumbung") {
      const lvl = Math.min(3, Math.max(1, Number(p.level ?? 1)));
      const bonus = BONUS_KAPASITAS_LUMBUNG[lvl] ?? BONUS_KAPASITAS_LUMBUNG[1];
      for (const [k, v] of Object.entries(bonus)) {
        cap[k as ResourceId] = (cap[k as ResourceId] ?? 0) + v;
      }
    }
  }
  return cap;
}

// Biaya upgrade bangunan ke level berikutnya (Level 1 -> 2: 1.5x, Level 2 -> 3: 2.5x)
export function biayaUpgradeBangunan(def: Bangunan, currentLevel: number): Partial<Record<ResourceId, number>> {
  const pengali = currentLevel === 1 ? 1.5 : currentLevel === 2 ? 2.5 : 0;
  if (pengali === 0) return {};
  const upgradeBiaya: Partial<Record<ResourceId, number>> = {};
  for (const [k, v] of Object.entries(def.biaya)) {
    if (typeof v === "number") {
      upgradeBiaya[k as ResourceId] = Math.ceil(v * pengali);
    }
  }
  return upgradeBiaya;
}

// Hitung refund 80% bahan saat bangunan dibongkar
export function refundBongkarBangunan(def: Bangunan, currentLevel = 1): Partial<Record<ResourceId, number>> {
  const totalBiaya: Partial<Record<ResourceId, number>> = { ...def.biaya };
  if (currentLevel >= 2) {
    const upg2 = biayaUpgradeBangunan(def, 1);
    for (const [k, v] of Object.entries(upg2)) totalBiaya[k as ResourceId] = (totalBiaya[k as ResourceId] ?? 0) + (v ?? 0);
  }
  if (currentLevel >= 3) {
    const upg3 = biayaUpgradeBangunan(def, 2);
    for (const [k, v] of Object.entries(upg3)) totalBiaya[k as ResourceId] = (totalBiaya[k as ResourceId] ?? 0) + (v ?? 0);
  }
  const refund: Partial<Record<ResourceId, number>> = {};
  for (const [k, v] of Object.entries(totalBiaya)) {
    if (typeof v === "number" && v > 0) {
      refund[k as ResourceId] = Math.floor(v * 0.8);
    }
  }
  return refund;
}
