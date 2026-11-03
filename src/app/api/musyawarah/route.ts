import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { cariTokohTerhebat, jalankanMusyawarahBulanan } from "@/lib/batu/musyawarah";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const musyCol = await getCollection("musyawarah");
    const riwayat = await musyCol.find({}).sort({ dibuat_pada: -1 }).limit(10).toArray();
    const tokoh = await cariTokohTerhebat();

    let terbaru: any = riwayat[0] ?? null;
    // Jika belum pernah musyawarah, jalankan yang pertama kali
    if (!terbaru) {
      terbaru = await jalankanMusyawarahBulanan(1);
    }

    return NextResponse.json({
      terbaru,
      riwayat,
      tokoh,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const hasil = await jalankanMusyawarahBulanan();
    return NextResponse.json({ success: true, hasil });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
