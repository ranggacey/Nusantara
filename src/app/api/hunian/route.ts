// GET /api/hunian — daftar hunian (gubuk/tenda) + penghuninya.
import { getCollection } from "@/lib/db";
import { bangunanById } from "@/lib/batu/sumberdaya";
import { jsonOk, jsonError } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const tiles = await getCollection("peta_tile").then((c) => c.find({}).toArray());
    const wargaCol = await getCollection("warga");
    const out = [];
    for (const p of tiles) {
      const d = p as Record<string, unknown>;
      const def = bangunanById(String(d.kind));
      if (!def || def.kapasitas === null) continue;
      const penghuni = await wargaCol
        .find({ "hunian.id": String(p._id) })
        .limit(20)
        .toArray();
      out.push({
        id: String(p._id),
        tipe: d.kind,
        label: def.label,
        gx: d.gx,
        gy: d.gy,
        kapasitas: def.kapasitas,
        isi: penghuni.length,
        penghuni: penghuni.map((w) => {
          const wd = w as Record<string, unknown>;
          return { id: String(w._id), nama: wd.nama, nomor: wd.nomor, peran: wd.peran };
        }),
      });
    }
    return jsonOk({ hunian: out });
  } catch (e) {
    console.error("[hunian]", e instanceof Error ? e.message : "error");
    return jsonError(500, "Gagal membaca hunian.");
  }
}
