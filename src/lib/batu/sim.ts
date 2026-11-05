// Simulasi kampung zaman batu: kerja KELIHATAN, otoritatif server.
// Satuan sim = JAM GAME (jam v3: 1 jam game = 1 menit nyata; 1 hari game =
// 24 menit nyata). Satu langkah sim = 1 jam game. Angka-angka laju
// dipertahankan dari era per-hari (kumpul 25-70%, kebutuhan
// +-4-6, konstruksi 10+3%/langkah) — karena 1 jam baru = 1 menit nyata =
// 1 hari lama, maka ritme NYATA tetap sama (siklus kerja ≈ 1 hari game ≈
// 24 menit nyata), sementara kalender game kini 24x lebih lambat.
// PENGECUALIAN (ronde 5): jalan DILIPAT 5x — 3-6 tile/jam terlalu lambat
// untuk terlihat (0,05-0,1 tile/detik = merayap sub-pixel + display
// burst-diam tiap menit). Jalan kini 15-30 tile/jam (0,25-0,5 tile/detik):
// perjalanan 30 tile ≈ 1-2 menit nyata, gerakan kontinyu terlihat di
// zoom normal. Drain stamina tetap per JAM jalan (-3/jam), bukan per tile
// — jadi perjalanan lebih cepat = stamina lebih hemat per perjalanan,
// bukan sebaliknya. Hewan + kejar pemburu ikut dilipat 5x agar rasio
// predator/mangsa tidak berubah.
// Siklus warga per hari game: jalan ke node -> kumpul (progres) -> bawa hasil
// ke kampung -> istirahat DI HUNIAN -> ulang. Hasil hanya datang dari siklus
// yang terlihat — tidak ada lagi "gaji jalan tanpa aksi".
// - STA (stamina): terkuras saat kerja/jalan/renang/bertarung, pulih saat
//   istirahat/makan. Warga lama tanpa STA dimigrasi aman (default 5).
// - Kebutuhan: lapar naik tiap jam; lapar >= 90 -> pulang makan; makan
//   memakai 1 pangan dari stok. Sehat turun bila kelaparan, pulih saat
//   istirahat + ramuan tabib/peramu. Sehat TIDAK membunuh (kematian = batch
//   terpisah, bukan di rilis ini) — warga sakit berat hanya beristirahat.
// - ISTIRAHAT SELALU DI HUNIAN: stamina kritis tidak lagi membekukan warga
//   di tengah peta — warga pulang dulu, baru istirahat di hunian. Warga
//   lama yang terlanjur istirahat di tengah peta diarahkan pulang.
// - TIDUR KOMUNAL (ronde 3): hunian ditetapkan DINAMIS tiap jam (bukan statis
//   saat dibuat) — warga tanpa hunian mendapat tempat begitu ada gubuk
//   kosong, dan warga tanpa tempat tidur TIDAK tidur sendirian di api unggun:
//   mereka tidur di ubin TAMU di sekeliling gubuk terdekat (bersama kelompok),
//   lalu pindah ke tempat tidur begitu gubuk baru selesai. Tiap penghuni
//   tidur di ubin BERBEDA dalam footprint gubuk (bukan menumpuk di tengah).
//   Penjaga api tidur di gubuk seperti warga lain — api tetap menyala lewat
//   placement (visual), tanpa penjaga permanen di luar semalaman.
// - ANTI-PACEKLIK (ronde 4): loop lapar lama (lapar>=90 -> pulang makan ->
//   istirahat -> bangun -> jalan -> lapar>=90 lagi) membuat warga TIDAK
//   PERNAH menyelesaikan kumpul saat pangan=0 (preemption membatalkan
//   progres tiap jam) — pangan macet 0, lapar macet 100, sehat macet 10.
//   Perbaikan: (1) pulang-makan HANYA bila pangan>0 (ada yang dimakan di
//   rumah) dan HANYA dari fase jalan (kumpul yang sedang berjalan
//   diselesaikan dulu); (2) bila pangan=0, warga lapar (>=90) beralih ke
//   PRODUKSI PANGAN DARURAT (kumpul semak/padang terdekat, di luar peran,
//   fit 0.7) — jangan tidur melewati paceklik; (3) kerusakan lapar
//   -10/jam -> -3/jam (sebelumnya mengalahkan pemulihan istirahat +1/jam
//   sehingga sehat terkunci di 10); (4) NPC memprioritaskan LUMBUNG saat
//   paceklik/lapar (bukan gate pop>=8); (5) darurat kapasitas hunian
//   memaksa pilihan gubuk (LLM tidak boleh mengalihkan ke bangunan lain).
// - Node: tiap kumpul mengurangi sisa node (default 5); node habis -> warga
//   cari node baru + node HILANG dari peta; node tumbuh lagi (regrow)
//   30-60 JAM game kemudian (30-60 menit nyata). Jadwal regrow DISIMPAN di
//   DB (dunia.node_regrow) — tidak lagi hilang antar request; node yang
//   terlanjur habis tanpa jadwal (bug lama) dijadwalkan ulang.
// - Crafting: warga baru mulai dengan perkakas kasar level 0; saat istirahat,
//   bila stok cukup, mereka membuat perkakas bagus level 1 (+25% laju kumpul).
//   Pemburu juga membuat busur (bonus berburu).
// - Hewan: koleksi `hewan` (server). Jinak kabur, buas menyerang, pemburu
//   memburu -> pangan + kulit. Hewan diburu DIHAPUS dari koleksi (despawn).
//   Hewan respawn OTOMATIS bila populasi < 25 (peluang 30%/jam; 50% bila
//   < 12) — kembali ke ~25 ekor.
// - Interaksi: warga berdekatan bisa debat (INT menang) atau gelud (STR/AGI/
//   STA menang; kalah kabur + istirahat). Dipicu sim, bukan pemain. Bubble
//   tampil 4 jam game (≈ 4 menit nyata).
// - Bangunan: HANYA NPC yang memutuskan (kepala suku/musyawarah). Plot
//   ditetapkan saat konstruksi MULAI (bukan saat selesai) supaya animasi
//   konstruksi bertahap bisa dirender. Selesai -> placement (idempotent).
//   Progres konstruksi per jam game (bangunan jadi ≈ 8 jam game).
// - Renang: warga BOLEH masuk air (lebih lambat: 1 langkah air = 2 speed,
//   stamina ekstra terkuras). Jembatan = jalan darat (tanpa renang).
// - Malam/cuaca: kumpul x0.85 HANYA pada jam malam (penjaga api tidak kena);
//   cuaca per hari game: cerah 1, berawan 0.9, hujan 0.7, petir 0.5.
// - Persistensi: catch-up epoch hingga 5000 JAM/request (~3,5 hari nyata
//   kosong); lebih dari itu sim_jam dilompati (waktu tetap dihitung).
// - Hook LLM: keputusan bangunan boleh konsultasi Gemini (throttle 24 jam
//   game, fallback scripted). Selama format GEMINI_API_KEYS salah, hook
//   selalu null -> yang berjalan fallback scripted (dilaporkan jujur).
import { getCollection, pastikanIndexPlacement } from "../db";
import { gameTime, cuacaGame, migrasiJam, migrasiJamV4 } from "../clock";
import { faseDariJam, seededRandom } from "../world";
import { peranById, labelNode, nodeHasil, pengaliFit, perkakasPeran, LABEL_ALAT, RESEP_PERKAKAS, type NodeKind, type PeranId } from "./peran";
import { stokKosong, bangunanById, cukupBiaya, kurangDariBiaya, hitungKapasitasStok, type Stok } from "./sumberdaya";
import { generateNodes, isWater, riverX, findPlot, findHousePlotBesideRoad, findBridgePlot, findBoatSpot, rotasiKeJalan, PLACEMENT_AWAL, PUSAT, GRID_MIN, GRID_MAX, isGunung, gunungTileKeys, dedupePlacement, ukuranPetak, petakBangunan, occupiedDariPlacements, plotBebas, type Node } from "./dunia";
import { pintarUntukJalan, rencanaJalan } from "./jalan";
import { hewanById, HEWAN_AWAL, type HewanDef } from "./hewan";
import { debatBaris, geludBaris, ngobrolBaris } from "./dialog";
import { statDenganSTA } from "./gacha";
import { pengaliKumpulBakat, bonusJumlahBakat, pengaliJalanBakat, pulihStaminaBakat } from "./bakat";
import { keputusanNPC } from "./llm";

export interface DuniaDoc {
  _id: string;
  epoch_ms: number;
  stok: Stok;
  sim_hari: number; // hari game terakhir yang sudah disimulasikan (turunan)
  sim_jam: number; // jam game terakhir yang sudah disimulasikan (otoritatif)
  node_sisa?: Record<string, number>;
  node_regrow?: Record<string, number>; // "gx,gy" -> jam game kapan tumbuh lagi (warisan; ronde 10 dikonversi ke spawn tertunda)
  // RONDE 9: migrasi jam v4 (fast-forward malam) sudah diterapkan?
  jam_v4?: boolean;
  // RONDE 10: node hasil respawn (aktif, di lokasi BARU) + spawn tertunda
  // (node habis -> hilang, lalu muncul di lokasi lain pada jam jadwal).
  node_spawn?: { kind: NodeKind; gx: number; gy: number }[];
  node_spawn_tertunda?: Record<string, { kind: NodeKind; gx: number; gy: number; jam: number }>;
  last_llm_jam?: number;
  // RONDE 20 — stok ikan sungai (tidak ada di dunia lama = penuh).
  ikan_sungai?: number;
}

export interface Perkakas {
  jenis: string;
  level: number;
  // RONDE 14 — damage senjata (hanya tombak iblis Figo yang punya:
  // 999). Dijumlah ke skor gelud + duel hewan buas; perkakas biasa 0.
  damage?: number;
}

export interface Interaksi {
  jenis: "debat" | "gelud" | "diserang" | "ngobrol";
  dengan: string;
  hasil?: "menang" | "kalah" | "imbang";
  teks: string;
  sampai_jam: number; // RONDE 13: jendela bubble event-only ~1 jam game
  // (dibuat + 1). Display memotong jendela lama (+4 jam) lewat guard
  // bubbleInteraksiAktif — layar mayoritas waktu bersih dari bubble.
}

export interface Warga {
  _id: unknown;
  nama: string;
  nomor: string;
  gender: string;
  umur: number;
  lahir_hari: number;
  tahap_hidup: string;
  peran: PeranId;
  stat: { int: number; str: number; agi: number; sta: number };
  bakat: string;
  sifat: string;
  // RONDE 14 — bio karakter (tampil di KartuProfil bila ada). Figo:
  // "Pura-pura kepala suku padahal sebenarnya raja iblis😈😈".
  bio?: string;
  // ATURAN KUMPUL HARIAN (2026-11-03, DESAIN-EKONOMI.md): tally hasil
  // per hari game, dipakai cap harian (3 biasa / 2 langka).
  kumpul_hari?: number;
  kumpul_harian?: Partial<Record<string, number>>;
  lokasi: { gx: number; gy: number };
  tujuan: { gx: number; gy: number } | null;
  // Target kerja. `pseudo` = target BUKAN node biasa (tidak mengalami
  // deplesi, tidak memicu kabar "node habis"): "sungai" (nelayan memancing
  // dari tepi sungai), "ladang" (petani di placement ladang), "patroli"
  // (penjaga keliling kampung, tanpa kumpul), "santai" (RONDE 13: jalan
  // santai / membantu warga lain saat idle — tanpa kumpul, tanpa hasil
  // ekonomi; `bantu` = nama warga yang dibantu bila ada). `kind` untuk
  // pseudo hanya kendaraan resource (semak_beri/padang = pangan) —
  // kebenaran ada di pseudo.
  // `darurat` = kumpul pangan darurat saat paceklik (di luar peran).
  node: { kind: NodeKind; gx: number; gy: number; pseudo?: "sungai" | "ladang" | "patroli" | "restoran" | "santai" | "jalan"; darurat?: boolean; bantu?: string; segmen?: string } | null;
  aksi_sekarang: string;
  status_teks: string;
  tempat_kerja: string;
  progres_aksi_pct: number;
  fase_siklus: "jalan" | "kumpul" | "kembali" | "istirahat" | "makan" | "berobat";
  istirahat_sisa: number;
  hunian: { id: string; tipe: string; label: string } | null;
  profil_id: unknown;
  dibuat_pada: Date;
  sim_hari: number;
  stamina: number;
  lapar: number;
  sehat: number;
  perkakas: Perkakas[];
  interaksi: Interaksi | null;
  // Cooldown debat/gelud per pasangan: wargaId -> jam game sampai kapan
  // pasangan itu tidak boleh memicu interaksi lagi (anti dialog stuck).
  interaksiCooldown?: Record<string, number>;
  target_hewan: string | null;
  sedang_berenang: boolean;
  // RONDE 10 — sekuens berburu: daging tergeletak yang sedang diambil
  // (id dokumen koleksi "daging") + daging yang sedang dibawa pulang.
  daging_target?: { id: string; gx: number; gy: number; jenis: string; pangan: number; kulit: number } | null;
  membawa_daging?: { jenis: string; pangan: number; kulit: number } | null;
}

// Daging tergeletak di peta (RONDE 10): hasil buruan yang BELUM diambil.
// Stok pangan/kulit baru bertambah saat daging TIBA di kampung (bukan
// saat hewan jatuh) — berburu jadi sekuens, bukan instan.
export interface DagingDoc {
  _id: string;
  jenis: string;
  gx: number;
  gy: number;
  pangan: number;
  kulit: number;
  dibuat_jam: number;
}

export interface HewanDoc {
  _id: unknown;
  jenis: string;
  gx: number;
  gy: number;
  // RONDE 15 — HP saat ini (undefined pada hewan lama = HP penuh,
  // di-resolve lewat hewanById di sim + serialisasi route).
  hp?: number;
}

export async function getDuniaDoc(): Promise<DuniaDoc> {
  // ANTI-DUPLIKAT (2026-11-03): pastikan indeks unik posisi sekali
  // per proses server (best-effort; gagal = masih ada ganda lama,
  // permainan tetap jalan dengan penjaga level kode).
  await pastikanIndexPlacement();
  const col = await getCollection<DuniaDoc>("dunia");
  const doc = await col.findOne({ _id: "utama" });
  if (doc) {
    if (!doc.stok) doc.stok = stokKosong();
    return doc;
  }
  const baru: DuniaDoc = { _id: "utama", epoch_ms: Date.now(), stok: stokKosong(), sim_hari: 0, sim_jam: 0 };
  // ANTI-DUPLIKAT (2026-11-03): seed idempotent — proses bersamaan
  // tidak lagi menumpuk dunia/placement awal (upsert, bukan insert).
  await col.updateOne({ _id: "utama" }, { $setOnInsert: baru }, { upsert: true });
  const tiles = await getCollection("peta_tile");
  for (const p of PLACEMENT_AWAL) {
    await tiles.updateOne({ gx: p.gx, gy: p.gy }, { $setOnInsert: { ...p } }, { upsert: true });
  }
  const kabar = await getCollection("kabar");
  await kabar.insertOne({
    jenis: "kampung",
    teks: "Kampung Suka Maju berdiri di tepi sungai. Api pertama menyala.",
    hari: 0,
    dibuat_pada: new Date(),
  });
  return baru;
}

export async function currentGameDay(): Promise<number> {
  const dunia = await getDuniaDoc();
  return gameTime(dunia.epoch_ms, Date.now()).day;
}

export function kecepatanJalan(agi: number, sta?: number, bakat?: string | null): number {
  // RONDE 6 — jalan seperti ORANG JALAN (bukan merayap, bukan lari):
  // 90..150 tile/jam game = 1,5..2,5 tile/detik tampil (1 jam game =
  // 60 detik nyata). Ronde 5 (15..30 = 0,25..0,5/detik ≈ 5 px/detik di
  // zoom normal HP) masih merayap: target user = menyeberangi gubuk
  // (2 tile) dalam ~1 detik, menyeberangi layar dalam ~15–25 detik.
  // Struktur AGI/STA dipertahankan; lelah (STA<30) memperlambat.
  // RONDE 9: bakat AGI (Si Gesit) +10% (pengaliJalanBakat); display
  // memakai kecepatan yang sama dibagi durasi jam (siang 60 detik,
  // malam 6 detik) — jadi laju tampil siang tetap 1,5–2,5 tile/detik
  // (AGI 1,65–2,75 untuk Si Gesit, masih wajar) dan malam 10x lipat.
  let v = Math.min(150, 90 + 15 * Math.floor(agi / 3)); // 90..150 tile/jam game
  if (typeof sta === "number" && sta < 30) v = Math.max(75, v - 15);
  return Math.round(v * pengaliJalanBakat(bakat));
}

export function lajuKumpul(statFokus: number): number {
  // r38 — DIKEMBALIKAN ke kontrak tes + DESAIN-EKONOMI.md (laporan
  // user 2026-11-05: "gada yg ngumpulin buah"): versi 0.25 +
  // 0.05*stat membuat satu ronde kumpul butuh ~150-300 jam game
  // (5-12 hari) — warga berjalan ke semak lalu diam berhari-hari
  // tanpa hasil, pangan kampung 0. Rumus 20 + 5*stat (stat 8 ->
  // 60%/jam) menyelesaikan satu ronde dalam ~2 jam, sesuai cap
  // harian 1-3/hari/orang di DESAIN-EKONOMI.md (jumlah hasil tetap
  // dibatasi roll + cap harian, bukan laju ini).
  return 20 + statFokus * 5;
}

// Periksa apakah stok penyimpanan lumbung desa sudah penuh untuk hasil peran warga ini
export function apakahStokPeranPenuh(w: Warga, ctx: SimCtx): boolean {
  const cap = ctx.kapasitasMaks ?? { kayu: 200, batu: 150, pangan: 200, kulit: 100, emas: 50, besi: 60 };
  
  // Jika seluruh gudang / lumbung desa penuh untuk semua komoditas utama
  const semuaPenuh =
    (ctx.stok.kayu ?? 0) >= (cap.kayu ?? 200) &&
    (ctx.stok.batu ?? 0) >= (cap.batu ?? 150) &&
    (ctx.stok.pangan ?? 0) >= (cap.pangan ?? 200) &&
    (ctx.stok.kulit ?? 0) >= (cap.kulit ?? 100);
  if (semuaPenuh) return true;

  if (w.peran === "penebang" && (ctx.stok.kayu ?? 0) >= (cap.kayu ?? 200)) return true;
  if (w.peran === "penambang" && (ctx.stok.batu ?? 0) >= (cap.batu ?? 150) && (ctx.stok.besi ?? 0) >= (cap.besi ?? 60) && (ctx.stok.emas ?? 0) >= (cap.emas ?? 50)) return true;
  if (["pengumpul", "peramu", "nelayan", "pemancing", "petani"].includes(w.peran) && (ctx.stok.pangan ?? 0) >= (cap.pangan ?? 200)) return true;
  if (w.peran === "pemburu" && (ctx.stok.pangan ?? 0) >= (cap.pangan ?? 200) && (ctx.stok.kulit ?? 0) >= (cap.kulit ?? 100)) return true;
  if (w.peran === "penjaga_api" && (ctx.stok.kayu ?? 0) >= (cap.kayu ?? 200)) return true;

  return false;
}

// Alihkan warga yang stok perannya sudah penuh untuk rehat santai di kampung
export function terapkanRehatStokPenuh(w: Warga, ctx: SimCtx): boolean {
  if (!apakahStokPeranPenuh(w, ctx)) return false;
  // ATURAN BARU (2026-11-03): stok penuh BUKAN berarti diam saja.
  // Alihan dulu supaya kampung tetap hidup: bantu warga lain
  // (khusus pemegang tombak), atau jalan santai; rehat murni hanya
  // jalan terakhir bila tidak ada alihan yang layak.
  if (terapkanBantu(w, ctx)) return true;
  if (mulaiSantai(w, ctx)) return true;
  w.node = null;
  w.tujuan = ctx.hunianTitik(w);
  w.fase_siklus = "istirahat";
  w.aksi_sekarang = "rehat_stok_penuh";
  w.status_teks = "Lumbung penuh! Rehat santai di perapian/kampung.";
  w.tempat_kerja = "kampung";
  w.istirahat_sisa = 2;
  w.progres_aksi_pct = 0;
  return true;
}

export function jumlahKumpul(statFokus: number): number {
  // 1 bahan baku per ekspedisi kumpul (LEGACY: dipertahankan untuk
  // kompatibilitas; pengiriman hasil kini memakai rollHasilKumpul
  // + cap harian di bawah).
  return 1;
}

// ATURAN KUMPUL HARIAN (spesifikasi user 2026-11-03, DESAIN-EKONOMI.md,
// DIAMENDEMEN 2026-11-04 atas perintah user "sangat susah, mengikuti
// dunia nyata": hasil boleh NOL untuk semua sumber — di dunia nyata
// meramu, menebang, dan menambang sering pulang dengan tangan kosong.
// Cap harian TETAP: 3 biasa, 2 langka. Pengali lama (STR, perkakas,
// bakat) TIDAK lagi menambah jumlah — keunggulan hanya menggeser
// peluang di dalam cap, supaya stok tidak meluber.
// DIAMENDEMEN LAGI 2026-11-04 atas perintah user "sehari 1 orang bisa
// dpt minimal 1 maksimal 3": NOL DIHAPUS untuk sumber BIASA saja —
// roll biasa kini 1/2/3 (bobot 64/27/9 = renormalisasi 35:15:5 r23,
// rata-rata ~1,45); cap harian tetap 3. Besi/emas TIDAK berubah
// (tetap boleh nol, cap 2) — kelangkaannya desain terpisah yang
// tidak dicabut perintah ini.
export const CAP_KUMPUL_HARIAN_BIASA = 3;
export const CAP_KUMPUL_HARIAN_LANGKA = 2;

// RONDE 20 — gampangin pangan SEDIKIT (laporan user 2026-11-05:
// "pangan masih 0 terus", terbukti simulasi 10 hari: produksi
// dimakan secepat muncul, lapar rata-rata ~90 = paceklik kronis).
// Roll biasa 1/2/3 = 64/27/9% (rata-rata 1,45) -> 50/30/20%
// (rata-rata 1,7) — PERSIS angka DESAIN-EKONOMI.md, cap 3/hari/orang
// TIDAK berubah, besi/emas tidak berubah.
export function peluangKumpul(resource: string, berbakat: boolean): number[] {
  if (resource === "besi") return berbakat ? [0.7, 0.25, 0.05] : [0.8, 0.17, 0.03];
  if (resource === "emas") return [0.75, 0.2, 0.05];
  return [0, 0.5, 0.3, 0.2];
}

export function rollHasilKumpul(resource: string, w: Warga): number {
  const berbakat =
    bonusJumlahBakat(w.bakat) > 0 || levelPerkakas(w, perkakasPeran(w.peran)) >= 1;
  const p = peluangKumpul(resource, berbakat);
  const r = Math.random();
  let hasil = p.length - 1;
  let akum = 0;
  for (let i = 0; i < p.length; i++) {
    akum += p[i];
    if (r < akum) {
      hasil = i;
      break;
    }
  }
  // Keunggulan hanya menggeser peluang di dalam cap (sumber biasa saja;
  // besi/emas sudah punya jalurnya sendiri lewat peluangKumpul).
  if (resource !== "besi" && resource !== "emas" && berbakat && hasil < 3 && Math.random() < 0.5) hasil += 1;
  return hasil;
}

// PEMBUSUKAN (2026-11-04, permintaan user: kelangkaan realistis).
// Stok di ATAS kapasitas gudang tidak terlindungi: pangan membusuk
// cepat (50% dari kelebihan per hari game), kayu/batu/kulit melapuk
// pelan (10%/hari), emas/besi awet (0%). Yang muat di dalam kapasitas
// aman. Mengembalikan jumlah yang busuk per sumber. Tanpa ini, gunung
// stok warisan (ratusan ribu) tidak akan pernah habis dimakan warga.
const LAJU_BUSUK: Record<string, number> = {
  pangan: 0.5,
  kayu: 0.1,
  batu: 0.1,
  kulit: 0.1,
  emas: 0,
  besi: 0,
};

export function terapkanPembusukan(ctx: SimCtx): Record<string, number> {
  const cap = (ctx.kapasitasMaks ?? {}) as Record<string, number>;
  const stok = ctx.stok as unknown as Record<string, number>;
  const busuk: Record<string, number> = {};
  for (const [res, laju] of Object.entries(LAJU_BUSUK)) {
    if (!laju) continue;
    const current = stok[res] ?? 0;
    const limit = cap[res] ?? current;
    if (current > limit) {
      // Pembulatan ke bawah saja membuat sisa kecil macet selamanya:
      // kelebihan 9 kulit x 10% = 0,9 -> floor 0, jadi stok 104/95
      // tidak pernah susut (temuan live r34). Selama ada kelebihan,
      // minimal 1 busuk per hari supaya stok SELALU konvergen ke kap
      // (persentase untuk kelebihan besar tidak berubah).
      const hilang = Math.max(1, Math.floor((current - limit) * laju));
      if (hilang > 0) {
        stok[res] = current - hilang;
        busuk[res] = hilang;
      }
    }
  }
  return busuk;
}

