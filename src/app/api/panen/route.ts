import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { hitungKapasitasStok } from "@/lib/batu/sumberdaya";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gx, gy, resource, wargaId } = body;

    if (typeof gx !== "number" || typeof gy !== "number" || !resource) {
      return NextResponse.json({ error: "Data panen tidak lengkap" }, { status: 400 });
    }

    const duniaCol = await getCollection("dunia");
    const dunia = await duniaCol.findOne({});
    if (!dunia) {
      return NextResponse.json({ error: "Dunia tidak ditemukan" }, { status: 404 });
    }

    const placementsCol = await getCollection("peta_tile");
    const placements = await placementsCol.find({}).toArray();
    const kapasitas = hitungKapasitasStok(placements as any);

    const nodeKey = `${gx},${gy}`;
    const nodeSisa = dunia.node_sisa ?? {};
    nodeSisa[nodeKey] = 0;

    const stok = dunia.stok ?? { kayu: 0, batu: 0, pangan: 0, kulit: 0, emas: 0, besi: 0 };
    const resKey = resource === "buah" || resource === "beri" || resource === "daging" || resource === "ikan" ? "pangan" : resource;
    const limit = (kapasitas as any)[resKey] ?? 100;

    if (resKey in stok) {
      if ((stok[resKey] ?? 0) >= limit) {
        if (wargaId) {
          const wargaCol = await getCollection("warga");
          await wargaCol.updateOne(
            { id: wargaId },
            {
              $set: {
                fase_siklus: "istirahat",
                aksi_sekarang: "rehat_stok_penuh",
                status_teks: "Lumbung penuh! Rehat santai di perapian/kampung.",
                node: null,
              },
            }
          );
        }
        return NextResponse.json({
          ok: false,
          full: true,
          limit,
          stok,
          message: `Lumbung sudah penuh (${limit} ${resKey})! Warga dipersilakan rehat santai.`,
        });
      }
      stok[resKey] = Math.min(limit, (stok[resKey] ?? 0) + 1);
    }

    await duniaCol.updateOne(
      { _id: dunia._id },
      {
        $set: {
          node_sisa: nodeSisa,
          stok: stok,
        },
      }
    );

    return NextResponse.json({ ok: true, stok, kapasitas });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
