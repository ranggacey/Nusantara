// Helper tampilan 3D (murni, bisa dites tanpa WebGL).
// - paceTampil: FALLBACK lama (burst) — hanya dipakai bila server tidak
//   mengirim kecepatan. Jangan dipakai untuk warga/hewan normal lagi.
// - lajuServerPerDetik + langkahDisplay (RONDE 5): pacing trayektori
//   kontinyu. Server bergerak 1 jam game per menit nyata; display harus
//   berjalan dengan laju server yang sama (kecepatan/60 unit/detik,
//   1 tile = 1 unit) menuju TUJUAN — bukan bergegas ke posisi server
//   lalu diam ~50 detik menunggu update berikutnya (pola burst-diam
//   yang dikeluhkan user: "jalan lemot terus diemnya lama").
//   Dengan pacing ini display bergerak SETIAP detik selama menuju tujuan;
//   diam hanya terjadi di tujuan (menunggu fase berikutnya) — dan di
//   sana animasi idle hidup (lihat Map3D: kepala menoleh + napas).
// - bubbleInteraksiAktif (RONDE 13 — event-only): bubble interaksi
//   hanya tampil dalam jendela SINGKAT: [dibuat, sampai_jam] dengan
//   sampai_jam = dibuat + 1 jam game. Guard <= 1 juga memotong jendela
//   lama (+4 jam, era pra-r13) yang mungkin masih tersimpan di DB.
//   Layar mayoritas waktu BERSIH dari bubble: bubble hanya muncul saat
//   event (ngobrol/debat/gelud/diserang/momen), bukan tiap jam.
// - teksBubbleEvent: keputusan bubble MURNI (bisa dites tanpa WebGL):
//   hanya interaksi aktif yang menghasilkan teks bubble. Dialog ambient
//   (obrolanTampil/dialogUntukPeran) TIDAK LAGI dirender sebagai bubble
//   sejak r13 — datanya tetap ada, tampilannya dimatikan.
// - blokObrolan: obrolan santai berputar tiap 4 jam game (bukan per hari,
//   supaya dialog tidak itu-itu saja seharian). Sejak r13 tidak dipakai
//   untuk bubble — dipertahankan untuk data/log + test lama.

export function paceTampil(jump: number): number {
  return Math.min(1.2, Math.max(0.35, jump / 25));
}

// Ambang SNAP desync (RONDE 6 — perbaikan bug sawtooth ronde 5):
// display berjalan menuju TUJUAN dengan laju server, sementara posisi
// server (tx) hanya melompat tiap batas jam game (1 menit nyata).
// Di tengah menit, display bisa 1 lompatan server penuh (≤150 tile)
// DI DEPAN posisi server basi — jadi ambang snap berapa pun ≤150 akan
// menarik display MUNDUR berulang kali (jalan 8 tile, snap balik, jalan
// lagi, snap lagi) — itulah yang membuat gerakan ronde 5 terlihat
// "lemot" meski laju display sudah kontinyu. Ambang 250 = jaring
// pengaman saja untuk desync nyata (tab lama tak aktif / data rusak);
// selama bermain normal, display selalu mengejar TUJUAN terkini
// (diperbarui tiap poll 3 detik) dan menyusul sendiri saat fase diam
// (kumpul/istirahat). HARUS > lompatan server maksimum (150).
export const AMBANG_SNAP_DESYNC = 250;

// Laju display kontinyu dari kecepatan server (tile/jam game).
// RONDE 9: durasi jam bervariasi (siang 60 detik, malam 6 detik) —
// laju = kecepatan / durasiJamDetik. Default 60 detik (kompatibel
// pemanggil lama + test lama). Di malam hari display berjalan 10x
// lebih cepat (kecepatan/6) supaya menempuh lompatan jam-an dalam
// 6 detik — malam TERASA dipercepat, bukan cuma angka jamnya.
// Snap 250 + kunci tujuan tetap melindungi (lompatan ≤150 < 250).
export function lajuServerPerDetik(kecepatanPerJam: number, durasiJamDetik = 60): number {
  if (!(kecepatanPerJam > 0)) return 0;
  if (!(durasiJamDetik > 0)) return kecepatanPerJam / 60;
  return kecepatanPerJam / durasiJamDetik;
}

