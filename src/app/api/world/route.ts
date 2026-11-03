// GET /api/world — keadaan kampung zaman batu bersama (jam GAME, bukan WIB).
// Memicu lazy catch-up simulasi (best-effort) sebelum merespons.
import { getCollection } from "@/lib/db";
import { getDuniaDoc, advanceWorld } from "@/lib/batu/sim";
import { gameTime, cuacaGame } from "@/lib/clock";
import { labelCuaca, labelFase, levelPerkampungan, labelLevel, KAMPUNG_AWAL } from "@/lib/world";
import { jsonOk, jsonError } from "@/lib/security";
import { bangunanById, kurangDariBiaya, stokKosong, hitungKapasitasStok, type Stok } from "@/lib/batu/sumberdaya";
import { labelPeran } from "@/lib/batu/peran";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    try {
      await advanceWorld();
    } catch (e) {
      console.error("[world sim]", e instanceof Error ? e.message : "sim gagal");
    }
    const dunia = await getDuniaDoc();
    const now = Date.now();
    const gt = gameTime(dunia.epoch_ms, now);
    const cuaca = cuacaGame(gt.day);
    const wargaCol = await getCollection("warga");
    const populasi = await wargaCol.countDocuments({});
    const level = levelPerkampungan(populasi);
    const stok: Stok = { ...stokKosong(), ...(dunia.stok ?? {}) };
    const tilesCol = await getCollection("peta_tile");
    const allPlacements = await tilesCol.find({}).toArray();
    const kapasitas_stok = hitungKapasitasStok(allPlacements as any);

    const kabarCol = await getCollection("kabar");
    const kabar = await kabarCol.find({}).sort({ _id: -1 }).limit(8).toArray();
    const terbaru = await wargaCol
      .find({}, { projection: { nama: 1, nomor: 1, peran: 1, dibuat_pada: 1 } })
      .sort({ dibuat_pada: -1 })
      .limit(8)
      .toArray();

    let bangunan: Record<string, unknown>[] = [];
    try {
      const docs = await getCollection("bangunan")
        .then((c) => c.find({}).sort({ dibuat_hari: -1, _id: -1 }).limit(20).toArray());
      bangunan = docs.map((b) => {
        const d = b as Record<string, unknown>;
        const def = bangunanById(String(d.tipe));
        const biaya = def?.biaya ?? {};
        return {
          id: String(b._id),
          tipe: d.tipe,
          label: def?.label ?? d.tipe,
          status: d.status,
          progres: d.progres ?? 0,
          gx: d.gx ?? null,
          gy: d.gy ?? null,
          w: d.w ?? null,
          h: d.h ?? null,
          biaya,
          kurang: kurangDariBiaya(stok, biaya),
          // NPC-only: siapa yang memutuskan + siapa pembangun + alasan.
          // sumber_alasan "llm" hanya bila hook Gemini benar-benar menjawab;
          // selama format key salah, ini "scripted" (dilaporkan jujur).
          pemrakarsa: d.pemrakarsa ?? null,
          pembangun_nama: d.pembangun_nama ?? null,
          alasan: d.alasan ?? null,
          sumber_alasan: d.sumber_alasan ?? "scripted",
        };
      });
    } catch {
      bangunan = [];
    }

    return jsonOk({
      nama_dunia: "Negara Emas",
      kampung: KAMPUNG_AWAL,
      era: "zaman_batu",
      populasi,
      level,
      label_level: labelLevel(level),
      epoch_ms: dunia.epoch_ms,
      server_ms: now,
      hari_total: gt.day,
      jam_total: gt.jamTotal,
      hari: gt.hariKeTahun,
      tahun: gt.year,
      jam: `${String(gt.jam).padStart(2, "0")}.${String(gt.menit).padStart(2, "0")}`,
      fase: gt.fase,
      label_fase: labelFase(gt.fase),
      cuaca,
      label_cuaca: labelCuaca(cuaca),
      sumber_daya: stok,
      kapasitas_stok,
      bangunan,
      feed: {
        kabar: kabar.map((k) => ({ jenis: k.jenis, teks: k.teks, hari: k.hari })),
        warga_terbaru: terbaru.map((w) => ({
          nama: w.nama,
          nomor: w.nomor,
          peran: w.peran,
          label_peran: labelPeran(String(w.peran)),
          dibuat_pada: w.dibuat_pada,
        })),
      },
    });
  } catch (e) {
    console.error("[world]", e instanceof Error ? e.message : "error");
    return jsonError(500, "Gagal membaca keadaan dunia.");
  }
}
