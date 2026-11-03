// Profil zaman batu — PEMBUATAN DIAKTIFKAN LAGI (ronde 7, keputusan user
// 2 Nov 2026 21:40 yang membalik ronde 2) bersama gacha: tombol kanan-bawah
// = nambah karakter. Tanpa login, tanpa batasan.
// TESTING-ONLY (perintah user 2 Nov 2026): SATU IP boleh punya BANYAK profil
// (nama profil 1x/IP DINONAKTIFKAN) dan tiap profil boleh punya karakter
// tanpa batas (maks 4/IP DINONAKTIFKAN — lihat gacha route).
// Mengaktifkan lagi: tolak POST bila sudah ada profil untuk IP ini, dan
// kembalikan cek count >= 4 di gacha confirm.
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { getClientIp, hashIp, validNamaProfil, jsonOk, jsonError, publicWarga } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const ipHash = hashIp(getClientIp(req));
    const profilCol = await getCollection("profil");
    const profils = await profilCol.find({ ip_hash: ipHash }).sort({ dibuat_pada: 1 }).toArray();
    const wargaCol = await getCollection("warga");
    const out = [];
    for (const p of profils) {
      const karakter = await wargaCol
        .find({ profil_id: p._id })
        .sort({ dibuat_pada: 1 })
        .toArray();
      out.push({
        id: String(p._id),
        nama_profil: p.nama_profil,
        dibuat_pada: p.dibuat_pada,
        karakter: karakter.map((w) => publicWarga(w as Record<string, unknown>)),
      });
    }
    return jsonOk({ profils: out });
  } catch (e) {
    console.error("[profil GET]", e instanceof Error ? e.message : "error");
    return jsonError(500, "Gagal membaca profil.");
  }
}

export async function POST(req: Request) {
  try {
    const ipHash = hashIp(getClientIp(req));
    const body = await req.json().catch(() => ({}));
    if (!validNamaProfil(body?.nama_profil)) {
      return jsonError(400, "Nama profil 3-20 karakter, huruf/angka/spasi/_/- saja.");
    }
    const nama_profil = String(body.nama_profil).trim();
    const profilCol = await getCollection("profil");
    // TESTING-ONLY: profil yang sama (IP + nama) dikembalikan; nama baru
    // selalu dibuat — tanpa batas jumlah profil per IP.
    const existing = await profilCol.findOne({ ip_hash: ipHash, nama_profil });
    if (existing) {
      return jsonOk({ profil: { id: String(existing._id), nama_profil }, existed: true });
    }
    const res = await profilCol.insertOne({
      nama_profil,
      ip_hash: ipHash,
      pending_roll: null,
      dibuat_pada: new Date(),
    });
    if (!res.insertedId) return jsonError(500, "Gagal membuat profil.");
    return jsonOk({ profil: { id: String(res.insertedId), nama_profil }, existed: false }, 201);
  } catch (e) {
    console.error("[profil POST]", e instanceof Error ? e.message : "error");
    return jsonError(500, "Gagal membuat profil.");
  }
}

export function profilIdValid(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-fA-F]{24}$/.test(s);
}

export function toObjectId(s: string): ObjectId {
  return new ObjectId(s);
}