// Pose tidur (RONDE 9 — animasi tiduran, murni + dites):
// tidur = badan horizontal (rotasi X -90°), digeser +0,9 ke depan supaya
// badan terpusat di ubin (badan sepanjang ~1,83 unit: dari z 0..-1,83
// jadi z -0,93..+0,87 setelah geser). Bangun = rotasi 0, geser 0.
// Posisi Y diatur Map3D (0,28 + napas) — bukan di sini — karena radius
// badan 0,26 harus bertumpu di tanah, bukan tenggelam (0,06 akan
// menenggelamkan badan 0,2 unit ke tanah).
export function poseTidur(tidur: boolean): { rotX: number; centerZ: number } {
  return tidur ? { rotX: -Math.PI / 2, centerZ: 0.9 } : { rotX: 0, centerZ: 0 };
}

// Spesifikasi rambut per gender (RONDE 9 — male pendek, female panjang).
// Murni + dites; dipakai buildCitizen (semua warga) + potret kartu
// profil + mini potret kartu gacha. Gender tak dikenal -> pendek
// (tampilan lama dipertahankan, bukan crash).
export function specRambut(gender: string | null | undefined): { panjang: boolean } {
  return { panjang: gender === "perempuan" };
}

// Gaya tombol gender (RONDE 9 — perbaikan bug "tombol male/female kek
// gabisa dipencet"). DIAGNOSIS (inspeksi kode, bukan tebakan): handler
// onClick SUDAH terpasang + modal z-60 paling atas + tidak ada
// pointer-events:none — tombolnya sebenarnya BERUBAH state, tapi TIDAK
// KELIHATAN: .md-btn punya `border: none` di CSS, jadi borderColor emas
// lama adalah NO-OP, dan fontWeight 700->800 nyaris tak kentara di HP.
// User mengira tidak bisa dipencet. Perbaikan: gaya terpilih vs tidak
// terpilih HARUS kontras jelas (emas vs gelap + border NYATA 2px, bukan
// borderColor saja) + tap target lebih besar + label "Gender terpilih".
// Helper murni ini dites: latar terpilih ≠ tak terpilih + ada border.
export function gayaTombolGender(terpilih: boolean): {
  background: string;
  color: string;
  border: string;
  fontWeight: number;
} {
  if (terpilih) {
    return { background: "#facc15", color: "#0b1e3a", border: "2px solid #facc15", fontWeight: 800 };
  }
  return { background: "#1e293b", color: "#e2f5ff", border: "2px solid #475569", fontWeight: 600 };
}

// Ayunan perkakas saat kumpul (RONDE 10 — tebang kelihatan):
// kapak/beliung = ayunan LAMBAT + KUAT (~1 Hz, amplitudo 0,9 rad) —
// seperti menebang/memahat sungguhan, bukan getar cepat generik lama
// (sin(t*10)*0,55). Perkakas lain tetap memakai nilai lamanya di Map3D
// (obor/keranjang/tongkat punya animasi khusus; palu tetap generik).
export function ayunanPerkakas(tool: string, t: number): number {
  if (tool === "kapak" || tool === "beliung") {
    return Math.sin(t * 6) * 0.9 - 0.1;
  }
  return Math.sin(t * 10) * 0.55 - 0.2;
}

// Palet cahaya per mode waktu (POLISH ronde 5): sore = golden hour
// hangat, bukan siang biasa — langit terasa hidup tanpa mengubah
// mekanik apa pun. Malam/siang sama dengan palet lama.
export type ModeCahaya = "siang" | "sore" | "malam";
export function paletCahaya(mode: ModeCahaya): {
  bg: number; hemi: number; sun: number; sunVisible: boolean; moon: boolean; stars: boolean;
} {
  if (mode === "malam") return { bg: 0x0b1026, hemi: 0.25, sun: 0xfff2d9, sunVisible: false, moon: true, stars: true };
  if (mode === "sore") return { bg: 0xf2c078, hemi: 0.9, sun: 0xffb066, sunVisible: true, moon: false, stars: false };
  return { bg: 0xbfe3f5, hemi: 1.0, sun: 0xfff2d9, sunVisible: true, moon: false, stars: false };
}

// Pusat (rata-rata) dari sekumpulan titik — untuk bingkai kamera awal
// ke kampung. Kosong -> (0,0) agar tidak pernah NaN.
export function pusatDariTitik(points: { x: number; z: number }[]): { x: number; z: number } {
  if (points.length === 0) return { x: 0, z: 0 };
  let sx = 0, sz = 0;
  for (const p of points) { sx += p.x; sz += p.z; }
  return { x: sx / points.length, z: sz / points.length };
}

