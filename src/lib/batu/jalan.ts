// RONDE 18 — JALAN kampung (dibangun karakter pinter) + spacing.
// Desain (dibuat dulu, baru kode):
// - Data model: jalan = ubin tanah/batu di koleksi `jalan` (satu dokumen
//   per ubin: { gx, gy, segmen }). BUKAN placement: jalan bukan
//   rintangan (bisa dilalui warga), bukan bangunan (tidak masuk antrean
//   bangunan, tidak pakai biaya kayu/batu — GRATIS, tenaga saja).
// - Segmen (urutan prioritas, dibangun satu segmen sampai habis baru
//   lanjut): lumbung<->paviliun, hunian<->paviliun, lumbung<->kebun,
//   hunian<->sumur, paviliun<->dapur. "Hunian" = placement hunian
//   terdekat ke pasangan segmen (gubuk/gubuk_besar/tenda/tenda_besar).
// - Jalur: BFS deterministik (urutan tetangga tetap) di jendela
//   bbox ujung + 25 ubin; tidak boleh lewat air, gunung, footprint
//   bangunan, atau node (fallback: boleh lewat node bila tidak ada
//   jalur lain — jalan tetap tersambung). Ubin jalan = tepi footprint
//   (jalan mengarah KE pintu bangunan, bukan menembus bangunannya).
// - Pembangun ("karakter pinter"): kepala_suku (Figo memimpin —
//   sifat "pintar, suka membantu") + warga INT >= 9. RONDE 19: mereka
//   membangun jalan dari titik keluar paviliun setelah makan (jeda
//   alami) DAN tidak ada bangunan sedang antre/dibangun (prioritas
//   sesudah hunian/pangan). Pemicu r18 ("tidak ada target kerja") DIHAPUS
//   karena tidak pernah terjadi: node tidak pernah habis di dunia live.
//   Kecepatan jalan TIDAK berubah, ekonomi TIDAK berubah (stamina/lapar
//   ikut model membantu: kerja -2 stamina +2 lapar/jam, jalan kaki
//   -3/+4 seperti biasa).
import { isWater, isGunung, GRID_MIN, GRID_MAX } from "./dunia";

export type PlacementMini = {
  kind: string;
  gx: number;
  gy: number;
  w: number;
  h: number;
};

export const TIM_JALAN_INT_MIN = 9;

const HUNIAN_KINDS = new Set([
  "gubuk",
  "gubuk_besar",
  "tenda_kulit",
  "tenda_besar",
]);

// Segmen jalan (urutan = prioritas bangun).
export const SEGMEN_JALAN: { id: string; a: string; b: string }[] = [
  { id: "lumbung-paviliun", a: "lumbung", b: "paviliun_makan" },
  { id: "hunian-paviliun", a: "hunian", b: "paviliun_makan" },
  { id: "lumbung-kebun", a: "lumbung", b: "kebun_rempah" },
  { id: "hunian-sumur", a: "hunian", b: "sumur_batu" },
  { id: "paviliun-dapur", a: "paviliun_makan", b: "dapur_umum" },
];

// Karakter pinter = kepala suku (Figo memimpin) atau INT >= 9.
export function pintarUntukJalan(w: {
  peran: string;
  stat?: { int?: number };
}): boolean {
  return w.peran === "kepala_suku" || (w.stat?.int ?? 0) >= TIM_JALAN_INT_MIN;
}

function footprintTiles(p: PlacementMini): Set<string> {
  const s = new Set<string>();
  for (let dy = 0; dy < (p.h ?? 1); dy++)
    for (let dx = 0; dx < (p.w ?? 1); dx++) s.add(`${p.gx + dx},${p.gy + dy}`);
  return s;
}