export function capHarianUntuk(resource: string): number {
  return resource === "besi" || resource === "emas"
    ? CAP_KUMPUL_HARIAN_LANGKA
    : CAP_KUMPUL_HARIAN_BIASA;
}

export function sisaCapHarian(w: Warga, resource: string, hari: number): number {
  if (w.kumpul_hari !== hari) return capHarianUntuk(resource);
  const sudah = w.kumpul_harian?.[resource] ?? 0;
  return Math.max(0, capHarianUntuk(resource) - sudah);
}

export function catatKumpulHarian(w: Warga, resource: string, jumlah: number, hari: number): void {
  if (w.kumpul_hari !== hari) {
    w.kumpul_hari = hari;
    w.kumpul_harian = {};
  }
  const h = w.kumpul_harian ?? (w.kumpul_harian = {});
  h[resource] = (h[resource] ?? 0) + jumlah;
}

// Tambah stok dengan clamp kapasitas gudang — SATU-SATUNYA jalur
// penambah stok yang boleh dipakai (node, buruan, bonus pemanjat).
// Mengembalikan jumlah yang benar-benar masuk.
export function tambahStokClamp(ctx: SimCtx, resource: string, jumlah: number): number {
  const cap = (ctx.kapasitasMaks ?? {
    kayu: 200, batu: 150, pangan: 200, kulit: 100, emas: 50, besi: 60,
  }) as Record<string, number>;
  const stok = ctx.stok as unknown as Record<string, number>;
  const current = stok[resource] ?? 0;
  const limit = cap[resource] ?? 200;
  const tambah = Math.min(jumlah, Math.max(0, limit - current));
  stok[resource] = current + tambah;
  return tambah;
}

// RONDE 14 — TOMBAK IBLIS FIGO (raja iblis, perintah user 00:23):
// Figo memegang tombak iblis merah (perkakas jenis "tombak_iblis",
// damage 999) di samping tongkat_suku-nya (tongkat dipertahankan supaya
// crafting peran kepala_suku tetap jalan; spear hanya menggantikan
// tongkat secara VISUAL di client). Marker ini dipakai: render spear
// (Map3D), skor gelud/duel, dan perilaku membantu.
export function punyaTombakIblis(w: Warga): boolean {
  return (w.perkakas ?? []).some((p) => p.jenis === "tombak_iblis");
}

// Jumlah damage semua senjata warga (perkakas biasa 0).
export function damageSenjata(w: Warga): number {
  return (w.perkakas ?? []).reduce((s, p) => s + (p.damage ?? 0), 0);
}

// r38 — PERBURUAN YANG BENAR-BENAR BISA MENANGKAP MANGSA (laporan
// user 2026-11-05, video: pemburu "Ys" berdiri di samping rusa yang
// HP-nya tetap penuh). Akar masalahnya tiga lapis: (1) hewan jinak
// kabur 120-150 tile/jam SEBELUM giliran pemburu tiap jam game,
// sementara pemburu jalan 90-150 tile/jam — rusa (120) praktis tak
// terkejar, jadi HP tidak pernah berkurang; (2) pemburu hanya
// mengincar mangsa dalam 6 tile dan tidak pernah berjalan MENDATANGI
// mangsa yang jauh — ia menunggu mangsa lewat di depan hidung;
// (3) serangan hanya dicoba bila mangsa SUDAH bersebelahan di awal
// giliran — padahal mangsa baru saja kabur, jadi pemburu selamanya
// selangkah di belakang. Perbaikannya: kabur jinak dibatasi
// sekejap (lalu merumput), pemburu aktif mencari + berlari mengejar,
// dan serangan dicoba lagi begitu pemburu TIBA di samping mangsa.
export const JARAK_KABUR_JINAK = 30; // tile/jam: kabur sekejap hewan jinak (rusa 120 -> 30)
export const JARAK_CARI_MANGSA = 40; // tile: pemburu aktif mencari mangsa sejauh ini (dulu 6)
export const JARAK_SERANG_OPORTUNIS = 3; // tile: warga non-pemburu menyerang hewan yang dekat
export const PENGALI_KEJAR = 1.5; // pemburu berlari saat mengejar mangsa (bukan jalan biasa)

// RONDE 15 — damage berburu per hit (sistem HP hewan): tombak iblis
// = 999 (bunuh sekali hit, sesuai raja iblis); pemburu biasa = 1 +
// 1 bila busur Lv1 + 1 bila tombak Lv1 (maks 3/hit). Dipakai
// stepPerburuan (mangsa jinak) + duel stepHewan (hewan buas).
export function damageBerburu(w: Warga): number {
  if (punyaTombakIblis(w)) return 999;
  let d = 1;
  if (levelPerkakas(w, "busur") >= 1) d += 1;
  if (levelPerkakas(w, "tombak") >= 1) d += 1;
  return d;
}

// RONDE 15 — HP hewan saat ini (hewan lama tanpa field hp = penuh).
export function hpHewan(h: HewanDoc, defHpMax: number): number {
  return typeof h.hp === "number" ? h.hp : defHpMax;
}

// Skor gelud: STR/AGI/STA + damage senjata. Figo (999 semua + dmg 999)
// = 999*2 + 999 + 999/2 + 999 = 4495,5 — menang melawan siapa pun.
export function skorGelud(w: Warga): number {
  return w.stat.str * 2 + w.stat.agi + w.stat.sta / 2 + damageSenjata(w);
}

// RONDE 14 — FIGO MEMBANTU (sifat "pintar, suka membantu"): cari pekerja
// terdekat (fase kumpul = sedang kerja: kumpul/tanam/masak/patroli/dll.)
// dalam radius 120 tile; kembalikan pekerja + ubin sebelahnya (tempat
// Figo berdiri membantu). Konstruksi gedung TIDAK punya warga pekerja
// (progres otomatis per jam game, pembangun hanya nama di antrean)
// sehingga tidak bisa didampingi — langkah lanjut bila antrean
// diekspos ke SimCtx.
export function cariBantuan(
  w: Warga,
  ctx: SimCtx,
): { pekerja: Warga; tujuan: { gx: number; gy: number }; tugas: string } | null {
  let dekat: Warga | null = null;
  let dekatD = Infinity;
  for (const o of ctx.wargaSemua) {
    if (String(o._id) === String(w._id)) continue;
    if (o.fase_siklus !== "kumpul") continue;
    const d = Math.abs(o.lokasi.gx - w.lokasi.gx) + Math.abs(o.lokasi.gy - w.lokasi.gy);
    if (d < dekatD) {
      dekatD = d;
      dekat = o;
    }
  }
  if (!dekat || dekatD > 120) return null;
  const tugas = dekat.tempat_kerja || dekat.aksi_sekarang || "bekerja";
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (const [dx, dy] of dirs) {
    const gx = dekat.lokasi.gx + dx;
    const gy = dekat.lokasi.gy + dy;
    if (isWater(gx, gy)) continue;
    if (ctx.rintangan.has(`${gx},${gy}`)) continue;
    return { pekerja: dekat, tujuan: { gx, gy }, tugas };
  }
  return null;
}

// Terapkan status membantu pada Figo (true bila berhasil). Dipanggil
// HANYA di titik "tidak ada target kerja" stepWarga — bukan di awal
// step — supaya Figo tetap kerja normal (kumpul padang) bila ada target,
// dan hanya membantu saat benar-benar tidak ada kerjaan. Preemption
// malam/lapar/stamina di atas tetap menang (fase jalan ikut pulang).
export function terapkanBantu(w: Warga, ctx: SimCtx): boolean {
  if (!punyaTombakIblis(w)) return false;
  // Selaras guard santai r13: hanya membantu saat fit + tidak lapar.
  // (Preemption malam/lapar/stamina di atas tetap menang untuk Figo
  // yang SUDAH membantu — cabang perjalanannya fase jalan.)
  if (w.stamina < 40 || w.lapar >= 90) return false;
  const bantu = cariBantuan(w, ctx);
  if (!bantu) return false;
  w.node = null;
  w.tujuan = bantu.tujuan;
  w.fase_siklus = "jalan";
  w.aksi_sekarang = "membantu";
  w.status_teks = `Membantu ${bantu.pekerja.nama} ${bantu.tugas}…`;
  w.tempat_kerja = "membantu";
  w.progres_aksi_pct = 0;
  return true;
}

// RONDE 18 — TERAPKAN JALAN: tim pinter (Figo memimpin + INT >= 9)
// membangun jalan.
// RONDE 20 (laporan user 2026-11-05: "kenapa gada yg bikin jalan",
// terbukti simulasi 10 hari: rencana 12 ubin ADA, tapi dengan gate
// bangunanAktif TERBUKA pun hanya 6 penugasan -> 2 ubin selesai):
// (a) gate `bangunanAktif` DIHAPUS — bangunan maju lewat hitungan
// perajin, bukan lewat waktu tim pinter, jadi gate itu hanya membuat
// jalan kelaparan giliran selamanya (antrean NPC hampir tidak pernah
// kosong selama kandidat ada); (b) pemicu DIPERLUAS dari "keluar
// paviliun saja" ke SEMUA titik pilih kerja via ambilTargetKerja di
// bawah. Guard fit + tidak lapar tetap; preemption malam/lapar/
// stamina di atas tetap menang (cabang jalan keyed node pseudo "jalan",
// dan semua redirect men-null-kan node — tidak pernah menahan pulang).
export function terapkanJalan(w: Warga, ctx: SimCtx): boolean {
  if (!pintarUntukJalan(w)) return false;
  if (w.stamina < 40 || w.lapar >= 90) return false;
  const rencana = ctx.jalanRencana;
  if (!rencana || rencana.tiles.length === 0) return false;
  const tugas = ctx.jalanTugas ?? new Set<string>();
  const tile = rencana.tiles.find((t) => !tugas.has(`${t.gx},${t.gy}`));
  if (!tile) return false;
  tugas.add(`${tile.gx},${tile.gy}`);
  ctx.jalanTugas = tugas;
  w.node = { kind: "padang_buruan", gx: tile.gx, gy: tile.gy, pseudo: "jalan", segmen: rencana.segmen };
  w.tujuan = { gx: tile.gx, gy: tile.gy };
  w.fase_siklus = "jalan";
  w.aksi_sekarang = "bangun_jalan";
  w.status_teks = `Membangun jalan ${rencana.segmen}…`;
  w.tempat_kerja = "jalan";
  w.progres_aksi_pct = 0;
  return true;
}

// RONDE 20 — SATU PINTU PILIH KERJA: coba jalan dulu (tim pinter),
// kalau tidak, target kumpul biasa. Dipakai di SEMUA titik warga
// memilih kerja baru (bangun tidur, habis makan, rantai node, selesai
// membantu, fallback) — dulu hanya titik keluar paviliun yang mencoba
// jalan, jadi jalan hampir tidak pernah dapat pekerja.
export function ambilTargetKerja(w: Warga, ctx: SimCtx): boolean {
  if (terapkanJalan(w, ctx)) return true;
  const target = pilihTargetKerja(w, ctx);
  if (!target) return false;
  w.node = target.node;
  w.tujuan = target.tujuan;
  w.fase_siklus = "jalan";
  w.aksi_sekarang = "berjalan";
  w.status_teks = `Berjalan ke ${labelNode(target.node.kind)}…`;
  w.tempat_kerja = labelNode(target.node.kind);
  if (target.node.pseudo === "sungai") { w.status_teks = "Berjalan ke sungai…"; w.tempat_kerja = "sungai"; }
  else if (target.node.pseudo === "ladang") { w.status_teks = "Berjalan ke ladang…"; w.tempat_kerja = "ladang"; }
  else if (target.node.pseudo === "restoran") { w.status_teks = "Berjalan ke paviliun makan…"; w.tempat_kerja = "Paviliun Makan"; }
  else if (target.node.darurat) { w.status_teks = "Berjalan mencari makan darurat…"; }
  w.progres_aksi_pct = 0;
  return true;
}

export function pengaliCuaca(cuaca: string): number {
  if (cuaca === "hujan") return 0.7;
  if (cuaca === "petir") return 0.5;
  if (cuaca === "berawan") return 0.9;
  return 1;
}

// RONDE 13 — MENCAR: warga tidak menumpuk di sekitar kampung.
// Akar menumpuk: pilihNodeTerbaik lama = node TERDEKAT dari posisi
// warga, dan setiap siklus kumpul berakhir pulang ke kampung — jadi
// target berikutnya selalu node terdekat dari kampung yang sama.
// Perbaikan (skor, bukan filter — node tetap ditemukan bila hanya itu
// yang ada): (a) SEKTOR per warga — 8 arah mata angin dari PUSAT,
// diturunkan deterministik dari nomor/id warga (tanpa migrasi DB);
// node di sektor warga tidak kena penalti, node di luar sektor +80
// (hanya bila stamina >= 60 — warga lelah tetap pilih terdekat);
// (b) ANTI-MENUMPUK — node yang sudah ditarget warga lain +60 per
// warga (taken = peta kunci node -> jumlah penarget).
// Hasil: warga menyebar ke 8 arah berbeda, bukan bergerombol; node
// dekat kampung habis → mereka merambah makin jauh secara organik.
export function sektorDariPosisi(gx: number, gy: number): number {
  const sudut = Math.atan2(gy - PUSAT.gy, gx - PUSAT.gx);
  const s = Math.floor((sudut + Math.PI) / (Math.PI / 4)) % 8;
  return (s + 8) % 8;
}

export function sektorWarga(w: Pick<Warga, "nomor" | "_id">): number {
  const kunci = String(w.nomor ?? w._id ?? "");
  let h = 0;
  for (let i = 0; i < kunci.length; i++) h = (h * 31 + kunci.charCodeAt(i)) % 997;
  return h % 8;
}

export function pilihNodeTerbaik(
  peranId: PeranId,
  lokasi: { gx: number; gy: number },
  nodes: Node[],
  nodeSisa?: Map<string, number>,
  opts?: { sektor?: number; taken?: Map<string, number>; stamina?: number }
): Node | null {
  const peran = peranById(peranId);
  if (!peran) return null;
  let best: Node | null = null;
  let bestSkor = Infinity;
  for (const n of nodes) {
    if (!peran.nodeKinds.includes(n.kind)) continue;
    if (nodeSisa && (nodeSisa.get(`${n.gx},${n.gy}`) ?? SISA_NODE_AWAL) <= 0) continue;
    const d = Math.abs(n.gx - lokasi.gx) + Math.abs(n.gy - lokasi.gy);
    let skor = d;
    if (opts?.taken) skor += 60 * (opts.taken.get(`${n.gx},${n.gy}`) ?? 0);
    if (
      opts?.sektor !== undefined &&
      (opts.stamina ?? 100) >= 60 &&
      sektorDariPosisi(n.gx, n.gy) !== opts.sektor
    ) {
      skor += 80;
    }
    if (skor < bestSkor) {
      bestSkor = skor;
      best = n;
    }
  }
  return best;
}

// Node menghasilkan pangan? (semak beri, padang buruan).
export function isPanganNode(kind: NodeKind): boolean {
  return nodeHasil(kind).resource === "pangan";
}

// Pangan terdekat (semak/padang, masih bersisa) — untuk darurat paceklik.
export function pilihPanganTerdekat(
  lokasi: { gx: number; gy: number },
  nodes: Node[],
  nodeSisa?: Map<string, number>
): Node | null {
  let best: Node | null = null;
  let bestD = Infinity;
  for (const n of nodes) {
    if (!isPanganNode(n.kind)) continue;
    if (nodeSisa && (nodeSisa.get(`${n.gx},${n.gy}`) ?? SISA_NODE_AWAL) <= 0) continue;
    const d = Math.abs(n.gx - lokasi.gx) + Math.abs(n.gy - lokasi.gy);
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

// RONDE 10 — ubin SEBELAH node (bukan di atas/di dalam node).
// Penambang "malah ke tengah batu" + penebang "masuk ke tengah pohon"
// karena tujuan lama = koordinat node persis. Sekarang tujuan jalan =
// ubin tetangga terdekat dari warga (8 arah, urutan tetap untuk tie):
// bukan air, bukan rintangan (bangunan), di dalam grid; ubin non-node
// diutamakan, ubin node lain jadi fallback; bila terkepung total,
// fallback terakhir = ubin node itu sendiri (tidak pernah crash).
export function tileSebelah(
  node: { gx: number; gy: number },
  dari: { gx: number; gy: number },
  opts?: { rintangan?: Set<string>; nodeTiles?: Set<string> }
): { gx: number; gy: number } {
  const URUTAN: [number, number][] = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];
  const kandidat: { t: { gx: number; gy: number }; d: number; urut: number; isNode: boolean }[] = [];
  for (let i = 0; i < URUTAN.length; i++) {
    const [dx, dy] = URUTAN[i];
    const gx = node.gx + dx;
    const gy = node.gy + dy;
    if (gx < GRID_MIN || gy < GRID_MIN || gx >= GRID_MAX || gy >= GRID_MAX) continue;
    if (isWater(gx, gy)) continue;
    if (isGunung(gx, gy)) continue;
    if (opts?.rintangan?.has(`${gx},${gy}`)) continue;
    kandidat.push({
      t: { gx, gy },
      d: Math.abs(gx - dari.gx) + Math.abs(gy - dari.gy),
      urut: i,
      isNode: opts?.nodeTiles?.has(`${gx},${gy}`) ?? false,
    });
  }
  kandidat.sort((a, b) => (a.isNode ? 1 : 0) - (b.isNode ? 1 : 0) || a.d - b.d || a.urut - b.urut);
  if (kandidat.length > 0) return kandidat[0].t;
  return { gx: node.gx, gy: node.gy };
}

// RONDE 10 (lanjutan) — PAVILIUN MAKAN: geometri pintu + ruang dalam.
// Denah 3x3 (footprint paviliun_makan), kolom TENGAH = jalur masuk:
// pintu luar (sisi selatan, di luar footprint) -> bukaan selatan ->
// tengah (meja makan) -> dapur (utara, periuk). Tiang soko di 4 sudut
// dan meja di sisi timur/barat TETAP rintangan — hanya kolom tengah yang
// dibuka untuk warga yang sedang menuju/berada di dalam paviliun.
// Tanpa ini, gerak() tidak pernah bisa masuk: semua ubin tetangga
// tengah adalah rintangan, jadi warga hanya bisa memutar di luar.
// Pintu = sisi selatan (+gy) — sama dengan sisi depan paviliun user
// (tangga + gapura di +z pada file HTML) dan sisi depan bangunan lain
// (pintu gubuk menghadap +z di buildBuilding).
export interface RestoranPlacement {
  _id?: unknown;
  kind: string;
  gx: number;
  gy: number;
  w: number;
  h: number;
  hidangan?: number;
}

// Kapasitas hidangan di paviliun (1 hidangan = 1 pangan dimasak juru
// masak; hidangan memberi lapar -60, pangan biasa -40).
export const KAP_HIDANGAN = 10;
export const LAPAR_HIDANGAN = 60;
export const LAPAR_PANGAN_RESTORAN = 55;
// RONDE 20 — IKAN SUNGAI: stok ikan di sungai (maks 30, tumbuh lagi
// +3 per hari game). Pemancing menangkap 1 ikan per ronde kumpul
// selesai; sungai sepi -> tidak ada hasil, pemancing beralih kumpul
// beri sampai ikan kembali.
export const IKAN_CAP = 30;
export const IKAN_REGROW_HARIAN = 3;

// RONDE 15 — SISA NODE AWAL = 1 (dulu 5): satu node = satu ronde kumpul
// (~10 pentung visual) lalu TUMBANG + hilang, warga langsung jalan ke
// target berikut bila fit (rantai kumpul). EKONOMI TOTAL SAMA: hasil
// satu ronde dikali 5 (lihat cabang kumpul) sehingga satu pohon memberi
// jumlah yang sama dengan 5 ronde lama untuk penebang yang sama.
// Satu-satunya perbedaan: dulu 5 ronde bisa ditebang 5 penebang berbeda
// (total = jumlah 5 penebang itu); kini satu penebang x5 — rata-rata
// sama, per node bisa beda tipis tergantung siapa yang menebang.
export const SISA_NODE_AWAL = 1;

export function pintuRestoran(p: { gx: number; gy: number; w: number; h: number }): { gx: number; gy: number } {
  return { gx: p.gx + Math.floor(p.w / 2), gy: p.gy + p.h };
}

export function tengahRestoran(p: { gx: number; gy: number; w: number; h: number }): { gx: number; gy: number } {
  return { gx: p.gx + Math.floor(p.w / 2), gy: p.gy + Math.floor(p.h / 2) };
}

export function dapurRestoran(p: { gx: number; gy: number; w: number; h: number }): { gx: number; gy: number } {
  return { gx: p.gx + Math.floor(p.w / 2), gy: p.gy };
}

export function kolomPintuRestoran(p: { gx: number; gy: number; w: number; h: number }): Set<string> {
  const s = new Set<string>();
  const cx = p.gx + Math.floor(p.w / 2);
  for (let gy = p.gy; gy < p.gy + p.h; gy++) s.add(`${cx},${gy}`);
  return s;
}

export function diDalamRestoran(pos: { gx: number; gy: number }, p: { gx: number; gy: number; w: number; h: number }): boolean {
  return pos.gx >= p.gx && pos.gx < p.gx + p.w && pos.gy >= p.gy && pos.gy < p.gy + p.h;
}

// Rintangan untuk SATU warga: bila warga sedang menuju/berada di dalam
// paviliun (lokasi ATAU tujuan di dalam footprint, atau sedang makan),
// kolom pintu dikeluarkan dari rintangan — warga lain + hewan tetap
// menganggap seluruh footprint sebagai rintangan (memutar di luar).
// Aturan lokasi-menutupi-tujuan penting untuk EVAKUASI: warga yang
// sedang makan lalu disuruh pulang (malam/stamina) harus bisa KELUAR
// lewat pintu meski tujuannya sudah bukan paviliun lagi.
export function rintanganUntuk(w: Warga, ctx: SimCtx): Set<string> {
  let out: Set<string> | null = null;
  const r = ctx.restoran;
  if (r) {
    const diDalam = diDalamRestoran(w.lokasi, r) || (w.tujuan !== null && diDalamRestoran(w.tujuan, r)) || w.fase_siklus === "makan";
    if (diDalam) {
      const kolom = kolomPintuRestoran(r);
      out = new Set<string>();
      for (const k of ctx.rintangan) if (!kolom.has(k)) out.add(k);
    }
  }
  // Malam (20:00–06:00, sama dengan faseDariJam): penghuni boleh masuk
  // rumah SENDIRI — ubin footprint rumahnya dikeluarkan dari rintangan.
  // Siang hari rumah sendiri tetap padat (warga memutar seperti bangunan
  // lain); hewan + warga lain tetap menganggap rumah itu rintangan penuh
  // kapan pun. Tanpa ini, gerak yang kini menolak semua rintangan tidak
  // akan bisa mengantar warga ke ubin tidurnya sendiri.
  const jamHari = ctx.jam % 24;
  if ((jamHari >= 20 || jamHari < 6) && w.hunian) {
    const p = (ctx.placements ?? []).find((x) => String(x._id) === w.hunian?.id);
    if (p) {
      if (!out) out = new Set<string>(ctx.rintangan);
      // r38: petak hunian dari helper kanonik.
      for (const k of petakBangunan(p)) out.delete(k);
    }
  }
  return out ?? ctx.rintangan;
}

// RONDE 10 — lokasi respawn node habis: lokasi BARU di tempat lain
// (bukan tumbuh lagi di ubin yang sama). Deterministik dari ubin lama +
// jam (seededRandom) supaya sama di semua pembaca; 60 kali coba acak,
// fallback pindai ring r<=30 sekeliling ubin lama. Syarat: darat, bukan
// air, bukan rintangan, bukan ubin node mana pun (termasuk spawn/pending
// baru), bukan ubin lama, jauh >=7 dari pusat (seperti node generated).
export function pilihLokasiRespawn(
  kind: NodeKind,
  lama: { gx: number; gy: number },
  jam: number,
  taken: Set<string>,
  rintangan?: Set<string>
): { kind: NodeKind; gx: number; gy: number } | null {
  const layak = (gx: number, gy: number): boolean => {
    if (gx <= GRID_MIN || gy <= GRID_MIN || gx >= GRID_MAX - 1 || gy >= GRID_MAX - 1) return false;
    if (isWater(gx, gy)) return false;
    if (isGunung(gx, gy)) return false;
    if (rintangan?.has(`${gx},${gy}`)) return false;
    if (taken.has(`${gx},${gy}`)) return false;
    if (gx === lama.gx && gy === lama.gy) return false;
    if (Math.abs(gx - PUSAT.gx) + Math.abs(gy - PUSAT.gy) < 7) return false;
    return true;
  };
  const rnd = seededRandom((lama.gx * 200 + lama.gy) * 100000 + jam);
  for (let t = 0; t < 60; t++) {
    const gx = 2 + Math.floor(rnd() * 196);
    const gy = 2 + Math.floor(rnd() * 196);
    if (layak(gx, gy)) return { kind, gx, gy };
  }
  for (let r = 1; r <= 30; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const gx = lama.gx + dx;
        const gy = lama.gy + dy;
        if (layak(gx, gy)) return { kind, gx, gy };
      }
    }
  }
  return null;
}

