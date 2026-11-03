// GET /api/dialog — 1 baris dialog scripted zaman batu untuk satu peran.
// Parameter peran WAJIB dan harus peran valid — baris tanpa peran tidak
// boleh tampil sebagai ucapan warga (aturan dialog §9).
import { PERAN } from "@/lib/batu/peran";
import { dialogUntukPeran } from "@/lib/batu/dialog";
import { jsonOk, jsonError } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const peran = (url.searchParams.get("peran") ?? "").trim();
    const namaRaw = (url.searchParams.get("nama") ?? "").trim().slice(0, 24);
    const nama = namaRaw.replace(/[^A-Za-zÀ-ÿ'’\- ]/g, "") || "kawan";
    if (!PERAN.some((p) => p.id === peran)) {
      return jsonError(400, `Peran tidak valid. Peran: ${PERAN.map((p) => p.id).join(", ")}.`);
    }
    const teks = dialogUntukPeran(peran, nama);
    if (!teks) return jsonError(404, "Dialog belum tersedia.");
    return jsonOk({ dialog: { peran, teks } });
  } catch (e) {
    console.error("[dialog]", e instanceof Error ? e.message : "error");
    return jsonError(500, "Gagal membaca dialog.");
  }
}