// Ubin bisa-dilewati terdekat dari footprint (cincin 1..6). Di kampung
// padat, tepi bangunan bisa sepenuhnya ditempeli bangunan lain (kasus
// live: 8 tepi lumbung semuanya di dalam footprint tetangga) — tanpa
// ini, BFS tidak punya titik awal sama sekali dan segmen gagal total.
// Jalan lalu bermula di tanah terbuka terdekat bangunan, bukan menembus
// bangunan.
function titikAwal(
  p: PlacementMini,
  bisa: (gx: number, gy: number) => boolean
): { gx: number; gy: number }[] {
  const fp = footprintTiles(p);
  const seen = new Set<string>(fp);
  let frontier = [...fp].map((k) => k.split(",").map(Number));
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (let r = 0; r < 6; r++) {
    const next: number[][] = [];
    const found: { gx: number; gy: number }[] = [];
    for (const [x, y] of frontier) {
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        const nk = `${nx},${ny}`;
        if (seen.has(nk)) continue;
        seen.add(nk);
        if (bisa(nx, ny)) found.push({ gx: nx, gy: ny });
        else next.push([nx, ny]);
      }
    }
    if (found.length > 0) {
      found.sort((a, b) => a.gx - b.gx || a.gy - b.gy);
      return found;
    }
    frontier = next;
    if (frontier.length === 0) break;
  }
  return [];
}

