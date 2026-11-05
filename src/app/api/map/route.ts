// GET /api/map — peta 3D zaman batu (grid 600x600).
// Layout deterministik + override peta_tile (bangunan selesai) + konstruksi + hewan + warga.
// Server-authoritative dengan sub-hour real-time interpolation:
// Setiap reload / client baru langsung menerima koordinat presisi detik ini
// sehingga karakter tidak pernah mengulang perjalanannya dari titik awal jam!
import { getCollection } from "@/lib/db";
import { generateNodes, nodeAktif, nodeSprite, riverX, GRID_W, GRID_H, GRID_MIN, GRID_MAX, generateGunung, dedupePlacement } from "@/lib/batu/dunia";
import { advanceWorld, getDuniaDoc, kecepatanJalan } from "@/lib/batu/sim";
import { hewanById } from "@/lib/batu/hewan";
import { jsonOk, jsonError, publicWarga } from "@/lib/security";
import { gameTime, durasiJamMs, realMsUntukJam } from "@/lib/clock";
import { hitungKapasitasStok } from "@/lib/batu/sumberdaya";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    try {
      await advanceWorld();
    } catch (e) {
      console.error("[map sim]", e instanceof Error ? e.message : "sim gagal");
    }

    const now = Date.now();
    let duniaDoc = await getDuniaDoc();
    const gt = gameTime(duniaDoc.epoch_ms, now);
    const durasiJam = durasiJamMs(gt.jam);
    const startHourMs = duniaDoc.epoch_ms + realMsUntukJam(gt.jamTotal, 0);
    const fracJam = Math.max(0, Math.min(1, (now - startHourMs) / durasiJam));

    let nodeSisa: Record<string, number> | undefined = duniaDoc.node_sisa;
    // Batasi node_spawn agar tidak membengkak ribuan node, pertahankan performa kencang & ringan
    const nodeSpawn = ((duniaDoc.node_spawn ?? []) as { kind: string; gx: number; gy: number }[]).slice(-40);

    const nodes = nodeAktif([...generateNodes(), ...nodeSpawn] as never, nodeSisa).map((n) => ({ ...n, sprite: nodeSprite(n.kind as never) }));
    const placements = await getCollection("peta_tile").then((c) => c.find({}).toArray());
    const riverXs: number[] = [];
    for (let gy = GRID_MIN; gy < GRID_MAX; gy++) riverXs.push(riverX(gy));

    const wargaCol = await getCollection("warga");
    const wargaDocs = await wargaCol.find({}).sort({ dibuat_pada: 1 }).limit(1000).toArray();

    // Interpolasi sub-jam nyata untuk setiap warga yang bergerak
    const warga = wargaDocs.map((w) => {
      const d = publicWarga(w as Record<string, unknown>);
      const lok = (d.lokasi as { gx: number; gy: number } | undefined) ?? { gx: 100, gy: 100 };
      const st = (d.stat as { agi?: number; sta?: number } | undefined) ?? {};
      const kec = kecepatanJalan(Number(st.agi ?? 5), Number(st.sta ?? 5), String(d.bakat ?? ""));

      let realGx = lok.gx;
      let realGy = lok.gy;
      const tj = d.tujuan as { gx?: number; gy?: number } | null | undefined;
      const faseSiklus = String(d.fase_siklus ?? "");

      // Jika sedang dalam perjalanan, hitung posisi real-time saat ini
      if (
        tj &&
        typeof tj.gx === "number" &&
        typeof tj.gy === "number" &&
        (faseSiklus === "jalan" || faseSiklus === "kembali" || faseSiklus === "kabur" || faseSiklus === "berobat")
      ) {
        const dx = tj.gx - lok.gx;
        const dy = tj.gy - lok.gy;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.05) {
          const maxJarakJam = kec; // kapasitas langkah jam ini
          const jarakJalan = fracJam * maxJarakJam;
          const ratio = Math.min(1, jarakJalan / dist);
          realGx = Number((lok.gx + dx * ratio).toFixed(2));
          realGy = Number((lok.gy + dy * ratio).toFixed(2));
        }
      }

      return {
        ...d,
        gx: realGx,
        gy: realGy,
        orig_gx: lok.gx,
        orig_gy: lok.gy,
        kecepatan: kec,
      };
    });

    // Bangunan sedang dibangun
    let konstruksi: Record<string, unknown>[] = [];
    try {
      const docs = await getCollection("bangunan").then((c) => c.find({ status: "dibangun" }).toArray());
      konstruksi = docs.map((b) => {
        const d = b as Record<string, unknown>;
        return {
          id: String(b._id),
          tipe: d.tipe,
          label: d.tipe,
          progres: d.progres ?? 0,
          gx: d.gx ?? null,
          gy: d.gy ?? null,
          w: d.w ?? null,
          h: d.h ?? null,
          pembangun_nama: d.pembangun_nama ?? null,
          pemrakarsa: d.pemrakarsa ?? null,
        };
      });
    } catch {
      konstruksi = [];
    }

    // Daging hasil buruan
    let daging: Record<string, unknown>[] = [];
    try {
      const docs = await getCollection("daging").then((c) => c.find({}).limit(500).toArray());
      daging = docs.map((doc) => {
        const d = doc as Record<string, unknown>;
        return { id: String(doc._id), jenis: d.jenis, gx: d.gx, gy: d.gy, pangan: d.pangan, kulit: d.kulit };
      });
    } catch {
      daging = [];
    }

    // Hewan
    let hewan: Record<string, unknown>[] = [];
    try {
      const docs = await getCollection("hewan").then((c) => c.find({}).limit(500).toArray());
      hewan = docs.map((h) => {
        const d = h as Record<string, unknown>;
        const hpMax = hewanById(String(d.jenis))?.hp ?? 1;
        return {
          id: String(h._id),
          jenis: d.jenis,
          gx: d.gx,
          gy: d.gy,
          kecepatan: hewanById(String(d.jenis))?.kecepatan ?? 10,
          hp: typeof d.hp === "number" ? d.hp : hpMax,
          hpMax,
        };
      });
    } catch {
      hewan = [];
    }

    // Jalan
    let jalan: { gx: number; gy: number; segmen: string }[] = [];
    try {
      const docs = await getCollection("jalan").then((c) => c.find({}).limit(2000).toArray());
      jalan = docs.map((d) => {
        const x = d as Record<string, unknown>;
        return { gx: Number(x.gx), gy: Number(x.gy), segmen: String(x.segmen ?? "jalan") };
      });
    } catch {
      jalan = [];
    }

    return jsonOk({
      grid: { w: GRID_W, h: GRID_H, min: GRID_MIN },
      riverXs,
      // RONDE 20 — stok ikan sungai (untuk panel Map3D + verifikasi live).
      ikan: Number((duniaDoc as unknown as Record<string, unknown>).ikan_sungai ?? 30),
      nodes,
      gunung: generateGunung(),
      placements: dedupePlacement(
        placements.map((p) => {
          const d = p as Record<string, unknown>;
          return {
            id: String(p._id),
            kind: String(d.kind),
            gx: Number(d.gx),
            gy: Number(d.gy),
            w: Number(d.w ?? 1),
            h: Number(d.h ?? 1),
            level: Number(d.level ?? 1),
            rotasi: Number(d.rotasi ?? 0),
            ...(typeof d.hidangan === "number" ? { hidangan: d.hidangan } : {}),
          };
        })
      ),
      kapasitas_stok: hitungKapasitasStok(placements as any),
      stok: duniaDoc.stok ?? { kayu: 0, batu: 0, pangan: 0, kulit: 0, emas: 0, besi: 0 },
      jalan,
      konstruksi,
      hewan,
      daging,
      warga,
      fracJam,
      server_ms: now,
    });
  } catch (e) {
    console.error("[map]", e instanceof Error ? e.message : "error");
    return jsonError(500, "Gagal membaca peta.");
  }
}