// RONDE 10 — terapkan spawn tertunda yang waktunya tiba: ubin baru
// menjadi node aktif bersisa 5. Murni (dipakai advanceWorld + test).
export function terapkanSpawnTertunda(
  tertunda: Map<string, { kind: NodeKind; gx: number; gy: number; jam: number }>,
  jam: number,
  nodeSpawn: Node[],
  nodeSisa: Map<string, number>,
  kabar: { jenis: string; teks: string; hari: number; dibuat_pada: Date }[]
): void {
  for (const [k, s] of [...tertunda]) {
    if (jam >= s.jam) {
      tertunda.delete(k);
      nodeSpawn.push({ kind: s.kind, gx: s.gx, gy: s.gy });
      nodeSisa.set(`${s.gx},${s.gy}`, SISA_NODE_AWAL);
      kabar.push({ jenis: "node_spawn", teks: `Sumber ${labelNode(s.kind)} baru muncul di (${s.gx},${s.gy}).`, hari: Math.floor(jam / 24), dibuat_pada: new Date() });
    }
  }
}

// RONDE 10 — node yang dituju warga ternyata SUDAH habis (diambil warga
// lain duluan): jangan kumpul di bekas kosong, jangan diam — cari node
// baru via pilihTargetKerja, atau pulang bila tidak ada. Dipakai di
// awal cabang kumpul + saat tiba di node (cabang jalan).
// Mengembalikan true bila warga dialihkan (kumpul dibatalkan).
export function periksaNodeHabis(w: Warga, ctx: SimCtx): boolean {
  if (!w.node || w.node.pseudo) return false;
  const sisa = ctx.nodeSisa.get(`${w.node.gx},${w.node.gy}`) ?? SISA_NODE_AWAL;
  if (sisa > 0) return false;
  const target = pilihTargetKerja(w, ctx);
  if (target) {
    w.node = target.node;
    w.tujuan = target.tujuan;
    w.fase_siklus = "jalan";
    w.aksi_sekarang = "berjalan";
    w.status_teks = `Berjalan ke ${labelNode(target.node.kind)}…`;
    w.tempat_kerja = labelNode(target.node.kind);
    w.progres_aksi_pct = 0;
  } else {
    const titik = ctx.hunianTitik(w);
    w.tujuan = titik;
    w.node = null;
    w.fase_siklus = "kembali";
    w.aksi_sekarang = "pulang_istirahat";
    w.status_teks = "Sumber habis, pulang…";
    w.tempat_kerja = "kampung";
    w.progres_aksi_pct = 0;
  }
  return true;
}

// Ubin tidur dalam footprint hunian: tiap penghuni ubin BERBEDA (urutan
// baris, modulo bila penghuni > ubin — gubuk_besar kap 6 di 2x2 = 4 ubin).
export function tileHunian(
  p: { kind?: string; gx: number; gy: number; w?: number | null; h?: number | null },
  idx: number
): { gx: number; gy: number } {
  const tiles: { gx: number; gy: number }[] = [];
  // r38: petak hunian dari helper kanonik (w/h sudah dijamin angka
  // oleh pemanggil; ukuranPetak tetap dipakai untuk konsistensi).
  const { w: pw, h: ph } = ukuranPetak(p);
  for (let dy = 0; dy < ph; dy++) {
    for (let dx = 0; dx < pw; dx++) {
      tiles.push({ gx: p.gx + dx, gy: p.gy + dy });
    }
  }
  if (tiles.length === 0) return { gx: p.gx, gy: p.gy };
  return tiles[((idx % tiles.length) + tiles.length) % tiles.length];
}

// Ubin TAMU untuk warga tanpa tempat tidur: sekeliling gubuk terdekat
// (bukan api unggun yang jauh) — tidur bersama kelompok, bukan sendirian.
// Deterministik dari idx (urutan warga) supaya tamu tidak menumpuk.
export function tileTamu(
  placements: { kind: string; gx: number; gy: number; w: number; h: number }[],
  idx: number
): { gx: number; gy: number } {
  const hunian = placements.filter((p) => {
    const b = bangunanById(p.kind);
    return b && b.kapasitas !== null;
  });
  // Gubuk terdekat dari pusat (gubuk awal di pusat kampung).
  hunian.sort((a, b) => Math.abs(a.gx - PUSAT.gx) + Math.abs(a.gy - PUSAT.gy) - (Math.abs(b.gx - PUSAT.gx) + Math.abs(b.gy - PUSAT.gy)));
  // r38: occupied dari helper petak kanonik.
  const occupied = occupiedDariPlacements(placements);
  for (const p of hunian) {
    const { w: pw, h: ph } = ukuranPetak(p);
    const sekeliling: { gx: number; gy: number }[] = [];
    for (let dy = -1; dy <= ph; dy++) {
      for (let dx = -1; dx <= pw; dx++) {
        if (dx >= 0 && dx < pw && dy >= 0 && dy < ph) continue;
        const gx = p.gx + dx;
        const gy = p.gy + dy;
        if (gx < GRID_MIN || gy < GRID_MIN || gx >= GRID_MAX || gy >= GRID_MAX) continue;
        if (occupied.has(`${gx},${gy}`)) continue;
        if (isWater(gx, gy)) continue;
        sekeliling.push({ gx, gy });
      }
    }
    if (sekeliling.length > 0) {
      return sekeliling[((idx % sekeliling.length) + sekeliling.length) % sekeliling.length];
    }
  }
  const angle = ((idx * 53) % 360) * (Math.PI / 180); const r = 2 + (idx % 3); return { gx: 100 + Math.round(Math.cos(angle) * r), gy: 100 + Math.round(Math.sin(angle) * r) };
}

// Tepi sungai terdekat untuk nelayan: tile DARAT di tepi air (bukan di air)
// — nelayan berdiri di tepi, memancing ke sungai.
export function titikSungaiTerdekat(lokasi: { gx: number; gy: number }): { gx: number; gy: number } {
  let wx = riverX(lokasi.gy);
  let wy = lokasi.gy;
  let bestD = Infinity;
  for (let gy = GRID_MIN; gy < GRID_MAX; gy++) {
    const rx = riverX(gy);
    for (const gx of [rx, rx + 1, rx + 2]) {
      const d = Math.abs(gx - lokasi.gx) + Math.abs(gy - lokasi.gy);
      if (d < bestD) {
        bestD = d;
        wx = gx;
        wy = gy;
      }
    }
  }
  // Tepi: rx-1 (barat) atau rx+2 (timur) — yang terdekat dari warga.
  const rx = riverX(wy);
  const barat = { gx: rx - 1, gy: wy };
  const timur = { gx: rx + 3, gy: wy };
  const dBarat = Math.abs(barat.gx - lokasi.gx) + Math.abs(barat.gy - lokasi.gy);
  const dTimur = Math.abs(timur.gx - lokasi.gx) + Math.abs(timur.gy - lokasi.gy);
  const pilih = dBarat <= dTimur ? barat : timur;
  if (pilih.gx < GRID_MIN || pilih.gx >= GRID_MAX || isWater(pilih.gx, pilih.gy)) {
    return dBarat <= dTimur ? timur : barat;
  }
  return pilih;
}

// Ring patroli penjaga: 8 titik keliling pusat kampung (jauh dari sungai).
export const WAYPOINT_PATROLI: { gx: number; gy: number }[] = [
  { gx: 100, gy: 86 },
  { gx: 110, gy: 90 },
  { gx: 114, gy: 100 },
  { gx: 110, gy: 110 },
  { gx: 100, gy: 114 },
  { gx: 90, gy: 110 },
  { gx: 86, gy: 100 },
  { gx: 90, gy: 90 },
];

// Waypoint patroli berikut (giliran ring); bila node bukan waypoint, yang terdekat.
export function waypointPatroliBerikutnya(node: { gx: number; gy: number } | null): { gx: number; gy: number } {
  if (node) {
    const i = WAYPOINT_PATROLI.findIndex((w) => w.gx === node.gx && w.gy === node.gy);
    if (i >= 0) return WAYPOINT_PATROLI[(i + 1) % WAYPOINT_PATROLI.length];
  }
  return WAYPOINT_PATROLI[0];
}

export function waypointPatroliTerdekat(lokasi: { gx: number; gy: number }): { gx: number; gy: number } {
  let best = WAYPOINT_PATROLI[0];
  let bestD = Infinity;
  for (const w of WAYPOINT_PATROLI) {
    const d = Math.abs(w.gx - lokasi.gx) + Math.abs(w.gy - lokasi.gy);
    if (d < bestD) {
      bestD = d;
      best = w;
    }
  }
  return best;
}

// Pilih target kerja SATU PINTU (dipakai bangun + fallback): menangani
// target khusus (nelayan/petani/penjaga), darurat paceklik, lalu node peran.
// Mengembalikan node + tujuan, atau null bila tidak ada target sama sekali.
export function pilihTargetKerja(
  w: Warga,
  ctx: SimCtx
): { node: NonNullable<Warga["node"]>; tujuan: { gx: number; gy: number } } | null {
  // Bila stok untuk peran ini sudah penuh, jangan cari kerja kumpul — biarkan warga rehat santai!
  if (apakahStokPeranPenuh(w, ctx)) {
    return null;
  }
  if (w.peran === "nelayan" || w.peran === "pemancing") {
    // RONDE 20 — sungai sepi (ikan habis): pemancing beralih kumpul
    // beri seperti pengumpul, bukan diam di tepi sungai yang kosong.
    if ((ctx.ikanSungai ?? IKAN_CAP) <= 0) {
      const taken = new Map<string, number>();
      for (const o of ctx.wargaSemua ?? []) {
        if (o === w || !o.node || o.node.pseudo) continue;
        const k = `${o.node.gx},${o.node.gy}`;
        taken.set(k, (taken.get(k) ?? 0) + 1);
      }
      const node = pilihNodeTerbaik("pengumpul", w.lokasi, ctx.nodes, ctx.nodeSisa, {
        sektor: sektorWarga(w),
        taken,
        stamina: w.stamina,
      });
      if (node) {
        const t = tileSebelah(node, w.lokasi, { rintangan: ctx.rintangan, nodeTiles: ctx.nodeTilesAll });
        return { node: { kind: node.kind, gx: node.gx, gy: node.gy }, tujuan: t };
      }
      return null;
    }
    const tepi = titikSungaiTerdekat(w.lokasi);
    return { node: { kind: "semak_beri", gx: tepi.gx, gy: tepi.gy, pseudo: "sungai" }, tujuan: tepi };
  }
  if (w.peran === "petani" && ctx.ladang) {
    const t = { gx: ctx.ladang.gx, gy: ctx.ladang.gy };
    return { node: { kind: "semak_beri", gx: t.gx, gy: t.gy, pseudo: "ladang" }, tujuan: t };
  }
  if (w.peran === "penjaga") {
    const t = w.node?.pseudo === "patroli" ? waypointPatroliBerikutnya(w.node) : waypointPatroliTerdekat(w.lokasi);
    return { node: { kind: "padang_buruan", gx: t.gx, gy: t.gy, pseudo: "patroli" }, tujuan: t };
  }
  // RONDE 10 (lanjutan) — juru masak bekerja DI paviliun, bukan kumpul
  // node: bila paviliun ada + ada pangan untuk dimasak + dapur belum
  // penuh, target = ubin dapur (utara-tengah paviliun) dengan pseudo
  // "restoran". Bila syarat tak terpenuhi (pangan habis / dapur penuh /
  // belum ada paviliun), jatuh ke kumpul biasa di bawah — juru masak
  // tetap produktif (kumpul beri/daging) sampai bisa memasak lagi.
  if (w.peran === "juru_masak" && ctx.restoran && (ctx.stok.pangan ?? 0) > 0 && (ctx.restoran.hidangan ?? 0) < KAP_HIDANGAN) {
    const d = dapurRestoran(ctx.restoran);
    return { node: { kind: "semak_beri", gx: d.gx, gy: d.gy, pseudo: "restoran" }, tujuan: d };
  }
  // Darurat paceklik: lapar + pangan kosong -> kumpul pangan, di luar peran.
  if (w.lapar >= 90 && (ctx.stok.pangan ?? 0) <= 0) {
    const darurat = pilihPanganTerdekat(w.lokasi, ctx.nodes, ctx.nodeSisa);
    if (darurat) {
      // RONDE 10: berdiri SEBELAH node, bukan di atasnya.
      const t = tileSebelah(darurat, w.lokasi, { rintangan: ctx.rintangan, nodeTiles: ctx.nodeTilesAll });
      return { node: { kind: darurat.kind, gx: darurat.gx, gy: darurat.gy, darurat: true }, tujuan: t };
    }
  }
  // RONDE 13 — mencar: node yang sudah ditarget warga lain dikenai
  // penalti (anti-menumpuk) + sektor warga jadi preferensi arah.
  // Darurat paceklik di atas tetap terdekat murni (survival).
  const taken = new Map<string, number>();
  for (const o of ctx.wargaSemua ?? []) {
    if (o === w || !o.node || o.node.pseudo) continue;
    const k = `${o.node.gx},${o.node.gy}`;
    taken.set(k, (taken.get(k) ?? 0) + 1);
  }
  const node = pilihNodeTerbaik(w.peran, w.lokasi, ctx.nodes, ctx.nodeSisa, {
    sektor: sektorWarga(w),
    taken,
    stamina: w.stamina,
  });
  if (!node) return null;
  // RONDE 10: tujuan = ubin SEBELAH node (w.node tetap koordinat node
  // asli — client menghadapkan warga ke node dari ubin sebelah itu).
  const t = tileSebelah(node, w.lokasi, { rintangan: ctx.rintangan, nodeTiles: ctx.nodeTilesAll });
  return { node: { kind: node.kind, gx: node.gx, gy: node.gy }, tujuan: t };
}

// RONDE 13 — IDLE AKTIF: warga tanpa kerjaan TIDAK BOLEH hanya berdiri
// diam. Diagnosis diam: (1) cabang istirahat target-null → warga duduk
// di hunian sampai node respawn (berjam-jam); (2) fallthrough target-null
// → tidak ada cabang yang menggerakkan warga sama sekali; (3) keluar
// paviliun target-null → langsung istirahat. Pengganti: SANTAI —
// jalan-jalan ke ubin acak di sekitar (radius 8–30 tile), cari-cari,
// atau jalan ke pekerja terdekat + bantu 1 jam (visual/posisional saja,
// TANPA efek ekonomi — tidak menambah stok, tidak mempercepat kumpul).
// Santai memakai fase "jalan" + node pseudo "santai" supaya SEMUA
// redirect yang sudah ada tetap berlaku: malam → pulang tidur, lapar
// ≥90 → pulang makan/paviliun, stamina <15 → pulang istirahat. Santai
// TIDAK PERNAH masuk cabang kumpul (cabang santai ditempatkan SEBELUM
// cabang jalan umum) — jadi tidak ada stok gratis dari node palsu.
// Santai berakhir tiap tiba: cek kerja dulu (ada target → kerja),
// kalau tidak ada → santai lagi. Bila kondisi tidak memenuhi syarat
// (malam/lelah/lapar), pemanggil memakai perilaku lama (istirahat).
function pilihTitikSantai(w: Warga, ctx: SimCtx): { gx: number; gy: number } | null {
  for (let i = 0; i < 24; i++) {
    const dx = Math.floor(Math.random() * 61) - 30;
    const dy = Math.floor(Math.random() * 61) - 30;
    const man = Math.abs(dx) + Math.abs(dy);
    if (man < 8 || man > 30) continue;
    const gx = w.lokasi.gx + dx;
    const gy = w.lokasi.gy + dy;
    if (gx < GRID_MIN || gy < GRID_MIN || gx >= GRID_MAX || gy >= GRID_MAX) continue;
    if (isWater(gx, gy)) continue;
    if (isGunung(gx, gy)) continue;
    if (ctx.rintangan?.has(`${gx},${gy}`)) continue;
    if (ctx.nodeTilesAll?.has(`${gx},${gy}`)) continue;
    return { gx, gy };
  }
  return null;
}

// Mulai satu aktivitas santai (jalan / bantu). Kembalikan false bila
// tidak ada titik santai yang layak (pemanggil memakai perilaku lama).
function mulaiSantai(w: Warga, ctx: SimCtx): boolean {
  let pekerja: Warga | null = null;
  let pekerjaD = Infinity;
  for (const o of ctx.wargaSemua ?? []) {
    if (o === w || o.fase_siklus !== "kumpul" || !o.lokasi) continue;
    const d = Math.abs(o.lokasi.gx - w.lokasi.gx) + Math.abs(o.lokasi.gy - w.lokasi.gy);
    if (d <= 30 && d < pekerjaD) {
      pekerjaD = d;
      pekerja = o;
    }
  }
  if (pekerja && Math.random() < 0.5) {
    const t = tileSebelah(
      { gx: pekerja.lokasi.gx, gy: pekerja.lokasi.gy },
      w.lokasi,
      { rintangan: ctx.rintangan, nodeTiles: ctx.nodeTilesAll }
    );
    w.node = { kind: "padang_buruan", gx: pekerja.lokasi.gx, gy: pekerja.lokasi.gy, pseudo: "santai", bantu: pekerja.nama };
    w.tujuan = t;
    w.fase_siklus = "jalan";
    w.aksi_sekarang = "jalan_santai";
    w.status_teks = `Menuju ${pekerja.nama}, mau bantu…`;
    w.tempat_kerja = "kampung";
    w.progres_aksi_pct = 0;
    return true;
  }
  const t = pilihTitikSantai(w, ctx);
  if (!t) return false;
  w.node = { kind: "padang_buruan", gx: t.gx, gy: t.gy, pseudo: "santai" };
  w.tujuan = t;
  w.fase_siklus = "jalan";
  w.aksi_sekarang = "jalan_santai";
  w.status_teks = Math.random() < 0.5 ? "Jalan-jalan…" : "Mencari-cari…";
  w.tempat_kerja = "kampung";
  w.progres_aksi_pct = 0;
  return true;
}

export function statusKumpul(peranId: PeranId, nodeKind: NodeKind): string {
  if (peranId === "kepala_suku") return "Memimpin rombongan berburu…";
  if (peranId === "pemburu") return "Berburu di padang…";
  if (peranId === "pengumpul") return "Mengumpulkan buah beri…";
  if (peranId === "penebang") return "Menebang pohon…";
  if (peranId === "penambang") {
    if (nodeKind === "urat_emas") return "Menambang urat emas…";
    if (nodeKind === "urat_besi") return "Menambang urat besi…";
    return "Memahat batu…";
  }
  if (peranId === "perajin") return "Memilih batu perkakas…";
  if (peranId === "tabib") return "Meramu tumbuhan obat…";
  if (peranId === "penjaga_api") return "Mengumpulkan kayu bakar…";
  if (peranId === "peramu") return "Meramu ramuan di semak…";
  if (peranId === "juru_masak") return "Memasak di periuk…";
  if (peranId === "nelayan" || peranId === "pemancing") return "Memancing di sungai…";
  if (peranId === "petani") return "Bercocok tanam di ladang…";
  if (peranId === "penjaga") return "Berpatroli di kampung…";
  if (peranId === "pengukir") return "Mengukir batu…";
  if (peranId === "penjelajah") return `Menjelajah ${labelNode(nodeKind)}…`;
  if (peranId === "pemanjat") return "Memanjat pohon…";
  if (peranId === "penenun") return "Menenun hasil padang…";
  if (peranId === "penjerat") return "Memeriksa jerat di padang…";
  return "Bekerja…";
}

// Satu langkah gerak: pilih sumbu dengan sisa jarak lebih besar.
// - Tile jembatan = darat (tidak berenang). Tile air = renang (1 langkah air
//   memakan 2 speed, lebih lambat). Tile rintangan (bangunan) dihindari,
//   kecuali tile itu sendiri tujuannya (mis. pusat hunian).
// - Mengembalikan posisi baru + apakah ada langkah renang.
export function gerak(
  lokasi: { gx: number; gy: number },
  tujuan: { gx: number; gy: number },
  speed: number,
  opts?: { jembatan?: Set<string>; rintangan?: Set<string> }
): { lokasi: { gx: number; gy: number }; berenang: boolean } {
  let { gx, gy } = lokasi;
  let budget = speed;
  let berenang = isWater(gx, gy);
  const jembatan = opts?.jembatan;
  const rintangan = opts?.rintangan;
  // Ubin yang sudah dilewati dalam panggilan ini — mencegah osilasi
  // maju-mundur saat memutar (langkah menyamping tidak boleh balik).
  const dikunjungi = new Set<string>([`${gx},${gy}`]);
  while (budget > 0) {
    if (gx === tujuan.gx && gy === tujuan.gy) break;
    const dx = Math.sign(tujuan.gx - gx);
    const dy = Math.sign(tujuan.gy - gy);
    const sisaX = Math.abs(tujuan.gx - gx);
    const sisaY = Math.abs(tujuan.gy - gy);
    const urutan: [number, number][] = sisaX >= sisaY ? [[dx, 0], [0, dy]] : [[0, dy], [dx, 0]];
    // RONDE 2 fix — jalan buntu di pintu gubuk (kasus live: Hunter di
    // (47,49) menuju (49,49), ubin (48,49) milik gubuk 2x2 sehingga kedua
    // langkah langsung gagal dan warga diam selamanya): bila langkah
    // langsung habis, coba langkah menyamping untuk memutar bangunan.
    const samping: [number, number][] = dx !== 0 ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
    // Kumpulkan kandidat: kering dulu (darat/jembatan), air terakhir.
    // PRIORITAS: langkah langsung dulu (kering lalu basah); langkah
    // menyamping HANYA bila tidak ada langkah langsung sama sekali —
    // kalau tidak, warga lebih memilih memutar darat ketimbang berenang
    // lurus (merusak kontrak lama "menyeberang sungai").
    const kering: [number, number][] = [];
    const basah: [number, number][] = [];
    const kumpul = (daftar: [number, number][]) => {
      for (const [sx, sy] of daftar) {
        if (sx === 0 && sy === 0) continue;
        const nx = gx + sx;
        const ny = gy + sy;
        const key = `${nx},${ny}`;
        if (dikunjungi.has(key)) continue;
        // Tabrakan penuh (2026-11-04, permintaan user): bangunan/gunung
        // TIDAK bisa ditembus, bahkan sebagai ubin tujuan. Pengecualian
        // satu-satunya diatur di rintanganUntuk (pintu paviliun, dan
        // malam hari rumah sendiri yang sudah dikeluarkan dari set) —
        // bukan di sini, supaya tidak ada tujuan liar yang menembus
        // bangunan orang lain.
        if (rintangan?.has(key)) continue;
        if (isGunung(nx, ny)) continue;
        if (nx < GRID_MIN || ny < GRID_MIN || nx >= GRID_MAX || ny >= GRID_MAX) continue;
        if (isWater(nx, ny) && !jembatan?.has(key)) basah.push([sx, sy]);
        else kering.push([sx, sy]);
      }
    };
    kumpul(urutan);
    if (kering.length === 0 && basah.length === 0) kumpul(samping);
    const pilih = kering[0] ?? basah[0];
    if (!pilih) break;
    const nx = gx + pilih[0];
    const ny = gy + pilih[1];
    const key = `${nx},${ny}`;
    const lewatAir = isWater(nx, ny) && !jembatan?.has(key);
    const biaya = lewatAir ? 2 : 1;
    if (biaya > budget) break;
    gx = nx;
    gy = ny;
    dikunjungi.add(key);
    budget -= biaya;
    if (lewatAir) berenang = true;
  }
  return { lokasi: { gx, gy }, berenang };
}

function gerakMenjauh(
  lokasi: { gx: number; gy: number },
  dari: { gx: number; gy: number },
  speed: number,
  rintangan?: Set<string>
): { gx: number; gy: number } {
  let { gx, gy } = lokasi;
  for (let s = 0; s < speed; s++) {
    const dx = Math.sign(gx - dari.gx);
    const dy = Math.sign(gy - dari.gy);
    const opsi: [number, number][] = [];
    if (dx !== 0) opsi.push([dx, 0]);
    if (dy !== 0) opsi.push([0, dy]);
    if (opsi.length === 0) opsi.push([1, 0]);
    let jalan = false;
    for (const [sx, sy] of opsi) {
      const nx = gx + sx;
      const ny = gy + sy;
      if (nx <= GRID_MIN || ny <= GRID_MIN || nx >= GRID_MAX - 1 || ny >= GRID_MAX - 1) continue;
      // Tabrakan penuh (2026-11-04): hewan kabur pun tidak menembus
      // bangunan — berhenti di tembok ketimbang lewat.
      if (rintangan?.has(`${nx},${ny}`)) continue;
      if (!isWater(nx, ny)) {
        gx = nx;
        gy = ny;
        jalan = true;
        break;
      }
    }
    if (!jalan) break;
  }
  return { gx, gy };
}

