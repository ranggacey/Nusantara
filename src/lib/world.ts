// Dunia zaman batu: nama kampung, level perkampungan, fase waktu, cuaca.
// Tidak ada lagi desa/kelurahan/kota, kecamatan, atau hierarki modern.
export const KAMPUNG_AWAL = "Suka Maju";

export function levelPerkampungan(populasi: number): string {
  if (populasi >= 100) return "kampung_besar";
  if (populasi >= 20) return "kampung";
  return "perkampungan";
}

export function labelLevel(level: string): string {
  if (level === "kampung_besar") return "Kampung Besar";
  if (level === "kampung") return "Kampung";
  return "Perkampungan";
}

export type FaseWaktu = "pagi" | "siang" | "sore" | "malam";

// RONDE 9 — batas fase diselaraskan ke fast-forward malam user
// (20:00–06:00): pagi 6-10, siang 10-15, sore 15-20, malam 20-6.
// Dulu: pagi 4-10, sore 15-18, malam 18-4 — malam mulai 18:00, tidak
// cocok dengan "kalo udah jam 20:00 baru istirahat". Sore kini 15-20
// (palet golden hour sore mencakup 15-20).
export function faseDariJam(jam: number): FaseWaktu {
  if (jam >= 6 && jam < 10) return "pagi";
  if (jam >= 10 && jam < 15) return "siang";
  if (jam >= 15 && jam < 20) return "sore";
  return "malam";
}

export function labelFase(f: FaseWaktu): string {
  return { pagi: "Pagi", siang: "Siang", sore: "Sore", malam: "Malam" }[f];
}

export type Cuaca = "cerah" | "berawan" | "hujan" | "petir";

export function labelCuaca(c: Cuaca): string {
  return { cerah: "Cerah", berawan: "Berawan", hujan: "Hujan", petir: "Hujan Petir" }[c];
}

// PRNG deterministik (mulberry32) untuk layout yang sama bagi semua pemain.
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
