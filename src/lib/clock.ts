// Jam game v4 (RONDE 9 — fast-forward malam):
// - SIANG (06:00–20:00): 1 jam game = 60 detik nyata (tidak berubah).
// - MALAM (20:00–06:00): 1 jam game = 6 detik nyata (dipercepat 10x).
// Satu hari game = 14 jam siang x 60 detik + 10 jam malam x 6 detik
// = 900 detik nyata = 15 menit nyata (dulu 24 menit).
// Jam game adalah sumber kebenaran: semua laju sim PER JAM GAME tidak
// berubah (kumpul/konstruksi/kebutuhan per jam sama) — yang berubah
// hanya durasi nyata tiap jam, menurut fasenya.
// Fase (world.ts, selaras ronde 9): pagi 6-10, siang 10-15, sore 15-20,
// malam 20-6. Menggantikan jam v3 (1 jam = 60 detik untuk semua jam).
import { faseDariJam, type FaseWaktu, type Cuaca } from "./world";

export const HOUR_MS = 60_000;
export const DAY_MS = 24 * HOUR_MS;

// Batas fast-forward malam (perintah user: 20:00–06:00).
export const JAM_MALAM_MULAI = 20;
export const JAM_MALAM_AKHIR = 6;
export const MALAM_MS_PER_JAM = 6_000;

export function jamAdalahMalam(jamHari: number): boolean {
  return jamHari >= JAM_MALAM_MULAI || jamHari < JAM_MALAM_AKHIR;
}

// Durasi nyata satu jam game, menurut jam-ke-berapa dalam hari itu.
export function durasiJamMs(jamHari: number): number {
  return jamAdalahMalam(jamHari) ? MALAM_MS_PER_JAM : HOUR_MS;
}

// Total milidetik nyata untuk (jamTotal jam penuh + frac jam berikutnya),
// dihitung dari epoch (jam 0 = hari pertama, jam 0). Dipakai migrasi
// v3->v4 supaya waktu tampil TIDAK melompat saat durasi malam berubah.
export function realMsUntukJam(jamTotal: number, frac: number): number {
  let total = 0;
  for (let j = 0; j < jamTotal; j++) total += durasiJamMs(j % 24);
  return total + frac * durasiJamMs(jamTotal % 24);
}

export interface GameTime {
  jamTotal: number; // total jam game sejak epoch (0-based, monotonik)
  day: number; // total hari sejak epoch (0-based) = floor(jamTotal / 24)
  year: number; // tahun game (1-based)
  hariKeTahun: number; // 1..365
  jam: number; // 0..23
  menit: number; // 0..59
  fase: FaseWaktu;
}

export function gameTime(epochMs: number, nowMs: number): GameTime {
  let sisa = Math.max(0, nowMs - epochMs);
  let jamTotal = 0;
  // Jalan per batas jam (bukan bagi rata): tiap jam punya durasi
  // sendiri (60 detik siang, 6 detik malam). O(jamTotal) — beberapa
  // ribu iterasi, sepele untuk tiap request.
  while (true) {
    const dur = durasiJamMs(jamTotal % 24);
    if (sisa < dur) {
      const fracJam = sisa / dur;
      const day = Math.floor(jamTotal / 24);
      const jam = jamTotal % 24;
      const menit = Math.floor(fracJam * 60);
      return {
        jamTotal,
        day,
        year: Math.floor(day / 365) + 1,
        hariKeTahun: (day % 365) + 1,
        jam,
        menit,
        fase: faseDariJam(jam),
      };
    }
    sisa -= dur;
    jamTotal++;
  }
}

// Jam v2: 1 hari game = 60.000 ms nyata -> 1 jam game = 2.500 ms nyata.
export const OLD_HOUR_MS = 2_500;

// Migrasi jam v2 -> v3 TANPA mengubah waktu yang sedang tampil dan TANPA
// menghapus warga/resource: total jam game lama dipertahankan persis,
// epoch digeser ke belakang sejauh total jam itu pada laju baru.
// Bukti: jam tampil baru = jam tampil lama (hari, jam, menit sama persis);
// laju ke depan menjadi 24x lebih lambat (1 jam game per menit nyata).
export function migrasiJam(epochLamaMs: number, nowMs: number): { epochBaruMs: number; simJam: number } {
  const totalJamLama = Math.max(0, nowMs - epochLamaMs) / OLD_HOUR_MS;
  const epochBaruMs = nowMs - totalJamLama * HOUR_MS;
  return { epochBaruMs, simJam: Math.floor(totalJamLama) };
}

// Migrasi jam v3 -> v4 (SEKALI, di advanceWorld): epoch lama memakai
// durasi tetap 60 detik/jam. Epoch baru digeser supaya jamTotal yang
// dihitung dengan durasi bervariasi SAMA PERSIS dengan jamTotal lama
// (tidak ada lompatan ~1600 jam — tanpa ini, malam-malam lama yang
// tadinya 60 detik/jam akan dihitung ulang sebagai 6 detik/jam dan jam
// total melonjak). sim_jam TIDAK berubah, jadi tidak ada catch-up jump.
export function migrasiJamV4(epochLamaMs: number, nowMs: number): { epochBaruMs: number; jamTotal: number } {
  const elapsedLama = Math.max(0, nowMs - epochLamaMs);
  const jamTotalLama = Math.floor(elapsedLama / HOUR_MS);
  const fracLama = (elapsedLama % HOUR_MS) / HOUR_MS;
  const epochBaruMs = nowMs - realMsUntukJam(jamTotalLama, fracLama);
  return { epochBaruMs, jamTotal: jamTotalLama };
}

// Cuaca deterministik dari hari game (sama untuk semua user di hari itu).
export function cuacaGame(day: number): Cuaca {
  let h = (day * 2654435761) >>> 0;
  h = (h ^ (h >>> 13)) % 100;
  if (h < 45) return "cerah";
  if (h < 70) return "berawan";
  if (h < 90) return "hujan";
  return "petir";
}

// Umur dalam tahun game dari hari lahir (hari game).
export function umurGame(lahirHari: number, day: number): number {
  return Math.max(0, Math.floor((day - lahirHari) / 365));
}

export function tahapDariUmurGame(umur: number): string {
  if (umur < 13) return "anak";
  if (umur < 17) return "remaja";
  if (umur < 60) return "dewasa";
  return "lansia";
}

// Format tampilan: "Hari 12, Tahun 1 • 08.30".
export function labelJamGame(gt: GameTime): string {
  const hh = String(gt.jam).padStart(2, "0");
  const mm = String(gt.menit).padStart(2, "0");
  return `Hari ${gt.hariKeTahun}, Tahun ${gt.year} • ${hh}.${mm}`;
}
