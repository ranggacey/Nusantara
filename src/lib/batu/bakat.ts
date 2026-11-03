// Bakat warga (RONDE 9 — dari pajangan jadi efek nyata).
// Sebelum ronde 9, bakat hanya stat tertinggi yang disimpan + ditampilkan
// kecil ("Sifat X • Bakat Y") — TIDAK PERNAH dibaca sim (grep sim.ts:
// w.bakat tidak dipakai). Mulai ronde 9, tiap bakat punya efek gameplay
// sederhana yang masuk akal + ditampilkan JELAS di kartu gacha (nama +
// apa efeknya) dan di kartu profil. Warga lama sudah menyimpan bakat
// "INT"/"STR"/"AGI"/"STA" — tidak perlu migrasi.
export interface InfoBakat {
  id: string;
  nama: string;
  efek: string;
}

export const BAKAT: Record<string, InfoBakat> = {
  INT: { id: "INT", nama: "Si Cerdik", efek: "Kumpul 10% lebih cepat — otaknya encer, kerjanya efisien." },
  STR: { id: "STR", nama: "Si Kuat", efek: "Tiap selesai kumpul dapat +1 hasil — tenaganya besar." },
  AGI: { id: "AGI", nama: "Si Gesit", efek: "Jalan 10% lebih cepat — kakinya ringan, sampai tujuan duluan." },
  STA: { id: "STA", nama: "Si Tahan Banting", efek: "Pulih stamina 40% lebih cepat saat istirahat (35/jam, bukan 25/jam)." },
};

export function infoBakat(bakat: string | null | undefined): InfoBakat {
  if (bakat && BAKAT[bakat]) return BAKAT[bakat];
  return { id: bakat ?? "-", nama: "Tanpa bakat khusus", efek: "Tidak ada bonus khusus." };
}

// Pengali laju kumpul (INT 1,1x, sisanya 1x).
export function pengaliKumpulBakat(bakat: string | null | undefined): number {
  return bakat === "INT" ? 1.1 : 1;
}

// Bonus jumlah hasil per kumpul selesai (STR +1, sisanya 0).
export function bonusJumlahBakat(bakat: string | null | undefined): number {
  return bakat === "STR" ? 1 : 0;
}

// Pengali kecepatan jalan (AGI 1,1x, sisanya 1x).
export function pengaliJalanBakat(bakat: string | null | undefined): number {
  return bakat === "AGI" ? 1.1 : 1;
}

// Stamina pulih per jam istirahat (STA 35, sisanya 25).
export function pulihStaminaBakat(bakat: string | null | undefined): number {
  return bakat === "STA" ? 35 : 25;
}
