import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tilesCol = await getCollection("peta_tile");
    const resto = await tilesCol.findOne({ kind: "paviliun_makan" });

    // Pindahkan restoran lebih jauh dari gubuk warga desa jika masih di posisi lama (84, 84)
    if (resto && resto.gx === 84 && resto.gy === 84) {
      await tilesCol.updateOne(
        { _id: resto._id },
        { $set: { gx: 125, gy: 65, w: 8, h: 8 } }
      );
      resto.gx = 125;
      resto.gy = 65;

      // Buat jalur jalan setapak dari pusat desa ke restoran baru
      const jalanCol = await getCollection("jalan");
      await jalanCol.deleteMany({ segmen: "ke-restoran" });

      const jalanTiles = [];
      for (let x = 108; x <= 129; x++) {
        jalanTiles.push({ gx: x, gy: 100, segmen: "ke-restoran" });
      }
      for (let y = 73; y < 100; y++) {
        jalanTiles.push({ gx: 129, gy: y, segmen: "ke-restoran" });
      }
      for (let x = 125; x <= 132; x++) {
        jalanTiles.push({ gx: x, gy: 73, segmen: "ke-restoran" });
      }
      if (jalanTiles.length > 0) {
        await jalanCol.insertMany(jalanTiles);
      }
    }

    const wargaCol = await getCollection("warga");
    // Ambil warga yang BENAR-BENAR lapar atau sedang dalam fase makan
    // Urutkan dari tingkat kelaparan tertinggi
    const semuaWarga = await wargaCol.find({}).sort({ lapar: -1 }).limit(100).toArray();

    // Saring hanya orang yang lapar (lapar >= 35 atau fase makan)
    let laparWarga = semuaWarga.filter((w: any) => (w.lapar ?? 0) >= 35 || w.fase_siklus === "makan");

    // Jika belum ada yang mencapai 35 lapar, ambil 2 warga yang paling lapar di desa untuk mengisi meja
    if (laparWarga.length === 0 && semuaWarga.length > 0) {
      laparWarga = semuaWarga.slice(0, 2);
    }

    const tamuList = laparWarga.slice(0, 4).map((w: any) => ({
      id: w._id.toString(),
      nama: w.nama,
      nomor: w.nomor,
      peran: w.peran,
      gender: w.gender ?? (parseInt(w.nomor || "1", 10) % 2 === 0 ? "perempuan" : "laki-laki"),
      lapar: w.lapar ?? 0,
      stamina: w.stamina ?? 100,
      sehat: w.sehat ?? 100,
      status_teks: w.status_teks,
      fase_siklus: w.fase_siklus,
      dialog:
        w.lapar > 60
          ? `Perutku keroncongan lapar sekali (Lapar: ${w.lapar}%). Aroma pedas gurih hotpot Sichuan ini langsung bikin air liur menetes!`
          : `Habis bekerja di desa, mencicipi kuah rempah pedas Sichuan di sini rasanya luar biasa mantap (Lapar: ${w.lapar}%).`,
    }));

    const duniaCol = await getCollection("dunia");
    const dunia = await duniaCol.findOne({});
    const stokPangan = dunia?.stok?.pangan ?? 0;

    return jsonOk({
      nama: "Restoran Sichuan Nirwana",
      tema: "Masakan Pedas Sichuan Nusantara",
      lokasi: { gx: resto?.gx ?? 125, gy: resto?.gy ?? 65 },
      level: resto?.level ?? 1,
      hidangan_tersedia: Math.max(0, stokPangan),
      menu: [
        { id: "hotpot", nama: "Hotpot Daging Rusa Sichuan (Mala)", pedas: "🌶️🌶️🌶️", efek: "Lapar -100, Stamina +40" },
        { id: "ikan_pedas", nama: "Sup Ikan Sungai Kuah Cabai Merah", pedas: "🌶️🌶️", efek: "Lapar -80, Sehat +20" },
        { id: "mapo_tofu", nama: "Tahu Sutra Pedas Rebus Rempah Kuno", pedas: "🌶️🌶️", efek: "Lapar -60, Stamina +25" },
        { id: "teh_gunung", nama: "Seduhan Daun Herbal Dingin", pedas: "🌿", efek: "Pelepas Dahaga & Pemulih Fokus" },
      ],
      staf: [
        { nama: "Chef Gandi", peran: "Koki Utama Sichuan", peranKey: "juru_masak", dialog: "Kuah pedas mala khas Sichuan sudah siap di kuali besar! Cabai rempah pilihan bikin badan berstamina!" },
        { nama: "Laras", peran: "Kasir & Bendahara", peranKey: "penenun", dialog: "Selamat datang di Restoran Sichuan Nirwana! Warga yang lapar silakan duduk menikmati hidangan." },
        { nama: "Bimo", peran: "Pelayan Restoran", peranKey: "penjaga_api", dialog: "Nampan sup panas pedas siap diantarkan ke meja tamu yang lapar!" },
      ],
      tamu: tamuList,
    });
  } catch (err: any) {
    return jsonError(500, err.message);
  }
}

// POST: Aksi memberi makan warga yang lapar di restoran
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { wargaId } = body;

    if (!wargaId) {
      return jsonError(400, "wargaId diperlukan");
    }

    const wargaCol = await getCollection("warga");
    let warga = null;
    try {
      warga = await wargaCol.findOne({ _id: new ObjectId(wargaId) });
    } catch {
      warga = await wargaCol.findOne({ id: wargaId });
    }

    if (!warga) {
      return jsonError(404, "Warga tidak ditemukan");
    }

    const duniaCol = await getCollection("dunia");
    const dunia = await duniaCol.findOne({});
    if (!dunia) return jsonError(404, "Dunia tidak ditemukan");

    const stok = dunia.stok ?? {};
    if ((stok.pangan ?? 0) <= 0) {
      return jsonError(400, "Persediaan pangan kampung habis! Warga harus berburu atau mengumpulkan bahan makanan terlebih dahulu.");
    }

    // Kurangi stok pangan 1 porsi
    stok.pangan = Math.max(0, (stok.pangan ?? 0) - 1);
    await duniaCol.updateOne({ _id: dunia._id }, { $set: { stok } });

    // Pulihkan lapar dan stamina warga
    const newLapar = 0;
    const newStamina = Math.min(100, Number(warga.stamina ?? 60) + 35);
    const newSehat = Math.min(100, Number(warga.sehat ?? 80) + 15);
    const statusTeks = "Kenyang & bertenaga penuh setelah makan Hotpot Sichuan di restoran.";

    await wargaCol.updateOne(
      { _id: warga._id },
      {
        $set: {
          lapar: newLapar,
          stamina: newStamina,
          sehat: newSehat,
          fase_siklus: "istirahat",
          status_teks: statusTeks,
        },
      }
    );

    // Catat kabar
    const kabarCol = await getCollection("kabar");
    await kabarCol.insertOne({
      jenis: "makan",
      teks: `🍲 ${warga.nama} menikmati seporsi Hotpot Sichuan pedas di Restoran Nirwana. Rasa lapar hilang dan stamina pulih 100%!`,
      hari: Math.floor((dunia.sim_jam ?? 0) / 24),
      dibuat_pada: new Date(),
    });

    return jsonOk({
      ok: true,
      message: `${warga.nama} telah kenyang setelah menikmati hidangan Sichuan!`,
      warga: {
        id: warga._id.toString(),
        nama: warga.nama,
        lapar: newLapar,
        stamina: newStamina,
        sehat: newSehat,
        status_teks: statusTeks,
      },
      stok,
    });
  } catch (err: any) {
    return jsonError(500, err.message);
  }
}
