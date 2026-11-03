// Gacha zaman batu: stat dulu (INT/STR/AGI/STA), lalu peran menghormati fit.
// Tidak ada kasta, tidak ada pekerjaan modern, tidak ada pelajar.
// Urutan PENTING: rollStat() DULU, baru pilihPeranFit(stat) — jadi contoh
// user terpenuhi: INT tinggi + AGI/STR kecil tidak bisa jadi pemburu/penambang.
import { PERAN, SIFAT, bobotFit, type PeranId } from "./peran";

export interface Stat {
  int: number;
  str: number;
  agi: number;
  sta: number;
}

export function rollStat(r = Math.random): Stat {
  const d = () => Math.floor(r() * 6) + Math.floor(r() * 6) + 1; // 1..11 -> cap 10
  return { int: Math.min(10, d()), str: Math.min(10, d()), agi: Math.min(10, d()), sta: Math.min(10, d()) };
}

// Stat lama (tanpa STA) -> STA default masuk akal (tengah-tengah, 5).
// Dipakai migrasi warga lama saat sim load: tidak crash, tidak hapus warga.
// RONDE 14: batas atas 1..10 DIHAPUS — stat raja iblis Figo (999 semua)
// harus lolos migrasi apa adanya; gacha baru TETAP cap 10 di rollStat.
// Yang tetap dijaga: bukan angka / < 1 -> default 5 (data rusak).
export function statDenganSTA(stat: Record<string, number> | undefined | null): Stat {
  const n = (v: unknown, dflt: number) => (typeof v === "number" && v >= 1 ? v : dflt);
  return {
    int: n(stat?.int, 5),
    str: n(stat?.str, 5),
    agi: n(stat?.agi, 5),
    sta: n(stat?.sta, 5),
  };
}

export function bakatDariStat(s: Stat): "INT" | "STR" | "AGI" | "STA" {
  let best: "INT" | "STR" | "AGI" | "STA" = "INT";
  let bv = s.int;
  if (s.str > bv) { best = "STR"; bv = s.str; }
  if (s.agi > bv) { best = "AGI"; bv = s.agi; }
  if (s.sta > bv) { best = "STA"; bv = s.sta; }
  return best;
}

// Peran menghormati fit: bobot 0 (defisit >= 3) tidak pernah terpilih.
// Fallback bila semua bobot 0 (tidak mungkin dengan syarat sekarang, tapi
// aman): peran dengan defisit terkecil.
export function pilihPeranFit(stat: Stat, r = Math.random): PeranId {
  const bobots = PERAN.map((p) => ({ id: p.id, w: bobotFit(p.id, stat) }));
  const total = bobots.reduce((a, b) => a + b.w, 0);
  if (total <= 0) {
    let best = PERAN[0].id;
    let bestD = Infinity;
    for (const p of PERAN) {
      let d = 0;
      for (const [k, min] of Object.entries(p.syarat)) {
        const punya = (stat as unknown as Record<string, number>)[k] ?? 0;
        if (punya < (min ?? 0)) d += (min ?? 0) - punya;
      }
      if (d < bestD) { bestD = d; best = p.id; }
    }
    return best;
  }
  let x = r() * total;
  for (const b of bobots) {
    x -= b.w;
    if (x <= 0) return b.id;
  }
  return bobots[bobots.length - 1].id;
}

// Kompat lama (tanpa stat): pakai stat tengah 5/5/5/5.
export function pilihPeran(r = Math.random): PeranId {
  return pilihPeranFit({ int: 5, str: 5, agi: 5, sta: 5 }, r);
}

export function rollSifat(r = Math.random): string {
  return SIFAT[Math.floor(r() * SIFAT.length)];
}

// Gacha selalu dewasa (18-55). Anak/kelahiran belum ada di v1.
export function rollUmurGacha(r = Math.random): number {
  return 18 + Math.floor(r() * 38);
}

export function tahapDariUmur(umur: number): string {
  return umur >= 60 ? "lansia" : "dewasa";
}
