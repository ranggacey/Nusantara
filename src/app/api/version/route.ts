// GET /api/version — identitas build deployment yang sedang live.
// SENGAJA murni + murah: tanpa database, tanpa stepping dunia, tanpa
// logika sim — route ini dipoll tiap 3 detik oleh tab lama untuk
// mendeteksi deployment baru, jadi tidak boleh mengganggu dunia atau
// ikut menghitung jam.
import { BUILD_ID } from "@/lib/version";
import { jsonOk } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return jsonOk({ build: BUILD_ID });
}