// Satu langkah display menuju tujuan (murni, tanpa overshoot).
// Mengembalikan posisi baru + jarak yang ditempuh + apakah sudah tiba
// (jarak ke tujuan <= 0,03 — ambang "bergerak" yang sama di Map3D).
export function langkahDisplay(
  dx: number,
  dz: number,
  ux: number,
  uz: number,
  speedPerSec: number,
  dt: number,
): { x: number; z: number; moved: number; tiba: boolean } {
  const vx = ux - dx;
  const vz = uz - dz;
  const dist = Math.hypot(vx, vz);
  if (dist <= 0.03 || !(speedPerSec > 0) || !(dt > 0)) {
    return { x: dx, z: dz, moved: 0, tiba: dist <= 0.03 };
  }
  const step = Math.min(dist, speedPerSec * dt);
  return {
    x: dx + (vx / dist) * step,
    z: dz + (vz / dist) * step,
    moved: step,
    tiba: step >= dist,
  };
}

export function bubbleInteraksiAktif(sampaiJam: number, jamNow: number): boolean {
  // RONDE 15 — jendela (dibuat, sampai], BUKAN [dibuat, sampai]:
  // selisih harus > 0. Sebelumnya `jamNow <= sampaiJam` membuat
  // generasi SEBELUMNYA (sampai = jamNow) tetap tampil selama satu jam
  // penuh bersama generasi baru (sampai = jamNow+1) — bubble tampil
  // 2x lipat (inilah 8-9 bubble sekaligus di video user: pasangan jam
  // lalu + pasangan jam ini, padahal masing-masing hanya 3-5).
  // Dengan > 0, tiap event tampil tepat 1 jam game saja.
  return sampaiJam - jamNow > 0 && sampaiJam - jamNow <= 1;
}

// RONDE 15 — pip pentung kumpul: 1 pip per 10% progres (10 pip per
// ronde kumpul). Murni + dites. Dipakai Map3D (tampil di bawah label
// warga saat kumpul) supaya "10x pentung" KELIHATAN, bukan hanya ayunan.
export function hitungPipKumpul(progresPct: number): number {
  if (!(progresPct > 0)) return 0;
  return Math.min(10, Math.floor(progresPct / 10));
}

// RONDE 15 — lebar bar HP hewan (persen, 0..100). Murni + dites.
export function lebarBarHp(hp: number, hpMax: number): number {
  if (!(hpMax > 0)) return 0;
  return Math.max(0, Math.min(100, Math.round((hp / hpMax) * 100)));
}

// RONDE 13 — teks bubble EVENT-ONLY (murni, dites tanpa WebGL).
// Hanya interaksi sim yang aktif yang menghasilkan bubble; segala yang
// lain (dialog ambient, tidur) menghasilkan string kosong = bubble
// disembunyikan. Map3D memakai helper ini sebagai satu-satunya sumber
// teks bubble. RONDE 15: jendela dipersempit (lihat bubbleInteraksiAktif)
// sehingga generasi lalu tidak numpuk dengan generasi baru.
export function teksBubbleEvent(
  interaksi: { teks?: string; sampai_jam?: number } | null | undefined,
  jamNow: number
): string {
  if (!interaksi || typeof interaksi.sampai_jam !== "number") return "";
  if (!bubbleInteraksiAktif(interaksi.sampai_jam, jamNow)) return "";
  return String(interaksi.teks ?? "");
}

// RONDE 12 — cari hewan buas penyerang terdekat untuk animasi lunge:
// hewan buas yang labelnya cocok (interaksi "diserang" hanya menyimpan
// label, mis. "Serigala", bukan id hewan) + paling dekat dengan warga,
// dalam radius tile. Murni (labelOf disuntik supaya bisa dites tanpa
// impor data hewan). Kembalikan id hewan atau null.
export function cariHewanBuas(
  hewan: { id: string; jenis: string; x: number; z: number }[],
  labelTarget: string,
  x: number,
  z: number,
  radius: number,
  labelOf: (jenis: string) => string
): string | null {
  let terbaik: string | null = null;
  let jarakTerbaik = Infinity;
  for (const h of hewan) {
    if (labelOf(h.jenis) !== labelTarget) continue;
    const d = Math.hypot(h.x - x, h.z - z);
    if (d <= radius && d < jarakTerbaik) {
      jarakTerbaik = d;
      terbaik = h.id;
    }
  }
  return terbaik;
}