function cariPlacement(
  placements: PlacementMini[],
  kind: string,
  dekat?: PlacementMini
): PlacementMini | null {
  const list =
    kind === "hunian"
      ? placements.filter((p) => HUNIAN_KINDS.has(p.kind))
      : placements.filter((p) => p.kind === kind);
  if (list.length === 0) return null;
  if (!dekat) return list[0];
  let best: PlacementMini | null = null;
  let bestD = Infinity;
  for (const p of list) {
    const d =
      Math.abs(p.gx - dekat.gx) + Math.abs(p.gy - dekat.gy);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

// RONDE 20 — JALAN 2x LEBAR (permintaan user 2026-11-05): tiap ubin
// jalur ditemani satu ubin sejajar di sisi tegak lurus arah jalan
// (bila bisa dilewati). Renderer Map3D menggambar tiap ubin sesuai
// tetangganya (potongan T/simpang), jadi lajur ganda terbaca sebagai
// jalan lebar, bukan garis tipis.
export function lebarkanJalan(
  path: { gx: number; gy: number }[],
  bisa: (gx: number, gy: number) => boolean
): { gx: number; gy: number }[] {
  const out: { gx: number; gy: number }[] = [];
  const seen = new Set<string>();
  const push = (gx: number, gy: number) => {
    const k = `${gx},${gy}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ gx, gy });
  };
  for (let i = 0; i < path.length; i++) {
    const t = path[i];
    push(t.gx, t.gy);
    let dx = 0;
    let dy = 0;
    if (i > 0) {
      dx = Math.sign(t.gx - path[i - 1].gx);
      dy = Math.sign(t.gy - path[i - 1].gy);
    } else if (path.length > 1) {
      dx = Math.sign(path[1].gx - t.gx);
      dy = Math.sign(path[1].gy - t.gy);
    }
    if (dx === 0 && dy === 0) continue;
    for (const [ox, oy] of [
      [dy, -dx],
      [-dy, dx],
    ] as const) {
      const sx = t.gx + ox;
      const sy = t.gy + oy;
      if (bisa(sx, sy)) {
        push(sx, sy);
        break;
      }
    }
  }
  return out;
}

// BFS deterministik antar tepi dua bangunan. `hindariNode` = true dulu
// (jalan tidak menabrak node sumber daya); bila gagal, ulangi dengan
// node dibolehkan supaya segmen tetap tersambung.
// RONDE 20: jalur boleh menyeberang sungai LEWAT JEMBATAN (ubin
// jembatan tetap bisa dilewati meski di air / di dalam footprint
// jembatan itu sendiri) — dulu sungai memutus segmen yang ujungnya
// berseberangan.
export function jalurJalan(
  a: PlacementMini,
  b: PlacementMini,
  opts: {
    footprintSemua: Set<string>;
    nodeKeys: Set<string>;
    jembatan?: Set<string>;
  }
): { gx: number; gy: number }[] | null {
  const fp = new Set<string>(opts.footprintSemua);
  const xs = [a.gx, b.gx];
  const ys = [a.gy, b.gy];
  const minX = Math.max(GRID_MIN, Math.min(...xs) - 25);
  const maxX = Math.min(GRID_MAX, Math.max(...xs) + 25);
  const minY = Math.max(GRID_MIN, Math.min(...ys) - 25);
  const maxY = Math.min(GRID_MAX, Math.max(...ys) + 25);
  for (const hindariNode of [true, false]) {
    const bisa = (gx: number, gy: number): boolean => {
      if (gx < minX || gx > maxX || gy < minY || gy > maxY) return false;
      const k = `${gx},${gy}`;
      if (opts.jembatan?.has(k)) return true;
      if (fp.has(k)) return false;
      if (isWater(gx, gy) || isGunung(gx, gy)) return false;
      if (hindariNode && opts.nodeKeys.has(k)) return false;
      return true;
    };
    // Tujuan = ubin bisa-dilewati terdekat dari footprint B (bukan
    // tepi mentah — tepi bisa tertutup bangunan tetangga).
    const tujuan = new Set(titikAwal(b, bisa).map((t) => `${t.gx},${t.gy}`));
    if (tujuan.size === 0) continue;
    const antre: { gx: number; gy: number }[] = [];
    const asal = new Map<string, string | null>();
    for (const s of titikAwal(a, bisa)) {
      const k = `${s.gx},${s.gy}`;
      if (asal.has(k)) continue;
      asal.set(k, null);
      antre.push(s);
    }
    if (antre.length === 0) continue;
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    let ketemu: string | null = null;
    while (antre.length > 0 && !ketemu) {
      const cur = antre.shift()!;
      const ck = `${cur.gx},${cur.gy}`;
      if (tujuan.has(ck)) {
        ketemu = ck;
        break;
      }
      for (const [dx, dy] of dirs) {
        const nx = cur.gx + dx;
        const ny = cur.gy + dy;
        const nk = `${nx},${ny}`;
        if (asal.has(nk) || !bisa(nx, ny)) continue;
        asal.set(nk, ck);
        antre.push({ gx: nx, gy: ny });
      }
    }
    if (!ketemu) continue;
    const path: { gx: number; gy: number }[] = [];
    let k: string | null = ketemu;
    while (k) {
      const [x, y] = k.split(",").map(Number);
      path.push({ gx: x, gy: y });
      k = asal.get(k) ?? null;
    }
    path.reverse();
    return lebarkanJalan(path, bisa);
  }
  return null;
}

// Ubin jembatan dari placements (footprint kind "jembatan").
function jembatanDariPlacements(placements: PlacementMini[]): Set<string> {
  const out = new Set<string>();
  for (const p of placements) {
    if (p.kind !== "jembatan") continue;
    for (const k of footprintTiles(p)) out.add(k);
  }
  return out;
}

// RONDE 20 — PELEBARAN jalan lama (1 ubin -> 2 ubin): ubin pelebar di
// samping jalan yang sudah dibangun (tegak lurus arah jalan setempat,
// bila bebas). Ubin yang SUDAH punya tetangga jalan di sisi tegak
// lurus dilewati — tanpa ini, lajur luar ikut dilebarkan lagi dan
// jalan merambat jadi 3-4 ubin.
export function jalurPelebaran(
  placements: PlacementMini[],
  jalanSelesai: Set<string>,
  nodeKeys: Set<string>
): { gx: number; gy: number }[] | null {
  if (jalanSelesai.size === 0) return null;
  const fp = new Set<string>();
  for (const p of placements) for (const k of footprintTiles(p)) fp.add(k);
  const jembatan = jembatanDariPlacements(placements);
  const bisa = (gx: number, gy: number): boolean => {
    const k = `${gx},${gy}`;
    if (jalanSelesai.has(k)) return false;
    if (gx < GRID_MIN || gy < GRID_MIN || gx >= GRID_MAX || gy >= GRID_MAX) return false;
    if (jembatan.has(k)) return true;
    if (fp.has(k)) return false;
    if (isWater(gx, gy) || isGunung(gx, gy)) return false;
    if (nodeKeys.has(k)) return false;
    return true;
  };
  const out: { gx: number; gy: number }[] = [];
  const seen = new Set<string>();
  const tiles = [...jalanSelesai]
    .map((k) => k.split(",").map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  for (const [gx, gy] of tiles) {
    const ada = (dx: number, dy: number) => jalanSelesai.has(`${gx + dx},${gy + dy}`);
    const searahEW = ada(1, 0) || ada(-1, 0);
    const searahNS = ada(0, 1) || ada(0, -1);
    let tegak: [number, number][];
    if (searahEW && !searahNS) {
      if (ada(0, 1) || ada(0, -1)) continue; // sudah lebar
      tegak = [[0, 1], [0, -1]];
    } else if (searahNS && !searahEW) {
      if (ada(1, 0) || ada(-1, 0)) continue; // sudah lebar
      tegak = [[1, 0], [-1, 0]];
    } else if (searahEW && searahNS) {
      continue; // simpang — sudah lebar ke segala arah
    } else {
      tegak = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    }
    for (const [ox, oy] of tegak) {
      const sx = gx + ox;
      const sy = gy + oy;
      if (!bisa(sx, sy)) continue;
      const k = `${sx},${sy}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ gx: sx, gy: sy });
      break;
    }
    if (out.length >= 40) break;
  }
  return out.length > 0 ? out : null;
}

