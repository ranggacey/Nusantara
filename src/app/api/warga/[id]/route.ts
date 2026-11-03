// GET /api/warga/[id] — detail warga + serumah (satu hunian).
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { jsonOk, jsonError, publicWarga } from "@/lib/security";
import { bangunanById } from "@/lib/batu/sumberdaya";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) return jsonError(400, "ID tidak valid.");
    const col = await getCollection("warga");
    const w = await col.findOne({ _id: new ObjectId(id) });
    if (!w) return jsonError(404, "Warga tidak ditemukan.");
    const d = w as Record<string, unknown>;
    const hunian = d.hunian as { id: string; tipe: string; label: string } | null;
    let serumah: Record<string, unknown>[] = [];
    let hunianDetail: Record<string, unknown> | null = null;
    if (hunian) {
      const teman = await col
        .find({ "hunian.id": hunian.id, _id: { $ne: w._id } })
        .limit(20)
        .toArray();
      serumah = teman.map((t) => {
        const td = t as Record<string, unknown>;
        return { id: String(t._id), nama: td.nama, nomor: td.nomor, peran: td.peran };
      });
      const tiles = await getCollection("peta_tile");
      const p = await tiles.findOne({ _id: new ObjectId(hunian.id) });
      if (p) {
        const pd = p as Record<string, unknown>;
        const def = bangunanById(String(pd.kind));
        const isi = await col.countDocuments({ "hunian.id": hunian.id });
        hunianDetail = {
          id: hunian.id,
          tipe: pd.kind,
          label: def?.label ?? pd.kind,
          gx: pd.gx,
          gy: pd.gy,
          kapasitas: def?.kapasitas ?? null,
          isi,
        };
      }
    }
    return jsonOk({ warga: publicWarga(d), serumah, hunian: hunianDetail });
  } catch (e) {
    console.error("[warga id]", e instanceof Error ? e.message : "error");
    return jsonError(500, "Gagal membaca warga.");
  }
}