interface KabarBaru {
  jenis: string;
  teks: string;
  hari: number;
  dibuat_pada: Date;
}

export interface SimCtx {
  nodes: Node[];
  nodeSisa: Map<string, number>;
  nodeRegrow: Map<string, number>;
  stok: Stok;
  kapasitasMaks?: Record<string, number>;
  kabar: KabarBaru[];
  hunianTitik: (w: Warga) => { gx: number; gy: number };
  rintangan: Set<string>;
  jembatan: Set<string>;
  perahuAda: boolean;
  hewan: HewanDoc[];
  hewanHilang: Set<string>;
  wargaSemua: Warga[];
  cuaca: string;
  hari: number; // hari game (untuk kabar + cuaca + umur)
  jam: number; // jam game total (otoritatif)
  ladang?: { gx: number; gy: number } | null; // placement ladang pertama (petani)
  // RONDE 10 (opsional supaya test lama tetap jalan): ubin semua node
  // (generated + spawn + pending) untuk tileSebelah; node spawn aktif;
  // spawn tertunda; daging tergeletak + yang dihapus jam ini.
  nodeTilesAll?: Set<string>;
  nodeSpawn?: Node[];
  nodeSpawnTertunda?: Map<string, { kind: NodeKind; gx: number; gy: number; jam: number }>;
  daging?: DagingDoc[];
  dagingHapus?: Set<string>;
  // RONDE 10 (lanjutan): placement paviliun_makan yang sudah selesai
  // (null bila belum dibangun) + flag hidangan berubah jam ini (untuk
  // tulis-balik ke peta_tile — placements TIDAK ditulis balik otomatis).
  restoran?: RestoranPlacement | null;
  restoranBerubah?: boolean;
  // RONDE 18 — jalan: placement (referensi, ikut mutasi push) + ubin
  // jalan selesai + ubin jalan yang sudah ditugaskan jam ini + rencana
  // jalan jam ini + ubin jalan baru yang menunggu tulis-balik + apakah
  // ada bangunan antre/dibangun (jalan hanya bila tidak ada).
  placements?: { _id: unknown; kind: string; gx: number; gy: number; w: number; h: number; bangunan_id?: string; hidangan?: number }[];
  jalanSelesai?: Set<string>;
  jalanTugas?: Set<string>;
  jalanRencana?: { segmen: string; tiles: { gx: number; gy: number }[] } | null;
  jalanBaru?: { gx: number; gy: number; segmen: string }[];
  bangunanAktif?: boolean;
  // RONDE 20 — stok ikan sungai saat ini (default IKAN_CAP bila kosong).
  ikanSungai?: number;
}

// Jadwal regrow node: 30-60 jam game setelah habis (deterministik dari posisi).
export function jadwalRegrow(jam: number, gx: number, gy: number): number {
  // Siklus musim buah / bahan: 36 - 60 jam game (1,5 - 2,5 hari game).
  // RONDE 20: dipercepat sedikit dari 48-72 jam (bagian dari gampangin pangan).
  return jam + 36 + ((gx * 7 + gy * 13) % 24);
}

// Respawn hewan: aktif bila populasi < 25; peluang per jam game (50% bila
// sudah < 12). Populasi kembali ke ~25 ekor secara bertahap.
export function butuhRespawnHewan(hidup: number): boolean {
  return hidup < 25;
}

export function peluangRespawnHewan(hidup: number): number {
  if (hidup < 12) return 0.5;
  if (hidup < 25) return 0.3;
  return 0;
}

function levelPerkakas(w: Warga, jenis: string): number {
  return (w.perkakas ?? []).find((p) => p.jenis === jenis)?.level ?? 0;
}

function bonusPerkakas(w: Warga): number {
  const alat = perkakasPeran(w.peran);
  return levelPerkakas(w, alat) >= 1 ? 1.25 : 1;
}

