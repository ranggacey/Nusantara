// Validasi input + hash IP + helper respons (server-side).
// TESTING-ONLY: tidak ada enforcement batas karakter/IP di sini maupun di
// route mana pun (perintah user 2 Nov 2026: tanpa batasan tiap HP dulu,
// biar bisa testing). Mengaktifkan lagi: lihat komentar TESTING-ONLY di
// src/app/api/gacha/route.ts dan src/app/api/profil/route.ts.
import { createHash } from "crypto";

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "negara-emas-ip-salt-v1";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function validNamaProfil(nama: unknown): nama is string {
  return (
    typeof nama === "string" &&
    nama.trim().length >= 3 &&
    nama.trim().length <= 20 &&
    /^[A-Za-z0-9 _-]{3,20}$/.test(nama.trim())
  );
}

const NAMA_RE = /^[A-Za-zÀ-ÿ'’\- ]{2,24}$/;

export function validNamaKarakter(nama: unknown): nama is string {
  if (typeof nama !== "string") return false;
  const t = nama.trim();
  return t.length >= 2 && t.length <= 24 && NAMA_RE.test(t);
}

export function validGender(g: unknown): g is "laki" | "perempuan" {
  return g === "laki" || g === "perempuan";
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonOk(data: unknown, status = 200) {
  return new Response(JSON.stringify({ ok: true, ...((data as object) ?? {}) }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Field warga zaman batu yang BOLEH dikirim ke client.
export function publicWarga(w: Record<string, unknown>) {
  const {
    _id,
    nama,
    nomor,
    gender,
    umur,
    tahap_hidup,
    peran,
    stat,
    bakat,
    sifat,
    lokasi,
    tujuan,
    node,
    aksi_sekarang,
    status_teks,
    tempat_kerja,
    progres_aksi_pct,
    fase_siklus,
    hunian,
    profil_id,
    dibuat_pada,
    sim_hari,
    stamina,
    lapar,
    sehat,
    perkakas,
    interaksi,
    target_hewan,
    sedang_berenang,
    daging_target,
    membawa_daging,
    bio,
  } = w;
  return {
    id: String(_id),
    nama,
    nomor,
    gender,
    umur,
    tahap_hidup,
    peran,
    stat,
    bakat,
    sifat,
    lokasi,
    tujuan,
    node,
    aksi_sekarang,
    status_teks,
    tempat_kerja,
    progres_aksi_pct,
    fase_siklus,
    hunian,
    profil_id: profil_id ? String(profil_id) : null,
    dibuat_pada,
    sim_hari,
    stamina: typeof stamina === "number" ? stamina : 100,
    lapar: typeof lapar === "number" ? lapar : 20,
    sehat: typeof sehat === "number" ? sehat : 100,
    perkakas: Array.isArray(perkakas) ? perkakas : [],
    interaksi: interaksi ?? null,
    target_hewan: target_hewan ?? null,
    sedang_berenang: sedang_berenang === true,
    daging_target: daging_target ?? null,
    membawa_daging: membawa_daging ?? null,
    bio: typeof bio === "string" ? bio : null,
  };
}
