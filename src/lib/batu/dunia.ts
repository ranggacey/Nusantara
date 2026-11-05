// Layout kampung zaman batu: grid 600x600 (RONDE 11: 3x tiap sisi dari
// 200x200). Area 200x200 LAMA menjadi PUSAT — koordinat lama TIDAK
// BERGESER: grid baru -200..399, pusat tetap (100,100). Node & terrain
// DIHITUNG dari seed — tidak disimpan di DB.
import { seededRandom } from "../world";
import type { NodeKind } from "./peran";
import { bangunanById } from "./sumberdaya";

export const GRID_MIN = -200;
export const GRID_MAX = 400; // eksklusif
export const GRID_W = 600;
export const GRID_H = 600;
export const PUSAT = { gx: 100, gy: 100 };

// Sungai: pita 2 tile, meliuk pelan dari utara ke selatan di x ~37-44.
// Berlaku untuk SEMUA gy grid baru (-200..399) — sungai lama diperpanjang
// menembus map baru secara kontinu (fungsi sama, tanpa patahan).
export function riverX(gy: number): number {
  return 78 + Math.round(5 * Math.sin(gy / 14));
}

export function isWater(gx: number, gy: number): boolean {
  if (gx < GRID_MIN || gy < GRID_MIN || gx >= GRID_MAX || gy >= GRID_MAX) return true;
  const rx = riverX(gy);
  return gx === rx || gx === rx + 1 || gx === rx + 2;
}

export interface Node {
  kind: NodeKind;
  gx: number;
  gy: number;
}

function jauhDariPusat(gx: number, gy: number, min: number): boolean {
  return Math.abs(gx - PUSAT.gx) + Math.abs(gy - PUSAT.gy) >= min;
}

export function generateNodes(): Node[] {
  // RONDE 11: pusat = kode lama VERBATIM (batas 1..198 dipertahankan
  // supaya hash node pusat identik dengan era 200x200) + ring luar baru.
  return [...generateNodesPusat(), ...generateNodesRing()];
}

function generateNodesPusat(): Node[] {
  const rnd = seededRandom(20261102);
  const nodes: Node[] = [];
  const occupied = new Set<string>();
  const key = (gx: number, gy: number) => `${gx},${gy}`;
  const coba = (kind: NodeKind, gx: number, gy: number): boolean => {
    if (gx < 1 || gy < 1 || gx >= 199 || gy >= 199) return false;
    if (isWater(gx, gy)) return false;
    // Beri ruang lega di pusat kampung (radius 22 tile) untuk bangunan, jalan, dan warga bebas bergerak
    if (!jauhDariPusat(gx, gy, 22)) return false;
    if (occupied.has(key(gx, gy))) return false;
    occupied.add(key(gx, gy));
    nodes.push({ kind, gx, gy });
    return true;
  };
  // Hutan pusat: 26 rumpun alami (proporsional & tidak sesak), tiap rumpun 2-4 pohon
  for (let i = 0; i < 26; i++) {
    const cx = 5 + Math.floor(rnd() * 190);
    const cy = 5 + Math.floor(rnd() * 190);
    const n = 2 + Math.floor(rnd() * 3);
    for (let j = 0; j < n; j++) {
      coba("pohon", cx + Math.floor(rnd() * 5) - 2, cy + Math.floor(rnd() * 5) - 2);
    }
  }
  const sebar = (kind: NodeKind, count: number) => {
    let placed = 0;
    let tries = 0;
    while (placed < count && tries < count * 40) {
      tries++;
      if (coba(kind, 3 + Math.floor(rnd() * 194), 3 + Math.floor(rnd() * 194))) placed++;
    }
  };
  sebar("semak_beri", 24);
  sebar("padang_buruan", 16);
  sebar("singkapan_batu", 20);
  sebar("urat_emas", 10);
  sebar("urat_besi", 12);
  return nodes;
}