// Satu jam simulasi untuk satu warga (mutasi doc + stok + kabar).
// `jam` = jam game total; hari kalender = floor(jam / 24) untuk kabar/umur.
export function stepWarga(w: Warga, jam: number, ctx: SimCtx): void {
  const hari = Math.floor(jam / 24);
  const peran = peranById(w.peran);
  const statFokus = peran ? w.stat[peran.stat] : 5;
  const fit = pengaliFit(w.peran, w.stat);
  // Faktor malam: HANYA pada jam malam (penjaga api tidak kena).
  // (Faktor ini kini praktis mati — lihat aturan malam di bawah: tidak
  // ada yang kumpul di malam hari — tapi dipertahankan sebagai pengaman
  // bila aturan malam dilewati jalur lain.)
  const fase = faseDariJam(jam % 24);
  const malam = fase === "malam" && w.peran !== "penjaga_api" ? 0.85 : 1;
  const cuacaM = pengaliCuaca(ctx.cuaca);

  // RONDE 9 — ISTIRAHAT MALAM (perintah user: 20:00 baru istirahat,
  // sampai 06:00): warga yang masih jalan/kumpul di jam malam PULANG
  // tidur — ditempatkan SEBELUM preemption lapar + blok stamina supaya
  // malam tidak pernah dipakai kerja. Yang sudah di hunian langsung
  // istirahat; yang di jalan pulang dulu (cabang kembali). Daging yang
  // sedang diambil ditinggal (tetap tergeletak, kedaluwarsa 24 jam).
  // RONDE 10 (lanjutan): warga yang sedang MAKAN di paviliun ikut pulang
  // tidur malam (tidak ada makan tengah malam) — keluar lewat pintu
  // berkat aturan lokasi di rintanganUntuk.
  if (fase === "malam" && (w.fase_siklus === "jalan" || w.fase_siklus === "kumpul" || w.fase_siklus === "makan")) {
    const titikMalam = ctx.hunianTitik(w);
    w.daging_target = null;
    if (w.lokasi.gx === titikMalam.gx && w.lokasi.gy === titikMalam.gy) {
      w.tujuan = null;
      w.node = null;
      w.fase_siklus = "istirahat";
      w.istirahat_sisa = 1;
      w.aksi_sekarang = "beristirahat";
      w.status_teks = "Tidur malam di kampung…";
      w.tempat_kerja = w.hunian ? w.hunian.label : "dekat hunian";
      w.progres_aksi_pct = 0;
    } else {
      w.tujuan = titikMalam;
      w.node = null;
      w.fase_siklus = "kembali";
      w.aksi_sekarang = "pulang_istirahat";
      w.status_teks = "Pulang tidur malam…";
      w.tempat_kerja = "kampung";
      w.progres_aksi_pct = 0;
    }
  }

  // Lapar kritis -> pulang makan — HANYA bila ada pangan di rumah DAN
  // HANYA dari fase jalan. Dua guard anti-paceklik (ronde 4):
  // (a) pangan=0 -> pulang tidak ada gunanya (tidak bisa makan), jadi
  // warga TIDAK dipulangkan — ia beralih ke produksi pangan (lihat
  // redirect darurat di bawah + pilihTargetKerja);
  // (b) kumpul yang sedang berjalan TIDAK dibatalkan — progres yang
  // hampir selesai tidak boleh hilang tiap jam karena lapar (itu yang
  // membuat pangan macet 0: tidak ada siklus kumpul yang pernah selesai).
  // RONDE 10 (lanjutan): lapar kritis -> MAKAN DI PAVILIUN bila sudah ada
  // paviliun + ada yang bisa dimakan (hidangan ATAU pangan); bila belum
  // ada paviliun, tetap pulang makan ke hunian seperti dulu. Guard
  // aksi_sekarang mencegah warga yang SUDAH menuju paviliun dibelokkan
  // pulang tiap jam (loop pulang-pergi). Bila paviliun ada tapi kosong
  // total (pangan 0 + hidangan 0), tidak ada redirect — logika paceklik
  // di bawah yang mengambil alih (cari pangan darurat).
  if (w.lapar >= 90 && w.fase_siklus === "jalan" && w.aksi_sekarang !== "pulang_restoran") {
    const adaMakanan = (ctx.stok.pangan ?? 0) > 0 || (ctx.restoran?.hidangan ?? 0) > 0;
    if (ctx.restoran && adaMakanan) {
      w.tujuan = tengahRestoran(ctx.restoran);
      w.daging_target = null;
      w.node = null;
      w.fase_siklus = "jalan";
      w.aksi_sekarang = "pulang_restoran";
      w.status_teks = "Berjalan ke paviliun makan…";
      w.tempat_kerja = "Paviliun Makan";
      w.progres_aksi_pct = 0;
    } else if ((ctx.stok.pangan ?? 0) > 0) {
      const titik = ctx.hunianTitik(w);
      w.tujuan = titik;
      w.daging_target = null;
      w.node = null;
      w.fase_siklus = "kembali";
      w.aksi_sekarang = "pulang_makan";
      w.status_teks = "Pulang makan, lapar sekali…";
      w.tempat_kerja = "kampung";
      w.progres_aksi_pct = 0;
    }
  }
  // Redirect darurat paceklik: warga lapar yang sedang berjalan ke target
  // yang TIDAK menghasilkan pangan, sementara pangan=0 -> belok ke
  // semak/padang terdekat. Target penghasil pangan (node pangan asli,
  // pseudo sungai/ladang) tidak dibelokkan; patroli (kind kendaraan
  // padang_buruan tapi tidak menghasilkan apa-apa) DIBELOKKAN.
  const targetMenghasilkanPangan =
    w.node?.pseudo === "sungai" ||
    w.node?.pseudo === "ladang" ||
    (!w.node?.pseudo && w.node !== null && isPanganNode(w.node.kind));
  if (
    w.lapar >= 90 &&
    (ctx.stok.pangan ?? 0) <= 0 &&
    w.fase_siklus === "jalan" &&
    w.node &&
    !targetMenghasilkanPangan
  ) {
    const darurat = pilihPanganTerdekat(w.lokasi, ctx.nodes, ctx.nodeSisa);
    if (darurat) {
      w.node = { kind: darurat.kind, gx: darurat.gx, gy: darurat.gy, darurat: true };
      w.tujuan = tileSebelah(darurat, w.lokasi, { rintangan: ctx.rintangan, nodeTiles: ctx.nodeTilesAll });
      w.status_teks = "Mencari makan darurat…";
      w.tempat_kerja = labelNode(darurat.kind);
      w.progres_aksi_pct = 0;
    }
  }
  // SISTEM KESEHATAN & TABIB (DUNIA FANTASI):
  // Bila kesehatan rendah (sehat < 65) atau terluka: warga berobat ke Pondok Tabib
  const tabibPlacement = (ctx.placements ?? []).find((p) => p.kind === "pondok_tabib");
  const tabibWarga = ctx.wargaSemua.find((x) => x.peran === "tabib" || x.peran === "peramu");
  if (w.sehat < 65 && w.fase_siklus !== "istirahat" && w.fase_siklus !== "makan" && (tabibPlacement || tabibWarga)) {
    const targetTabib = tabibPlacement
      ? { gx: tabibPlacement.gx + 1, gy: tabibPlacement.gy + 1 }
      : { gx: tabibWarga!.lokasi.gx, gy: tabibWarga!.lokasi.gy };
    const distTabib = Math.abs(w.lokasi.gx - targetTabib.gx) + Math.abs(w.lokasi.gy - targetTabib.gy);
    if (distTabib <= 2) {
      w.fase_siklus = "istirahat";
      w.aksi_sekarang = "beristirahat";
      w.sehat = 100;
      (w as any).healtpoint = 100;
      w.stamina = Math.min(100, w.stamina + 40);
      w.istirahat_sisa = 3; // Istirahat beberapa hari/jam game untuk pemulihan
      w.status_teks = "Diobati oleh Tabib. Sedang menjalani masa pemulihan…";
      w.tujuan = ctx.hunianTitik(w);
      w.interaksi = {
        jenis: "ngobrol",
        dengan: "Tabib",
        teks: "Minumlah ramuan herbal ini lalu beristirahatlah beberapa hari... lukamu telah sembuh!",
        sampai_jam: jam + 2,
      };
      w.progres_aksi_pct = 0;
      ctx.kabar.push({
        jenis: "sembuh",
        teks: `${w.nama} diobati di Pondok Tabib dan menjalani istirahat pemulihan.`,
        hari,
        dibuat_pada: new Date(),
      });
      return;
    } else {
      w.tujuan = targetTabib;
      w.node = null;
      w.fase_siklus = "jalan";
      w.aksi_sekarang = "berobat";
      w.status_teks = "Berjalan ke Pondok Tabib untuk diobati…";
      w.progres_aksi_pct = 0;
    }
  }

  // Stamina kritis -> PULANG DULU, baru istirahat di hunian (jangan beku
  // di tengah peta). Bila sudah di hunian, langsung istirahat.
  if (w.stamina < 15 && w.fase_siklus !== "istirahat") {
    w.daging_target = null;
    const titik = ctx.hunianTitik(w);
    if (w.lokasi.gx === titik.gx && w.lokasi.gy === titik.gy) {
      w.fase_siklus = "istirahat";
      w.istirahat_sisa = 1;
      w.aksi_sekarang = "beristirahat";
      w.status_teks = "Beristirahat, kelelahan…";
      w.progres_aksi_pct = 0;
    } else {
      w.tujuan = titik;
      w.node = null;
      w.fase_siklus = "kembali";
      w.aksi_sekarang = "pulang_istirahat";
      w.status_teks = "Pulang, kelelahan…";
      w.tempat_kerja = "kampung";
      w.progres_aksi_pct = 0;
    }
  }

  // Intent pulang (makan/istirahat/kabur) dipertahankan selama perjalanan
  // pulang — cabang "kembali" tidak boleh menimpanya jadi "membawa_hasil"
  // (bug label: warga pulang kelelahan tampil sebagai "membawa hasil").
  const intentPulang =
    w.aksi_sekarang === "pulang_istirahat" || w.aksi_sekarang === "pulang_makan" || w.aksi_sekarang === "kabur"
      ? w.aksi_sekarang
      : null;

  // Patroli penjaga (sebelum cabang jalan umum): penjaga berjalan dari
  // waypoint ke waypoint tanpa kumpul — tiba di waypoint -> waypoint
  // berikutnya (ring). Bukan node, bukan resource, tapi pekerjaan terlihat.
  if (w.peran === "penjaga" && w.fase_siklus === "jalan" && w.tujuan && w.node?.pseudo === "patroli") {
    const speed = kecepatanJalan(w.stat.agi, w.stat.sta, w.bakat);
    const r = gerak(w.lokasi, w.tujuan, speed, { jembatan: ctx.jembatan, rintangan: ctx.rintangan });
    w.lokasi = r.lokasi;
    w.sedang_berenang = r.berenang;
    w.stamina = Math.max(0, w.stamina - 3 - (r.berenang ? 4 : 0));
    w.lapar = Math.min(100, w.lapar + 4);
    w.aksi_sekarang = r.berenang ? "berenang" : "berpatroli";
    w.status_teks = r.berenang ? "Berenang saat patroli…" : "Berpatroli di sekitar kampung…";
    w.tempat_kerja = "kampung";
    w.progres_aksi_pct = 0;
    if (w.lokasi.gx === w.tujuan.gx && w.lokasi.gy === w.tujuan.gy) {
      const next = waypointPatroliBerikutnya(w.node);
      w.node = { kind: "padang_buruan", gx: next.gx, gy: next.gy, pseudo: "patroli" };
      w.tujuan = next;
    }
    return;
  }
  // RONDE 10 — mengambil daging tergeletak (SEBELUM cabang jalan umum
  // yang mensyaratkan node): jalan ke ubin daging, ambil, bawa pulang.
  // Bila daging sudah hilang (diambil orang lain / kedaluwarsa): pulang
  // biasa, jangan diam di ubin kosong.
  if (w.fase_siklus === "jalan" && w.tujuan && w.daging_target) {
    const dt = w.daging_target;
    const speed = kecepatanJalan(w.stat.agi, w.stat.sta, w.bakat);
    const r = gerak(w.lokasi, w.tujuan, speed, { jembatan: ctx.jembatan, rintangan: ctx.rintangan });
    w.lokasi = r.lokasi;
    w.sedang_berenang = r.berenang;
    w.stamina = Math.max(0, w.stamina - 3 - (r.berenang ? 4 : 0));
    w.lapar = Math.min(100, w.lapar + 4);
    w.aksi_sekarang = "mengambil_daging";
    w.status_teks = `Mengambil daging ${dt.jenis}…`;
    w.tempat_kerja = "berburu";
    w.progres_aksi_pct = 0;
    if (w.lokasi.gx === w.tujuan.gx && w.lokasi.gy === w.tujuan.gy) {
      const daging = (ctx.daging ?? []).find((d) => d._id === dt.id);
      const titikDaging = ctx.hunianTitik(w);
      if (daging) {
        ctx.dagingHapus?.add(daging._id);
        if (ctx.daging) ctx.daging = ctx.daging.filter((d) => d._id !== daging._id);
        w.membawa_daging = { jenis: daging.jenis, pangan: daging.pangan, kulit: daging.kulit };
        ctx.kabar.push({ jenis: "buru", teks: `${w.nama} mengambil daging ${daging.jenis}.`, hari, dibuat_pada: new Date() });
      } else {
        w.status_teks = "Daging sudah tidak ada, pulang…";
      }
      w.daging_target = null;
      w.node = null;
      w.tujuan = titikDaging;
      w.fase_siklus = "kembali";
      w.aksi_sekarang = daging ? "membawa_daging" : "pulang_istirahat";
      w.status_teks = daging ? "Membawa daging pulang…" : "Daging sudah tidak ada, pulang…";
      w.tempat_kerja = "kampung";
      w.progres_aksi_pct = 0;
    }
    return;
  }
  // RONDE 10 (lanjutan) — jalan KE paviliun (makan): tanpa node, tujuan
  // = tengah paviliun. Cabang khusus SEBELUM jalan umum (yang mensyaratkan
  // node). Tiba di tengah -> fase "makan" (makan di jam berikutnya).
  if (w.fase_siklus === "jalan" && w.tujuan && w.aksi_sekarang === "pulang_restoran" && ctx.restoran) {
    const speed = kecepatanJalan(w.stat.agi, w.stat.sta, w.bakat);
    const r = gerak(w.lokasi, w.tujuan, speed, { jembatan: ctx.jembatan, rintangan: rintanganUntuk(w, ctx) });
    w.lokasi = r.lokasi;
    w.sedang_berenang = r.berenang;
    w.stamina = Math.max(0, w.stamina - 3 - (r.berenang ? 4 : 0));
    w.lapar = Math.min(100, w.lapar + 4);
    w.aksi_sekarang = "pulang_restoran";
    w.status_teks = r.berenang ? "Berenang ke paviliun makan…" : "Berjalan ke paviliun makan…";
    w.tempat_kerja = "Paviliun Makan";
    w.progres_aksi_pct = 0;
    if (w.lokasi.gx === w.tujuan.gx && w.lokasi.gy === w.tujuan.gy) {
      w.fase_siklus = "makan";
      w.aksi_sekarang = "makan";
      w.status_teks = "Makan di paviliun…";
      w.tempat_kerja = "Paviliun Makan";
      w.tujuan = null;
      w.progres_aksi_pct = 0;
      // RONDE 13 — MAKAN BERSAMA (event bubble): bila ada warga lain
      // yang SUDAH makan di paviliun jam ini, keduanya dapat bubble
      // ngobrol singkat. Makan sendirian tidak memunculkan bubble.
      const temanMakan = (ctx.wargaSemua ?? []).find(
        (o) => o !== w && o.fase_siklus === "makan"
      );
      if (temanMakan) {
        if ((w.interaksi?.sampai_jam ?? -1) <= jam) {
          w.interaksi = { jenis: "ngobrol", dengan: temanMakan.nama, hasil: "imbang", teks: "Makan bersama!", sampai_jam: jam + 1 };
        }
        if ((temanMakan.interaksi?.sampai_jam ?? -1) <= jam) {
          temanMakan.interaksi = { jenis: "ngobrol", dengan: w.nama, hasil: "imbang", teks: "Makan bersama!", sampai_jam: jam + 1 };
        }
      }
    }
    return;
  }
  // RONDE 10 (lanjutan) — KELUAR dari paviliun setelah makan: jalan ke
  // ubin pintu luar, lalu lanjut kerja (atau pulang tidur bila malam).
  // Cabang khusus SEBELUM cabang kembali umum (yang selalu berakhir di
  // istirahat — salah untuk warga yang baru selesai makan).
  if (w.fase_siklus === "kembali" && w.tujuan && w.aksi_sekarang === "keluar_restoran" && ctx.restoran) {
    const speed = kecepatanJalan(w.stat.agi, w.stat.sta, w.bakat);
    const r = gerak(w.lokasi, w.tujuan, speed, { jembatan: ctx.jembatan, rintangan: rintanganUntuk(w, ctx) });
    w.lokasi = r.lokasi;
    w.sedang_berenang = r.berenang;
    w.stamina = Math.max(0, w.stamina - 3 - (r.berenang ? 4 : 0));
    w.lapar = Math.min(100, w.lapar + 4);
    w.aksi_sekarang = "keluar_restoran";
    w.status_teks = "Keluar dari paviliun…";
    w.tempat_kerja = "Paviliun Makan";
    w.progres_aksi_pct = 0;
    if (w.lokasi.gx === w.tujuan.gx && w.lokasi.gy === w.tujuan.gy) {
      w.tujuan = null;
      if (fase === "malam") {
        // Sudah malam saat keluar -> pulang tidur, jangan mulai kerja.
        const titik = ctx.hunianTitik(w);
        w.tujuan = titik;
        w.node = null;
        w.fase_siklus = "kembali";
        w.aksi_sekarang = "pulang_istirahat";
        w.status_teks = "Pulang tidur malam…";
        w.tempat_kerja = "kampung";
      } else if (ambilTargetKerja(w, ctx)) {
        // RONDE 20 — jalan atau kerja baru sudah diatur (ambilTargetKerja:
        // jalan dulu, baru kumpul biasa).
      } else if (terapkanBantu(w, ctx)) {
        // RONDE 14: Figo membantu (diutamakan atas santai umum).
      } else if (w.stamina >= 40 && w.lapar < 90) {
        // RONDE 13 — habis makan + tidak ada target kerja + kondisi
        // aman → SANTAI, bukan langsung istirahat di kampung.
        if (!mulaiSantai(w, ctx)) {
          w.node = null;
          w.fase_siklus = "istirahat";
          w.aksi_sekarang = "beristirahat";
          w.status_teks = "Beristirahat…";
          w.tempat_kerja = "kampung";
        }
      } else {
        // Tidak ada target kerja -> istirahat; cabang istirahat akan
        // mengarahkan pulang bila warga tidak di hunian (pengaman).
        w.node = null;
        w.fase_siklus = "istirahat";
        w.aksi_sekarang = "beristirahat";
        w.status_teks = "Beristirahat…";
        w.tempat_kerja = "kampung";
      }
      w.progres_aksi_pct = 0;
    }
    return;
  }
  // RONDE 14 — FIGO MEMBANTU (perjalanan + diam membantu di tempat):
  // Dipersempit ke pemegang tombak iblis (Figo) saat rebase ke r13:
  // santai umum r13 (node pseudo "santai") tetap menangani warga biasa,
  // termasuk 1-jam membantunya; node Figo null sehingga tidak pernah
  // masuk cabang santai.
  // warga bertombak iblis dengan fase jalan + aksi membantu + tanpa node
  // kerja berjalan ke ubin sebelah pekerja terdekat; bila sudah
  // bersebelahan, diam membantu di tempat (visual saja, tanpa efek
  // ekonomi); bila pekerja pergi/berhenti, cari lagi / kembali ke alur
  // normal. Preemption malam/lapar/stamina di atas sudah menang (fase
  // jalan ikut pulang), jadi cabang ini tidak pernah menahan pulang.
  if (punyaTombakIblis(w) && w.fase_siklus === "jalan" && w.aksi_sekarang === "membantu" && w.tujuan) {
    const bantu = cariBantuan(w, ctx);
    if (!bantu) {
      const target = pilihTargetKerja(w, ctx);
      if (target) {
        w.node = target.node;
        w.tujuan = target.tujuan;
        w.fase_siklus = "jalan";
        w.aksi_sekarang = "berjalan";
        w.status_teks = `Berjalan ke ${labelNode(target.node.kind)}…`;
        w.tempat_kerja = labelNode(target.node.kind);
        w.progres_aksi_pct = 0;
      } else {
        w.node = null;
        w.tujuan = null;
        w.fase_siklus = "istirahat";
        w.aksi_sekarang = "beristirahat";
        w.status_teks = "Beristirahat…";
        w.tempat_kerja = "kampung";
      }
      return;
    }
    const dx = Math.abs(w.lokasi.gx - bantu.pekerja.lokasi.gx);
    const dy = Math.abs(w.lokasi.gy - bantu.pekerja.lokasi.gy);
    if (Math.max(dx, dy) <= 1) {
      w.tujuan = { gx: w.lokasi.gx, gy: w.lokasi.gy };
      w.status_teks = `Membantu ${bantu.pekerja.nama} ${bantu.tugas}…`;
      w.tempat_kerja = "membantu";
      return;
    }
    const speed = kecepatanJalan(w.stat.agi, w.stat.sta, w.bakat);
    const r = gerak(w.lokasi, bantu.tujuan, speed, { jembatan: ctx.jembatan, rintangan: rintanganUntuk(w, ctx) });
    w.lokasi = r.lokasi;
    w.sedang_berenang = r.berenang;
    w.stamina = Math.max(0, w.stamina - 3 - (r.berenang ? 4 : 0));
    w.lapar = Math.min(100, w.lapar + 4);
    w.tujuan = bantu.tujuan;
    w.status_teks = `Membantu ${bantu.pekerja.nama} ${bantu.tugas}…`;
    w.tempat_kerja = "membantu";
    w.progres_aksi_pct = 0;
    return;
  }
  // RONDE 18 — JALAN (tim pinter membangun jalan): HARUS sebelum cabang
  // santai + jalan umum (yang akan mengubahnya jadi kumpul/santai).
  // Redirect malam/lapar/stamina di atas sudah jalan dulu + men-null-kan
  // node, jadi cabang ini selalu kondisi aman; 1 ubin selesai per jam
  // kerja (gratis — tenaga saja, stamina -2 lapar +2 seperti membantu).
  if (w.fase_siklus === "jalan" && w.tujuan && w.node?.pseudo === "jalan") {
    const speed = kecepatanJalan(w.stat.agi, w.stat.sta, w.bakat);
    const segmen = w.node.segmen ?? ctx.jalanRencana?.segmen ?? "jalan";
    if (w.lokasi.gx === w.tujuan.gx && w.lokasi.gy === w.tujuan.gy) {
      const key = `${w.tujuan.gx},${w.tujuan.gy}`;
      if (!ctx.jalanSelesai?.has(key)) {
        ctx.jalanBaru?.push({ gx: w.tujuan.gx, gy: w.tujuan.gy, segmen });
        ctx.jalanSelesai?.add(key);
      }
      w.stamina = Math.max(0, w.stamina - 2);
      w.lapar = Math.min(100, w.lapar + 2);
      w.progres_aksi_pct = 100;
      w.status_teks = `Membangun jalan ${segmen}…`;
      w.tempat_kerja = "jalan";
      // Lanjut ke ubin berikut dari rencana jam ini, atau kembali ke
      // alur normal (jam berikut memilih lagi: segmen berikut / kerja).
      const sisa = (ctx.jalanRencana?.tiles ?? []).filter(
        (t) => !ctx.jalanSelesai?.has(`${t.gx},${t.gy}`) && !ctx.jalanTugas?.has(`${t.gx},${t.gy}`)
      );
      if (sisa.length > 0 && ctx.jalanRencana?.segmen === segmen) {
        const nx = sisa[0];
        ctx.jalanTugas?.add(`${nx.gx},${nx.gy}`);
        w.node = { kind: "padang_buruan", gx: nx.gx, gy: nx.gy, pseudo: "jalan", segmen };
        w.tujuan = { gx: nx.gx, gy: nx.gy };
        w.fase_siklus = "jalan";
        w.aksi_sekarang = "bangun_jalan";
        w.status_teks = `Membangun jalan ${segmen}…`;
        w.tempat_kerja = "jalan";
        w.progres_aksi_pct = 0;
      } else {
        w.node = null;
        w.tujuan = null;
        w.fase_siklus = "istirahat";
        w.aksi_sekarang = "beristirahat";
        w.status_teks = "Beristirahat…";
        w.tempat_kerja = "kampung";
        w.progres_aksi_pct = 0;
      }
      return;
    }
    const r = gerak(w.lokasi, w.tujuan, speed, { jembatan: ctx.jembatan, rintangan: rintanganUntuk(w, ctx) });
    w.lokasi = r.lokasi;
    w.sedang_berenang = r.berenang;
    w.stamina = Math.max(0, w.stamina - 3 - (r.berenang ? 4 : 0));
    w.lapar = Math.min(100, w.lapar + 4);
    w.aksi_sekarang = "bangun_jalan";
    w.status_teks = `Menuju jalan ${segmen}…`;
    w.tempat_kerja = "jalan";
    w.progres_aksi_pct = 0;
    return;
  }
  // RONDE 13 — SANTAI (idle aktif): jalan santai / membantu. Cabang ini
  // HARUS sebelum cabang jalan umum (yang akan mengubah santai jadi
  // kumpul + stok gratis — dilarang). Redirect malam/lapar/stamina di
  // atas sudah jalan dulu, jadi santai di sini selalu kondisi aman.
  if (w.fase_siklus === "jalan" && w.tujuan && w.node?.pseudo === "santai") {
    const speed = kecepatanJalan(w.stat.agi, w.stat.sta, w.bakat);
    if (w.aksi_sekarang === "membantu") {
      // Satu jam membantu di sebelah pekerja (visual saja, tanpa stok).
      w.stamina = Math.max(0, w.stamina - 2);
      w.lapar = Math.min(100, w.lapar + 2);
      w.progres_aksi_pct = Math.min(100, w.progres_aksi_pct + 100);
      if (w.progres_aksi_pct >= 100) {
        if (ambilTargetKerja(w, ctx)) {
          // Jalan atau kerja baru sudah diatur.
        } else if (!mulaiSantai(w, ctx)) {
          w.node = null;
          w.tujuan = null;
          w.fase_siklus = "istirahat";
          w.aksi_sekarang = "beristirahat";
          w.status_teks = "Beristirahat…";
          w.tempat_kerja = "kampung";
        }
        w.progres_aksi_pct = 0;
      }
      return;
    }
    const r = gerak(w.lokasi, w.tujuan, speed, { jembatan: ctx.jembatan, rintangan: rintanganUntuk(w, ctx) });
    w.lokasi = r.lokasi;
    w.sedang_berenang = r.berenang;
    w.stamina = Math.max(0, w.stamina - 3 - (r.berenang ? 4 : 0));
    w.lapar = Math.min(100, w.lapar + 4);
    w.aksi_sekarang = "jalan_santai";
    w.progres_aksi_pct = 0;
    if (w.lokasi.gx === w.tujuan.gx && w.lokasi.gy === w.tujuan.gy) {
      // Tiba: kerja dulu (ada target → kerja); kalau tidak, santai lagi.
      // Bantu: pekerja masih kumpul dalam 3 tile → 1 jam membantu.
      const target = pilihTargetKerja(w, ctx);
      if (target) {
        w.node = target.node;
        w.tujuan = target.tujuan;
        w.fase_siklus = "jalan";
        w.aksi_sekarang = "berjalan";
        w.status_teks = `Berjalan ke ${labelNode(target.node.kind)}…`;
        w.tempat_kerja = labelNode(target.node.kind);
        if (target.node.pseudo === "sungai") { w.status_teks = "Berjalan ke sungai…"; w.tempat_kerja = "sungai"; }
        else if (target.node.pseudo === "ladang") { w.status_teks = "Berjalan ke ladang…"; w.tempat_kerja = "ladang"; }
        else if (target.node.pseudo === "restoran") { w.status_teks = "Berjalan ke paviliun makan…"; w.tempat_kerja = "Paviliun Makan"; }
        else if (target.node.darurat) { w.status_teks = "Berjalan mencari makan darurat…"; }
      } else if (w.node.bantu) {
        const pekerja = (ctx.wargaSemua ?? []).find(
          (o) => o.nama === w.node?.bantu && o.fase_siklus === "kumpul"
        );
        const dekat = pekerja
          ? Math.abs(pekerja.lokasi.gx - w.lokasi.gx) + Math.abs(pekerja.lokasi.gy - w.lokasi.gy) <= 3
          : false;
        if (dekat && pekerja) {
          w.aksi_sekarang = "membantu";
          w.status_teks = `Membantu ${pekerja.nama}…`;
          w.tempat_kerja = "kampung";
          w.progres_aksi_pct = 0;
        } else if (!mulaiSantai(w, ctx)) {
          w.node = null;
          w.tujuan = null;
          w.fase_siklus = "istirahat";
          w.aksi_sekarang = "beristirahat";
          w.status_teks = "Beristirahat…";
          w.tempat_kerja = "kampung";
        }
      } else if (!mulaiSantai(w, ctx)) {
        w.node = null;
        w.tujuan = null;
        w.fase_siklus = "istirahat";
        w.aksi_sekarang = "beristirahat";
        w.status_teks = "Beristirahat…";
        w.tempat_kerja = "kampung";
      }
      w.progres_aksi_pct = 0;
    }
    return;
  }
  if (w.fase_siklus === "jalan" && w.tujuan && w.node) {
    const speed = kecepatanJalan(w.stat.agi, w.stat.sta, w.bakat);
    const r = gerak(w.lokasi, w.tujuan, speed, { jembatan: ctx.jembatan, rintangan: rintanganUntuk(w, ctx) });
    w.lokasi = r.lokasi;
    w.sedang_berenang = r.berenang;
    w.stamina = Math.max(0, w.stamina - 3 - (r.berenang ? 4 : 0));
    w.lapar = Math.min(100, w.lapar + 4);
    w.aksi_sekarang = r.berenang ? "berenang" : "berjalan";
    w.status_teks = r.berenang ? "Berenang menyeberangi sungai…" : `Berjalan ke ${labelNode(w.node.kind)}…`;
    w.tempat_kerja = labelNode(w.node.kind);
    w.progres_aksi_pct = 0;
    // Label target khusus (pseudo/darurat) menimpa label node kendaraan.
    if (w.node.pseudo === "sungai") {
      w.status_teks = "Berjalan ke sungai…";
      w.tempat_kerja = "sungai";
    } else if (w.node.pseudo === "ladang") {
      w.status_teks = "Berjalan ke ladang…";
      w.tempat_kerja = "ladang";
    } else if (w.node.pseudo === "restoran") {
      w.status_teks = "Berjalan ke paviliun makan…";
      w.tempat_kerja = "Paviliun Makan";
    } else if (w.node.darurat) {
      w.status_teks = "Berjalan mencari makan darurat…";
      w.tempat_kerja = labelNode(w.node.kind);
    }
    if (w.lokasi.gx === w.tujuan.gx && w.lokasi.gy === w.tujuan.gy) {
      // RONDE 10: node ternyata habis saat tiba -> cari node lain /
      // pulang, jangan kumpul di bekas kosong.
      if (periksaNodeHabis(w, ctx)) return;
      w.fase_siklus = "kumpul";
      w.aksi_sekarang = "mengumpulkan";
      w.status_teks = statusKumpul(w.peran, w.node.kind);
      w.progres_aksi_pct = 0;
      if (w.node.pseudo === "sungai") {
        w.status_teks = "Memancing di sungai…";
        w.tempat_kerja = "sungai";
      } else if (w.node.pseudo === "ladang") {
        w.status_teks = "Bercocok tanam di ladang…";
        w.tempat_kerja = "ladang";
      } else if (w.node.pseudo === "restoran") {
        w.status_teks = "Memasak di paviliun…";
        w.tempat_kerja = "Paviliun Makan";
      } else if (w.node.darurat) {
        w.status_teks = "Mencari makan darurat…";
      }
    }
    return;
  }
  if (w.fase_siklus === "kumpul" && w.node) {
    // RONDE 10: node habis di tengah jalan (diambil warga lain) ->
    // alihkan ke node baru / pulang, jangan kumpul di bekas kosong.
    if (periksaNodeHabis(w, ctx)) return;
    // RONDE 10 (lanjutan) — MEMASAK di paviliun (bukan kumpul node):
    // tiap jam di dapur, juru masak mengubah 1 pangan -> 1 hidangan
    // (maks KAP_HIDANGAN). Bila tidak bisa masak (pangan habis / dapur
    // penuh), pilihTargetKerja SUDAH jatuh ke kumpul biasa (syarat
    // masak tak terpenuhi di sana) — jadi alihkan ke sana, jangan diam
    // di dapur. Tanpa paviliun (ctx.restoran null) blok ini tak jalan.
    if (w.node.pseudo === "restoran") {
      const r = ctx.restoran;
      if (r && (ctx.stok.pangan ?? 0) > 0 && (r.hidangan ?? 0) < KAP_HIDANGAN) {
        ctx.stok.pangan -= 1;
        r.hidangan = (r.hidangan ?? 0) + 1;
        ctx.restoranBerubah = true;
        w.aksi_sekarang = "memasak";
        w.status_teks = "Memasak di paviliun…";
        w.tempat_kerja = "Paviliun Makan";
        w.progres_aksi_pct = 100;
        w.stamina = Math.max(0, w.stamina - 7);
        w.lapar = Math.min(100, w.lapar + 6);
      } else {
        if (ambilTargetKerja(w, ctx)) {
          // Jalan atau kerja baru sudah diatur.
        } else {
          const titik = ctx.hunianTitik(w);
          w.tujuan = titik;
          w.node = null;
          w.fase_siklus = "kembali";
          w.aksi_sekarang = "pulang_istirahat";
          w.status_teks = "Tidak ada kerja, pulang…";
          w.tempat_kerja = "kampung";
        }
        w.progres_aksi_pct = 0;
      }
      return;
    }
    // Bila stok lumbung sudah penuh, hentikan kerja dan langsung rehat santai
    if (terapkanRehatStokPenuh(w, ctx)) {
      return;
    }

    // Darurat di luar peran (mis. penebang kumpul beri) bekerja 0.7x;
    // peran yang memang kumpul pangan tetap pakai fit normal.
    const fitEff =
      w.node.darurat && !(peran?.nodeKinds ?? []).includes(w.node.kind) ? 0.7 : fit;
    // RONDE 9 bakat: INT (Si Cerdik) kumpul 10% lebih cepat.
    const laju = lajuKumpul(statFokus) * fitEff * malam * cuacaM * bonusPerkakas(w) * pengaliKumpulBakat(w.bakat);
    w.progres_aksi_pct = Math.min(100, w.progres_aksi_pct + laju);
    w.aksi_sekarang = "mengumpulkan";
    w.status_teks = statusKumpul(w.peran, w.node.kind);
    w.tempat_kerja = labelNode(w.node.kind);
    w.stamina = Math.max(0, w.stamina - 5);
    w.lapar = Math.min(100, w.lapar + 6);
    if (w.node.pseudo === "sungai") {
      w.status_teks = "Memancing di sungai…";
      w.tempat_kerja = "sungai";
    } else if (w.node.pseudo === "ladang") {
      w.status_teks = "Bercocok tanam di ladang…";
      w.tempat_kerja = "ladang";
    } else if (w.node.darurat) {
      w.status_teks = "Mencari makan darurat…";
    }
    if (w.progres_aksi_pct >= 100) {
      const hasil = nodeHasil(w.node.kind);
      // STR kini hanya memengaruhi stamina panen, bukan jumlah hasil
      // (aturan baru: jumlah dari roll harian + cap, lihat di bawah).
      const strVal = Number(w.stat?.str ?? 0);
      const bonusStr = Math.floor(strVal / 3);
      let jumlah = rollHasilKumpul(hasil.resource, w);
      // RONDE 20 — IKAN: tiap tangkapan mengurangi stok ikan sungai;
      // bila sungai sepi, ronde ini tidak ada hasil (bukan hasil gratis).
      let ikanHabis = false;
      if (w.node.pseudo === "sungai") {
        if ((ctx.ikanSungai ?? IKAN_CAP) > 0) {
          ctx.ikanSungai = (ctx.ikanSungai ?? IKAN_CAP) - 1;
        } else {
          jumlah = 0;
          ikanHabis = true;
        }
      }

      // Pengurasan stamina realistis: dasar 25 stamina + 10 per bonusStr
      const kurasStaminaPanen = 25 + bonusStr * 10;
      w.stamina = Math.max(0, w.stamina - kurasStaminaPanen);

      // Juru masak: masakan lebih bergizi (x1.5 pangan).
      if (w.peran === "juru_masak" && hasil.resource === "pangan") jumlah = Math.round(jumlah * 1.5);
      // RONDE 15 — satu ronde = satu node (SISA_NODE_AWAL 1): hasil
      // per ronde dikali 5 supaya TOTAL per node PERSIS sama dengan
      // 5 ronde lama untuk penebang yang sama (bonus ikut dikali,
      // pembulatan juru masak sudah terjadi sebelum dikali — identik).
      // Beda penebang antar ronde dulu memberi total berbeda; kini satu
      // penebang x5 — rata-rata sama, per node bisa beda tipis.
      // PENGECUALIAN: node pseudo (sungai/ladang/restoran) TIDAK habis
      // (terbarukan) -> pengali 1, kalau tidak ekonomi nelayan/petani
      // ikut terlipat 5 diam-diam.
      const pengaliRonde = 1;
      jumlah = jumlah * pengaliRonde;
      // Cap harian dulu, baru cap gudang (keduanya via helper clamp).
      const jumlahCapHari = Math.min(jumlah, sisaCapHarian(w, hasil.resource, hari));
      const tambah = tambahStokClamp(ctx, hasil.resource, jumlahCapHari);
      catatKumpulHarian(w, hasil.resource, tambah, hari);

      let kulitTotal = hasil.kulitBonus;
      if (w.peran === "penenun" && hasil.kulitBonus > 0) kulitTotal += 2;
      kulitTotal = kulitTotal * pengaliRonde;
      let teks = ikanHabis
        ? `${w.nama} memancing di sungai, tapi belum ada ikan yang menyangkut.`
        : tambah > 0
          ? `${w.nama} membawa ${tambah} ${hasil.resource} ke lumbung.`
          : `${w.nama} membawa ${hasil.resource}, tetapi lumbung sudah penuh!`;

      if (kulitTotal > 0) {
        const kulitCapHari = Math.min(kulitTotal, sisaCapHarian(w, "kulit", hari));
        const tambahKulit = tambahStokClamp(ctx, "kulit", kulitCapHari);
        catatKumpulHarian(w, "kulit", tambahKulit, hari);
        teks = `${w.nama} membawa ${tambah} pangan dan ${tambahKulit} kulit ke lumbung.`;
      }
      // Pemanjat: buah dari pohon (+1 pangan) di samping kayu.
      // ATURAN BARU: bonus ini juga kena cap harian + cap gudang.
      if (w.peran === "pemanjat" && hasil.resource === "kayu") {
        const buahCapHari = Math.min(pengaliRonde, sisaCapHarian(w, "pangan", hari));
        const tambahBuah = tambahStokClamp(ctx, "pangan", buahCapHari);
        catatKumpulHarian(w, "pangan", tambahBuah, hari);
        if (tambahBuah > 0) teks += ` + ${tambahBuah} buah.`;
      }
      // Tabib/peramu: ramuannya memulihkan sehat kampung sedikit.
      if (w.peran === "tabib" || w.peran === "peramu") {
        const heal = w.peran === "peramu" ? 3 : 2;
        for (const o of ctx.wargaSemua) o.sehat = Math.min(100, o.sehat + heal);
      }
      ctx.kabar.push({ jenis: "kumpul", teks, hari, dibuat_pada: new Date() });
      // Deplesi node — DILEWATI untuk target pseudo (sungai/ladang tidak
      // habis; mereka sumber terbarukan, bukan node).
      // RONDE 15 — rantai kumpul: bila node TUMBANG di ronde ini (sisa
      // habis) + siang + fit, warga langsung jalan ke target berikut
      // (bukan pulang dulu) — sesuai permintaan user "pohon ilang terus
      // nyari yang lain". Stok SUDAH dikredit di atas, jadi rantai tidak
      // mengubah ekonomi; redirect malam/lapar/stamina tetap menang
      // (guard di bawah + preemption di step berikutnya).
      let nodeTumbang = false;
      if (!w.node.pseudo) {
        const nkey = `${w.node.gx},${w.node.gy}`;
        const sisa = (ctx.nodeSisa.get(nkey) ?? SISA_NODE_AWAL) - 1;
        ctx.nodeSisa.set(nkey, sisa);
        if (sisa <= 0) {
          nodeTumbang = true;
          // RONDE 10: node habis -> HILANG dari ubin lama + SPAWN BARU
          // di lokasi lain pada jadwal regrow (bukan tumbuh di tempat
          // yang sama). Ubin lama tetap sisa 0 selamanya.
          const taken = new Set<string>(ctx.nodeTilesAll ?? []);
          const spawn = pilihLokasiRespawn(w.node.kind, { gx: w.node.gx, gy: w.node.gy }, jam, taken, ctx.rintangan);
          if (spawn && ctx.nodeSpawnTertunda) {
            ctx.nodeSpawnTertunda.set(nkey, { kind: spawn.kind, gx: spawn.gx, gy: spawn.gy, jam: jadwalRegrow(jam, w.node.gx, w.node.gy) });
            if (ctx.nodeTilesAll) ctx.nodeTilesAll.add(`${spawn.gx},${spawn.gy}`);
            ctx.kabar.push({ jenis: "node_habis", teks: `Sumber ${labelNode(w.node.kind)} di (${w.node.gx},${w.node.gy}) habis — sumber baru akan muncul di (${spawn.gx},${spawn.gy}).`, hari, dibuat_pada: new Date() });
          } else {
            // Fallback (hampir mustahil: peta penuh) — regrow di tempat.
            ctx.nodeRegrow.set(nkey, jadwalRegrow(jam, w.node.gx, w.node.gy));
            ctx.kabar.push({ jenis: "node_habis", teks: `Sumber ${labelNode(w.node.kind)} di (${w.node.gx},${w.node.gy}) habis — warga mencari sumber baru.`, hari, dibuat_pada: new Date() });
          }
        }
      }
      // RONDE 15 — rantai kumpul (lihat atas): node tumbang + fit ->
      // langsung target berikut; kalau tidak, pulang seperti biasa.
      let rantai = false;
      // Bila stamina sudah rendah (< 30): lelah dan langsung pulang beristirahat (sehari 3-6 bahan saja)
      if (w.stamina < 30) {
        const titik = ctx.hunianTitik(w);
        w.tujuan = titik;
        w.node = null;
        w.fase_siklus = "kembali";
        w.aksi_sekarang = "pulang_istirahat";
        w.status_teks = "Lelah setelah bekerja keras, pulang beristirahat…";
        w.tempat_kerja = "kampung";
        w.progres_aksi_pct = 0;
        return;
      }
      if (nodeTumbang && fase !== "malam" && w.stamina >= 40 && w.lapar < 90) {
        if (ambilTargetKerja(w, ctx)) {
          rantai = true;
        }
      }
      if (!rantai) {
        const titik = ctx.hunianTitik(w);
        w.tujuan = titik;
        w.node = null;
        w.fase_siklus = "kembali";
        w.aksi_sekarang = "membawa_hasil";
        w.status_teks = "Membawa hasil ke kampung…";
        w.tempat_kerja = "kampung";
        w.progres_aksi_pct = 0;
      }
    }
    return;
  }
  if (w.fase_siklus === "kembali" && w.tujuan) {
    const speed = kecepatanJalan(w.stat.agi, w.stat.sta, w.bakat);
    const r = gerak(w.lokasi, w.tujuan, speed, { jembatan: ctx.jembatan, rintangan: rintanganUntuk(w, ctx) });
    w.lokasi = r.lokasi;
    w.sedang_berenang = r.berenang;
    w.stamina = Math.max(0, w.stamina - 3 - (r.berenang ? 4 : 0));
    w.lapar = Math.min(100, w.lapar + 4);
    if (intentPulang === "kabur") {
      // Kabur (kalah gelud/diserang): aksi + status flee dipertahankan
      // sampai tiba di kampung — jangan ditimpa "membawa hasil".
    } else if (r.berenang) {
      w.aksi_sekarang = "berenang";
      w.status_teks =
        intentPulang === "pulang_makan"
          ? "Berenang pulang makan…"
          : intentPulang === "pulang_istirahat"
            ? "Berenang pulang, kelelahan…"
            : "Berenang membawa hasil…";
    } else if (intentPulang === "pulang_istirahat") {
      w.aksi_sekarang = "pulang_istirahat";
      w.status_teks = "Pulang, kelelahan…";
    } else if (intentPulang === "pulang_makan") {
      w.aksi_sekarang = "pulang_makan";
      w.status_teks = "Pulang makan, lapar sekali…";
    } else {
      w.aksi_sekarang = "membawa_hasil";
      w.status_teks = "Membawa hasil ke kampung…";
    }
    w.tempat_kerja = "kampung";
    w.progres_aksi_pct = 0;
    if (w.lokasi.gx === w.tujuan.gx && w.lokasi.gy === w.tujuan.gy) {
      // RONDE 10: daging tiba di kampung -> BARU jadi stok (bukan saat
      // hewan jatuh). Tanpa ini, berburu = instan seperti dulu.
      if (w.membawa_daging) {
        const md = w.membawa_daging;
        // ATURAN BARU: buruan juga kena cap harian + cap gudang.
        const dagingPangan = Math.min(md.pangan, sisaCapHarian(w, "pangan", hari));
        const tambahDagingPangan = tambahStokClamp(ctx, "pangan", dagingPangan);
        catatKumpulHarian(w, "pangan", tambahDagingPangan, hari);
        const dagingKulit = Math.min(md.kulit, sisaCapHarian(w, "kulit", hari));
        const tambahDagingKulit = tambahStokClamp(ctx, "kulit", dagingKulit);
        catatKumpulHarian(w, "kulit", tambahDagingKulit, hari);
        ctx.kabar.push({ jenis: "buru", teks: `${w.nama} membawa pulang daging ${md.jenis} (${tambahDagingPangan} pangan + ${tambahDagingKulit} kulit).`, hari, dibuat_pada: new Date() });
        w.membawa_daging = null;
      }
      w.fase_siklus = "istirahat";
      w.istirahat_sisa = 1;
      w.aksi_sekarang = "beristirahat";
      w.status_teks = w.hunian ? `Beristirahat di ${w.hunian.label}…` : "Beristirahat di dekat hunian…";
      w.tempat_kerja = w.hunian ? w.hunian.label : "dekat hunian";
      w.tujuan = null;
    }
    return;
  }
  // RONDE 10 (lanjutan) — MAKAN di paviliun: 1 jam = 1 porsi. Hidangan
  // (dimasak juru masak) didahulukan: lapar -60. Bila hidangan habis,
  // makan pangan biasa: lapar -40 (sama seperti makan di kampung).
  // Bila paviliun kosong total, tidak makan — langsung keluar, lalu
  // logika paceklik/kerja yang mengambil alih jam berikutnya. Setelah
  // makan (atau gagal makan), SELALU keluar lewat pintu (fase kembali +
  // aksi keluar_restoran) — tidak pernah teleport, tidak pernah tidur
  // di paviliun. Pengaman: bila ctx.restoran hilang (tidak mungkin di
  // live — placement tak pernah dihapus), pulangkan saja.
  if (w.fase_siklus === "makan") {
    const r = ctx.restoran;
    if (!r) {
      const titik = ctx.hunianTitik(w);
      w.tujuan = titik;
      w.node = null;
      w.fase_siklus = "kembali";
      w.aksi_sekarang = "pulang_istirahat";
      w.status_teks = "Paviliun tidak ada, pulang…";
      w.tempat_kerja = "kampung";
      w.progres_aksi_pct = 0;
      return;
    }
    if ((r.hidangan ?? 0) > 0) {
      r.hidangan = (r.hidangan ?? 0) - 1;
      ctx.restoranBerubah = true;
      w.lapar = Math.max(0, w.lapar - LAPAR_HIDANGAN);
      w.status_teks = "Makan hidangan di paviliun…";
    } else if ((ctx.stok.pangan ?? 0) > 0) {
      ctx.stok.pangan -= 1;
      w.lapar = Math.max(0, w.lapar - LAPAR_PANGAN_RESTORAN);
      w.status_teks = "Makan di paviliun…";
    } else {
      w.status_teks = "Paviliun kosong, tidak ada makanan…";
    }
    w.sehat = Math.min(100, w.sehat + 2);
    w.stamina = Math.min(100, w.stamina + 10);
    w.aksi_sekarang = "keluar_restoran";
    w.fase_siklus = "kembali";
    w.tujuan = pintuRestoran(r);
    w.tempat_kerja = "Paviliun Makan";
    w.progres_aksi_pct = 0;
    return;
  }
  if (w.fase_siklus === "istirahat") {
    // Penyembuhan warisan: warga yang terlanjur istirahat di tengah peta
    // (bukan di hunian) diarahkan pulang dulu — istirahat hanya di hunian.
    const titik = ctx.hunianTitik(w);
    if (w.lokasi.gx !== titik.gx || w.lokasi.gy !== titik.gy) {
      w.tujuan = titik;
      w.node = null;
      w.fase_siklus = "kembali";
      w.aksi_sekarang = "pulang_istirahat";
      w.status_teks = "Pulang, kelelahan…";
      w.tempat_kerja = "kampung";
      w.progres_aksi_pct = 0;
      return;
    }
    w.aksi_sekarang = "beristirahat";
    w.status_teks = w.hunian ? `Beristirahat di ${w.hunian.label}…` : "Beristirahat di dekat hunian…";
    w.tempat_kerja = w.hunian ? w.hunian.label : "dekat hunian";
    w.progres_aksi_pct = 0;
    // RONDE 9 bakat: STA (Si Tahan Banting) pulih 35/jam, bukan 25/jam.
    w.stamina = Math.min(100, w.stamina + pulihStaminaBakat(w.bakat));
    w.lapar = Math.min(100, w.lapar + 2);
    // Pulih sehat saat istirahat — pelan bila kelaparan, bukan nol:
    // tanpa ini warga kelaparan + pangan kosong tidak pernah bangun
    // (deadlock: sehat < 30 memblokir bangun, pangan 0 memblokir makan).
    if (w.sehat < 100) w.sehat = Math.min(100, w.sehat + (w.lapar < 70 ? 2 : 1));
    // Makan: lapar >= 50 + stok pangan ada -> makan 1 pangan.
    // RONDE 20: seporsi makan lebih mengenyangkan (-55, dulu -40) —
    // bagian dari gampangin pangan sedikit (lebih jarang makan).
    if (w.lapar >= 50 && (ctx.stok.pangan ?? 0) > 0) {
      ctx.stok.pangan -= 1;
      w.lapar = Math.max(0, w.lapar - 55);
      w.sehat = Math.min(100, w.sehat + 2);
      w.stamina = Math.min(100, w.stamina + 10);
      w.status_teks = "Makan di kampung…";
    }
    // Crafting: 1x/hari saat istirahat. Perkakas peran dulu, lalu busur pemburu.
    const alat = perkakasPeran(w.peran);
    if (levelPerkakas(w, alat) < 1) {
      const resep = RESEP_PERKAKAS[alat];
      if (resep && cukupBiaya(ctx.stok, resep)) {
        for (const [k, v] of Object.entries(resep)) ctx.stok[k as keyof Stok] -= v ?? 0;
        const ada = (w.perkakas ?? []).find((p) => p.jenis === alat);
        if (ada) ada.level = 1;
        else (w.perkakas ??= []).push({ jenis: alat, level: 1 });
        ctx.kabar.push({ jenis: "craft", teks: `${w.nama} membuat ${LABEL_ALAT[alat] ?? alat} baru.`, hari, dibuat_pada: new Date() });
      }
    } else if (w.peran === "pemburu" && levelPerkakas(w, "busur") < 1) {
      const resep = RESEP_PERKAKAS["busur"];
      if (resep && cukupBiaya(ctx.stok, resep)) {
        for (const [k, v] of Object.entries(resep)) ctx.stok[k as keyof Stok] -= v ?? 0;
        (w.perkakas ??= []).push({ jenis: "busur", level: 1 });
        ctx.kabar.push({ jenis: "craft", teks: `${w.nama} membuat Busur baru untuk berburu.`, hari, dibuat_pada: new Date() });
      }
    }
    if (w.istirahat_sisa > 0) {
      w.istirahat_sisa -= 1;
      return;
    }
    // RONDE 9 — TIDUR MALAM PENUH: selama fase malam, warga TIDAK
    // bangun (recovery/makan/crafting di atas tetap jalan tiap jam).
    // Bangun kembali jam 06:00 lewat logika normal di bawah.
    if (fase === "malam") {
      return;
    }
    // Lanjut kerja hanya bila stamina + sehat cukup; kalau tidak, istirahat lagi.
    // PENGECUALIAN deadlock: stamina sudah penuh (>= 95) -> bangun walau
    // sehat < 30 — warga harus keluar mencari pangan, bukan membusuk di
    // gubuk selamanya saat pangan kosong (sehat tidak membunuh).
    if (w.stamina < 40 || (w.sehat < 30 && w.stamina < 95)) {
      w.istirahat_sisa = 1;
      return;
    }
    if (ambilTargetKerja(w, ctx)) {
      // Jalan atau kerja baru sudah diatur.
    } else if (terapkanBantu(w, ctx)) {
      // RONDE 14: Figo membantu (diutamakan atas santai umum).
    } else if (w.lapar < 90) {
      // RONDE 13 — tidak ada target kerja (node peran habis) + siang +
      // stamina cukup + tidak lapar → SANTAI, bukan duduk di hunian
      // sampai node respawn. Lapar ≥90 tetap istirahat (menunggu makan).
      mulaiSantai(w, ctx);
    }
    return;
  }
  // State tak dikenal / warga baru tanpa node: kirim ke target kerja.
  if (ambilTargetKerja(w, ctx)) {
    // Jalan atau kerja baru sudah diatur.
  } else if (terapkanBantu(w, ctx)) {
    // RONDE 14: Figo membantu (diutamakan atas santai umum).
  } else if (faseDariJam(jam % 24) !== "malam" && w.stamina >= 40 && w.lapar < 90) {
    // RONDE 13 — fallthrough tanpa target + kondisi aman → SANTAI
    // (bukan berdiri diam di tempat sampai target muncul).
    mulaiSantai(w, ctx);
  }
}

