// GET /api/warga — cari warga zaman batu by nama atau nomor.
// Tanpa q: 20 warga terbaru. Input tidak pernah mentah masuk query.
import { getCollection } from "@/lib/db";
import { escapeRegex, jsonOk, jsonError, publicWarga } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim().slice(0, 24);
    const col = await getCollection("warga");
    let docs;
    if (!q) {
      docs = await col.find({}).sort({ dibuat_pada: -1 }).limit(20).toArray();
    } else if (/^\d+$/.test(q)) {
      docs = await col
        .find({ nomor: String(parseInt(q, 10)).padStart(4, "0") })
        .limit(20)
        .toArray();
      if (docs.length === 0) {
        docs = await col
          .find({ nama: { $regex: escapeRegex(q), $options: "i" } })
          .limit(20)
          .toArray();
      }
    } else {
      docs = await col
        .find({ nama: { $regex: escapeRegex(q), $options: "i" } })
        .limit(20)
        .toArray();
    }
    return jsonOk({ warga: docs.map((w) => publicWarga(w as Record<string, unknown>)) });
  } catch (e) {
    console.error("[warga]", e instanceof Error ? e.message : "error");
    return jsonError(500, "Gagal mencari warga.");
  }
}