// RONDE 11 — ring luar (wilderness): kepadatan ~40% pusat supaya payload
// tetap waras (~3.900 node ring, total ~5.000). Stream RNG TERPISAH
// (seed 20261111) supaya pusat tidak bergeser satu tile pun.
function generateNodesRing(): Node[] {
  const rnd = seededRandom(20261111);
  const nodes: Node[] = [];
  const occupied = new Set<string>();
  const key = (gx: number, gy: number) => `${gx},${gy}`;
  const gunung = gunungTileKeys();
  const diPusat = (gx: number, gy: number) => gx >= 0 && gx < 200 && gy >= 0 && gy < 200;
  const coba = (kind: NodeKind, gx: number, gy: number): boolean => {
    if (gx <= GRID_MIN || gy <= GRID_MIN || gx >= GRID_MAX - 1 || gy >= GRID_MAX - 1) return false;
    if (diPusat(gx, gy)) return false;
    if (isWater(gx, gy)) return false;
    if (gunung.has(key(gx, gy))) return false;
    if (!jauhDariPusat(gx, gy, 25)) return false;
    if (occupied.has(key(gx, gy))) return false;
    occupied.add(key(gx, gy));
    nodes.push({ kind, gx, gy });
    return true;
  };
  for (let i = 0; i < 70; i++) {
    const cx = GRID_MIN + 3 + Math.floor(rnd() * (GRID_W - 6));
    const cy = GRID_MIN + 3 + Math.floor(rnd() * (GRID_H - 6));
    const n = 2 + Math.floor(rnd() * 4);
    for (let j = 0; j < n; j++) {
      coba("pohon", cx + Math.floor(rnd() * 7) - 3, cy + Math.floor(rnd() * 7) - 3);
    }
  }
  const sebar = (kind: NodeKind, count: number) => {
    let placed = 0;
    let tries = 0;
    while (placed < count && tries < count * 40) {
      tries++;
      if (coba(kind, GRID_MIN + 2 + Math.floor(rnd() * (GRID_W - 4)), GRID_MIN + 2 + Math.floor(rnd() * (GRID_H - 4)))) placed++;
    }
  };
  sebar("semak_beri", 50);
  sebar("padang_buruan", 30);
  sebar("singkapan_batu", 35);
  sebar("urat_emas", 18);
  sebar("urat_besi", 20);
  return nodes;
}

// RONDE 11 — GUNUNG + GOA (tampilan dulu, goa VISUAL saja).
// 10 gugusan batu prosedural di ring luar (Manhattan >= 140 dari pusat,
// tidak menutup sungai, tidak tumpang tindih). Tiap gunung = cakram
// berbatu (r 5-8, tinggi 6-10) + 1 mulut goa di sisi menghadap kampung.
// Goa pada rilis ini VISUAL saja (bukan interior yang bisa dimasuki).
export interface Gunung {
  cx: number;
  cy: number;
  r: number;
  h: number;
  goa: { gx: number; gy: number };
}

