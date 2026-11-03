// Hewan zaman batu — prosedural (data), AI di sim.ts, visual di Map3D.
// JINAK: rusa, kelinci, ayam — mengembara, kabur bila didekati, bisa diburu.
// BUAS: babi hutan, serigala, beruang — mengembara, menyerang warga yang
// terlalu dekat; warga kabur atau pemburu melawan.
// Diburu -> daging (pangan) + kulit. Hewan otoritatif server (koleksi hewan).
export type HewanId = "rusa" | "kelinci" | "ayam" | "babi_hutan" | "serigala" | "beruang";

export interface HewanDef {
  id: HewanId;
  label: string;
  jinak: boolean;
  pangan: number; // daging yang didapat bila diburu
  kulit: number;
  // RONDE 15 — HP hewan (sistem berburu): tiap serangan pemburu
  // mengurangi HP; HP 0 -> mati -> daging (alur r10). Jinak kecil HP
  // rendah (cepat diburu), buas HP tinggi (perlu beberapa kali hit).
  hp: number;
  // Jarak (tile): kabur/serang bila warga sedekat ini.
  jarakReaksi: number;
  kecepatan: number; // tile/jam game (ronde 6: dilipat 6x bersama jalan warga; tampil 1,0..2,5 tile/detik)
  warna: number; // warna tubuh 3D
}

export const HEWAN: HewanDef[] = [
  { id: "rusa", label: "Rusa", jinak: true, pangan: 6, kulit: 2, hp: 4, jarakReaksi: 3, kecepatan: 120, warna: 0x8a5a33 },
  { id: "kelinci", label: "Kelinci", jinak: true, pangan: 2, kulit: 0, hp: 2, jarakReaksi: 2, kecepatan: 150, warna: 0xd9c8a9 },
  { id: "ayam", label: "Ayam Hutan", jinak: true, pangan: 2, kulit: 0, hp: 2, jarakReaksi: 2, kecepatan: 60, warna: 0xf5f0e1 },
  { id: "babi_hutan", label: "Babi Hutan", jinak: false, pangan: 5, kulit: 1, hp: 6, jarakReaksi: 2, kecepatan: 90, warna: 0x5b4636 },
  { id: "serigala", label: "Serigala", jinak: false, pangan: 4, kulit: 2, hp: 8, jarakReaksi: 3, kecepatan: 150, warna: 0x6b7280 },
  { id: "beruang", label: "Beruang", jinak: false, pangan: 10, kulit: 3, hp: 12, jarakReaksi: 3, kecepatan: 60, warna: 0x3f2d20 },
];

export function hewanById(id: string): HewanDef | undefined {
  return HEWAN.find((h) => h.id === id);
}

export function labelHewan(id: string): string {
  return hewanById(id)?.label ?? id;
}

// Jumlah awal hewan di dunia baru (diisi sim saat pertama kali ada warga
// atau saat dunia kosong hewan — deterministik dari seed, bukan acak liar).
export const HEWAN_AWAL: { id: HewanId; n: number }[] = [
  { id: "rusa", n: 6 },
  { id: "kelinci", n: 8 },
  { id: "ayam", n: 6 },
  { id: "babi_hutan", n: 4 },
  { id: "serigala", n: 3 },
  { id: "beruang", n: 2 },
];
