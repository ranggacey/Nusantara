// Figur prosedural 12px zaman batu (pakaian kulit/tanah, bukan gaya modern).
// Satu figur = kolom lurus 3 lebar x 12 tinggi (pixel):
//   baris 0-1 rambut, 2-3 kulit (kepala), 4-7 baju (badan kulit),
//   8-10 celana (kaki), 11 sepatu kulit. Tanpa wajah — figur generik saja.
// Warna dari figur-palet.json. Seed deterministik dari nomor warga (FNV-1a):
// warna TETAP seumur hidup.
import paletJson from "./figur-palet.json";

export interface PaletFigur {
  kulit: string;
  rambut: string;
  baju: string;
  celana: string;
  sepatu: string;
}

const KULIT = paletJson.kulit as string[];
const RAMBUT = paletJson.rambut as string[];
const BAJU = paletJson.baju as string[];
const CELANA = paletJson.celana as string[];
const SEPATU = paletJson.sepatu as string;

// FNV-1a 32-bit.
export function hashNomor(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function paletDariNomor(nomor: string): PaletFigur {
  const h = hashNomor(nomor || "0000");
  return {
    kulit: KULIT[h % KULIT.length],
    rambut: RAMBUT[(h >>> 3) % RAMBUT.length],
    baju: BAJU[(h >>> 6) % BAJU.length],
    celana: CELANA[(h >>> 10) % CELANA.length],
    sepatu: SEPATU,
  };
}

// Frame: 0 = diam, 1 = jalan A (kaki membuka), 2 = jalan B (kaki menutup + bob 1px).
export interface FrameFigur {
  rows: (string | null)[][];
  bob: number;
}

export function frameFigur(p: PaletFigur, frame: 0 | 1 | 2): FrameFigur {
  const H = p.rambut;
  const S = p.kulit;
  const B = p.baju;
  const C = p.celana;
  const F = p.sepatu;
  const rows: (string | null)[][] = [
    [H, H, H],
    [H, H, H],
    [S, S, S],
    [S, S, S],
    [B, B, B],
    [B, B, B],
    [B, B, B],
    [B, B, B],
    [C, C, C],
    [C, C, C],
    [C, C, C],
    [F, F, F],
  ];
  if (frame === 1) {
    rows[10] = [C, null, C];
    rows[11] = [F, null, F];
  }
  if (frame === 2) {
    rows[10] = [null, C, null];
    rows[11] = [null, F, null];
  }
  return { rows, bob: frame === 2 ? -1 : 0 };
}
