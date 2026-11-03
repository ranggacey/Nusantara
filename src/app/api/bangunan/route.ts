// GET /api/bangunan — bangunan zaman batu, LIHAT SAJA (NPC-only).
// POST DITOLAK 403: pemain tidak bisa mengantre bangunan (perintah user
// 2 Nov 2026 17:11 — bangunan hanya diputuskan + diantrekan NPC yang mikir
// sendiri: kepala suku/musyawarah menilai kebutuhan + stok).
// Biaya dipotong sim saat stok cukup; plot ditetapkan saat konstruksi MULAI;
// progres berjalan per hari game; selesai -> muncul di peta (oleh sim).
import { getCollection } from "@/lib/db";
import { getDuniaDoc } from "@/lib/batu/sim";
import { bangunanById, BANGUNAN, kurangDariBiaya, stokKosong, type Stok } from "@/lib/batu/sumberdaya";
import { jsonOk, jsonError } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const dunia = await getDuniaDoc();
    const stok: Stok = { ...stokKosong(), ...(dunia.stok ?? {}) };
    const docs = await getCollection("bangunan")
      .then((c) => c.find({}).sort({ dibuat_hari: -1, _id: -1 }).limit(20).toArray());
    // RONDE 18 — dedupe tampilan (bukan tulis DB): koleksi bangunan
    // berisi dokumen ganda (4x kebun di ubin sama) dari advance
    // bersamaan; panel menampilkan satu per (tipe, ubin) — pertama
    // (terbaru) menang; antrean tanpa plot didedupe per (tipe, status).
    const seenAntrean = new Set<string>();
    const docsUnik = docs.filter((b) => {
      const d = b as Record<string, unknown>;
      const k =
        d.gx !== null && d.gx !== undefined && d.gy !== null && d.gy !== undefined
          ? `${String(d.tipe)}:${String(d.gx)},${String(d.gy)}`
          : `${String(d.tipe)}:${String(d.status)}`;
      if (seenAntrean.has(k)) return false;
      seenAntrean.add(k);
      return true;
    });
    return jsonOk({
      katalog: BANGUNAN,
      antrean: docsUnik.map((b) => {
        const d = b as Record<string, unknown>;
        const def = bangunanById(String(d.tipe));
        const biaya = def?.biaya ?? {};
        return {
          id: String(b._id),
          tipe: d.tipe,
          label: def?.label ?? d.tipe,
          status: d.status,
          progres: d.progres ?? 0,
          gx: d.gx ?? null,
          gy: d.gy ?? null,
          biaya,
          kurang: kurangDariBiaya(stok, biaya),
          pemrakarsa: d.pemrakarsa ?? null,
          pembangun_nama: d.pembangun_nama ?? null,
          alasan: d.alasan ?? null,
          sumber_alasan: d.sumber_alasan ?? "scripted",
        };
      }),
    });
  } catch (e) {
    console.error("[bangunan GET]", e instanceof Error ? e.message : "error");
    return jsonError(500, "Gagal membaca bangunan.");
  }
}

export async function POST() {
  // Pemain tidak bisa mengantre bangunan — hanya NPC (sim) yang bisa.
  return jsonError(
    403,
    "Antre bangunan hanya untuk NPC: bangunan diputuskan kepala suku/musyawarah dari kebutuhan + stok kampung. Pemain hanya menonton."
  );
}
