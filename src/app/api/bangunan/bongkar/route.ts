import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { bangunanById, refundBongkarBangunan, hitungKapasitasStok, type ResourceId } from "@/lib/batu/sumberdaya";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID bangunan diperlukan" }, { status: 400 });
    }

    const tilesCol = await getCollection("peta_tile");
    let placement = null;
    if (ObjectId.isValid(id)) {
      try {
        placement = await tilesCol.findOne({ _id: new ObjectId(id) });
      } catch {}
    }
    if (!placement) {
      placement = await tilesCol.findOne({ _id: id });
    }
    if (!placement) {
      placement = await tilesCol.findOne({ id: id });
    }

    if (!placement) {
      return NextResponse.json({ error: "Bangunan tidak ditemukan di peta" }, { status: 404 });
    }

    const def = bangunanById(placement.kind);
    if (!def) {
      return NextResponse.json({ error: "Definisi bangunan tidak valid" }, { status: 400 });
    }

    const currentLevel = Math.min(3, Math.max(1, Number(placement.level ?? 1)));
    const refund = refundBongkarBangunan(def, currentLevel);

    const duniaCol = await getCollection("dunia");
    const dunia = await duniaCol.findOne({});
    if (!dunia) {
      return NextResponse.json({ error: "Dunia tidak ditemukan" }, { status: 404 });
    }

    // Hitung kapasitas penyimpanan desa saat ini
    const allPlacements = await tilesCol.find({}).toArray();
    // Hilangkan bangunan ini saat menghitung kapasitas setelah bongkar jika ini adalah lumbung
    const remainingPlacements = allPlacements.filter((p: any) => p._id.toString() !== placement._id.toString());
    const kapasitasStok = hitungKapasitasStok(remainingPlacements as any);

    const stok = dunia.stok ?? { kayu: 0, batu: 0, pangan: 0, kulit: 0, emas: 0, besi: 0 };
    // Tambahkan 80% bahan ke stok kampung (dibatasi kapasitas maks)
    for (const [k, v] of Object.entries(refund)) {
      if (typeof v === "number" && v > 0) {
        const maxCap = (kapasitasStok as Record<string, number>)[k] ?? 100;
        (stok as Record<string, number>)[k] = Math.min(maxCap, ((stok as Record<string, number>)[k] ?? 0) + v);
      }
    }

    // Hapus bangunan dari peta_tile
    await tilesCol.deleteOne({ _id: placement._id });

    // Lepas hunian dari warga yang menempati bangunan ini
    const placementIdStr = placement._id.toString();
    const wargaCol = await getCollection("warga");
    await wargaCol.updateMany(
      { hunian: { $in: [placementIdStr, placement.id, id] } },
      { $set: { hunian: null } }
    );

    // Update stok dunia
    await duniaCol.updateOne(
      { _id: dunia._id },
      { $set: { stok: stok } }
    );

    // Catat kabar
    const rincianRefund = Object.entries(refund)
      .filter(([_, v]) => typeof v === "number" && v > 0)
      .map(([k, v]) => `+${v} ${k}`)
      .join(", ");

    const kabarCol = await getCollection("kabar");
    await kabarCol.insertOne({
      jenis: "bangunan",
      teks: `🔨 ${def.label} (Level ${currentLevel}) telah dibongkar. 80% bahan (${rincianRefund || "tidak ada"}) dikembalikan ke persediaan desa.`,
      hari: Math.floor((dunia.sim_jam ?? 0) / 24),
      dibuat_pada: new Date(),
    });

    return NextResponse.json({
      ok: true,
      id,
      kind: placement.kind,
      refund,
      stok,
      kapasitasStok,
      message: `${def.label} berhasil dibongkar! 80% material (${rincianRefund}) telah dikembalikan.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
