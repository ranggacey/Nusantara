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

// Jalur display memutar bangunan (2026-11-04, permintaan user: karakter
// tidak boleh KELIHATAN menembus rumah). Sebelumnya display berjalan
// lurus menuju tujuan server sementara sim memutar lewat gerak — di
// layar, warga memotong sudut bangunan. BFS 4-arah di jendela terbatas
// (bbox start+tujuan + 20 ubin, maks 20000 node) menghindari ubin
// rintangan; ubin TUJUAN selalu boleh dimasuki sebagai langkah terakhir
// (cermin aturan sim: tidur malam di rumah sendiri, pintu paviliun).
// Mengembalikan daftar waypoint TANPA titik awal, TERMASUK tujuan; []
// bila sudah di tujuan; null bila tak ada jalur (pemanggil fallback ke
// garis lurus seperti dulu). Murni + dites.
export function jalurTampil(
  dari: { gx: number; gy: number },
  ke: { gx: number; gy: number },
  rintangan: Set<string>,
  isGunung?: (gx: number, gy: number) => boolean,
): { gx: number; gy: number }[] | null {
  if (dari.gx === ke.gx && dari.gy === ke.gy) return [];
  const PAD = 20;
  const minX = Math.min(dari.gx, ke.gx) - PAD;
  const maxX = Math.max(dari.gx, ke.gx) + PAD;
  const minY = Math.min(dari.gy, ke.gy) - PAD;
  const maxY = Math.max(dari.gy, ke.gy) + PAD;
  const key = (gx: number, gy: number) => `${gx},${gy}`;
  const blocked = (gx: number, gy: number): boolean => {
    if (gx === ke.gx && gy === ke.gy) return false;
    if (rintangan.has(key(gx, gy))) return true;
    if (isGunung && isGunung(gx, gy)) return true;
    return false;
  };
  const prev = new Map<string, string>();
  const q: { gx: number; gy: number }[] = [dari];
  const seen = new Set<string>([key(dari.gx, dari.gy)]);
  let head = 0;
  while (head < q.length && seen.size < 60000) {
    const cur = q[head++];
    if (cur.gx === ke.gx && cur.gy === ke.gy) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cur.gx + dx;
      const ny = cur.gy + dy;
      if (nx < minX || nx > maxX || ny < minY || ny > maxY) continue;
      const k = key(nx, ny);
      if (seen.has(k) || blocked(nx, ny)) continue;
      seen.add(k);
      prev.set(k, key(cur.gx, cur.gy));
      q.push({ gx: nx, gy: ny });
    }
  }
  if (!seen.has(key(ke.gx, ke.gy))) return null;
  const path: { gx: number; gy: number }[] = [];
  let k = key(ke.gx, ke.gy);
  while (k !== key(dari.gx, dari.gy)) {
    const [gx, gy] = k.split(",").map(Number);
    path.push({ gx, gy });
    k = prev.get(k) ?? key(dari.gx, dari.gy);
  }
  return path.reverse();
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

// RONDE 52 — opacity label hewan (Ide 38, riset UX 2026-11-06 12:29).
// Hewan yang sedang diburu / terluka tampil penuh (bar HP-nya juga
// tampil pada kondisi yang sama), hewan yang tenang meredup supaya
// label warga + hewan yang relevan yang menonjol. Pola WoW (nameplate
// non-target 20% alpha di luar combat) diadaptasi ke 0.45: label 10px
// di atas kanvas 3D yang terang akan hampir tak terbaca di 20%
// (aturan keterbacaan PUNCHEV). Murni + dites.
export const OPACITY_LABEL_HEWAN_TENANG = 0.45;
export function opacityLabelHewan(relevan: boolean): number {
  return relevan ? 1 : OPACITY_LABEL_HEWAN_TENANG;
}

// RONDE 53 — label hewan memudar dengan jarak kamera (Ide 48, riset UX
// 2026-11-06 12:29: pola WoW "dozens of floating nameplates from afar").
// Kamera membingkai kampung di jarak ~80 (frameAnim Map3D: toP = pusat +
// arah * 80); label disembunyikan bila camDist > 130. Di antara keduanya
// opacity memudar linear supaya label tidak hilang mendadak saat zoom
// keluar — dikali dengan opacity relevansi r52 (diburu/terluka vs tenang),
// jadi hewan yang diburu tetap paling menonjol di jarak berapa pun, dan
// bar HP-nya tetap tampil sebagai sinyal kedua. Murni + dites.
export const JARAK_LABEL_HEWAN_PENUH = 80;
export const JARAK_LABEL_HEWAN_HILANG = 130;
export function opacityLabelHewanJarak(relevan: boolean, camDist: number): number {
  const dasar = opacityLabelHewan(relevan);
  if (!(camDist > JARAK_LABEL_HEWAN_PENUH)) return dasar;
  if (camDist >= JARAK_LABEL_HEWAN_HILANG) return 0;
  const faktor = 1 - (camDist - JARAK_LABEL_HEWAN_PENUH) / (JARAK_LABEL_HEWAN_HILANG - JARAK_LABEL_HEWAN_PENUH);
  return dasar * faktor;
}