// Hewan: mengembara + reaksi terhadap warga terdekat.
// Jinak: kabur. Buas: mendekat lalu menyerang (warga kabur) atau dilawan
// pemburu (duel; menang -> hewan diburu). Penjaga mengusir hewan buas.
export function stepHewan(h: HewanDoc, jam: number, ctx: SimCtx): void {
  const hari = Math.floor(jam / 24);
  const def: HewanDef | undefined = hewanById(h.jenis);
  if (!def) return;
  let dekat: Warga | null = null;
  let dekatD = Infinity;
  for (const w of ctx.wargaSemua) {
    const d = Math.abs(w.lokasi.gx - h.gx) + Math.abs(w.lokasi.gy - h.gy);
    if (d < dekatD) {
      dekatD = d;
      dekat = w;
    }
  }
  const aggroRadius = Math.max(4, def.jarakReaksi);
  if (dekat && dekatD <= aggroRadius) {
    // Jinak kabur; buas pun KABUR bila yang terdekat adalah penjaga
    // (penjaga kampung mengusir hewan buas yang mendekati kampung).
    if (def.jinak || dekat.peran === "penjaga") {
      // r38: hewan jinak kabur sekejap saja (JARAK_KABUR_JINAK), bukan
      // 120-150 tile/jam tanpa henti — kalau tidak, mangsa tak pernah
      // terkejar dan HP-nya tidak pernah berkurang. Hewan buas yang
      // diusir penjaga tetap kabur sekencang-kencangnya.
      const kecKabur = def.jinak ? Math.min(def.kecepatan, JARAK_KABUR_JINAK) : def.kecepatan;
      const p = gerakMenjauh({ gx: h.gx, gy: h.gy }, dekat.lokasi, kecKabur, ctx.rintangan);
      h.gx = p.gx;
      h.gy = p.gy;
      return;
    }
    // Buas: mendekat.
    const r = gerak({ gx: h.gx, gy: h.gy }, dekat.lokasi, def.kecepatan, { jembatan: ctx.jembatan, rintangan: ctx.rintangan });
    h.gx = r.lokasi.gx;
    h.gy = r.lokasi.gy;
    const d2 = Math.abs(dekat.lokasi.gx - h.gx) + Math.abs(dekat.lokasi.gy - h.gy);
    if (d2 <= 1) {
      // RONDE 14: raja iblis bertombak ikut duel hewan buas (tanpa syarat
      // stamina — skornya 4495 vs ambang 14/18/22, selalu menang,
      // lalu daging seperti biasa). r38: SEMUA warga boleh melawan
      // hewan buas bila stamina cukup (dulu hanya pemburu) — warga
      // yang skornya kalah tetap kabur seperti dulu.
      if (dekat.stamina >= 20 || punyaTombakIblis(dekat)) {
        // Duel pemburu vs hewan buas.
        const skor = skorGelud(dekat) + (levelPerkakas(dekat, "tombak") >= 1 ? 5 : 0) + (levelPerkakas(dekat, "busur") >= 1 ? 4 : 0);
        const lawan = 14 + (def.id === "beruang" ? 8 : def.id === "serigala" ? 4 : 0);
        if (skor >= lawan) {
          // RONDE 15 — HP hewan buas juga berlaku: duel menang = 1 hit
          // (damageBerburu); HP 0 baru JATUH -> DAGING (alur r10).
          // HP tersisa -> hewan TETAP hidup dengan luka (persist di DB),
          // pemburu mengincarnya lagi jam berikut (target_hewan) — TIDAK
          // kabur (kabur hanya untuk duel kalah / bukan pemburu di
          // bawah). Tombak iblis (999) selalu HP 0 -> daging langsung.
          // HP WARGA TIDAK DIUBAH (user minta HP hewan saja; duel warga
          // tetap pakai stamina/sehat lama di jalur kabur).
          const hpSisa = hpHewan(h, def.hp) - damageBerburu(dekat);
          if (hpSisa > 0) {
            h.hp = hpSisa;
            dekat.target_hewan = String(h._id);
            dekat.status_teks = `Melukai ${def.label}! (HP ${hpSisa}/${def.hp})`;
            dekat.tempat_kerja = "berburu";
            return;
          }
          // RONDE 10: hewan JATUH -> DAGING tergeletak (bukan stok
          // instan). Pemburu mengambil + membawa pulang (cabang daging
          // di stepWarga + konversi stok saat tiba di kampung).
          ctx.hewanHilang.add(String(h._id));
          const dagingId = `daging-${jam}-${String(h._id)}`;
          if (ctx.daging) ctx.daging.push({ _id: dagingId, jenis: def.label, gx: h.gx, gy: h.gy, pangan: def.pangan, kulit: def.kulit, dibuat_jam: jam });
          dekat.target_hewan = null;
          dekat.daging_target = { id: dagingId, gx: h.gx, gy: h.gy, jenis: def.label, pangan: def.pangan, kulit: def.kulit };
          dekat.tujuan = { gx: h.gx, gy: h.gy };
          dekat.node = null;
          dekat.fase_siklus = "jalan";
          dekat.aksi_sekarang = "mengambil_daging";
          dekat.status_teks = `Melumpuhkan ${def.label}! Dagingnya tergeletak…`;
          dekat.tempat_kerja = "berburu";
          dekat.stamina = Math.max(0, dekat.stamina - 15);
          ctx.kabar.push({ jenis: "buru", teks: `${dekat.nama} melumpuhkan ${def.label}! Dagingnya tergeletak di (${h.gx},${h.gy}).`, hari, dibuat_pada: new Date() });
          return;
        }
      }
      // Warga kalah / bukan pemburu: sehat + stamina turun, kabur ke kampung.
      dekat.sehat = Math.max(10, dekat.sehat - 15);
      dekat.stamina = Math.max(0, dekat.stamina - 10);
      dekat.interaksi = { jenis: "diserang", dengan: def.label, hasil: "kalah", teks: "Tolong! Ada hewan buas!", sampai_jam: jam + 1 };
      const titik = ctx.hunianTitik(dekat);
      dekat.tujuan = titik;
      dekat.node = null;
      dekat.fase_siklus = "kembali";
      dekat.aksi_sekarang = "kabur";
      dekat.status_teks = `Kabur dari ${def.label}…`;
      dekat.tempat_kerja = "kampung";
    }
    return;
  }
  // Mengembara acak (hindari air).
  // r38: mengembara pun dibatasi (JARAK_KABUR_JINAK) — dulu hewan
  // jinak mengembara secepat larinya (rusa 120, kelinci 150
  // tile/jam), jadi dalam satu jam mangsa bisa 120 tile jauhnya dan
  // pemburu yang mencari dalam radius 40 tidak pernah menemukannya
  // (inilah yang membuat rusa di video tak pernah tertangkap: di
  // jarak 10 tile ia bahkan belum "kabur", ia mengembara). Kecepatan
  // katalog (def.kecepatan) tetap 120/150 — yang dibatasi hanya
  // gerakan tenang per jam; hewan buas yang MENDEKATI warga tetap
  // berlari sekencang-kencangnya di cabang atas.
  const arah = Math.floor(Math.random() * 4);
  const dx = arah === 0 ? 1 : arah === 1 ? -1 : 0;
  const dy = arah === 2 ? 1 : arah === 3 ? -1 : 0;
  const p = gerakMenjauh({ gx: h.gx, gy: h.gy }, { gx: h.gx - dx, gy: h.gy - dy }, Math.min(def.kecepatan, JARAK_KABUR_JINAK), ctx.rintangan);
  h.gx = p.gx;
  h.gy = p.gy;
}

// Berburu hewan (jinak maupun yang didekati): kejar lalu coba.
// RONDE 9/10: diekspor (test); TIDAK berburu di malam hari (pemburu
// tidur); TIDAK mulai buruan baru saat sedang mengambil/membawa daging.
// r38: SEMUA warga boleh menyerang hewan yang dekat (dulu hanya
// pemburu). Pemburu aktif MENCARI mangsa (radius 40 tile); warga lain
// hanya oportunis — menyerang hewan yang kebetulan dekat (radius 3
// tile) supaya pekerjaan peran mereka tidak ditinggal demi berburu.
export function stepPerburuan(w: Warga, jam: number, ctx: SimCtx): void {
  const hari = Math.floor(jam / 24);
  if (w.stamina < 20) return;
  if (w.fase_siklus === "istirahat") return;
  if (faseDariJam(jam % 24) === "malam") return;
  if (w.daging_target || w.membawa_daging) return;
  const jarakCari = w.peran === "pemburu" ? JARAK_CARI_MANGSA : JARAK_SERANG_OPORTUNIS;
  let target: HewanDoc | null = null;
  let td = Infinity;
  for (const h of ctx.hewan) {
    if (ctx.hewanHilang.has(String(h._id))) continue;
    const d = Math.abs(w.lokasi.gx - h.gx) + Math.abs(w.lokasi.gy - h.gy);
    if (d < td) {
      td = d;
      target = h;
    }
  }
  // RONDE 15 — mangsa lolos (di luar jangkauan / tidak ada): hapus
  // target basi supaya Map3D tidak membidik hewan yang sudah jauh/hilang.
  if (!target || td > jarakCari) { w.target_hewan = null; return; }
  const def = hewanById(target.jenis);
  if (!def) return;
  w.target_hewan = String(target._id);
  // Satu percobaan serang per jam: peluang dari STR/AGI/STA + perkakas.
  const cobaSerang = (): void => {
    let peluang = 0.5 + (w.stat.str - 5) * 0.05 + (w.stat.agi - 5) * 0.03 + (w.stat.sta - 5) * 0.02;
    if (levelPerkakas(w, "tombak") >= 1) peluang += 0.1;
    if (levelPerkakas(w, "busur") >= 1) peluang += 0.15;
    peluang = Math.min(0.9, Math.max(0.15, peluang));
    w.stamina = Math.max(0, w.stamina - 10);
    if (Math.random() < peluang) {
      // RONDE 15 — HP hewan: hit mengurangi HP (damageBerburu); HP 0
      // baru JATUH -> DAGING (alur r10). Sebelumnya sekali hit sukses
      // = langsung mati; kini rusa (HP 4) perlu 2-4 hit, dst. Bar HP
      // tampil di Map3D selama diburu / terluka.
      const hpSisa = hpHewan(target, def.hp) - damageBerburu(w);
      if (hpSisa > 0) {
        target.hp = hpSisa;
        w.status_teks = `Melukai ${def.label}! (HP ${hpSisa}/${def.hp})`;
        w.tempat_kerja = "berburu";
        return;
      }
      // RONDE 10: hewan JATUH -> DAGING tergeletak (bukan stok instan).
      ctx.hewanHilang.add(String(target._id));
      const dagingId = `daging-${jam}-${String(target._id)}`;
      if (ctx.daging) ctx.daging.push({ _id: dagingId, jenis: def.label, gx: target.gx, gy: target.gy, pangan: def.pangan, kulit: def.kulit, dibuat_jam: jam });
      w.target_hewan = null;
      w.daging_target = { id: dagingId, gx: target.gx, gy: target.gy, jenis: def.label, pangan: def.pangan, kulit: def.kulit };
      w.tujuan = { gx: target.gx, gy: target.gy };
      w.node = null;
      w.fase_siklus = "jalan";
      w.aksi_sekarang = "mengambil_daging";
      w.status_teks = `Melumpuhkan ${def.label}! Dagingnya tergeletak…`;
      ctx.kabar.push({ jenis: "buru", teks: `${w.nama} memburu ${def.label}! Dagingnya tergeletak di (${target.gx},${target.gy}).`, hari, dibuat_pada: new Date() });
    } else {
      w.status_teks = `Mengejar ${def.label}…`;
    }
  };
  if (td <= 1) {
    cobaSerang();
    return;
  }
  // Kejar: r38 — BERLARI saat mengejar (1.5x jalan biasa) supaya
  // mangsa yang kabur 30 tile/jam benar-benar terkejar, lalu SERANG
  // begitu tiba di samping mangsa di jam yang sama. Dulu giliran
  // habis hanya untuk berjalan, jadi mangsa yang kabur tiap jam
  // tidak pernah tersentuh (inilah video pemburu vs rusa HP penuh).
  const kecKejar = Math.round(kecepatanJalan(w.stat.agi, w.stat.sta, w.bakat) * PENGALI_KEJAR);
  const r = gerak(w.lokasi, { gx: target.gx, gy: target.gy }, kecKejar, { jembatan: ctx.jembatan, rintangan: ctx.rintangan });
  w.lokasi = r.lokasi;
  w.sedang_berenang = r.berenang;
  w.status_teks = `Mengejar ${def.label}…`;
  w.tempat_kerja = "berburu";
  const tdAkhir = Math.abs(w.lokasi.gx - target.gx) + Math.abs(w.lokasi.gy - target.gy);
  if (tdAkhir <= 1) cobaSerang();
}

// Debat + gelud + ngobrol antar warga berdekatan (<= 2 tile), maks 1
// interaksi/hari per warga. Debat: INT tinggi menang. Gelud: STR/AGI/STA
// menang; kalah kabur. Ngobrol (RONDE 13): obrolan beneran antar 2 warga
// — hasil imbang, tanpa kabar, tanpa efek stamina/sehat.
// ANTI-STUCK (ronde 2): warga istirahat tidak debat/gelud/ngobrol
// (mereka tidur); interaksi aktif tidak ditimpa; pasangan yang sama
// cooldown 12 jam game sebelum bisa memicu lagi (dialog yang sama
// tidak berulang tanpa akhir).
// RONDE 13 — jendela bubble event-only: sampai_jam = jam + 1 (dulu +4).
// Layar mayoritas waktu bersih: bubble hanya tampil ~1 jam game per event.
export function stepInteraksi(warga: Warga[], jam: number, ctx: SimCtx): void {
  const hari = Math.floor(jam / 24);
  const sudah = new Set<string>();
  for (let i = 0; i < warga.length; i++) {
    for (let j = i + 1; j < warga.length; j++) {
      const a = warga[i];
      const b = warga[j];
      if (sudah.has(String(a._id)) || sudah.has(String(b._id))) continue;
      if (a.fase_siklus === "istirahat" || b.fase_siklus === "istirahat") continue;
      if ((a.interaksi?.sampai_jam ?? -1) > jam || (b.interaksi?.sampai_jam ?? -1) > jam) continue;
      const cdA = (a.interaksiCooldown ?? {})[String(b._id)] ?? -1;
      const cdB = (b.interaksiCooldown ?? {})[String(a._id)] ?? -1;
      if (cdA > jam || cdB > jam) continue;
      const d = Math.abs(a.lokasi.gx - b.lokasi.gx) + Math.abs(a.lokasi.gy - b.lokasi.gy);
      if (d > 2) continue;
      if (Math.random() > 0.1) continue;
      sudah.add(String(a._id));
      sudah.add(String(b._id));
      (a.interaksiCooldown ??= {})[String(b._id)] = jam + 12;
      (b.interaksiCooldown ??= {})[String(a._id)] = jam + 12;
      const undi = Math.random();
      if (undi < 0.35) {
        // Debat.
        const aMenang = a.stat.int !== b.stat.int ? a.stat.int > b.stat.int : Math.random() < 0.5;
        const menang = aMenang ? a : b;
        const kalah = aMenang ? b : a;
        const baris = debatBaris(kalah.nama);
        menang.interaksi = { jenis: "debat", dengan: kalah.nama, hasil: "menang", teks: baris.tantang, sampai_jam: jam + 1 };
        kalah.interaksi = { jenis: "debat", dengan: menang.nama, hasil: "kalah", teks: baris.jawab, sampai_jam: jam + 1 };
      } else if (undi < 0.65) {
        // Diskusi Pembangunan & Gotong Royong (Tanpa Gelud)
        const teksGotongRoyong = [
          "Ayo kita gotong royong bangun kampung lebih megah!",
          "Stok lumbung harus kita jaga bersama untuk musim dingin.",
          "Rumah yang kokoh butuh kerja sama dan kebersamaan seluruh warga.",
          "Kita bangun peradaban ini bersama-sama dengan damai dan rukun!",
        ];
        const pesanA = teksGotongRoyong[Math.floor(Math.random() * teksGotongRoyong.length)];
        const pesanB = "Sepakat! Mari kita fokus bekerja memajukan kampung kita.";
        a.interaksi = { jenis: "ngobrol", dengan: b.nama, hasil: "imbang", teks: pesanA, sampai_jam: jam + 1 };
        b.interaksi = { jenis: "ngobrol", dengan: a.nama, hasil: "imbang", teks: pesanB, sampai_jam: jam + 1 };
      } else {
        // Ngobrol beneran (RONDE 13): obrolan santai antar 2 warga —
        // tanpa pemenang/kalah, tanpa efek stamina/sehat, tanpa kabar.
        const baris = ngobrolBaris(b.nama);
        a.interaksi = { jenis: "ngobrol", dengan: b.nama, hasil: "imbang", teks: baris.tanya, sampai_jam: jam + 1 };
        b.interaksi = { jenis: "ngobrol", dengan: a.nama, hasil: "imbang", teks: baris.jawab, sampai_jam: jam + 1 };
      }
    }
  }
}

