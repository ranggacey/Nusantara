// Skala proporsional dunia nyata (satuan: 1 tile = 1 unit).
// Orang = acuan (~1,83 unit). Rumah & pohon HARUS jelas lebih besar dari
// orang — bukan sebaliknya (keluhan testing ronde 1: gubuk tampak lebih
// kecil dari orang; pohon hanya setinggi orang).
export const ORANG_TINGGI = 1.83;
// Gubuk: dinding 2,2 + atap 2,0 = 4,2 (≈ 2,3x orang).
export const GUBUK_DINDING = 2.2;
export const GUBUK_ATAP = 2.0;
export const GUBUK_TINGGI = GUBUK_DINDING + GUBUK_ATAP;
// Pohon: batang 2,2 + tajuk (puncak 5,8) ≈ 3,2x orang.
export const POHON_BATANG = 2.2;
export const POHON_TAJUK_PUNCAK = 5.8;
export const POHON_TINGGI = POHON_TAJUK_PUNCAK;