// RONDE 54 — tata letak rumpun padi sawah (Ide 28, riset performa
// 2026-11-06 16:29: pola InstancedMesh Glitchless + Aetumi). Murni +
// dites tanpa WebGL. Salinan PERSIS loop lama di createSawahLuas
// (Map3D) — posisi, rotasi, dan warna yang sama — supaya yang berubah
// hanya CARA gambarnya (satu InstancedMesh, bukan satu Mesh per rumpun),
// bukan tampilannya. Pematang silang di tengah tetap kosong
// (|ix| < 0.3 atau |iz| < 0.3 dilewati). y = 0.7 mengikuti alas sawah.
export const PADI_WARNA = [0x84cc16, 0xeab308, 0x65a30d, 0xfacc15];
export type RumpunPadi = { x: number; y: number; z: number; rotY: number; warna: number };
export function rumpunPadi(w: number, h: number): RumpunPadi[] {
  const out: RumpunPadi[] = [];
  for (let ix = -w / 2 + 0.6; ix < w / 2 - 0.4; ix += 0.65) {
    for (let iz = -h / 2 + 0.6; iz < h / 2 - 0.4; iz += 0.65) {
      if (Math.abs(ix) < 0.3 || Math.abs(iz) < 0.3) continue; // jangan di atas pematang
      out.push({
        x: ix,
        y: 0.7,
        z: iz,
        rotY: Math.sin(ix + iz) * Math.PI,
        warna: PADI_WARNA[Math.floor(Math.abs(ix * 7 + iz * 13)) % PADI_WARNA.length],
      });
    }
  }
  return out;
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

// Warga tanpa tugas (Ide 5, irisan Papan Warga, 2026-11-04): definisi
// dari data sim sendiri, bukan tebakan status_teks. Warga dihitung
// tanpa tugas HANYA bila tidak punya target kerja sama sekali
// (node null) DAN sedang istirahat DAN aksinya memang beristirahat
// atau rehat karena stok perannya penuh. Sengaja TIDAK menghitung:
// - santai (node.pseudo "santai"): itu alihan AKTIF (jalan santai /
//   membantu warga lain), bukan diam — warga itu terlihat hidup;
// - istirahat karena stamina/lapar/malam dengan node masih terpasang:
//   itu jeda sementara di tengah tugas, bukan tanpa tugas.
// Display-only: fungsi ini tidak mengubah sim apa pun.
export interface WargaTampilRingkas {
  node?: { pseudo?: string } | null;
  fase_siklus?: string;
  aksi_sekarang?: string;
}

export function wargaTanpaTugas(w: WargaTampilRingkas | null | undefined): boolean {
  if (!w) return false;
  return (
    w.node == null &&
    w.fase_siklus === "istirahat" &&
    (w.aksi_sekarang === "beristirahat" || w.aksi_sekarang === "rehat_stok_penuh")
  );
}

// RONDE 22 — tidur di dalam (r42): warga yang sedang istirahat pada jam
// malam TIDAK dirender di luar — mereka tidur di dalam huniannya.
// Map3D menyembunyikan grup 3D + labelnya; sim tidak berubah (warga
// tetap pulang ke ubin tidurnya, bangun pagi seperti biasa). Istirahat
// siang, jalan pulang, dan kumpul di malam hari tetap terlihat.
export function tidurDiDalam(faseSiklus: string, faseWaktu: string): boolean {
  return faseSiklus === "istirahat" && isNight(faseWaktu);
}

// RONDE 22 — rapikan label bertumpuk (r42), JARAK diperbaiki r44:
// label warga yang berkerumun menumpuk di layar hingga nama tidak
// terbaca. Greedy per urutan layar: urutkan menurut y lalu x; bila
// label bertabrakan, geser ke bawah sampai bebas. Mengembalikan y
// baru per item (urutan input dipertahankan).
// r44 — kenapa 28, bukan 18/20: tinggi pil .map3d-label di CSS =
// 11px x 1.2 + padding 4px + border 2px = ~19px, jadi ambang 18px
// dan langkah 20px menaruh pil hanya 1-2px berjarak — di layar
// terlihat sebagai kolom yang bordernya bersentuhan (observasi
// live 18:29: 5 label menumpuk, border menempel). 28px = tinggi
// pil ~19px + celah ~9px, jadi tumpukan kini terbaca sebagai
// label terpisah. Pil terpilih (.sel) ~27px tingginya, jadi
// celahnya menipis untuk yang itu — diterima, karena hanya satu
// label terpilih dalam satu waktu.
export const JARAK_LABEL_BERTUMPUK = 28;
export function rapikanLabelBertumpuk(items: { x: number; y: number }[]): number[] {
  const out = new Array<number>(items.length).fill(0);
  const order = items.map((_, i) => i).sort((a, b) => items[a].y - items[b].y || items[a].x - items[b].x);
  const placed: { x: number; y: number }[] = [];
  for (const i of order) {
    let y = items[i].y;
    let bentrok = true;
    while (bentrok) {
      bentrok = false;
      for (const p of placed) {
        if (Math.abs(p.y - y) < JARAK_LABEL_BERTUMPUK && Math.abs(p.x - items[i].x) < 70) {
          y += JARAK_LABEL_BERTUMPUK;
          bentrok = true;
          break;
        }
      }
    }
    placed.push({ x: items[i].x, y });
    out[i] = y;
  }
  return out;
}