// Alasan scripted keputusan bangunan (fallback bila LLM tidak tersedia).
const ALASAN_BANGUNAN: Record<string, string> = {
  gubuk: "Warga butuh tempat tinggal yang cukup.",
  tenda_kulit: "Kulit terkumpul, tenda baru bisa didirikan.",
  api_unggun: "Api tambahan menghangatkan dan menerangi kampung.",
  lumbung: "Hasil kumpul makin banyak, perlu tempat simpan.",
  bengkel_batu: "Perajin butuh bengkel untuk membuat perkakas.",
  pondok_tabib: "Tabib butuh pondok untuk meramu obat.",
  pagar: "Pagar menjaga kampung dari hewan buas.",
  rak_jemur: "Daging dan kulit perlu dijemur supaya awet.",
  lingkaran_batu: "Musyawarah butuh tempat berkumpul yang layak.",
  totem: "Totem menghormati leluhur penjaga kampung.",
  ladang: "Ladang memberi pangan dekat kampung.",
  bengkel_kayu: "Penebang butuh bengkel untuk mengolah kayu.",
  jembatan: "Warga harus menyeberangi sungai tanpa berenang.",
  perahu: "Perahu membuat penyeberangan sungai lebih cepat.",
  gubuk_besar: "Kampung makin ramai, hunian besar menampung lebih banyak warga.",
  tenda_besar: "Tenda besar menampung warga tambahan dengan kulit yang ada.",
  balai: "Musyawarah butuh balai yang layak untuk berkumpul.",
  dapur_umum: "Dapur bersama memudahkan juru masak memberi makan kampung.",
  menara_jaga: "Menara jaga membantu penjaga mengawasi kampung dari atas.",
  sumur_batu: "Sumur batu memberi air bersih dekat kampung.",
  gapura: "Gapura menandai gerbang kampung kita.",
  paviliun_makan: "Warga butuh tempat makan bersama — juru masak memasak di paviliun.",
  kebun_rempah: "Juru masak dan peramu butuh kebun rempah sendiri untuk bahan masakan.",
};

// Cari hunian (gubuk/tenda) yang masih muat dari placements + daftar warga.
export function carikanHunian(
  placements: { _id: unknown; kind: string; gx: number; gy: number; w: number; h: number }[],
  warga: { hunian?: { id: string } | null }[]
): { id: string; tipe: string; label: string } | null {
  for (const p of placements) {
    const b = bangunanById(p.kind);
    if (!b || b.kapasitas === null) continue;
    const isi = warga.filter((w) => w.hunian?.id === String(p._id)).length;
    if (isi < b.kapasitas) {
      return { id: String(p._id), tipe: p.kind, label: b.label };
    }
  }
  return null;
}

