import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { bangunanById, biayaUpgradeBangunan, cukupBiaya, type ResourceId } from "@/lib/batu/sumberdaya";

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
    if (currentLevel >= 3) {
      return NextResponse.json({ error: "Bangunan sudah mencapai level maksimal (Level 3)!" }, { status: 400 });
    }

    const upgradeCost = biayaUpgradeBangunan(def, currentLevel);

    const duniaCol = await getCollection("dunia");
    const dunia = await duniaCol.findOne({});
    if (!dunia) {
      return NextResponse.json({ error: "Dunia tidak ditemukan" }, { status: 404 });
    }

    const stok = dunia.stok ?? { kayu: 0, batu: 0, pangan: 0, kulit: 0, emas: 0, besi: 0 };
    if (!cukupBiaya(stok, upgradeCost)) {
      return NextResponse.json({ error: "Bahan bangunan tidak cukup untuk upgrade!", biaya: upgradeCost }, { status: 400 });
    }

    // Potong biaya upgrade
    for (const [k, v] of Object.entries(upgradeCost)) {
      if (typeof v === "number") {
        stok[k as ResourceId] = Math.max(0, (stok[k as ResourceId] ?? 0) - v);
      }
    }

    const nextLevel = currentLevel + 1;
    await tilesCol.updateOne(
      { _id: placement._id },
      { $set: { level: nextLevel } }
    );

    await duniaCol.updateOne(
      { _id: dunia._id },
      { $set: { stok: stok } }
    );

    const kabarCol = await getCollection("kabar");
    await kabarCol.insertOne({
      jenis: "bangunan",
      teks: `🎉 Gotong royong berhasil! ${def.label} ditingkatkan ke Level ${nextLevel}.`,
      hari: Math.floor((dunia.sim_jam ?? 0) / 24),
      dibuat_pada: new Date(),
    });

    return NextResponse.json({
      ok: true,
      id,
      kind: placement.kind,
      level: nextLevel,
      stok,
      message: `${def.label} berhasil ditingkatkan ke Level ${nextLevel}!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
