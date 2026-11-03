// Gacha zaman batu — DIAKTIFKAN LAGI (ronde 7, keputusan user 2 Nov 2026
// 21:40 yang membalik ronde 2): tombol kanan-bawah = NAMBAH KARAKTER.
// POST {action: 'roll'} lalu {action: 'confirm'}.
// Roll disimpan di dokumen profil (pending_roll) supaya tahan serverless.
// Dunia tetap SATU + SHARED: warga baru terlihat di semua HP, tanpa
// restart, tanpa reset, tanpa menghapus warga/resource/bangunan yang ada.
// TESTING-ONLY (perintah user 2 Nov 2026): TANPA batas karakter per IP dan
// TANPA rate limit gacha — biar bisa testing dari HP berkali-kali.
// Mengaktifkan lagi: cek count karakter per profil/IP >= 4 di confirm,
// dan kembalikan rate limit roll/confirm.
// POST /api/bangunan tetap 403 (bangunan NPC-only) — tidak disentuh di sini.
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { validNamaKarakter, validGender, jsonOk, jsonError, publicWarga } from "@/lib/security";
import { rollStat, bakatDariStat, pilihPeranFit, rollSifat, rollUmurGacha, tahapDariUmur } from "@/lib/batu/gacha";
import { labelPeran, labelNode, perkakasPeran, type PeranId } from "@/lib/batu/peran";
import { getDuniaDoc, pilihNodeTerbaik, carikanHunian } from "@/lib/batu/sim";
import { generateNodes, isWater } from "@/lib/batu/dunia";
import { gameTime } from "@/lib/clock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function nextSeq(name: string): Promise<number> {
  const col = await getCollection<{ _id: string; seq: number }>("counters");
  const doc = await col.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  return (doc?.seq as number) ?? 1;
}