export async function advanceWorld(): Promise<{ advanced: number; day: number; jam: number }> {
  const dunia = await getDuniaDoc();
  const now = Date.now();
  // MIGRASI JAM v4 (RONDE 9, sekali): epoch lama memakai durasi tetap
  // 60 detik/jam. Tanpa migrasi, jamTotal akan MELONJAK ~1600 jam saat
  // deploy karena malam-malam lama dihitung ulang sebagai 6 detik/jam.
  // migrasiJamV4 menggeser epoch supaya jamTotal baru = jamTotal lama
  // persis; sim_jam tidak berubah -> tidak ada catch-up jump. Disimpan
  // SEGERA (bukan di $set akhir) supaya tab/request lain yang membaca
  // epoch di tengah jalan tidak menghitung waktu ganda.
  if (dunia.jam_v4 !== true) {
    const m4 = migrasiJamV4(dunia.epoch_ms, now);
    dunia.epoch_ms = m4.epochBaruMs;
    dunia.jam_v4 = true;
    await getCollection<DuniaDoc>("dunia").then((c) =>
      c.updateOne({ _id: "utama" }, { $set: { epoch_ms: dunia.epoch_ms, jam_v4: true } })
    );
  }
  // MIGRASI JAM v3 (sekali, tanpa hapus warga/resource): doc lama tanpa
  // sim_jam masih memakai epoch jam v2 (1 hari = 1 menit). Pertahankan
  // waktu yang sedang tampil persis (hari/jam/menit sama), geser epoch.
  if (typeof dunia.sim_jam !== "number") {
    const m = migrasiJam(dunia.epoch_ms, now);
    dunia.epoch_ms = m.epochBaruMs;
    dunia.sim_jam = m.simJam;
    dunia.sim_hari = Math.floor(m.simJam / 24);
    await getCollection<DuniaDoc>("dunia").then((c) =>
      c.updateOne({ _id: "utama" }, { $set: { epoch_ms: dunia.epoch_ms, sim_jam: dunia.sim_jam, sim_hari: dunia.sim_hari } })
    );
  }
  const gt = gameTime(dunia.epoch_ms, now);
  const jamTarget = gt.jamTotal;
  let tertinggal = jamTarget - dunia.sim_jam;
  if (tertinggal <= 0) return { advanced: 0, day: gt.day, jam: jamTarget };
  // Batas catch-up: proses maks 5000 JAM (~3,5 hari nyata kosong); sisanya
  // dilompati (sim_jam tetap mengejar waktu nyata, tanpa kumpul).
  let lompat = 0;
  if (tertinggal > 5000) {
    lompat = tertinggal - 5000;
    tertinggal = 5000;
  }
  // RONDE 10: node aktif = generated + spawn (lokasi baru). nodeKeys
  // untuk plot bangunan memakai gabungan supaya spawn tidak ditimpa.
  const nodeSpawn: Node[] = (dunia.node_spawn ?? []).map((n) => ({ kind: n.kind, gx: n.gx, gy: n.gy }));
  const nodes = [...generateNodes(), ...nodeSpawn];
  const nodeKeys = new Set(nodes.map((n) => `${n.gx},${n.gy}`));
  const wargaCol = await getCollection("warga");
  const wargaDocs = (await wargaCol.find({}).toArray()) as unknown as Warga[];
  // Migrasi aman warga lama: STA default + field baru default (tanpa hapus).
  for (const w of wargaDocs) {
    w.stat = statDenganSTA(w.stat as unknown as Record<string, number>);
    if (typeof w.stamina !== "number") w.stamina = 50 + (w.stat.sta ?? 5) * 5;
    if (typeof w.lapar !== "number") w.lapar = 20;
    if (typeof w.sehat !== "number") w.sehat = 100;
    if (!Array.isArray(w.perkakas)) w.perkakas = [{ jenis: perkakasPeran(w.peran), level: 0 }];
    if (w.interaksi === undefined) w.interaksi = null;
    if (!w.interaksiCooldown) w.interaksiCooldown = {};
    if (w.target_hewan === undefined) w.target_hewan = null;
    if (typeof w.sedang_berenang !== "boolean") w.sedang_berenang = false;
    if (w.daging_target === undefined) w.daging_target = null;
    if (w.membawa_daging === undefined) w.membawa_daging = null;
  }
  const tilesCol = await getCollection("peta_tile");
  const placementsSemua = (await tilesCol.find({}).toArray()) as unknown as {
    _id: unknown;
    kind: string;
    gx: number;
    gy: number;
    w: number;
    h: number;
    bangunan_id?: string;
    hidangan?: number;
  }[];
  // RONDE 18 — dedupe in-memory (bukan tulis DB): peta_tile live berisi
  // 85 baris ganda (13x pagar di ubin sama, id berbeda) dari advance
  // bersamaan; tanpa dedupe, sim menghitung kapasitas hunian ganda +
  // gerbang bangunan salah. Dokumen lama TIDAK dihapus (protokol).
  const placements = dedupePlacement(placementsSemua);
  // RONDE 18 — ubin jalan selesai (koleksi `jalan`, satu dokumen/ubin).
  const jalanCol = await getCollection("jalan");
  const jalanDocs = (await jalanCol.find({}).toArray()) as unknown as {
    gx: number;
    gy: number;
    segmen?: string;
  }[];
  const titikHunian = (w: Warga): { gx: number; gy: number } => {
    // Hunian: ubin BERBEDA per penghuni (bukan menumpuk di tengah gubuk).
    // Urutan penghuni stabil dari _id supaya ubin tidak berpindah-pindah.
    if (w.hunian) {
      const p = placements.find((x) => String(x._id) === w.hunian?.id);
      if (p) {
        const serumah = wargaDocs
          .filter((x) => x.hunian?.id === w.hunian?.id)
          .sort((a, b) => String(a._id).localeCompare(String(b._id)));
        const idx = serumah.findIndex((x) => x === w);
        return tileHunian(p, idx < 0 ? 0 : idx);
      }
    }
    // Tanpa hunian: ubin TAMU di sekeliling gubuk terdekat — tidur bersama
    // kelompok, BUKAN sendirian di api unggun yang jauh.
    return tileTamu(placements, wargaDocs.indexOf(w));
  };
  // r38: rintangan dari helper petak kanonik (ukuranPetak) — satu
  // sumber kebenaran dengan cek tumpang tindih + penempatan.
  const rintangan = occupiedDariPlacements(placements);
  const jembatan = new Set<string>();
  for (const p of placements) {
    if (p.kind !== "jembatan") continue;
    for (const k of petakBangunan(p)) jembatan.add(k);
  }
  // RONDE 11: gunung = rintangan (pathing memutar seperti bangunan).
  for (const k of gunungTileKeys()) rintangan.add(k);
  const perahuAda = placements.some((p) => p.kind === "perahu");
  const stok: Stok = { ...stokKosong(), ...(dunia.stok ?? {}) };
  const kabar: KabarBaru[] = [];
  const nodeSisa = new Map<string, number>();
  for (const n of nodes) nodeSisa.set(`${n.gx},${n.gy}`, (dunia.node_sisa ?? {})[`${n.gx},${n.gy}`] ?? SISA_NODE_AWAL);
  // RONDE 10 — spawn tertunda (node habis -> lokasi baru). Legacy
  // node_regrow dikonversi: ubin generated yang sedang menunggu regrow
  // diubah jadi spawn tertunda (jenis dari node generated; bila lokasi
  // baru tidak ditemukan, entri dibiarkan regrow di tempat — loop lama
  // di bawah tetap dipertahankan untuk sisa itu). Node habis tanpa
  // jadwal (warisan bug) dijadwalkan sebagai spawn tertunda jam berikut.
  const nodeRegrow = new Map<string, number>(Object.entries(dunia.node_regrow ?? {}));
  const nodeSpawnTertunda = new Map<string, { kind: NodeKind; gx: number; gy: number; jam: number }>(
    Object.entries(dunia.node_spawn_tertunda ?? {}) as [string, { kind: NodeKind; gx: number; gy: number; jam: number }][]
  );
  const generatedByKey = new Map(generateNodes().map((n) => [`${n.gx},${n.gy}`, n]));
  for (const [k, kapan] of [...nodeRegrow]) {
    const gen = generatedByKey.get(k);
    if (gen && !nodeSpawnTertunda.has(k)) {
      const taken0 = new Set<string>(nodeKeys);
      for (const t of nodeSpawnTertunda.values()) taken0.add(`${t.gx},${t.gy}`);
      const spawn0 = pilihLokasiRespawn(gen.kind, { gx: gen.gx, gy: gen.gy }, kapan, taken0, rintangan);
      if (spawn0) {
        nodeSpawnTertunda.set(k, { kind: spawn0.kind, gx: spawn0.gx, gy: spawn0.gy, jam: kapan });
        nodeRegrow.delete(k);
      }
    }
  }
  // Respawn dikontrol: HANYA jika sumber daya benar-benar menipis di peta (tidak langsung respawn 1 detik setelah panen)
  const MIN_TARGET: Record<string, number> = {
    pohon: 35,
    semak_beri: 18,
    singkapan_batu: 18,
    padang_buruan: 12,
    urat_emas: 8,
    urat_besi: 10,
  };
  const countAktif: Record<string, number> = {};
  for (const n of nodes) {
    const k = `${n.gx},${n.gy}`;
    if ((nodeSisa.get(k) ?? SISA_NODE_AWAL) > 0) {
      countAktif[n.kind] = (countAktif[n.kind] ?? 0) + 1;
    }
  }
  for (const [kindStr, minTarget] of Object.entries(MIN_TARGET)) {
    const kind = kindStr as NodeKind;
    const aktif = countAktif[kind] ?? 0;
    if (aktif < minTarget) {
      const taken = new Set<string>(nodeKeys);
      for (const t of nodeSpawnTertunda.values()) taken.add(`${t.gx},${t.gy}`);
      const spawn = pilihLokasiRespawn(kind, { gx: 100, gy: 100 }, dunia.sim_jam + 2, taken, rintangan);
      if (spawn) {
        const randKey = `spawn_${kind}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        nodeSpawnTertunda.set(randKey, { kind: spawn.kind, gx: spawn.gx, gy: spawn.gy, jam: dunia.sim_jam + 2 });
        nodeKeys.add(`${spawn.gx},${spawn.gy}`);
      }
    }
  }
  // Ubin semua node (generated + spawn + pending baru) untuk tileSebelah.
  const nodeTilesAll = new Set<string>(nodeKeys);
  for (const t of nodeSpawnTertunda.values()) nodeTilesAll.add(`${t.gx},${t.gy}`);
  const hewanCol = await getCollection("hewan");
  let hewanDocs = (await hewanCol.find({}).toArray()) as unknown as HewanDoc[];
  if (hewanDocs.length === 0) {
    // Seed awal hewan (sekali): posisi acak, bukan air, bukan pusat.
    const rnd = (s: number) => {
      const x = Math.sin(s * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };
    let s = 11;
    const docs: HewanDoc[] = [];
    for (const sp of HEWAN_AWAL) {
      for (let i = 0; i < sp.n; i++) {
        let gx = 100;
        let gy = 100;
        for (let t = 0; t < 50; t++) {
          s += 1;
          const cx = 10 + Math.floor(rnd(s) * 180);
          const cy = 10 + Math.floor(rnd(s + 1000) * 180);
          if (!isWater(cx, cy) && Math.abs(cx - PUSAT.gx) + Math.abs(cy - PUSAT.gy) >= 10) {
            gx = cx;
            gy = cy;
            break;
          }
        }
        docs.push({ _id: undefined as unknown, jenis: sp.id, gx, gy, hp: hewanById(sp.id)?.hp ?? 1 } as HewanDoc);
      }
    }
    if (docs.length > 0) {
      const res = await hewanCol.insertMany(docs.map((d) => ({ jenis: d.jenis, gx: d.gx, gy: d.gy, hp: d.hp })));
      hewanDocs = docs.map((d, i) => ({ ...d, _id: res.insertedIds[i] }));
    }
  }
  // RONDE 15 — hewan lama tanpa field hp = HP penuh (default, tanpa migrasi DB).
  for (const h of hewanDocs) if (typeof h.hp !== "number") h.hp = hewanById(h.jenis)?.hp ?? 1;
  // RONDE 10: daging tergeletak dari DB (koleksi "daging").
  const dagingCol = await getCollection("daging");
  let dagingDocs = (await dagingCol.find({}).toArray()) as unknown as DagingDoc[];
  const ctx: SimCtx = {
    nodes,
    nodeSisa,
    nodeRegrow,
    nodeTilesAll,
    nodeSpawn,
    nodeSpawnTertunda,
    daging: dagingDocs,
    dagingHapus: new Set<string>(),
    stok,
    kapasitasMaks: hitungKapasitasStok(placements),
    kabar,
    hunianTitik: titikHunian,
    rintangan,
    jembatan,
    perahuAda,
    hewan: hewanDocs,
    hewanHilang: new Set<string>(),
    wargaSemua: wargaDocs,
    cuaca: cuacaGame(gt.day),
    hari: gt.day,
    jam: dunia.sim_jam,
    ladang: (() => {
      const l = placements.find((p) => p.kind === "ladang");
      return l ? { gx: l.gx + Math.floor((l.w ?? 1) / 2), gy: l.gy + Math.floor((l.h ?? 1) / 2) } : null;
    })(),
    // RONDE 10 (lanjutan): placement paviliun yang sudah selesai (null
    // bila belum dibangun). Objek ini REFERENSI ke placements — mutasi
    // hidangan di sini wajib ditulis balik eksplisit (lihat bawah).
    restoran: (() => {
      const p = placements.find((x) => x.kind === "paviliun_makan");
      return p ? { _id: p._id, kind: p.kind, gx: p.gx, gy: p.gy, w: p.w, h: p.h, hidangan: p.hidangan ?? 0 } : null;
    })(),
    restoranBerubah: false,
    // RONDE 18 — jalan (lihat SimCtx): placement referensi + ubin jalan.
    placements,
    jalanSelesai: new Set(jalanDocs.map((j) => `${j.gx},${j.gy}`)),
    jalanTugas: new Set<string>(),
    jalanRencana: null,
    jalanBaru: [],
    bangunanAktif: false,
    ikanSungai: dunia.ikan_sungai ?? IKAN_CAP,
  };
  const perajin = wargaDocs.filter((w) => w.peran === "perajin").length;
  const bangunanCol = await getCollection("bangunan");
  const antrean = (await bangunanCol.find({ status: { $in: ["antre", "dibangun"] } }).toArray()) as unknown as {
    _id: unknown;
    tipe: string;
    status: string;
    progres: number;
    gx: number | null;
    gy: number | null;
    w: number | null;
    h: number | null;
    pembangun_nama?: string;
    pemrakarsa?: string;
    alasan?: string;
    sumber_alasan?: string;
  }[];
  let lastLlmJam = dunia.last_llm_jam ?? -1000;

  // RONDE 10: daging kedaluwarsa 24 jam game (sekali per advanceWorld):
  // daging yang tidak diambil dalam sehari membusuk + hilang; pemburu
  // yang sedang menuju daging kedaluwarsa ditangani cabang daging
  // (daging hilang -> pulang biasa).
  {
    const batas = dunia.sim_jam - 24;
    const sisaDaging: DagingDoc[] = [];
    for (const d of dagingDocs) {
      if (d.dibuat_jam < batas) ctx.dagingHapus!.add(d._id);
      else sisaDaging.push(d);
    }
    ctx.daging = sisaDaging;
    dagingDocs = sisaDaging;
  }
  let hariBusukTerakhir = Math.floor(dunia.sim_jam / 24);
  for (let i = 0; i < tertinggal; i++) {
    const jam = dunia.sim_jam + i + 1;
    const hari = Math.floor(jam / 24);
    ctx.jam = jam;
    ctx.hari = hari;
    // Pergantian hari: kelebihan stok di atas kapasitas membusuk/melapuk
    // (terapkanPembusukan). Kabar hanya bila pangan busuk >= 100, supaya
    // tidak membanjiri kabar saat susutnya kecil.
    if (hari !== hariBusukTerakhir) {
      hariBusukTerakhir = hari;
      // RONDE 20 — ikan sungai tumbuh lagi (+3/hari, maks IKAN_CAP).
      ctx.ikanSungai = Math.min(IKAN_CAP, (ctx.ikanSungai ?? IKAN_CAP) + IKAN_REGROW_HARIAN);
      const busuk = terapkanPembusukan(ctx);
      if ((busuk.pangan ?? 0) >= 100) {
        ctx.kabar.push({
          jenis: "kumpul",
          teks: `Sebagian pangan membusuk karena melebihi kapasitas lumbung (${busuk.pangan} busuk).`,
          hari,
          dibuat_pada: new Date(),
        });
      }
    }
    ctx.cuaca = cuacaGame(hari);
    // Hunian DINAMIS tiap jam (tidur komunal): warga tanpa hunian — atau
    // huniannya hilang — langsung mendapat tempat begitu ada gubuk kosong
    // (mis. gubuk baru selesai jam sebelumnya). Tanpa ini, warga kelima
    // selamanya tanpa hunian walau gubuk baru sudah berdiri.
    for (const w of wargaDocs) {
      const hunianAda = w.hunian && placements.some((p) => String(p._id) === w.hunian?.id);
      if (!hunianAda) {
        const baru = carikanHunian(placements, wargaDocs);
        if (baru) w.hunian = baru; else { w.hunian = null; w.status_teks = "Saya butuh rumah!"; }
      }
    }
    // RONDE 18 — rencana jalan jam ini. Tugas jalan di-reset tiap jam
    // supaya pembangun tidak berebut ubin yang sama.
    // RONDE 20: rencana DIHITUNG SELALU (dulu null saat ada bangunan
    // antre/dibangun — lihat terapkanJalan: gate itu yang membuat jalan
    // tidak pernah dibangun).
    ctx.bangunanAktif = antrean.some((b) => b.status === "antre" || b.status === "dibangun");
    ctx.jalanTugas = new Set<string>();
    ctx.jalanRencana = rencanaJalan(
      // r38: ukuran petak dari helper kanonik.
      placements.map((p) => ({ kind: p.kind, gx: p.gx, gy: p.gy, ...ukuranPetak(p) })),
      ctx.jalanSelesai ?? new Set<string>(),
      ctx.nodeTilesAll ?? new Set<string>()
    );
    for (const w of wargaDocs) {
      stepWarga(w, jam, ctx);
      w.umur = Math.max(0, Math.floor((hari - w.lahir_hari) / 365));
      w.tahap_hidup = w.umur >= 60 ? "lansia" : "dewasa";
      w.sim_hari = hari;
      // Kelaparan tanpa pangan: sehat turun — -3/jam (dulu -10/jam,
      // mengalahkan pemulihan istirahat +1/jam sehingga sehat terkunci 10).
      if (w.lapar >= 95) w.sehat = Math.max(10, w.sehat - 3);
    }
    for (const h of ctx.hewan) {
      if (!ctx.hewanHilang.has(String(h._id))) stepHewan(h, jam, ctx);
    }
    for (const w of wargaDocs) stepPerburuan(w, jam, ctx);
    stepInteraksi(wargaDocs, jam, ctx);
    // Regrow node: yang waktunya tiba kembali bersisa 5 (hanya sisa
    // legacy yang tidak terkonversi ke spawn — lihat konversi di atas).
    for (const [k, kapan] of [...ctx.nodeRegrow]) {
      if (jam >= kapan) {
        ctx.nodeSisa.set(k, SISA_NODE_AWAL);
        ctx.nodeRegrow.delete(k);
      }
    }
    // RONDE 10: spawn tertunda yang waktunya tiba -> node BARU di lokasi
    // lain (bukan di ubin lama) + kabar, ubin lama tetap sisa 0.
    if (ctx.nodeSpawnTertunda && ctx.nodeSpawn) {
      terapkanSpawnTertunda(ctx.nodeSpawnTertunda, jam, ctx.nodeSpawn, ctx.nodeSisa, ctx.kabar);
      for (const sp of ctx.nodeSpawn) ctx.nodeTilesAll?.add(`${sp.gx},${sp.gy}`);
    }
    // Respawn hewan bila menipis (menuju ~25 ekor).
    const hidup = ctx.hewan.filter((h) => !ctx.hewanHilang.has(String(h._id))).length;
    if (butuhRespawnHewan(hidup) && Math.random() < peluangRespawnHewan(hidup)) {
      const sp = HEWAN_AWAL[Math.floor(Math.random() * HEWAN_AWAL.length)];
      let gx = 100;
      let gy = 100;
      for (let t = 0; t < 30; t++) {
        const cx = 10 + Math.floor(Math.random() * 180);
        const cy = 10 + Math.floor(Math.random() * 180);
        if (!isWater(cx, cy) && Math.abs(cx - PUSAT.gx) + Math.abs(cy - PUSAT.gy) >= 10) {
          gx = cx;
          gy = cy;
          break;
        }
      }
      ctx.hewan.push({ _id: `baru-${hari}-${Math.floor(Math.random() * 1e9)}`, jenis: sp.id, gx, gy, hp: hewanById(sp.id)?.hp ?? 1 } as unknown as HewanDoc);
    }

    // Keputusan bangunan NPC (maks 1 antrean aktif dalam satu waktu).
    const adaAktif = antrean.some((b) => b.status === "antre" || b.status === "dibangun");
    if (!adaAktif && wargaDocs.length > 0) {
      const kapasitas = placements
        .map((p) => bangunanById(p.kind)?.kapasitas ?? 0)
        .reduce((a, b) => a + b, 0);
      const adaJembatan = placements.some((p) => p.kind === "jembatan") || antrean.some((b) => b.tipe === "jembatan");
      const adaPerahu = placements.some((p) => p.kind === "perahu") || antrean.some((b) => b.tipe === "perahu");
      const adaLumbung = placements.some((p) => p.kind === "lumbung");
      const adaBengkelBatu = placements.some((p) => p.kind === "bengkel_batu");
      const adaPondok = placements.some((p) => p.kind === "pondok_tabib");
      const adaBengkelKayu = placements.some((p) => p.kind === "bengkel_kayu");
      const adaLadang = placements.some((p) => p.kind === "ladang");
      const apiCount = placements.filter((p) => p.kind === "api_unggun").length;
      const pop = wargaDocs.length;
      const kandidat: string[] = [];
      if (wargaDocs.length > kapasitas) kandidat.push(stok.kulit >= 20 && stok.kayu < 30 ? "tenda_kulit" : "gubuk");
      // Lumbung DARURAT paceklik (bukan gate pop>=8): pangan kosong atau
      // ada warga kelaparan -> lumbung antre tepat setelah hunian.
      if (!adaLumbung && (stok.pangan <= 0 || wargaDocs.some((w) => w.lapar >= 90))) kandidat.push("lumbung");
      if (!adaJembatan && pop >= 6) kandidat.push("jembatan");
      if (!adaPerahu && adaJembatan && pop >= 10) kandidat.push("perahu");
      if (!adaLumbung && pop >= 8 && !kandidat.includes("lumbung")) kandidat.push("lumbung");
      // RONDE 10 (lanjutan) — paviliun makan: rantai pangan berikutnya
      // setelah lumbung (simpan -> masak/makan bersama). Gate: lumbung
      // SUDAH selesai + (pop >= 10 ATAU ada juru masak). Diprioritaskan
      // SEBELUM balai/dapur_umum (baris pop>=12 di bawah) karena ini
      // pesanan user yang eksplisit. Satu antrean aktif tetap dijaga.
      const adaPaviliun = placements.some((p) => p.kind === "paviliun_makan") || antrean.some((b) => b.tipe === "paviliun_makan");
      if (!adaPaviliun && adaLumbung && (pop >= 10 || wargaDocs.some((w) => w.peran === "juru_masak"))) kandidat.push("paviliun_makan");
      // RONDE 17 — kebun rempah: rantai masak berikutnya setelah
      // paviliun (makan bersama -> bahan masak sendiri). Gate:
      // paviliun_makan SUDAH selesai + (pop >= 12 ATAU ada juru
      // masak/peramu). Satu antrean aktif tetap dijaga di atas.
      const adaKebun = placements.some((p) => p.kind === "kebun_rempah") || antrean.some((b) => b.tipe === "kebun_rempah");
      if (!adaKebun && adaPaviliun && (pop >= 12 || wargaDocs.some((w) => w.peran === "juru_masak" || w.peran === "peramu"))) kandidat.push("kebun_rempah");
      if (!adaBengkelBatu && wargaDocs.some((w) => w.peran === "perajin")) kandidat.push("bengkel_batu");
      if (!adaPondok && (wargaDocs.some((w) => w.sehat < 80) || wargaDocs.some((w) => w.peran === "tabib" || w.peran === "peramu"))) kandidat.unshift("pondok_tabib");
      if (!adaBengkelKayu && wargaDocs.some((w) => w.peran === "penebang")) kandidat.push("bengkel_kayu");
      if (!adaLadang && wargaDocs.some((w) => w.peran === "pengumpul" || w.peran === "juru_masak" || w.peran === "petani")) kandidat.push("ladang");
      if (apiCount < 2 && pop >= 12) kandidat.push("api_unggun");
      // Hunian ekspansi (pop>=10) + bangunan baru (pop>=12): satu per giliran.
      if (pop >= 10) {
        const sudahHunian = new Set(placements.map((p) => p.kind));
        if (!sudahHunian.has("gubuk_besar")) kandidat.push("gubuk_besar");
        else if (!sudahHunian.has("tenda_besar")) kandidat.push("tenda_besar");
      }
      if (pop >= 12) {
        const baru = ["balai", "dapur_umum", "menara_jaga", "sumur_batu", "gapura"];
        const sudah = new Set(placements.map((p) => p.kind));
        const belum = baru.find((d) => !sudah.has(d));
        if (belum) kandidat.push(belum);
      }
      if (pop >= 15) {
        const dekor = ["pagar", "rak_jemur", "lingkaran_batu", "totem"];
        const sudah = new Set(placements.map((p) => p.kind));
        const belum = dekor.find((d) => !sudah.has(d));
        if (belum) kandidat.push(belum);
      }
      if (kandidat.length > 0) {
        // Hook LLM (throttle 24 jam game): pilih dari kandidat + alasan.
        // PENGECUALIAN: darurat kapasitas hunian MEMAKSA pilihan gubuk —
        // LLM tidak boleh mengalihkan antrean saat warga kekurangan tempat
        // tidur (itu yang membuat gubuk darurat tertunda).
        const daruratHunian = wargaDocs.length > kapasitas;
        let pilihan = kandidat[0];
        let alasan = ALASAN_BANGUNAN[pilihan] ?? "Kampung membutuhkannya.";
        let sumber: "llm" | "scripted" = "scripted";
        if (jam - lastLlmJam >= 24 && !daruratHunian) {
          try {
            const stokTeks = `kayu ${stok.kayu}, batu ${stok.batu}, pangan ${stok.pangan}, kulit ${stok.kulit}, warga ${pop}`;
            const res = await keputusanNPC(`Stok: ${stokTeks}.`, kandidat);
            if (res) {
              pilihan = res.keputusan.pilihan;
              alasan = res.keputusan.alasan;
              sumber = "llm";
            }
            lastLlmJam = jam;
          } catch {
            /* LLM gagal -> fallback scripted, game jalan terus */
          }
        }
        const def = bangunanById(pilihan);
        if (def) {
          const kepala = wargaDocs.find((w) => w.peran === "kepala_suku");
          const perajinW = wargaDocs.find((w) => w.peran === "perajin");
          // RONDE 18 — fresh-check anti-duplikat: snapshot advance ini
          // bisa basi (advance lain sudah mengantre tipe yang sama tapi
          // belum tertulis saat snapshot dibaca). Bila sudah ada antrean
          // aktif tipe ini di DB, jangan dorong antrean kedua.
          const bentrok = await bangunanCol.findOne({
            tipe: pilihan,
            status: { $in: ["antre", "dibangun"] },
          });
          if (!bentrok) {
            antrean.push({
              _id: `npc-${jam}-${Math.floor(Math.random() * 1e9)}` as unknown,
              tipe: pilihan,
              status: "antre",
              progres: 0,
              gx: null,
              gy: null,
              w: null,
              h: null,
              pembangun_nama: (perajinW ?? kepala ?? wargaDocs[0])?.nama ?? "Warga",
              pemrakarsa: kepala ? kepala.nama : "Musyawarah kampung",
              alasan,
              sumber_alasan: sumber,
            });
          }
        }
      }
    }

    // Bangunan: antre -> dibangun (potong biaya + tetapkan plot) -> selesai.
    for (const b of antrean) {
      const def = bangunanById(b.tipe);
      if (!def) continue;
      if (b.status === "antre") {
        if (cukupBiaya(stok, def.biaya)) {
          // r38: occupied dari helper petak kanonik.
          const occupied = occupiedDariPlacements(placements);
          // ANTI-DUPLIKAT (2026-11-03): plot antrean lain yang sudah
          // ditetapkan ikut menghalangi — dua antrean tidak lagi dapat
          // plot yang sama dalam satu advance yang sama.
          for (const o of antrean) {
            if (o === b || o.gx === null || o.gx === undefined || o.gy === null || o.gy === undefined) continue;
            for (const k of petakBangunan({ kind: o.tipe, gx: o.gx, gy: o.gy, w: o.w ?? undefined, h: o.h ?? undefined })) occupied.add(k);
          }
          let plot: { gx: number; gy: number; w: number; h: number; rotasi?: number } | null = null;
          if (def.penempatan === "jembatan") plot = findBridgePlot(occupied);
          else if (def.penempatan === "perahu") plot = findBoatSpot(occupied);
          else if (def.kapasitas !== null && def.kapasitas > 0) {
            const roadTiles = new Set<string>(((dunia as any).jalan ?? []).map((j: any) => `${j.gx},${j.gy}`));
            const hp = findHousePlotBesideRoad(occupied, nodeKeys, roadTiles, def.footprint, def.footprint, 2);
            if (hp) {
              plot = { gx: hp.gx, gy: hp.gy, w: def.footprint, h: def.footprint, rotasi: hp.rotasi };
            } else {
              // RONDE 20 — tidak ada petak di tepi jalan: tetap hadap
              // jalan TERDEKAT yang ada (rotasiKeJalan), bukan default 0.
              const fp = findPlot(occupied, nodeKeys, def.footprint, def.footprint, 2);
              if (fp) plot = { ...fp, w: def.footprint, h: def.footprint, rotasi: rotasiKeJalan(fp.gx, fp.gy, def.footprint, def.footprint, roadTiles) };
            }
          } else {
            const fp = findPlot(occupied, nodeKeys, def.footprint, def.footprint, 3);
            if (fp) plot = { ...fp, w: def.footprint, h: def.footprint };
          }
          if (!plot) continue; // tanpa plot: tetap antre, biaya belum dipotong
          for (const [k, v] of Object.entries(def.biaya)) {
            stok[k as keyof Stok] -= v ?? 0;
          }
          b.status = "dibangun";
          b.progres = 0;
          b.gx = plot.gx;
          b.gy = plot.gy;
          b.w = plot.w;
          b.h = plot.h;
          (b as any).rotasi = plot.rotasi ?? 0;
          // Antrean lama (era pemain bisa antre) belum punya data NPC:
          // lengkapi saat konstruksi mulai supaya panel tetap informatif.
          if (!b.pembangun_nama || !b.pemrakarsa || !b.alasan) {
            const kepala = wargaDocs.find((w) => w.peran === "kepala_suku");
            const perajinW = wargaDocs.find((w) => w.peran === "perajin");
            if (!b.pembangun_nama) b.pembangun_nama = (perajinW ?? kepala ?? wargaDocs[0])?.nama ?? "Warga";
            if (!b.pemrakarsa) b.pemrakarsa = kepala ? kepala.nama : "Musyawarah kampung";
            if (!b.alasan) b.alasan = ALASAN_BANGUNAN[b.tipe] ?? "Kampung membutuhkannya.";
            if (!b.sumber_alasan) b.sumber_alasan = "scripted";
          }
          kabar.push({ jenis: "bangunan", teks: `Pembangunan ${def.label} dimulai di (${plot.gx},${plot.gy}).`, hari, dibuat_pada: new Date() });
        }
        continue;
      }
      if (b.status === "dibangun") {
        b.progres = Math.min(100, (b.progres ?? 0) + 10 + perajin * 3);
        if (b.progres >= 100) {
          // Idempotent: jangan dobel placement bila sudah ada.
          const sudah = placements.some((p) => p.bangunan_id === String(b._id));
          let kabarBatal = false;
          if (!sudah && b.gx !== null && b.gy !== null) {
            // r38 — PENJAGA AKHIR PETAK (laporan user: rumah nembus
            // restoran): upsert lama hanya mengunci ubin ASAL (gx,gy)
            // — bangunan besar tetap bisa menimpa ubin lain bangunan
            // tetangga bila plot dipilih bersamaan. Bila satu ubin pun
            // dari footprint sudah terisi, batalkan dengan kabar jujur
            // + kembalikan biaya, jangan tulis placement yang menumpuk.
            const wBaru = b.w ?? def.footprint;
            const hBaru = b.h ?? def.footprint;
            if (!plotBebas(placements, b.gx, b.gy, wBaru, hBaru)) {
              for (const [k, v] of Object.entries(def.biaya)) {
                stok[k as keyof Stok] += v ?? 0;
              }
              kabar.push({ jenis: "bangunan", teks: `${def.label} batal dibangun: petaknya sudah dipakai bangunan lain (dipilih bersamaan). Biaya dikembalikan.`, hari, dibuat_pada: new Date() });
              kabarBatal = true;
            } else {
            // ANTI-DUPLIKAT (2026-11-03, pesan Fina: 1 bangunan kesimpan
            // berkali-kali, ID beda posisi sama, dari proses bersamaan):
            // kunci upsert kini POSISI saja (bukan kind+posisi) — dua
            // bangunan berbeda pun tidak bisa menumpuk di ubin yang
            // sama. Yang kalah race tidak membuat dokumen baru; bangun-
            // annya batal dengan kabar jujur (bukan diam-diam hilang,
            // dan antrean tidak menggantung selamanya).
            const docBaru = {
              kind: def.id,
              gx: b.gx,
              gy: b.gy,
              w: wBaru,
              h: hBaru,
              // RONDE 20 — orientasi depan rumah (0=S, PI=N, PI/2=E,
              // -PI/2=W) dari jalan terdekat; Map3D memakainya.
              rotasi: (b as any).rotasi ?? 0,
              bangunan_id: String(b._id),
              // RONDE 10 (lanjutan): paviliun lahir dengan dapur kosong.
              ...(def.id === "paviliun_makan" ? { hidangan: 0 } : {}),
            };
            await tilesCol.updateOne(
              { gx: b.gx, gy: b.gy },
              { $setOnInsert: docBaru },
              { upsert: true }
            );
            const jadi = (await tilesCol.findOne({ gx: b.gx, gy: b.gy })) as unknown as {
              _id: unknown;
              bangunan_id?: unknown;
            } | null;
            const milikSendiri = jadi !== null && String(jadi.bangunan_id ?? "") === String(b._id);
            if (milikSendiri) {
              if (!placements.some((p) => p.gx === b.gx && p.gy === b.gy)) {
                placements.push({
                  _id: jadi?._id,
                  ...docBaru,
                });
              }
              if (def.id === "ladang") {
                ctx.ladang = { gx: (b.gx ?? 0) + Math.floor((b.w ?? 2) / 2), gy: (b.gy ?? 0) + Math.floor((b.h ?? 2) / 2) };
              }
              if (def.id === "jembatan") {
                for (let dx = 0; dx < (b.w ?? 4); dx++) ctx.jembatan.add(`${b.gx + dx},${b.gy}`);
              }
              if (def.id === "perahu") ctx.perahuAda = true;
            } else {
              kabarBatal = true;
            }
            } // tutup else penjaga petak r38
          }
          b.status = "selesai";
          kabar.push({ jenis: "bangunan", teks: kabarBatal ? `${def.label} batal dibangun: posisinya sudah dipakai bangunan lain.` : `${def.label} selesai dibangun di kampung!`, hari, dibuat_pada: new Date() });
          // RONDE 13 — BANGUNAN SELESAI (event bubble): pembangun
          // mengumumkan ke kampung (jangan timpa interaksi aktif).
          const pembangun = wargaDocs.find((wd) => wd.nama === b.pembangun_nama);
          if (pembangun && (pembangun.interaksi?.sampai_jam ?? -1) <= jam) {
            pembangun.interaksi = { jenis: "ngobrol", dengan: "kampung", hasil: "imbang", teks: `${def.label} selesai dibangun!`, sampai_jam: jam + 1 };
          }
        }
      }
    }
  }

  // Tulis balik.
  if (wargaDocs.length > 0) {
    await wargaCol.bulkWrite(
      wargaDocs.map((w) => ({
        updateOne: {
          filter: { _id: w._id as never },
          update: {
            $set: {
              stat: w.stat,
              lokasi: w.lokasi,
              tujuan: w.tujuan,
              node: w.node,
              aksi_sekarang: w.aksi_sekarang,
              status_teks: w.status_teks,
              tempat_kerja: w.tempat_kerja,
              progres_aksi_pct: w.progres_aksi_pct,
              fase_siklus: w.fase_siklus,
              istirahat_sisa: w.istirahat_sisa,
              umur: w.umur,
              tahap_hidup: w.tahap_hidup,
              sim_hari: w.sim_hari,
              stamina: w.stamina,
              lapar: w.lapar,
              sehat: w.sehat,
              healtpoint: w.sehat,
              perkakas: w.perkakas,
              interaksi: w.interaksi,
              interaksiCooldown: w.interaksiCooldown ?? {},
              target_hewan: w.target_hewan,
              sedang_berenang: w.sedang_berenang,
              daging_target: w.daging_target ?? null,
              membawa_daging: w.membawa_daging ?? null,
              hunian: w.hunian,
              // PERBAIKAN AKAR 2026-11-04: ledger kumpul harian WAJIB
              // tersimpan, kalau tidak cap harian reset tiap poll (3 detik)
              // dan tiap poll memberi jatah penuh lagi — itulah yang dulu
              // menumpuk stok sampai ratusan ribu walau ada clamp gudang.
              kumpul_hari: w.kumpul_hari,
              kumpul_harian: w.kumpul_harian ?? {},
            },
          },
        },
      }))
    );
  }
  for (const b of antrean) {
    const idStr = String(b._id);
    if (idStr.startsWith("npc-")) {
      await bangunanCol.insertOne({
        tipe: b.tipe,
        status: b.status,
        progres: b.progres ?? 0,
        gx: b.gx ?? null,
        gy: b.gy ?? null,
        w: b.w ?? null,
        h: b.h ?? null,
        pembangun_nama: b.pembangun_nama ?? null,
        pemrakarsa: b.pemrakarsa ?? null,
        alasan: b.alasan ?? null,
        sumber_alasan: b.sumber_alasan ?? "scripted",
        dibuat_hari: ctx.hari,
        dibuat_pada: new Date(),
      });
    } else {
      await bangunanCol.updateOne(
        { _id: b._id as never },
        {
          $set: {
            status: b.status,
            progres: b.progres,
            gx: b.gx ?? null,
            gy: b.gy ?? null,
            w: b.w ?? null,
            h: b.h ?? null,
            pembangun_nama: b.pembangun_nama ?? null,
            pemrakarsa: b.pemrakarsa ?? null,
            alasan: b.alasan ?? null,
            sumber_alasan: b.sumber_alasan ?? "scripted",
          },
        }
      );
    }
  }
  // RONDE 10 (lanjutan): hidangan paviliun — placements TIDAK ditulis
  // balik otomatis, jadi update eksplisit hanya bila berubah jam ini.
  if (ctx.restoranBerubah && ctx.restoran && ctx.restoran._id !== undefined) {
    await tilesCol.updateOne(
      { _id: ctx.restoran._id as never },
      { $set: { hidangan: ctx.restoran.hidangan ?? 0 } }
    );
  }
  // RONDE 18 — tulis-balik ubin jalan baru (upsert per ubin: advance
  // bersamaan tidak membuat 2 dokumen jalan di ubin sama).
  if ((ctx.jalanBaru?.length ?? 0) > 0) {
    for (const j of ctx.jalanBaru!) {
      await jalanCol.updateOne(
        { gx: j.gx, gy: j.gy },
        { $setOnInsert: { gx: j.gx, gy: j.gy, segmen: j.segmen } },
        { upsert: true }
      );
    }
  }
  // RONDE 20 — RE-ORIENTASI RUMAH: jalan baru selesai -> rumah di
  // sekitarnya (jarak Manhattan <= 8 dari pusat rumah ke ubin jalan
  // baru) menghadap ke jalan terdekat yang ada sekarang. Rumah jauh
  // dari jalan tetap pada orientasi lamanya.
  if ((ctx.jalanBaru?.length ?? 0) > 0 && ctx.jalanSelesai) {
    const roadSet = ctx.jalanSelesai;
    const sudahDicek = new Set<string>();
    for (const j of ctx.jalanBaru!) {
      for (const p of placements) {
        const key = String(p._id);
        if (sudahDicek.has(key)) continue;
        const defP = bangunanById(p.kind);
        if (!defP || (defP.kapasitas ?? 0) <= 0) continue;
        const cx = p.gx + Math.floor((p.w ?? 1) / 2);
        const cy = p.gy + Math.floor((p.h ?? 1) / 2);
        if (Math.abs(cx - j.gx) + Math.abs(cy - j.gy) > 8) continue;
        sudahDicek.add(key);
        const rotBaru = rotasiKeJalan(p.gx, p.gy, p.w ?? 1, p.h ?? 1, roadSet);
        if (rotBaru !== ((p as any).rotasi ?? 0)) {
          (p as any).rotasi = rotBaru;
          await tilesCol.updateOne({ _id: p._id as never }, { $set: { rotasi: rotBaru } });
        }
      }
    }
  }
  // Hewan: hapus yang diburu, update posisi, tambah respawn.
  if (ctx.hewanHilang.size > 0) {
    const { ObjectId } = await import("mongodb");
    const ids = [...ctx.hewanHilang].filter((id) => /^[0-9a-fA-F]{24}$/.test(id)).map((id) => new ObjectId(id));
    if (ids.length > 0) await hewanCol.deleteMany({ _id: { $in: ids } });
  }
  const hewanGerak = ctx.hewan.filter((h) => !ctx.hewanHilang.has(String(h._id)));
  for (const h of hewanGerak) {
    const idStr = String(h._id);
    // RONDE 15 — HP ikut ditulis balik (dulu hanya gx/gy, jadi luka
    // hewan hilang tiap advanceWorld — bar HP tidak pernah berkurang).
    const hpTulis = typeof h.hp === "number" ? h.hp : hewanById(h.jenis)?.hp ?? 1;
    if (idStr.startsWith("baru-")) {
      await hewanCol.insertOne({ jenis: h.jenis, gx: h.gx, gy: h.gy, hp: hpTulis });
    } else if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
      const { ObjectId } = await import("mongodb");
      await hewanCol.updateOne({ _id: new ObjectId(idStr) }, { $set: { gx: h.gx, gy: h.gy, hp: hpTulis } });
    }
  }
  // RONDE 10: daging — hapus yang diambil/kedaluwarsa, tambah yang baru.
  if (ctx.dagingHapus && ctx.dagingHapus.size > 0) {
    await dagingCol.deleteMany({ _id: { $in: [...ctx.dagingHapus] } } as never);
  }
  if (ctx.daging) {
    const sudahAda = new Set(dagingDocs.map((d) => d._id));
    const baruDaging = ctx.daging.filter((d) => !sudahAda.has(d._id));
    if (baruDaging.length > 0) {
      await dagingCol.insertMany(baruDaging.map((d) => ({ _id: d._id, jenis: d.jenis, gx: d.gx, gy: d.gy, pangan: d.pangan, kulit: d.kulit, dibuat_jam: d.dibuat_jam })) as never);
    }
  }
  const kabarCol = await getCollection("kabar");
  if (kabar.length > 0) await kabarCol.insertMany(kabar);
  const totalKabar = await kabarCol.countDocuments({});
  if (totalKabar > 60) {
    const lebih = await kabarCol.find({}).sort({ _id: 1 }).limit(totalKabar - 50).toArray();
    if (lebih.length > 0) {
      await kabarCol.deleteMany({ _id: { $in: lebih.map((d) => d._id) } });
    }
  }
  const simBaruJam = dunia.sim_jam + tertinggal + lompat;
  const simBaruHari = Math.floor(simBaruJam / 24);
  const nodeSisaObj: Record<string, number> = {};
  for (const [k, v] of nodeSisa) nodeSisaObj[k] = v;
  const nodeRegrowObj: Record<string, number> = {};
  for (const [k, v] of nodeRegrow) nodeRegrowObj[k] = v;
  const nodeSpawnTertundaObj: Record<string, { kind: NodeKind; gx: number; gy: number; jam: number }> = {};
  for (const [k, v] of nodeSpawnTertunda) nodeSpawnTertundaObj[k] = v;
  await getCollection<DuniaDoc>("dunia").then((c) =>
    c.updateOne(
      { _id: "utama" },
      { $set: { stok, sim_hari: simBaruHari, sim_jam: simBaruJam, node_sisa: nodeSisaObj, node_regrow: nodeRegrowObj, node_spawn: nodeSpawn.slice(-40), node_spawn_tertunda: nodeSpawnTertundaObj, jam_v4: true, last_llm_jam: lastLlmJam, ikan_sungai: ctx.ikanSungai ?? IKAN_CAP } }
    )
  );
  return { advanced: tertinggal, day: simBaruHari, jam: simBaruJam };
}