// Kunci tujuan display (RONDE 8 — anti-loop, defense in depth).
// Tujuan yang dikejar display HANYA berpindah bila server benar-benar
// mengubahnya: koordinat tujuan berubah ATAU fase berubah. Data server
// antar poll terbukti stabil (4 poll berurutan: tujuan/posisi/fase
// identik), jadi dalam permainan normal kunci ini tidak mengubah apa
// pun — tapi ia menjamin "tujuan display stabil antar poll" sebagai
// INVARIAN, bukan asumsi: warga yang sudah tiba DIAM sampai ada tujuan
// baru yang sah, tidak pernah goyang karena jitter data.
// - Bila tujuan ada (jalan/kembali): kunci = koordinat tujuan + fase.
// - Bila tujuan null (istirahat): goal = posisi server; kunci memakai
//   posisi server + fase (posisi istirahat statis, jadi kunci stabil;
//   bila posisi server bergerak — mis. momen tiba-kembali — goal ikut
//   ke posisi baru yang sah).
// Kunci TIDAK mengubah kecepatan (1,5–2,5 tile/detik tetap) dan TIDAK
// menyentuh ambang snap (250 tetap) — ia hanya melarang goal berpindah
// tanpa perubahan server yang nyata.
export type TujuanTerkunci = { x: number; z: number; key: string };
export function kunciTujuan(
  lama: TujuanTerkunci | null,
  goalServer: { x: number; z: number },
  kunciBaru: string,
): TujuanTerkunci {
  if (lama && lama.key === kunciBaru) return lama;
  return { x: goalServer.x, z: goalServer.z, key: kunciBaru };
}
export function kunciTujuanBaru(
  tujuan: { gx: number; gy: number } | null,
  fase: string,
  posServerDunia: { x: number; z: number },
  goalServerDunia: { x: number; z: number },
): { goal: { x: number; z: number }; key: string } {
  if (tujuan && typeof tujuan.gx === "number" && typeof tujuan.gy === "number") {
    return { goal: { x: goalServerDunia.x, z: goalServerDunia.z }, key: `t:${tujuan.gx},${tujuan.gy}|${fase}` };
  }
  return { goal: { x: posServerDunia.x, z: posServerDunia.z }, key: `p:${posServerDunia.x},${posServerDunia.z}|${fase}` };
}

export function blokObrolan(jamNow: number): number {
  return Math.floor(jamNow / 4);
}

export function obrolanTampil(idx: number, jamNow: number): boolean {
  return (blokObrolan(jamNow) + idx) % 3 === 0;
}

// isNight: malam render HANYA dari fase jam game server — tidak ada
// override/setting pengguna. Siang/malam dari sistem, bukan dari user.
// Fase selain "malam" (pagi/siang/sore/kosong/tak dikenal) = siang.
export function isNight(fase: string): boolean {
  return fase === "malam";
}

// Ayunan kaki WARGA (ronde 3/4, stride ronde 6): kaki TERIKAT jarak tempuh, bukan timer.
// - langkahAyunan: tambahan siklus per frame dari jarak yang ditempuh
//   (satu siklus penuh = 2 langkah = 2x panjang langkah).
// - sudutAyunan: sudut kaki dari siklus (kaki kiri +, kanan -).
// Stride 1,0 tile (ronde 6; dulu 0,75): pada laju tampil 2 tile/detik,
// cadence = 2,0 langkah/detik — seperti ORANG JALAN. Dengan stride lama,
// laju baru akan memutar kaki 2,67 langkah/detik (terburu-buru /
// seperti lari kecil) — kaki harus sinkron dengan tanah, bukan timer
// lepas (jangan moonwalk: kaki cepat tapi tanah pelan, atau sebaliknya).
// Amplitudo default 1,0 rad (~57°) + kaki panjang/tebal + sepatu kontras
// di Map3D — ayunan harus JELAS TERLIHAT di HP zoom normal (dulu 0,7 rad
// dengan kaki 0,55 unit = gerak kaki hanya ~0,35 unit, beberapa piksel).
export function langkahAyunan(stepJalan: number, panjangLangkah = 1.0): number {
  if (stepJalan <= 0) return 0;
  return (stepJalan / panjangLangkah) * Math.PI;
}

export function sudutAyunan(siklus: number, amplitudo = 1.0): number {
  return Math.sin(siklus) * amplitudo;
}

// Ayunan kaki HEWAN: gaya diagonal (kaki depan-kiri + belakang-kanan
// seirama, berlawanan dengan depan-kanan + belakang-kiri) — seperti hewan
// berjalan sungguhan, bukan empat kaki serentak.
export function langkahHewan(stepJalan: number, panjangLangkah = 0.3): number {
  if (stepJalan <= 0) return 0;
  return (stepJalan / panjangLangkah) * Math.PI;
}

// Pasangan kaki hewan per fase: [depanKiri, belakangKanan] = +sudut,
// [depanKanan, belakangKiri] = -sudut.
export function sudutKakiHewan(siklus: number, kaki: "depanKiri" | "depanKanan" | "belakangKiri" | "belakangKanan", amplitudo = 0.8): number {
  const s = Math.sin(siklus) * amplitudo;
  return kaki === "depanKiri" || kaki === "belakangKanan" ? s : -s;
}