function profilIdDariBody(body: Record<string, unknown>): ObjectId | null {
  const raw = body?.profil_id;
  if (typeof raw !== "string" || !/^[0-9a-fA-F]{24}$/.test(raw)) return null;
  return new ObjectId(raw);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = body?.action;
    const profilId = profilIdDariBody(body);
    if (!profilId) return jsonError(400, "profil_id tidak valid. Buat nama profil dulu.");
    const profilCol = await getCollection("profil");
    const profil = await profilCol.findOne({ _id: profilId });
    if (!profil) return jsonError(403, "Profil tidak ditemukan. Buat nama profil dulu.");

    if (action === "roll") {
      // Urutan PENTING (role-fit): stat dulu, lalu peran menghormati fit.
      // Pool peran = semua 18 peran di PERAN (10 lama + 8 baru ronde 4),
      // jadi peran baru bisa muncul begitu populasi bertambah.
      const stat = rollStat();
      const peran = pilihPeranFit(stat);
      const roll = {
        peran,
        label_peran: labelPeran(peran),
        stat,
        bakat: bakatDariStat(stat),
        sifat: rollSifat(),
        umur: rollUmurGacha(),
        dibuat_pada: new Date(),
      };
      await profilCol.updateOne({ _id: profil._id }, { $set: { pending_roll: roll } });
      return jsonOk({ roll });
    }

    if (action === "confirm") {
      if (!validNamaKarakter(body?.nama) || !validGender(body?.gender)) {
        return jsonError(400, "Nama karakter 2-24 huruf, dan gender harus laki/perempuan.");
      }
      const pending = profil.pending_roll as Record<string, unknown> | null;
      if (!pending) return jsonError(409, "Roll gacha tidak ditemukan. Roll dulu.");
      const age = Date.now() - new Date(pending.dibuat_pada as string).getTime();
      if (Number.isNaN(age) || age > 30 * 60_000) {
        await profilCol.updateOne({ _id: profil._id }, { $set: { pending_roll: null } });
        return jsonError(409, "Roll gacha kedaluwarsa. Roll ulang.");
      }
      const nama = String(body.nama).trim();
      const gender = body.gender as "laki" | "perempuan";
      const umur = typeof pending.umur === "number" ? pending.umur : rollUmurGacha();
      const peran = String(pending.peran ?? "pengumpul");
      const stat = pending.stat as { int: number; str: number; agi: number; sta: number };
      const dunia = await getDuniaDoc();
      const hariGame = gameTime(dunia.epoch_ms, Date.now()).day;
      const wargaCol = await getCollection("warga");
      // Nomor lanjut + anti-tabrakan: bila counter meleset dari nomor yang
      // sudah ada (mis. seed manual), geser sampai nomor benar-benar unik.
      let nomor = String(await nextSeq("warga")).padStart(4, "0");
      while (await wargaCol.findOne({ nomor })) {
        nomor = String(await nextSeq("warga")).padStart(4, "0");
      }
      // Hunian: gubuk/tenda yang masih muat (bila penuh -> null, sim
      // menugaskan ubin tamu sekeliling hunian tiap jam — ronde 3).
      const tilesCol = await getCollection("peta_tile");
      const placements = (await tilesCol.find({}).toArray()) as unknown as {
        _id: unknown;
        kind: string;
        gx: number;
        gy: number;
        w: number;
        h: number;
      }[];
      const semuaWarga = (await wargaCol.find({}).toArray()) as unknown as { hunian?: { id: string } | null }[];
      const hunian = carikanHunian(placements, semuaWarga);
      // Spawn: tile acak dekat pusat, bukan air, bukan di dalam placement.
      const hunianTiles = new Set<string>();
      for (const p of placements) {
        for (let dy = 0; dy < (p.h ?? 1); dy++)
          for (let dx = 0; dx < (p.w ?? 1); dx++) hunianTiles.add(`${p.gx + dx},${p.gy + dy}`);
      }
      let spawn = { gx: 100, gy: 96 };
      for (let t = 0; t < 40; t++) {
        const gx = 100 + Math.floor(Math.random() * 11) - 5;
        const gy = 100 + Math.floor(Math.random() * 11) - 5;
        if (!isWater(gx, gy) && !hunianTiles.has(`${gx},${gy}`)) {
          spawn = { gx, gy };
          break;
        }
      }
      const nodes = generateNodes();
      const node = pilihNodeTerbaik(peran as PeranId, spawn, nodes);
      const doc = {
        nama,
        nomor,
        gender,
        umur,
        lahir_hari: hariGame - umur * 365,
        tahap_hidup: tahapDariUmur(umur),
        peran,
        stat,
        bakat: pending.bakat,
        sifat: pending.sifat,
        lokasi: spawn,
        tujuan: node ? { gx: node.gx, gy: node.gy } : null,
        node: node ? { kind: node.kind, gx: node.gx, gy: node.gy } : null,
        aksi_sekarang: node ? "berjalan" : "beristirahat",
        status_teks: node ? `Berjalan ke ${labelNode(node.kind)}…` : "Beristirahat di dekat hunian…",
        tempat_kerja: node ? labelNode(node.kind) : "dekat hunian",
        progres_aksi_pct: 0,
        fase_siklus: node ? "jalan" : "istirahat",
        istirahat_sisa: 0,
        hunian,
        profil_id: profil._id,
        dibuat_pada: new Date(),
        sim_hari: hariGame,
        // Warga baru: stamina dari STA, kenyang awal, sehat penuh,
        // perkakas kasar level 0 (crafting menaikkan ke level 1).
        stamina: 50 + (typeof stat.sta === "number" ? stat.sta : 5) * 5,
        lapar: 20,
        sehat: 100,
        perkakas: [{ jenis: perkakasPeran(peran), level: 0 }],
        // RONDE 13 — WARGA BARU (event bubble): sapa kampung sekali,
        // singkat (~1 jam game). Bukan dialog ambient.
        interaksi: {
          jenis: "ngobrol",
          dengan: "kampung",
          hasil: "imbang",
          teks: `Halo! Aku ${nama}, warga baru!`,
          sampai_jam: gameTime(dunia.epoch_ms, Date.now()).jamTotal + 1,
        },
        target_hewan: null,
        sedang_berenang: false,
      };
      const res = await wargaCol.insertOne(doc);
      await profilCol.updateOne({ _id: profil._id }, { $set: { pending_roll: null } });
      if (!res.insertedId) return jsonError(500, "Gagal membuat karakter.");
      const kabarCol = await getCollection("kabar");
      await kabarCol.insertOne({
        jenis: "warga_baru",
        teks: `${nama} bergabung dengan kampung sebagai ${labelPeran(peran)}.`,
        hari: hariGame,
        dibuat_pada: new Date(),
      });
      return jsonOk({ warga: publicWarga({ ...doc, _id: res.insertedId }) }, 201);
    }

    return jsonError(400, "Action tidak dikenal (roll / confirm).");
  } catch (e) {
    console.error("[gacha]", e instanceof Error ? e.message : "error");
    return jsonError(500, "Gagal memproses gacha.");
  }
}