function hashTile(gx: number, gy: number): number {
  const x = Math.sin(gx * 127.1 + gy * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function gunungTileTermasuk(g: Gunung, gx: number, gy: number): boolean {
  const d = Math.hypot(gx - g.cx, gy - g.cy);
  return d <= g.r - 0.6 + hashTile(gx, gy) * 1.2;
}

let _gunungCache: Gunung[] | null = null;
let _gunungTileCache: Set<string> | null = null;

export function generateGunung(): Gunung[] {
  if (_gunungCache) return _gunungCache;
  const rnd = seededRandom(20261113);
  const list: Gunung[] = [];
  let guard = 0;
  while (list.length < 10 && guard++ < 3000) {
    const cx = GRID_MIN + 20 + Math.floor(rnd() * (GRID_W - 40));
    const cy = GRID_MIN + 20 + Math.floor(rnd() * (GRID_H - 40));
    const r = 5 + Math.floor(rnd() * 4);
    const h = 6 + rnd() * 4;
    if (Math.abs(cx - PUSAT.gx) + Math.abs(cy - PUSAT.gy) < 140) continue;
    if (Math.abs(cx - riverX(cy)) < r + 6) continue;
    if (list.some((g) => Math.hypot(g.cx - cx, g.cy - cy) < g.r + r + 8)) continue;
    const g: Gunung = { cx, cy, r, h, goa: { gx: cx, gy: cy } };
    // Goa: ubin tepi TERJAUH dari pusat gunung ke arah kampung (sumbu
    // dominan), supaya mulut goa terlihat dari arah kampung.
    const dx = PUSAT.gx - cx;
    const dy = PUSAT.gy - cy;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const sx = horizontal ? Math.sign(dx) : 0;
    const sy = horizontal ? 0 : Math.sign(dy);
    let goa = { gx: cx, gy: cy };
    for (let s = 0; s <= r + 2; s++) {
      const gx = cx + sx * s;
      const gy = cy + sy * s;
      if (gunungTileTermasuk(g, gx, gy)) goa = { gx, gy };
    }
    g.goa = goa;
    list.push(g);
  }
  _gunungCache = list;
  return list;
}

export function gunungTileKeys(): Set<string> {
  if (_gunungTileCache) return _gunungTileCache;
  const keys = new Set<string>();
  for (const g of generateGunung()) {
    for (let gy = g.cy - g.r - 1; gy <= g.cy + g.r + 1; gy++) {
      for (let gx = g.cx - g.r - 1; gx <= g.cx + g.r + 1; gx++) {
        if (gunungTileTermasuk(g, gx, gy)) keys.add(`${gx},${gy}`);
      }
    }
  }
  _gunungTileCache = keys;
  return keys;
}

export function isGunung(gx: number, gy: number): boolean {
  return gunungTileKeys().has(`${gx},${gy}`);
}

// Node aktif: hanya node yang masih bersisa (> 0). Node habis (sisa 0)
// HILANG dari peta sampai tumbuh lagi (regrow) — despawn otomatis.
// Tanpa node_sisa (dunia baru), semua node aktif.
export function nodeAktif(nodes: Node[], nodeSisa?: Record<string, number>): Node[] {
  if (!nodeSisa) return nodes;
  return nodes.filter((n) => (nodeSisa[`${n.gx},${n.gy}`] ?? 5) > 0);
}

export function nodeSprite(kind: NodeKind): string {
  const m: Record<NodeKind, string> = {
    pohon: "/batu/pohon.png",
    semak_beri: "/batu/semak-beri.png",
    padang_buruan: "/batu/padang-buruan.png",
    singkapan_batu: "/batu/singkapan-batu.png",
    urat_emas: "/batu/urat-emas.png",
    urat_besi: "/batu/urat-besi.png",
  };
  return m[kind];
}

// Cari plot kosong terdekat dari pusat (tidak air, tidak gunung, tidak
// node, tidak placement). RONDE 11: pindai grid baru penuh tapi TANPA
// menampung semua kandidat (lacak terbaik saja — hasil SAMA dengan
// sort stabil lama: jarak terkecil, tie = urutan row-major pertama).
// RONDE 18 — SPACING MINIMUM: gap (default 1) = jumlah ubin kosong yang
// wajib ada di antara footprint baru dan footprint lama. Tanpa gap,
// findPlot selalu mendarat MENEMPEL klaster lama (plot bebas terdekat =
// persis di sebelah bangunan) — itulah 35 pasangan mepet gap 0 di
// kampung live. gap 1: cincin 1 ubin di sekeliling tiap footprint lama
// ikut diblokir, jadi bangunan baru tidak pernah menempel.
// Jembatan/perahu TIDAK pakai findPlot (finder sendiri) — spacing tidak
// berlaku untuk struktur sungai (wajib menyentuh tepi/air).
export function findPlot(
  occupied: Set<string>,
  nodeKeys: Set<string>,
  w: number,
  h: number,
  gap = 3
): { gx: number; gy: number } | null {
  const blocked = new Set<string>();
  if (gap <= 0) {
    for (const k of occupied) blocked.add(k);
  } else {
    for (const k of occupied) {
      const [ox, oy] = k.split(",").map(Number);
      for (let dy = -gap; dy <= gap; dy++)
        for (let dx = -gap; dx <= gap; dx++)
          blocked.add(`${ox + dx},${oy + dy}`);
    }
  }
  let best: { gx: number; gy: number; d: number } | null = null;
  for (let gy = GRID_MIN + 2; gy + h <= GRID_MAX - 2; gy++) {
    for (let gx = GRID_MIN + 2; gx + w <= GRID_MAX - 2; gx++) {
      let ok = true;
      for (let dy = 0; dy < h && ok; dy++) {
        for (let dx = 0; dx < w && ok; dx++) {
          const k = `${gx + dx},${gy + dy}`;
          if (isWater(gx + dx, gy + dy) || isGunung(gx + dx, gy + dy) || nodeKeys.has(k) || blocked.has(k)) ok = false;
        }
      }
      if (!ok) continue;
      const d = Math.abs(gx + w / 2 - PUSAT.gx) + Math.abs(gy + h / 2 - PUSAT.gy);
      if (d < 5) continue; // Ruang terbuka sekitar api unggun
      if (!best || d < best.d) best = { gx, gy, d };
    }
  }
  return best ? { gx: best.gx, gy: best.gy } : null;
}

// RONDE 18 — dedupe placement (tampilan + sim, BUKAN tulis DB): 85 baris
// duplikat di peta_tile live (13x pagar/rak_jemur/lingkaran_batu di ubin
// sama, id BERBEDA — dokumen ganda beneran dari advance bersamaan, bukan
// artefak join) membuat klien me-render model bertumpuk di ubin yang
// sama + sim menghitung kapasitas ganda. Dokumen lama TIDAK dihapus
// (protokol: tanpa tulis/hapus DB) — yang didedupe hanya tampilan (route
// /api/map, panel /api/bangunan) + snapshot in-memory sim. Pertama menang.
export function dedupePlacement<T extends { kind: string; gx: number; gy: number }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of rows) {
    const k = `${r.kind}:${r.gx},${r.gy}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

// SATU SUMBER KEBENARAN PETAK (r38, laporan user 2026-11-05:
// "rumah nembus restoran, tapi AI tata kota bilang gada yg nimpa").
// Sebelum r38, tiap tempat memakai default w/h sendiri-sendiri bila
// baris placement tidak punya w/h: sim pakai ?? 1, rapikan/tatakota
// pakai ?? 2, /api/map pakai ?? 1 — jadi cek tumpang tindih bisa
// berkata "aman" sementara penempatan menganggap petak yang sama
// sudah terisi (atau sebaliknya). Mulai r38, SEMUA jalur (sim,
// rapikan, tatakota, Map3D) memakai helper di bawah: w/h baris bila
// ada dan valid, kalau tidak footprint katalog bangunan itu
// (bangunanById), kalau tidak dikenal baru 1x1. Satu petak = satu
// ubin grid; tiap bangunan menempati petak (gubuk 2x2 = 4 petak,
// paviliun 8x8 = 64 petak) — ala game strategi.
export interface PetakLike {
  kind?: string;
  gx: number;
  gy: number;
  w?: number | null;
  h?: number | null;
}

// Ukuran petak satu placement: w/h baris bila valid, kalau tidak
// footprint katalog. Jembatan/perahu menyimpan w/h sendiri (4x1,
// 5x1, 2x1) — nilai baris itu dipertahankan, bukan dipaksa bujur
// sangkar dari katalog.
export function ukuranPetak(p: PetakLike): { w: number; h: number } {
  const dw = Number(p.w);
  const dh = Number(p.h);
  if (Number.isFinite(dw) && dw > 0 && Number.isFinite(dh) && dh > 0) {
    return { w: Math.floor(dw), h: Math.floor(dh) };
  }
  const fp = p.kind ? (bangunanById(p.kind)?.footprint ?? 1) : 1;
  return { w: fp, h: fp };
}

// Semua ubin grid yang ditempati satu placement.
export function petakBangunan(p: PetakLike): Set<string> {
  const { w, h } = ukuranPetak(p);
  const s = new Set<string>();
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) s.add(`${p.gx + dx},${p.gy + dy}`);
  }
  return s;
}

// Gabungan ubin semua placement (untuk findPlot / rintangan / jalan).
export function occupiedDariPlacements<T extends PetakLike>(rows: T[]): Set<string> {
  const out = new Set<string>();
  for (const r of rows) {
    for (const k of petakBangunan(r)) out.add(k);
  }
  return out;
}

// Apakah footprint calon (gx,gy,w,h) bebas dari semua placement?
// `abaikan` = lewati satu baris (mis. bangunan yang sedang digeser
// itu sendiri). Dipakai sebagai penjaga akhir sebelum placement
// ditulis, supaya dua advance bersamaan tidak menumpuk bangunan.
export function plotBebas<T extends PetakLike>(
  rows: T[],
  gx: number,
  gy: number,
  w: number,
  h: number,
  abaikan?: (r: T) => boolean
): boolean {
  const baru = new Set<string>();
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) baru.add(`${gx + dx},${gy + dy}`);
  }
  for (const r of rows) {
    if (abaikan && abaikan(r)) continue;
    for (const k of petakBangunan(r)) {
      if (baru.has(k)) return false;
    }
  }
  return true;
}

// Cari dua bangunan yang FOOTPRINT-nya saling tumpang (2026-11-04,
// permintaan user: Gemini menggeser bangunan yang nabrak). Bukan cuma
// posisi asal sama — bangunan besar yang menimpa bangunan kecil di
// sebelahnya juga ketahuan. Pasangan pertama yang ditemukan: yang
// dipertahankan = yang lebih dulu di daftar (sama dengan aturan dedupe
// tampilan: pertama menang), yang digeser = yang kedua. Null bila
// tidak ada tumpukan. Murni + dites.
export function pasanganTumpuk<T extends PetakLike>(
  rows: T[]
): { tetap: T; geser: T } | null {
  const tiles = rows.map((r) => petakBangunan(r));
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      for (const k of tiles[j]) {
        if (tiles[i].has(k)) return { tetap: rows[i], geser: rows[j] };
      }
    }
  }
  return null;
}

// Cari plot JEMBATAN: segmen sungai (2 tile air) + 1 tile tepi di tiap sisi,
// terdekat dari pusat, bebas placement. Footprint 4x1: [tepi barat, air, air,
// tepi timur]. Dipakai sim saat NPC memutuskan membangun jembatan.
// Cari plot rumah di sebelah jalan dan tentukan rotasi agar pintu menghadap jalan
export function findHousePlotBesideRoad(
  occupied: Set<string>,
  nodeKeys: Set<string>,
  roadTiles: Set<string>,
  w = 2,
  h = 2,
  gap = 1
): { gx: number; gy: number; rotasi: number } | null {
  const blocked = new Set<string>();
  for (const k of occupied) {
    const [ox, oy] = k.split(",").map(Number);
    for (let dy = -gap; dy <= gap; dy++)
      for (let dx = -gap; dx <= gap; dx++)
        blocked.add(`${ox + dx},${oy + dy}`);
  }
  for (const rk of roadTiles) blocked.add(rk);

  let best: { gx: number; gy: number; d: number; rotasi: number } | null = null;
  for (let gy = GRID_MIN + 2; gy + h <= GRID_MAX - 2; gy++) {
    for (let gx = GRID_MIN + 2; gx + w <= GRID_MAX - 2; gx++) {
      let ok = true;
      for (let dy = 0; dy < h && ok; dy++) {
        for (let dx = 0; dx < w && ok; dx++) {
          const k = `${gx + dx},${gy + dy}`;
          if (isWater(gx + dx, gy + dy) || isGunung(gx + dx, gy + dy) || nodeKeys.has(k) || blocked.has(k)) ok = false;
        }
      }
      if (!ok) continue;

      let rotasi = 0;
      let adaJalan = false;

      // Sisi Selatan (gy + h) -> Pintu hadap Selatan (rotasi 0)
      for (let dx = 0; dx < w; dx++) {
        if (roadTiles.has(`${gx + dx},${gy + h}`)) {
          adaJalan = true;
          rotasi = 0;
          break;
        }
      }
      // Sisi Utara (gy - 1) -> Pintu hadap Utara (rotasi Math.PI)
      if (!adaJalan) {
        for (let dx = 0; dx < w; dx++) {
          if (roadTiles.has(`${gx + dx},${gy - 1}`)) {
            adaJalan = true;
            rotasi = Math.PI;
            break;
          }
        }
      }
      // Sisi Timur (gx + w) -> Pintu hadap Timur (rotasi Math.PI / 2)
      if (!adaJalan) {
        for (let dy = 0; dy < h; dy++) {
          if (roadTiles.has(`${gx + w},${gy + dy}`)) {
            adaJalan = true;
            rotasi = Math.PI / 2;
            break;
          }
        }
      }
      // Sisi Barat (gx - 1) -> Pintu hadap Barat (rotasi -Math.PI / 2)
      if (!adaJalan) {
        for (let dy = 0; dy < h; dy++) {
          if (roadTiles.has(`${gx - 1},${gy + dy}`)) {
            adaJalan = true;
            rotasi = -Math.PI / 2;
            break;
          }
        }
      }

      if (!adaJalan && roadTiles.size > 0) continue;

      const d = Math.abs(gx + w / 2 - PUSAT.gx) + Math.abs(gy + h / 2 - PUSAT.gy);
      if (d < 4) continue;
      if (!best || d < best.d) best = { gx, gy, d, rotasi };
    }
  }
  return best ? { gx: best.gx, gy: best.gy, rotasi: best.rotasi } : null;
}

// RONDE 20 — ARAH HADAP RUMAH (permintaan user 2026-11-05: "bagian
// depan rumah harus menghadap ke jalan"). Rotasi dari ubin jalan
// TERDEKAT dengan footprint (bukan hanya yang menempel — rumah yang
// dibangun sebelum ada jalan tetap bisa menghadap jalan terdekat yang
// ada). Konvensi sama dengan findHousePlotBesideRoad: jalan di selatan
// -> 0, utara -> PI, timur -> PI/2, barat -> -PI/2. 0 bila belum ada
// jalan sama sekali.
export function rotasiKeJalan(
  gx: number,
  gy: number,
  w: number,
  h: number,
  roadTiles: Set<string>
): number {
  if (roadTiles.size === 0) return 0;
  let best: { d: number; sisi: "S" | "N" | "E" | "W"; tegak: number } | null = null;
  for (const k of roadTiles) {
    const [rx, ry] = k.split(",").map(Number);
    const dx = rx < gx ? gx - rx - 1 : rx >= gx + w ? rx - (gx + w - 1) - 1 : 0;
    const dy = ry < gy ? gy - ry - 1 : ry >= gy + h ? ry - (gy + h - 1) - 1 : 0;
    const d = dx + dy;
    // Sisi = sumbu dengan jarak lebih besar (ubin diagonal dinilai dari
    // sisi terdekatnya); tegak = jarak di sumbu satunya (tie-break).
    // RONDE 20 — perbaikan: ubin jalan yang LANGSUNG menempel di sisi
    // timur/barat (dx = dy = 0, mis. (gx+w, gy)) dulu jatuh ke cabang
    // `dy >= dx` -> "N", jadi rumah di tepi jalan timur/barat salah
    // menghadap utara. Ubin menempel kini dinilai dari posisinya
    // terhadap footprint (prioritas S, N, E, W — sama seperti
    // findHousePlotBesideRoad).
    let sisi: "S" | "N" | "E" | "W";
    let tegak: number;
    if (dx === 0 && dy === 0) {
      if (ry >= gy + h) { sisi = "S"; tegak = 0; }
      else if (ry < gy) { sisi = "N"; tegak = 0; }
      else if (rx >= gx + w) { sisi = "E"; tegak = 0; }
      else { sisi = "W"; tegak = 0; }
    } else if (dy >= dx) {
      sisi = ry >= gy + h ? "S" : "N";
      tegak = dx;
    } else {
      sisi = rx >= gx + w ? "E" : "W";
      tegak = dy;
    }
    if (!best || d < best.d || (d === best.d && tegak < best.tegak)) {
      best = { d, sisi, tegak };
    }
  }
  if (!best) return 0;
  return best.sisi === "S" ? 0 : best.sisi === "N" ? Math.PI : best.sisi === "E" ? Math.PI / 2 : -Math.PI / 2;
}

export function findBridgePlot(
  occupied: Set<string>
): { gx: number; gy: number; w: number; h: number } | null {
  const candidates: { gx: number; gy: number; d: number }[] = [];
  for (let gy = GRID_MIN + 3; gy < GRID_MAX - 3; gy++) {
    const rx = riverX(gy);
    const gx = rx - 1;
    const tiles = [`${gx},${gy}`, `${gx + 1},${gy}`, `${gx + 2},${gy}`, `${gx + 3},${gy}`];
    if (tiles.some((t) => occupied.has(t))) continue;
    if (!isWater(gx + 1, gy) || !isWater(gx + 2, gy)) continue;
    if (isWater(gx, gy) || isWater(gx + 3, gy)) continue;
    candidates.push({ gx, gy, d: Math.abs(gx + 2 - PUSAT.gx) + Math.abs(gy - PUSAT.gy) });
  }
  candidates.sort((a, b) => a.d - b.d);
  return candidates.length > 0 ? { gx: candidates[0].gx, gy: candidates[0].gy, w: 5, h: 1 } : null;
}

// Cari titik tambat PERAHU: tile air sungai terdekat dari pusat yang bebas
// placement (perahu ditambatkan di air, 2x1). Warga menyeberang lewat perahu
// (status "Naik perahu…") saat ada perahu — v1: perahu tambat, bukan berlayar.
export function findBoatSpot(
  occupied: Set<string>
): { gx: number; gy: number; w: number; h: number } | null {
  const candidates: { gx: number; gy: number; d: number }[] = [];
  for (let gy = GRID_MIN + 3; gy < GRID_MAX - 3; gy++) {
    const rx = riverX(gy);
    if (occupied.has(`${rx},${gy}`) || occupied.has(`${rx + 1},${gy}`)) continue;
    candidates.push({ gx: rx, gy, d: Math.abs(rx + 1 - PUSAT.gx) + Math.abs(gy - PUSAT.gy) });
  }
  candidates.sort((a, b) => a.d - b.d);
  return candidates.length > 0 ? { gx: candidates[0].gx, gy: candidates[0].gy, w: 2, h: 1 } : null;
}

// Penempatan awal dunia: 1 gubuk + 1 api unggun di pusat kampung.
export const PLACEMENT_AWAL = [
  { kind: "gubuk", gx: 98, gy: 98, w: 2, h: 2, awal: true },
  { kind: "api_unggun", gx: 102, gy: 100, w: 1, h: 1, awal: true },
];