// Rencana jalan jam ini: segmen pertama (urutan prioritas) yang ujungnya
// sudah ada + masih punya ubin belum dibangun. null = semua segmen
// selesai / ujung belum ada.
export function rencanaJalan(
  placements: PlacementMini[],
  jalanSelesai: Set<string>,
  nodeKeys: Set<string>
): { segmen: string; tiles: { gx: number; gy: number }[] } | null {
  for (const s of SEGMEN_JALAN) {
    const r = jalurSegmen(s.id, placements, jalanSelesai, nodeKeys);
    if (r) return r;
  }
  // Semua segmen selesai -> lebarkan jalan lama yang masih 1 ubin.
  const lebar = jalurPelebaran(placements, jalanSelesai, nodeKeys);
  if (lebar) return { segmen: "pelebaran", tiles: lebar };
  return null;
}

// Jalur untuk SATU segmen tertentu (2026-11-03, dipakai
// /api/gemini/jalan supaya Gemini bisa MEMILIH segmen, bukan hanya
// urutan tetap rencanaJalan). Mengembalikan null bila segmen tidak
// dikenal, ujungnya belum ada, jalurnya buntu, atau sudah selesai.
export function jalurSegmen(
  segmenId: string,
  placements: PlacementMini[],
  jalanSelesai: Set<string>,
  nodeKeys: Set<string>
): { segmen: string; tiles: { gx: number; gy: number }[] } | null {
  const s = SEGMEN_JALAN.find((x) => x.id === segmenId);
  if (!s) return null;
  const fp = new Set<string>();
  for (const p of placements)
    for (const k of footprintTiles(p)) fp.add(k);
  // Ujung hunian = hunian TERDEKAT ke pasangan segmen (bukan placement
  // hunian pertama di list — gubuk awal (48,48) yang jauh pernah
  // membuat rencana jalan 98 ubin melintasi hutan belantara).
  let pa: PlacementMini | null;
  let pb: PlacementMini | null;
  if (s.a === "hunian") {
    pb = cariPlacement(placements, s.b);
    pa = pb ? cariPlacement(placements, "hunian", pb) : null;
  } else if (s.b === "hunian") {
    pa = cariPlacement(placements, s.a);
    pb = pa ? cariPlacement(placements, "hunian", pa) : null;
  } else {
    pa = cariPlacement(placements, s.a);
    pb = cariPlacement(placements, s.b);
  }
  if (!pa || !pb) return null;
  const jalur = jalurJalan(pa, pb, { footprintSemua: fp, nodeKeys, jembatan: jembatanDariPlacements(placements) });
  if (!jalur) return null;
  const sisa = jalur.filter((t) => !jalanSelesai.has(`${t.gx},${t.gy}`));
  if (sisa.length === 0) return null;
  return { segmen: s.id, tiles: sisa };
}
