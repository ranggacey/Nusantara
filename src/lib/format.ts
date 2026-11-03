// Helper format label tampilan (FRONTEND SAJA). Database tetap snake_case.
// Aturan: pecah di [_-\s], tiap kata kapital awal, gabung spasi.
export function formatLabel(v?: string | null): string {
  if (v == null) return "-";
  const s = v.trim();
  if (!s || s === "-") return "-";
  return s
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => {
      const low = w.toLowerCase();
      if (/^[A-Z]{2,}$/.test(w)) return w;
      return low.charAt(0).toUpperCase() + low.slice(1);
    })
    .join(" ");
}

/**
 * Format angka besar menjadi format ringkas (contoh: 17730 -> 17.7k, 1200 -> 1.2k)
 */
export function formatK(n: number): string {
  if (typeof n !== "number" || isNaN(n)) return "0";
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return String(Math.floor(n));
}
