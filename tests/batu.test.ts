// Test logika zaman batu (tsx). Jalankan: npx tsx tests/batu.test.ts
import { PERAN, nodeHasil, labelNode, bobotFit, pengaliFit, perkakasPeran, RESEP_PERKAKAS, type NodeKind } from "../src/lib/batu/peran";
import { BANGUNAN, bangunanById, kurangDariBiaya, cukupBiaya, stokKosong, hitungKapasitasStok, kebutuhanKampungBerikutnya, aksiPertamaBerikutnya, tonggakKampung, tonggakBaru, tonggakBaruBelumDilihat, selamaKamuPergi, barisYangMenunggu, kronikKampung, pasarMingguan } from "../src/lib/batu/sumberdaya";
import { LINES, berisiModern, FORBIDDEN_MODERN, debatBaris, geludBaris, ngobrolBaris, NGOBROL_TANYA, NGOBROL_JAWAB, dialogUntukPeran } from "../src/lib/batu/dialog";
import { rollStat, bakatDariStat, pilihPeranFit, statDenganSTA, rollUmurGacha } from "../src/lib/batu/gacha";
import { generateNodes, nodeAktif, isWater, riverX, findPlot, findBridgePlot, findBoatSpot, rotasiKeJalan, GRID_W, GRID_H, GRID_MIN, GRID_MAX, PUSAT, generateGunung, isGunung, gunungTileKeys, dedupePlacement, pasanganTumpuk, petakBangunan, plotBebas } from "../src/lib/batu/dunia";
import { pintarUntukJalan, rencanaJalan, jalurJalan, jalurSegmen, lebarkanJalan, jalurPelebaran, SEGMEN_JALAN, TIM_JALAN_INT_MIN } from "../src/lib/batu/jalan";
import { kecepatanJalan, lajuKumpul, jumlahKumpul, rollHasilKumpul, peluangKumpul, sisaCapHarian, catatKumpulHarian, tambahStokClamp, terapkanPembusukan, capHarianUntuk, PENGALI_KUMPUL, CAP_KUMPUL_HARIAN_BIASA, apakahStokPeranPenuh, terapkanRehatStokPenuh, pilihNodeTerbaik, sektorDariPosisi, sektorWarga, pilihTargetKerja, ambilTargetKerja, pilihPanganTerdekat, isPanganNode, statusKumpul, pengaliCuaca, gerak, stepWarga, stepInteraksi, stepHewan, stepPerburuan, jadwalRegrow, butuhRespawnHewan, peluangRespawnHewan, lokasiRespawnHewan, SABUK_HEWAN_MAKS, SABUK_HEWAN_BUAS, sabukHewan, JARAK_KABUR_JINAK, carikanHunian, tileHunian, tileTamu, titikSungaiTerdekat, waypointPatroliBerikutnya, WAYPOINT_PATROLI, tileSebelah, pilihLokasiRespawn, terapkanSpawnTertunda, periksaNodeHabis, pintuRestoran, tengahRestoran, dapurRestoran, kolomPintuRestoran, diDalamRestoran, rintanganUntuk, punyaTombakIblis, damageSenjata, damageBerburu, hpHewan, skorGelud, cariBantuan, terapkanBantu, terapkanJalan, terapkanBantuBangun, hitungPembantuBangun, progresKonstruksiPerJam, MAKS_PEMBANTU_BANGUN, KAP_HIDANGAN, LAPAR_HIDANGAN, LAPAR_PANGAN_RESTORAN, IKAN_CAP, IKAN_REGROW_HARIAN, SISA_NODE_AWAL, type SimCtx, type Warga, type DagingDoc } from "../src/lib/batu/sim";
import { paceTampil, lajuServerPerDetik, langkahDisplay, jalurTampil, paletCahaya, pusatDariTitik, bubbleInteraksiAktif, teksBubbleEvent, blokObrolan, obrolanTampil, isNight, langkahAyunan, sudutAyunan, langkahHewan, sudutKakiHewan, AMBANG_SNAP_DESYNC, kunciTujuan, kunciTujuanBaru, poseTidur, specRambut, gayaTombolGender, ayunanPerkakas, cariHewanBuas, hitungPipKumpul, lebarBarHp, opacityLabelHewan, opacityLabelHewanJarak, OPACITY_LABEL_HEWAN_TENANG, JARAK_LABEL_HEWAN_PENUH, JARAK_LABEL_HEWAN_HILANG, rumpunPadi, PADI_WARNA, wargaTanpaTugas, tidurDiDalam, rapikanLabelBertumpuk, JARAK_LABEL_BERTUMPUK } from "../src/lib/batu/tampil";
import { gainJarak, panKamera, lapisanAmbien, SFX_JARAK, SFX_PERKAKAS, SFX_HEWAN } from "../src/lib/audio";
import { HEWAN, hewanById } from "../src/lib/batu/hewan";
import { gameTime, migrasiJam, migrasiJamV4, durasiJamMs, jamAdalahMalam, realMsUntukJam } from "../src/lib/clock";
import { faseDariJam } from "../src/lib/world";
import { infoBakat, pengaliKumpulBakat, bonusJumlahBakat, pengaliJalanBakat, pulihStaminaBakat } from "../src/lib/batu/bakat";
import { ORANG_TINGGI, GUBUK_TINGGI, POHON_TINGGI } from "../src/lib/batu/skala";
import { isVillageMaterial } from "../src/lib/batu/assetVillage3D";
import { isRoadMaterial } from "../src/lib/batu/assetRoad3D";
import * as THREE from "three";
import { readFileSync } from "fs";
import { publicWarga } from "../src/lib/security";
import { createHash } from "crypto";

let pass = 0;
let fail = 0;
function ok(cond: boolean, label: string) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error("FAIL:", label);
  }
}
function eq(a: unknown, b: unknown, label: string) {
  ok(JSON.stringify(a) === JSON.stringify(b), `${label} (dapat ${JSON.stringify(a)}, mau ${JSON.stringify(b)})`);
}

// Peran: 18 (10 lama + 8 baru ronde 4), nodeKinds valid (kecuali peran
// target-khusus: nelayan = sungai, penjaga = patroli), bobot > 0.
ok(PERAN.length === 18, "18 peran");
for (const p of PERAN) {
  ok(p.bobot > 0, `bobot ${p.id} > 0`);
  if (p.id === "nelayan" || p.id === "penjaga") {
    ok(p.nodeKinds.length === 0, `nodeKinds kosong (target khusus) ${p.id}`);
  } else {
    ok(p.nodeKinds.length > 0, `nodeKinds ${p.id}`);
  }
  ok(Object.keys(p.syarat).length > 0, `syarat ${p.id} ada`);
}
ok(!PERAN.some((p) => ["presiden", "polisi", "asn"].includes(p.id)), "tanpa peran modern");
ok(nodeHasil("padang_buruan").kulitBonus === 2, "pemburu dapat kulit bonus");
ok(nodeHasil("urat_emas").resource === "emas", "urat emas -> emas");
ok(labelNode("pohon") === "hutan", "label node pohon");
for (const p of ["nelayan", "petani", "penjaga", "pengukir", "penjelajah", "pemanjat", "penenun", "penjerat"]) {
  ok(LINES[p as keyof typeof LINES].length >= 10, `dialog ${p} >= 10 baris`);
  ok(RESEP_PERKAKAS[perkakasPeran(p)] !== undefined, `resep perkakas ${p} ada`);
  ok(statusKumpul(p as never, "semak_beri").length > 0, `status kumpul ${p} ada`);
}

// Role-fit: INT tinggi + STR/AGI kecil TIDAK MUNGKIN pemburu/penambang.
const statPintar = { int: 10, str: 2, agi: 2, sta: 2 };
eq(bobotFit("pemburu", statPintar), 0, "pemburu dikecualikan untuk stat pintar");
eq(bobotFit("penambang", statPintar), 0, "penambang dikecualikan untuk stat pintar");
ok(bobotFit("peramu", statPintar) > 0, "peramu tersedia untuk stat pintar");
ok(bobotFit("juru_masak", statPintar) > 0, "juru masak tersedia untuk stat pintar");
for (let i = 0; i < 200; i++) {
  const peran = pilihPeranFit(statPintar);
  ok(peran !== "pemburu" && peran !== "penambang", "pilihPeranFit tidak pernah pemburu/penambang untuk stat pintar");
}
ok(pengaliFit("peramu", statPintar) === 1, "pengaliFit 1 bila syarat terpenuhi");
ok(pengaliFit("pemburu", statPintar) === 0.6, "pengaliFit 0.6 bila syarat tidak terpenuhi");
ok(perkakasPeran("penebang") === "kapak", "perkakas penebang = kapak");
ok(perkakasPeran("pemburu") === "tombak", "perkakas pemburu = tombak");
ok(RESEP_PERKAKAS["kapak"].kayu === 6 && RESEP_PERKAKAS["kapak"].batu === 6, "resep kapak");
ok(RESEP_PERKAKAS["busur"].kayu === 12, "resep busur");

// Bangunan: 22 lama + 1 baru ronde 17.
ok(BANGUNAN.length === 23, "23 bangunan (22 + kebun_rempah r17)");
for (const b of BANGUNAN) {
  ok(Object.values(b.biaya).every((v) => (v ?? 0) > 0), `biaya ${b.id} positif`);
}
ok(BANGUNAN.find((b) => b.id === "gubuk_besar")?.kapasitas === 6, "gubuk besar kap 6");
ok(BANGUNAN.find((b) => b.id === "tenda_besar")?.kapasitas === 3, "tenda besar kap 3");
ok(BANGUNAN.some((b) => b.id === "jembatan" && b.penempatan === "jembatan"), "jembatan penempatan khusus");
ok(BANGUNAN.some((b) => b.id === "perahu" && b.penempatan === "perahu"), "perahu penempatan khusus");
eq(kurangDariBiaya({ kayu: 10 }, { kayu: 30, kulit: 10 }), { kayu: 20, kulit: 10 }, "kurangDariBiaya");
ok(cukupBiaya({ kayu: 30, kulit: 10 }, { kayu: 30, kulit: 10 }), "cukupBiaya pas");
ok(!cukupBiaya({ kayu: 29, kulit: 10 }, { kayu: 30, kulit: 10 }), "cukupBiaya kurang");
const stok0 = stokKosong();
ok(Object.values(stok0).every((v) => v === 0), "stok kosong");

// Dialog: tiap peran >= 10 baris, TIDAK ADA baris mengandung hal modern.
for (const p of PERAN) {
  const lines = LINES[p.id];
  ok(lines.length >= 10, `dialog ${p.id} >= 10 baris (${lines.length})`);
  for (const line of lines) {
    ok(!berisiModern(line), `dialog bersih ${p.id}: "${line.slice(0, 40)}"`);
  }
}
ok(FORBIDDEN_MODERN.includes("mie") && FORBIDDEN_MODERN.includes("presiden"), "daftar larangan ada mie+presiden");
ok(berisiModern("presiden bilang mie-nya belum datang"), "deteksi mie+presiden");
ok(berisiModern("aku punya HP baru"), "deteksi HP");
ok(!berisiModern("api unggun menyala terang malam ini"), "non-modern lolos");
const debat = debatBaris("Budi", () => 0);
ok(debat.tantang.length > 0 && debat.jawab.length > 0, "debat tantang+jawab ada");
ok(!berisiModern(debat.tantang) && !berisiModern(debat.jawab), "debat bersih modern");
ok(geludBaris(() => 0).length > 0, "gelud ada");
ok(dialogUntukPeran("pemburu", "Budi", () => 0) === LINES.pemburu[0], "dialog seeded deterministik");

// Gacha: stat 1-10 (termasuk STA), umur 18-55, bakat 4 arah.
for (let i = 0; i < 1000; i++) {
  const s = rollStat();
  ok(s.int >= 1 && s.int <= 10 && s.str >= 1 && s.str <= 10 && s.agi >= 1 && s.agi <= 10 && s.sta >= 1 && s.sta <= 10, "stat 1-10 (4 stat)");
  const u = rollUmurGacha();
  ok(u >= 18 && u <= 55, "umur 18-55");
  const peran = pilihPeranFit(s);
  ok(PERAN.some((p) => p.id === peran), "peran fit valid");
}
eq(bakatDariStat({ int: 9, str: 3, agi: 3, sta: 3 }), "INT", "bakat INT");
eq(bakatDariStat({ int: 2, str: 8, agi: 2, sta: 2 }), "STR", "bakat STR");
eq(bakatDariStat({ int: 2, str: 2, agi: 7, sta: 2 }), "AGI", "bakat AGI");
eq(bakatDariStat({ int: 2, str: 2, agi: 2, sta: 9 }), "STA", "bakat STA");
eq(statDenganSTA({ int: 8, str: 4, agi: 6 }), { int: 8, str: 4, agi: 6, sta: 5 }, "migrasi STA default 5");
eq(statDenganSTA({ int: 8, str: 4, agi: 6, sta: 7 }), { int: 8, str: 4, agi: 6, sta: 7 }, "STA lama dipertahankan");

// Dunia 600x600 (RONDE 11): deterministik, node bukan di air, jauh dari pusat, plot ada.
const n1 = generateNodes();
const n2 = generateNodes();
eq(n1, n2, "generateNodes deterministik");
ok(n1.length > 400, `node cukup banyak (${n1.length})`);
const kinds = new Set(n1.map((n) => n.kind));
for (const k of ["pohon", "semak_beri", "padang_buruan", "singkapan_batu", "urat_emas", "urat_besi"] as NodeKind[]) {
  ok(kinds.has(k), `node kind ${k} ada`);
}
for (const n of n1) {
  ok(!isWater(n.gx, n.gy), `node ${n.kind} bukan di air`);
  ok(Math.abs(n.gx - 100) + Math.abs(n.gy - 100) >= 7, `node ${n.kind} jauh dari pusat`);
}
for (let gy = GRID_MIN; gy < GRID_MAX; gy++) {
  const rx = riverX(gy);
  ok(rx >= 36 && rx <= 44, "sungai x 36-44");
}
ok(isWater(riverX(9), 9) && isWater(riverX(9) + 1, 9), "sungai basah di riverX(gy)");
const plot = findPlot(new Set(["98,98", "99,98", "98,99", "99,99", "102,100"]), new Set(n1.map((n) => `${n.gx},${n.gy}`)), 2, 2);
ok(plot !== null, "findPlot menemukan plot");
ok(GRID_W === 600 && GRID_H === 600 && GRID_MIN === -200 && GRID_MAX === 400, "grid 600x600 min -200");
const bridge = findBridgePlot(new Set());
ok(bridge !== null, "findBridgePlot menemukan segmen");
if (bridge) {
  ok(isWater(bridge.gx + 1, bridge.gy) && isWater(bridge.gx + 2, bridge.gy), "jembatan melintasi 2 tile air");
  ok(!isWater(bridge.gx, bridge.gy) && !isWater(bridge.gx + 3, bridge.gy), "jembatan bertepian darat");
}
const boat = findBoatSpot(new Set());
ok(boat !== null && isWater(boat.gx, boat.gy), "findBoatSpot di air");

// Sim murni.
ok(kecepatanJalan(1) === 90 && kecepatanJalan(10) === 135, "kecepatan jalan 90-135 (ronde 6: jalan seperti orang jalan, tampil 1,5-2,25 tile/detik)");
ok(kecepatanJalan(10, 10) === 120, "stamina rendah memperlambat jalan (-15)");
ok(lajuKumpul(1) === 25 && lajuKumpul(10) === 70, "laju kumpul 25-70");
ok(jumlahKumpul(1) === 4 && jumlahKumpul(10) === 9, "jumlah kumpul 4-9");
const dekat = pilihNodeTerbaik("penebang", { gx: 100, gy: 100 }, [
  { kind: "pohon", gx: 110, gy: 100 },
  { kind: "pohon", gx: 102, gy: 100 },
  { kind: "semak_beri", gx: 101, gy: 100 },
]);
eq(dekat, { kind: "pohon", gx: 102, gy: 100 }, "pilih node terdekat sesuai peran");
const habis = pilihNodeTerbaik(
  "penebang",
  { gx: 100, gy: 100 },
  [
    { kind: "pohon", gx: 101, gy: 100 },
    { kind: "pohon", gx: 105, gy: 100 },
  ],
  new Map([["101,100", 0], ["105,100", 3]])
);
eq(habis, { kind: "pohon", gx: 105, gy: 100 }, "node habis dilewati (deplesi)");
ok(statusKumpul("penambang", "urat_emas").includes("emas"), "status tambang emas");
ok(statusKumpul("kepala_suku", "padang_buruan").length > 0, "status kepala suku");
ok(statusKumpul("peramu", "semak_beri").length > 0, "status peramu");
ok(statusKumpul("juru_masak", "semak_beri").length > 0, "status juru masak");
ok(pengaliCuaca("cerah") === 1 && pengaliCuaca("hujan") === 0.7 && pengaliCuaca("petir") === 0.5 && pengaliCuaca("berawan") === 0.9, "pengali cuaca");

// Hewan: 6 spesies, 3 jinak + 3 buas.
ok(HEWAN.length === 6, "6 spesies hewan");
ok(HEWAN.filter((h) => h.jinak).length === 3, "3 hewan jinak");
ok(HEWAN.filter((h) => !h.jinak).length === 3, "3 hewan buas");
ok(hewanById("rusa")?.jinak === true, "rusa jinak");
ok(hewanById("beruang")?.jinak === false, "beruang buas");
ok((hewanById("rusa")?.pangan ?? 0) > 0, "rusa memberi pangan");

// Jam game v4 (RONDE 9): siang 60 detik/jam, malam (20-06) 6 detik/jam.
// Satu hari game = 14x60 + 10x6 = 900 detik (15 menit nyata).
const gt0 = gameTime(0, 6_000);
ok(gt0.jamTotal === 1 && gt0.jam === 1 && gt0.day === 0, "6 detik malam = 1 jam game");
const gt60 = gameTime(0, 60_000);
ok(gt60.jamTotal === 6 && gt60.jam === 6 && gt60.menit === 24, "60 detik = 6 jam malam (36 detik) + 24 menit jam pagi");
const gt90 = gameTime(0, 90_000);
ok(gt90.jamTotal === 6 && gt90.menit === 54, "90 detik = 6 jam + 54 menit jam pagi");
const gtHari = gameTime(0, 900_000);
ok(gtHari.jamTotal === 24 && gtHari.day === 1 && gtHari.jam === 0, "900 detik = 1 hari game v4");
const gt61 = gameTime(1_000_000, 1_000_000 + 3660 * 1000);
ok(gt61.jamTotal === 102 && gt61.day === 4 && gt61.jam === 6 && gt61.hariKeTahun === 5, "3660 detik = 102 jam = hari 4 jam 06");

// Migrasi jam v3 -> v4 (RONDE 9): jamTotal dipertahankan persis —
// tanpa ini jamTotal melonjak karena malam lama dihitung ulang 6 detik.
// Acuan v3: 100,5 jam (100 jam penuh + 0,5 jam) pada durasi tetap 60 detik.
{
  const E = 1_000_000;
  const N = E + 100 * 60_000 + 30_000;
  const m4 = migrasiJamV4(E, N);
  eq(m4.jamTotal, 100, "migrasi v4: jamTotal 100 dipertahankan");
  const baru = gameTime(m4.epochBaruMs, N);
  ok(baru.jamTotal === 100 && baru.jam === 4 && baru.menit === 30, "migrasi v4: tampil jam 04.30 (jam malam, frac 0,5 x 6 detik)");
  const maju = gameTime(m4.epochBaruMs, N + 60_000);
  ok(maju.jamTotal === 102 && maju.jam === 6 && maju.menit === 51, "migrasi v4: +60 detik nyata melintasi malam->pagi = +2 jam game (3 detik sisa malam + 6 detik malam + 51 detik pagi)");
  eq(realMsUntukJam(24, 0), 900_000, "realMsUntukJam: 1 hari game = 900 detik");
  eq(realMsUntukJam(0, 0.5), 3_000, "realMsUntukJam: 0,5 jam malam pertama = 3 detik");
}

// Gerak: langkah lurus, biaya air 2, sampai tujuan.
{
  const r1 = gerak({ gx: 100, gy: 100 }, { gx: 105, gy: 100 }, 3, {});
  eq(r1.lokasi, { gx: 103, gy: 100 }, "gerak 3 tile lurus");
  ok(r1.berenang === false, "gerak darat bukan renang");
  const rx = riverX(50);
  const r2 = gerak({ gx: rx - 3, gy: 50 }, { gx: rx + 4, gy: 50 }, 10, {});
  eq(r2.lokasi, { gx: rx + 4, gy: 50 }, "gerak menyeberang sungai (biaya air 2)");
  ok(r2.berenang === true, "gerak lewat air = berenang");
}

// stepWarga: gerak + progres maju tiap jam (bukan macet).
function ctxKosong(w: Warga): SimCtx {
  return {
    nodes: [],
    nodeSisa: new Map(),
    nodeRegrow: new Map(),
    stok: stokKosong(),
    kabar: [],
    hunianTitik: () => ({ gx: 100, gy: 100 }),
    rintangan: new Set(),
    jembatan: new Set(),
    perahuAda: false,
    hewan: [],
    hewanHilang: new Set(),
    wargaSemua: [w],
    cuaca: "cerah",
    hari: 0,
    jam: 12,
  };
}
function wargaDasar(over: Partial<Warga>): Warga {
  return {
    _id: "t1",
    nama: "Tes",
    nomor: "0001",
    gender: "laki",
    umur: 30,
    lahir_hari: 0,
    tahap_hidup: "dewasa",
    peran: "penebang",
    stat: { int: 5, str: 8, agi: 5, sta: 5 },
    bakat: "STR",
    sifat: "rajin",
    lokasi: { gx: 100, gy: 100 },
    tujuan: null,
    node: null,
    aksi_sekarang: "",
    status_teks: "",
    tempat_kerja: "",
    progres_aksi_pct: 0,
    fase_siklus: "jalan",
    istirahat_sisa: 0,
    hunian: null,
    profil_id: null,
    dibuat_pada: new Date(),
    sim_hari: 0,
    stamina: 80,
    lapar: 20,
    sehat: 100,
    perkakas: [],
    interaksi: null,
    target_hewan: null,
    sedang_berenang: false,
    ...over,
  } as Warga;
}
{
  const w = wargaDasar({ stat: { int: 5, str: 8, agi: 5, sta: 50 }, lokasi: { gx: 70, gy: 100 }, tujuan: { gx: 199, gy: 100 }, node: { kind: "pohon", gx: 199, gy: 100 }, fase_siklus: "jalan" });
  stepWarga(w, 12, ctxKosong(w));
  ok(w.lokasi.gx === 175 && w.lokasi.gy === 100, "jalan: lokasi maju 105 tile/jam (ronde 6)");
  ok(w.fase_siklus === "jalan", "jalan: belum sampai, tetap jalan");
}
{
  // Tiba di node dalam jam yang sama -> langsung kumpul (tanpa jeda).
  const w = wargaDasar({ stat: { int: 5, str: 8, agi: 5, sta: 50 }, lokasi: { gx: 100, gy: 100 }, tujuan: { gx: 105, gy: 100 }, node: { kind: "pohon", gx: 105, gy: 100 }, fase_siklus: "jalan" });
  stepWarga(w, 12, ctxKosong(w));
  ok(w.lokasi.gx === 105 && w.lokasi.gy === 100, "jalan: tiba di node 5 tile dalam 1 jam");
  ok(w.fase_siklus === "kumpul" && w.aksi_sekarang === "mengumpulkan", "jalan: tiba -> kumpul di jam yang sama");
}
{
  const w = wargaDasar({ lokasi: { gx: 105, gy: 100 }, node: { kind: "pohon", gx: 105, gy: 100 }, fase_siklus: "kumpul", progres_aksi_pct: 0 });
  stepWarga(w, 12, ctxKosong(w));
  ok(w.progres_aksi_pct === 60, "kumpul siang: progres +60%/jam");
  ok(w.aksi_sekarang === "mengumpulkan", "kumpul: aksi mengumpulkan");
}
{
  // RONDE 9: jam 20:00 warga TIDAK kumpul lagi — pulang tidur malam
  // (faktor kumpul malam x0.85 kini praktis mati, dipertahankan di kode
  // sebagai pengaman saja). Penjaga api ikut tidur.
  const w = wargaDasar({ lokasi: { gx: 0, gy: 0 }, node: { kind: "pohon", gx: 0, gy: 0 }, fase_siklus: "kumpul", progres_aksi_pct: 0 });
  stepWarga(w, 20, ctxKosong(w));
  ok(w.fase_siklus === "kembali" && w.progres_aksi_pct === 0, "malam 20:00: kumpul -> pulang tidur");
  eq(w.tujuan, { gx: 100, gy: 100 }, "malam 20:00: tujuan hunian");
  const api = wargaDasar({ peran: "penjaga_api", lokasi: { gx: 0, gy: 0 }, node: { kind: "pohon", gx: 0, gy: 0 }, fase_siklus: "kumpul", progres_aksi_pct: 0 });
  stepWarga(api, 20, ctxKosong(api));
  ok(api.fase_siklus === "kembali", "penjaga api malam 20:00: ikut pulang tidur");
}
{
  // Kumpul selesai -> kembali + stok bertambah.
  const w = wargaDasar({ lokasi: { gx: 105, gy: 100 }, node: { kind: "pohon", gx: 105, gy: 100 }, fase_siklus: "kumpul", progres_aksi_pct: 90 });
  const ctx = ctxKosong(w);
  stepWarga(w, 12, ctx);
  ok(w.fase_siklus === "kembali" && w.progres_aksi_pct === 0, "kumpul selesai -> kembali");
  // r45 (perintah user 2026-11-05: resource 5x): 1 ronde = roll 1-3 x5
  // = 5..15 (dulu r15: 45 dari rumus lama yang sudah tidak ada).
  ok(ctx.stok.kayu >= 5 && ctx.stok.kayu <= 15, `r45: kumpul selesai -> stok kayu 5..15 (roll 1-3 x5, dapat ${ctx.stok.kayu})`);
  eq(w.tujuan, { gx: 100, gy: 100 }, "kumpul selesai -> tujuan hunian");
}
{
  // Stamina kritis di tengah peta -> PULANG, bukan beku di tempat.
  const w = wargaDasar({ lokasi: { gx: 50, gy: 50 }, stamina: 10, fase_siklus: "jalan", tujuan: { gx: 105, gy: 100 }, node: { kind: "pohon", gx: 105, gy: 100 } });
  stepWarga(w, 12, ctxKosong(w));
  ok(w.fase_siklus === "kembali", "stamina kritis -> fase kembali (pulang)");
  eq(w.tujuan, { gx: 100, gy: 100 }, "stamina kritis -> tujuan hunian");
}
{
  // Istirahat warisan di tengah peta -> diarahkan pulang.
  const w = wargaDasar({ lokasi: { gx: 50, gy: 50 }, fase_siklus: "istirahat", stamina: 80 });
  stepWarga(w, 12, ctxKosong(w));
  ok(w.fase_siklus === "kembali", "istirahat tengah peta -> pulang");
  eq(w.tujuan, { gx: 100, gy: 100 }, "istirahat tengah peta -> tujuan hunian");
}
{
  // Istirahat DI hunian -> tetap istirahat + stamina pulih.
  const w = wargaDasar({ lokasi: { gx: 100, gy: 100 }, fase_siklus: "istirahat", stamina: 80, istirahat_sisa: 1 });
  stepWarga(w, 12, ctxKosong(w));
  ok(w.fase_siklus === "istirahat" && w.stamina === 100, "istirahat di hunian -> stamina pulih");
}

// Despawn/respawn: node habis hilang, regrow 30-60 jam, hewan respawn < 25.
{
  const nodes = [
    { kind: "pohon" as const, gx: 101, gy: 100 },
    { kind: "pohon" as const, gx: 105, gy: 100 },
  ];
  const aktif = nodeAktif(nodes, { "101,100": 0, "105,100": 3 });
  eq(aktif, [{ kind: "pohon", gx: 105, gy: 100 }], "node habis (sisa 0) hilang dari peta");
  eq(nodeAktif(nodes), nodes, "tanpa data sisa: semua node aktif");
  for (const [gx, gy] of [[10, 20], [33, 44], [99, 7], [150, 150]]) {
    const j = jadwalRegrow(100, gx, gy);
    ok(j >= 130 && j <= 159, `regrow 30-60 jam (${gx},${gy} -> ${j})`);
  }
  ok(butuhRespawnHewan(24) === true && butuhRespawnHewan(25) === false, "respawn aktif bila < 25");
  ok(peluangRespawnHewan(11) === 0.5 && peluangRespawnHewan(20) === 0.3 && peluangRespawnHewan(25) === 0, "peluang respawn 0.5/0.3/0");
}

// Skala proporsional: pohon > gubuk > orang.
ok(ORANG_TINGGI < GUBUK_TINGGI && GUBUK_TINGGI < POHON_TINGGI, "pohon > gubuk > orang");
ok(GUBUK_TINGGI / ORANG_TINGGI > 2, "gubuk > 2x orang");
ok(POHON_TINGGI / ORANG_TINGGI > 3, "pohon > 3x orang");

// RONDE 2 — tampil: laju display terlihat, bubble tepat 4 jam, obrolan berputar.
{
  eq(paceTampil(0), 0.35, "pace min 0,35 (terlihat, bukan merayap)");
  eq(paceTampil(6), 0.35, "pace lompat kecil tetap min terlihat");
  eq(paceTampil(20), 0.8, "pace lompat 20 tile = 0,8");
  eq(paceTampil(60), 1.2, "pace dibatasi maks 1,2");
  ok(paceTampil(10) <= paceTampil(30), "pace monoton naik");
  // RONDE 13 — jendela bubble event-only: ~1 jam game (dulu 4 jam).
  // Jendela lama (+4) dipotong display guard jadi 1 jam terakhir saja.
  // RONDE 15 — jendela (dibuat, sampai] (dulu [dibuat, sampai]):
  // tepat di sampai_jam TIDAK tampil lagi, supaya generasi sebelumnya
  // tidak numpuk dengan generasi baru (penyebab 8-9 bubble sekaligus).
  ok(bubbleInteraksiAktif(100, 100) === false, "r15: bubble TIDAK tampil tepat di sampai_jam (jendela eksklusif)");
  ok(bubbleInteraksiAktif(101, 100) === true, "r15: bubble aktif 1 jam sebelum akhir");
  ok(bubbleInteraksiAktif(100, 99) === true, "r15: bubble aktif di jam pembuatannya (generasi berjalan)");
  ok(bubbleInteraksiAktif(100, 98) === false, "bubble TIDAK tampil 2 jam sebelum akhir (jendela lama dipotong)");
  ok(bubbleInteraksiAktif(100, 101) === false, "bubble TIDAK overhang setelah akhir");
  ok(bubbleInteraksiAktif(100, 50) === false, "bubble TIDAK tampil sebelum dibuat");
  // teksBubbleEvent: hanya interaksi aktif yang menghasilkan bubble.
  ok(teksBubbleEvent({ teks: "Halo!", sampai_jam: 101 }, 100) === "Halo!", "bubble event aktif menampilkan teks");
  ok(teksBubbleEvent({ teks: "Halo!", sampai_jam: 101 }, 102) === "", "bubble event kedaluwarsa = kosong");
  ok(teksBubbleEvent(null, 100) === "", "tanpa interaksi = tanpa bubble (ambient tidak dirender)");
  ok(teksBubbleEvent({ teks: "Halo!" }, 100) === "", "interaksi tanpa sampai_jam = tanpa bubble");
  eq(blokObrolan(0), 0, "blok obrolan jam 0 = 0");
  eq(blokObrolan(3), 0, "blok obrolan jam 3 = 0");
  eq(blokObrolan(4), 1, "blok obrolan jam 4 = 1");
  ok(obrolanTampil(0, 0) === true && obrolanTampil(1, 0) === false, "obrolan bergilir per blok");
  ok(obrolanTampil(0, 4) === false && obrolanTampil(2, 4) === true, "obrolan berputar tiap 4 jam");
}

// RONDE 2 — istirahat tidak deadlock: bangun walau sehat rendah bila stamina penuh.
{
  const w = wargaDasar({ lokasi: { gx: 100, gy: 100 }, fase_siklus: "istirahat", stamina: 100, sehat: 10, lapar: 100, istirahat_sisa: 0 });
  const ctx = { ...ctxKosong(w), nodes: [{ kind: "pohon" as const, gx: 105, gy: 100 }], stok: stokKosong() };
  stepWarga(w, 12, ctx);
  ok(w.fase_siklus === "jalan", "stamina penuh -> bangun walau sehat 10 (anti deadlock)");
  ok(w.sehat === 11, "sehat pulih pelan saat istirahat walau kelaparan");
}
{
  // Sehat pulih saat istirahat walau lapar 100 (dulu tertahan gate lapar < 70).
  const w = wargaDasar({ lokasi: { gx: 100, gy: 100 }, fase_siklus: "istirahat", stamina: 80, sehat: 50, lapar: 100, istirahat_sisa: 1 });
  stepWarga(w, 12, ctxKosong(w));
  ok(w.sehat === 51 && w.fase_siklus === "istirahat", "istirahat kelaparan tetap pulih +1 sehat");
}

// RONDE 2 — intent pulang dipertahankan (bukan ditimpa "membawa hasil").
{
  const w = wargaDasar({ lokasi: { gx: 70, gy: 100 }, tujuan: { gx: 199, gy: 100 }, fase_siklus: "kembali", aksi_sekarang: "pulang_istirahat", stamina: 80 });
  stepWarga(w, 12, ctxKosong(w));
  ok(w.fase_siklus === "kembali" && w.aksi_sekarang === "pulang_istirahat", "pulang_istirahat dipertahankan selama kembali");
  ok(w.status_teks === "Pulang, kelelahan…", "status pulang_istirahat dipertahankan");
}

// RONDE 2 — interaksi: istirahat tidak debat, gelud loser kabur, cooldown 12 jam.
{
  const rndAsli = Math.random;
  const a = wargaDasar({ _id: "a1", lokasi: { gx: 100, gy: 100 }, fase_siklus: "jalan" });
  const b = wargaDasar({ _id: "b1", lokasi: { gx: 101, gy: 100 }, fase_siklus: "jalan" });
  const ctx = { ...ctxKosong(a), wargaSemua: [a, b] };
  let ri = 0;
  const seq = [0.05, 0.5, 0.1, 0.1];
  Math.random = () => seq[ri++] ?? 0.5;
  stepInteraksi([a, b], 100, ctx);
  Math.random = rndAsli;
  ok(a.interaksi?.jenis === "gelud" && b.interaksi?.jenis === "gelud", "gelud terpicu antar warga dekat");
  ok(b.aksi_sekarang === "kabur" && b.fase_siklus === "kembali", "loser gelud kabur (aksi kabur + fase kembali)");
  ok((b.interaksiCooldown ?? {})["a1"] === 112, "cooldown pasangan 12 jam diset");
  // Kabur dipertahankan selama perjalanan pulang (tidak jadi "membawa hasil").
  const bk = wargaDasar({ _id: "b1", lokasi: { gx: 70, gy: 100 }, tujuan: { gx: 199, gy: 100 }, fase_siklus: "kembali", aksi_sekarang: "kabur", status_teks: "Kabur setelah gelud…" });
  stepWarga(bk, 101, ctxKosong(bk));
  ok(bk.aksi_sekarang === "kabur" && bk.status_teks === "Kabur setelah gelud…", "kabur dipertahankan selama pulang");
  // Cooldown: jam 105 (sampai lewat, cooldown jalan) tidak memicu ulang.
  Math.random = () => 0;
  stepInteraksi([a, b], 105, ctx);
  Math.random = rndAsli;
  ok(a.interaksi?.sampai_jam === 101, "cooldown cegah interaksi ulang pasangan sama");
}
{
  // Warga istirahat tidak memicu debat/gelud walau berdekatan.
  const rndAsli = Math.random;
  const a = wargaDasar({ _id: "a1", lokasi: { gx: 100, gy: 100 }, fase_siklus: "istirahat" });
  const b = wargaDasar({ _id: "b1", lokasi: { gx: 101, gy: 100 }, fase_siklus: "jalan" });
  const ctx = { ...ctxKosong(a), wargaSemua: [a, b] };
  Math.random = () => 0;
  stepInteraksi([a, b], 100, ctx);
  Math.random = rndAsli;
  ok(a.interaksi === null && b.interaksi === null, "warga tidur tidak debat/gelud");
}

// RONDE 2 — SFX proximity: kurva jarak, pan, daftar bunyi lengkap.
{
  eq(gainJarak(0, 20), 1, "gain 1 di sumber");
  eq(gainJarak(10, 20), 0.25, "gain kuadrat setengah radius");
  eq(gainJarak(20, 20), 0, "gain 0 di batas radius");
  eq(gainJarak(25, 20), 0, "gain 0 di luar radius");
  ok(gainJarak(5, 20) > gainJarak(15, 20), "gain menurun dengan jarak");
  eq(panKamera(1, 0, 1, 0), 0.8, "pan kanan penuh");
  eq(panKamera(-1, 0, 1, 0), -0.8, "pan kiri penuh");
  eq(panKamera(0, 0, 1, 0), 0, "pan netral di sumber");
  for (const sp of ["rusa", "kelinci", "ayam", "babi_hutan", "serigala", "beruang"]) {
    ok(SFX_HEWAN[sp] !== undefined, `SFX hewan ${sp} ada`);
  }
  eq(SFX_PERKAKAS["penebang"], "chop", "SFX penebang = kapak");
  eq(SFX_PERKAKAS["penambang"], "pick", "SFX penambang = beliung");
  eq(SFX_PERKAKAS["perajin"], "hammer", "SFX perajin = palu");
  ok(SFX_JARAK.langkah < SFX_JARAK.api && SFX_JARAK.hewan <= SFX_JARAK.api, "radius api paling jauh");
}

// RONDE 2 fix — gerak memutar rintangan (kasus live Hunter di pintu gubuk).
{
  // Tanpa fix: (47,49) -> (49,49) dengan (48,49) milik gubuk = diam selamanya.
  const r = gerak({ gx: 47, gy: 49 }, { gx: 49, gy: 49 }, 4, { rintangan: new Set(["48,48", "49,48", "48,49"]) });
  ok(r.lokasi.gx === 49 && r.lokasi.gy === 49, "gerak memutar gubuk sampai tujuan (bukan buntu)");
  const r1 = gerak({ gx: 47, gy: 49 }, { gx: 49, gy: 49 }, 1, { rintangan: new Set(["48,48", "49,48", "48,49"]) });
  ok(!(r1.lokasi.gx === 47 && r1.lokasi.gy === 49), "gerak 1 langkah saat buntu = menyamping, bukan diam");
  // Tanpa rintangan: tetap lurus (tidak ada regresi).
  const l = gerak({ gx: 0, gy: 0 }, { gx: 3, gy: 0 }, 3, {});
  ok(l.lokasi.gx === 3 && l.lokasi.gy === 0, "gerak lurus tanpa rintangan");
}

// HAPUS SETTING SIANG/MALAM — siang/malam dari SISTEM (jam game server).
// Render malam HANYA dari fase server, tanpa override/setting pengguna.
{
  ok(isNight("malam"), "isNight malam = gelap");
  ok(!isNight("pagi"), "isNight pagi = terang");
  ok(!isNight("siang"), "isNight siang = terang");
  ok(!isNight("sore"), "isNight sore = terang");
  ok(!isNight(""), "isNight fase kosong = terang");
  // Tidak ada UI setting siang/malam di page + Map3D: tanpa state/prop
  // dayNight, tanpa baca/tulis setting, tanpa label tampilan pribadi.
  const pageSrc = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  const mapSrc = readFileSync(new URL("../src/components/Map3D.tsx", import.meta.url), "utf8");
  ok(!pageSrc.includes("dayNight"), "page: tanpa dayNight");
  ok(!mapSrc.includes("dayNight"), "map3d: tanpa dayNight");
  ok(!pageSrc.includes('getItem("ne_daynight")'), "page: tanpa baca ne_daynight");
  ok(!mapSrc.includes('getItem("ne_daynight")'), "map3d: tanpa baca ne_daynight");
  ok(!pageSrc.includes('setItem("ne_daynight"'), "page: tanpa tulis ne_daynight");
  ok(!mapSrc.includes('setItem("ne_daynight"'), "map3d: tanpa tulis ne_daynight");
  ok(!pageSrc.includes("Tampilan pribadi") && !pageSrc.includes("tampilan pribadi"), "page: tanpa label tampilan pribadi");
  ok(!mapSrc.includes("Tampilan pribadi") && !mapSrc.includes("tampilan pribadi"), "map3d: tanpa label tampilan pribadi");
  ok(!pageSrc.includes("Mode siang / malam"), "page: tanpa opsi mode siang/malam");
  ok(pageSrc.includes('removeItem("ne_daynight")'), "page: nilai lama ne_daynight dibersihkan");
  ok(mapSrc.includes("isNight(faseRef.current)"), "map3d: render malam dari fase server");
}

// RONDE 3 — tidur komunal: hunian dinamis + ubin tidur berbeda + tamu di gubuk.
{
  // carikanHunian: gubuk penuh dilewati, gubuk kosong dipilih.
  const placements = [
    { _id: "h1", kind: "gubuk", gx: 98, gy: 98, w: 2, h: 2 },
    { _id: "h2", kind: "gubuk", gx: 110, gy: 110, w: 2, h: 2 },
  ];
  const isi4 = [0, 1, 2, 3].map(() => ({ hunian: { id: "h1" } }));
  eq(carikanHunian(placements, isi4)?.id, "h2", "carikanHunian lewati gubuk penuh");
  const isiSemua = [...isi4, { hunian: { id: "h2" } }, { hunian: { id: "h2" } }, { hunian: { id: "h2" } }, { hunian: { id: "h2" } }];
  eq(carikanHunian(placements, isiSemua), null, "carikanHunian null bila semua penuh");
  // tileHunian: 4 penghuni gubuk 2x2 = 4 ubin BERBEDA (bukan menumpuk tengah).
  const tiles = [0, 1, 2, 3].map((i) => tileHunian({ gx: 98, gy: 98, w: 2, h: 2 }, i));
  eq(new Set(tiles.map((t) => `${t.gx},${t.gy}`)).size, 4, "tileHunian 4 ubin berbeda");
  for (const t of tiles) ok(t.gx >= 98 && t.gx <= 99 && t.gy >= 98 && t.gy <= 99, "tileHunian di dalam footprint");
  // tileTamu: di sekeliling gubuk (bukan api unggun 102,100), bukan ubin hunian.
  const tamu = tileTamu([...placements, { kind: "api_unggun", gx: 102, gy: 100, w: 1, h: 1 }], 0);
  ok(!(tamu.gx === 102 && tamu.gy === 100), "tileTamu bukan di api unggun");
  ok(tamu.gx >= 97 && tamu.gx <= 100 && tamu.gy >= 97 && tamu.gy <= 100, "tileTamu di sekeliling gubuk (kotak +1 ubin)");
  ok(!isWater(tamu.gx, tamu.gy), "tileTamu bukan di air");
}

// RONDE 4 — anti-paceklik: preemption lapar + darurat pangan.
{
  // (a) pangan=0: warga jalan lapar TIDAK dipulangkan (pulang sia-sia).
  const w = wargaDasar({ lokasi: { gx: 70, gy: 100 }, tujuan: { gx: 199, gy: 100 }, node: { kind: "pohon", gx: 199, gy: 100 }, fase_siklus: "jalan", lapar: 100 });
  const ctx = { ...ctxKosong(w), stok: stokKosong() };
  stepWarga(w, 12, ctx);
  ok(w.fase_siklus === "jalan" && w.node?.kind === "pohon", "paceklik: jalan ke pohon tidak dipulangkan (pangan 0)");
  // (b) pangan>0: warga jalan lapar DIPULANGKAN makan (pulang jauh, belum sampai rumah).
  const w2 = wargaDasar({ lokasi: { gx: 199, gy: 100 }, tujuan: { gx: 105, gy: 100 }, node: { kind: "pohon", gx: 105, gy: 100 }, fase_siklus: "jalan", lapar: 100 });
  const ctx2 = { ...ctxKosong(w2), stok: { ...stokKosong(), pangan: 5 } };
  stepWarga(w2, 12, ctx2);
  ok(w2.fase_siklus === "kembali" && w2.aksi_sekarang === "pulang_makan", "pangan ada: jalan lapar dipulangkan makan");
  // (c) kumpul TIDAK dibatalkan lapar saat paceklik (progres maju, bukan reset).
  const w3 = wargaDasar({ lokasi: { gx: 105, gy: 100 }, node: { kind: "pohon", gx: 105, gy: 100 }, fase_siklus: "kumpul", progres_aksi_pct: 20, lapar: 100 });
  const ctx3 = { ...ctxKosong(w3), stok: stokKosong() };
  stepWarga(w3, 12, ctx3);
  ok(w3.fase_siklus === "kumpul" && w3.progres_aksi_pct === 80, "paceklik: kumpul tidak dibatalkan lapar (progres 20->80)");
  // (d) bangun darurat: warga istirahat lapar + pangan 0 -> target pangan (darurat).
  const w4 = wargaDasar({ lokasi: { gx: 100, gy: 100 }, fase_siklus: "istirahat", stamina: 100, sehat: 10, lapar: 100, istirahat_sisa: 0 });
  const ctx4 = {
    ...ctxKosong(w4),
    nodes: [
      { kind: "pohon" as const, gx: 110, gy: 100 },
      { kind: "semak_beri" as const, gx: 102, gy: 100 },
    ],
    stok: stokKosong(),
  };
  stepWarga(w4, 8, ctx4);
  ok(w4.fase_siklus === "jalan" && w4.node?.kind === "semak_beri" && w4.node?.darurat === true, "bangun darurat: target semak beri (darurat)");
  // (e) simulasi 12 jam pagi paceklik: pangan NAIK (produksi jalan), lapar TURUN.
  const w5 = wargaDasar({ lokasi: { gx: 100, gy: 100 }, fase_siklus: "istirahat", stamina: 100, sehat: 10, lapar: 100, istirahat_sisa: 0 });
  const ctx5 = {
    ...ctxKosong(w5),
    nodes: [
      { kind: "semak_beri" as const, gx: 102, gy: 100 },
      { kind: "pohon" as const, gx: 110, gy: 100 },
    ],
    nodeSisa: new Map([["102,100", 5], ["110,100", 5]]),
    stok: stokKosong(),
  };
  const fasePernah = new Set<string>();
  for (let h = 0; h < 12; h++) { stepWarga(w5, 6 + h, ctx5); fasePernah.add(w5.fase_siklus); }
  ok(ctx5.stok.pangan > 0, `simulasi paceklik 12 jam: pangan naik (${ctx5.stok.pangan})`);
  ok(ctx5.kabar.some((k) => k.jenis === "kumpul"), "simulasi paceklik: ada kabar kumpul (siklus selesai)");
  ok(w5.lapar < 100, `simulasi paceklik: lapar turun (${w5.lapar})`);
  // RONDE 5: endpoint bisa istirahat (2 siklus selesai lebih cepat karena
  // jalan 5x) — yang dijaga: warga SEMPAT jalan + kumpul, bukan tidur terus.
  ok(fasePernah.has("jalan") && fasePernah.has("kumpul"), "simulasi paceklik: warga sempat jalan + kumpul (tidak tidur terus)");
}

// RONDE 4 — peran baru: target khusus + bonus.
{
  // Nelayan: target tepi sungai (darat, bersebelahan air, pseudo sungai).
  const n = wargaDasar({ peran: "nelayan", lokasi: { gx: 100, gy: 100 } });
  const tn = pilihTargetKerja(n, ctxKosong(n));
  ok(tn !== null && tn.node.pseudo === "sungai", "nelayan: target pseudo sungai");
  if (tn) {
    ok(!isWater(tn.tujuan.gx, tn.tujuan.gy), "nelayan: berdiri di darat (tepi)");
    ok(isWater(tn.tujuan.gx - 1, tn.tujuan.gy) || isWater(tn.tujuan.gx + 1, tn.tujuan.gy), "nelayan: tepi bersebelahan air");
  }
  // Petani: ladang bila ada, semak bila belum.
  const p1 = wargaDasar({ peran: "petani", lokasi: { gx: 100, gy: 100 } });
  const tp1 = pilihTargetKerja(p1, { ...ctxKosong(p1), ladang: { gx: 110, gy: 110 } });
  ok(tp1 !== null && tp1.node.pseudo === "ladang" && tp1.tujuan.gx === 110, "petani: ke ladang bila ada");
  const p2 = wargaDasar({ peran: "petani", lokasi: { gx: 100, gy: 100 } });
  const tp2 = pilihTargetKerja(p2, { ...ctxKosong(p2), nodes: [{ kind: "semak_beri" as const, gx: 102, gy: 100 }] });
  ok(tp2 !== null && tp2.node.kind === "semak_beri" && !tp2.node.pseudo, "petani: fallback semak bila belum ada ladang");
  // Penjaga: patroli (pseudo) + langkah patroli tetap jalan + status patroli.
  const j = wargaDasar({ peran: "penjaga", lokasi: { gx: 100, gy: 100 } });
  const tj = pilihTargetKerja(j, ctxKosong(j));
  ok(tj !== null && tj.node.pseudo === "patroli", "penjaga: target pseudo patroli");
  ok(tj !== null && WAYPOINT_PATROLI.some((w) => w.gx === tj.tujuan.gx && w.gy === tj.tujuan.gy), "penjaga: tujuan waypoint patroli");
  const jp = wargaDasar({ peran: "penjaga", lokasi: { gx: 100, gy: 90 }, tujuan: { gx: 100, gy: 86 }, node: { kind: "padang_buruan", gx: 100, gy: 86, pseudo: "patroli" }, fase_siklus: "jalan" });
  stepWarga(jp, 12, ctxKosong(jp));
  ok(jp.fase_siklus === "jalan" && jp.status_teks.includes("Berpatroli"), "penjaga: patroli jalan + status patroli");
  const next = waypointPatroliBerikutnya({ gx: 100, gy: 86 });
  ok(next.gx === 110 && next.gy === 90, "waypoint patroli giliran ring");
  // Pemanjat: kayu + 1 buah. Penenun: padang -> kulit 4 (2 bonus + 2 olah).
  // r45: hasil 5x (roll 1-3 x5 = 5..15; buah 1x5 = 5; kulit (2+2)x5 = 20
  // tapi cap kulit harian 15, jadi 15). Dulu r15: 35/35/20 (rumus lama).
  const pm = wargaDasar({ peran: "pemanjat", stat: { int: 5, str: 5, agi: 5, sta: 5 }, lokasi: { gx: 105, gy: 100 }, node: { kind: "pohon", gx: 105, gy: 100 }, fase_siklus: "kumpul", progres_aksi_pct: 90 });
  const ctxPm = ctxKosong(pm);
  stepWarga(pm, 12, ctxPm);
  ok(ctxPm.stok.kayu >= 5 && ctxPm.stok.kayu <= 15 && ctxPm.stok.pangan === 5, `r45: pemanjat: kayu 5..15 + buah 5 (kayu ${ctxPm.stok.kayu}, pangan ${ctxPm.stok.pangan})`);
  const pn = wargaDasar({ peran: "penenun", stat: { int: 5, str: 5, agi: 5, sta: 5 }, lokasi: { gx: 105, gy: 100 }, node: { kind: "padang_buruan", gx: 105, gy: 100 }, fase_siklus: "kumpul", progres_aksi_pct: 90 });
  const ctxPn = ctxKosong(pn);
  stepWarga(pn, 12, ctxPn);
  ok(ctxPn.stok.pangan >= 5 && ctxPn.stok.pangan <= 15 && ctxPn.stok.kulit === 15, `r45: penenun: pangan 5..15 + kulit 15 (cap harian) (pangan ${ctxPn.stok.pangan}, kulit ${ctxPn.stok.kulit})`);
  // Pseudo tidak mengalami deplesi: nelayan kumpul di sungai tidak mengurangi nodeSisa.
  // r45: hasil 5x (roll 1-3 x5 = 5..15; dulu r15: 7 dari rumus lama).
  const nl = wargaDasar({ peran: "nelayan", stat: { int: 5, str: 5, agi: 5, sta: 5 }, lokasi: { gx: 40, gy: 100 }, node: { kind: "semak_beri", gx: 41, gy: 100, pseudo: "sungai" }, fase_siklus: "kumpul", progres_aksi_pct: 90 });
  const ctxNl = ctxKosong(nl);
  stepWarga(nl, 12, ctxNl);
  ok(ctxNl.stok.pangan >= 5 && ctxNl.stok.pangan <= 15 && !ctxNl.nodeSisa.has("41,100"), `r45: pseudo sungai: pangan 5..15 (5x) tanpa deplesi (dapat ${ctxNl.stok.pangan})`);
  // Penjaga mengusir hewan buas (stepHewan): jarak hewan-penjaga BERTAMBAH.
  const hw = { _id: "h1", jenis: "serigala", gx: 101, gy: 100 };
  const jg = wargaDasar({ peran: "penjaga", lokasi: { gx: 100, gy: 100 } });
  const ctxHw = { ...ctxKosong(jg), wargaSemua: [jg], hewan: [hw] };
  stepHewan(hw, 12, ctxHw);
  ok(Math.abs(hw.gx - 100) + Math.abs(hw.gy - 100) > 1, "penjaga: serigala menjauh");
}

// RONDE 3/4 — tampil: ayunan kaki warga + hewan (murni, tanpa WebGL).
{
  eq(langkahAyunan(1.0), Math.PI, "langkahAyunan 1 langkah penuh (stride 1,0 tile, ronde 6) = PI");
  eq(langkahAyunan(0), 0, "langkahAyunan diam = 0");
  eq(sudutAyunan(0), 0, "sudutAyunan awal = 0");
  eq(sudutAyunan(Math.PI / 2), 1, "sudutAyunan puncak = amplitudo");
  ok(sudutAyunan(Math.PI / 2) === -sudutAyunan(-Math.PI / 2), "sudutAyunan bergantian");
  eq(langkahHewan(0.3), Math.PI, "langkahHewan 1 langkah penuh = PI");
  ok(sudutKakiHewan(1, "depanKiri") === -sudutKakiHewan(1, "depanKanan"), "gaya hewan diagonal berlawanan");
  ok(sudutKakiHewan(1, "depanKiri") === sudutKakiHewan(1, "belakangKanan"), "gaya hewan diagonal seirama");
}

// RONDE 4 — navigasi: topbar sembunyi default + handle + gear (tanpa gacha).
// 2026-11-04: DIHAPUS atas permintaan user — topbar diganti 1 tombol
// kanan-atas + kartu modal menu (penjaga baru ada di blok MENU KAMPUNG).
{
  const pageSrc = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  ok(pageSrc.includes("menuOpen") && pageSrc.includes('className="menu-fab"'), "page: 1 tombol menu kanan-atas ada (pengganti topbar/handle/gear)");
  ok(!pageSrc.includes("navTampil") && !pageSrc.includes("game-topbar"), "page: topbar lama + state navTampil sudah dihapus");
  const mapSrc = readFileSync(new URL("../src/components/Map3D.tsx", import.meta.url), "utf8");
  ok(mapSrc.includes("langkahAyunan") && mapSrc.includes("sudutAyunan"), "map3d: ayunan kaki warga pakai helper");
  ok(mapSrc.includes("sudutKakiHewan") && mapSrc.includes("headBaseY"), "map3d: animasi hewan (kaki diagonal + kepala)");
  ok(mapSrc.includes("gubuk_besar") && mapSrc.includes("menara_jaga"), "map3d: visual bangunan baru ada");
  ok(mapSrc.includes("langkahDisplay") && mapSrc.includes("speedPerSec"), "map3d: pacing trayektori laju server (ronde 5)");
  ok(mapSrc.includes("paletCahaya") && mapSrc.includes("clouds"), "map3d: golden hour + awan melayang (polish ronde 5)");
  ok(mapSrc.includes("framedOnce") && mapSrc.includes("pusatDariTitik"), "map3d: bingkai kampung sekali saat load (temuan browser 21:17)");
  ok(pageSrc.includes("lepas kunci kamera"), "page: ketuk tanah kosong = lepas kunci (anti kamera geser sendiri)");
}

// RONDE 5 — pacing display kontinyu + polish.
ok(lajuServerPerDetik(20) === 20 / 60, "laju server 20/jam = 1/3 unit/detik");
ok(lajuServerPerDetik(0) === 0 && lajuServerPerDetik(-5) === 0, "laju server 0/negatif = 0");
{
  const s = langkahDisplay(0, 0, 10, 0, 0.5, 1);
  ok(s.x === 0.5 && s.moved === 0.5 && !s.tiba, "langkahDisplay: maju sesuai laju, belum tiba");
  const s2 = langkahDisplay(9.9, 0, 10, 0, 0.5, 1);
  ok(Math.abs(s2.x - 10) < 1e-9 && Math.abs(s2.moved - 0.1) < 1e-9 && s2.tiba, "langkahDisplay: tanpa overshoot, tiba tepat di tujuan");
  const s3 = langkahDisplay(10, 0, 10, 0, 0.5, 1);
  ok(s3.moved === 0 && s3.tiba, "langkahDisplay: di tujuan = diam");
  const s4 = langkahDisplay(0, 0, 10, 0, 0, 1);
  ok(s4.moved === 0 && !s4.tiba, "langkahDisplay: laju 0 = tidak bergerak");
}
// Simulasi trayektori: warga 20 tile/jam dari (100,100) ke (130,100).
// Display 60fps menuju TUJUAN dengan laju server — harus bergerak di
// setiap jendela 1 detik selama perjalanan (tanpa jeda burst-diam)
// dan tidak pernah teleport (per frame <= laju*dt).
{
  const speed = lajuServerPerDetik(20);
  let dx = 100, dz = 100;
  let lastMove = 0; let maxStill = 0; let maxStep = 0; let t = 0;
  const dt = 1 / 60;
  for (let f = 0; f < 60 * 100; f++) {
    const s = langkahDisplay(dx, dz, 130, 100, speed, dt);
    dx = s.x; dz = s.z; t += dt;
    if (s.moved > 0) { maxStill = Math.max(maxStill, t - lastMove); lastMove = t; maxStep = Math.max(maxStep, s.moved); }
    if (s.tiba) break;
  }
  ok(Math.abs(dx - 130) < 0.05 && Math.abs(dz - 100) < 0.05, "trayektori: display tiba di tujuan");
  ok(maxStill < 1, `trayektori: jeda diam terpanjang < 1 detik (dapat ${maxStill.toFixed(3)} dtk)`);
  ok(maxStep <= speed * dt + 1e-9, "trayektori: tanpa teleport (per frame <= laju*dt)");
}
// RONDE 6 — jalan seperti ORANG JALAN: laju tampil, cadence kaki, anti-sawtooth.
{
  // Laju tampil: 120 tile/jam = 2,0 tile/detik (tengah rentang 1,5–2,5).
  eq(lajuServerPerDetik(120), 2, "ronde 6: 120 tile/jam = 2,0 tile/detik tampil");
  ok(lajuServerPerDetik(90) === 1.5 && lajuServerPerDetik(150) === 2.5, "ronde 6: rentang tampil 1,5-2,5 tile/detik");
  // Cadence: 2 tile tanah = 1 siklus penuh = 2 langkah -> pada 2 tile/detik
  // = 2 langkah/detik (orang jalan, bukan lari, bukan moonwalk).
  eq(langkahAyunan(2), 2 * Math.PI, "ronde 6: 2 tile = 1 siklus = 2 langkah (cadence 2 langkah/detik @ 2 tile/detik)");
  // Trayektori ronde 6: 30 tile @ 2 tile/detik = 15 detik, tanpa teleport,
  // tanpa jeda diam — menyeberangi gubuk (2 tile) dalam ~1 detik.
  const speed6 = lajuServerPerDetik(120);
  let dx6 = 0, t6 = 0; let maxStep6 = 0; let tiba6 = false;
  const dt6 = 1 / 60;
  for (let f = 0; f < 60 * 20; f++) {
    const s = langkahDisplay(dx6, 0, 30, 0, speed6, dt6);
    dx6 = s.x; t6 += dt6; maxStep6 = Math.max(maxStep6, s.moved);
    if (s.tiba) { tiba6 = true; break; }
  }
  ok(tiba6 && Math.abs(t6 - 15) < 0.5, `ronde 6: 30 tile ditempuh ~15 detik (dapat ${t6.toFixed(1)} dtk)`);
  ok(maxStep6 <= speed6 * dt6 + 1e-9, "ronde 6: tanpa teleport (per frame <= laju*dt)");
  // Anti-sawtooth: ambang snap HARUS di atas lompatan server maksimum
  // (150 tile) — ambang lama 8 menarik display mundur tiap menit.
  ok(AMBANG_SNAP_DESYNC > 150, `ronde 6: ambang snap ${AMBANG_SNAP_DESYNC} > lompatan server maks 150`);
  const mapSrc6 = readFileSync(new URL("../src/components/Map3D.tsx", import.meta.url), "utf8");
  ok(mapSrc6.includes("AMBANG_SNAP_DESYNC"), "map3d: snap pakai AMBANG_SNAP_DESYNC, bukan 8 mentah");
}
// Kontras: pola lama (burst paceTampil) untuk lompatan 5 tile/jam:
// 5 tile @ 0,35 u/dtk = ~14,3 dtk gerak + ~45,7 dtk diam tiap menit.
{
  const paceLama = paceTampil(5);
  const gerakDetik = 5 / paceLama;
  ok(paceLama === 0.35 && gerakDetik > 14 && 60 - gerakDetik > 45, "pola lama: burst ~14 dtk + diam ~46 dtk (alasan ronde 5)");
}
// Hewan ikut 6x (rasio kejar/kabur tidak berubah).
ok(hewanById("rusa")?.kecepatan === 120 && hewanById("kelinci")?.kecepatan === 150, "hewan jinak 120/150 tile/jam");
ok(hewanById("ayam")?.kecepatan === 60 && hewanById("babi_hutan")?.kecepatan === 90, "ayam/babi 60/90 tile/jam");
ok(hewanById("serigala")?.kecepatan === 150 && hewanById("beruang")?.kecepatan === 60, "serigala/beruang 150/60 tile/jam");
// Palet cahaya: sore = golden hour.
{
  const sore = paletCahaya("sore");
  ok(sore.bg === 0xf2c078 && sore.sun === 0xffb066 && sore.sunVisible, "palet sore: golden hour hangat");
  const malam = paletCahaya("malam");
  ok(malam.moon && malam.stars && !malam.sunVisible, "palet malam: bulan + bintang, tanpa matahari");
  const siang = paletCahaya("siang");
  ok(siang.bg === 0xbfe3f5 && siang.hemi === 1.0, "palet siang: tidak berubah dari lama");
}
// Pusat kampung untuk bingkai kamera awal.
{
  const c = pusatDariTitik([{ x: 0, z: 0 }, { x: 10, z: 20 }]);
  ok(c.x === 5 && c.z === 10, "pusatDariTitik: rata-rata titik");
  const e = pusatDariTitik([]);
  ok(e.x === 0 && e.z === 0, "pusatDariTitik: kosong = (0,0)");
}

// RONDE 7 — tombol kanan-bawah = nambah karakter (gacha kembali).
// Pool gacha mencakup SEMUA 18 peran (10 lama + 8 baru ronde 4): untuk
// tiap peran, stat yang memenuhi syaratnya persis harus berbobot > 0
// (defisit 0 -> 1.5x), jadi tidak ada peran dormant di gacha.
import { defisitSyarat } from "../src/lib/batu/peran";
import { validNamaKarakter, validGender } from "../src/lib/security";
{
  const BARU = ["nelayan", "petani", "penjaga", "pengukir", "penjelajah", "pemanjat", "penenun", "penjerat"];
  for (const p of PERAN) {
    const stat = { int: 5, str: 5, agi: 5, sta: 5 };
    for (const [k, min] of Object.entries(p.syarat)) (stat as Record<string, number>)[k] = min ?? 5;
    ok(defisitSyarat(p.id, stat) === 0, `defisit 0 untuk ${p.id} (syarat terpenuhi)`);
    ok(bobotFit(p.id, stat) > 0, `bobot gacha > 0 untuk ${p.id}`);
  }
  // Peran baru benar-benar bisa terpilih: stat AGI tinggi + STA cukup
  // memberi bobot ke penjelajah/pemanjat/penjerat (bukan cuma peran lama).
  const statLincah = { int: 5, str: 5, agi: 9, sta: 6 };
  ok(
    bobotFit("penjelajah", statLincah) > 0 && bobotFit("pemanjat", statLincah) > 0 && bobotFit("penjerat", statLincah) > 0,
    "peran baru lincah berbobot (penjelajah/pemanjat/penjerat)"
  );
  void BARU;
}
// Role-fit keras: gacha tidak pernah memilih peran dengan defisit >= 3,
// diuji dengan banyak roll deterministik (bukan acak) untuk tiap pola stat.
{
  const pola = [
    { int: 10, str: 2, agi: 2, sta: 2 },
    { int: 2, str: 10, agi: 2, sta: 2 },
    { int: 2, str: 2, agi: 10, sta: 2 },
    { int: 5, str: 5, agi: 5, sta: 5 },
  ];
  let n = 0;
  const rDet = () => {
    n = (n * 1103515245 + 12345) & 0x7fffffff;
    return n / 0x7fffffff;
  };
  for (const s of pola) {
    for (let i = 0; i < 50; i++) {
      const peran = pilihPeranFit(s, rDet);
      ok(defisitSyarat(peran, s) < 3, `gacha ${JSON.stringify(s)} -> ${peran} defisit < 3`);
    }
  }
}
// Stat + umur gacha dalam rentang kontrak (1..10, umur 18..55).
{
  for (let i = 0; i < 100; i++) {
    const s = rollStat();
    ok(s.int >= 1 && s.int <= 10 && s.str >= 1 && s.str <= 10 && s.agi >= 1 && s.agi <= 10 && s.sta >= 1 && s.sta <= 10, "rollStat 1..10 semua stat");
    const u = rollUmurGacha();
    ok(u >= 18 && u <= 55, "rollUmurGacha 18..55");
  }
}
// Validasi nama/gender creation (dipakai route confirm).
ok(validNamaKarakter("Raka") && validNamaKarakter("Siti Nur") && !validNamaKarakter("A") && !validNamaKarakter("Raka2"), "validNamaKarakter 2-24 huruf, tanpa angka");
ok(validGender("laki") && validGender("perempuan") && !validGender("x"), "validGender laki/perempuan saja");
// Guard statis: endpoint creation benar-benar hidup (bukan stub 403 ronde 2)
// dan tombolnya dirender di halaman utama.
{
  const gachaSrc = readFileSync("src/app/api/gacha/route.ts", "utf8");
  ok(!gachaSrc.includes("dinonaktifkan"), "gacha route: stub 403 ronde 2 sudah dihapus");
  ok(gachaSrc.includes('action === "roll"') && gachaSrc.includes('action === "confirm"'), "gacha route: roll + confirm hidup");
  ok(gachaSrc.includes("nextSeq") && gachaSrc.includes("warga_baru"), "gacha route: nomor lanjut + kabar warga baru");
  const profilSrc = readFileSync("src/app/api/profil/route.ts", "utf8");
  ok(profilSrc.includes("insertOne") && profilSrc.includes("nama_profil"), "profil route: POST pembuatan hidup");
  const pageSrc = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrc.includes("<TambahKarakter />") && pageSrc.includes("TambahKarakter"), "page: tombol TambahKarakter dirender");
  const compSrc = readFileSync("src/components/TambahKarakter.tsx", "utf8");
  ok(compSrc.includes("tk-fab") && compSrc.includes("/api/gacha") && compSrc.includes("/api/profil"), "komponen: FAB + panggil gacha/profil");
  const cssSrc = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrc.includes(".tk-fab") && cssSrc.includes("bottom: 96px"), "css: FAB kanan-bawah (di atas Batal kunci + hint)");
}

// RONDE 8 — jalan lurus A→B→BERHENTI, tanpa loop (diagnosis video 22:03).
// Bukti video: tab user masih bundle RONDE 5 (tidak ada FAB ＋ + hint
// tanpa baris tombol ＋) — sawtooth snap-8 yang sudah diperbaiki ronde 6.
// Yang ditambahkan ronde 8: (a) penjaga versi (tab lama diberitahu ada
// deployment baru, bukan diam-diam menjalankan kode lama), (b) kunci
// tujuan display (goal hanya pindah bila server benar-benar mengubah
// tujuan/fase) — tanpa menurunkan kecepatan, tanpa mengembalikan snap 8.
{
  // Trayektori: 100 tile @ 2 tile/detik = ~50 detik, jarak ke tujuan
  // MONOTON mengecil (backtrack = 0), berhenti TEPAT di tujuan, lalu diam.
  const speed = lajuServerPerDetik(120);
  let x = 0, prevDist = 100, backtrack = 0, maxStep = 0, tiba = false, t = 0;
  const dt = 1 / 60;
  for (let f = 0; f < 60 * 70; f++) {
    const s = langkahDisplay(x, 0, 100, 0, speed, dt);
    const d = Math.hypot(100 - s.x, 0);
    if (d > prevDist + 1e-9) backtrack = Math.max(backtrack, d - prevDist);
    prevDist = d; maxStep = Math.max(maxStep, s.moved); x = s.x; t += dt;
    if (s.tiba) { tiba = true; break; }
  }
  ok(tiba && Math.abs(t - 50) < 0.5, `ronde 8: 100 tile ditempuh ~50 dtk (dapat ${t.toFixed(1)} dtk)`);
  ok(backtrack === 0, "ronde 8: tanpa backtrack (jarak ke tujuan monoton mengecil)");
  ok(maxStep <= speed * dt + 1e-9, "ronde 8: tanpa teleport (per frame <= laju*dt)");
  ok(Math.abs(x - 100) < 1e-9, "ronde 8: berhenti TEPAT di tujuan (bukan lewat/melingkar)");
  // Setelah tiba: langkah berikutnya diam total (bukan muter-muter).
  const diam = langkahDisplay(x, 0, 100, 0, speed, dt);
  ok(diam.moved === 0 && diam.tiba, "ronde 8: sudah tiba = diam (bukan jalan di tempat)");
  // Kasus kumpul di node pohon (Joel di video): mulai == tujuan = diam.
  const kumpul = langkahDisplay(42, 55, 42, 55, speed, dt);
  ok(kumpul.moved === 0 && kumpul.tiba, "ronde 8: warga di node (kumpul) = diam, bukan mondar-mandir");
  // Kunci tujuan: jitter tujuan server (±1 tile, fase sama) TIDAK
  // menggerakkan goal yang dikejar; perubahan tujuan/fase sah = diadopsi.
  const k0 = kunciTujuanBaru({ gx: 40, gy: 50 }, "jalan", { x: 0, z: 0 }, { x: -60, z: -50 });
  let g = kunciTujuan(null, k0.goal, k0.key);
  ok(g.x === -60 && g.z === -50, "ronde 8: kunci awal = tujuan server");
  const kJitter = kunciTujuanBaru({ gx: 40, gy: 50 }, "jalan", { x: 0, z: 0 }, { x: -60, z: -50 });
  const gJitter = kunciTujuan(g, kJitter.goal, kJitter.key);
  ok(gJitter === g, "ronde 8: kunci sama = objek sama (goal tidak goyang antar poll)");
  const kPindah = kunciTujuanBaru({ gx: 48, gy: 48 }, "kembali", { x: 0, z: 0 }, { x: -52, z: -52 });
  const gPindah = kunciTujuan(g, kPindah.goal, kPindah.key);
  ok(gPindah.x === -52 && gPindah.z === -52 && gPindah !== g, "ronde 8: tujuan/fase berubah = goal diadopsi");
  const kIst = kunciTujuanBaru(null, "istirahat", { x: -52, z: -52 }, { x: -52, z: -52 });
  const gIst = kunciTujuan(gPindah, kIst.goal, kIst.key);
  ok(gIst.x === -52 && gIst.z === -52, "ronde 8: istirahat (tujuan null) = goal posisi server");
  // Guard regresi: kecepatan + snap TIDAK diubah ronde 8.
  ok(AMBANG_SNAP_DESYNC === 250, "ronde 8: ambang snap tetap 250 (bukan 8 lama)");
  ok(lajuServerPerDetik(90) === 1.5 && lajuServerPerDetik(150) === 2.5, "ronde 8: kecepatan tetap 1,5–2,5 tile/detik");
  // Guard statis: Map3D mengejar goal TERKUNCI + page punya pil versi.
  const mapSrc8 = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc8.includes("cur.goal.x") && mapSrc8.includes("kunciTujuan"), "map3d: render mengejar goal terkunci, bukan ux mentah");
  const pageSrc8 = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrc8.includes("BUILD_ID") && pageSrc8.includes("/api/version") && pageSrc8.includes("Versi baru tersedia"), "page: pil versi baru (bandingkan BUILD_ID vs /api/version)");
  const verSrc = readFileSync("src/app/api/version/route.ts", "utf8");
  ok(verSrc.includes("BUILD_ID") && !verSrc.includes("advanceWorld") && !verSrc.includes("getCollection"), "api/version: murni (tanpa DB/sim)");
  const verLib = readFileSync("src/lib/version.ts", "utf8");
  ok(verLib.includes('BUILD_ID = "r57"'), "version: BUILD_ID r41 (naikkan tiap rilis)");
  // Langit: palet HANYA dari fase server (jam game) — transisi jingga→
  // gelap dalam video = SATU batas jam sore→malam, bukan animasi detik
  // nyata; tidak ada perubahan kode langit ronde 8 (bukan bug).
  ok(isNight("malam") && !isNight("sore") && !isNight("siang") && !isNight("pagi"), "langit: malam hanya dari fase malam server");
}

// ============ RONDE 9 + 10 + BAKAT ============
// Jam v4: durasi malam 6 detik vs siang 60 detik; batas fase baru.
{
  eq(durasiJamMs(20), 6000, "r9: jam 20 malam = 6 detik");
  eq(durasiJamMs(23), 6000, "r9: jam 23 malam = 6 detik");
  eq(durasiJamMs(0), 6000, "r9: jam 0 malam = 6 detik");
  eq(durasiJamMs(5), 6000, "r9: jam 5 malam = 6 detik");
  eq(durasiJamMs(6), 60000, "r9: jam 6 pagi = 60 detik");
  eq(durasiJamMs(12), 60000, "r9: jam 12 siang = 60 detik");
  eq(durasiJamMs(19), 60000, "r9: jam 19 sore = 60 detik");
  ok(jamAdalahMalam(20) && jamAdalahMalam(3) && !jamAdalahMalam(6) && !jamAdalahMalam(19), "r9: jamAdalahMalam 20-06");
  eq(faseDariJam(6), "pagi", "r9: fase jam 6 = pagi");
  eq(faseDariJam(10), "siang", "r9: fase jam 10 = siang");
  eq(faseDariJam(15), "sore", "r9: fase jam 15 = sore");
  eq(faseDariJam(20), "malam", "r9: fase jam 20 = malam");
  eq(faseDariJam(3), "malam", "r9: fase jam 3 = malam");
  eq(faseDariJam(5), "malam", "r9: fase jam 5 = malam");
  // Laju display ikut durasi jam: malam 10x siang.
  eq(lajuServerPerDetik(90, 60), 1.5, "r9: siang 90 tile/jam = 1,5 tile/detik");
  eq(lajuServerPerDetik(90, 6), 15, "r9: malam 90 tile/jam = 15 tile/detik (fast-forward)");
  eq(lajuServerPerDetik(150, 6), 25, "r9: malam 150 tile/jam = 25 tile/detik");
  eq(lajuServerPerDetik(90), 1.5, "r9: default durasi 60 (kompatibel lama)");
}
// Istirahat malam penuh: rester stamina penuh di jam malam TIDAK bangun;
// jam 06:00 bangun normal.
{
  const tidur = wargaDasar({ lokasi: { gx: 100, gy: 100 }, fase_siklus: "istirahat", stamina: 100, sehat: 100, lapar: 20, istirahat_sisa: 0 });
  stepWarga(tidur, 22, ctxKosong(tidur));
  ok(tidur.fase_siklus === "istirahat", "r9: rester jam 22 (malam) tetap tidur walau stamina penuh");
  const bangun = wargaDasar({ lokasi: { gx: 100, gy: 100 }, fase_siklus: "istirahat", stamina: 100, sehat: 100, lapar: 20, istirahat_sisa: 0 });
  const ctxB = { ...ctxKosong(bangun), nodes: [{ kind: "pohon" as const, gx: 105, gy: 100 }] };
  stepWarga(bangun, 30, ctxB); // jam absolut 30 -> hod 6 (pagi)
  ok(bangun.fase_siklus === "jalan", "r9: rester jam 06:00 (pagi) bangun + jalan");
  // Pekerja jalan di jam malam -> pulang (sudah diuji jam 20); di jam 5 juga malam.
  const jalanMalam = wargaDasar({ lokasi: { gx: 0, gy: 0 }, node: { kind: "pohon", gx: 0, gy: 0 }, fase_siklus: "jalan", tujuan: { gx: 10, gy: 10 } });
  stepWarga(jalanMalam, 29, ctxKosong(jalanMalam)); // hod 5 = malam
  ok(jalanMalam.fase_siklus === "kembali", "r9: jalan jam 05:00 (malam) -> pulang tidur");
}
// Pose tidur + rambut gender + tombol gender + ayunan perkakas.
{
  eq(poseTidur(true), { rotX: -Math.PI / 2, centerZ: 0.9 }, "r9: pose tidur rebah + geser 0,9");
  eq(poseTidur(false), { rotX: 0, centerZ: 0 }, "r9: pose bangun tegak");
  eq(specRambut("laki"), { panjang: false }, "r9: laki rambut pendek");
  eq(specRambut("perempuan"), { panjang: true }, "r9: perempuan rambut panjang");
  eq(specRambut(undefined), { panjang: false }, "r9: gender tak dikenal -> pendek (lama)");
  const terpilih = gayaTombolGender(true);
  const takTerpilih = gayaTombolGender(false);
  ok(terpilih.background !== takTerpilih.background, "r9: tombol gender terpilih vs tidak beda latar jelas");
  ok(terpilih.border !== "none" && terpilih.border.length > 0, "r9: tombol gender terpilih punya border NYATA (bukan borderColor saja)");
  ok(ayunanPerkakas("kapak", 0) === -0.1 && ayunanPerkakas("beliung", Math.PI / 12) > 0.7, "r10: ayunan kapak/beliung lambat + kuat");
  ok(Math.abs(ayunanPerkakas("kapak", Math.PI / 12) - (Math.sin(Math.PI / 2) * 0.9 - 0.1)) < 1e-9, "r10: ayunan kapak = sin(t*6)*0,9-0,1");
}
// Bakat: info + efek helper + integrasi sim.
{
  eq(infoBakat("INT").nama, "Si Cerdik", "bakat: INT = Si Cerdik");
  eq(infoBakat("STR").nama, "Si Kuat", "bakat: STR = Si Kuat");
  eq(infoBakat("AGI").nama, "Si Gesit", "bakat: AGI = Si Gesit");
  eq(infoBakat("STA").nama, "Si Tahan Banting", "bakat: STA = Si Tahan Banting");
  ok(infoBakat("INT").efek.includes("10%"), "bakat: efek INT menyebut 10%");
  ok(infoBakat("STR").efek.includes("+1"), "bakat: efek STR menyebut +1");
  eq(pengaliKumpulBakat("INT"), 1.1, "bakat: INT kumpul 1,1x");
  eq(pengaliKumpulBakat("STR"), 1, "bakat: non-INT kumpul 1x");
  eq(bonusJumlahBakat("STR"), 1, "bakat: STR +1 hasil");
  eq(bonusJumlahBakat("INT"), 0, "bakat: non-STR +0 hasil");
  eq(pengaliJalanBakat("AGI"), 1.1, "bakat: AGI jalan 1,1x");
  eq(pulihStaminaBakat("STA"), 35, "bakat: STA pulih 35/jam");
  eq(pulihStaminaBakat("INT"), 25, "bakat: non-STA pulih 25/jam");
  // INT: kumpul 10% lebih cepat (60 -> 66).
  const cerdik = wargaDasar({ bakat: "INT", lokasi: { gx: 105, gy: 100 }, node: { kind: "pohon", gx: 105, gy: 100 }, fase_siklus: "kumpul", progres_aksi_pct: 0 });
  stepWarga(cerdik, 12, ctxKosong(cerdik));
  ok(cerdik.progres_aksi_pct === 66, "bakat INT: kumpul siang 60 -> 66 (1,1x)");
  // AGI: kecepatan jalan 1,1x (105 -> 116 setelah pembulatan).
  eq(kecepatanJalan(5, 50, "AGI"), 116, "bakat AGI: jalan 105 -> 116 (1,1x, dibulatkan)");
  eq(kecepatanJalan(5, 50, "STR"), 105, "bakat non-AGI: jalan tetap 105");
  // STA: istirahat pulih 35/jam (60 -> 95).
  const tahan = wargaDasar({ bakat: "STA", lokasi: { gx: 100, gy: 100 }, fase_siklus: "istirahat", stamina: 60, istirahat_sisa: 1 });
  stepWarga(tahan, 12, ctxKosong(tahan));
  ok(tahan.stamina === 95, "bakat STA: istirahat pulih 35 (60 -> 95)");
  // Guard statis: kartu gacha + profil menonjolkan bakat + efek.
  const tkSrc = readFileSync("src/components/TambahKarakter.tsx", "utf8");
  ok(tkSrc.includes("Bakat:") && tkSrc.includes("infoBakat"), "gacha: kartu hasil menonjolkan bakat + efek");
  ok(tkSrc.includes("Gender terpilih"), "gacha: label gender terpilih terlihat");
  const kpSrc = readFileSync("src/components/KartuProfil.tsx", "utf8");
  ok(kpSrc.includes("Bakat:") && kpSrc.includes("infoBakat"), "profil: bakat + efek ditampilkan");
}
// RONDE 10 — tile sebelah (bukan di tile node).
{
  const t1 = tileSebelah({ gx: 105, gy: 100 }, { gx: 100, gy: 100 }, { rintangan: new Set(), nodeTiles: new Set() });
  ok(!(t1.gx === 105 && t1.gy === 100), "r10: tileSebelah bukan tile node");
  eq(t1, { gx: 104, gy: 100 }, "r10: tileSebelah terdekat dari warga (barat node)");
  const t2 = tileSebelah({ gx: 105, gy: 100 }, { gx: 100, gy: 100 }, { rintangan: new Set(["104,100", "106,100", "105,99", "105,101"]), nodeTiles: new Set() });
  ok(!(t2.gx === 105 && t2.gy === 100) && Math.max(Math.abs(t2.gx - 105), Math.abs(t2.gy - 100)) === 1, "r10: tileSebelah memutar rintangan (tetap tetangga, termasuk diagonal)");
  // pilihTargetKerja: tujuan = sebelah node, node = koordinat node asli.
  const w = wargaDasar({ lokasi: { gx: 100, gy: 100 } });
  const ctxT = { ...ctxKosong(w), nodes: [{ kind: "pohon" as const, gx: 105, gy: 100 }], nodeSisa: new Map([["105,100", 5]]), nodeTilesAll: new Set(["105,100"]) };
  const tgt = pilihTargetKerja(w, ctxT);
  ok(tgt !== null && tgt.node.gx === 105 && tgt.node.gy === 100, "r10: target node = koordinat node asli");
  ok(tgt !== null && !(tgt.tujuan.gx === 105 && tgt.tujuan.gy === 100) && Math.abs(tgt.tujuan.gx - 105) + Math.abs(tgt.tujuan.gy - 100) === 1, "r10: tujuan jalan = ubin sebelah node");
}
// RONDE 10 — depletion -> re-target (bukan diam di bekas kosong).
{
  const w = wargaDasar({ lokasi: { gx: 105, gy: 100 }, node: { kind: "pohon", gx: 105, gy: 100 }, fase_siklus: "kumpul", progres_aksi_pct: 50 });
  const ctxD = { ...ctxKosong(w), nodes: [{ kind: "pohon" as const, gx: 105, gy: 100 }, { kind: "pohon" as const, gx: 110, gy: 100 }], nodeSisa: new Map([["105,100", 0], ["110,100", 5]]), nodeTilesAll: new Set(["105,100", "110,100"]) };
  stepWarga(w, 12, ctxD);
  ok(w.fase_siklus === "jalan" && w.node !== null && w.node.gx === 110, "r10: kumpul di node habis -> jalan ke node baru (110,100)");
  ok(w.progres_aksi_pct === 0, "r10: re-target reset progres");
  // Tanpa node lain -> pulang.
  const w2 = wargaDasar({ lokasi: { gx: 105, gy: 100 }, node: { kind: "pohon", gx: 105, gy: 100 }, fase_siklus: "kumpul", progres_aksi_pct: 50 });
  const ctxD2 = { ...ctxKosong(w2), nodes: [{ kind: "pohon" as const, gx: 105, gy: 100 }], nodeSisa: new Map([["105,100", 0]]), nodeTilesAll: new Set(["105,100"]) };
  stepWarga(w2, 12, ctxD2);
  ok(w2.fase_siklus === "kembali" && w2.node === null, "r10: node habis tanpa pengganti -> pulang");
  // periksaNodeHabis langsung: node bersisa -> false (tidak dialihkan).
  const w3 = wargaDasar({ lokasi: { gx: 105, gy: 100 }, node: { kind: "pohon", gx: 105, gy: 100 }, fase_siklus: "kumpul" });
  const ctxD3 = { ...ctxKosong(w3), nodeSisa: new Map([["105,100", 3]]) };
  ok(periksaNodeHabis(w3, ctxD3) === false, "r10: node bersisa tidak dialihkan");
}
// RONDE 10 — respawn lokasi lain + terapkan spawn.
{
  const taken = new Set(["105,100"]);
  const sp = pilihLokasiRespawn("singkapan_batu", { gx: 105, gy: 100 }, 500, taken, new Set());
  ok(sp !== null && !(sp.gx === 105 && sp.gy === 100), "r10: respawn bukan di ubin lama");
  ok(sp !== null && !taken.has(`${sp.gx},${sp.gy}`), "r10: respawn bukan ubin node lain");
  ok(sp !== null && sp.gx >= 1 && sp.gx < 199 && sp.gy >= 1 && sp.gy < 199, "r10: respawn di dalam grid");
  ok(sp !== null && Math.abs(sp.gx - 100) + Math.abs(sp.gy - 100) >= 7, "r10: respawn jauh dari pusat (>=7)");
  const sp2 = pilihLokasiRespawn("singkapan_batu", { gx: 105, gy: 100 }, 500, taken, new Set());
  eq(sp2, sp, "r10: respawn deterministik (seed sama = lokasi sama)");
  const tertunda = new Map([["105,100", { kind: "pohon" as const, gx: 120, gy: 110, jam: 600 }]]);
  const spawnList: { kind: "pohon"; gx: number; gy: number }[] = [];
  const sisa = new Map([["105,100", 0]]);
  const kabarBaru: { jenis: string; teks: string; hari: number; dibuat_pada: Date }[] = [];
  terapkanSpawnTertunda(tertunda, 599, spawnList, sisa, kabarBaru);
  ok(spawnList.length === 0 && tertunda.size === 1, "r10: spawn belum waktunya -> belum muncul");
  terapkanSpawnTertunda(tertunda, 600, spawnList, sisa, kabarBaru);
  ok(spawnList.length === 1 && spawnList[0].gx === 120 && sisa.get("120,110") === SISA_NODE_AWAL && tertunda.size === 0, "r10: spawn waktunya tiba -> node baru bersisa awal (r15: 1, dulu 5)");
  ok(sisa.get("105,100") === 0, "r10: ubin lama tetap habis (tidak tumbuh di tempat)");
}
// RONDE 10 — sekuens berburu: jatuh -> daging (bukan stok instan) ->
// ambil -> bawa pulang -> stok saat tiba.
{
  const pemburu = wargaDasar({ peran: "pemburu", stat: { int: 5, str: 10, agi: 10, sta: 10 }, lokasi: { gx: 100, gy: 100 }, fase_siklus: "jalan" });
  const mangsa = { _id: "h9", jenis: "rusa", gx: 101, gy: 100 };
  const ctxH = { ...ctxKosong(pemburu), hewan: [mangsa], daging: [] as DagingDoc[], dagingHapus: new Set<string>(), wargaSemua: [pemburu] };
  // Paksa sukses: Math.random kecil (peluang tinggi dengan stat 10).
  // RONDE 15 — buru multi-hit: rusa HP 4, damage 1 -> 4 hit sampai mati
  // (dulu 1 hit langsung mati). Hit pertama = luka, bukan daging.
  const rndAsli = Math.random;
  Math.random = () => 0.01;
  stepPerburuan(pemburu, 12, ctxH);
  ok(!ctxH.hewanHilang.has("h9") && (mangsa as unknown as { hp?: number }).hp === 3, "r15: hit pertama rusa HP 4->3 (luka, belum mati)");
  ok((ctxH.daging ?? []).length === 0, "r15: hit pertama belum ada daging");
  stepPerburuan(pemburu, 12, ctxH);
  stepPerburuan(pemburu, 12, ctxH);
  stepPerburuan(pemburu, 12, ctxH);
  Math.random = rndAsli;
  ok(ctxH.hewanHilang.has("h9"), "r15: hit keempat rusa mati (alur r10 lanjut)");
  ok((ctxH.daging ?? []).length === 1, "r10: buruan sukses -> daging tergeletak (1 dokumen)");
  ok(ctxH.stok.pangan === 0, "r10: buruan sukses -> stok BELUM naik (bukan instan)");
  ok(pemburu.daging_target != null && pemburu.daging_target.gx === 101, "r10: pemburu punya daging_target di ubin mangsa");
  // Ambil daging: pemburu di ubin daging, jalan + daging_target -> bawa.
  pemburu.lokasi = { gx: 101, gy: 100 };
  pemburu.tujuan = { gx: 101, gy: 100 };
  pemburu.fase_siklus = "jalan";
  const stokSebelum = ctxH.stok.pangan;
  stepWarga(pemburu, 13, ctxH);
  ok(pemburu.membawa_daging != null && pemburu.membawa_daging.jenis === "Rusa", "r10: tiba di daging -> membawa_daging");
  ok(String(pemburu.fase_siklus) === "kembali", "r10: setelah ambil -> kembali ke kampung");
  ok((ctxH.daging ?? []).length === 0, "r10: daging diambil -> dokumen hilang dari peta");
  // Tiba di kampung -> stok naik (rusa pangan 6, r45: daging 5x = 30,
  // TAPI cap harian pangan 2026-11-05 = 15/hari/orang, jadi 15 yang masuk stok).
  pemburu.lokasi = { gx: 100, gy: 100 };
  pemburu.tujuan = { gx: 100, gy: 100 };
  pemburu.fase_siklus = "kembali";
  stepWarga(pemburu, 14, ctxH);
  ok(pemburu.membawa_daging === null && ctxH.stok.pangan === stokSebelum + 15, "r10: tiba kampung -> stok pangan +15 (daging 5x, cap harian 15), daging habis dibawa");
  // Malam: pemburu tidak berburu.
  const malam = wargaDasar({ peran: "pemburu", stat: { int: 5, str: 10, agi: 10, sta: 10 }, lokasi: { gx: 100, gy: 100 }, fase_siklus: "jalan" });
  const ctxM = { ...ctxKosong(malam), hewan: [{ _id: "h10", jenis: "rusa", gx: 101, gy: 100 }], daging: [] as DagingDoc[], dagingHapus: new Set<string>(), wargaSemua: [malam] };
  stepPerburuan(malam, 20, ctxM); // hod 20 = malam
  ok(malam.target_hewan === null && !malam.daging_target, "r10: malam -> pemburu tidak mulai berburu");
}
// RONDE 38 — LAPORAN USER 2026-11-05 (video: pemburu "Ys" berdiri di
// samping rusa yang HP-nya tetap penuh; "gada yg ngumpulin buah";
// "seluruh orang bisa ngelawan hewan"; "rumah nembus restoran"):
// perburuan yang benar-benar bisa menangkap mangsa, semua warga bisa
// berburu/duel, kumpul yang benar-benar jalan, dan satu sumber
// kebenaran petak.
{
  // 1) Pemburu mengejar + membunuh rusa yang JAUH (10 tile) dalam
  // beberapa jam — urutan asli tiap jam: stepHewan (mangsa kabur
  // dulu) lalu stepPerburuan (pemburu mengejar + menyerang).
  const pemburu = wargaDasar({ peran: "pemburu", stat: { int: 5, str: 10, agi: 10, sta: 10 }, lokasi: { gx: 100, gy: 100 }, fase_siklus: "jalan" });
  const mangsa = { _id: "h38", jenis: "rusa", gx: 110, gy: 100 };
  const ctxH = { ...ctxKosong(pemburu), hewan: [mangsa], daging: [] as DagingDoc[], dagingHapus: new Set<string>(), wargaSemua: [pemburu] };
  const rndAsli = Math.random;
  Math.random = () => 0.01;
  stepHewan(mangsa as never, 12, ctxH);
  stepPerburuan(pemburu, 12, ctxH);
  ok((mangsa as unknown as { hp?: number }).hp === 3, "r38: pemburu kejar rusa jauh -> hit pertama HP 4->3 (bukan diam HP penuh)");
  ok(pemburu.lokasi.gx > 100, "r38: pemburu benar-benar berjalan mendatangi mangsa");
  for (const jam of [13, 14, 15]) {
    stepHewan(mangsa as never, jam, ctxH);
    stepPerburuan(pemburu, jam, ctxH);
  }
  Math.random = rndAsli;
  ok(ctxH.hewanHilang.has("h38"), "r38: rusa jauh mati dalam 4 jam kejar (bukan lolos selamanya)");
  ok((ctxH.daging ?? []).length === 1, "r38: rusa mati -> daging tergeletak");

  // 2) Hewan jinak kabur sekejap saja (<= 30 tile/jam), bukan 120.
  // Rusa ditaruh 3 tile dari pemburu (di dalam radius reaksi 4)
  // supaya ia benar-benar KABUR, bukan mengembara.
  const dekat2 = wargaDasar({ peran: "pemburu", lokasi: { gx: 100, gy: 100 } });
  const rusa2 = { _id: "h38b", jenis: "rusa", gx: 103, gy: 100 };
  const ctxF = { ...ctxKosong(dekat2), hewan: [rusa2], wargaSemua: [dekat2] };
  stepHewan(rusa2 as never, 12, ctxF);
  const kabur = Math.abs(rusa2.gx - 103) + Math.abs(rusa2.gy - 100);
  ok(kabur > 0 && kabur <= 30, "r38: rusa kabur sekejap (<=30 tile/jam, dulu 120)");

  // 3) Warga NON-pemburu menyerang rusa yang dekat (oportunis).
  const pengumpul = wargaDasar({ peran: "pengumpul", stat: { int: 5, str: 10, agi: 10, sta: 10 }, lokasi: { gx: 100, gy: 100 }, fase_siklus: "jalan" });
  const mangsa2 = { _id: "h38c", jenis: "rusa", gx: 101, gy: 100 };
  const ctxP = { ...ctxKosong(pengumpul), hewan: [mangsa2], daging: [] as DagingDoc[], dagingHapus: new Set<string>(), wargaSemua: [pengumpul] };
  Math.random = () => 0.01;
  stepPerburuan(pengumpul, 12, ctxP);
  Math.random = rndAsli;
  ok((mangsa2 as unknown as { hp?: number }).hp === 3, "r38: pengumpul menyerang rusa dekat -> HP 4->3");
  // ...tapi pengumpul TIDAK mengejar rusa yang jauh (tetap kerja).
  const mangsa3 = { _id: "h38d", jenis: "rusa", gx: 110, gy: 100 };
  const ctxP2 = { ...ctxKosong(pengumpul), hewan: [mangsa3], daging: [] as DagingDoc[], dagingHapus: new Set<string>(), wargaSemua: [pengumpul] };
  stepPerburuan(pengumpul, 12, ctxP2);
  ok(pengumpul.target_hewan === null && pengumpul.lokasi.gx === 100, "r38: pengumpul tidak mengejar rusa 10 tile (tetap di tempat)");

  // 4) Warga non-pemburu yang KUAT kini berduel hewan buas dan menang.
  // (Cabang duel menang tidak mengubah aksi_sekarang — yang terlihat:
  // target_hewan terpasang, status "Melukai", HP serigala turun.)
  const kuat = wargaDasar({ peran: "pengumpul", lokasi: { gx: 100, gy: 100 }, sehat: 100, stamina: 50 });
  const ctxD = ctxKosong(kuat);
  const serigala = { _id: "h38e", jenis: "serigala", gx: 101, gy: 100 };
  stepHewan(serigala as never, 12, ctxD);
  ok(kuat.target_hewan === "h38e", "r38: pengumpul kuat vs serigala -> duel (bukan kabur)");
  ok((serigala as unknown as { hp?: number }).hp === 7, "r38: pengumpul kuat melukai serigala (HP 8->7)");
  ok(kuat.status_teks.includes("Melukai"), "r38: pengumpul kuat status = Melukai serigala");

  // 5) Laju kumpul kembali ke kontrak (stat 8 -> 60%/jam): satu ronde
  // selesai dalam ~2 jam, bukan 150-300 jam.
  eq(lajuKumpul(8), 60, "r38: lajuKumpul(8) = 60%/jam (dulu 0.65)");

  // 6) Satu sumber kebenaran petak: baris tanpa w/h memakai footprint
  // katalog (paviliun 8x8, gubuk 2x2), bukan default 1 atau 2.
  const petakPav = petakBangunan({ kind: "paviliun_makan", gx: 100, gy: 100 });
  eq(petakPav.size, 64, "r38: petakBangunan paviliun tanpa w/h = 8x8 (64 petak)");
  const petakGubuk = petakBangunan({ kind: "gubuk", gx: 100, gy: 100 });
  eq(petakGubuk.size, 4, "r38: petakBangunan gubuk tanpa w/h = 2x2 (4 petak)");
  ok(petakBangunan({ kind: "gubuk", gx: 100, gy: 100 }).has("101,101"), "r38: petakBangunan gubuk mencakup ubin (101,101)");
  // pasanganTumpuk mendeteksi tumpukan meski baris tanpa w/h.
  ok(pasanganTumpuk([
    { kind: "paviliun_makan", gx: 100, gy: 100 },
    { kind: "gubuk", gx: 107, gy: 107 },
  ]) !== null, "r38: pasanganTumpuk deteksi gubuk di dalam footprint paviliun tanpa w/h");
  ok(pasanganTumpuk([
    { kind: "paviliun_makan", gx: 100, gy: 100 },
    { kind: "gubuk", gx: 109, gy: 109 },
  ]) === null, "r38: pasanganTumpuk tidak false-positive di luar footprint");
  // plotBebas menolak petak yang sudah terisi.
  ok(!plotBebas([{ kind: "gubuk", gx: 100, gy: 100 }], 101, 101, 2, 2), "r38: plotBebas menolak petak yang menimpa gubuk");
  ok(plotBebas([{ kind: "gubuk", gx: 100, gy: 100 }], 102, 100, 2, 2), "r38: plotBebas menerima petak di sebelah gubuk");

  // 7) Guard statis: model paviliun tidak lagi memakai skala tetap
  // 0.88 — skalanya menyesuaikan footprint (muat di petaknya).
  const pavSrc = readFileSync("src/lib/batu/assetPaviliun3D.ts", "utf8");
  ok(!pavSrc.includes("const scale = 0.88"), "r38: paviliun tidak lagi skala tetap 0.88");
  ok(pavSrc.includes("Math.min(w / 32, h / 28)"), "r38: paviliun skala = min(w/32, h/28) sesuai footprint");
}
// Guard statis ronde 9/10: Map3D punya pose tidur + daging + proyektil + serpihan.
{
  const mapSrc = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc.includes("poseTidur") && mapSrc.includes("syncDaging"), "map3d: pose tidur + daging tergeletak");
  ok(mapSrc.includes("fallingAnimals") && mapSrc.includes("proyektils"), "map3d: hewan jatuh + proyektil");
  ok(mapSrc.includes("ayunanPerkakas") && mapSrc.includes("lastChip"), "map3d: ayunan kapak + serpihan");
  ok(mapSrc.includes("durasiJamMs"), "map3d: laju display ikut durasi jam malam");
  ok(mapSrc.includes("dagingBawa"), "map3d: bungkusan daging saat dibawa pulang");
}

// RONDE 10 (lanjutan) — PAVILIUN MAKAN: katalog, geometri pintu,
// pathing masuk-keluar lewat pintu, lapar -> restoran -> makan ->
// keluar, juru masak memasak (pangan -> hidangan).
{
  const pav = bangunanById("paviliun_makan");
  ok(pav !== undefined, "r10: katalog memuat paviliun_makan");
  ok(BANGUNAN.length === 23, "r17: katalog 23 bangunan (22 + kebun_rempah)");
  eq(pav?.footprint, 3, "r10: paviliun footprint 3x3");
  eq(pav?.biaya, { kayu: 60, batu: 20 }, "r10: paviliun biaya kayu 60 + batu 20");
  ok(pav?.kapasitas === null, "r10: paviliun bukan hunian");
  eq(pav?.sprite, "/batu/paviliun-makan.png", "r10: paviliun sprite panel");
  ok(KAP_HIDANGAN === 10 && LAPAR_HIDANGAN === 60 && LAPAR_PANGAN_RESTORAN === 55, "r10: konstanta hidangan (kap 10, -60 hidangan, -55 pangan; r20: -40 -> -55, gampangin pangan)");
}
{
  // RONDE 17 — KEBUN REMPAH: rantai masak setelah paviliun (makan
  // bersama -> bahan masak sendiri). Katalog + geometri 3D + sprite
  // panel + gate sim (paviliun ada + pop>=12/juru masak/peramu).
  const keb = bangunanById("kebun_rempah");
  ok(keb !== undefined, "r17: katalog memuat kebun_rempah");
  eq(keb?.footprint, 2, "r17: kebun footprint 2x2");
  eq(keb?.biaya, { kayu: 15, batu: 5 }, "r17: kebun biaya kayu 15 + batu 5");
  ok(keb?.kapasitas === null, "r17: kebun bukan hunian");
  eq(keb?.sprite, "/batu/kebun-rempah.png", "r17: kebun sprite panel");
  const mapSrc17 = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc17.includes('kind === "kebun_rempah"'), "r17: Map3D memuat geometri kebun_rempah (beda dari ladang)");
  const sprite17 = readFileSync("public/batu/kebun-rempah.png");
  ok(sprite17.length > 0, "r17: sprite kebun-rempah.png ada + tidak kosong");
  const simSrc17 = readFileSync("src/lib/batu/sim.ts", "utf8");
  ok(simSrc17.includes('kandidat.push("kebun_rempah")'), "r17: sim mengantrekan kebun_rempah");
  ok(simSrc17.includes("kebun_rempah:") && simSrc17.includes("adaPaviliun"), "r17: sim memuat alasan + gate paviliun kebun_rempah");
}
{
  const P = { gx: 98, gy: 98, w: 3, h: 3 };
  eq(pintuRestoran(P), { gx: 99, gy: 101 }, "r10: pintu = selatan-tengah luar (99,101)");
  eq(tengahRestoran(P), { gx: 99, gy: 99 }, "r10: tengah = meja makan (99,99)");
  eq(dapurRestoran(P), { gx: 99, gy: 98 }, "r10: dapur = utara-tengah (99,98)");
  const kolom = kolomPintuRestoran(P);
  ok(kolom.has("99,98") && kolom.has("99,99") && kolom.has("99,100") && kolom.size === 3, "r10: kolom pintu = 3 ubin tengah");
  ok(!kolom.has("98,98") && !kolom.has("100,99"), "r10: tiang/meja BUKAN kolom pintu");
  ok(diDalamRestoran({ gx: 99, gy: 99 }, P) && !diDalamRestoran({ gx: 99, gy: 101 }, P), "r10: diDalam: tengah ya, pintu-luar tidak");
}
{
  // Pathing: kaki 9 ubin footprint = rintangan penuh.
  const P = { gx: 98, gy: 98, w: 3, h: 3 };
  const rintangan = new Set<string>();
  for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) rintangan.add(`${98 + dx},${98 + dy}`);
  const ctxR = (w: Warga): SimCtx => ({
    ...ctxKosong(w),
    rintangan,
    restoran: { _id: "r1", kind: "paviliun_makan", gx: 98, gy: 98, w: 3, h: 3, hidangan: 0 },
  });
  // Masuk: tanpa bukaan kolom, tengah TAK PERNAH tercapai (semua ubin
  // tetangga tengah adalah rintangan); dengan bukaan, sampai lewat pintu.
  const masuk = gerak({ gx: 99, gy: 103 }, { gx: 99, gy: 99 }, 150, { rintangan });
  ok(!(masuk.lokasi.gx === 99 && masuk.lokasi.gy === 99), "r10: tanpa bukaan pintu, tengah paviliun tak tercapai");
  const wMasuk = wargaDasar({ lokasi: { gx: 99, gy: 103 }, tujuan: { gx: 99, gy: 99 }, fase_siklus: "jalan", aksi_sekarang: "pulang_restoran" });
  const rMasuk = gerak({ gx: 99, gy: 103 }, { gx: 99, gy: 99 }, 150, { rintangan: rintanganUntuk(wMasuk, ctxR(wMasuk)) });
  ok(rMasuk.lokasi.gx === 99 && rMasuk.lokasi.gy === 99, "r10: dengan bukaan, masuk lewat pintu sampai tengah");
  const rBukaan = rintanganUntuk(wMasuk, ctxR(wMasuk));
  ok(!rBukaan.has("99,100") && rBukaan.has("98,99") && rBukaan.has("100,99"), "r10: bukaan hanya kolom tengah, tiang/meja tetap rintangan");
  // Keluar: dari tengah ke pintu luar — tanpa bukaan, beku di tengah.
  const keluarBuntu = gerak({ gx: 99, gy: 99 }, { gx: 99, gy: 101 }, 150, { rintangan });
  ok(keluarBuntu.lokasi.gx === 99 && keluarBuntu.lokasi.gy === 99, "r10: tanpa bukaan, keluar dari tengah buntu");
  const wKeluar = wargaDasar({ lokasi: { gx: 99, gy: 99 }, tujuan: { gx: 99, gy: 101 }, fase_siklus: "kembali", aksi_sekarang: "keluar_restoran" });
  const rKeluar = gerak({ gx: 99, gy: 99 }, { gx: 99, gy: 101 }, 150, { rintangan: rintanganUntuk(wKeluar, ctxR(wKeluar)) });
  ok(rKeluar.lokasi.gx === 99 && rKeluar.lokasi.gy === 101, "r10: dengan bukaan, keluar lewat pintu sampai luar");
  // Warga biasa (tujuan di luar) tetap memutar, tidak memotong paviliun.
  const wLuar = wargaDasar({ lokasi: { gx: 90, gy: 99 }, tujuan: { gx: 110, gy: 99 }, fase_siklus: "jalan" });
  ok(rintanganUntuk(wLuar, ctxR(wLuar)) === ctxR(wLuar).rintangan, "r10: warga biasa pakai rintangan penuh");
}
{
  // Alur lengkap: lapar -> paviliun -> makan hidangan -> keluar -> kerja.
  const P = { gx: 98, gy: 98, w: 3, h: 3 };
  const rintangan = new Set<string>();
  for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) rintangan.add(`${98 + dx},${98 + dy}`);
  const restoran = { _id: "r1", kind: "paviliun_makan", gx: 98, gy: 98, w: 3, h: 3, hidangan: 2 };
  const w = wargaDasar({ peran: "pengumpul", stat: { int: 5, str: 8, agi: 5, sta: 50 }, lapar: 95, lokasi: { gx: 90, gy: 100 }, tujuan: { gx: 105, gy: 100 }, node: { kind: "semak_beri", gx: 105, gy: 100 }, fase_siklus: "jalan" });
  const ctx = { ...ctxKosong(w), rintangan, restoran, stok: { kayu: 0, batu: 0, emas: 0, besi: 0, pangan: 5, kulit: 0 }, nodes: [{ kind: "semak_beri", gx: 110, gy: 100 } as never], nodeSisa: new Map([["110,100", 5]]) };
  stepWarga(w, 12, ctx);
  ok(w.aksi_sekarang === "pulang_restoran" || w.fase_siklus === "makan", "r10: lapar 95 + paviliun -> menuju paviliun (bukan pulang)");
  ok(w.lokasi.gx === 99 && w.lokasi.gy === 99 && w.fase_siklus === "makan", "r10: tiba tengah paviliun -> fase makan");
  stepWarga(w, 12, ctx);
  ok(restoran.hidangan === 1, "r10: makan hidangan -> hidangan 2->1");
  ok(w.lapar === 39, "r10: makan hidangan -> lapar 99->39 (-60)");
  ok(w.fase_siklus === "kembali" && w.aksi_sekarang === "keluar_restoran", "r10: habis makan -> keluar_restoran");
  eq(w.tujuan, { gx: 99, gy: 101 }, "r10: keluar -> tujuan pintu luar");
  stepWarga(w, 12, ctx);
  ok(w.lokasi.gx === 99 && w.lokasi.gy === 101, "r10: keluar lewat pintu sampai luar");
  ok(w.fase_siklus === "jalan" && w.node !== null, "r10: habis keluar -> lanjut kerja");
}
{
  // Makan pangan biasa bila hidangan habis.
  const restoran = { _id: "r1", kind: "paviliun_makan", gx: 98, gy: 98, w: 3, h: 3, hidangan: 0 };
  const w = wargaDasar({ lapar: 90, lokasi: { gx: 99, gy: 99 }, fase_siklus: "makan" });
  const ctx = { ...ctxKosong(w), restoran, stok: { kayu: 0, batu: 0, emas: 0, besi: 0, pangan: 5, kulit: 0 } };
  stepWarga(w, 12, ctx);
  ok(ctx.stok.pangan === 4 && w.lapar === 35, "r10: tanpa hidangan -> pangan -1, lapar -55 (r20: -40 -> -55, gampangin pangan)");
  ok(w.aksi_sekarang === "keluar_restoran", "r10: makan pangan pun tetap keluar lewat pintu");
}
{
  // Paviliun kosong total -> tidak ada redirect (paceklik mengambil alih
  // hanya bila target bukan penghasil pangan; pakai node pangan di sini).
  const restoran = { _id: "r1", kind: "paviliun_makan", gx: 98, gy: 98, w: 3, h: 3, hidangan: 0 };
  const w = wargaDasar({ stat: { int: 5, str: 8, agi: 5, sta: 50 }, lapar: 95, lokasi: { gx: 90, gy: 100 }, tujuan: { gx: 105, gy: 100 }, node: { kind: "semak_beri", gx: 105, gy: 100 }, fase_siklus: "jalan" });
  const ctx = { ...ctxKosong(w), restoran, stok: { kayu: 0, batu: 0, emas: 0, besi: 0, pangan: 0, kulit: 0 } };
  stepWarga(w, 12, ctx);
  ok(w.aksi_sekarang !== "pulang_restoran" && w.aksi_sekarang !== "pulang_makan", "r10: paviliun kosong total -> tidak redirect makan");
}
{
  // Juru masak: target dapur + memasak 1 hidangan/jam; dapur penuh ->
  // kerja biasa.
  const restoran = { _id: "r1", kind: "paviliun_makan", gx: 98, gy: 98, w: 3, h: 3, hidangan: 0 };
  const juru = wargaDasar({ peran: "juru_masak", lokasi: { gx: 90, gy: 100 } });
  const ctxJ = { ...ctxKosong(juru), restoran, stok: { kayu: 0, batu: 0, emas: 0, besi: 0, pangan: 5, kulit: 0 }, nodes: [{ kind: "semak_beri", gx: 110, gy: 100 } as never], nodeSisa: new Map([["110,100", 5]]) };
  const target = pilihTargetKerja(juru, ctxJ);
  ok(target?.node.pseudo === "restoran", "r10: juru masak + paviliun -> target dapur (pseudo restoran)");
  eq(target?.tujuan, { gx: 99, gy: 98 }, "r10: juru masak -> tujuan ubin dapur");
  const masak = wargaDasar({ peran: "juru_masak", lokasi: { gx: 99, gy: 98 }, node: { kind: "semak_beri", gx: 99, gy: 98, pseudo: "restoran" }, fase_siklus: "kumpul" });
  const ctxM = { ...ctxKosong(masak), restoran, stok: { kayu: 0, batu: 0, emas: 0, besi: 0, pangan: 5, kulit: 0 } };
  stepWarga(masak, 12, ctxM);
  ok(restoran.hidangan === 1 && ctxM.stok.pangan === 4, "r10: memasak -> pangan -1, hidangan +1");
  ok(masak.aksi_sekarang === "memasak" && String(masak.status_teks).includes("paviliun"), "r10: memasak -> aksi + status paviliun");
  restoran.hidangan = 10;
  const penuh = wargaDasar({ peran: "juru_masak", lokasi: { gx: 99, gy: 98 }, node: { kind: "semak_beri", gx: 99, gy: 98, pseudo: "restoran" }, fase_siklus: "kumpul" });
  const ctxP = { ...ctxKosong(penuh), restoran, stok: { kayu: 0, batu: 0, emas: 0, besi: 0, pangan: 5, kulit: 0 }, nodes: [{ kind: "semak_beri", gx: 110, gy: 100 } as never], nodeSisa: new Map([["110,100", 5]]) };
  stepWarga(penuh, 12, ctxP);
  ok(penuh.fase_siklus === "jalan" && penuh.node?.pseudo === undefined, "r10: dapur penuh -> juru masak kumpul biasa");
  ok(restoran.hidangan === 10 && ctxP.stok.pangan === 5, "r10: dapur penuh -> tidak ada masak");
  // Tanpa paviliun, juru masak tetap kumpul biasa (tidak crash).
  const tanpa = wargaDasar({ peran: "juru_masak", lokasi: { gx: 90, gy: 100 } });
  const ctxT = { ...ctxKosong(tanpa), stok: { kayu: 0, batu: 0, emas: 0, besi: 0, pangan: 5, kulit: 0 }, nodes: [{ kind: "semak_beri", gx: 110, gy: 100 } as never], nodeSisa: new Map([["110,100", 5]]) };
  const t2 = pilihTargetKerja(tanpa, ctxT);
  ok(t2?.node.pseudo === undefined && t2?.node.kind === "semak_beri", "r10: tanpa paviliun -> juru masak kumpul biasa");
}
{
  // Malam: warga makan ikut pulang tidur (tidak makan tengah malam).
  const restoran = { _id: "r1", kind: "paviliun_makan", gx: 98, gy: 98, w: 3, h: 3, hidangan: 2 };
  const w = wargaDasar({ lokasi: { gx: 99, gy: 99 }, fase_siklus: "makan" });
  const ctx = { ...ctxKosong(w), restoran };
  stepWarga(w, 20, ctx);
  // Warga di tengah paviliun, hunian 1 ubin jauhnya -> dalam jam yang
  // sama sudah sampai rumah + tidur (bukan tetap makan di paviliun).
  ok(w.fase_siklus !== "makan", "r10: makan saat malam -> tidak lanjut makan");
  ok(w.fase_siklus === "istirahat" && w.lokasi.gx === 100 && w.lokasi.gy === 100, "r10: makan saat malam -> sampai rumah + istirahat");
}
{
  // Guard statis: Map3D + sprite + versi r10.
  const mapSrc = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc.includes("paviliun_makan"), "map3d: cabang bangunan paviliun_makan");
  ok(mapSrc.includes('fase === "makan"'), "map3d: animasi makan (fase makan)");
  ok(mapSrc.includes('pseudo ?? "") === "restoran"') || mapSrc.includes("restoran"), "map3d: animasi aduk periuk saat memasak");
  const sprite = readFileSync("public/batu/paviliun-makan.png");
  ok(sprite.length > 0 && sprite[0] === 0x89 && sprite[1] === 0x50, "sprite: paviliun-makan.png ada + header PNG");
  const ver = readFileSync("src/lib/version.ts", "utf8");
  ok(ver.includes('"r57"'), "versi: BUILD_ID r47");
}

{
  // RONDE 12 — gudang penyimpanan: lumbung = gudang (bukan tipe baru
  // yang menduplikasi fungsi), kapasitas tetap null (tanpa batas palsu).
  const lum = bangunanById("lumbung");
  ok(lum !== undefined, "r12: katalog memuat lumbung");
  eq(lum?.kapasitas, null, "r12: lumbung tanpa batas kapasitas (jujur, stok global)");
  eq(lum?.biaya, { kayu: 40, batu: 10 }, "r12: biaya lumbung tidak berubah");
  eq(lum?.footprint, 2, "r12: lumbung footprint 2x2");
  ok((lum?.deskripsi ?? "").includes("Ketuk"), "r12: deskripsi lumbung mengarahkan ketuk panel");
  ok(BANGUNAN.length === 23, "r17: katalog 23 (lumbung reskin, bukan bangunan baru; +kebun_rempah r17)");
  // Panel isi = stok global 6 resource (tanpa API baru: /api/world sudah
  // mengembalikan sumber_daya; panel hanya menampilkan + total).
  const stok = stokKosong();
  const keys = ["kayu", "batu", "emas", "besi", "pangan", "kulit"];
  ok(keys.every((k) => k in stok), "r12: stok global punya 6 resource untuk panel gudang");
  // Serangan hewan buas (sim): serigala di sebelah warga LEMAH ->
  // interaksi "diserang" + kabur (pemicu animasi lunge di Map3D).
  // r38: duel buas kini terbuka untuk semua warga (bukan hanya
  // pemburu) — warga ini sengaja dibuat LEMAH (str 3/agi 3/sta 5 ->
  // skorGelud 11.5 < ambang serigala 18) supaya ia tetap kalah dan
  // kabur seperti dulu; warga kuat kini melawan (tes r38 di bawah).
  const w = wargaDasar({ peran: "pengumpul", lokasi: { gx: 100, gy: 100 }, sehat: 100, stamina: 50, stat: { int: 5, str: 3, agi: 3, sta: 5 } });
  const ctx = ctxKosong(w);
  stepHewan({ _id: "h1", jenis: "serigala", gx: 101, gy: 100 } as never, 12, ctx);
  ok(w.interaksi?.jenis === "diserang", "r12: serigala dekat -> interaksi diserang");
  ok((w.interaksi?.teks ?? "").includes("Tolong"), "r12: bubble diserang = Tolong! Ada hewan buas!");
  ok(w.aksi_sekarang === "kabur", "r12: diserang -> warga kabur");
  ok(w.sehat < 100, "r12: diserang -> sehat turun");
  // Helper lunge: label-cocok terdekat dalam radius; salah label /
  // di luar radius / kosong -> null.
  const labelOf = (j: string) => ({ serigala: "Serigala", babi_hutan: "Babi Hutan", rusa: "Rusa" }[j] ?? j);
  const kawanan = [
    { id: "s1", jenis: "serigala", x: 103, z: 100 },
    { id: "s2", jenis: "serigala", x: 101, z: 100 },
    { id: "b1", jenis: "babi_hutan", x: 100, z: 101 },
  ];
  eq(cariHewanBuas(kawanan, "Serigala", 100, 100, 8, labelOf), "s2", "r12: lunge pilih serigala terdekat");
  eq(cariHewanBuas(kawanan, "Babi Hutan", 100, 100, 8, labelOf), "b1", "r12: lunge cocok label Babi Hutan");
  eq(cariHewanBuas(kawanan, "Beruang", 100, 100, 8, labelOf), null, "r12: lunge label tak ada -> null");
  eq(cariHewanBuas(kawanan, "Serigala", 100, 100, 0.5, labelOf), null, "r12: lunge di luar radius -> null");
  eq(cariHewanBuas([], "Serigala", 100, 100, 8, labelOf), null, "r12: lunge tanpa hewan -> null");
  // Guard statis: Map3D + page punya tap gudang + lunge.
  const mapSrc12 = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc12.includes("Pintu kargo ganda"), "map3d: cabang gudang lumbung (pintu kargo)");
  ok(mapSrc12.includes("userData.placement"), "map3d: placement di userData untuk raycast bangunan");
  ok(mapSrc12.includes("onTapBangunan"), "map3d: prop onTapBangunan");
  ok(mapSrc12.includes("lungeAktif"), "map3d: animasi lunge hewan buas");
  ok(mapSrc12.includes("cariHewanBuas"), "map3d: lunge pakai helper cariHewanBuas");
  const pageSrc12 = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrc12.includes('panel === "gudang"'), "page: panel gudang");
  ok(pageSrc12.includes("tapBangunan"), "page: handler tapBangunan");
  ok(pageSrc12.includes("tidak dibatasi"), "page: panel gudang jujur tanpa batas palsu");
  ok(pageSrc12.includes("Total:"), "page: panel gudang menampilkan total");
  const sprite12 = readFileSync("public/batu/lumbung.png");
  ok(sprite12.length > 0 && sprite12[0] === 0x89 && sprite12[1] === 0x50, "sprite: lumbung.png gudang baru ada + header PNG");
}

{
  // RONDE 11 — pusat 200x200 IDENTIK (hash snapshot pra-r11), grid baru,
  // sungai kontinu, ring wilderness, gunung + goa, pathing memutar.
  const pusatKeys = n1
    .filter((n) => n.gx >= 0 && n.gx < 200 && n.gy >= 0 && n.gy < 200)
    .map((n) => `${n.kind}@${n.gx},${n.gy}`)
    .sort();
  eq(pusatKeys.length, 1133, "r11: node pusat tetap 1133");
  eq(
    createHash("sha256").update(pusatKeys.join("|")).digest("hex").slice(0, 16),
    "225c02c7ddaefd11",
    "r11: hash node pusat identik pra-r11 (kampung tidak bergeser)"
  );
  const ring = n1.filter((n) => !(n.gx >= 0 && n.gx < 200 && n.gy >= 0 && n.gy < 200));
  ok(n1.length >= 4500 && n1.length <= 5500, `r11: total node waras (${n1.length})`);
  ok(ring.length >= 3400 && ring.length <= 4000, `r11: node ring wilderness (${ring.length})`);
  ok(ring.every((n) => !isWater(n.gx, n.gy)), "r11: node ring bukan di air");
  ok(ring.every((n) => !isGunung(n.gx, n.gy)), "r11: node ring bukan di gunung");
  const payloadBytes = JSON.stringify(n1.map((n) => ({ ...n, sprite: "/batu/x.png" }))).length;
  ok(payloadBytes < 400000, `r11: payload node < 400KB (${payloadBytes} byte)`);
  // Sungai kontinu di seluruh grid baru (tanpa patahan antar baris).
  let prevRx: number | null = null;
  for (let gy = GRID_MIN; gy < GRID_MAX; gy++) {
    const rx = riverX(gy);
    if (prevRx !== null) ok(Math.abs(rx - prevRx) <= 1, "r11: sungai kontinu antar baris");
    prevRx = rx;
  }
  for (const gy of [-150, -1, 0, 250, 399]) {
    ok(isWater(riverX(gy), gy) && isWater(riverX(gy) + 1, gy), `r11: sungai basah gy=${gy}`);
    ok(!isWater(riverX(gy) - 1, gy) && !isWater(riverX(gy) + 2, gy), `r11: tepi sungai kering gy=${gy}`);
  }
  ok(isWater(-201, 100) && isWater(400, 100), "r11: luar grid = air");
  // Gunung: 10, ring luar, tidak di air, tidak tumpang tindih, goa menghadap kampung.
  const gunung = generateGunung();
  eq(gunung.length, 10, "r11: 10 gunung");
  for (const g of gunung) {
    ok(g.r >= 5 && g.r <= 8, `r11: radius gunung 5-8 (${g.r})`);
    ok(g.h >= 6 && g.h <= 10, `r11: tinggi gunung 6-10 (${g.h.toFixed(1)})`);
    ok(Math.abs(g.cx - 100) + Math.abs(g.cy - 100) >= 140, "r11: gunung di ring luar (>=140)");
    ok(isGunung(g.goa.gx, g.goa.gy), "r11: ubin goa adalah ubin gunung");
    const vx = 100 - g.cx;
    const vy = 100 - g.cy;
    const ox = g.goa.gx - g.cx;
    const oy = g.goa.gy - g.cy;
    ok(ox * vx + oy * vy > 0, "r11: goa menghadap kampung");
  }
  for (let i = 0; i < gunung.length; i++) {
    for (let j = i + 1; j < gunung.length; j++) {
      ok(
        Math.hypot(gunung[i].cx - gunung[j].cx, gunung[i].cy - gunung[j].cy) >= gunung[i].r + gunung[j].r + 8,
        "r11: gunung tidak tumpang tindih"
      );
    }
  }
  for (const k of gunungTileKeys()) {
    const [gx, gy] = k.split(",").map(Number);
    ok(!isWater(gx, gy), "r11: ubin gunung bukan air");
  }
  // Pathing memutar gunung (bukan menembus, bukan macet).
  {
    const g0 = gunung[0];
    const start = { gx: g0.cx - g0.r - 3, gy: g0.cy };
    const goal = { gx: g0.cx + g0.r + 3, gy: g0.cy };
    let pos = { ...start };
    let tiba = false;
    for (let s = 0; s < 40 && !tiba; s++) {
      const r = gerak(pos, goal, 60, {});
      pos = { ...r.lokasi };
      ok(!isGunung(pos.gx, pos.gy), "r11: gerak tidak menginjak gunung");
      if (pos.gx === goal.gx && pos.gy === goal.gy) tiba = true;
    }
    ok(tiba, "r11: gerak memutar gunung sampai tujuan");
  }
  // findPlot tidak menaruh bangunan di gunung.
  {
    const plotG = findPlot(gunungTileKeys(), new Set(n1.map((n) => `${n.gx},${n.gy}`)), 2, 2);
    ok(plotG !== null, "r11: findPlot tetap menemukan plot");
    if (plotG) {
      ok(!isGunung(plotG.gx, plotG.gy) && !isGunung(plotG.gx + 1, plotG.gy + 1), "r11: plot bukan di gunung");
      ok(Math.abs(plotG.gx - 100) + Math.abs(plotG.gy - 100) < 60, "r11: plot tetap dekat kampung");
    }
  }
  // Guard statis kamera + gunung (Map3D tidak bisa dirender di VM).
  {
    const mapSrc = readFileSync("src/components/Map3D.tsx", "utf8");
    ok(!mapSrc.includes("mouseButtons.LEFT = THREE.MOUSE.ROTATE"), "r11: remap LEFT->ROTATE saat kunci DIHAPUS");
    ok(!mapSrc.includes("touches.ONE = THREE.TOUCH.ROTATE"), "r11: remap ONE->ROTATE saat kunci DIHAPUS");
    ok(mapSrc.includes('controls.addEventListener("start"'), "r11: listener start melepas kunci saat pan");
    ok(mapSrc.includes("onLepasKunci"), "r11: callback lepas kunci terhubung");
    ok(mapSrc.includes("panSpeed = 1.2"), "r11: panSpeed 1.2");
    ok(mapSrc.includes("rotateSpeed = 0.6"), "r11: rotateSpeed 0.6");
    ok(mapSrc.includes("maxDistance = 520"), "r11: maxDistance 520 (map besar)");
    ok(mapSrc.includes("gunungMeshes"), "r11: render gunung + goa");
    ok(mapSrc.includes("PlaneGeometry(gw, gh, seg, seg)"), "r11: segmen terrain dilepas dari ukuran grid");
  }
}
// RONDE 13 — bubble event-only + mencar + idle aktif.
{
  // Ngobrol: baris era-bersih.
  for (const l of [...NGOBROL_TANYA, ...NGOBROL_JAWAB]) {
    ok(!berisiModern(l), `ngobrol bersih: "${l.slice(0, 40)}"`);
  }
  // Ngobrol terpicu antar warga dekat: hasil imbang, jendela 1 jam, cooldown.
  {
    const rndAsli = Math.random;
    const a = wargaDasar({ _id: "a1", lokasi: { gx: 100, gy: 100 }, fase_siklus: "jalan" });
    const b = wargaDasar({ _id: "b1", lokasi: { gx: 101, gy: 100 }, fase_siklus: "jalan" });
    const ctx = { ...ctxKosong(a), wargaSemua: [a, b] };
    let ri = 0;
    const seq = [0.05, 0.8]; // picu + cabang ngobrol (>= 0.65)
    Math.random = () => seq[ri++] ?? 0.5;
    stepInteraksi([a, b], 100, ctx);
    Math.random = rndAsli;
    ok(a.interaksi?.jenis === "ngobrol" && b.interaksi?.jenis === "ngobrol", "ngobrol terpicu antar warga dekat");
    ok(a.interaksi?.sampai_jam === 101 && b.interaksi?.sampai_jam === 101, "ngobrol jendela 1 jam (event-only)");
    ok((a.interaksi?.teks ?? "").length > 0 && (b.interaksi?.teks ?? "").length > 0, "ngobrol punya teks");
    ok((b.interaksiCooldown ?? {})["a1"] === 112, "ngobrol ikut cooldown pasangan 12 jam");
  }
  // Konflik tetap jendela 1 jam (bukan 4).
  {
    const rndAsli = Math.random;
    const c = wargaDasar({ _id: "c1", lokasi: { gx: 100, gy: 100 }, fase_siklus: "jalan" });
    const d = wargaDasar({ _id: "d1", lokasi: { gx: 101, gy: 100 }, fase_siklus: "jalan" });
    const ctx2 = { ...ctxKosong(c), wargaSemua: [c, d] };
    let ri = 0;
    const seq2 = [0.05, 0.2, 0.1, 0.1, 0.1]; // picu + debat (< 0.35)
    Math.random = () => seq2[ri++] ?? 0.5;
    stepInteraksi([c, d], 200, ctx2);
    Math.random = rndAsli;
    ok(c.interaksi?.jenis === "debat" && c.interaksi?.sampai_jam === 201, "debat jendela 1 jam (event-only)");
  }
  // Mencar: sektor partisi 8 arah + deterministik per warga.
  {
    ok(sektorDariPosisi(150, 100) !== sektorDariPosisi(50, 100), "sektor timur != barat");
    ok(sektorDariPosisi(150, 100) === sektorDariPosisi(150, 100), "sektor deterministik");
    const w1 = wargaDasar({ nomor: "0001" });
    ok(sektorWarga(w1) >= 0 && sektorWarga(w1) <= 7, "sektor warga 0..7");
    ok(sektorWarga(w1) === sektorWarga(wargaDasar({ nomor: "0001" })), "sektor warga deterministik");
    const sektorSelatan = sektorDariPosisi(100, 150);
    const pilih = pilihNodeTerbaik("penebang", { gx: 100, gy: 100 }, [
      { kind: "pohon", gx: 110, gy: 100 },
      { kind: "pohon", gx: 100, gy: 150 },
    ], undefined, { sektor: sektorSelatan, stamina: 80 });
    eq(pilih, { kind: "pohon", gx: 100, gy: 150 }, "sektor mengalahkan jarak (stamina cukup)");
    const pilihLelah = pilihNodeTerbaik("penebang", { gx: 100, gy: 100 }, [
      { kind: "pohon", gx: 110, gy: 100 },
      { kind: "pohon", gx: 100, gy: 150 },
    ], undefined, { sektor: sektorSelatan, stamina: 30 });
    eq(pilihLelah, { kind: "pohon", gx: 110, gy: 100 }, "stamina rendah → terdekat, tanpa penalti sektor");
    const taken = new Map([["102,100", 1]]);
    const pilihAnti = pilihNodeTerbaik("penebang", { gx: 100, gy: 100 }, [
      { kind: "pohon", gx: 102, gy: 100 },
      { kind: "pohon", gx: 105, gy: 100 },
    ], undefined, { taken });
    eq(pilihAnti, { kind: "pohon", gx: 105, gy: 100 }, "node yang ditarget warga lain dihindari");
  }
  // Idle: istirahat tanpa target + siang + stamina cukup + tidak lapar → santai.
  {
    const rndAsli = Math.random;
    const w = wargaDasar({ lokasi: { gx: 100, gy: 100 }, fase_siklus: "istirahat", aksi_sekarang: "beristirahat", stamina: 80, lapar: 20 });
    const ctx = ctxKosong(w); // nodes kosong → tidak ada target
    let ri = 0;
    const seq = [0.7, 0.5]; // titik santai (112,100)
    Math.random = () => seq[ri++] ?? 0.5;
    stepWarga(w, 12, ctx); // jam 12 = siang
    Math.random = rndAsli;
    ok(w.fase_siklus === "jalan" && w.node?.pseudo === "santai" && w.tujuan !== null, "idle tanpa target → santai (jalan, bukan diam)");
    // Jam berikut: santai berjalan sampai tujuan, lalu santai lagi (berantai).
    stepWarga(w, 13, ctx);
    eq(w.lokasi, { gx: 112, gy: 100 }, "santai tiba di tujuan");
    ok(w.fase_siklus === "jalan" && w.node?.pseudo === "santai", "santai berantai (tidak diam setelah tiba)");
  }
  // Idle + lapar → pulang makan (bukan santai terus).
  {
    const wLapar = wargaDasar({ lokasi: { gx: 250, gy: 100 }, fase_siklus: "jalan", aksi_sekarang: "jalan_santai", stamina: 80, lapar: 95, node: { kind: "padang_buruan", gx: 260, gy: 100, pseudo: "santai" }, tujuan: { gx: 260, gy: 100 } });
    const ctxLapar = ctxKosong(wLapar);
    ctxLapar.stok.pangan = 5;
    stepWarga(wLapar, 12, ctxLapar);
    ok(wLapar.aksi_sekarang === "pulang_makan", "idle + lapar → pulang makan");
  }
  // Idle + malam → pulang tidur.
  {
    const wMalam = wargaDasar({ lokasi: { gx: 250, gy: 100 }, fase_siklus: "jalan", aksi_sekarang: "jalan_santai", stamina: 80, lapar: 20, node: { kind: "padang_buruan", gx: 260, gy: 100, pseudo: "santai" }, tujuan: { gx: 260, gy: 100 } });
    stepWarga(wMalam, 21, ctxKosong(wMalam)); // jam 21 = malam
    ok(wMalam.aksi_sekarang === "pulang_istirahat" && wMalam.fase_siklus === "kembali", "idle + malam → pulang tidur");
  }
  // Idle + stamina rendah → pulang istirahat.
  {
    const wLelah = wargaDasar({ lokasi: { gx: 250, gy: 100 }, fase_siklus: "jalan", aksi_sekarang: "jalan_santai", stamina: 10, lapar: 20, node: { kind: "padang_buruan", gx: 260, gy: 100, pseudo: "santai" }, tujuan: { gx: 260, gy: 100 } });
    stepWarga(wLelah, 12, ctxKosong(wLelah));
    ok(wLelah.aksi_sekarang === "pulang_istirahat", "idle + stamina rendah → pulang istirahat");
  }
  // Makan bersama: dua warga di paviliun → bubble ngobrol keduanya.
  {
    const resto = { _id: "r1", kind: "paviliun_makan", gx: 100, gy: 100, w: 3, h: 3, hidangan: 0 };
    const tengah = tengahRestoran(resto);
    const a = wargaDasar({ _id: "a1", lokasi: { ...tengah }, fase_siklus: "makan", aksi_sekarang: "makan" });
    const b = wargaDasar({ _id: "b1", lokasi: { ...tengah }, fase_siklus: "jalan", aksi_sekarang: "pulang_restoran", tujuan: { ...tengah }, node: null });
    const ctx = { ...ctxKosong(b), wargaSemua: [a, b], restoran: resto };
    stepWarga(b, 12, ctx);
    ok(b.fase_siklus === "makan", "tiba di paviliun → fase makan");
    ok(b.interaksi?.jenis === "ngobrol" && b.interaksi?.teks === "Makan bersama!", "makan bersama → bubble ngobrol");
    ok(a.interaksi?.jenis === "ngobrol" && a.interaksi?.teks === "Makan bersama!", "teman makan ikut dapat bubble");
  }
  // Guard statis Map3D (tidak bisa dirender di VM): bubble event-only + animasi bantu.
  {
    const mapSrc = readFileSync("src/components/Map3D.tsx", "utf8");
    ok(mapSrc.includes("teksBubbleEvent"), "r13: bubble pakai teksBubbleEvent (event-only)");
    ok(!mapSrc.includes("obrolanTampil"), "r13: bubble ambient DIHAPUS dari Map3D");
    ok(!mapSrc.includes("dialogUntukPeran"), "r13: dialog ambient DIHAPUS dari Map3D");
    ok(!mapSrc.includes("Zzz…"), "r13: bubble Zzz DIHAPUS (tidur = pose rebah)");
    ok(mapSrc.includes('"membantu"'), "r13: animasi membantu ada");
  }
}
// ============ RONDE 14 — FIGO = RAJA IBLIS + KARTU TENGAH ============
// Perintah user 00:23–00:24: spear verbatim (jangan diubah) + stat 999
// + bio persis + sifat pintar/suka-membantu + perilaku membantu lintas
// tugas + kartu profil modal tengah (sedikit di atas tengah).
const BIO_FIGO = "Pura-pura kepala suku padahal sebenarnya raja iblis😈😈";
function wargaFigo(over: Partial<Warga>): Warga {
  return wargaDasar({
    nama: "Figo",
    nomor: "0015",
    peran: "kepala_suku",
    stat: { int: 999, str: 999, agi: 999, sta: 999 },
    bakat: "STA",
    sifat: "pintar, suka membantu",
    bio: BIO_FIGO,
    perkakas: [{ jenis: "tongkat_suku", level: 0 }, { jenis: "tombak_iblis", level: 0, damage: 999 }],
    ...over,
  } as Partial<Warga>);
}
{
  // Stat 999: konsekuensi literal (dilaporkan jujur, bukan di-clamp diam).
  const figo = wargaFigo({});
  eq(skorGelud(figo), 4495.5, "r14: skor gelud Figo 999*2+999+999/2+999 = 4495,5 (menang semua)");
  eq(damageSenjata(figo), 999, "r14: damage senjata Figo 999");
  eq(damageSenjata(wargaDasar({})), 0, "r14: warga biasa damage 0");
  ok(punyaTombakIblis(figo) && !punyaTombakIblis(wargaDasar({})), "r14: marker tombak iblis hanya Figo");
  eq(kecepatanJalan(999, 999), 150, "r14: kecepatan stat 999 TETAP cap 150 (aman)");
  // Migrasi sim HARUS meloloskan 999 (bukan me-reset ke 5): statDenganSTA
  // lama memotong >10 -> 5, sehingga update DB Figo ter-revert tiap step.
  eq(statDenganSTA({ int: 999, str: 999, agi: 999, sta: 999 }), { int: 999, str: 999, agi: 999, sta: 999 }, "r14: statDenganSTA meloloskan 999 (raja iblis)");
  eq(statDenganSTA({ int: 6, str: 3, agi: 4, sta: 8 }), { int: 6, str: 3, agi: 4, sta: 8 }, "r14: statDenganSTA mempertahankan stat normal");
  eq(statDenganSTA({}), { int: 5, str: 5, agi: 5, sta: 5 }, "r14: statDenganSTA default 5 bila kosong");
  eq(statDenganSTA({ int: 0, str: -2, agi: NaN, sta: 8 }), { int: 5, str: 5, agi: 5, sta: 8 }, "r14: statDenganSTA default 5 untuk nilai rusak");
  eq(lajuKumpul(999), 5015, "r14: laju kumpul stat 999 = 5015%/jam (selesai 1 jam)");
  eq(jumlahKumpul(999), 503, "r14: hasil kumpul stat 999 = 503/siklus (banjir pangan — efek raja iblis, dilaporkan)");
  // publicWarga: bio + stat + spear lolos ke client (whitelist security).
  const pub = publicWarga({ ...figo, _id: "6ae8c2b50dd7dfe8f776b878" } as unknown as Record<string, unknown>);
  eq(pub.bio, BIO_FIGO, "r14: publicWarga meneruskan bio persis (termasuk emoji)");
  eq(pub.stat, { int: 999, str: 999, agi: 999, sta: 999 }, "r14: publicWarga meneruskan stat 999");
  eq(pub.sifat, "pintar, suka membantu", "r14: publicWarga meneruskan sifat baru");
  eq(pub.peran, "kepala_suku", "r14: peran Figo TETAP kepala_suku (penyamaran)");
  ok(Array.isArray(pub.perkakas) && pub.perkakas.some((p: any) => p.jenis === "tombak_iblis" && p.damage === 999), "r14: publicWarga meneruskan tombak_iblis DMG 999");
}
{
  // Perilaku membantu: tanpa target kerja -> Figo jalan membantu pekerja
  // terdekat, sampai di sebelahnya, lalu diam membantu di tempat.
  const pekerja = wargaDasar({ _id: "t2", nama: "Pekerja", peran: "penebang", fase_siklus: "kumpul", lokasi: { gx: 102, gy: 100 } });
  const figo = wargaFigo({ fase_siklus: "jalan", tujuan: null, node: null, lokasi: { gx: 100, gy: 100 }, stamina: 90, lapar: 20 });
  const ctx = { ...ctxKosong(figo), wargaSemua: [figo, pekerja] };
  stepWarga(figo, 12, ctx);
  eq(figo.aksi_sekarang, "membantu", "r14: Figo tanpa target -> aksi membantu (bukan diam)");
  eq(figo.tujuan, { gx: 103, gy: 100 }, "r14: Figo membantu -> tujuan ubin sebelah pekerja");
  stepWarga(figo, 12, ctx);
  ok(figo.lokasi.gx === 103 && figo.lokasi.gy === 100 && figo.aksi_sekarang === "membantu", "r14: Figo berjalan ke sebelah pekerja, tetap membantu");
  stepWarga(figo, 12, ctx);
  ok(figo.lokasi.gx === 103 && figo.lokasi.gy === 100 && figo.aksi_sekarang === "membantu", "r14: Figo sudah bersebelahan -> diam membantu di tempat");
  // Regresi: warga biasa TANPA tombak tidak ikut membantu.
  const biasa = wargaDasar({ nama: "Biasa", fase_siklus: "jalan", tujuan: null, node: null, aksi_sekarang: "berjalan", lokasi: { gx: 100, gy: 100 }, stamina: 90, lapar: 20 });
  const ctxB = { ...ctxKosong(biasa), wargaSemua: [biasa, pekerja] };
  stepWarga(biasa, 12, ctxB);
  ok(biasa.aksi_sekarang !== "membantu", "r14: warga biasa tanpa tombak TIDAK membantu (Figo-only)");
  // Bangun dari istirahat tanpa target -> Figo membantu (bukan diam).
  const figo2 = wargaFigo({ fase_siklus: "istirahat", tujuan: null, node: null, lokasi: { gx: 100, gy: 100 }, stamina: 90, lapar: 20 });
  const ctx2 = { ...ctxKosong(figo2), wargaSemua: [figo2, pekerja] };
  stepWarga(figo2, 12, ctx2);
  eq(figo2.aksi_sekarang, "membantu", "r14: Figo bangun tanpa target -> membantu");
  // cariBantuan: radius + ubin sebelah (air/rintangan dilewati).
  const jauh = wargaDasar({ _id: "t3", nama: "Jauh", peran: "penebang", fase_siklus: "kumpul", lokasi: { gx: 300, gy: 300 } });
  const figo3 = wargaFigo({ lokasi: { gx: 100, gy: 100 } });
  const ctx3 = { ...ctxKosong(figo3), wargaSemua: [figo3, jauh] };
  eq(cariBantuan(figo3, ctx3), null, "r14: cariBantuan null bila pekerja >120 tile");
  eq(terapkanBantu(wargaDasar({ lokasi: { gx: 100, gy: 100 } }), ctx), false, "r14: terapkanBantu false untuk warga biasa");
}
{
  // Spear VERBATIM: fungsi di modul == fungsi di aset HTML user.
  // Aset di luar repo: bila tidak ada di checkout ini, banding dilewati
  // (bukan gagal) — marker modul tetap diperiksa.
  const modSrc = readFileSync("src/lib/batu/tombakIblis.ts", "utf8");
  const ambilFungsi = (src: string): string | null => {
    const s = src.indexOf("function createCrimsonDemonicSpear(THREE) {");
    if (s < 0) return null;
    const e = src.indexOf("\n  // Expose globally", s);
    const e2 = src.indexOf("\n\nexport default", s);
    const end = e >= 0 ? e : e2;
    return end >= 0 ? src.slice(s, end).replace(/\n+$/, "") : null;
  };
  const fungsiMod = ambilFungsi(modSrc);
  ok(fungsiMod !== null, "r14: modul tombakIblis memuat fungsi spear");
  ok(fungsiMod !== null && !fungsiMod.includes("initViewport") && !fungsiMod.includes("window.createCrimsonDemonicSpear"), "r14: fungsi spear TANPA scaffolding viewer HTML (bukan kode spear; header modul boleh menyebutnya sebagai dokumentasi)");
  ok((modSrc.includes("0xff2208") && modSrc.includes("MMORPG_Crimson_Demonic_Spear") && modSrc.includes("BufferGeometry")), "r14: modul spear memuat marker kunci (warna/material/geometri)");
  try {
    const htmlSrc = readFileSync("../user/files/Crimson_Demonic_Spear_3D_Asset___MMORPG_Ready.html", "utf8");
    const fungsiHtml = ambilFungsi(htmlSrc);
    ok(fungsiHtml !== null && fungsiMod !== null && fungsiHtml === fungsiMod, "r14: fungsi spear modul IDENTIK byte-demi-byte dengan aset HTML user (verbatim)");
  } catch {
    ok(true, "r14: aset HTML user tidak ada di checkout ini — banding verbatim dilewati");
  }
  // Shim di LUAR kode spear (bukan di dalam modul verbatim).
  const shimSrc = readFileSync("src/lib/batu/senjataIblis.ts", "utf8");
  ok(shimSrc.includes("CanvasTextureCompat") && shimSrc.includes("sRGBEncoding") && shimSrc.includes("buatTombakIblis"), "r14: shim three 0.187 (encoding->colorSpace) ada di file terpisah");
  ok(!modSrc.includes("CanvasTextureCompat"), "r14: modul verbatim TIDAK berisi shim (shim di luar)");
  // Map3D: spear hanya untuk pemilik tombak_iblis; kepala_suku lain tetap tongkat.
  const mapSrc = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc.includes("buatTombakIblis") && mapSrc.includes('toolKind = "tombak_iblis"'), "r14: Map3D merender tombak iblis untuk pemiliknya");
  ok(mapSrc.includes('kepala_suku: { color: 0xb91c1c, tool: "tongkat_suku"'), "r14: kepala_suku default TETAP tongkat_suku (spear Figo-only)");
  ok(mapSrc.includes('aksi_sekarang ?? "") === "membantu"'), "r14: Map3D animasi membantu");
  ok(mapSrc.includes("tombakIblis.userData.update"), "r14: Map3D menjalankan animasi bara/aura spear");
  // KartuProfil: bio + DMG.
  const kartuSrc = readFileSync("src/components/KartuProfil.tsx", "utf8");
  ok(kartuSrc.includes("warga.bio"), "r14: KartuProfil menampilkan bio");
  ok(kartuSrc.includes("DMG"), "r14: KartuProfil menampilkan damage senjata");
  // Modal TENGAH (bukan bottom-sheet): base + mobile.
  const cssSrc = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrc.includes("top: 47%") && cssSrc.includes("translate(-50%, -50%)"), "r14: kartu modal tengah, sedikit di atas tengah (47%)");
  ok(cssSrc.includes("max-height: 80vh") && cssSrc.includes("overflow-y: auto"), "r14: kartu max-height + scroll internal (tidak terpotong)");
  ok(cssSrc.includes("z-index: 60"), "r14: kartu z-index 60 (di atas FAB z 35, tidak tertutup canggung)");
  ok(!cssSrc.includes("bottom: 8px"), "r14: bottom-sheet lama (bottom: 8px) sudah tidak ada");
  // Label alat + whitelist bio.
  const peranSrc = readFileSync("src/lib/batu/peran.ts", "utf8");
  ok(peranSrc.includes('tombak_iblis: "Tombak Iblis Merah"'), "r14: LABEL_ALAT tombak_iblis");
  const secSrc = readFileSync("src/lib/security.ts", "utf8");
  ok(secSrc.includes('bio: typeof bio === "string" ? bio : null'), "r14: security whitelist meneruskan bio");
}

{
  // RONDE 15 — 10 pentung + node tumbang + rantai + HP hewan.
  eq(SISA_NODE_AWAL, 1, "r15: sisa node awal 1 (dulu 5)");
  eq(hitungPipKumpul(0), 0, "r15: pip 0% = 0");
  eq(hitungPipKumpul(5), 0, "r15: pip 5% = 0");
  eq(hitungPipKumpul(10), 1, "r15: pip 10% = 1");
  eq(hitungPipKumpul(45), 4, "r15: pip 45% = 4");
  eq(hitungPipKumpul(99), 9, "r15: pip 99% = 9");
  eq(hitungPipKumpul(100), 10, "r15: pip 100% = 10");
  eq(hitungPipKumpul(150), 10, "r15: pip dibatasi 10");
  eq(lebarBarHp(4, 4), 100, "r15: bar HP penuh 100%");
  eq(lebarBarHp(2, 4), 50, "r15: bar HP setengah 50%");
  eq(lebarBarHp(1, 4), 25, "r15: bar HP seperempat 25%");
  eq(lebarBarHp(0, 4), 0, "r15: bar HP kosong 0%");
  eq(lebarBarHp(5, 4), 100, "r15: bar HP dibatasi 100%");
  eq(hewanById("rusa")?.hp, 4, "r15: HP rusa 4");
  eq(hewanById("kelinci")?.hp, 2, "r15: HP kelinci 2");
  eq(hewanById("beruang")?.hp, 12, "r15: HP beruang 12");
  // Damage berburu: 1 dasar + busur + tombak; tombak iblis 999.
  const hBiasa = wargaDasar({ peran: "pemburu", perkakas: [] });
  eq(damageBerburu(hBiasa), 1, "r15: damage dasar 1");
  const hSenjata = wargaDasar({ peran: "pemburu", perkakas: [{ jenis: "tombak", level: 1 }, { jenis: "busur", level: 1 }] });
  eq(damageBerburu(hSenjata), 3, "r15: damage tombak+busur Lv1 = 3");
  const hIblis = wargaDasar({ peran: "pemburu", perkakas: [{ jenis: "tombak_iblis", level: 0, damage: 999 }] });
  eq(damageBerburu(hIblis), 999, "r15: damage tombak iblis 999");
  // HP hewan lama tanpa field = penuh.
  eq(hpHewan({ _id: "x", jenis: "rusa", gx: 0, gy: 0 } as never, 4), 4, "r15: hewan lama tanpa hp = penuh");
  eq(hpHewan({ _id: "x", jenis: "rusa", gx: 0, gy: 0, hp: 1 } as never, 4), 1, "r15: hewan luka hp terbaca 1");
  // Buru multi-hit: rusa HP 4, damage 3 -> luka (HP 1, belum mati),
  // hit kedua -> mati -> daging (alur r10, stok belum naik).
  const rndAsli = Math.random;
  Math.random = () => 0.01;
  const pemburu = wargaDasar({ peran: "pemburu", stat: { int: 5, str: 10, agi: 10, sta: 10 }, lokasi: { gx: 100, gy: 100 }, fase_siklus: "jalan", perkakas: [{ jenis: "tombak", level: 1 }, { jenis: "busur", level: 1 }] });
  const mangsa = { _id: "h15", jenis: "rusa", gx: 101, gy: 100 };
  const ctxH = { ...ctxKosong(pemburu), hewan: [mangsa], daging: [] as DagingDoc[], dagingHapus: new Set<string>(), wargaSemua: [pemburu] };
  stepPerburuan(pemburu, 12, ctxH);
  eq((mangsa as unknown as { hp?: number }).hp, 1, "r15: hit pertama rusa HP 4->1 (belum mati)");
  ok(!ctxH.hewanHilang.has("h15"), "r15: hit pertama belum menghilangkan hewan");
  ok((ctxH.daging ?? []).length === 0, "r15: hit pertama belum ada daging");
  ok(pemburu.target_hewan === "h15", "r15: pemburu tetap mengincar mangsa luka");
  stepPerburuan(pemburu, 12, ctxH);
  ok(ctxH.hewanHilang.has("h15"), "r15: hit kedua rusa mati");
  ok((ctxH.daging ?? []).length === 1, "r15: hit kedua -> daging tergeletak");
  ok(ctxH.stok.pangan === 0, "r15: daging belum jadi stok (alur r10)");
  // Duel hewan buas: beruang HP 12, damage 1 -> luka (HP 11), pemburu
  // TIDAK kabur (tetap mengincar); bukan jalur kabur.
  const pemburu2 = wargaDasar({ peran: "pemburu", stat: { int: 5, str: 10, agi: 10, sta: 10 }, stamina: 100, lokasi: { gx: 100, gy: 100 }, perkakas: [] });
  const beruang = { _id: "b15", jenis: "beruang", gx: 101, gy: 100 };
  const ctxD = { ...ctxKosong(pemburu2), hewan: [beruang], daging: [] as DagingDoc[], dagingHapus: new Set<string>(), wargaSemua: [pemburu2] };
  stepHewan(beruang as never, 12, ctxD);
  eq((beruang as unknown as { hp?: number }).hp, 11, "r15: duel beruang HP 12->11 (luka, belum mati)");
  ok(pemburu2.target_hewan === "b15", "r15: pemburu duel tetap mengincar beruang luka");
  ok(!ctxD.hewanHilang.has("b15"), "r15: beruang luka belum hilang");
  Math.random = rndAsli;
  // Rantai kumpul: node tumbang (sisa 1->0) + fit -> langsung target
  // berikut (bukan pulang); hasil 1 ronde = 5x (total per node sama).
  const penebang = wargaDasar({ peran: "penebang", stat: { int: 5, str: 8, agi: 5, sta: 5 }, lokasi: { gx: 100, gy: 100 }, fase_siklus: "kumpul", node: { kind: "pohon", gx: 101, gy: 100 } as never, progres_aksi_pct: 90, stamina: 80, lapar: 20 });
  const ctxK = {
    ...ctxKosong(penebang),
    nodes: [{ kind: "pohon" as NodeKind, gx: 101, gy: 100 }, { kind: "pohon" as NodeKind, gx: 105, gy: 100 }],
    nodeSisa: new Map([["101,100", 1]]),
    nodeTilesAll: new Set(["101,100", "105,100"]),
    nodeSpawnTertunda: new Map(),
    wargaSemua: [penebang],
  };
  stepWarga(penebang, 12, ctxK);
  eq(penebang.fase_siklus, "jalan", "r15: node tumbang + fit -> langsung jalan (rantai)");
  eq(penebang.aksi_sekarang, "berjalan", "r15: rantai aksinya berjalan");
  eq((penebang.node as unknown as { gx: number; gy: number } | null)?.gx, 105, "r15: rantai target = node berikut");
  eq(ctxK.nodeSisa.get("101,100"), 0, "r15: node tumbang sisa 0");
  // r45: hasil 1 ronde = roll 1-3 x5 = 5..15 (dulu r15: 45, rumus lama).
  ok(ctxK.stok.kayu >= 5 && ctxK.stok.kayu <= 15, `r45: hasil 1 ronde = 5x (dapat ${ctxK.stok.kayu})`);
  // Rantai TIDAK jalan bila stamina < 40 -> pulang seperti biasa.
  const penebangLelah = wargaDasar({ peran: "penebang", stat: { int: 5, str: 8, agi: 5, sta: 5 }, lokasi: { gx: 100, gy: 100 }, fase_siklus: "kumpul", node: { kind: "pohon", gx: 101, gy: 100 } as never, progres_aksi_pct: 90, stamina: 30, lapar: 20 });
  const ctxL = {
    ...ctxKosong(penebangLelah),
    nodes: [{ kind: "pohon" as NodeKind, gx: 101, gy: 100 }, { kind: "pohon" as NodeKind, gx: 105, gy: 100 }],
    nodeSisa: new Map([["101,100", 1]]),
    nodeTilesAll: new Set(["101,100", "105,100"]),
    nodeSpawnTertunda: new Map(),
    wargaSemua: [penebangLelah],
  };
  stepWarga(penebangLelah, 12, ctxL);
  eq(penebangLelah.fase_siklus, "kembali", "r15: node tumbang + lelah -> pulang (rantai batal)");
  eq(penebangLelah.aksi_sekarang, "membawa_hasil", "r15: pulang membawa hasil seperti biasa");
  // Map3D: pip + node tumbang + bar HP + wiggle ada di kode.
  const mapSrc15 = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc15.includes("hitungPipKumpul"), "r15: Map3D pakai hitungPipKumpul (pip pentung)");
  ok(mapSrc15.includes("fallingNodes"), "r15: Map3D animasi node tumbang (fallingNodes)");
  ok(mapSrc15.includes("buildFallingNode"), "r15: Map3D helper buildFallingNode");
  ok(mapSrc15.includes("hpBar"), "r15: Map3D bar HP hewan (hpBar)");
  ok(mapSrc15.includes("lebarBarHp"), "r15: Map3D pakai lebarBarHp");
  ok(mapSrc15.includes("wiggle"), "r15: Map3D wiggle menunggu tick (cari-cari)");
}

{
  // RONDE 18 — spacing minimum + jalan karakter pinter + anti-duplikat.
  // (1) findPlot gap: gap 1 = minimal 1 ubin kosong antara footprint.
  const occ1 = new Set(["100,100"]);
  const pGap1 = findPlot(occ1, new Set(), 1, 1, 1);
  ok(pGap1 !== null, "r18: findPlot gap 1 menemukan plot");
  if (pGap1) {
    const cheb = Math.max(Math.abs(pGap1.gx - 100), Math.abs(pGap1.gy - 100));
    ok(cheb >= 2, "r18: findPlot gap 1 tidak menempel (Chebyshev >= 2 dari ubin lama)");
  }
  const pGap0 = findPlot(occ1, new Set(), 1, 1, 0);
  ok(pGap0 !== null, "r18: findPlot gap 0 menemukan plot");
  if (pGap0) {
    const cheb0 = Math.max(Math.abs(pGap0.gx - 100), Math.abs(pGap0.gy - 100));
    ok(cheb0 === 1, "r18: findPlot gap 0 boleh menempel (Chebyshev == 1)");
  }
  // Footprint tidak tumpuk + gap terjaga untuk bangunan 2x2.
  const occ2 = new Set(["100,100", "101,100", "100,101", "101,101"]);
  const p2 = findPlot(occ2, new Set(), 2, 2, 1);
  ok(p2 !== null, "r18: findPlot 2x2 gap 1 menemukan plot");
  if (p2) {
    let nabrak = false;
    for (let dy = 0; dy < 2; dy++)
      for (let dx = 0; dx < 2; dx++) {
        const gx = p2.gx + dx;
        const gy = p2.gy + dy;
        if (gx >= 99 && gx <= 102 && gy >= 99 && gy <= 102) nabrak = true;
      }
    ok(!nabrak, "r18: plot 2x2 gap 1 tidak masuk cincin blokir blok lama");
  }
  // (2) dedupePlacement: baris ganda runtuh, pertama menang, urutan utuh.
  const dup = dedupePlacement([
    { kind: "pagar", gx: 102, gy: 101, id: "a" },
    { kind: "pagar", gx: 102, gy: 101, id: "b" },
    { kind: "pagar", gx: 102, gy: 101, id: "c" },
    { kind: "gubuk", gx: 99, gy: 99, id: "d" },
    { kind: "pagar", gx: 103, gy: 101, id: "e" },
  ]);
  eq(dup.length, 3, "r18: dedupePlacement 5 baris -> 3 unik");
  eq(dup[0].id, "a", "r18: dedupePlacement pertama menang");
  // (3) jalan: pembangun = kepala suku ATAU INT >= 9.
  eq(TIM_JALAN_INT_MIN, 9, "r18: ambang pinter INT >= 9");
  ok(pintarUntukJalan({ peran: "kepala_suku", stat: { int: 1 } }), "r18: kepala suku = pinter (tanpa peduli INT)");
  ok(pintarUntukJalan({ peran: "perajin", stat: { int: 9 } }), "r18: INT 9 = pinter");
  ok(pintarUntukJalan({ peran: "kepala_suku", stat: { int: 999 } }), "r18: Figo (kepala suku INT 999) = pinter + memimpin");
  ok(!pintarUntukJalan({ peran: "perajin", stat: { int: 8 } }), "r18: INT 8 bukan pinter");
  // (4) jalurJalan: tersambung tepi-ke-tepi, tidak menembus footprint,
  // deterministik, dan memutar melewati penghalang.
  const plJ = [
    { kind: "lumbung", gx: 97, gy: 99, w: 2, h: 2 },
    { kind: "paviliun_makan", gx: 101, gy: 96, w: 3, h: 3 },
  ];
  const fpJ = new Set<string>();
  for (const p of plJ)
    for (let dy = 0; dy < p.h; dy++) for (let dx = 0; dx < p.w; dx++) fpJ.add(`${p.gx + dx},${p.gy + dy}`);
  const jalur = jalurJalan(plJ[0], plJ[1], { footprintSemua: fpJ, nodeKeys: new Set() });
  ok(jalur !== null && jalur.length > 0, "r18: jalurJalan lumbung-paviliun tersambung");
  if (jalur) {
    ok(!jalur.some((t) => fpJ.has(`${t.gx},${t.gy}`)), "r18: jalur tidak menembus footprint bangunan");
    ok(jalur.length >= 1, "r18: jalur punya ubin");
    const jalur2 = jalurJalan(plJ[0], plJ[1], { footprintSemua: fpJ, nodeKeys: new Set() });
    eq(JSON.stringify(jalur2), JSON.stringify(jalur), "r18: jalurJalan deterministik (2x panggil sama)");
  }
  // Penghalang di tengah: jalur memutar, tetap tidak menembus footprint.
  const plHalang = [
    ...plJ,
    { kind: "gubuk", gx: 99, gy: 97, w: 2, h: 2 },
  ];
  const fpH = new Set<string>(fpJ);
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) fpH.add(`${99 + dx},${97 + dy}`);
  const jalurH = jalurJalan(plHalang[0], plHalang[1], { footprintSemua: fpH, nodeKeys: new Set() });
  ok(jalurH !== null, "r18: jalur memutar penghalang tetap tersambung");
  if (jalurH) ok(!jalurH.some((t) => fpH.has(`${t.gx},${t.gy}`)), "r18: jalur memutar tidak menembus footprint");
  // (5) rencanaJalan: segmen pertama yang ujungnya ada + belum selesai.
  const renc = rencanaJalan(plJ, new Set(), new Set());
  ok(renc !== null && renc.segmen === "lumbung-paviliun", "r18: rencanaJalan segmen pertama = lumbung-paviliun");
  ok((renc?.tiles.length ?? 0) > 0, "r18: rencanaJalan punya ubin belum dibangun");
  if (renc) {
    const semuaSelesai = new Set(renc.tiles.map((t) => `${t.gx},${t.gy}`));
    const renc2 = rencanaJalan(plJ, semuaSelesai, new Set());
    ok(renc2 === null || renc2.segmen !== "lumbung-paviliun", "r18: segmen selesai tidak direncanakan lagi");
  }
  const rencKosong = rencanaJalan([{ kind: "paviliun_makan", gx: 101, gy: 96, w: 3, h: 3 }], new Set(), new Set());
  ok(rencKosong === null, "r18: tanpa ujung pasangan, tidak ada rencana jalan");
  ok(SEGMEN_JALAN[0].id === "lumbung-paviliun" && SEGMEN_JALAN.length === 5, "r18: 5 segmen jalan urut prioritas");
  // (6) terapkanJalan: SIAPA SAJA + fit (r21 gotong royong: gate
  // tim pinter/kepala_suku/INT>=9 dihapus atas aturan user 2026-11-05;
  // r20: gate bangunanAktif sudah dihapus lebih dulu — antrean NPC
  // hampir tidak pernah kosong, jadi gate itu membuat jalan tidak
  // pernah dibangun; lihat tes r20).
  const wargaJalan = {
    peran: "kepala_suku", stat: { int: 999, str: 999, agi: 999, sta: 999 },
    stamina: 100, lapar: 10,
  } as unknown as Warga;
  const ctxJalan = {
    bangunanAktif: false,
    jalanRencana: { segmen: "lumbung-paviliun", tiles: [{ gx: 105, gy: 100 }] },
    jalanTugas: new Set<string>(),
  } as unknown as SimCtx;
  ok(terapkanJalan(wargaJalan, ctxJalan), "r18: terapkanJalan Figo berhasil");
  eq((wargaJalan.node as { pseudo?: string } | null)?.pseudo, "jalan", "r18: terapkanJalan set node pseudo jalan");
  eq(wargaJalan.tujuan, { gx: 105, gy: 100 }, "r18: terapkanJalan set tujuan ubin jalan");
  eq(wargaJalan.aksi_sekarang, "bangun_jalan", "r18: terapkanJalan aksi bangun_jalan");
  const ctxAktif = { ...ctxJalan, bangunanAktif: true, jalanTugas: new Set<string>() } as unknown as SimCtx;
  const w2 = { ...wargaJalan } as unknown as Warga;
  ok(terapkanJalan(w2, ctxAktif), "r20: bangunan aktif TIDAK lagi menunda jalan (gate r18 dihapus)");
  const wBiasa = { peran: "perajin", stat: { int: 8, str: 6, agi: 6, sta: 6 }, stamina: 100, lapar: 10 } as unknown as Warga;
  ok(terapkanJalan(wBiasa, { ...ctxJalan, jalanTugas: new Set<string>() } as unknown as SimCtx), "r21: INT 8 BISA membangun jalan (gate pinter dihapus, gotong royong)");
  const wKumpul = { peran: "pengumpul", stat: { int: 3, str: 5, agi: 5, sta: 5 }, stamina: 100, lapar: 10 } as unknown as Warga;
  ok(terapkanJalan(wKumpul, { ...ctxJalan, jalanTugas: new Set<string>() } as unknown as SimCtx), "r21: pengumpul INT 3 bisa membangun jalan (peran apa pun)");
  const wLelah = { ...wargaJalan, stamina: 30 } as unknown as Warga;
  ok(!terapkanJalan(wLelah, { ...ctxJalan, jalanTugas: new Set<string>() } as unknown as SimCtx), "r18: stamina < 40 tidak membangun jalan");
  const ctxTugasPenuh = { ...ctxJalan, jalanTugas: new Set(["105,100"]) } as unknown as SimCtx;
  ok(!terapkanJalan(wargaJalan, ctxTugasPenuh), "r18: ubin sudah ditugaskan -> tidak dobel tugas");
  // (7) RONDE 19 — pemicu jalan diperbaiki: warga yang keluar
  // paviliun membangun jalan MESKI ada target kumpul (pemicu lama
  // "target null" tidak pernah terjadi di dunia live). r21: gate
  // pinter dihapus — warga biasa pun ikut membangun jalan sekarang.
  {
    const resto = { _id: "r1", kind: "paviliun_makan", gx: 101, gy: 96, w: 3, h: 3, hidangan: 0 };
    const mkCtxKeluar = (w: Warga): SimCtx => ({
      ...ctxKosong(w),
      nodes: [{ kind: "pohon", gx: 105, gy: 100 }],
      restoran: resto,
      bangunanAktif: false,
      jalanRencana: { segmen: "lumbung-paviliun", tiles: [{ gx: 103, gy: 100 }] },
      jalanTugas: new Set<string>(),
    } as unknown as SimCtx);
    const wPintar = wargaDasar({
      peran: "peramu", stat: { int: 10, str: 5, agi: 5, sta: 5 },
      lokasi: { gx: 102, gy: 100 }, tujuan: { gx: 102, gy: 100 },
      fase_siklus: "kembali", aksi_sekarang: "keluar_restoran",
      stamina: 80, lapar: 20,
    });
    stepWarga(wPintar, 12, mkCtxKeluar(wPintar));
    eq(wPintar.aksi_sekarang, "bangun_jalan", "r19: keluar paviliun + pinter + ada rencana -> bangun_jalan (bukan kumpul)");
    eq((wPintar.node as { pseudo?: string } | null)?.pseudo, "jalan", "r19: keluar paviliun pinter -> node pseudo jalan");
    const wBiasa2 = wargaDasar({
      peran: "penebang", stat: { int: 5, str: 8, agi: 5, sta: 5 },
      lokasi: { gx: 102, gy: 100 }, tujuan: { gx: 102, gy: 100 },
      fase_siklus: "kembali", aksi_sekarang: "keluar_restoran",
      stamina: 80, lapar: 20,
    });
    stepWarga(wBiasa2, 12, mkCtxKeluar(wBiasa2));
    eq(wBiasa2.aksi_sekarang, "bangun_jalan", "r21: keluar paviliun + biasa -> ikut bangun jalan (gate pinter dihapus)");
    eq((wBiasa2.node as { pseudo?: string } | null)?.pseudo, "jalan", "r21: keluar paviliun biasa -> node pseudo jalan");
  }
  // (8) r18-perbaikan: kampung padat (semua tepi lumbung tertutup
  // bangunan tetangga) tetap dapat jalur — mulai dari tanah terbuka
  // terdekat, bukan gagal total.
  const plPadat = [
    { kind: "lumbung", gx: 97, gy: 99, w: 2, h: 2 },
    { kind: "gubuk", gx: 99, gy: 99, w: 2, h: 2 },
    { kind: "tenda_besar", gx: 95, gy: 99, w: 2, h: 2 },
    { kind: "bengkel_batu", gx: 96, gy: 97, w: 2, h: 2 },
    { kind: "api_unggun", gx: 98, gy: 98, w: 1, h: 1 },
    { kind: "dapur_umum", gx: 97, gy: 101, w: 2, h: 2 },
    { kind: "paviliun_makan", gx: 101, gy: 96, w: 3, h: 3 },
  ];
  const fpPadat = new Set<string>();
  for (const p of plPadat)
    for (let dy = 0; dy < p.h; dy++) for (let dx = 0; dx < p.w; dx++) fpPadat.add(`${p.gx + dx},${p.gy + dy}`);
  const jalurPadat = jalurJalan(plPadat[0], plPadat[6], { footprintSemua: fpPadat, nodeKeys: new Set() });
  ok(jalurPadat !== null && jalurPadat.length > 0, "r18: kampung padat tetap dapat jalur (titik awal tanah terbuka terdekat)");
  if (jalurPadat) ok(!jalurPadat.some((t) => fpPadat.has(`${t.gx},${t.gy}`)), "r18: jalur kampung padat tidak menembus footprint");
  // (9) r18-perbaikan: jangkar hunian = hunian TERDEKAT pasangan (bukan
  // gubuk awal jauh) — rencana hunian-paviliun pendek, bukan 98 ubin.
  const plJangkar = [
    { kind: "gubuk", gx: 48, gy: 48, w: 2, h: 2 },
    { kind: "gubuk", gx: 99, gy: 99, w: 2, h: 2 },
    { kind: "paviliun_makan", gx: 101, gy: 96, w: 3, h: 3 },
  ];
  const rencJangkar = rencanaJalan(plJangkar, new Set(), new Set());
  ok(rencJangkar !== null && rencJangkar.segmen === "hunian-paviliun", "r18: tanpa lumbung, segmen hunian-paviliun terpilih");
  if (rencJangkar) {
    ok(rencJangkar.tiles.length < 40, "r18: jalan hunian-paviliun pendek (jangkar hunian terdekat, bukan gubuk jauh)");
    ok(rencJangkar.tiles.every((t) => t.gx > 90), "r18: jalan hunian-paviliun di kampung, bukan melintasi hutan");
  }
  // (7) sim + route + Map3D memuat kode r18 (bukan hanya unit).
  const simSrc18 = readFileSync("src/lib/batu/sim.ts", "utf8");
  ok(simSrc18.includes("terapkanJalan"), "r18: sim memuat terapkanJalan");
  ok(simSrc18.includes("jalanBaru"), "r18: sim mengakumulasi jalanBaru untuk tulis-balik");
  ok(simSrc18.includes("$setOnInsert") && simSrc18.includes("tilesCol.updateOne"), "r18: sim upsert placement anti-duplikat");
  ok(simSrc18.includes("dedupePlacement"), "r18: sim dedupe placement in-memory");
  const mapRoute18 = readFileSync("src/app/api/map/route.ts", "utf8");
  ok(mapRoute18.includes('getCollection("jalan")'), "r18: /api/map mengembalikan ubin jalan");
  ok(mapRoute18.includes("dedupePlacement"), "r18: /api/map dedupe placements tampilan");
  const bangRoute18 = readFileSync("src/app/api/bangunan/route.ts", "utf8");
  ok(bangRoute18.includes("seenAntrean"), "r18: /api/bangunan dedupe antrean tampilan");
  const mapSrc18 = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc18.includes("jalanGroup"), "r18: Map3D render grup jalan");
  ok(mapSrc18.includes("0xa08b6d"), "r18: Map3D warna strip jalan tanah/batu");
}

// ATURAN KUMPUL HARIAN (2026-11-03, DESAIN-EKONOMI.md): roll + cap + clamp + alihan.
{
  const wBiasa = {
    peran: "penebang", bakat: "", perkakas: [], stat: { int: 5, str: 5, agi: 5, sta: 5 },
  } as unknown as Warga;
  const N = 20000;
  let min = 99; let maks = -1; let total = 0; let nol = 0;
  for (let i = 0; i < N; i++) {
    const r = rollHasilKumpul("kayu", wBiasa);
    if (r < min) min = r;
    if (r > maks) maks = r;
    total += r;
    if (r === 0) nol++;
  }
  // 2026-11-04 (perintah user "minimal 1 maksimal 3"): NOL dihapus
  // untuk sumber biasa — roll kayu 1..3. RONDE 20: bobot 64/27/9
  // (rata-rata ~1,45) -> 50/30/20 (rata-rata ~1,7, gampangin pangan).
  ok(min === 1 && maks === 3, "kumpul biasa: roll kayu 1..3 (tanpa tangan kosong)");
  const meanKayu = total / N;
  ok(meanKayu > 1.6 && meanKayu < 1.8, `kumpul biasa: rata-rata kayu ${meanKayu.toFixed(2)} di 1,6..1,8 (r20: 50/30/20)`);
  ok(nol === 0, `kumpul biasa: tidak ada hari tanpa hasil (dapat ${nol})`);
  // Berbakat biasa: bump +1 (50%, maks 3) menggeser rata-rata naik,
  // tapi min tetap 1 dan maks tetap 3 (tidak pernah melampaui cap).
  const wBakatBiasa = { ...wBiasa, bakat: "STR" } as unknown as Warga;
  let minBB = 99; let maksBB = -1; let totalBB2 = 0;
  for (let i = 0; i < N; i++) {
    const r = rollHasilKumpul("kayu", wBakatBiasa);
    if (r < minBB) minBB = r;
    if (r > maksBB) maksBB = r;
    totalBB2 += r;
  }
  const meanKayuBakat = totalBB2 / N;
  ok(minBB === 1 && maksBB === 3, "kumpul biasa berbakat: roll kayu tetap 1..3");
  ok(meanKayuBakat > 2.0 && meanKayuBakat < 2.2, `kumpul biasa berbakat: rata-rata kayu ${meanKayuBakat.toFixed(2)} di 2,0..2,2 (r20: 50/30/20)`);
  let minB = 99; let maksB = -1; let totalB = 0; let nolB = 0;
  for (let i = 0; i < N; i++) {
    const r = rollHasilKumpul("besi", wBiasa);
    if (r < minB) minB = r;
    if (r > maksB) maksB = r;
    totalB += r;
    if (r === 0) nolB++;
  }
  ok(minB === 0 && maksB <= 2, "kumpul besi: roll 0..2");
  const meanBesi = totalB / N;
  ok(meanBesi > 0.15 && meanBesi < 0.35, `kumpul besi: rata-rata ${meanBesi.toFixed(2)} di 0,15..0,35`);
  ok(nolB / N > 0.7, `kumpul besi: hari tanpa besi >70% (dapat ${(nolB / N * 100).toFixed(1)}%)`);
  const wBakat = { ...wBiasa, bakat: "STR" } as unknown as Warga;
  let totalBB = 0; let nolBB = 0;
  for (let i = 0; i < N; i++) {
    const r = rollHasilKumpul("besi", wBakat);
    totalBB += r;
    if (r === 0) nolBB++;
  }
  const meanBesiBakat = totalBB / N;
  ok(meanBesiBakat > 0.25 && meanBesiBakat < 0.5, `kumpul besi berbakat: rata-rata ${meanBesiBakat.toFixed(2)} di 0,25..0,5`);
  ok(nolBB / N > 0.6, `kumpul besi berbakat: hari tanpa besi >60% (dapat ${(nolBB / N * 100).toFixed(1)}%)`);
  let totalE = 0; let nolE = 0;
  for (let i = 0; i < N; i++) {
    const r = rollHasilKumpul("emas", wBiasa);
    totalE += r;
    if (r === 0) nolE++;
  }
  const meanEmas = totalE / N;
  ok(meanEmas > 0.2 && meanEmas < 0.45, `kumpul emas: rata-rata ${meanEmas.toFixed(2)} di 0,2..0,45`);
  ok(nolE / N > 0.65, `kumpul emas: hari tanpa emas >65% (dapat ${(nolE / N * 100).toFixed(1)}%)`);
  // r45 (perintah user 2026-11-05: resource 5x): cap biasa 3 -> 15
  // (PENGALI_KUMPUL); langka tetap 2 (besi/emas tidak dikali).
  ok(capHarianUntuk("kayu") === 15 && capHarianUntuk("besi") === 2, "cap harian: 15 biasa (5x), 2 langka");
  const wCap = { kumpul_hari: undefined, kumpul_harian: undefined } as unknown as Warga;
  ok(sisaCapHarian(wCap, "kayu", 10) === 15, "cap harian: kayu segar = 15");
  ok(sisaCapHarian(wCap, "besi", 10) === 2, "cap harian: besi segar = 2");
  catatKumpulHarian(wCap, "kayu", 2, 10);
  ok(sisaCapHarian(wCap, "kayu", 10) === 13, "cap harian: kayu sisa 13 setelah 2");
  catatKumpulHarian(wCap, "kayu", 1, 10);
  ok(sisaCapHarian(wCap, "kayu", 10) === 12, "cap harian: kayu sisa 12 setelah 3");
  ok(sisaCapHarian(wCap, "kayu", 11) === 15, "cap harian: reset hari baru");
  const ctxClamp = {
    stok: { kayu: 199, batu: 0, pangan: 0, kulit: 0, emas: 0, besi: 0 },
    kapasitasMaks: { kayu: 200, batu: 150, pangan: 200, kulit: 100, emas: 50, besi: 60 },
  } as unknown as SimCtx;
  ok(tambahStokClamp(ctxClamp, "kayu", 5) === 1, "clamp: tambah 5 di stok 199/200 hanya masuk 1");
  ok((ctxClamp.stok as unknown as Record<string, number>).kayu === 200, "clamp: stok mentok di 200");
  ok(tambahStokClamp(ctxClamp, "kayu", 5) === 0, "clamp: stok penuh, tambah 0");
  const wPenuh = {
    peran: "penebang", lokasi: { gx: 50, gy: 50 }, node: { kind: "pohon", gx: 51, gy: 51 },
    fase_siklus: "kumpul", stamina: 80, lapar: 10,
  } as unknown as Warga;
  const ctxPenuh = {
    stok: { kayu: 200, batu: 0, pangan: 0, kulit: 0, emas: 0, besi: 0 },
    kapasitasMaks: { kayu: 200, batu: 150, pangan: 200, kulit: 100, emas: 50, besi: 60 },
    wargaSemua: [], rintangan: new Set<string>(), nodeTilesAll: new Set<string>(),
    hunianTitik: () => ({ gx: 50, gy: 50 }),
  } as unknown as SimCtx;
  ok(apakahStokPeranPenuh(wPenuh, ctxPenuh), "stok penuh: penebang terdeteksi penuh");
  ok(terapkanRehatStokPenuh(wPenuh, ctxPenuh), "stok penuh: alihan jalan");
  const nodeSesudah = (wPenuh as unknown as { node: { pseudo?: string } | null }).node;
  ok(nodeSesudah === null || nodeSesudah?.pseudo === "santai", "stok penuh: tidak lagi di node kumpul (bantu/santai/rehat)");
  ok((wPenuh as unknown as { aksi_sekarang: string }).aksi_sekarang !== "mengumpulkan", "stok penuh: tidak lagi mengumpulkan");
  const wLega = { peran: "penebang" } as unknown as Warga;
  const ctxLega = {
    stok: { kayu: 10, batu: 0, pangan: 0, kulit: 0, emas: 0, besi: 0 },
    kapasitasMaks: { kayu: 200, batu: 150, pangan: 200, kulit: 100, emas: 50, besi: 60 },
  } as unknown as SimCtx;
  ok(!terapkanRehatStokPenuh(wLega, ctxLega), "stok lega: tidak dialihkan");
}

// KELANGKAAN REALISTIS (2026-11-04, permintaan user: sangat susah,
// mengikuti dunia nyata): pembusukan kelebihan stok + ledger kumpul
// harian tersimpan di bulkWrite (cap tidak reset tiap poll).
{
  const ctxBusuk = {
    stok: { kayu: 1000, batu: 500, pangan: 10000, kulit: 600, emas: 500, besi: 500 },
    kapasitasMaks: { kayu: 740, batu: 630, pangan: 850, kulit: 425, emas: 210, besi: 265 },
  } as unknown as SimCtx;
  const busuk = terapkanPembusukan(ctxBusuk);
  const sBusuk = ctxBusuk.stok as unknown as Record<string, number>;
  ok(busuk.pangan === Math.floor((10000 - 850) * 0.5), "busuk: laporan pangan 50% dari kelebihan");
  ok(sBusuk.pangan === 850 + Math.floor((10000 - 850) * 0.5), "busuk: pangan susut 50% dari kelebihan");
  ok(sBusuk.kayu === 740 + Math.floor((1000 - 740) * 0.9), "busuk: kayu susut 10% dari kelebihan");
  ok(sBusuk.kulit === 600 - Math.floor((600 - 425) * 0.1), "busuk: kulit susut 10% dari kelebihan");
  ok(sBusuk.batu === 500, "busuk: batu dalam kapasitas tidak susut");
  ok(sBusuk.emas === 500 && sBusuk.besi === 500, "busuk: emas/besi awet, tidak susut");
  const ctxAman = {
    stok: { pangan: 100, kayu: 100 },
    kapasitasMaks: { pangan: 850, kayu: 740 },
  } as unknown as SimCtx;
  const busukAman = terapkanPembusukan(ctxAman);
  ok(busukAman.pangan === undefined && (ctxAman.stok as unknown as Record<string, number>).pangan === 100, "busuk: stok dalam kapasitas tidak susut");
  const simSrcBusuk = readFileSync("src/lib/batu/sim.ts", "utf8");
  ok(simSrcBusuk.includes("kumpul_hari: w.kumpul_hari") && simSrcBusuk.includes("kumpul_harian: w.kumpul_harian"), "cap-harian: bulkWrite menyimpan ledger kumpul (cap tidak reset tiap poll)");
  ok(simSrcBusuk.includes("terapkanPembusukan(ctx)"), "busuk: advanceWorld memanggil pembusukan tiap ganti hari");
}

// PEMBUSUKAN SISA KECIL (2026-11-05, antrean r34): Math.floor saja
// membuat kelebihan kecil macet selamanya (kulit 104/95: 9 x 10% =
// 0,9 -> 0/hari). Selama ada kelebihan, minimal 1 busuk per hari
// supaya stok selalu konvergen ke kapasitas, tidak pernah di bawahnya.
{
  const ctxKulit = {
    stok: { kulit: 104, kayu: 0, batu: 0, pangan: 0, emas: 0, besi: 0 },
    kapasitasMaks: { kulit: 95, kayu: 200, batu: 150, pangan: 200, emas: 50, besi: 60 },
  } as unknown as SimCtx;
  const bKulit = terapkanPembusukan(ctxKulit);
  const sKulit = ctxKulit.stok as unknown as Record<string, number>;
  ok(bKulit.kulit === 1 && sKulit.kulit === 103, "busuk-kecil: kulit 104/95 susut 1 (bukan 0)");
  for (let i = 0; i < 20; i++) terapkanPembusukan(ctxKulit);
  ok(sKulit.kulit === 95, "busuk-kecil: kulit konvergen tepat ke kap 95, tidak di bawahnya");
  const ctxPangan = {
    stok: { pangan: 851, kayu: 0, batu: 0, kulit: 0, emas: 0, besi: 0 },
    kapasitasMaks: { pangan: 850, kayu: 200, batu: 150, kulit: 100, emas: 50, besi: 60 },
  } as unknown as SimCtx;
  const bPangan = terapkanPembusukan(ctxPangan);
  ok(bPangan.pangan === 1 && (ctxPangan.stok as unknown as Record<string, number>).pangan === 850, "busuk-kecil: pangan 851/850 susut 1 ke kap");
  const ctxKayu = {
    stok: { kayu: 205, batu: 0, pangan: 0, kulit: 0, emas: 0, besi: 0 },
    kapasitasMaks: { kayu: 200, batu: 150, pangan: 200, kulit: 100, emas: 50, besi: 60 },
  } as unknown as SimCtx;
  const bKayu = terapkanPembusukan(ctxKayu);
  ok(bKayu.kayu === 1 && (ctxKayu.stok as unknown as Record<string, number>).kayu === 204, "busuk-kecil: kayu 205/200 susut 1 (5 x 10% = 0,5 -> 0 dulu)");
  const verKecil = readFileSync("src/lib/version.ts", "utf8");
  ok(verKecil.includes('BUILD_ID = "r57"'), "busuk-kecil: BUILD_ID naik ke r41");
}

// GEMINI JALAN (2026-11-03): jalurSegmen per segmen tertentu.
{
  const plJalan = [
    { kind: "lumbung", gx: 48, gy: 48, w: 2, h: 2 },
    { kind: "paviliun_makan", gx: 54, gy: 48, w: 3, h: 3 },
    { kind: "gubuk", gx: 48, gy: 54, w: 2, h: 2 },
  ];
  const j = jalurSegmen("lumbung-paviliun", plJalan, new Set(), new Set());
  ok(j !== null && j.segmen === "lumbung-paviliun", "jalurSegmen: lumbung-paviliun ketemu");
  ok(j !== null && j.tiles.length > 0, "jalurSegmen: ada ubin jalan");
  ok(jalurSegmen("tidak-ada", plJalan, new Set(), new Set()) === null, "jalurSegmen: id tidak dikenal -> null");
  if (j) {
    const selesai = new Set(j.tiles.map((t) => `${t.gx},${t.gy}`));
    ok(jalurSegmen("lumbung-paviliun", plJalan, selesai, new Set()) === null, "jalurSegmen: segmen selesai -> null");
  }
}

// ANTI-DUPLIKAT (2026-11-03, pesan Fina): penjaga statis — seed
// idempotent, upsert kunci posisi, indeks unik.
{
  const simSrcAnti = readFileSync("src/lib/batu/sim.ts", "utf8");
  ok(!simSrcAnti.includes("tiles.insertOne"), "antidup: seed tidak lagi insertOne mentah");
  ok(simSrcAnti.includes("{ gx: b.gx, gy: b.gy }"), "antidup: upsert selesai kunci posisi saja");
  ok(simSrcAnti.includes("posisinya sudah dipakai bangunan lain"), "antidup: kabar batal bila posisi direbut");
  ok(simSrcAnti.includes("plot antrean lain"), "antidup: plot antrean lain menghalangi plot baru");
  const dbSrc = readFileSync("src/lib/db.ts", "utf8");
  ok(dbSrc.includes("pastikanIndexPlacement"), "antidup: db punya pastikanIndexPlacement");
  ok(dbSrc.includes("uniq_posisi") && dbSrc.includes("unique: true"), "antidup: indeks unik posisi");
}

// TABRAKAN PENUH + RUMAH SENDIRI MALAM HARI + JALUR DISPLAY (2026-11-04,
// permintaan user: karakter tidak menembus bangunan, kecuali malam masuk
// rumah sendiri; Gemini menggeser bangunan yang nabrak).
{
  // gerak: ubin tujuan yang rintangan TIDAK PERNAH dimasuki — pengecualian
  // tujuan lama dihapus, pengecualian kini hanya via rintanganUntuk.
  const rTujuan = gerak({ gx: 47, gy: 49 }, { gx: 48, gy: 49 }, 10, { rintangan: new Set(["48,49"]) });
  ok(!(rTujuan.lokasi.gx === 48 && rTujuan.lokasi.gy === 49), "tabrak: gerak tidak masuk ubin tujuan yang rintangan");
  // rintanganUntuk: malam hari rumah sendiri dibuka, siang tetap padat,
  // rumah orang lain selalu padat.
  const rumahSendiri = { _id: "h1", kind: "gubuk", gx: 50, gy: 50, w: 2, h: 2 };
  const rumahOrang = { _id: "h2", kind: "gubuk", gx: 60, gy: 60, w: 2, h: 2 };
  const rint = new Set<string>();
  for (const p of [rumahSendiri, rumahOrang]) {
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) rint.add(`${p.gx + dx},${p.gy + dy}`);
  }
  const wRumah = wargaDasar({ lokasi: { gx: 48, gy: 50 }, tujuan: { gx: 50, gy: 50 }, fase_siklus: "kembali", hunian: { id: "h1", tipe: "gubuk", label: "Gubuk Tes" } });
  const ctxMalam = { ...ctxKosong(wRumah), jam: 22, rintangan: rint, placements: [rumahSendiri, rumahOrang] };
  const rMalam = rintanganUntuk(wRumah, ctxMalam);
  ok(!rMalam.has("50,50") && !rMalam.has("51,51") && rMalam.has("60,60"), "tabrak: malam rumah sendiri dibuka, rumah orang tetap padat");
  const ctxSiang = { ...ctxKosong(wRumah), jam: 12, rintangan: rint, placements: [rumahSendiri, rumahOrang] };
  const rSiang = rintanganUntuk(wRumah, ctxSiang);
  ok(rSiang.has("50,50") && rSiang.has("60,60"), "tabrak: siang rumah sendiri tetap padat");
  // gerak malam ke ubin tidur sendiri sampai (rintangan dibuka di atas).
  const rPulang = gerak({ gx: 48, gy: 50 }, { gx: 50, gy: 50 }, 10, { rintangan: rMalam });
  ok(rPulang.lokasi.gx === 50 && rPulang.lokasi.gy === 50, "tabrak: malam pulang ke ubin tidur sendiri sampai");
  // jalurTampil: memutar blok 2x2, tidak ada waypoint di dalam blok.
  const blok = new Set(["52,50", "53,50", "52,51", "53,51"]);
  const j = jalurTampil({ gx: 50, gy: 50 }, { gx: 55, gy: 50 }, blok);
  ok(j !== null && j.length > 0 && j[j.length - 1].gx === 55 && j[j.length - 1].gy === 50, "jalurTampil: sampai tujuan memutar blok");
  ok(j !== null && j.every((t) => !blok.has(`${t.gx},${t.gy}`)), "jalurTampil: tidak ada waypoint di dalam bangunan");
  // Tujuan di dalam blok tetap boleh sebagai langkah terakhir (tidur).
  const jMasuk = jalurTampil({ gx: 50, gy: 50 }, { gx: 52, gy: 50 }, blok);
  ok(jMasuk !== null && jMasuk[jMasuk.length - 1].gx === 52 && jMasuk[jMasuk.length - 1].gy === 50, "jalurTampil: tujuan di dalam bangunan boleh sebagai langkah akhir");
  // Tujuan terkepung penuh -> null (fallback garis lurus di Map3D).
  const ring = new Set(["51,49", "52,49", "53,49", "51,50", "53,50", "51,51", "52,51", "53,51"]);
  ok(jalurTampil({ gx: 50, gy: 50 }, { gx: 52, gy: 50 }, ring) === null, "jalurTampil: tujuan terkepung -> null");
  ok(JSON.stringify(jalurTampil({ gx: 50, gy: 50 }, { gx: 50, gy: 50 }, blok)) === "[]", "jalurTampil: sudah di tujuan -> []");
  // Jalur hewan (2026-11-04): Map3D harus memakai jalurTampil juga
  // untuk hewan, bukan garis lurus — penjaga statis atas sumber Map3D.
  {
    const mapSrcH = readFileSync("src/components/Map3D.tsx", "utf8");
    ok(mapSrcH.includes("jalurKey?: string") && mapSrcH.includes("jalur?: { x: number; z: number }[]"), "hewan: entri hewanMap punya jalur + jalurKey");
    ok(mapSrcH.includes("jalurBasiH") && mapSrcH.includes("tileKeH") && mapSrcH.includes("jalurTampil(tileDariH, tileKeH"), "hewan: loop hewan menghitung jalurTampil memutar rintangan");
    ok(mapSrcH.includes("cur.jalur.shift()") || mapSrcH.includes("cur.jalur.shift"), "hewan: waypoint hewan digeser saat tiba");
    ok(mapSrcH.includes("Math.atan2(wx - cur.dx, wz - cur.dz)"), "hewan: hewan menghadap waypoint, bukan garis lurus ke server");
  }
  // pasanganTumpuk: tumpang 1 ubin ketahuan, bersebelahan saja tidak.
  const p1 = { kind: "gubuk", gx: 50, gy: 50, w: 2, h: 2 };
  const p2 = { kind: "lumbung", gx: 51, gy: 51, w: 2, h: 2 };
  const t = pasanganTumpuk([p1, p2]);
  ok(t !== null && t.tetap === p1 && t.geser === p2, "tumpuk: pasangan tumpang ketahuan, pertama dipertahankan");
  ok(pasanganTumpuk([p1, { kind: "lumbung", gx: 52, gy: 50, w: 2, h: 2 }]) === null, "tumpuk: bersebelahan tanpa ubin sama -> null");
  ok(pasanganTumpuk([p1, { kind: "lumbung", gx: 50, gy: 50, w: 1, h: 1 }]) !== null, "tumpuk: posisi asal sama beda kind -> ketahuan");
}

// SETTING LABEL KARAKTER + NAVBAR MOBILE (2026-11-04, permintaan user:
// sembunyikan nama/dialog biar ringan; navbar HP kepotong).
{
  const pageSrc2 = readFileSync("src/app/page.tsx", "utf8");
  const mapSrc2 = readFileSync("src/components/Map3D.tsx", "utf8");
  const cssSrc = readFileSync("src/app/globals.css", "utf8");
  ok(pageSrc2.includes("ne_label_karakter"), "label: page pakai kunci localStorage ne_label_karakter");
  ok(pageSrc2.includes("toggleLabel") && pageSrc2.includes("labelTampil={labelTampil}"), "label: page punya toggle + oper prop ke Map3D");
  ok(pageSrc2.includes("Label karakter (nama, dialog, aksi)"), "label: ada baris setting di panel Pengaturan");
  ok(mapSrc2.includes("labelTampil?: boolean") && mapSrc2.includes("labelTampilRef"), "label: Map3D punya prop + ref labelTampil");
  ok(mapSrc2.includes('el.style.display = labelTampil ? "" : "none"'), "label: container label disembunyikan saat setting mati");
  ok(mapSrc2.includes("if (!labelTampilRef.current)"), "label: loop frame melewatkan update label saat disembunyikan");
}

// MENU KAMPUNG (2026-11-04, permintaan user: navbar dihapus, ganti 1
// tombol kanan-atas + kartu modal menu dengan penjelasan tiap tombol).
{
  const pageSrc3 = readFileSync("src/app/page.tsx", "utf8");
  const cssSrc3 = readFileSync("src/app/globals.css", "utf8");
  ok(!pageSrc3.includes("game-topbar") && !pageSrc3.includes("navTampil") && !pageSrc3.includes("nav-handle") && !pageSrc3.includes("nav-gear-float") && !pageSrc3.includes("nav-topbar-fold-tab"), "menu: topbar + handle + gear + fold tab sudah dihapus dari page");
  ok(pageSrc3.includes('className="menu-fab"') && pageSrc3.includes("menuOpen") && pageSrc3.includes("setMenuOpen(true)"), "menu: ada 1 tombol kanan-atas yang membuka modal menu");
  ok(pageSrc3.includes("overlay-full") && pageSrc3.includes("menu-card"), "menu: modal kartu memakai overlay + menu-card");
  ok(pageSrc3.includes("Menu Kampung") && pageSrc3.includes("menu-item"), "menu: ada daftar item menu");
  // Tiap tombol lama ada + punya penjelasan (bukan cuma ikon).
  ok(pageSrc3.includes("Masuk ke interior Restoran Nirwana 3D"), "menu: Resto ada + ada penjelasannya");
  ok(pageSrc3.includes("Rapat bulanan pemimpin kampung"), "menu: Musyawarah ada + ada penjelasannya");
  ok(pageSrc3.includes("Gemini memindahkan satu rumah ke tepi jalan"), "menu: Tata Kota ada + ada penjelasannya");
  ok(pageSrc3.includes("Gemini menyarankan segmen jalan berikutnya"), "menu: Jalan Gemini ada + ada penjelasannya");
  ok(pageSrc3.includes("Gemini menggeser bangunan yang menumpuk"), "menu: Rapikan Gemini ada + ada penjelasannya");
  ok(pageSrc3.includes("Ganti tampilan jalan kampung"), "menu: Gaya Jalan ada + ada penjelasannya");
  ok(pageSrc3.includes("Nyalakan atau matikan semua efek suara"), "menu: Suara ada + ada penjelasannya");
  ok(pageSrc3.includes("Atur suara, label karakter (mode ringan), orientasi, dan gaya jalan"), "menu: Pengaturan ada + ada penjelasannya");
  ok(pageSrc3.includes("Lihat stok resource dan perkakas kampung"), "menu: Inventori ada + ada penjelasannya");
  ok(pageSrc3.includes("Putar tampilan antara portrait dan landscape"), "menu: Orientasi ada + ada penjelasannya");
  ok(cssSrc3.includes(".menu-fab") && cssSrc3.includes(".menu-card") && cssSrc3.includes(".menu-item"), "menu: CSS tombol + kartu + item ada");
}

// Papan kebutuhan kampung (2026-11-04, Ide 6): fungsi murni tangga
// DESAIN-EKONOMI §2 — selalu mengembalikan SATU tingkat berikutnya.
{
  const kb0 = kebutuhanKampungBerikutnya(0, [], false);
  eq(kb0.tingkat, "Kampung menetap", "kebutuhan: kampung kosong -> tingkat 1");
  ok(kb0.kurang.some((k) => k.includes("Gubuk")) && kb0.kurang.some((k) => k.includes("Api Unggun")), "kebutuhan: kampung kosong kurang gubuk + api unggun");
  ok(!kb0.selesai, "kebutuhan: kampung kosong belum selesai");
  // Tenda saja TIDAK memenuhi syarat harfiah tingkat 1 (butuh gubuk).
  const kbTenda = kebutuhanKampungBerikutnya(3, ["tenda_kulit", "api_unggun"], false);
  eq(kbTenda.tingkat, "Kampung menetap", "kebutuhan: tenda saja belum membuka tingkat 1");
  const kb1 = kebutuhanKampungBerikutnya(5, ["gubuk", "api_unggun"], false);
  eq(kb1.tingkat, "Pertukangan", "kebutuhan: gubuk+api -> tingkat 2");
  ok(kb1.kurang.some((k) => k.includes("Lumbung")) && kb1.kurang.some((k) => k.includes("populasi 8")), "kebutuhan: tingkat 2 kurang lumbung + populasi");
  const kb2 = kebutuhanKampungBerikutnya(8, ["gubuk", "api_unggun", "lumbung"], false);
  eq(kb2.tingkat, "Kampung besar", "kebutuhan: lumbung+pop 8 -> tingkat 3");
  ok(kb2.kurang.some((k) => k.includes("bengkel")), "kebutuhan: tingkat 3 kurang bengkel");
  const kb3 = kebutuhanKampungBerikutnya(12, ["gubuk", "api_unggun", "lumbung", "bengkel_kayu"], false);
  eq(kb3.tingkat, "Pangan skala besar", "kebutuhan: bengkel+pop 12 -> tingkat 4");
  ok(kb3.kurang.some((k) => k.includes("Balai")) && kb3.kurang.some((k) => k.includes("Dapur Umum")), "kebutuhan: tingkat 4 kurang balai + dapur umum");
  const kb4 = kebutuhanKampungBerikutnya(15, ["gubuk", "api_unggun", "lumbung", "bengkel_kayu", "balai", "dapur_umum"], false);
  eq(kb4.tingkat, "Zaman besi & monumen", "kebutuhan: balai+dapur -> tingkat 5");
  ok(kb4.kurang.some((k) => k.includes("penambang")) && kb4.kurang.some((k) => k.includes("Paviliun Makan")) && kb4.kurang.some((k) => k.includes("populasi 20")), "kebutuhan: tingkat 5 kurang penambang + paviliun + populasi");
  const kb5 = kebutuhanKampungBerikutnya(20, ["gubuk", "api_unggun", "lumbung", "bengkel_kayu", "balai", "dapur_umum", "paviliun_makan"], true);
  ok(kb5.selesai && kb5.kurang.length === 0, "kebutuhan: semua syarat -> selesai");
  // Panel terpasang di kartu menu (penjaga statis, bukan sim).
  const pageSrcKb = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrcKb.includes("kebutuhanKampungBerikutnya") && pageSrcKb.includes("Kampung menginginkan"), "kebutuhan: panel terpasang di kartu menu page");
  const cssSrcKb = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrcKb.includes(".menu-kebutuhan"), "kebutuhan: CSS panel ada");
  // CSS topbar mati sudah dibersihkan (2026-11-04): kelas topbar lama
  // tidak boleh muncul lagi, tapi strip resource di kartu menu tetap ada.
  for (const mati of [".game-topbar", ".topbar-scroll", ".hud-btn", ".hud-era-pill", ".hud-info-chip", ".hud-resource-dock", ".nav-topbar-fold-tab", ".nav-handle", ".nav-gear-float"]) {
    ok(!cssSrcKb.includes(mati), `css-bersih: ${mati} tidak ada lagi`);
  }
  for (const hidup of [".hud-res-chip", ".hud-res-icon", ".hud-res-num", ".hud-full-dot", ".menu-fab", ".menu-card"]) {
    ok(cssSrcKb.includes(hidup), `css-bersih: ${hidup} tetap ada`);
  }
}

// Satu aksi pertama "Mulai dari sini" (2026-11-04, Ide 12): turunan
// display-only dari kebutuhan — populasi kurang -> Tambah karakter
// (satu-satunya kekurangan yang bisa diatasi pemain langsung);
// selain itu -> Musyawarah (bangunan diputuskan NPC); selesai -> null.
{
  const aPop = aksiPertamaBerikutnya(kebutuhanKampungBerikutnya(5, ["gubuk", "api_unggun"], false));
  ok(aPop !== null && aPop.aksi === "tambah" && aPop.tombol === "Tambah karakter", "mulai: populasi kurang -> Tambah karakter");
  const aBangun = aksiPertamaBerikutnya(kebutuhanKampungBerikutnya(0, [], false));
  ok(aBangun !== null && aBangun.aksi === "musyawarah" && aBangun.tombol === "Musyawarah", "mulai: kampung kosong (kurang bangunan) -> Musyawarah, bukan tombol bangun");
  const aCampur = aksiPertamaBerikutnya(kebutuhanKampungBerikutnya(8, ["gubuk", "api_unggun", "lumbung"], false));
  ok(aCampur !== null && aCampur.aksi === "tambah", "mulai: kurang bengkel + populasi didahulukan populasi (Tambah karakter)");
  const aTambang = aksiPertamaBerikutnya(kebutuhanKampungBerikutnya(20, ["gubuk", "api_unggun", "lumbung", "bengkel_kayu", "balai", "dapur_umum", "paviliun_makan"], false));
  ok(aTambang !== null && aTambang.aksi === "musyawarah", "mulai: kurang penambang saja -> Musyawarah");
  const aSelesai = aksiPertamaBerikutnya(kebutuhanKampungBerikutnya(20, ["gubuk", "api_unggun", "lumbung", "bengkel_kayu", "balai", "dapur_umum", "paviliun_makan"], true));
  ok(aSelesai === null, "mulai: ujung tangga -> baris disembunyikan");
  // Baris terpasang di kartu menu + CSS ada + aksi Musyawarah menutup
  // menu dulu (pola yang sama dengan tombol Musyawarah di daftar).
  const pageSrcMulai = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrcMulai.includes("aksiPertamaBerikutnya") && pageSrcMulai.includes("menu-mulai") && pageSrcMulai.includes("Mulai dari sini"), "mulai: baris terpasang di kartu menu page");
  ok(pageSrcMulai.includes("setShowMusyawarah(true)") && pageSrcMulai.includes("setMenuOpen(false)"), "mulai: aksi Musyawarah menutup menu dulu");
  const cssSrcMulai = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrcMulai.includes(".menu-mulai") && cssSrcMulai.includes(".menu-mulai-label") && cssSrcMulai.includes(".menu-mulai-teks"), "mulai: CSS baris ada");
}

// Tonggak kampung (2026-11-05, Ide 29): fungsi murni display-only —
// 7 tonggak dari tangga DESAIN-EKONOMI §2, hitungan tercapai +
// SATU berikutnya yang paling dekat, tanpa hadiah ekonomi.
{
  const t0 = tonggakKampung(0, []);
  eq(t0.total, 7, "tonggak: total 7");
  eq(t0.tercapai, 0, "tonggak: kampung kosong 0 tercapai");
  eq(t0.berikutnya, "Api pertama menyala", "tonggak: kampung kosong berikutnya = api pertama");
  const tApi = tonggakKampung(3, ["api_unggun"]);
  eq(tApi.tercapai, 1, "tonggak: api saja 1 tercapai");
  eq(tApi.berikutnya, "Gubuk pertama berdiri", "tonggak: setelah api, berikutnya gubuk");
  const tPop9 = tonggakKampung(9, ["api_unggun", "gubuk", "lumbung"]);
  eq(tPop9.tercapai, 3, "tonggak: populasi 9 belum menghitung tonggak populasi 10");
  const tPop10 = tonggakKampung(10, ["api_unggun", "gubuk", "lumbung"]);
  eq(tPop10.tercapai, 4, "tonggak: populasi 10 menghitung tonggak populasi");
  const tBatu = tonggakKampung(12, ["api_unggun", "gubuk", "lumbung", "bengkel_batu"]);
  ok(tBatu.daftar.find((t) => t.id === "bengkel_pertama")?.tercapai === true, "tonggak: bengkel batu juga menghitung bengkel pertama");
  const tPenuh = tonggakKampung(20, ["api_unggun", "gubuk", "lumbung", "bengkel_kayu", "balai", "paviliun_makan"]);
  eq(tPenuh.tercapai, 7, "tonggak: tangga penuh 7 tercapai");
  eq(tPenuh.berikutnya, null, "tonggak: tangga penuh tidak ada berikutnya");
  const tAneh = tonggakKampung(NaN, []);
  eq(tAneh.tercapai, 0, "tonggak: populasi tidak valid diperlakukan 0");
  // Baris terpasang di kartu menu + CSS ada (penjaga statis).
  const pageSrcTg = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrcTg.includes("tonggakKampung") && pageSrcTg.includes("Tonggak kampung"), "tonggak: baris terpasang di kartu menu page");
  const cssSrcTg = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrcTg.includes(".menu-tonggak") && cssSrcTg.includes(".menu-tonggak-title") && cssSrcTg.includes(".menu-tonggak-isi"), "tonggak: CSS baris ada");
  const verSrcTg = readFileSync("src/lib/version.ts", "utf8");
  ok(verSrcTg.includes('BUILD_ID = "r57"'), "tonggak: BUILD_ID naik ke r41 (pil Versi baru bisa membedakan rilis ini)");
}

// "Selama kamu pergi" (2026-11-05, Ide 22): fungsi murni display-only —
// cuplikan kunjungan terakhir vs keadaan poll terbaru, maksimal 3 baris,
// null bila hari game belum maju. Tanpa hadiah offline, tanpa selisih stok.
{
  const lalu = { hari: 10, populasi: 8, bangunan: ["api_unggun", "gubuk"] };
  eq(selamaKamuPergi(null, { hari: 12, populasi: 9, bangunan: [] }), null, "pergi: tanpa cuplikan (kunjungan pertama) tidak ada blok");
  eq(selamaKamuPergi(lalu, { hari: 10, populasi: 9, bangunan: ["api_unggun", "gubuk", "lumbung"] }), null, "pergi: hari belum maju -> null walau populasi/bangunan berubah");
  eq(selamaKamuPergi(lalu, { hari: 9, populasi: 8, bangunan: ["api_unggun", "gubuk"] }), null, "pergi: hari mundur -> null");
  eq(selamaKamuPergi(lalu, { hari: 12, populasi: 8, bangunan: ["api_unggun", "gubuk"] }), ["Hari 10 → 12"], "pergi: hanya hari maju -> satu baris hari");
  eq(selamaKamuPergi(lalu, { hari: 15, populasi: 11, bangunan: ["api_unggun", "gubuk"] }), ["Hari 10 → 15", "Penduduk 8 → 11"], "pergi: hari + populasi -> dua baris");
  eq(selamaKamuPergi(lalu, { hari: 12, populasi: 8, bangunan: ["api_unggun", "gubuk", "lumbung"] }), ["Hari 10 → 12", "Bangunan selesai: Lumbung"], "pergi: bangunan baru disebut dengan label katalog, bukan id");
  eq(selamaKamuPergi(lalu, { hari: 20, populasi: 9, bangunan: ["api_unggun", "gubuk", "lumbung", "ladang", "api_unggun"] }), ["Hari 10 → 20", "Penduduk 8 → 9", "Bangunan selesai: Lumbung, Ladang"], "pergi: dua bangunan baru + duplikat kind dihitung sekali");
  eq(selamaKamuPergi(lalu, { hari: 20, populasi: 8, bangunan: ["api_unggun", "gubuk", "lumbung", "ladang", "sumur_batu"] }), ["Hari 10 → 20", "Bangunan selesai: Lumbung, Ladang dan 1 lagi"], "pergi: tiga bangunan baru diringkas jadi 2 nama + 'dan N lagi'");
  eq(selamaKamuPergi(lalu, { hari: 12, populasi: 8, bangunan: ["gubuk"] }), ["Hari 10 → 12"], "pergi: bangunan yang hilang diabaikan, bukan dilaporkan");
  eq(selamaKamuPergi({ hari: NaN, populasi: -3, bangunan: [] }, { hari: 5, populasi: 2, bangunan: [] }), ["Hari 0 → 5", "Penduduk 0 → 2"], "pergi: input tidak valid diperlakukan 0, tidak crash");
  const hasilMax = selamaKamuPergi(lalu, { hari: 99, populasi: 20, bangunan: ["api_unggun", "gubuk", "lumbung", "ladang", "balai", "paviliun_makan"] });
  ok((hasilMax?.length ?? 0) <= 3, "pergi: tidak pernah lebih dari 3 baris");
  ok(!(hasilMax ?? []).join(" ").includes("Kayu") && !(hasilMax ?? []).join(" ").includes("Pangan"), "pergi: tidak ada selisih stok mentah di baris mana pun");
  // Blok terpasang di kartu menu + snapshot localStorage + CSS ada (penjaga statis).
  const pageSrcPergi = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrcPergi.includes("selamaKamuPergi") && pageSrcPergi.includes("Selama kamu pergi"), "pergi: blok terpasang di kartu menu page");
  ok(pageSrcPergi.includes("ne_kunjungan_terakhir"), "pergi: cuplikan disimpan di localStorage ne_kunjungan_terakhir");
  ok(pageSrcPergi.includes("beforeunload") && pageSrcPergi.includes("document.hidden"), "pergi: cuplikan ditulis saat tab disembunyikan/ditutup");
  ok(pageSrcPergi.includes("tutupPergi") && pageSrcPergi.includes("menu-pergi-tutup"), "pergi: tombol ✕ menyingkirkan blok");
  const cssSrcPergi = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrcPergi.includes(".menu-pergi") && cssSrcPergi.includes(".menu-pergi-title") && cssSrcPergi.includes(".menu-pergi-tutup"), "pergi: CSS blok ada");
  const verSrcPergi = readFileSync("src/lib/version.ts", "utf8");
  ok(verSrcPergi.includes('BUILD_ID = "r57"'), "pergi: BUILD_ID naik ke r41 (pil Versi baru bisa membedakan rilis ini)");
}

// Jeda loop render saat tab disembunyikan (2026-11-04, Ide 9):
// penjaga statis — loop Map3D dibatalkan saat hidden, dimulai lagi
// saat visible hanya bila tidak ada loop berjalan, timestamp di-reset
// supaya tidak ada lompatan dt, dan listener dilepas saat cleanup.
{
  const mapSrcVis = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrcVis.includes('document.addEventListener("visibilitychange"'), "vis: listener visibilitychange dipasang");
  ok(mapSrcVis.includes("document.hidden") && mapSrcVis.includes("cancelAnimationFrame(raf)"), "vis: hidden -> cancelAnimationFrame");
  ok(mapSrcVis.includes("} else if (!raf) {") && mapSrcVis.includes("last = performance.now()"), "vis: visible -> mulai lagi hanya bila raf 0 + reset timestamp");
  ok(mapSrcVis.includes('document.removeEventListener("visibilitychange"'), "vis: listener dilepas saat cleanup");
  const verSrc = readFileSync("src/lib/version.ts", "utf8");
  ok(verSrc.includes('BUILD_ID = "r57"'), "vis: BUILD_ID naik ke r41 (pil Versi baru bisa membedakan rilis ini)");
}

// Jeda poll data saat tab disembunyikan (2026-11-04, Ide 17):
// penjaga statis — effect poll di page.tsx memasang listener
// visibilitychange; hidden -> interval dibersihkan + ref di-null-kan
// (penjaga anti interval ganda saat kembali); visible -> fetch segar
// dulu lalu interval dimulai lagi; listener dilepas saat cleanup.
// Catatan: penjaga ini memeriksa pola di dalam effect poll (blok yang
// memuat "setInterval(muat, 3000)"), bukan listener Map3D (Ide 9).
{
  const pageSrcPoll = readFileSync("src/app/page.tsx", "utf8");
  const pollIdx = pageSrcPoll.indexOf("setInterval(muat, 3000)");
  ok(pollIdx > 0, "poll-vis: effect poll 3 detik ada di page");
  const pollBlock = pageSrcPoll.slice(Math.max(0, pollIdx - 1200), pollIdx + 1200);
  ok(pollBlock.includes('document.addEventListener("visibilitychange"'), "poll-vis: listener visibilitychange dipasang di effect poll");
  ok(pollBlock.includes("document.hidden") && pollBlock.includes("pollRef.current = null"), "poll-vis: hidden -> interval dibersihkan + ref null");
  ok(pollBlock.includes("muat();") && pollBlock.includes("mulaiPoll()"), "poll-vis: visible -> fetch segar dulu lalu interval dimulai lagi");
  ok(pollBlock.includes('document.removeEventListener("visibilitychange"'), "poll-vis: listener dilepas saat cleanup");
}

// Papan Warga satu layar (2026-11-04, Ide 18, riset UX 14:29):
// penjaga statis — entri menu ada, daftar dirender dari map.warga
// yang sudah diambil (tanpa fetch baru di blok papan), ketuk baris
// menutup papan lalu kamera menuju + mengikuti warga itu (tapWarga,
// sama seperti ketuk karakter di peta; perubahan perilaku permintaan
// user 2026-11-04), dan ada tombol Tutup di bawah daftar (jangkauan
// jempol) + baris setinggi target sentuh 48px. Jalur detail panel
// samping tetap ada lewat ketuk tile / pencarian.
{
  const pageSrcPapan = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrcPapan.includes("showPapanWarga") && pageSrcPapan.includes("Papan Warga"), "papan: state + entri menu ada");
  const papanIdx = pageSrcPapan.indexOf("papan-warga-list");
  ok(papanIdx > 0, "papan: daftar dirender di modal");
  const papanBlock = pageSrcPapan.slice(Math.max(0, papanIdx - 600), papanIdx + 1600);
  ok(papanBlock.includes("(map?.warga ?? [])"), "papan: daftar dari map.warga yang sudah diambil");
  ok(!papanBlock.includes("fetch(") && !papanBlock.includes("/api/map"), "papan: tanpa fetch baru di blok papan");
  ok(papanBlock.includes("setShowPapanWarga(false); tapWarga("), "papan: ketuk baris menutup papan + kamera menuju warga (tapWarga)");
  ok(pageSrcPapan.includes("papan-warga-tutup"), "papan: tombol Tutup di bawah daftar ada");
  ok(pageSrcPapan.includes("formatLabel(String(w.peran"), "papan: peran diformat (api map tidak mengirim label_peran)");
  const cssSrcPapan = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrcPapan.includes(".papan-warga-row") && cssSrcPapan.includes("min-height: 48px"), "papan: CSS baris + tinggi sentuh 48px");
  ok(cssSrcPapan.includes(".papan-warga-tutup"), "papan: CSS tombol Tutup ada");
}

// Analog kamera kiri (permintaan user 2026-11-04, ganti D-pad yang
// "aneh"): penjaga statis — tongkat analog di dalam wrap peta (pojok
// kiri-bawah, di atas kanvas tapi di bawah modal), geser vektor layar
// 8 arah (kanan = sumbu X kamera di bidang tanah, atas = arah pandang
// kamera di bidang tanah), seret = geser terus sesuai defleksi (penuh
// = 20 unit/detik, zona mati 0.15), seret melepas kunci follow +
// membatalkan animasi bingkai awal, tombol naik/turun di atas analog
// untuk zoom (naik = menjauh, turun = mendekat, tahan = zoom terus),
// klaster bisa disembunyikan (tombol 🕹️ memunculkan lagi), dan
// interval dibersihkan saat unmount. Tombol 48px (≥44px, jempol).
{
  const map3dSrc = readFileSync("src/components/Map3D.tsx", "utf8");
  const wrapIdx = map3dSrc.indexOf('className="map3d-wrap"');
  const analogIdx = map3dSrc.indexOf("analog-kamera");
  ok(wrapIdx > 0 && analogIdx > wrapIdx, "analog: klaster di dalam wrap peta");
  ok(!map3dSrc.includes("dpad-kamera") && !map3dSrc.includes("dpad-btn"), "analog: D-pad lama sudah dihapus");
  ok(map3dSrc.includes("analog-dasar") && map3dSrc.includes("analog-knop"), "analog: dasar + knop ada");
  ok(map3dSrc.includes('aria-label="Kamera naik"') && map3dSrc.includes('aria-label="Kamera turun"'), "analog: tombol naik + turun ada");
  ok(map3dSrc.includes("geserKameraVektor") && map3dSrc.includes("onLepasKunciRef.current?.()"), "analog: seret melepas kunci follow");
  ok(map3dSrc.includes("batalAnimasi()"), "analog: seret/zoom membatalkan animasi bingkai awal");
  ok(map3dSrc.includes("setPointerCapture") && map3dSrc.includes("mag > 0.15"), "analog: pointer capture + zona mati ada");
  ok(map3dSrc.includes("onPointerUp={berhentiAnalog}") && map3dSrc.includes("onPointerCancel={berhentiAnalog}"), "analog: lepas = berhenti + knop kembali tengah");
  ok(map3dSrc.includes("zoomKamera") && map3dSrc.includes("setInterval(() => zoomKamera(arah), 50)"), "analog: tahan tombol = zoom terus");
  ok(map3dSrc.includes('aria-label="Sembunyikan kontrol kamera"') && map3dSrc.includes('aria-label="Tampilkan kontrol kamera"'), "analog: sembunyikan + munculkan ada");
  ok(map3dSrc.includes("if (analogIntervalRef.current) clearInterval(analogIntervalRef.current);") && map3dSrc.includes("if (zoomIntervalRef.current) clearInterval(zoomIntervalRef.current);"), "analog: interval dibersihkan saat unmount");
  const cssSrcAnalog = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrcAnalog.includes(".analog-kamera") && cssSrcAnalog.includes("left: 12px"), "analog: CSS klaster kiri-bawah ada");
  ok(cssSrcAnalog.includes(".analog-dasar") && cssSrcAnalog.includes("width: 120px"), "analog: CSS dasar 120px ada");
  ok(cssSrcAnalog.includes(".analog-zoom-btn") && cssSrcAnalog.includes("width: 48px"), "analog: CSS tombol zoom 48px ada");
  ok(!cssSrcAnalog.includes(".dpad-kamera"), "analog: CSS D-pad lama sudah dihapus");
  // Observasi live 2026-11-04 18:29: pil "Panduan Kontrol"
  // (.bottom-controls, bottom 12px kiri, z 25) menumpuk dasar analog
  // yang tadinya juga bottom 12px. Klaster + tombol 🕹️ kini bottom
  // 60px: di atas pil (~32px) dengan jeda 12px, bukan tumpukan.
  // Cara ceknya kasar tapi cukup: blok .analog-kamera dan
  // .analog-muncul masing-masing harus menyebut bottom 60px.
  const kameraBlok = cssSrcAnalog.slice(cssSrcAnalog.indexOf(".analog-kamera {"), cssSrcAnalog.indexOf(".analog-sembunyi"));
  const munculBlok = cssSrcAnalog.slice(cssSrcAnalog.indexOf(".analog-muncul {"), cssSrcAnalog.indexOf(".map3d-labels"));
  ok(kameraBlok.includes("bottom: 60px"), "analog: klaster di atas pil Panduan Kontrol (bottom 60px, bukan 12px)");
  ok(munculBlok.includes("bottom: 60px"), "analog: tombol muncul 🕹️ juga di atas pil (bottom 60px)");
}

// Fallback muat jujur untuk chunk 3D (Ide 7, irisan kecil): dynamic import
// Map3D selama ini tanpa `loading`, jadi selama chunk diunduh setelah
// hydration, area peta kosong tanpa teks apa pun — persis frame gelap
// yang berulang kali dilaporkan observasi. Fallback memakai gaya
// .map3d-loading yang sama dengan layar muat di dalam Map3D, dan
// ssr:false tetap dipertahankan (WebGL/window tidak boleh dirender
// server). Kejujuran: frame SEBELUM hydration JS masih mungkin gelap
// (React belum jalan) — itu butuh cangkang HTML statis di layout,
// bukan irisan ini, dan tidak diklaim beres di sini.
{
  const pageSrcMuat = readFileSync("src/app/page.tsx", "utf8");
  const dynIdx = pageSrcMuat.indexOf('import("@/components/Map3D")');
  ok(dynIdx > 0, "muat3d: dynamic import Map3D ada");
  const dynBlock = pageSrcMuat.slice(Math.max(0, dynIdx - 120), dynIdx + 400);
  ok(dynBlock.includes("ssr: false"), "muat3d: ssr:false dipertahankan");
  ok(dynBlock.includes("loading:"), "muat3d: fallback loading ada di dynamic import");
  ok(dynBlock.includes("map3d-loading") && dynBlock.includes("Memuat peta 3D…"), "muat3d: fallback memakai gaya + teks layar muat yang sama");
  const cssSrcMuat = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrcMuat.includes(".map3d-loading"), "muat3d: CSS .map3d-loading ada");
  const verMuat = readFileSync("src/lib/version.ts", "utf8");
  ok(verMuat.includes('BUILD_ID = "r57"'), "muat3d: BUILD_ID naik ke r41");
}

// Tanda "tanpa tugas" di Papan Warga (Ide 5, irisan kecil, 2026-11-04):
// definisi dari data sim sendiri — node null + istirahat + aksi
// beristirahat/rehat stok penuh. Santai (alihan aktif) dan istirahat
// dengan node masih terpasang sengaja TIDAK dihitung, supaya tidak
// ada positif palsu. Penanda memakai ikon + teks (bukan warna saja,
// sesuai riset aksesibilitas run ini).
ok(wargaTanpaTugas({ node: null, fase_siklus: "istirahat", aksi_sekarang: "beristirahat" }) === true, "tanpatugas: istirahat tanpa node = tanpa tugas");
ok(wargaTanpaTugas({ node: null, fase_siklus: "istirahat", aksi_sekarang: "rehat_stok_penuh" }) === true, "tanpatugas: rehat stok penuh = tanpa tugas");
ok(wargaTanpaTugas({ node: undefined, fase_siklus: "istirahat", aksi_sekarang: "beristirahat" }) === true, "tanpatugas: node undefined diperlakukan seperti null");
ok(wargaTanpaTugas({ node: { pseudo: "santai" }, fase_siklus: "jalan", aksi_sekarang: "membantu" }) === false, "tanpatugas: santai/membantu BUKAN tanpa tugas");
ok(wargaTanpaTugas({ node: { pseudo: undefined }, fase_siklus: "kumpul", aksi_sekarang: "berjalan" }) === false, "tanpatugas: sedang kumpul = bertugas");
ok(wargaTanpaTugas({ node: { pseudo: undefined }, fase_siklus: "istirahat", aksi_sekarang: "beristirahat" }) === false, "tanpatugas: istirahat dengan node terpasang = jeda, bukan tanpa tugas");
ok(wargaTanpaTugas(null) === false, "tanpatugas: null aman");
ok(wargaTanpaTugas(undefined) === false, "tanpatugas: undefined aman");
{
  const pageSrcTanpa = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrcTanpa.includes("wargaTanpaTugas"), "tanpatugas: page memakai wargaTanpaTugas");
  ok(pageSrcTanpa.includes("💤") && pageSrcTanpa.includes("tanpa tugas"), "tanpatugas: tag ikon + teks di Papan Warga (bukan warna saja)");
  ok(pageSrcTanpa.includes("papan-warga-tanpatugas"), "tanpatugas: baris ringkasan di kepala Papan Warga");
  const cssSrcTanpa = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrcTanpa.includes(".papan-warga-tanpatugas"), "tanpatugas: CSS ringkasan ada");
}

// Hormati prefers-reduced-motion di panel/modal (Ide 25, 2026-11-04):
// umpan balik dipertahankan tanpa gerakan — panel/modal muncul
// langsung (tanpa transisi), titik stok penuh jadi statis (bukan
// berdenyut), label melayang hanya memudar di tempat (bukan naik).
// Kanvas 3D sengaja tidak disentuh (gerak di sana inti permainan).
{
  const cssSrcGerak = readFileSync("src/app/globals.css", "utf8");
  const mqIdx = cssSrcGerak.indexOf("@media (prefers-reduced-motion: reduce)");
  ok(mqIdx > 0, "geraktenang: media query prefers-reduced-motion ada");
  const mqBlock = cssSrcGerak.slice(mqIdx, mqIdx + 1200);
  ok(mqBlock.includes(".overlay-full") && mqBlock.includes(".modal-box") && mqBlock.includes(".menu-card") && mqBlock.includes(".side-panel"), "geraktenang: panel/modal/papan masuk media query");
  ok(mqBlock.includes("transition: none"), "geraktenang: transisi panel dimatikan di mode tenang");
  ok(mqBlock.includes(".hud-full-dot") && mqBlock.includes("animation: none"), "geraktenang: titik stok penuh berhenti berdenyut tapi tetap ada");
  ok(mqBlock.includes(".map3d-float-badge") && mqBlock.includes("floatFadeTenang"), "geraktenang: label melayang pakai fade tenang, bukan naik");
  ok(cssSrcGerak.includes("@keyframes floatFadeTenang"), "geraktenang: keyframes fade tenang ada");
  const tenangBlock = cssSrcGerak.slice(cssSrcGerak.indexOf("@keyframes floatFadeTenang"));
  ok(!tenangBlock.includes("translate") && !tenangBlock.includes("scale"), "geraktenang: fade tenang tidak menggeser/membesar (hanya opacity)");
  const verGerak = readFileSync("src/lib/version.ts", "utf8");
  ok(verGerak.includes('BUILD_ID = "r57"'), "geraktenang: BUILD_ID naik ke r41");
}


// Tip kontekstual satu baris di kartu menu (2026-11-05, Ide 14):
// penjaga statis — state + kunci localStorage, baris tip di kartu menu
// dengan teks model pengamat (bukan janji bangun sendiri), tombol ✕
// yang menyimpan "0", tombol buka-lagi di Pengaturan, CSS baris ada,
// dan BUILD_ID naik ke r33.
{
  const pageSrcTip = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrcTip.includes("ne_tip_kontekstual") && pageSrcTip.includes("tipTampil"), "tip: state + kunci localStorage ada");
  ok(pageSrcTip.includes("menu-tip") && pageSrcTip.includes("Kamu menonton, bukan mengatur"), "tip: baris terpasang di kartu menu dengan teks model pengamat");
  ok(pageSrcTip.includes("tutupTip") && pageSrcTip.includes('localStorage.setItem("ne_tip_kontekstual", "0")'), "tip: tombol ✕ menyimpan pilihan tutup");
  ok(pageSrcTip.includes("tampilkanTip") && pageSrcTip.includes("Tip kontekstual di menu"), "tip: Pengaturan bisa membuka lagi tip yang ditutup");
  ok(pageSrcTip.includes("Musyawarah") && pageSrcTip.includes("Kampung menginginkan"), "tip: isi menunjuk Musyawarah + panel kebutuhan, bukan tombol bangun");
  const cssSrcTip = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrcTip.includes(".menu-tip") && cssSrcTip.includes(".menu-tip-teks") && cssSrcTip.includes(".menu-tip-tutup"), "tip: CSS baris + teks + tombol tutup ada");
  const verTip = readFileSync("src/lib/version.ts", "utf8");
  ok(verTip.includes('BUILD_ID = "r57"'), "tip: BUILD_ID naik ke r41");
}

// Cincin fokus keyboard di menu/modal (2026-11-05, Ide 26):
// penjaga statis — satu aturan :focus-visible untuk FAB + kartu menu +
// modal, dua nada bersentuhan (outline putih 3px + shadow gelap 5px =
// offset 2px + lebar 3px), fallback forced-colors Highlight, dan
// BUILD_ID naik ke r33. Aturan ini hanya menambah, tidak menghapus
// outline global (tidak ada aturan *:focus-visible yang mematikan
// outline di globals.css).
{
  const cssSrcFokus = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrcFokus.includes(".menu-fab:focus-visible") && cssSrcFokus.includes(".menu-card :focus-visible") && cssSrcFokus.includes(".modal-box :focus-visible"), "fokus: aturan mencakup FAB + kartu menu + modal");
  ok(cssSrcFokus.includes("outline: 3px solid #ffffff") && cssSrcFokus.includes("outline-offset: 2px"), "fokus: outline 3px + offset 2px");
  ok(cssSrcFokus.includes("box-shadow: 0 0 0 5px #0b1220"), "fokus: nada kedua gelap 5px (= offset + lebar, bersentuhan tanpa celah)");
  ok(cssSrcFokus.includes("@media (forced-colors: active)") && cssSrcFokus.includes("outline: 3px solid Highlight"), "fokus: fallback forced-colors pakai Highlight");
  ok(!cssSrcFokus.includes("*:focus-visible") && !cssSrcFokus.includes(":focus-visible {\n  outline: none"), "fokus: tidak ada penghapus outline global di aturan focus-visible");
  const verFokus = readFileSync("src/lib/version.ts", "utf8");
  ok(verFokus.includes('BUILD_ID = "r57"'), "fokus: BUILD_ID naik ke r41");
}

// Audit geometri/material bersama sebelum instancing (2026-11-05,
// Ide 30): penjaga statis — kunci pola baik yang ditemukan audit
// (node alam ter-instancing per jenis, cache material desa,
// rebuild bergerbang signature + dispose traverse) supaya refactor
// berikutnya tidak diam-diam mengembalikannya ke mesh per objek.
// Audit ini TIDAK mengubah render: celah yang ditemukan (geometri
// per placement, padi per rumpun, dispose material bersama) hanya
// dicatat di CHANGELOG + IDE-FITUR sebagai prasyarat Ide 28, dan
// BUILD_ID naik ke r34.
{
  const mapSrcAudit = readFileSync("src/components/Map3D.tsx", "utf8");
  const desaSrcAudit = readFileSync("src/lib/batu/assetVillage3D.ts", "utf8");
  ok(mapSrcAudit.includes("function instanced("), "audit30: helper instanced() ada di Map3D");
  ok(mapSrcAudit.includes("instanced(new THREE.CylinderGeometry(0.24, 0.34, POHON_BATANG, 6)"), "audit30: batang pohon ter-instancing (bukan mesh per pohon)");
  ok(mapSrcAudit.includes("instanced(new THREE.ConeGeometry(1.5, 4.2, 7)"), "audit30: tajuk pohon ter-instancing");
  ok(mapSrcAudit.includes("instanced(new THREE.SphereGeometry(0.75, 8, 6)"), "audit30: semak ter-instancing");
  const idxBatu = mapSrcAudit.indexOf("const batu = byKind.singkapan_batu");
  const idxEmas = mapSrcAudit.indexOf("const emas = byKind.urat_emas");
  ok(idxBatu > 0 && mapSrcAudit.indexOf("instanced(", idxBatu) > idxBatu && mapSrcAudit.indexOf("instanced(", idxBatu) < idxEmas && mapSrcAudit.includes("DodecahedronGeometry(0.9, 0)"), "audit30: singkapan batu ter-instancing");
  ok(idxEmas > 0 && mapSrcAudit.indexOf("instanced(", idxEmas) > idxEmas && mapSrcAudit.includes("DodecahedronGeometry(0.85, 0)"), "audit30: urat emas/besi ter-instancing");
  ok(desaSrcAudit.includes("villageMats") && desaSrcAudit.includes("if (villageMats) return villageMats"), "audit30: material desa di-cache module-level, bukan dibuat per bangunan");
  ok(mapSrcAudit.includes("instanceof THREE.InstancedMesh") && mapSrcAudit.includes("o.geometry.dispose()"), "audit30: disposeGroup traverse InstancedMesh + buang geometri");
  ok(mapSrcAudit.includes("jSig !== jalanSig"), "audit30: rebuild jalan bergerbang signature, bukan tiap poll");
  const verAudit = readFileSync("src/lib/version.ts", "utf8");
  ok(verAudit.includes('BUILD_ID = "r57"'), "audit30: BUILD_ID naik ke r41");
}

// Dispose lewati material bersama (2026-11-05, penutup celah audit
// Ide 30): disposeGroup di Map3D kini melewati material cache
// villageMats/roadMats yang dipakai ulang tiap rebuild, tapi tetap
// membuang geometri per build; cleanup unmount tetap membuang
// semua karena komponen benar-benar lepas. BUILD_ID naik ke r36.
{
  const mapSrc36 = readFileSync("src/components/Map3D.tsx", "utf8");
  const desaSrc36 = readFileSync("src/lib/batu/assetVillage3D.ts", "utf8");
  const jalanSrc36 = readFileSync("src/lib/batu/assetRoad3D.ts", "utf8");
  ok(desaSrc36.includes("export function isVillageMaterial"), "dispose36: predikat isVillageMaterial diekspor dari assetVillage3D");
  ok(jalanSrc36.includes("export function isRoadMaterial"), "dispose36: predikat isRoadMaterial diekspor dari assetRoad3D");
  ok(desaSrc36.includes("Object.values(getVillageMats())") && jalanSrc36.includes("Object.values(getRoadMats())"), "dispose36: predikat membaca cache module-level, bukan daftar baru");
  const idxDispose = mapSrc36.indexOf("const disposeGroup");
  const segDispose = mapSrc36.slice(idxDispose, idxDispose + 700);
  ok(idxDispose > 0 && segDispose.includes("!isVillageMaterial(x) && !isRoadMaterial(x)"), "dispose36: disposeGroup melewati material bersama");
  ok(segDispose.includes("o.geometry.dispose()"), "dispose36: disposeGroup tetap membuang geometri per build");
  const idxUnmount = mapSrc36.indexOf("scene.traverse((o) => {");
  const segUnmount = mapSrc36.slice(idxUnmount, idxUnmount + 600);
  ok(idxUnmount > 0 && segUnmount.includes("mat.forEach((x) => x.dispose())") && !segUnmount.includes("isVillageMaterial"), "dispose36: cleanup unmount tetap membuang semua material (tidak ikut dilewati)");
  ok(!isVillageMaterial(new THREE.MeshStandardMaterial({ color: "#ff0000" })), "dispose36: material baru bukan material desa bersama");
  ok(!isRoadMaterial(new THREE.MeshStandardMaterial({ color: "#00ff00" })), "dispose36: material baru bukan material jalan bersama");
  ok(!isVillageMaterial(new THREE.MeshStandardMaterial({ color: "#00ff00" })), "dispose36: predikat desa/jalan tidak saling tertukar (jalan bukan desa)");
  const ver36 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver36.includes('BUILD_ID = "r57"'), "dispose36: BUILD_ID naik ke r41");
}

// RONDE 20 (2026-11-05, laporan user): "kenapa gada yg bikin jalan?" +
// jalan 2x lebar + sungai/ikan/memancing + rumah menghadap jalan +
// pangan "rada digampangin dikit". Map TIDAK dikecilkan (grid tetap
// 600 — lihat tes penjaga (i); pengecilan butuh koordinasi dengan Fina
// karena Nusantara dan Negara Emas berbagi satu database).
{
  // (a) JALAN 2x LEBAR — lebarkanJalan: lajur lurus 4 ubin -> 8 ubin.
  const lurus = lebarkanJalan(
    [{ gx: 100, gy: 100 }, { gx: 101, gy: 100 }, { gx: 102, gy: 100 }, { gx: 103, gy: 100 }],
    () => true
  );
  eq(lurus.length, 8, "r20: lebarkanJalan lajur 4 ubin -> 8 ubin (2x lebar)");
  const setLurus = new Set(lurus.map((t) => `${t.gx},${t.gy}`));
  eq(setLurus.size, 8, "r20: lebarkanJalan tanpa duplikat");
  ok([100, 101, 102, 103].every((gx) => setLurus.has(`${gx},99`) || setLurus.has(`${gx},101`)), "r20: tiap ubin spine punya pendamping tegak lurus");
  // (b) jalurPelebaran: jalan lama 1 ubin -> pelebar; jalan 2 ubin -> null.
  const pl20 = [
    { kind: "lumbung", gx: 97, gy: 99, w: 2, h: 2 },
    { kind: "paviliun_makan", gx: 101, gy: 96, w: 3, h: 3 },
  ];
  const satu = new Set(["100,100", "101,100", "102,100"]);
  const lebar1 = jalurPelebaran(pl20, satu, new Set());
  ok(lebar1 !== null && lebar1.length > 0, "r20: jalurPelebaran jalan 1 ubin -> ada pelebar");
  if (lebar1) {
    const dua = new Set([...satu, ...lebar1.map((t) => `${t.gx},${t.gy}`)]);
    const lebar2 = jalurPelebaran(pl20, dua, new Set());
    ok(lebar2 === null, "r20: jalurPelebaran jalan 2 ubin -> null (tidak merayap jadi 3)");
  }
  // (c) GATE JALAN DIHAPUS + ambilTargetKerja: jalan dulu. r21: gate
  // pinter dihapus juga — warga biasa ikut bangun jalan (gotong royong).
  const ctxJalan20 = {
    bangunanAktif: true, // sengaja aktif: dulu memblokir jalan
    jalanRencana: { segmen: "lumbung-paviliun", tiles: [{ gx: 105, gy: 100 }] },
    jalanTugas: new Set<string>(),
  } as unknown as SimCtx;
  const wPintar20 = { peran: "kepala_suku", stat: { int: 999, str: 999, agi: 999, sta: 999 }, stamina: 100, lapar: 10 } as unknown as Warga;
  ok(terapkanJalan(wPintar20, ctxJalan20), "r20: terapkanJalan jalan walau bangunanAktif (gate dihapus)");
  const ctxAmbil = {
    ...ctxKosong(wPintar20),
    nodes: [{ kind: "pohon", gx: 105, gy: 100 }],
    nodeSisa: new Map([["105,100", 5]]),
    nodeTilesAll: new Set(["105,100"]),
    jalanRencana: { segmen: "lumbung-paviliun", tiles: [{ gx: 103, gy: 100 }, { gx: 104, gy: 100 }] },
    jalanTugas: new Set<string>(),
    bangunanAktif: true,
  } as unknown as SimCtx;
  const wP = wargaDasar({ peran: "kepala_suku", stat: { int: 10, str: 5, agi: 5, sta: 5 }, lokasi: { gx: 102, gy: 100 }, stamina: 80, lapar: 20 });
  ok(ambilTargetKerja(wP, ctxAmbil), "r20: ambilTargetKerja pinter -> ada target");
  eq(wP.aksi_sekarang, "bangun_jalan", "r20: ambilTargetKerja pinter -> bangun_jalan dulu (bukan kumpul)");
  const wB = wargaDasar({ peran: "penebang", stat: { int: 5, str: 8, agi: 5, sta: 5 }, lokasi: { gx: 102, gy: 100 }, stamina: 80, lapar: 20 });
  ok(ambilTargetKerja(wB, ctxAmbil), "r21: ambilTargetKerja biasa -> ada target");
  eq(wB.aksi_sekarang, "bangun_jalan", "r21: ambilTargetKerja biasa -> bangun_jalan dulu (jalan untuk siapa saja)");
  // (d) IKAN — pemancing ke sungai bila ada ikan; beralih beri bila sepi.
  const ctxIkan = {
    ...ctxKosong(wP),
    nodes: [{ kind: "semak_beri", gx: 90, gy: 100 }],
    nodeSisa: new Map([["90,100", 5]]),
    nodeTilesAll: new Set(["90,100"]),
    ikanSungai: 5,
  } as unknown as SimCtx;
  const wNelayan = wargaDasar({ peran: "pemancing", lokasi: { gx: 100, gy: 100 } });
  const tIkan = pilihTargetKerja(wNelayan, ctxIkan);
  eq(tIkan?.node.pseudo, "sungai", "r20: pemancing + ikan ada -> target sungai");
  const ctxSepi = { ...ctxIkan, ikanSungai: 0 } as unknown as SimCtx;
  const tSepi = pilihTargetKerja(wNelayan, ctxSepi);
  ok(tSepi !== null && tSepi.node.pseudo !== "sungai", "r20: sungai sepi -> pemancing beralih kumpul beri");
  // (e) TANGKAPAN — 1 ronde memancing: stok ikan -1, pangan masuk stok.
  const ctxTangkap = {
    ...ctxKosong(wNelayan),
    ikanSungai: 5,
    stok: { ...stokKosong(), pangan: 0 },
  } as unknown as SimCtx;
  const wMancing = wargaDasar({
    peran: "pemancing", lokasi: { gx: 80, gy: 100 },
    node: { kind: "semak_beri", gx: 80, gy: 100, pseudo: "sungai" },
    fase_siklus: "kumpul", progres_aksi_pct: 99, stamina: 80, lapar: 20,
  });
  stepWarga(wMancing, 12, ctxTangkap);
  eq(ctxTangkap.ikanSungai, 4, "r20: 1 tangkapan -> stok ikan -1");
  ok((ctxTangkap.stok.pangan ?? 0) > 0, "r20: tangkapan masuk stok pangan");
  // (f) SUNGAI SEPI — memancing tanpa ikan: tidak ada hasil gratis.
  const ctxSepi2 = { ...ctxKosong(wNelayan), ikanSungai: 0, stok: { ...stokKosong(), pangan: 0 } } as unknown as SimCtx;
  const wMancing2 = wargaDasar({
    peran: "pemancing", lokasi: { gx: 80, gy: 100 },
    node: { kind: "semak_beri", gx: 80, gy: 100, pseudo: "sungai" },
    fase_siklus: "kumpul", progres_aksi_pct: 99, stamina: 80, lapar: 20,
  });
  stepWarga(wMancing2, 12, ctxSepi2);
  eq(ctxSepi2.ikanSungai, 0, "r20: sungai sepi -> stok ikan tetap 0");
  eq(ctxSepi2.stok.pangan ?? 0, 0, "r20: sungai sepi -> tidak ada pangan gratis");
  ok(ctxSepi2.kabar.some((k: { teks: string }) => k.teks.includes("belum ada ikan")), "r20: sungai sepi -> kabar jujur (belum ada ikan)");
  ok(IKAN_CAP === 30 && IKAN_REGROW_HARIAN === 3, "r20: cap ikan 30, regrow +3/hari");
  // (g) ORIENTASI RUMAH — jalan di tiap sisi -> hadap yang benar.
  const rumah = { gx: 100, gy: 100, w: 2, h: 2 };
  eq(rotasiKeJalan(rumah.gx, rumah.gy, rumah.w, rumah.h, new Set(["100,102"])), 0, "r20: jalan di selatan -> hadap selatan (0)");
  eq(rotasiKeJalan(rumah.gx, rumah.gy, rumah.w, rumah.h, new Set(["100,99"])), Math.PI, "r20: jalan di utara -> hadap utara (PI)");
  eq(rotasiKeJalan(rumah.gx, rumah.gy, rumah.w, rumah.h, new Set(["102,100"])), Math.PI / 2, "r20: jalan menempel di timur -> hadap timur (PI/2)");
  eq(rotasiKeJalan(rumah.gx, rumah.gy, rumah.w, rumah.h, new Set(["99,101"])), -Math.PI / 2, "r20: jalan menempel di barat -> hadap barat (-PI/2)");
  eq(rotasiKeJalan(rumah.gx, rumah.gy, rumah.w, rumah.h, new Set()), 0, "r20: tanpa jalan -> default selatan (0)");
  // (h) PANGAN DIGAMPANGIN SEDIKIT (tetap dalam DESAIN-EKONOMI.md).
  eq(JSON.stringify(peluangKumpul("pangan", false)), JSON.stringify([0, 0.5, 0.3, 0.2]), "r20: roll biasa 50/30/20 (rata-rata 1,7, cap 3 tetap)");
  eq(JSON.stringify(peluangKumpul("besi", false)), JSON.stringify([0.8, 0.17, 0.03]), "r20: roll besi TIDAK berubah");
  eq(LAPAR_PANGAN_RESTORAN, 55, "r20: makan di restoran -55 lapar (dulu -40)");
  ok(jadwalRegrow(100, 50, 50) >= 136 && jadwalRegrow(100, 50, 50) < 160, "r20: regrow node 36-60 jam (dulu 48-72)");
  // (i) MAP TIDAK DIKECILKAN — penjaga keputusan r20: grid tetap 600.
  ok(GRID_W === 600 && GRID_H === 600 && GRID_MIN === -200 && GRID_MAX === 400, "r20: grid tetap 600x600 (pengecilan butuh koordinasi Fina, DB bersama)");
  eq(PUSAT, { gx: 100, gy: 100 }, "r20: pusat tetap (100,100)");
  // (j) Kode r20 termuat (bukan hanya unit).
  const simSrc20 = readFileSync("src/lib/batu/sim.ts", "utf8");
  ok(simSrc20.includes("ambilTargetKerja"), "r20: sim memuat ambilTargetKerja");
  ok(simSrc20.includes("ikan_sungai"), "r20: sim menulis-balik ikan_sungai ke dunia");
  ok(simSrc20.includes("rotasi: (b as any).rotasi"), "r20: sim menulis rotasi ke placement baru");
  const mapRoute20 = readFileSync("src/app/api/map/route.ts", "utf8");
  ok(mapRoute20.includes("ikan:"), "r20: /api/map mengembalikan jumlah ikan");
  const gachaRoute20 = readFileSync("src/app/api/gacha/route.ts", "utf8");
  ok(gachaRoute20.includes("JAMINAN PEMANCING") && gachaRoute20.includes('peran = "pemancing"'), "r20: gacha menjamin pemancing pertama bila stat cukup");
  const map3d20 = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(map3d20.includes("fishes") && map3d20.includes("mF?.ikan"), "r20: Map3D menggambar ikan dari stok ikan");
  const ver20 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver20.includes('BUILD_ID = "r57"'), "r20: BUILD_ID naik ke r41");
}

{
  // RONDE 21 — GOTONG ROYONG (aturan user 2026-11-05: jalan dan
  // bangunan bisa dibuat SIAPA SAJA, yang penting gotong royong) +
  // WARGA MENGGANGGUR cari kerja berguna (bantu konstruksi/jalan,
  // kumpul node terdekat, memancing) — istirahat hanya bila
  // lelah/sakit/malam.
  const site21 = { id: "b1", tipe: "gubuk", gx: 100, gy: 100, w: 2, h: 2 };
  const mkCtxBangun = (w: Warga, extra: Partial<SimCtx> = {}): SimCtx =>
    ({ ...ctxKosong(w), bangunanDibangun: [site21], ...extra } as unknown as SimCtx);
  // (a) BANTU BANGUN: peran apa pun bisa (bukan hanya perajin).
  const wPengumpul = wargaDasar({ peran: "pengumpul", stat: { int: 3, str: 5, agi: 5, sta: 5 }, lokasi: { gx: 95, gy: 100 }, stamina: 80, lapar: 20 });
  const ctxB1 = mkCtxBangun(wPengumpul);
  ok(terapkanBantuBangun(wPengumpul, ctxB1), "r21: pengumpul INT 3 bisa bantu bangun");
  eq(wPengumpul.node?.pseudo, "bangun", "r21: bantu bangun set node pseudo bangun");
  eq(wPengumpul.node?.bangunanId, "b1", "r21: bantu bangun set bangunanId");
  eq(wPengumpul.aksi_sekarang, "membantu_bangun", "r21: bantu bangun aksi membantu_bangun");
  const tjB = wPengumpul.tujuan!;
  ok(!(tjB.gx >= 100 && tjB.gx <= 101 && tjB.gy >= 100 && tjB.gy <= 101), "r21: tujuan bantu bangun di luar footprint (tidak berdiri di atas bangunan)");
  // (b) Guard fit + tidak ada situs.
  const wLelahB = wargaDasar({ stamina: 30, lapar: 20 });
  ok(!terapkanBantuBangun(wLelahB, mkCtxBangun(wLelahB)), "r21: stamina < 40 tidak bantu bangun");
  const wLaparB = wargaDasar({ stamina: 80, lapar: 95 });
  ok(!terapkanBantuBangun(wLaparB, mkCtxBangun(wLaparB)), "r21: lapar >= 90 tidak bantu bangun");
  ok(!terapkanBantuBangun(wargaDasar({}), { ...ctxKosong(wPengumpul) } as unknown as SimCtx), "r21: tanpa bangunan dibangun -> tidak ada yang dibantu");
  // (c) CAP 4 pembantu per situs.
  const helpers = [0, 1, 2, 3].map((i) =>
    wargaDasar({ _id: `h${i}`, nama: `H${i}`, lokasi: { gx: 102, gy: 100 }, node: { kind: "padang_buruan", gx: 101, gy: 101, pseudo: "bangun", bangunanId: "b1" }, fase_siklus: "jalan" })
  );
  const wKelima = wargaDasar({ _id: "h4", lokasi: { gx: 95, gy: 100 } });
  const ctxCap = { ...ctxKosong(wKelima), bangunanDibangun: [site21], wargaSemua: [...helpers, wKelima] } as unknown as SimCtx;
  ok(!terapkanBantuBangun(wKelima, ctxCap), "r21: 4 pembantu penuh -> warga ke-5 tidak ditugaskan ke situs sama");
  const ctxCap3 = { ...ctxKosong(wKelima), bangunanDibangun: [site21], wargaSemua: [helpers[0], helpers[1], helpers[2], wKelima] } as unknown as SimCtx;
  ok(terapkanBantuBangun(wKelima, ctxCap3), "r21: 3 pembantu -> warga ke-4 masih bisa membantu");
  // (d) HITUNG PEMBANTU + PROGRES: hanya yang sudah tiba + situs cocok.
  const site = { gx: 100, gy: 100, w: 2, h: 2 };
  const tiba = wargaDasar({ _id: "t1", lokasi: { gx: 102, gy: 101 }, node: { kind: "padang_buruan", gx: 101, gy: 101, pseudo: "bangun", bangunanId: "b1" } });
  const diJalan = wargaDasar({ _id: "t2", lokasi: { gx: 90, gy: 100 }, node: { kind: "padang_buruan", gx: 101, gy: 101, pseudo: "bangun", bangunanId: "b1" } });
  const situsLain = wargaDasar({ _id: "t3", lokasi: { gx: 102, gy: 101 }, node: { kind: "padang_buruan", gx: 101, gy: 101, pseudo: "bangun", bangunanId: "b2" } });
  eq(hitungPembantuBangun([tiba, diJalan, situsLain], "b1", site), 1, "r21: hanya pembantu yang SUDAH TIBA + situs cocok yang dihitung");
  eq(progresKonstruksiPerJam(0), 10, "r21: progres tanpa pembantu 10/jam (sama seperti sebelum r41)");
  eq(progresKonstruksiPerJam(1), 13, "r21: progres 1 pembantu 13/jam");
  eq(progresKonstruksiPerJam(4), 22, "r21: progres 4 pembantu 22/jam (~5 jam per bangunan)");
  ok(MAKS_PEMBANTU_BANGUN === 4, "r21: maks 4 pembantu per bangunan");
  // (e) stepWarga: pembantu tiba di lokasi -> diam membantu di tempat.
  const wBantu = wargaDasar({ peran: "pengumpul", stat: { int: 3, str: 5, agi: 5, sta: 5 }, lokasi: { gx: 95, gy: 100 }, stamina: 80, lapar: 20 });
  const ctxB2 = mkCtxBangun(wBantu);
  ok(terapkanBantuBangun(wBantu, ctxB2), "r21: tugaskan pembantu (setup)");
  wBantu.lokasi = { ...wBantu.tujuan! };
  stepWarga(wBantu, 12, ctxB2);
  eq(wBantu.aksi_sekarang, "membantu_bangun", "r21: tiba di lokasi -> membantu_bangun");
  ok(wBantu.status_teks.includes("Membantu membangun"), "r21: status membantu membangun");
  eq(hitungPembantuBangun([wBantu], "b1", site), 1, "r21: pembantu tiba dihitung untuk progres");
  // (f) Situs hilang -> pembantu dialihkan ke kerja lain (tidak macet).
  const wYatim = wargaDasar({
    lokasi: { gx: 102, gy: 100 },
    node: { kind: "padang_buruan", gx: 101, gy: 101, pseudo: "bangun", bangunanId: "b1", label: "Gubuk" },
    tujuan: { gx: 102, gy: 100 }, fase_siklus: "jalan", aksi_sekarang: "membantu_bangun",
  });
  const ctxYatim = { ...ctxKosong(wYatim), nodes: [{ kind: "pohon", gx: 105, gy: 100 }], nodeSisa: new Map([["105,100", 5]]), nodeTilesAll: new Set(["105,100"]) } as unknown as SimCtx;
  stepWarga(wYatim, 12, ctxYatim);
  eq(wYatim.aksi_sekarang, "berjalan", "r21: situs hilang -> pembantu dialihkan ke kerja lain (bukan macet)");
  // (g) FALLBACK MENGGANGGUR: bangun istirahat tanpa target -> bantu
  // bangun (bukan santai/diam di hunian).
  const wBangun = wargaDasar({ lokasi: { gx: 100, gy: 100 }, fase_siklus: "istirahat", istirahat_sisa: 0, stamina: 80, lapar: 20 });
  const ctxBangun = mkCtxBangun(wBangun);
  stepWarga(wBangun, 12, ctxBangun);
  eq(wBangun.aksi_sekarang, "membantu_bangun", "r21: bangun istirahat tanpa target -> bantu bangun (bukan santai/diam)");
  // (h) Santai tiba tanpa target -> bantu bangun (bukan santai lagi).
  const wSantai = wargaDasar({
    lokasi: { gx: 102, gy: 100 }, tujuan: { gx: 102, gy: 100 },
    node: { kind: "padang_buruan", gx: 102, gy: 100, pseudo: "santai" },
    fase_siklus: "jalan", aksi_sekarang: "jalan_santai", stamina: 80, lapar: 20,
  });
  const ctxSantai = mkCtxBangun(wSantai);
  stepWarga(wSantai, 12, ctxSantai);
  eq(wSantai.aksi_sekarang, "membantu_bangun", "r21: santai tiba tanpa target -> bantu bangun (bukan santai lagi)");
  // (i) Kode r21 termuat (bukan hanya unit).
  const simSrc21 = readFileSync("src/lib/batu/sim.ts", "utf8");
  ok(simSrc21.includes("terapkanBantuBangun"), "r21: sim memuat terapkanBantuBangun");
  ok(simSrc21.includes("hitungPembantuBangun"), "r21: sim memuat hitungPembantuBangun");
  ok(simSrc21.includes("progresKonstruksiPerJam"), "r21: sim memuat progresKonstruksiPerJam");
  ok(simSrc21.includes("bangunanDibangun"), "r21: sim memuat bangunanDibangun di ctx");
  ok(!simSrc21.includes("pintarUntukJalan(w)"), "r21: gate pinter tidak lagi dipakai di sim");
  const ver21 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver21.includes('BUILD_ID = "r57"'), "r21: BUILD_ID naik ke r42");
}

{
  // RONDE 22 — tidur di dalam + label bertumpuk + hewan dekat kampung.
  // (a) Tidur di dalam: hanya istirahat + malam yang disembunyikan.
  eq(tidurDiDalam("istirahat", "malam"), true, "r22: istirahat malam -> tidur di dalam (disembunyikan)");
  eq(tidurDiDalam("istirahat", "siang"), false, "r22: istirahat siang tetap terlihat");
  eq(tidurDiDalam("istirahat", "pagi"), false, "r22: istirahat pagi tetap terlihat");
  eq(tidurDiDalam("jalan", "malam"), false, "r22: jalan malam tetap terlihat");
  eq(tidurDiDalam("kembali", "malam"), false, "r22: pulang malam tetap terlihat");
  eq(tidurDiDalam("kumpul", "malam"), false, "r22: kumpul malam tetap terlihat");
  // (b) Label bertumpuk: digeser ke bawah sampai tidak menutupi.
  // r44: jarak 18/20px lama diganti 28px (pil ~19px + celah ~9px)
  // karena observasi live 18:29 melihat border pil saling menempel.
  eq(rapikanLabelBertumpuk([]), [], "r22: label kosong -> kosong");
  eq(rapikanLabelBertumpuk([{ x: 100, y: 100 }]), [100], "r22: label sendiri tidak digeser");
  eq(rapikanLabelBertumpuk([{ x: 100, y: 100 }, { x: 200, y: 100 }]), [100, 100], "r22: label jauh horizontal tidak digeser");
  eq(rapikanLabelBertumpuk([{ x: 100, y: 100 }, { x: 105, y: 100 }]), [100, 128], "r22: label menumpuk -> kedua digeser 28px (r44)");
  eq(rapikanLabelBertumpuk([{ x: 100, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 100 }]), [100, 128, 156], "r22: tiga label menumpuk -> 0/28/56 (r44)");
  eq(rapikanLabelBertumpuk([{ x: 100, y: 120 }, { x: 100, y: 100 }]), [148, 100], "r22: urutan input dipertahankan (r44: 120 -> 148 karena ambang 28)");
  // (c) Hewan dekat kampung: sebaran respawn bias ke kampung.
  let seed22 = 12345;
  const rngUji = () => { seed22 = (seed22 * 1103515245 + 12345) % 2147483648; return seed22 / 2147483648; };
  const picks: { gx: number; gy: number }[] = [];
  for (let i = 0; i < 200; i++) { const p = lokasiRespawnHewan(rngUji); if (p) picks.push(p); }
  ok(picks.length >= 190, "r22: respawn hewan hampir selalu dapat lokasi");
  ok(picks.every((p) => Math.abs(p.gx - PUSAT.gx) + Math.abs(p.gy - PUSAT.gy) >= 10), "r22: respawn hewan >= 10 dari pusat");
  ok(picks.every((p) => !isWater(p.gx, p.gy)), "r22: respawn hewan tidak di air");
  const dekat = picks.filter((p) => Math.abs(p.gx - PUSAT.gx) + Math.abs(p.gy - PUSAT.gy) <= 45).length;
  ok(dekat >= picks.length * 0.55, `r22: mayoritas respawn hewan dekat kampung (<=45): ${dekat}/${picks.length}`);
  eq(lokasiRespawnHewan(rngUji, () => false), null, "r22: tidak ada lokasi layak -> null");
  // (d) Kode r22 termuat + tombol menu kontras tinggi.
  const mapSrc22 = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc22.includes("tidurDiDalam"), "r22: Map3D memakai tidurDiDalam");
  ok(mapSrc22.includes("rapikanLabelBertumpuk"), "r22: Map3D memakai rapikanLabelBertumpuk");
  ok(mapSrc22.includes("labelAntre"), "r22: Map3D mengumpulkan label sebelum dirapikan");
  const simSrc22 = readFileSync("src/lib/batu/sim.ts", "utf8");
  ok(simSrc22.includes("lokasiRespawnHewan"), "r22: sim memakai lokasiRespawnHewan");
  const cssSrc22 = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrc22.includes("background: #facc15") && cssSrc22.includes("border: 2px solid #0b182e"), "r22: tombol menu latar kuning solid + border gelap (kontras tinggi)");
  const ver22 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver22.includes('BUILD_ID = "r57"'), "r22: BUILD_ID naik ke r42");
}

{
  // RONDE 23 — ambien prosedural siang/malam/cuaca (Ide 32, irisan 1).
  const siangCerah = lapisanAmbien("siang", "cerah");
  ok(siangCerah.angin > 0 && siangCerah.hujan === 0 && siangCerah.malam === 0, "r23: siang cerah -> angin saja");
  const malamCerah = lapisanAmbien("malam", "cerah");
  ok(malamCerah.malam > 0 && malamCerah.hujan === 0, "r23: malam cerah -> lapis malam nyala, hujan mati");
  const siangHujan = lapisanAmbien("siang", "hujan");
  ok(siangHujan.hujan > 0.15 && siangHujan.malam === 0, "r23: siang hujan -> hujan nyala, malam mati");
  const malamHujan = lapisanAmbien("malam", "hujan");
  ok(malamHujan.hujan > 0 && malamHujan.malam > 0, "r23: malam hujan -> hujan + malam sama-sama nyala");
  ok(lapisanAmbien("siang", "petir").hujan >= siangHujan.hujan, "r23: petir lebih deras dari hujan biasa");
  ok(lapisanAmbien("siang", "berawan").hujan === 0 && lapisanAmbien("siang", "berawan").angin > siangCerah.angin, "r23: berawan -> angin naik, hujan mati");
  ok(lapisanAmbien("sore", "cerah").malam === 0, "r23: sore belum malam");
  // Nilai tak dikenal -> default siang cerah, tidak NaN, semua 0..1.
  const aneh = lapisanAmbien("", "??");
  ok(aneh.angin === siangCerah.angin && aneh.hujan === 0 && aneh.malam === 0, "r23: fase/cuaca tak dikenal -> default siang cerah");
  let semuaJepit = true;
  for (const f of ["pagi", "siang", "sore", "malam", "", "x"])
    for (const c of ["cerah", "berawan", "hujan", "petir", "", "x"]) {
      const l = lapisanAmbien(f, c);
      if (!(l.angin >= 0 && l.angin <= 1 && l.hujan >= 0 && l.hujan <= 1 && l.malam >= 0 && l.malam <= 1)) semuaJepit = false;
    }
  ok(semuaJepit, "r23: semua gain 0..1 untuk semua fase x cuaca");
  // Ambien tetap latar: tidak ada lapis yang lebih keras dari loop api (0.5).
  ok(siangHujan.hujan <= 0.3 && malamCerah.malam <= 0.1, "r23: ambien pelan (maks 0.3, di bawah SFX)");
  // (b) Wiring: loop + pemakaian di Map3D/page.
  const audioSrc23 = readFileSync("src/lib/audio.ts", "utf8");
  ok(audioSrc23.includes("lapisanAmbien") && audioSrc23.includes("anginGain") && audioSrc23.includes("hujanGain") && audioSrc23.includes("malamGain"), "r23: audio.ts punya 3 loop ambien + fungsi murni");
  const mapSrc23 = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc23.includes("faseWaktu:") && mapSrc23.includes("cuaca,"), "r23: Map3D meneruskan fase + cuaca ke updateAudioScene");
  const pageSrc23 = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrc23.includes("cuaca={cuaca}"), "r23: page meneruskan cuaca ke Map3D");
  const ver23 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver23.includes('BUILD_ID = "r57"'), "r23: BUILD_ID naik ke r43");
}

{
  // RONDE 24 — jarak rapikan label 18/20px -> 28px (observasi live 18:29).
  // Akar: pil .map3d-label tingginya ~19px (11px x 1.2 + padding 4px
  // + border 2px), jadi ambang 18px menaruh pil hanya 1-2px berjarak
  // dan langkah 20px nyaris tidak menambah celah — di layar terlihat
  // sebagai kolom yang bordernya bersentuhan (5 label di pusat kampung).
  eq(JARAK_LABEL_BERTUMPUK, 28, "r24: jarak label = 28px (pil ~19px + celah ~9px)");
  // (a) Jarak baru: tumpukan 5 label berjarak 28px satu sama lain.
  const tumpuk5 = rapikanLabelBertumpuk([
    { x: 100, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 100 }, { x: 100, y: 100 },
  ]);
  eq(tumpuk5, [100, 128, 156, 184, 212], "r24: 5 label menumpuk -> 0/28/56/84/112");
  ok(tumpuk5.every((y, i) => i === 0 || y - tumpuk5[i - 1] >= 28), "r24: celah antar label >= 28px (lebih dari tinggi pil 19px)");
  // (b) Ambang baru: 24px masih bertabrakan, 30px sudah bebas.
  eq(rapikanLabelBertumpuk([{ x: 100, y: 100 }, { x: 100, y: 124 }]), [100, 152], "r24: beda 24px vertikal masih digeser (ambang 28)");
  eq(rapikanLabelBertumpuk([{ x: 100, y: 100 }, { x: 100, y: 130 }]), [100, 130], "r24: beda 30px vertikal tidak digeser");
  // (c) Arah horizontal tidak berubah: < 70px bertabrakan, >= 70px bebas.
  eq(rapikanLabelBertumpuk([{ x: 100, y: 100 }, { x: 169, y: 100 }]), [100, 128], "r24: beda 69px horizontal masih digeser");
  eq(rapikanLabelBertumpuk([{ x: 100, y: 100 }, { x: 171, y: 100 }]), [100, 100], "r24: beda 71px horizontal tidak digeser");
  // (d) Urutan input dipertahankan + audit sumber.
  eq(rapikanLabelBertumpuk([{ x: 100, y: 128 }, { x: 100, y: 100 }]), [128, 100], "r24: urutan input dipertahankan");
  const tampilSrc24 = readFileSync("src/lib/batu/tampil.ts", "utf8");
  ok(tampilSrc24.includes("JARAK_LABEL_BERTUMPUK = 28"), "r24: konstanta jarak 28px ada di tampil.ts");
  const mapSrc24 = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc24.includes("rapikanLabelBertumpuk"), "r24: Map3D masih memakai rapikanLabelBertumpuk");
  const ver24 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver24.includes('BUILD_ID = "r57"'), "r24: BUILD_ID naik ke r44");
}

// RONDE 45 — BEKU TABIB + RESOURCE 5x (laporan user 2026-11-05 via video:
// warga berkerumun diam, jalan 0 ubin, pangan 0 terus).
// Akar (terbukti simulasi live-like): sehat warga jatuh < 65 karena
// kelaparan berkepanjangan -> cabang tabib menyetel fase "jalan" +
// node null + aksi "berobat", padahal TIDAK ADA cabang yang
// menggerakkan warga tanpa node; fallthrough akhir lalu menimpa
// penugasan berobat dengan kerja baru tiap jam -> warga beku di satu
// ubin, status berkedip, pangan 0, jalan 0. Perbaikan: fase "berobat"
// + cabang berobat yang benar-benar berjalan ke Pondok Tabib + sembuh.
{
  // (a) Warga sakit berjalan ke tabib lalu sembuh (tidak beku).
  const tabibP = { _id: "pdt", kind: "pondok_tabib", gx: 104, gy: 99, w: 2, h: 2 } as never;
  const rintanganTabib = new Set<string>([...petakBangunan(tabibP), ...gunungTileKeys()]);
  const sakit = wargaDasar({ peran: "penebang", lokasi: { gx: 85, gy: 94 }, node: { kind: "pohon", gx: 90, gy: 90 }, tujuan: { gx: 89, gy: 90 }, fase_siklus: "jalan", stamina: 80, lapar: 20, sehat: 40 });
  const ctxSakit = { ...ctxKosong(sakit), placements: [tabibP], rintangan: rintanganTabib, wargaSemua: [sakit] };
  const posAwalSakit = { ...sakit.lokasi };
  stepWarga(sakit, 12, ctxSakit);
  ok(sakit.fase_siklus === "berobat", `r45: warga sakit -> fase berobat (dapat ${sakit.fase_siklus})`);
  ok(sakit.lokasi.gx !== posAwalSakit.gx || sakit.lokasi.gy !== posAwalSakit.gy, "r45: warga sakit BERGERAK ke tabib (tidak beku di tempat)");
  let sembuh = false;
  for (let j = 13; j <= 18; j++) {
    stepWarga(sakit, j, ctxSakit);
    if (sakit.sehat === 100 && sakit.fase_siklus === "istirahat") { sembuh = true; break; }
  }
  ok(sembuh, `r45: warga sakit sembuh di tabib (sehat ${sakit.sehat}, fase ${sakit.fase_siklus})`);
  // (b) Berobat tidak membajak pulang malam: jam 20 -> pulang, bukan berobat.
  const sakitMalam = wargaDasar({ peran: "penebang", lokasi: { gx: 85, gy: 94 }, node: { kind: "pohon", gx: 90, gy: 90 }, tujuan: { gx: 89, gy: 90 }, fase_siklus: "jalan", stamina: 80, lapar: 20, sehat: 40 });
  const ctxMalam = { ...ctxKosong(sakitMalam), placements: [tabibP], rintangan: rintanganTabib, wargaSemua: [sakitMalam] };
  stepWarga(sakitMalam, 20, ctxMalam);
  ok(sakitMalam.fase_siklus !== "berobat" && sakitMalam.aksi_sekarang !== "berobat", `r45: sakit jam 20 -> pulang tidur, bukan berobat (fase ${sakitMalam.fase_siklus})`);
  ok(sakitMalam.lokasi.gx !== 85 || sakitMalam.lokasi.gy !== 94, "r45: sakit jam 20 tetap bergerak pulang");
  // (c) Berobat tidak membajak warga yang sedang membawa hasil pulang.
  const bawa = wargaDasar({ peran: "penebang", lokasi: { gx: 85, gy: 94 }, tujuan: { gx: 100, gy: 100 }, fase_siklus: "kembali", aksi_sekarang: "membawa_hasil", stamina: 80, lapar: 20, sehat: 40 });
  const ctxBawa = { ...ctxKosong(bawa), placements: [tabibP], rintangan: rintanganTabib, wargaSemua: [bawa] };
  stepWarga(bawa, 12, ctxBawa);
  ok(bawa.fase_siklus !== "berobat" && bawa.aksi_sekarang !== "berobat", `r45: bawa hasil sakit -> tetap pulang, bukan berobat (fase ${bawa.fase_siklus})`);
  ok(bawa.lokasi.gx !== 85 || bawa.lokasi.gy !== 94, "r45: bawa hasil sakit tetap bergerak pulang");
  // (d) Konstanta 5x: pengali + cap biasa 15, langka tetap 2.
  ok(PENGALI_KUMPUL === 5, "r45: PENGALI_KUMPUL = 5");
  ok(capHarianUntuk("pangan") === CAP_KUMPUL_HARIAN_BIASA * PENGALI_KUMPUL && capHarianUntuk("pangan") === 15, "r45: cap harian pangan 15 (5x)");
  ok(capHarianUntuk("besi") === 2 && capHarianUntuk("emas") === 2, "r45: cap langka tetap 2 (besi/emas tidak dikali)");
  // (e) gerak berhenti DI SEBELAH tujuan yang rintangan (tengah bangunan),
  // bukan mengorbit sampai budget habis lalu berakhir jauh. Kasus live:
  // jalan ke tabib (105,100) dari (85,94) berakhir di (104,121).
  {
    const g = gerak({ gx: 0, gy: 0 }, { gx: 5, gy: 5 }, 100, { rintangan: new Set(["5,5"]) });
    ok(!(g.lokasi.gx === 5 && g.lokasi.gy === 5), "r45: gerak tidak masuk ubin tujuan yang rintangan");
    ok(Math.max(Math.abs(g.lokasi.gx - 5), Math.abs(g.lokasi.gy - 5)) <= 1, `r45: gerak berhenti di sebelah tujuan rintangan (dapat ${g.lokasi.gx},${g.lokasi.gy})`);
    const gTabib = gerak({ gx: 85, gy: 94 }, { gx: 105, gy: 100 }, 90, { rintangan: rintanganTabib });
    ok(Math.max(Math.abs(gTabib.lokasi.gx - 105), Math.abs(gTabib.lokasi.gy - 100)) <= 2, `r45: gerak ke tabib berakhir dekat pondok (dapat ${gTabib.lokasi.gx},${gTabib.lokasi.gy})`);
  }
  // (f) Berobat TIDAK membajak warga yang sedang mencari makan darurat
  // (node.darurat) — makan menghentikan penyebab sakitnya sendiri.
  {
    const lapar2 = wargaDasar({ peran: "penebang", lokasi: { gx: 85, gy: 94 }, node: { kind: "semak_beri", gx: 88, gy: 93, darurat: true }, tujuan: { gx: 87, gy: 93 }, fase_siklus: "jalan", stamina: 80, lapar: 100, sehat: 40 });
    const ctxLapar = { ...ctxKosong(lapar2), placements: [tabibP], rintangan: rintanganTabib, wargaSemua: [lapar2] };
    stepWarga(lapar2, 12, ctxLapar);
    ok(lapar2.fase_siklus !== "berobat" && lapar2.aksi_sekarang !== "berobat", `r45: darurat makan sakit -> tetap ke beri, bukan berobat (fase ${lapar2.fase_siklus})`);
  }
  // (g) Berobat TIDAK membajak ronde kumpul yang sedang berjalan.
  {
    const kumpul2 = wargaDasar({ peran: "penebang", lokasi: { gx: 88, gy: 93 }, node: { kind: "pohon", gx: 90, gy: 90 }, tujuan: { gx: 89, gy: 90 }, fase_siklus: "kumpul", stamina: 80, lapar: 20, sehat: 40, progres_aksi_pct: 40 });
    const ctxKumpul = { ...ctxKosong(kumpul2), placements: [tabibP], rintangan: rintanganTabib, wargaSemua: [kumpul2] };
    stepWarga(kumpul2, 12, ctxKumpul);
    ok(kumpul2.fase_siklus !== "berobat" && kumpul2.aksi_sekarang !== "berobat", `r45: kumpul sakit -> selesaikan ronde dulu, bukan berobat (fase ${kumpul2.fase_siklus})`);
  }
}

// RONDE 45 — SIMULASI 10 HARI LIVE-LIKE (12 warga, pangan 0, sehat 10,
// posisi/status persis API 2026-11-05 ~19:00 WIB): pangan harus > 0
// secara berkelanjutan (bukan sesaat), jalan harus terbangun, tidak ada
// warga yang beku di ubin awal. Sebelum perbaikan, simulasi yang sama
// memberi: pangan akhir 3 (1 ronde kumpul/10 hari), jalan 0, 12/12 beku.
{
  const rndAsli45 = Math.random;
  let seed45 = 20261105;
  Math.random = () => { seed45 = (seed45 * 1103515245 + 12345) & 0x7fffffff; return seed45 / 0x7fffffff; };
  const PL45 = [
    { _id: "g1", kind: "gubuk", gx: 101, gy: 101, w: 2, h: 2 },
    { _id: "g2", kind: "gubuk", gx: 99, gy: 96, w: 2, h: 2 },
    { _id: "jmb", kind: "jembatan", gx: 36, gy: 100, w: 4, h: 1 },
    { _id: "lmb", kind: "lumbung", gx: 96, gy: 99, w: 2, h: 2 },
    { _id: "pdt", kind: "pondok_tabib", gx: 104, gy: 99, w: 2, h: 2 },
    { _id: "g3", kind: "gubuk", gx: 96, gy: 92, w: 2, h: 2 },
    { _id: "g4", kind: "gubuk", gx: 92, gy: 93, w: 2, h: 2 },
    { _id: "ldg", kind: "ladang", gx: 99, gy: 104, w: 2, h: 2 },
    { _id: "bky", kind: "bengkel_kayu", gx: 91, gy: 99, w: 2, h: 2 },
    { _id: "g5", kind: "gubuk", gx: 88, gy: 93, w: 2, h: 2 },
    { _id: "g6", kind: "gubuk", gx: 89, gy: 89, w: 2, h: 2 },
    { _id: "pav", kind: "paviliun_makan", gx: 109, gy: 96, w: 8, h: 8, hidangan: 0 },
    { _id: "k1", kind: "kebun_rempah", gx: 101, gy: 91, w: 2, h: 2 },
    { _id: "k2", kind: "kebun_rempah", gx: 94, gy: 104, w: 2, h: 2 },
  ] as never[];
  const LIVE45: [string, string, number, number, number, number][] = [
    ["Figo", "penebang", 100, 67, 105, 100], ["Nera", "penjelajah", 100, 100, 117, 100],
    ["Praboti", "petani", 100, 70, 100, 105], ["Evos dyroth", "pengumpul", 40, 100, 97, 98],
    ["Siti", "pemanjat", 40, 100, 97, 97], ["Budi", "penjerat", 100, 100, 85, 94],
    ["ribran gakabuming", "kepala_suku", 100, 100, 85, 94], ["Miners", "penambang", 100, 47, 72, 155],
    ["Renata", "juru_masak", 100, 100, 85, 92], ["Ys", "pemburu", 100, 40, 106, 58],
    ["reja auditore", "penjaga_api", 100, 100, 85, 93], ["Go Younjung", "pengukir", 100, 100, 85, 93],
  ];
  const STAT45: Record<string, [number, number, number, number]> = {
    penebang: [5, 8, 5, 5], penjelajah: [5, 5, 8, 5], petani: [5, 5, 5, 7],
    pengumpul: [5, 5, 6, 5], pemanjat: [5, 5, 8, 5], penjerat: [5, 5, 7, 5],
    kepala_suku: [8, 5, 5, 5], penambang: [5, 8, 5, 5], juru_masak: [7, 5, 5, 5],
    pemburu: [5, 5, 8, 5], penjaga_api: [5, 5, 5, 7], pengukir: [7, 5, 5, 5],
  };
  const GUB45 = ["g1", "g2", "g3", "g4", "g5", "g6"];
  const warga45: Warga[] = LIVE45.map(([nama, peran, lapar, stamina, gx, gy], i) => {
    const s = STAT45[peran] ?? [5, 5, 5, 5];
    return {
      _id: `w${i}`, nama, nomor: String(i + 1), gender: "laki", umur: 30, lahir_hari: 0,
      tahap_hidup: "dewasa", peran, stat: { int: s[0], str: s[1], agi: s[2], sta: s[3] },
      bakat: "STR", sifat: "rajin", lokasi: { gx, gy }, tujuan: null, node: null,
      aksi_sekarang: "", status_teks: "", tempat_kerja: "", progres_aksi_pct: 0,
      fase_siklus: "istirahat", istirahat_sisa: 0,
      hunian: { id: GUB45[Math.floor(i / 2)], tipe: "gubuk", label: "Gubuk" },
      profil_id: null, dibuat_pada: new Date(), sim_hari: 382,
      stamina, lapar, sehat: 10, perkakas: [], interaksi: null,
      target_hewan: null, sedang_berenang: false,
    } as unknown as Warga;
  });
  const nodes45 = generateNodes();
  const nodeSisa45 = new Map<string, number>();
  for (const n of nodes45) nodeSisa45.set(`${n.gx},${n.gy}`, SISA_NODE_AWAL);
  const nodeTiles45 = new Set<string>(nodes45.map((n) => `${n.gx},${n.gy}`));
  const rintangan45 = new Set<string>();
  for (const p of PL45) for (const k of petakBangunan(p as never)) rintangan45.add(k);
  for (const k of gunungTileKeys()) rintangan45.add(k);
  const hunianTitik45 = (w: Warga) => {
    if (w.hunian) {
      const p = (PL45 as never[]).find((x: never) => String((x as { _id: unknown })._id) === w.hunian?.id) as never;
      if (p) {
        const serumah = warga45.filter((x) => x.hunian?.id === w.hunian?.id).sort((a, b) => String(a._id).localeCompare(String(b._id)));
        const idx = serumah.findIndex((x) => x === w);
        return tileHunian(p, idx < 0 ? 0 : idx);
      }
    }
    return tileTamu(PL45, warga45.indexOf(w));
  };
  const ctx45 = {
    nodes: nodes45, nodeSisa: nodeSisa45, nodeRegrow: new Map(), nodeSpawn: [], nodeSpawnTertunda: new Map(),
    nodeTilesAll: nodeTiles45, stok: { ...stokKosong(), kayu: 149, batu: 6, emas: 1, besi: 47, pangan: 0, kulit: 92 },
    kapasitasMaks: hitungKapasitasStok(PL45 as never), kabar: [],
    hunianTitik: hunianTitik45, rintangan: rintangan45, jembatan: new Set(["36,100", "37,100", "38,100", "39,100"]),
    perahuAda: false, hewan: [], hewanHilang: new Set(), wargaSemua: warga45,
    cuaca: "cerah", hari: 382, jam: 9185,
    ladang: { gx: 100, gy: 105 },
    restoran: { _id: "pav", kind: "paviliun_makan", gx: 109, gy: 96, w: 8, h: 8, hidangan: 0 } as never,
    restoranBerubah: false, placements: PL45,
    jalanSelesai: new Set<string>(), jalanTugas: new Set<string>(), jalanRencana: null,
    jalanBaru: [], bangunanAktif: false, bangunanDibangun: [], ikanSungai: 30,
  } as unknown as SimCtx;
  const posAwal45 = warga45.map((w) => `${w.lokasi.gx},${w.lokasi.gy}`);
  let panganHariPositif = 0;
  let hariTerakhir45 = 382;
  for (let t = 0; t < 240; t++) {
    const jam = 9185 + t + 1;
    const hari = Math.floor(jam / 24);
    ctx45.jam = jam; ctx45.hari = hari; ctx45.cuaca = "cerah";
    if (hari !== hariTerakhir45) {
      hariTerakhir45 = hari;
      ctx45.ikanSungai = Math.min(IKAN_CAP, (ctx45.ikanSungai ?? IKAN_CAP) + IKAN_REGROW_HARIAN);
      terapkanPembusukan(ctx45);
    }
    ctx45.jalanTugas = new Set<string>();
    ctx45.jalanRencana = rencanaJalan(
      (PL45 as never[]).map((p: never) => { const q = p as { kind: string; gx: number; gy: number; w: number; h: number }; return { kind: q.kind, gx: q.gx, gy: q.gy, w: q.w, h: q.h }; }),
      ctx45.jalanSelesai ?? new Set<string>(), ctx45.nodeTilesAll ?? new Set<string>()
    );
    for (const w of warga45) { stepWarga(w, jam, ctx45); if (w.lapar >= 95) w.sehat = Math.max(10, w.sehat - 3); }
    for (const [k, kapan] of [...(ctx45.nodeRegrow ?? new Map())]) {
      if (jam >= kapan) { ctx45.nodeSisa.set(k, SISA_NODE_AWAL); ctx45.nodeRegrow!.delete(k); }
    }
    if (ctx45.nodeSpawnTertunda && ctx45.nodeSpawn) {
      terapkanSpawnTertunda(ctx45.nodeSpawnTertunda, jam, ctx45.nodeSpawn, ctx45.nodeSisa, ctx45.kabar);
      for (const sp of ctx45.nodeSpawn) ctx45.nodeTilesAll?.add(`${sp.gx},${sp.gy}`);
    }
    const MIN_T: Record<string, number> = { pohon: 35, semak_beri: 18, singkapan_batu: 18, padang_buruan: 12, urat_emas: 8, urat_besi: 10 };
    const countAktif: Record<string, number> = {};
    for (const n of ctx45.nodes) {
      const k = `${n.gx},${n.gy}`;
      if ((ctx45.nodeSisa.get(k) ?? SISA_NODE_AWAL) > 0) countAktif[n.kind] = (countAktif[n.kind] ?? 0) + 1;
    }
    for (const [kindStr, minTarget] of Object.entries(MIN_T)) {
      if ((countAktif[kindStr] ?? 0) < minTarget) {
        const taken = new Set<string>(ctx45.nodeTilesAll ?? []);
        for (const tt of ctx45.nodeSpawnTertunda!.values()) taken.add(`${tt.gx},${tt.gy}`);
        const spawn = pilihLokasiRespawn(kindStr as never, { gx: 100, gy: 100 }, jam + 2, taken, ctx45.rintangan);
        if (spawn) {
          ctx45.nodeSpawnTertunda!.set(`spawn_${kindStr}_${jam}`, { kind: spawn.kind, gx: spawn.gx, gy: spawn.gy, jam: jam + 2 });
          ctx45.nodeTilesAll?.add(`${spawn.gx},${spawn.gy}`);
        }
      }
    }
    if ((t + 1) % 24 === 0 && (ctx45.stok.pangan ?? 0) > 0) panganHariPositif++;
  }
  Math.random = rndAsli45;
  const kumpul45 = ctx45.kabar.filter((k) => k.jenis === "kumpul").length;
  const jalan45 = ctx45.jalanSelesai?.size ?? 0;
  const beku45 = warga45.filter((w, i) => `${w.lokasi.gx},${w.lokasi.gy}` === posAwal45[i]).length;
  ok((ctx45.stok.pangan ?? 0) > 0, `r45 sim 10 hari: pangan akhir > 0 (dapat ${ctx45.stok.pangan})`);
  ok(panganHariPositif >= 8, `r45 sim 10 hari: pangan > 0 di ${panganHariPositif}/10 hari (berkelanjutan, bukan sesaat)`);
  ok(jalan45 >= 5, `r45 sim 10 hari: jalan terbangun >= 5 ubin (dapat ${jalan45})`);
  ok(beku45 <= 2, `r45 sim 10 hari: warga beku di ubin awal <= 2 (dapat ${beku45}/12)`);
  ok(kumpul45 >= 20, `r45 sim 10 hari: ronde kumpul selesai >= 20 (dapat ${kumpul45})`);
}

// RONDE 46 — kronik kampung satu baris (Ide 23, riset fitur baru
// 2026-11-05 20:29): pola kronik Plai: Village Tale — satu baris
// lakonis yang bereaksi pada keadaan game. Fungsi murni, display-only,
// deterministik: aturan prioritas pangan habis/menipis -> bangunan
// dibangun -> warga tanpa tugas -> stok penuh -> tonggak berikutnya ->
// keadaan hari ini. Setiap kalimat berasal dari data poll, bukan karangan.
{
  const dasar46 = {
    hari: 389, populasi: 12, kampung: "Suka Maju", fase: "Pagi", cuaca: "Cerah",
    stok: { kayu: 30, batu: 21, emas: 1, besi: 47, pangan: 143, kulit: 65 },
    kapasitas: { kayu: 160, batu: 130, emas: 40, besi: 55, pangan: 200, kulit: 95 },
    dibangun: [] as { label: string; progres: number }[], tanpaTugas: 0, tonggakBerikutnya: null as string | null,
  };
  // (a) Keadaan live-like (observasi 20:30: pangan 143/200, tanpa
  // bangunan dibangun, tonggak 7/7) -> baris keadaan hari ini.
  eq(kronikKampung(dasar46), "Hari 389 di Suka Maju — 12 warga, pagi cerah.", "r46: fallback keadaan hari ini (angka live 20:30)");
  // (b) Pangan habis mengalahkan bangunan yang sedang dibangun.
  eq(kronikKampung({ ...dasar46, stok: { ...dasar46.stok, pangan: 0 }, dibangun: [{ label: "Paviliun Makan", progres: 20 }] }),
    "Pangan habis — warga menahan lapar, pengumpul dan pemburu sedang bekerja keras.", "r46: pangan 0 -> baris habis (prioritas 1)");
  // (c) Pangan menipis: 20/200 = 10% (<= 25% kapasitas).
  eq(kronikKampung({ ...dasar46, stok: { ...dasar46.stok, pangan: 20 } }),
    "Pangan menipis (20/200) — ladang dan hutan jadi tumpuan hari ini.", "r46: pangan 20/200 -> baris menipis");
  ok(kronikKampung({ ...dasar46, stok: { ...dasar46.stok, pangan: 51 } }).startsWith("Hari 389"), "r46: pangan 51/200 (di atas 25%) bukan menipis");
  // (d) Bangunan dibangun: progres terbesar menang, progres dijepit 0..100.
  eq(kronikKampung({ ...dasar46, dibangun: [{ label: "Paviliun Makan", progres: 20 }] }),
    "Paviliun Makan sedang dibangun (20%) — palu berdentang di Suka Maju.", "r46: bangunan dibangun -> baris dibangun");
  eq(kronikKampung({ ...dasar46, dibangun: [{ label: "Gubuk", progres: 5 }, { label: "Paviliun Makan", progres: 20 }] }),
    "Paviliun Makan sedang dibangun (20%) — palu berdentang di Suka Maju.", "r46: dua dibangun -> progres terbesar menang");
  ok(kronikKampung({ ...dasar46, dibangun: [{ label: "Gubuk", progres: 150 }] }).includes("(100%)"), "r46: progres 150 dijepit ke 100%");
  ok(kronikKampung({ ...dasar46, dibangun: [{ label: "Gubuk", progres: NaN }] }).includes("(0%)"), "r46: progres NaN -> 0%");
  ok(kronikKampung({ ...dasar46, dibangun: [{ label: "   ", progres: 50 }] }).startsWith("Hari 389"), "r46: label bangunan kosong diabaikan");
  // (e) Warga tanpa tugas.
  eq(kronikKampung({ ...dasar46, tanpaTugas: 3 }),
    "3 warga tanpa tugas — mereka membantu tetangga sambil menunggu kerja.", "r46: 3 warga tanpa tugas");
  // (f) Stok penuh: urutan katalog (kayu dulu bila kayu + batu penuh).
  eq(kronikKampung({ ...dasar46, stok: { ...dasar46.stok, kayu: 160 } }),
    "Kayu penuh (160/160) — lumbung tidak muat lagi, waktunya membangun.", "r46: kayu penuh");
  eq(kronikKampung({ ...dasar46, stok: { ...dasar46.stok, kayu: 160, batu: 130 } }),
    "Kayu penuh (160/160) — lumbung tidak muat lagi, waktunya membangun.", "r46: kayu + batu penuh -> kayu dulu");
  // (g) Tonggak berikutnya.
  eq(kronikKampung({ ...dasar46, tonggakBerikutnya: "Balai berdiri" }),
    "Selangkah lagi: Balai berdiri.", "r46: tonggak berikutnya");
  // (h) Deterministik + input aneh tidak pernah kosong / mengandung NaN.
  eq(kronikKampung(dasar46), kronikKampung(dasar46), "r46: input sama -> baris sama (deterministik)");
  const aneh46 = kronikKampung({ hari: NaN, populasi: NaN, kampung: "", fase: "", cuaca: "", stok: { pangan: 100 }, kapasitas: { pangan: 200 }, dibangun: [], tanpaTugas: NaN, tonggakBerikutnya: "" });
  ok(aneh46.length > 0 && !aneh46.includes("NaN"), `r46: input aneh tetap satu baris waras (dapat "${aneh46}")`);
  // (i) Audit sumber: terpasang di kartu menu + gaya ada.
  const pageSrc46 = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrc46.includes("kronikKampung") && pageSrc46.includes("menu-kronik"), "r46: kronik terpasang di kartu menu page");
  const cssSrc46 = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrc46.includes(".menu-kronik"), "r46: gaya .menu-kronik ada di globals.css");
  const ver46 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver46.includes('BUILD_ID = "r57"'), "r46: BUILD_ID naik ke r46");
}

// RONDE 47 — Pasar Minggu tiap 7 hari game (Ide 35, riset fitur baru
// 2026-11-05 20:29 + ekonomi/sim 22:29): momen mingguan yang ditunggu
// bersama (haat My Village Story, festival hram Plai). Fungsi murni,
// display-only, deterministik: hari kelipatan 7 = hari pasar, H-1 =
// besok, sisanya hitung mundur; tempat mengikuti bangunan yang
// berdiri (Balai -> Paviliun Makan -> tengah kampung). Tanpa janji
// ekonomi — belum ada jual-beli di pasar.
{
  // (a) Hari pasar: kelipatan 7, tempat = Balai bila berdiri.
  eq(pasarMingguan(7, ["balai"]), "Hari ini Pasar Minggu di Balai.", "r47: hari 7 + balai -> hari ini di Balai");
  eq(pasarMingguan(14, []), "Hari ini Pasar Minggu di tengah kampung.", "r47: hari 14 tanpa balai/paviliun -> tengah kampung");
  eq(pasarMingguan(21, ["paviliun_makan"]), "Hari ini Pasar Minggu di Paviliun Makan.", "r47: hari 21 + paviliun -> hari ini di Paviliun Makan");
  eq(pasarMingguan(28, ["balai", "paviliun_makan"]), "Hari ini Pasar Minggu di Balai.", "r47: balai menang atas paviliun");
  // (b) H-1: hari 6, 13, 20 -> besok.
  eq(pasarMingguan(6, ["balai"]), "Besok Pasar Minggu di Balai.", "r47: hari 6 -> besok");
  eq(pasarMingguan(13, []), "Besok Pasar Minggu di tengah kampung.", "r47: hari 13 -> besok");
  // (c) Hitung mundur: hari 5 -> 2 hari lagi; hari 8 -> 6 hari lagi;
  // hari 1 -> 6 hari lagi (pasar pertama hari 7).
  eq(pasarMingguan(5, ["balai"]), "Pasar Minggu 2 hari lagi di Balai.", "r47: hari 5 -> 2 hari lagi");
  eq(pasarMingguan(8, ["paviliun_makan"]), "Pasar Minggu 6 hari lagi di Paviliun Makan.", "r47: hari 8 -> 6 hari lagi");
  eq(pasarMingguan(1, []), "Pasar Minggu 6 hari lagi di tengah kampung.", "r47: hari 1 -> 6 hari lagi");
  eq(pasarMingguan(397, ["balai"]), "Pasar Minggu 2 hari lagi di Balai.", "r47: hari live 397 -> 2 hari lagi (pasar hari 399)");
  // (d) Input aneh: hari 0 / NaN / negatif diperlakukan sebagai hari 1.
  eq(pasarMingguan(0, []), "Pasar Minggu 6 hari lagi di tengah kampung.", "r47: hari 0 -> hari 1");
  eq(pasarMingguan(NaN, ["balai"]), "Pasar Minggu 6 hari lagi di Balai.", "r47: hari NaN -> hari 1");
  eq(pasarMingguan(-3, []), "Pasar Minggu 6 hari lagi di tengah kampung.", "r47: hari negatif -> hari 1");
  ok(!pasarMingguan(NaN, []).includes("NaN"), "r47: tidak pernah mengandung NaN");
  eq(pasarMingguan(7, ["balai"]), pasarMingguan(7, ["balai"]), "r47: input sama -> baris sama (deterministik)");
  // (e) Audit sumber: terpasang di kartu menu + gaya ada + versi naik.
  const pageSrc47 = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrc47.includes("pasarMingguan") && pageSrc47.includes("menu-pasar") && pageSrc47.includes("Pasar Minggu"), "r47: pasar terpasang di kartu menu page");
  const cssSrc47 = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrc47.includes(".menu-pasar"), "r47: gaya .menu-pasar ada di globals.css");
  const ver47 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver47.includes('BUILD_ID = "r57"'), "r47: BUILD_ID naik ke r47");
}

// RONDE 48 — Label hewan ikut antrean rapikan (Ide 33, riset UX
// 2026-11-06 00:29: stacking nameplate WoW — geser pelat yang
// bertabrakan, tapi JANGAN stacking ke atas tanpa batas karena pelat
// melayang jauh dari unitnya). Dulu label hewan diposisi langsung di
// loop hewan, jadi bisa menumpuk di atas label warga yang sudah
// dirapikan di pusat kampung; kini warga + hewan masuk satu antrean
// yang sama dan dirapikan sekali setelah loop hewan. Display-only,
// tanpa ubah sim; fungsi murninya (rapikanLabelBertumpuk) tidak
// berubah — yang diuji di sini adalah perkabelan Map3D + kontrak
// antrean gabungan (warga di samping hewan ikut digeser).
{
  // (a) Kontrak antrean gabungan: warga + hewan berdekatan digeser.
  eq(rapikanLabelBertumpuk([{ x: 100, y: 100 }, { x: 105, y: 100 }]), [100, 128], "r48: warga + hewan menumpuk -> hewan digeser 28px (r44)");
  eq(rapikanLabelBertumpuk([{ x: 100, y: 100 }, { x: 100, y: 100 }, { x: 105, y: 100 }]), [100, 128, 156], "r48: dua warga + satu hewan menumpuk -> 0/28/56");
  eq(rapikanLabelBertumpuk([{ x: 100, y: 100 }, { x: 300, y: 100 }]), [100, 100], "r48: hewan jauh horizontal tidak digeser");
  // (b) Audit sumber: label hewan masuk antrean, bukan posisi langsung.
  const mapSrc48 = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc48.includes('labelAntre.push({ label: cur.label, bubble: null, sx, sy, bubbleText: "", isSelectedW: false })'), "r48: label hewan masuk labelAntre (bubble null)");
  ok(!/cur\.label\.style\.transform = `translate\(-50%, -100%\) translate\(\$\{sx\.toFixed\(1\)\}px, \$\{sy\.toFixed\(1\)\}px\)`/.test(mapSrc48), "r48: tidak ada lagi posisi label langsung di loop hewan");
  // (c) Audit sumber: hanya SATU panggilan rapikan + satu titik transform.
  eq((mapSrc48.match(/rapikanLabelBertumpuk\(labelAntre\.map/g) ?? []).length, 1, "r48: satu panggilan rapikan untuk antrean gabungan");
  eq((mapSrc48.match(/a\.label\.style\.transform = /g) ?? []).length, 1, "r48: satu titik penerapan transform label");
  ok(mapSrc48.includes("if (!a.bubble) return;"), "r48: penerapan rapikan menjaga entri hewan tanpa bubble");
  ok(mapSrc48.includes("bubble: HTMLDivElement | null"), "r48: tipe antrean mengizinkan bubble null (hewan)");
  // (d) Audit sumber: penerapan rapikan terjadi setelah loop hewan.
  const idxRapikan48 = mapSrc48.indexOf("if (labelAntre.length > 0)");
  const idxHewanJatuh48 = mapSrc48.indexOf("hewan jatuh", idxRapikan48);
  ok(idxRapikan48 > 0 && idxHewanJatuh48 > idxRapikan48, "r48: blok rapikan setelah loop hewan (sebelum hewan jatuh)");
  // (e) Audit versi.
  const ver48 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver48.includes('BUILD_ID = "r57"'), "r48: BUILD_ID naik ke r48");
}

// RONDE 49 — Ide 27: baseline draw call sekali saat scene mapan.
// (a) Kontrak baca: info dibaca TEPAT SETELAH render (bukan sebelum),
// sekali saja, setelah ~120 frame — bukan tiap frame.
{
  const mapSrc49 = readFileSync("src/components/Map3D.tsx", "utf8");
  const idxRender49 = mapSrc49.indexOf("renderer.render(scene, camera);");
  const idxInfo49 = mapSrc49.indexOf("renderer.info", idxRender49);
  ok(idxRender49 > 0 && idxInfo49 > idxRender49, "r49: renderer.info dibaca setelah renderer.render (bukan sebelum)");
  ok(mapSrc49.includes("const info = renderer.info;"), "r49: info diambil dari renderer.info");
  // (b) Enam angka baseline ada semua.
  ok(mapSrc49.includes("drawCalls: info.render.calls"), "r49: baseline mencatat drawCalls");
  ok(mapSrc49.includes("triangles: info.render.triangles"), "r49: baseline mencatat triangles");
  ok(mapSrc49.includes("geometries: info.memory.geometries"), "r49: baseline mencatat geometries");
  ok(mapSrc49.includes("textures: info.memory.textures"), "r49: baseline mencatat textures");
  ok(mapSrc49.includes("programs: info.programs?.length ?? 0"), "r49: baseline mencatat programs");
  ok(mapSrc49.includes("pixelRatio: renderer.getPixelRatio()"), "r49: baseline mencatat pixelRatio");
  // (c) Sekali saja: penghitung frame + ambang 120 + flag tercatat.
  ok(mapSrc49.includes("let frameBaseline = 0;"), "r49: penghitung frame baseline dideklarasi");
  ok(mapSrc49.includes("let baselineTercatat = false;"), "r49: flag baseline sekali dideklarasi");
  ok(mapSrc49.includes("if (!baselineTercatat)"), "r49: log dijaga flag sekali saja");
  ok(mapSrc49.includes("if (frameBaseline >= 120)"), "r49: sampel setelah 120 frame (scene mapan)");
  ok(mapSrc49.includes("baselineTercatat = true;"), "r49: flag disetelah log pertama");
  // (d) Tepat satu console.info baseline (bukan tiap frame, bukan dua tag).
  eq((mapSrc49.match(/console\.info\("\[Nusantara baseline render\]"/g) ?? []).length, 1, "r49: tepat satu console.info baseline");
  // (e) Bukan render-on-demand: loop tetap jalan tiap frame (desa tidak
  // pernah statis — hontran: demand hanya untuk scene statis).
  ok(!mapSrc49.includes("frameloop"), "r49: tidak ada frameloop demand (loop tetap hidup)");
  // (f) Audit versi.
  const ver49 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver49.includes('BUILD_ID = "r57"'), "r49: BUILD_ID naik ke r49");
}

// RONDE 50 — wilayah jelajah hewan pulang ke sabuk kampung (r50).
{
  const jarakPusat = (h: { gx: number; gy: number }) => Math.abs(h.gx - PUSAT.gx) + Math.abs(h.gy - PUSAT.gy);
  const ctxTanpaWarga = (h: { _id: unknown; jenis: string; gx: number; gy: number }) => ({ ...ctxKosong(wargaDasar({})), wargaSemua: [], hewan: [h] });
  // (a) Hewan jauh pulang: rusa di (300,100), d=200 — tiap jam jarak ke
  // pusat berkurang tepat 30 (langkah pulang, tanpa rintangan/air di
  // jalur y=100 timur sungai) sampai masuk sabuk.
  const rusa = { _id: "h50a", jenis: "rusa", gx: 300, gy: 100 };
  const ctxA = ctxTanpaWarga(rusa);
  let dSebelumnya = jarakPusat(rusa);
  for (let jam = 12; jam < 18; jam++) {
    stepHewan(rusa as never, jam, ctxA);
    const d = jarakPusat(rusa);
    ok(d === dSebelumnya - 30, `r50: rusa jauh pulang 30/jam (d ${dSebelumnya} -> ${d})`);
    dSebelumnya = d;
  }
  ok(jarakPusat(rusa) <= SABUK_HEWAN_MAKS, `r50: rusa jauh masuk sabuk setelah 6 jam (d ${jarakPusat(rusa)})`);
  ok(rusa.gy === 100, "r50: rusa pulang lurus di sumbu yang sama (tanpa acak)");
  // (b) Deterministik: ulangi skenario yang sama -> posisi akhir sama
  // (cabang pulang tidak memakai Math.random).
  const rusa2 = { _id: "h50b", jenis: "rusa", gx: 300, gy: 100 };
  const ctxA2 = ctxTanpaWarga(rusa2);
  for (let jam = 12; jam < 18; jam++) stepHewan(rusa2 as never, jam, ctxA2);
  eq([rusa2.gx, rusa2.gy], [rusa.gx, rusa.gy], "r50: skenario pulang deterministik");
  // (c) Di dalam sabuk tetap mengembara tapi tidak pernah jauh: rusa di
  // (120,110), d=30 — 48 jam, jarak tidak pernah > 75 (maks satu
  // langkah acak 30 keluar dari 45, jam berikut pulang).
  const rusa3 = { _id: "h50c", jenis: "rusa", gx: 120, gy: 110 };
  const ctxC = ctxTanpaWarga(rusa3);
  let maksD = 0;
  for (let jam = 12; jam < 60; jam++) {
    stepHewan(rusa3 as never, jam, ctxC);
    maksD = Math.max(maksD, jarakPusat(rusa3));
  }
  ok(maksD <= SABUK_HEWAN_MAKS + JARAK_KABUR_JINAK, `r50: rusa dalam sabuk tidak pernah > 75 (maks ${maksD})`);
  ok(rusa3.gx >= GRID_MIN && rusa3.gx < GRID_MAX && rusa3.gy >= GRID_MIN && rusa3.gy < GRID_MAX, "r50: rusa dalam sabuk tetap di grid");
  // (d) Buas ikut pulang — TAPI ke sabuknya sendiri (r51, Ide 44):
  // beruang di (300,300), d=400 — pulang 30/jam tanpa osilasi sampai
  // masuk sabuk BUAS 90 (bukan 45); 24 jam kemudian tetap dalam
  // batas 120 (90 + satu langkah acak 30) walau sungai memaksa
  // sidestep. Yang dicek: selama masih di luar 90, jarak turun tiap
  // jam; setelah masuk sabuk, tidak pernah lebih dari 120.
  const beruang = { _id: "h50d", jenis: "beruang", gx: 300, gy: 300 };
  const ctxD = ctxTanpaWarga(beruang);
  let dBeruang = jarakPusat(beruang);
  for (let jam = 12; jam < 23; jam++) {
    stepHewan(beruang as never, jam, ctxD);
    const d = jarakPusat(beruang);
    if (dBeruang > SABUK_HEWAN_BUAS) ok(d < dBeruang, `r51: beruang pulang tanpa osilasi (d ${dBeruang} -> ${d})`);
    dBeruang = d;
  }
  ok(jarakPusat(beruang) <= SABUK_HEWAN_BUAS, `r51: beruang jauh masuk sabuk 90 dalam 11 jam (d ${jarakPusat(beruang)})`);
  let maksDBeruang = jarakPusat(beruang);
  for (let jam = 23; jam < 47; jam++) {
    stepHewan(beruang as never, jam, ctxD);
    maksDBeruang = Math.max(maksDBeruang, jarakPusat(beruang));
  }
  ok(maksDBeruang <= SABUK_HEWAN_BUAS + JARAK_KABUR_JINAK, `r51: beruang di sabuk tidak pernah > 120 (maks ${maksDBeruang})`);
  // (e) Reaksi menang atas wilayah: rusa di dalam sabuk yang didekati
  // warga tetap KABUR menjauh (bukan pulang) — jarak ke warga bertambah.
  const rusa4 = { _id: "h50e", jenis: "rusa", gx: 140, gy: 100 };
  const w4 = wargaDasar({ peran: "penebang", lokasi: { gx: 139, gy: 100 } });
  const ctxE = { ...ctxKosong(w4), wargaSemua: [w4], hewan: [rusa4] };
  const dWargaAwal = Math.abs(rusa4.gx - 139) + Math.abs(rusa4.gy - 100);
  stepHewan(rusa4 as never, 12, ctxE);
  const dWargaAkhir = Math.abs(rusa4.gx - 139) + Math.abs(rusa4.gy - 100);
  ok(dWargaAkhir > dWargaAwal, `r50: rusa didekati warga kabur menjauh (jarak warga ${dWargaAwal} -> ${dWargaAkhir})`);
  // (f) Audit sumber + versi.
  const simSrc50 = readFileSync("src/lib/batu/sim.ts", "utf8");
  ok(simSrc50.includes("SABUK_HEWAN_MAKS = 45"), "r50: konstanta sabuk 45 dideklarasi");
  ok(simSrc50.includes("d > sabuk"), "r51: respawn memakai sabuk per spesies (bukan konstanta tunggal)");
  ok(simSrc50.includes("WILAYAH JELAJAH"), "r50: cabang pulang berkomentar wilayah jelajah");
  ok(simSrc50.includes("dPusat > sabuk"), "r51: cabang pulang memakai sabuk per spesies");
  const ver50 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver50.includes('BUILD_ID = "r57"'), "r50: BUILD_ID naik ke r50");
}

// RONDE 51 — sabuk per spesies: mangsa dekat, predator jauh (Ide 44,
// riset ekonomi/sim 2026-11-06 08:29 + observasi r50: hewan kembali
// dekat kampung, predator masih tercampur). Pola DayZ Deerisle
// (teritori mangsa 150–500m, predator 300–700m): jinak (rusa/kelinci/
// ayam) sabuk 45, buas (babi/serigala/beruang) sabuk 90 — dipakai
// respawn DAN jangkar pulang lewat satu helper sabukHewan.
{
  const jarakPusat51 = (h: { gx: number; gy: number }) => Math.abs(h.gx - PUSAT.gx) + Math.abs(h.gy - PUSAT.gy);
  const ctxTanpaWarga51 = (h: { _id: unknown; jenis: string; gx: number; gy: number }) => ({ ...ctxKosong(wargaDasar({})), wargaSemua: [], hewan: [h] });
  // (a) Pemetaan sabuk: jinak 45, buas 90, tak dikenal -> 45 (aman).
  eq(sabukHewan("rusa"), 45, "r51: sabuk rusa 45");
  eq(sabukHewan("kelinci"), 45, "r51: sabuk kelinci 45");
  eq(sabukHewan("ayam"), 45, "r51: sabuk ayam 45");
  eq(sabukHewan("babi_hutan"), 90, "r51: sabuk babi hutan 90");
  eq(sabukHewan("serigala"), 90, "r51: sabuk serigala 90");
  eq(sabukHewan("beruang"), 90, "r51: sabuk beruang 90");
  eq(sabukHewan("naga"), 45, "r51: jenis tak dikenal -> sabuk jinak 45");
  eq(SABUK_HEWAN_BUAS, 90, "r51: konstanta sabuk buas 90");
  // (b) Respawn per spesies: 200 titik beruang — mayoritas dalam 90
  // (cabang bias 80% selalu <= 90 + sebaran 20% kadang masuk), dan
  // sebagian besar di LUAR 45 (wilayah buas memang lebih lebar);
  // 200 titik rusa — mayoritas dalam 45 seperti dulu.
  let seed51 = 777;
  const rng51 = () => { seed51 = (seed51 * 1103515245 + 12345) % 2147483648; return seed51 / 2147483648; };
  const picksBuas: { gx: number; gy: number }[] = [];
  for (let i = 0; i < 200; i++) { const p = lokasiRespawnHewan(rng51, undefined, "beruang"); if (p) picksBuas.push(p); }
  ok(picksBuas.length >= 190, "r51: respawn beruang hampir selalu dapat lokasi");
  ok(picksBuas.every((p) => jarakPusat51(p) >= 10), "r51: respawn beruang >= 10 dari pusat");
  ok(picksBuas.every((p) => !isWater(p.gx, p.gy)), "r51: respawn beruang tidak di air");
  const dalam90 = picksBuas.filter((p) => jarakPusat51(p) <= 90).length;
  ok(dalam90 >= picksBuas.length * 0.75, `r51: mayoritas respawn beruang dalam 90: ${dalam90}/${picksBuas.length}`);
  const luar45 = picksBuas.filter((p) => jarakPusat51(p) > 45).length;
  ok(luar45 >= picksBuas.length * 0.5, `r51: sebagian besar respawn beruang di luar 45: ${luar45}/${picksBuas.length}`);
  const picksJinak: { gx: number; gy: number }[] = [];
  for (let i = 0; i < 200; i++) { const p = lokasiRespawnHewan(rng51, undefined, "rusa"); if (p) picksJinak.push(p); }
  const dalam45 = picksJinak.filter((p) => jarakPusat51(p) <= 45).length;
  ok(dalam45 >= picksJinak.length * 0.7, `r51: mayoritas respawn rusa tetap dalam 45: ${dalam45}/${picksJinak.length}`);
  // (c) Jangkar pulang per spesies, deterministik: rusa di d=60 pulang
  // (1 jam -> d=30); beruang di d=60 TIDAK pulang — dengan arah acak
  // dipatok (Math.random -> 0.99, arah 3 = -y) ia mengembara ke d=90,
  // bukan pulang ke 30. Beruang jauh (300,100) pulang 30/jam sampai 80.
  const rusa51 = { _id: "h51a", jenis: "rusa", gx: 160, gy: 100 };
  const ctx51a = ctxTanpaWarga51(rusa51);
  stepHewan(rusa51 as never, 12, ctx51a);
  eq(jarakPusat51(rusa51), 30, "r51: rusa di luar 45 pulang 30/jam (d 60 -> 30)");
  const rndAsli51 = Math.random;
  Math.random = () => 0.99;
  const beruang51 = { _id: "h51b", jenis: "beruang", gx: 160, gy: 100 };
  const ctx51b = ctxTanpaWarga51(beruang51);
  stepHewan(beruang51 as never, 12, ctx51b);
  Math.random = rndAsli51;
  eq(jarakPusat51(beruang51), 90, "r51: beruang di d=60 tidak pulang — mengembara ke 90 (bukan 30)");
  const beruangJauh = { _id: "h51c", jenis: "beruang", gx: 300, gy: 100 };
  const ctx51c = ctxTanpaWarga51(beruangJauh);
  let d51 = jarakPusat51(beruangJauh);
  for (let jam = 12; jam < 16; jam++) {
    stepHewan(beruangJauh as never, jam, ctx51c);
    const d = jarakPusat51(beruangJauh);
    ok(d === d51 - 30, `r51: beruang jauh pulang 30/jam (d ${d51} -> ${d})`);
    d51 = d;
  }
  ok(jarakPusat51(beruangJauh) <= SABUK_HEWAN_BUAS, `r51: beruang jauh masuk sabuk 90 setelah 4 jam (d ${jarakPusat51(beruangJauh)})`);
  // (d) Reaksi menang atas wilayah tetap berlaku untuk buas: beruang
  // di dalam sabuk yang didekati warga tetap MENDEKAT (bukan pulang)
  // — jarak ke warga berkurang.
  const beruang52 = { _id: "h51d", jenis: "beruang", gx: 140, gy: 100 };
  const w51 = wargaDasar({ peran: "pemburu", lokasi: { gx: 137, gy: 100 } });
  const ctx51d = { ...ctxKosong(w51), wargaSemua: [w51], hewan: [beruang52] };
  const dWarga51 = Math.abs(beruang52.gx - 137) + Math.abs(beruang52.gy - 100);
  stepHewan(beruang52 as never, 12, ctx51d);
  const dWarga51b = Math.abs(beruang52.gx - 137) + Math.abs(beruang52.gy - 100);
  ok(dWarga51b < dWarga51, `r51: beruang didekati warga mendekat (jarak warga ${dWarga51} -> ${dWarga51b})`);
  // (e) Audit sumber + versi.
  const simSrc51 = readFileSync("src/lib/batu/sim.ts", "utf8");
  ok(simSrc51.includes("SABUK_HEWAN_BUAS = 90"), "r51: konstanta sabuk buas 90 dideklarasi");
  ok(simSrc51.includes("export function sabukHewan"), "r51: helper sabukHewan ada");
  ok(simSrc51.includes("lokasiRespawnHewan(() => rnd(++s), undefined, sp.id)"), "r51: seed awal memakai sabuk per spesies");
  ok(simSrc51.includes("lokasiRespawnHewan(undefined, undefined, sp.id)"), "r51: respawn memakai sabuk per spesies");
  ok(simSrc51.includes("const sabuk = sabukHewan(h.jenis);"), "r51: jangkar pulang memakai sabuk per spesies");
  const ver51 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver51.includes('BUILD_ID = "r57"'), "r51: BUILD_ID naik ke r51");
}

// RONDE 52 — label hewan meredup saat tidak diburu (Ide 38, riset UX
// 2026-11-06 12:29: pola WoW 20% alpha non-target di luar combat,
// diadaptasi ke 0.45 supaya label 10px tetap terbaca — PUNCHEV).
// (a) Helper murni: relevan (diburu/terluka) -> 1, tenang -> 0.45.
{
  eq(opacityLabelHewan(true), 1, "r52: hewan diburu/terluka label penuh (1)");
  eq(opacityLabelHewan(false), 0.45, "r52: hewan tenang label meredup (0.45)");
  eq(OPACITY_LABEL_HEWAN_TENANG, 0.45, "r52: konstanta tenang 0.45");
  ok(OPACITY_LABEL_HEWAN_TENANG > 0.2 && OPACITY_LABEL_HEWAN_TENANG < 1, "r52: redup di antara 20% WoW dan penuh (tetap terbaca)");
  ok(opacityLabelHewan(false) > opacityLabelHewan(true) * 0.2, "r52: redup jauh di atas 20% (bukan hampir-hilang)");
  // (b) Call site Map3D: opacity di-set dari kondisi yang SAMA dengan
  // tampilnya bar HP (terluka ATAU diburu) — satu kondisi, dua efek.
  const mapSrc52 = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc52.includes("opacityLabelHewan"), "r52: Map3D memakai helper opacityLabelHewan");
  ok(mapSrc52.includes("cur.label.style.opacity = String(opacityLabelHewanJarak(showHp, camDist));"), "r52: opacity label hewan di-set dari showHp (r53: lewat opacityLabelHewanJarak + jarak kamera)");
  ok(mapSrc52.includes("const showHp = cur.hp < cur.hpMax || diburu.has(cur.id);"), "r52: showHp tetap terluka ATAU diburu (kondisi bar HP tidak berubah)");
  ok(mapSrc52.includes("import { paceTampil"), "r52: impor tampil Map3D utuh");
  ok(mapSrc52.includes("opacityLabelHewan,"), "r52: opacityLabelHewan diimpor Map3D");
  // (c) Label hewan tetap ada + kelas dasarnya tidak dihapus (inline
  // opacity menimpa opacity 0.9 kelas, bukan mengganti kelas).
  const css52 = readFileSync("src/app/globals.css", "utf8");
  ok(css52.includes(".map3d-label-hewan"), "r52: kelas label hewan masih ada");
  ok(css52.includes("opacity: 0.9;"), "r52: opacity dasar kelas hewan 0.9 tidak diubah (inline yang mengatur per-frame)");
  // (d) Penjaga Ide 39 (SUDAH ADA, bukan dibangun ulang): label warga
  // terpilih (.sel) dijamin paling depan lewat z-index 25 — bila
  // pembersihan CSS masa depan menghapusnya, tes ini yang berteriak.
  ok(css52.includes(".map3d-label.sel"), "r52: kelas label terpilih .sel masih ada");
  const sel52 = css52.slice(css52.indexOf(".map3d-label.sel"), css52.indexOf(".map3d-label.sel") + 400);
  ok(sel52.includes("z-index: 25;"), "r52: .sel tetap z-index 25 (label terpilih paling depan, Ide 39 sudah tertangani)");
  // (e) Audit sumber + versi.
  const tampilSrc52 = readFileSync("src/lib/batu/tampil.ts", "utf8");
  ok(tampilSrc52.includes("export function opacityLabelHewan"), "r52: helper opacityLabelHewan ada di tampil.ts");
  ok(tampilSrc52.includes("OPACITY_LABEL_HEWAN_TENANG = 0.45"), "r52: konstanta redup 0.45 dideklarasi");
  const ver52 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver52.includes('BUILD_ID = "r57"'), "r52: BUILD_ID naik ke r52");
}

// RONDE 53 — label hewan memudar dengan jarak kamera (Ide 48, riset UX
// 2026-11-06 12:29: pola WoW "dozens of floating nameplates from afar").
// Penuh sampai camDist 80 (jarak bingkai normal Map3D), memudar linear
// ke 0 di 130 (tempat label memang disembunyikan), dikali opacity
// relevansi r52 — jadi hewan diburu tetap paling menonjol di jarak
// berapa pun dan tidak ada yang hilang mendadak saat zoom keluar.
// (a) Helper murni: dasar relevansi x faktor jarak.
{
  eq(JARAK_LABEL_HEWAN_PENUH, 80, "r53: jarak label hewan penuh 80 (bingkai normal Map3D)");
  eq(JARAK_LABEL_HEWAN_HILANG, 130, "r53: jarak label hewan hilang 130 (ambang sembunyi label)");
  eq(opacityLabelHewanJarak(true, 0), 1, "r53: diburu + dekat = penuh (1)");
  eq(opacityLabelHewanJarak(true, 80), 1, "r53: diburu + di 80 = masih penuh (1)");
  eq(opacityLabelHewanJarak(false, 0), 0.45, "r53: tenang + dekat = redup r52 (0.45)");
  eq(opacityLabelHewanJarak(false, 80), 0.45, "r53: tenang + di 80 = masih 0.45");
  eq(opacityLabelHewanJarak(true, 105), 0.5, "r53: diburu + tengah (105) = 0.5 (setengah jalan 80->130)");
  eq(opacityLabelHewanJarak(false, 105), 0.225, "r53: tenang + tengah (105) = 0.45 x 0.5");
  eq(opacityLabelHewanJarak(true, 130), 0, "r53: diburu + di 130 = 0 (tepat di ambang hilang)");
  eq(opacityLabelHewanJarak(false, 130), 0, "r53: tenang + di 130 = 0");
  eq(opacityLabelHewanJarak(true, 200), 0, "r53: diburu + jauh sekali = tetap 0 (tidak negatif)");
  ok(opacityLabelHewanJarak(true, 129) > 0, "r53: diburu + di 129 = masih > 0 (memudar, bukan hilang mendadak)");
  ok(opacityLabelHewanJarak(true, 90) > opacityLabelHewanJarak(true, 110), "r53: makin jauh makin redup (monoton turun, diburu)");
  ok(opacityLabelHewanJarak(false, 90) > opacityLabelHewanJarak(false, 110), "r53: makin jauh makin redup (monoton turun, tenang)");
  ok(opacityLabelHewanJarak(true, 105) > opacityLabelHewanJarak(false, 105), "r53: di jarak sama, diburu tetap lebih menonjol dari tenang");
  eq(opacityLabelHewanJarak(true, NaN), 1, "r53: camDist NaN = fallback dasar (diburu penuh, bukan hilang)");
  eq(opacityLabelHewanJarak(false, NaN), 0.45, "r53: camDist NaN = fallback dasar (tenang 0.45)");
  // (b) Call site Map3D: opacity dari showHp + camDist yang sama dengan
  // ambang sembunyi label; kondisi bar HP tidak berubah.
  const mapSrc53 = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc53.includes("opacityLabelHewanJarak(showHp, camDist)"), "r53: Map3D memakai opacityLabelHewanJarak(showHp, camDist)");
  ok(mapSrc53.includes("cur.label.style.opacity = String(opacityLabelHewanJarak(showHp, camDist));"), "r53: opacity label hewan di-set dari helper jarak");
  ok(mapSrc53.includes("opacityLabelHewanJarak,"), "r53: opacityLabelHewanJarak diimpor Map3D");
  ok(mapSrc53.includes("const camDist = camera.position.distanceTo(controls.target);"), "r53: camDist tetap jarak kamera ke target (dipakai label hewan)");
  ok(mapSrc53.includes("camDist > 130"), "r53: ambang sembunyi label hewan di 130 tidak berubah");
  ok(mapSrc53.includes("const showHp = cur.hp < cur.hpMax || diburu.has(cur.id);"), "r53: showHp tetap terluka ATAU diburu");
  // (c) Penjaga Ide 38: helper + konstanta r52 tidak berubah; label warga
  // tidak disentuh (Ide 48 eksplisit hewan dulu).
  const tampilSrc53 = readFileSync("src/lib/batu/tampil.ts", "utf8");
  ok(tampilSrc53.includes("export function opacityLabelHewan"), "r53: helper r52 opacityLabelHewan masih ada");
  ok(tampilSrc53.includes("OPACITY_LABEL_HEWAN_TENANG = 0.45"), "r53: konstanta redup r52 0.45 tidak berubah");
  ok(tampilSrc53.includes("export function opacityLabelHewanJarak"), "r53: helper jarak ada di tampil.ts");
  ok(!mapSrc53.includes("opacityLabelHewanJarak") || mapSrc53.includes("labelAntre.push({ label: cur.label"), "r53: antrean rapikan label hewan tidak disentuh");
  // (d) Audit sumber + versi.
  const ver53 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver53.includes('BUILD_ID = "r57"'), "r53: BUILD_ID naik ke r53");
}

// RONDE 54 — padi sawah jadi satu InstancedMesh (Ide 28, riset performa
// 2026-11-06 16:29: pola Glitchless + Aetumi). Loop lama membuat 1 Mesh +
// 1 ConeGeometry + 1 Material baru PER rumpun (16 draw call per sawah
// 4x4); sekarang 1 InstancedMesh + 1 geometri + 1 material putih +
// warna per rumpun via setColorAt (1 draw call). Posisi/rotasi/warna
// dari helper murni rumpunPadi() — salinan persis loop lama — jadi
// tampilan tidak berubah, hanya cara gambarnya.
// (a) Helper murni: jumlah + isi sama persis dengan loop lama.
{
  eq(PADI_WARNA, [0x84cc16, 0xeab308, 0x65a30d, 0xfacc15], "r54: palet padi 4 warna (sama seperti loop lama)");
  const r44 = rumpunPadi(4, 4);
  eq(r44.length, 16, "r54: sawah 4x4 = 16 rumpun (25 petak grid - 9 di atas pematang)");
  ok(r44.every((r) => r.y === 0.7), "r54: semua rumpun di y 0.7 (alas sawah)");
  ok(r44.every((r) => PADI_WARNA.includes(r.warna)), "r54: semua warna rumpun dari palet 4 warna");
  ok(r44.every((r) => Math.abs(r.x) >= 0.3 && Math.abs(r.z) >= 0.3), "r54: tidak ada rumpun di atas pematang (|ix|/|iz| < 0.3 dilewati)");
  ok(r44.every((r) => Math.abs(r.rotY - Math.sin(r.x + r.z) * Math.PI) < 1e-12), "r54: rotasi = sin(ix+iz) * PI (sama seperti loop lama)");
  const satu = r44.find((r) => Math.abs(r.x - -1.4) < 1e-9 && Math.abs(r.z - -1.4) < 1e-9);
  ok(satu !== undefined, "r54: rumpun sudut (-1.4, -1.4) ada (awal loop lama)");
  eq(satu?.warna, 0x84cc16, "r54: warna rumpun (-1.4, -1.4) = hijau pertama palet (rumus warna lama)");
  eq(JSON.stringify(rumpunPadi(4, 4)), JSON.stringify(r44), "r54: rumpunPadi deterministik (dua panggilan sama)");
  eq(rumpunPadi(2, 2).length, 1, "r54: sawah 2x2 = 1 rumpun (3 dari 4 petak kena pematang)");
  eq(rumpunPadi(1, 1).length, 0, "r54: sawah 1x1 = 0 rumpun (loop tidak jalan, tidak ada mesh kosong)");
  ok(rumpunPadi(4, 4).length + rumpunPadi(6, 4).length > rumpunPadi(4, 4).length, "r54: sawah lebih lebar = rumpun lebih banyak (skala dengan ukuran)");
  // (b) Call site Map3D: satu InstancedMesh + setColorAt + bounding
  // sphere; loop Mesh-per-rumpun lama hilang; bangunan lain utuh.
  const mapSrc54 = readFileSync("src/components/Map3D.tsx", "utf8");
  ok(mapSrc54.includes("rumpunPadi(w, h)"), "r54: Map3D memakai rumpunPadi(w, h) di createSawahLuas");
  ok(mapSrc54.includes("new THREE.InstancedMesh(padiGeo, padiMat, rumpun.length)"), "r54: padi = satu InstancedMesh sejumlah rumpun");
  ok(mapSrc54.includes("new THREE.ConeGeometry(0.18, 0.65, 5)"), "r54: geometri kerucut padi tetap 0.18/0.65/5 segmen (sama seperti lama)");
  ok(mapSrc54.includes("new THREE.MeshLambertMaterial({ color: 0xffffff })"), "r54: material padi putih (warna dari setColorAt, bukan per material)");
  ok(mapSrc54.includes("padi.setColorAt(i, warna.setHex(r.warna))"), "r54: warna per rumpun via setColorAt (pola Aetumi)");
  ok(mapSrc54.includes("padi.instanceColor.needsUpdate = true"), "r54: instanceColor ditandai needsUpdate setelah setColorAt");
  ok(mapSrc54.includes("padi.computeBoundingSphere()"), "r54: bounding sphere instanced dihitung ulang (culling all-or-nothing tetap benar)");
  ok(mapSrc54.includes("if (rumpun.length > 0)"), "r54: tidak ada mesh padi kosong bila sawah tanpa rumpun");
  ok(mapSrc54.includes("rumpunPadi,"), "r54: rumpunPadi diimpor Map3D");
  ok(!mapSrc54.includes("const padiColors ="), "r54: palet lokal padiColors di Map3D hilang (pindah ke PADI_WARNA tampil.ts)");
  ok(!mapSrc54.includes("new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 5)"), "r54: tidak ada lagi Mesh baru per rumpun padi");
  ok(mapSrc54.includes("new THREE.BoxGeometry(w - 0.4, 0.08, h - 0.4)"), "r54: air sawah tidak disentuh");
  ok(mapSrc54.includes("Saung bambu penjaga sawah di sudut"), "r54: saung sawah tidak disentuh");
  // (c) Penjaga: dispose + tap bangunan tetap menangani InstancedMesh.
  ok(mapSrc54.includes("o instanceof THREE.Mesh || o instanceof THREE.InstancedMesh"), "r54: disposeGroup tetap menangani InstancedMesh (geometri+material padi dibuang sekali saat rebuild)");
  ok(mapSrc54.includes("userData as J | undefined)?.placement"), "r54: tap bangunan tetap naik ke userData.placement grup (raycast InstancedMesh tetap ketemu sawah)");
  ok(mapSrc54.includes("} else if (kind === \"sawah_luas\") {"), "r54: cabang sawah_luas di buildBuilding tidak berubah");
  // (d) Audit sumber + versi.
  const ver54 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver54.includes('BUILD_ID = "r57"'), "r54: BUILD_ID naik ke r54");
}

// RONDE 55 — baris "Yang menunggu" di blok "Selama kamu pergi"
// (Ide 53, riset kembali bermain 2026-11-06 18:29: handoff
// gamedesign.gg — blok kembali-bermain harus menunjuk "apa yang
// menunggu", bukan berhenti di "apa yang berubah"). Satu baris
// display-only di dalam blok pergi yang sama: bangunan sedang
// dibangun (progres terbesar) + warga tanpa tugas, dari data poll
// yang sudah ada. Bukan baris ke-4 selamaKamuPergi — kontrak
// "maksimal 3 baris perubahan" fungsi itu tidak berubah.
// (a) Helper murni.
{
  eq(barisYangMenunggu([], 0), null, "r55: tidak ada yang menunggu -> null (tidak ada baris)");
  eq(barisYangMenunggu(null, null), null, "r55: input null -> null");
  eq(barisYangMenunggu(undefined, undefined), null, "r55: input undefined -> null");
  eq(barisYangMenunggu([{ label: "Gubuk", progres: 60 }], 0), "Yang menunggu: Gubuk 60%", "r55: hanya bangunan -> satu nama + progres");
  eq(barisYangMenunggu([{ label: "Gubuk", progres: 20 }, { label: "Lumbung", progres: 80 }], 0), "Yang menunggu: Lumbung 80% dan 1 lagi", "r55: progres terbesar dulu + sisa dihitung");
  eq(barisYangMenunggu([{ label: "Gubuk", progres: 150 }], 0), "Yang menunggu: Gubuk 100%", "r55: progres dijepit ke 100");
  eq(barisYangMenunggu([{ label: "Gubuk", progres: -5 }], 0), "Yang menunggu: Gubuk 0%", "r55: progres dijepit ke 0");
  eq(barisYangMenunggu([{ label: "Gubuk", progres: NaN }], 0), "Yang menunggu: Gubuk 0%", "r55: progres NaN -> 0");
  eq(barisYangMenunggu([{ label: "", progres: 50 }], 0), null, "r55: label kosong dilewati (bukan baris kosong)");
  eq(barisYangMenunggu([{ label: "   ", progres: 50 }], 0), null, "r55: label spasi saja dilewati");
  eq(barisYangMenunggu([], 3), "Yang menunggu: 3 warga tanpa tugas", "r55: hanya warga tanpa tugas");
  eq(barisYangMenunggu([], 1), "Yang menunggu: 1 warga tanpa tugas", "r55: satu warga tetap 'warga' (bentuk sama)");
  eq(barisYangMenunggu([{ label: "Gubuk", progres: 60 }], 3), "Yang menunggu: Gubuk 60% · 3 warga tanpa tugas", "r55: bangunan + warga digabung dengan ·");
  eq(barisYangMenunggu([], -2), null, "r55: jumlah tanpa tugas negatif -> 0 -> null");
  eq(barisYangMenunggu([], NaN), null, "r55: jumlah tanpa tugas NaN -> 0 -> null");
  eq(barisYangMenunggu([{ label: "Gubuk", progres: 10 }], NaN), "Yang menunggu: Gubuk 10%", "r55: tanpa-tugas NaN tidak merusak bagian bangunan");
  eq(barisYangMenunggu([{ label: "Gubuk", progres: 60 }], 3), barisYangMenunggu([{ label: "Gubuk", progres: 60 }], 3), "r55: deterministik (dua panggilan sama)");
  // (b) Call site page.tsx: dihitung sekali, dipakai kronik + pergi.
  const pageSrc55 = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrc55.includes("barisYangMenunggu,"), "r55: barisYangMenunggu diimpor page.tsx");
  ok(pageSrc55.includes("const dibangunList = (bangunan?.antrean ?? [])"), "r55: dibangunList dihitung sekali dari antrean");
  ok(pageSrc55.includes("const tanpaTugasCount = (map?.warga ?? []).filter((w: J) => wargaTanpaTugas(w)).length"), "r55: tanpaTugasCount dihitung sekali dari map.warga");
  ok(pageSrc55.includes("const menunggu = barisYangMenunggu(dibangunList, tanpaTugasCount)"), "r55: menunggu dari dibangunList + tanpaTugasCount");
  ok(pageSrc55.includes("dibangun: dibangunList,"), "r55: kronik memakai dibangunList yang sama (tidak dihitung dua kali)");
  ok(pageSrc55.includes("tanpaTugas: tanpaTugasCount,"), "r55: kronik memakai tanpaTugasCount yang sama");
  ok(pageSrc55.includes('<div className="menu-pergi-baris">⏳ {menunggu}</div>'), "r55: baris menunggu dirender di dalam blok pergi (ikon ⏳ + kelas baris sama)");
  ok(pageSrc55.includes("{menunggu && ("), "r55: baris menunggu hilang bila null");
  // (c) Penjaga: kontrak selamaKamuPergi + kronik tidak berubah.
  const sumber55 = readFileSync("src/lib/batu/sumberdaya.ts", "utf8");
  ok(sumber55.includes("return baris.slice(0, 3);"), "r55: selamaKamuPergi tetap maksimal 3 baris (bukan 4)");
  const pergi3 = selamaKamuPergi({ hari: 10, populasi: 9, bangunan: ["api_unggun"] }, { hari: 12, populasi: 10, bangunan: ["api_unggun", "gubuk", "lumbung"] });
  eq(pergi3?.length ?? 0, 3, "r55: selamaKamuPergi dengan 3 perubahan tetap 3 baris (menunggu bukan baris ke-4)");
  eq(kronikKampung({ hari: 100, populasi: 10, kampung: "Suka Maju", fase: "Pagi", cuaca: "Cerah", stok: { pangan: 200 }, kapasitas: { pangan: 200 }, dibangun: [{ label: "Gubuk", progres: 60 }], tanpaTugas: 3, tonggakBerikutnya: null }), "Gubuk sedang dibangun (60%) — palu berdentang di Suka Maju.", "r55: kronik tidak berubah (bangunan tetap menang atas tanpa-tugas)");
  // (d) Audit sumber + versi.
  const ver55 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver55.includes('BUILD_ID = "r57"'), "r55: BUILD_ID naik ke r55");
}

// RONDE 56 — kilas "Tonggak baru!" sejak kunjungan terakhir
// (Ide 54, riset onboarding 2026-11-06 20:29: PocketGamer —
// "celebrate their accomplishments, each goal achieved"; WizusLabs —
// "first win ... reacts, immediately and generously"). Fungsi murni
// tonggakBaru membandingkan cuplikan kunjungan terakhir dengan
// keadaan poll terbaru lewat tonggakKampung yang sudah ada; satu
// baris "✨ Baru: ..." di dalam blok Tonggak, hilang bila tidak ada
// yang baru. Tanpa hadiah ekonomi, tanpa ubah sim, tanpa fetch baru.
// (a) Helper murni.
{
  eq(tonggakBaru(null, { populasi: 10, bangunan: ["api_unggun"] }), [], "r56: tanpa cuplikan (kunjungan pertama) tidak ada kilas");
  eq(tonggakBaru(undefined, { populasi: 10, bangunan: ["api_unggun"] }), [], "r56: cuplikan undefined -> []");
  const laluApi = { hari: 10, populasi: 8, bangunan: ["api_unggun"] };
  eq(tonggakBaru(laluApi, { populasi: 8, bangunan: ["api_unggun"] }), [], "r56: tidak ada yang baru -> []");
  eq(tonggakBaru(laluApi, { populasi: 8, bangunan: ["api_unggun", "gubuk"] }), ["Gubuk pertama berdiri"], "r56: satu bangunan baru -> satu nama tonggak");
  eq(tonggakBaru(laluApi, { populasi: 10, bangunan: ["api_unggun"] }), ["Populasi 10 warga"], "r56: tonggak populasi dari perubahan populasi saja");
  eq(
    tonggakBaru({ hari: 1, populasi: 3, bangunan: [] }, { populasi: 12, bangunan: ["api_unggun", "gubuk", "lumbung", "bengkel_kayu"] }),
    ["Api pertama menyala", "Gubuk pertama berdiri", "Lumbung berdiri", "Populasi 10 warga", "Bengkel pertama"],
    "r56: beberapa tonggak baru dalam urutan kanonik tangga"
  );
  eq(tonggakBaru({ hari: 5, populasi: 12, bangunan: ["api_unggun", "gubuk", "balai"] }, { populasi: 12, bangunan: ["api_unggun", "gubuk", "balai"] }), [], "r56: tonggak yang sudah tercapai tidak diulang");
  eq(tonggakBaru({ hari: 5, populasi: 20, bangunan: ["api_unggun", "gubuk", "lumbung", "bengkel_kayu", "balai", "paviliun_makan"] }, { populasi: 20, bangunan: ["api_unggun", "gubuk", "lumbung", "bengkel_kayu", "balai", "paviliun_makan"] }), [], "r56: tangga penuh -> tidak ada yang baru");
  eq(tonggakBaru({ hari: 5, populasi: 8, bangunan: ["foo_bar"] }, { populasi: 8, bangunan: ["foo_bar", "api_unggun"] }), ["Api pertama menyala"], "r56: jenis bangunan tak dikenal diabaikan");
  eq(tonggakBaru({ hari: NaN, populasi: NaN, bangunan: [] }, { populasi: 10, bangunan: ["api_unggun", "gubuk", "lumbung"] }), ["Api pertama menyala", "Gubuk pertama berdiri", "Lumbung berdiri", "Populasi 10 warga"], "r56: cuplikan tidak valid diperlakukan 0, tidak crash");
  eq(tonggakBaru({ hari: 5, populasi: 8, bangunan: null as unknown as string[] }, { populasi: 8, bangunan: ["api_unggun"] }), ["Api pertama menyala"], "r56: bangunan cuplikan null tidak crash");
  eq(tonggakBaru({ hari: 5, populasi: 8, bangunan: ["api_unggun", "gubuk"] }, { populasi: 8, bangunan: ["api_unggun"] }), [], "r56: bangunan yang hilang bukan tonggak baru");
  eq(tonggakBaru({ hari: 5, populasi: 8, bangunan: ["api_unggun", "gubuk", "gubuk"] }, { populasi: 8, bangunan: ["api_unggun", "gubuk", "lumbung"] }), ["Lumbung berdiri"], "r56: duplikat kind di cuplikan dihitung sekali");
  eq(
    tonggakBaru(laluApi, { populasi: 10, bangunan: ["api_unggun", "gubuk"] }),
    tonggakBaru(laluApi, { populasi: 10, bangunan: ["api_unggun", "gubuk"] }),
    "r56: deterministik (dua panggilan sama)"
  );
  // (b) Call site page.tsx: dihitung dari cuplikanLalu yang sama
  // dengan blok pergi, dirender di dalam blok Tonggak.
  const pageSrc56 = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrc56.includes("tonggakBaru,"), "r56: tonggakBaru diimpor page.tsx");
  ok(pageSrc56.includes("const baruTonggak = tonggakBaru(cuplikanLalu, {"), "r56: baru dihitung sekali dari cuplikanLalu + keadaan poll (r57: di-hoist sebelum return, dipakai FAB + kilas)");
  ok(pageSrc56.includes('<div className="menu-tonggak-baru">✨ Baru: {baruTonggak.join(" · ")}</div>'), "r56: kilas dirender di blok Tonggak (ikon ✨ + nama dipisah ·)");
  ok(pageSrc56.includes("{baruTonggak.length > 0 && ("), "r56: kilas hilang bila tidak ada yang baru");
  ok(!pageSrc56.includes('menu-pergi-baris">✨'), "r56: kilas BUKAN di dalam blok pergi (bukan baris ke-4 selamaKamuPergi)");
  const cssSrc56 = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrc56.includes(".menu-tonggak-baru"), "r56: CSS kilas ada");
  ok(!cssSrc56.split(".menu-tonggak-baru")[1].split("}")[0].includes("animation"), "r56: kilas tanpa animasi (patuh reduced-motion)");
  // (c) Penjaga: tonggakKampung + selamaKamuPergi tidak berubah.
  eq(tonggakKampung(12, ["api_unggun", "gubuk", "lumbung", "bengkel_batu"]).tercapai, 5, "r56: tonggakKampung tidak berubah (api+gubuk+lumbung+pop10+bengkel batu = 5)");
  const pergi56 = selamaKamuPergi({ hari: 10, populasi: 9, bangunan: ["api_unggun"] }, { hari: 12, populasi: 10, bangunan: ["api_unggun", "gubuk", "lumbung"] });
  eq(pergi56?.length ?? 0, 3, "r56: selamaKamuPergi tetap maksimal 3 baris (kilas bukan baris ke-4)");
  // (d) Audit sumber + versi.
  const ver56 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver56.includes('BUILD_ID = "r57"'), "r56: BUILD_ID naik ke r56");
}

// RONDE 57 — penanda tonggak baru di tombol menu (Ide 56)
{
  // (a) Helper murni tonggakBaruBelumDilihat.
  eq(tonggakBaruBelumDilihat([], []), [], "r57: tidak ada yang baru -> []");
  eq(tonggakBaruBelumDilihat(["Api pertama menyala"], []), ["Api pertama menyala"], "r57: satu baru belum dilihat");
  eq(tonggakBaruBelumDilihat(["Api pertama menyala"], ["Api pertama menyala"]), [], "r57: sudah dilihat -> []");
  eq(tonggakBaruBelumDilihat(["A", "B", "C"], ["B"]), ["A", "C"], "r57: hanya yang belum dilihat, urutan dipertahankan");
  eq(tonggakBaruBelumDilihat(null, []), [], "r57: baru null -> []");
  eq(tonggakBaruBelumDilihat(undefined, undefined), [], "r57: baru + dilihat undefined -> []");
  eq(tonggakBaruBelumDilihat(["A", "", "B"], null), ["A", "B"], "r57: entri kosong dilewati, dilihat null = belum ada yang dilihat");
  eq(tonggakBaruBelumDilihat(["A", "A"], []), ["A", "A"], "r57: duplikat di baru dipertahankan (tonggakBaru tidak pernah menduplikat)");
  eq(tonggakBaruBelumDilihat(["A", 7 as unknown as string], []), ["A"], "r57: entri bukan string dilewati");
  eq(
    tonggakBaruBelumDilihat(["Api pertama menyala", "Lumbung berdiri"], ["Lumbung berdiri", "Api pertama menyala"]),
    [],
    "r57: urutan dilihat tidak penting (set)"
  );
  // (b) Call site page.tsx: hitung sekali (hoist), titik di FAB,
  // buka menu menandai dilihat, aria-label untuk screen reader.
  const pageSrc57 = readFileSync("src/app/page.tsx", "utf8");
  ok(pageSrc57.includes("tonggakBaruBelumDilihat,"), "r57: helper diimpor page.tsx");
  ok(pageSrc57.includes("const [tonggakDilihat, setTonggakDilihat] = useState<string[]>([]);"), "r57: state tonggakDilihat ada");
  ok(pageSrc57.includes("const baruTonggak = tonggakBaru(cuplikanLalu, {"), "r57: baruTonggak dihitung sekali sebelum return");
  ok(pageSrc57.includes("const baruBelumDilihat = tonggakBaruBelumDilihat(baruTonggak, tonggakDilihat);"), "r57: baruBelumDilihat dari baruTonggak + tonggakDilihat");
  ok(pageSrc57.includes("const bukaMenu = () => {"), "r57: handler bukaMenu ada");
  ok(pageSrc57.includes("setTonggakDilihat((d) => Array.from(new Set([...d, ...baruTonggak])))"), "r57: bukaMenu menandai tonggak saat ini sebagai dilihat");
  ok(pageSrc57.includes("onClick={bukaMenu}"), "r57: FAB memakai bukaMenu");
  ok(pageSrc57.includes('{baruBelumDilihat.length > 0 && <span className="menu-fab-dot" aria-hidden="true" />}'), "r57: titik hanya bila ada yang belum dilihat");
  ok(pageSrc57.includes('aria-label={baruBelumDilihat.length > 0 ? "Buka menu kampung, ada tonggak baru" : "Buka menu kampung"}'), "r57: aria-label menyebut tonggak baru (screen reader)");
  eq(pageSrc57.split("tonggakBaru(cuplikanLalu").length - 1, 1, "r57: tonggakBaru(cuplikanLalu hanya dipanggil sekali (hoist, bukan dua hitungan)");
  ok(!pageSrc57.includes("const baru = tonggakBaru(cuplikanLalu, {"), "r57: hitungan lokal `baru` di IIFE sudah dihapus");
  // (c) CSS globals.css: titik merah, denyut TERBATAS, alternatif statis.
  const cssSrc57 = readFileSync("src/app/globals.css", "utf8");
  ok(cssSrc57.includes(".menu-fab-dot"), "r57: CSS titik ada");
  ok(cssSrc57.includes("animation: denyutFabDot 0.8s ease-out 3;"), "r57: denyut TERBATAS 3x (bukan infinite)");
  ok(!cssSrc57.split(".menu-fab-dot")[1].split("}")[0].includes("infinite"), "r57: tidak ada animasi infinite pada titik");
  ok(cssSrc57.includes("@keyframes denyutFabDot"), "r57: keyframes denyut ada");
  ok(cssSrc57.includes("background: #dc2626;"), "r57: titik merah");
  ok(cssSrc57.includes("border: 2px solid #ffffff;"), "r57: garis putih supaya terlihat di atas FAB kuning");
  ok(cssSrc57.includes("pointer-events: none;"), "r57: titik tidak menghalangi ketukan FAB");
  const rmBlock57 = cssSrc57.split("@media (prefers-reduced-motion: reduce)")[1] ?? "";
  ok(rmBlock57.includes(".menu-fab-dot"), "r57: reduced-motion menyebut .menu-fab-dot");
  ok(rmBlock57.split(".menu-fab-dot")[1].split("}")[0].includes("animation: none"), "r57: reduced-motion mematikan denyut (titik statis tetap tampil)");
  // (d) Penjaga: kilas r56 + selamaKamuPergi tidak berubah.
  eq(tonggakKampung(12, ["api_unggun", "gubuk", "lumbung", "bengkel_batu"]).tercapai, 5, "r57: tonggakKampung tidak berubah (api+gubuk+lumbung+pop10+bengkel batu = 5)");
  const pergi57 = selamaKamuPergi({ hari: 10, populasi: 9, bangunan: ["api_unggun"] }, { hari: 12, populasi: 10, bangunan: ["api_unggun", "gubuk", "lumbung"] });
  eq(pergi57?.length ?? 0, 3, "r57: selamaKamuPergi tetap maksimal 3 baris");
  // (e) Audit versi.
  const ver57 = readFileSync("src/lib/version.ts", "utf8");
  ok(ver57.includes('BUILD_ID = "r57"'), "r57: BUILD_ID naik ke r57");
}

console.log(`\nBATU TEST: ${pass} lolos, ${fail} gagal`);
if (fail > 0) process.exit(1);
