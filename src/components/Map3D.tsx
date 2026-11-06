// Peta 3D modern Negara Emas — Zaman Batu (Three.js, BUKAN pixel).
// Terrain 200x200 + sungai MENGALIR (tekstur arus bergerak) + node resource +
// bangunan + konstruksi bertahap + warga berkaki + hewan, semua geometri
// prosedural — tanpa download, tanpa rip.
// Kontrol: drag = PAN peta (halaman tidak scroll saat drag di area peta —
// touch-action: none + MapControls), wheel/pinch = zoom, dua jari / klik
// kanan = putar. Peta FULLSCREEN (wadah dari page).
// Gerakan MULUS: dead reckoning client-side — warga berjalan dengan kecepatan
// konstan menuju target server (bukan snap/lerp cepat), kaki mengayun,
// animasi jalan kontinyu. Posisi server tetap otoritatif (snap HANYA bila
// display > AMBANG_SNAP_DESYNC dari posisi server — jaring pengaman
// desync nyata, bukan tiap menit; lihat tampil.ts ronde 6).
// Bubble (RONDE 13 — EVENT-ONLY): bubble HANYA muncul saat event sim —
// ngobrol beneran antar 2 warga, konflik (debat/gelud/diserang), atau
// momen (warga baru, bangunan selesai, makan bersama) — dengan jendela
// singkat ~1 jam game. Dialog ambient + Zzz TIDAK LAGI dirender sebagai
// bubble (tidur ditunjukkan pose rebah, bukan bubble).
// Siang/malam: dari SISTEM (jam game server) — tidak ada setting pengguna.
// Malam = gelap + bulan + bintang + cahaya api unggun (PointLight).
"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MapControls } from "three/examples/jsm/controls/MapControls.js";
import { GUBUK_DINDING, GUBUK_ATAP, POHON_BATANG } from "@/lib/batu/skala";
import { paceTampil, lajuServerPerDetik, langkahDisplay, jalurTampil, paletCahaya, pusatDariTitik, type ModeCahaya, bubbleInteraksiAktif, teksBubbleEvent, isNight, langkahAyunan, sudutAyunan, langkahHewan, sudutKakiHewan, AMBANG_SNAP_DESYNC, kunciTujuan, kunciTujuanBaru, type TujuanTerkunci, poseTidur, specRambut, ayunanPerkakas, cariHewanBuas, hitungPipKumpul, lebarBarHp, tidurDiDalam, rapikanLabelBertumpuk } from "@/lib/batu/tampil";
import { durasiJamMs } from "@/lib/clock";
import { buatTombakIblis } from "@/lib/batu/senjataIblis";
import { updateAudioScene, SFX_PERKAKAS } from "@/lib/audio";
import { createFantasyWarehouse } from "@/lib/batu/assetGudang3D";
import { createPaviliunNirwana } from "@/lib/batu/assetPaviliun3D";
import { createFantasyHouse, isVillageMaterial } from "@/lib/batu/assetVillage3D";
import { createModularRoadTile, determineRoadPiece, isRoadMaterial } from "@/lib/batu/assetRoad3D";

type J = Record<string, any>;

interface Props {
  map: J | null;
  selectedId: string | null;
  onSelectTile: (gx: number, gy: number) => void;
  followId: string | null;
  onTapWarga: (id: string) => void;
  // RONDE 11: geser (pan) melepas kunci kamera dengan lembut — parent
  // cukup setFollowId(null), sama seperti tombol "Batal kunci".
  onLepasKunci: () => void;
  onTapBangunan?: (p: { id: string; kind: string; gx: number; gy: number; level?: number }) => void;
  gameFase: string;
  // RONDE 23 — ambien prosedural (r43): cuaca dari page (cuacaGame),
  // diteruskan ke updateAudioScene bersama gameFase.
  cuaca?: string;
  jamTotal: number;
  onResourceHarvested?: (resource: string, amount: number) => void;
  roadLevel?: number;
  // Setting label karakter (2026-11-04): false = sembunyikan semua label
  // DOM karakter (nama, dialog, aksi, HP) supaya HP lebih ringan.
  labelTampil?: boolean;
}

// Deterministik dari index (stabil antar render).
const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const ROLE_STYLE: Record<string, { color: number; tool: string; label: string }> = {
  kepala_suku: { color: 0xb91c1c, tool: "tongkat_suku", label: "Kepala Suku" },
  pemburu: { color: 0x92400e, tool: "tombak", label: "Pemburu" },
  pengumpul: { color: 0x15803d, tool: "keranjang", label: "Pengumpul" },
  penebang: { color: 0x78350f, tool: "kapak", label: "Penebang" },
  penambang: { color: 0x475569, tool: "beliung", label: "Penambang" },
  perajin: { color: 0x1d4ed8, tool: "palu", label: "Perajin" },
  tabib: { color: 0x0f766e, tool: "tongkat", label: "Tabib" },
  penjaga_api: { color: 0xea580c, tool: "obor", label: "Penjaga Api" },
  peramu: { color: 0x7c3aed, tool: "lumpang", label: "Peramu" },
  juru_masak: { color: 0xbe185d, tool: "periuk", label: "Juru Masak" },
  nelayan: { color: 0x0e7490, tool: "jala", label: "Nelayan" },
  petani: { color: 0x65a30d, tool: "cangkul", label: "Petani" },
  penjaga: { color: 0x7f1d1d, tool: "tombak", label: "Penjaga Kampung" },
  pengukir: { color: 0x57534e, tool: "pahat", label: "Pengukir Batu" },
  penjelajah: { color: 0x0f766e, tool: "tongkat_jalan", label: "Penjelajah" },
  pemanjat: { color: 0x854d0e, tool: "tali_panjat", label: "Pemanjat" },
  penenun: { color: 0x9d174d, tool: "alat_tenun", label: "Penenun" },
  penjerat: { color: 0x365314, tool: "jerat", label: "Penjerat" },
};
const SKIN = [0xf2c9a0, 0xd9a066, 0xa9714b, 0x7a4a2b];
const skinDariNomor = (nomor: string) => {
  let h = 0;
  for (const c of nomor) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return SKIN[h % SKIN.length];
};

function instanced(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  items: { x: number; z: number; sx?: number; sy?: number; sz?: number; r?: number; y?: number }[]
): THREE.InstancedMesh {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(items.length, 1));
  const d = new THREE.Object3D();
  items.forEach((it, i) => {
    d.position.set(it.x, it.y ?? 0, it.z);
    d.rotation.set(0, it.r ?? 0, 0);
    d.scale.set(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1);
    d.updateMatrix();
    m.setMatrixAt(i, d.matrix);
  });
  m.count = items.length;
  m.instanceMatrix.needsUpdate = true;
  return m;
}

function box(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  return m;
}

// RONDE 11 — gunung + mulut goa (VISUAL saja, bukan interior yang bisa
// dimasuki): tiap gunung = 3 teras batu bertumpuk (kerucut berundak,
// puncak lumut tipis) + mulut goa (lengkung gelap + bingkai batu) di
// ubin goa, menghadap kampung. Gunung = rintangan di sim (pathing
// memutar), di render ia hanya mesh statis.
function gunungMeshes(gunung: J[], center: number): THREE.Group {
  const g = new THREE.Group();
  const rock = new THREE.MeshLambertMaterial({ color: 0x8a8d90 });
  const rockDark = new THREE.MeshLambertMaterial({ color: 0x6b7280 });
  const moss = new THREE.MeshLambertMaterial({ color: 0x5d7a4a });
  const goaMat = new THREE.MeshBasicMaterial({ color: 0x0b0b0f });
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x4b5563 });
  const toW = (gx: number, gy: number) => ({ x: gx - center + 0.5, z: gy - center + 0.5 });
  for (const m of gunung ?? []) {
    const w = toW(Number(m.cx), Number(m.cy));
    const r = Number(m.r ?? 6);
    const h = Number(m.h ?? 8);
    const t1 = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.72, r, h * 0.45, 8), rock);
    t1.position.set(w.x, (h * 0.45) / 2, w.z);
    const t2 = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.72, h * 0.35, 8), rockDark);
    t2.position.set(w.x, h * 0.45 + (h * 0.35) / 2, w.z);
    const t3 = new THREE.Mesh(new THREE.ConeGeometry(r * 0.45, h * 0.2 + 1, 8), rock);
    t3.position.set(w.x, h * 0.8 + (h * 0.2 + 1) / 2, w.z);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.18, 1.2, 8), moss);
    cap.position.set(w.x, h * 0.8 + (h * 0.2 + 1) + 0.4, w.z);
    g.add(t1, t2, t3, cap);
    const goa = (m as J).goa as J | undefined;
    if (goa && typeof goa.gx === "number" && typeof goa.gy === "number") {
      const gw2 = toW(Number(goa.gx), Number(goa.gy));
      const dx = Number(goa.gx) - Number(m.cx);
      const dz = Number(goa.gy) - Number(m.cy);
      const rotY = Math.atan2(dx, dz);
      const frame = box(1.6, 2.2, 0.25, 0x4b5563, 0, 1.1, 0);
      frame.position.set(gw2.x + Math.sign(dx) * 0.2, 1.1, gw2.z + Math.sign(dz) * 0.2);
      frame.rotation.y = rotY;
      const mouth = box(1.1, 1.7, 0.3, 0x0b0b0f, 0, 0.85, 0);
      mouth.material = goaMat;
      mouth.position.set(gw2.x + Math.sign(dx) * 0.2, 0.85, gw2.z + Math.sign(dz) * 0.2);
      mouth.rotation.y = rotY;
      g.add(frame, mouth);
    }
  }
  return g;
}

function terrainMesh(gw: number, gh: number): THREE.Mesh {
  // RONDE 11: segmen TIDAK lagi = ukuran grid (600x600 segmen = 720rb
  // segitiga, berat di HP). 150x150 segmen (45rb segitiga) cukup untuk
  // tanah datar + variasi warna per-vertex.
  const seg = 150;
  const geo = new THREE.PlaneGeometry(gw, gh, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const base = new THREE.Color(0x6fae5a);
  const patch = new THREE.Color(0x5d9c4a);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const v = 0.92 + rnd(Math.round(x * 10 + z * 100), 7) * 0.16;
    const isPatch = rnd(Math.round(x * 3 + z * 7), 99) > 0.82;
    const c = isPatch ? patch : base;
    colors[i * 3] = c.r * v;
    colors[i * 3 + 1] = c.g * v;
    colors[i * 3 + 2] = c.b * v;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  return new THREE.Mesh(geo, mat);
}

// Sungai MENGALIR: tekstur arus (streaks) yang offset-nya bergerak tiap frame.
function riverTexture(): THREE.CanvasTexture {
  const cv = document.createElement("canvas");
  cv.width = 64;
  cv.height = 128;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#3f8fd2";
  ctx.fillRect(0, 0, 64, 128);
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    const x = 6 + i * 7;
    const y0 = (i * 29) % 128;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.quadraticCurveTo(x + 6, y0 + 16, x - 2, y0 + 34);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.arc((i * 37) % 64, (i * 53) % 128, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

function riverMesh(riverXs: number[], center: number, minGy: number, tex: THREE.Texture): THREE.Mesh {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vi = 0;
  for (let i = 0; i < riverXs.length; i++) {
    const rx = riverXs[i];
    const gy = minGy + i;
    for (const dx of [0, 1, 2]) {
      const x0 = rx + dx - center;
      const x1 = x0 + 1;
      const z0 = gy - center;
      const z1 = z0 + 1;
      positions.push(x0, 0.06, z0, x1, 0.06, z0, x1, 0.06, z1, x0, 0.06, z1);
      uvs.push(0, gy / 8, 1, gy / 8, 1, (gy + 1) / 8, 0, (gy + 1) / 8);
      indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
      vi += 4;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, transparent: true, opacity: 0.95 }));
}

function nodeMeshes(nodes: J[], center: number): THREE.Group {
  const g = new THREE.Group();
  const byKind: Record<string, J[]> = {};
  for (const n of nodes) (byKind[String(n.kind)] ??= []).push(n);
  const lambert = (c: number) => new THREE.MeshLambertMaterial({ color: c });
  const std = (c: number, metal: number, rough: number) =>
    new THREE.MeshStandardMaterial({ color: c, metalness: metal, roughness: rough });
  const toW = (n: J) => ({ x: n.gx - center + 0.5, z: n.gy - center + 0.5 });

  const pohon = byKind.pohon ?? [];
  if (pohon.length) {
    // Pohon proporsional dunia nyata: batang 2,2 + tajuk sampai 5,8
    // (≈ 3,2x orang) — bukan lagi setinggi orang.
    const trunks = pohon.map((n, i) => {
      const w = toW(n);
      const s = 0.85 + rnd(i, 11) * 0.4;
      return { x: w.x, z: w.z, sx: s, sy: s, sz: s, y: (POHON_BATANG / 2) * s, r: rnd(i, 12) * Math.PI };
    });
    g.add(instanced(new THREE.CylinderGeometry(0.24, 0.34, POHON_BATANG, 6), lambert(0x6b4226), trunks));
    const canopies = pohon.map((n, i) => {
      const w = toW(n);
      const s = 0.85 + rnd(i, 11) * 0.4;
      return { x: w.x, z: w.z, sx: s, sy: s, sz: s, y: 3.7 * s, r: rnd(i, 13) * Math.PI };
    });
    g.add(instanced(new THREE.ConeGeometry(1.5, 4.2, 7), lambert(0x2e7d32), canopies));
  }
  const semak = byKind.semak_beri ?? [];
  if (semak.length) {
    const bushes = semak.map((n, i) => {
      const w = toW(n);
      const s = 0.85 + rnd(i, 21) * 0.3;
      return { x: w.x, z: w.z, sx: s, sy: s * 0.62, sz: s, y: 0.42 * s, r: rnd(i, 22) * Math.PI };
    });
    g.add(instanced(new THREE.SphereGeometry(0.75, 8, 6), lambert(0x388e3c), bushes));
    const berries = semak.map((n) => {
      const w = toW(n);
      return { x: w.x + 0.3, z: w.z + 0.2, y: 0.75 };
    });
    g.add(instanced(new THREE.SphereGeometry(0.12, 6, 5), lambert(0xd32f2f), berries));
  }
  const padang = byKind.padang_buruan ?? [];
  if (padang.length) {
    g.add(
      instanced(
        new THREE.CylinderGeometry(0.95, 0.95, 0.18, 10),
        lambert(0xc9b458),
        padang.map((n, i) => {
          const w = toW(n);
          return { x: w.x, z: w.z, y: 0.09, r: rnd(i, 31) * Math.PI };
        })
      )
    );
  }
  const batu = byKind.singkapan_batu ?? [];
  if (batu.length) {
    g.add(
      instanced(
        new THREE.DodecahedronGeometry(0.9, 0),
        lambert(0x8d8d8d),
        batu.map((n, i) => {
          const w = toW(n);
          const s = 0.8 + rnd(i, 41) * 0.5;
          return { x: w.x, z: w.z, sx: s, sy: s * 0.75, sz: s, y: 0.55 * s, r: rnd(i, 42) * Math.PI };
        })
      )
    );
  }
  const emas = byKind.urat_emas ?? [];
  if (emas.length) {
    g.add(
      instanced(
        new THREE.DodecahedronGeometry(0.85, 0),
        std(0xfacc15, 0.7, 0.35),
        emas.map((n, i) => {
          const w = toW(n);
          const s = 0.85 + rnd(i, 51) * 0.3;
          return { x: w.x, z: w.z, sx: s, sy: s * 0.7, sz: s, y: 0.5 * s, r: rnd(i, 52) * Math.PI };
        })
      )
    );
  }
  const besi = byKind.urat_besi ?? [];
  if (besi.length) {
    g.add(
      instanced(
        new THREE.DodecahedronGeometry(0.85, 0),
        std(0x475569, 0.6, 0.5),
        besi.map((n, i) => {
          const w = toW(n);
          const s = 0.85 + rnd(i, 61) * 0.3;
          return { x: w.x, z: w.z, sx: s, sy: s * 0.7, sz: s, y: 0.5 * s, r: rnd(i, 62) * Math.PI };
        })
      )
    );
  }
  return g;
}

// RONDE 15 — mesh sementara node yang tumbang/hancur (dipakai 1,5 detik
// lalu dihapus di render loop). Pohon = batang + tajuk (roboh miring);
// lainnya = satu bongkahan (menyusut + tenggelam = hancur). Material
// transparan supaya bisa fade-out.
function buildFallingNode(kind: string): THREE.Group | null {
  const g = new THREE.Group();
  const lam = (c: number) => {
    const mt = new THREE.MeshLambertMaterial({ color: c });
    mt.transparent = true;
    return mt;
  };
  if (kind === "pohon") {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, POHON_BATANG, 6), lam(0x6b4226));
    trunk.position.y = POHON_BATANG / 2;
    g.add(trunk);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4.2, 7), lam(0x2e7d32));
    canopy.position.y = 3.7;
    g.add(canopy);
    return g;
  }
  const geo =
    kind === "padang_buruan"
      ? new THREE.CylinderGeometry(0.95, 0.95, 0.18, 10)
      : kind === "semak_beri"
        ? new THREE.SphereGeometry(0.75, 8, 6)
        : new THREE.DodecahedronGeometry(0.85, 0);
  const col =
    kind === "padang_buruan" ? 0xc9b458 : kind === "semak_beri" ? 0x388e3c : kind === "urat_emas" ? 0xfacc15 : kind === "urat_besi" ? 0x475569 : 0x8d8d8d;
  const mesh = new THREE.Mesh(geo, lam(col));
  mesh.position.y = 0.5;
  g.add(mesh);
  return g;
}

function pyramid(r: number, h: number, color: number, y: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4), new THREE.MeshLambertMaterial({ color }));
  m.rotation.y = Math.PI / 4;
  m.position.y = y;
  return m;
}


// Aset 3D Sawah Padi Luas Bertingkat (Terasering, Air Jernih, Rumpun Padi Emas & Hijau)
function createSawahLuas(w: number, h: number): THREE.Group {
  const g = new THREE.Group();
  const mudMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
  const waterMat = new THREE.MeshLambertMaterial({ color: 0x3d7068, transparent: true, opacity: 0.85 });
  const borderMat = new THREE.MeshLambertMaterial({ color: 0x3a2e1d });
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x8a5a33 });
  const thatchMat = new THREE.MeshLambertMaterial({ color: 0xc9a86a });

  // Fondasi tanah pematang sawah
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.35, h), mudMat);
  base.position.y = 0.175;
  g.add(base);

  // Air sawah berpetak
  const water = new THREE.Mesh(new THREE.BoxGeometry(w - 0.4, 0.08, h - 0.4), waterMat);
  water.position.y = 0.38;
  g.add(water);

  // Pematang sawah silang di tengah pembagi petak
  const pematangX = new THREE.Mesh(new THREE.BoxGeometry(w, 0.42, 0.35), borderMat);
  pematangX.position.y = 0.21;
  g.add(pematangX);
  const pematangZ = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.42, h), borderMat);
  pematangZ.position.y = 0.21;
  g.add(pematangZ);

  // Rumpun batang padi (kuning keemasan dan hijau subur berselang-seling)
  const padiColors = [0x84cc16, 0xeab308, 0x65a30d, 0xfacc15];
  for (let ix = -w / 2 + 0.6; ix < w / 2 - 0.4; ix += 0.65) {
    for (let iz = -h / 2 + 0.6; iz < h / 2 - 0.4; iz += 0.65) {
      if (Math.abs(ix) < 0.3 || Math.abs(iz) < 0.3) continue; // jangan di atas pematang
      const col = padiColors[Math.floor(Math.abs(ix * 7 + iz * 13)) % padiColors.length];
      const padi = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.65, 5), new THREE.MeshLambertMaterial({ color: col }));
      padi.position.set(ix, 0.7, iz);
      padi.rotation.y = Math.sin(ix + iz) * Math.PI;
      g.add(padi);
    }
  }

  // Saung bambu penjaga sawah di sudut
  const saungX = -w / 2 + 0.8;
  const saungZ = -h / 2 + 0.8;
  for (const [dx, dz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 4), woodMat);
    pole.position.set(saungX + dx, 0.7, saungZ + dz);
    g.add(pole);
  }
  const saungLantai = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.8), woodMat);
  saungLantai.position.set(saungX, 0.6, saungZ);
  g.add(saungLantai);
  const saungAtap = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.55, 4), thatchMat);
  saungAtap.position.set(saungX, 1.55, saungZ);
  saungAtap.rotation.y = Math.PI / 4;
  g.add(saungAtap);

  return g;
}

// Aset 3D Peternakan Luas (Pagar Kayu Berpatok, Kandang Jerami, Palung Pakan, Hewan Jinak)
function createPeternakanLuas(w: number, h: number): THREE.Group {
  const g = new THREE.Group();
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x8a5a33 });
  const thatchMat = new THREE.MeshLambertMaterial({ color: 0xc9a86a });
  const hayMat = new THREE.MeshLambertMaterial({ color: 0xd4a373 });

  // Tanah peternakan
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, h), grassMat);
  base.position.y = 0.1;
  g.add(base);

  // Pagar kayu mengelilingi perimeter
  const step = 0.8;
  for (let x = -w / 2 + 0.2; x <= w / 2 - 0.2; x += step) {
    for (const z of [-h / 2 + 0.2, h / 2 - 0.2]) {
      if (z > 0 && Math.abs(x) < 0.6) continue; // gerbang pintu peternakan
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 5), woodMat);
      post.position.set(x, 0.55, z);
      g.add(post);
    }
  }
  for (let z = -h / 2 + 0.2; z <= h / 2 - 0.2; z += step) {
    for (const x of [-w / 2 + 0.2, w / 2 - 0.2]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 5), woodMat);
      post.position.set(x, 0.55, z);
      g.add(post);
    }
  }
  // Palang pagar horizontal
  const railN = new THREE.Mesh(new THREE.BoxGeometry(w - 0.4, 0.08, 0.06), woodMat);
  railN.position.set(0, 0.85, -h / 2 + 0.2);
  g.add(railN);
  const railW = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, h - 0.4), woodMat);
  railW.position.set(-w / 2 + 0.2, 0.85, 0);
  g.add(railW);
  const railE = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, h - 0.4), woodMat);
  railE.position.set(w / 2 - 0.2, 0.85, 0);
  g.add(railE);

  // Kandang jerami/kayu peneduh ternak di sudut utara
  const kX = w / 2 - 1.2;
  const kZ = -h / 2 + 1.2;
  const kandangDinding = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), woodMat);
  kandangDinding.position.set(kX, 0.8, kZ);
  g.add(kandangDinding);
  const kandangAtap = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.1, 4), thatchMat);
  kandangAtap.position.set(kX, 1.9, kZ);
  kandangAtap.rotation.y = Math.PI / 4;
  g.add(kandangAtap);

  // Palung pakan kayu + tumpukan jerami
  const palung = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.5), woodMat);
  palung.position.set(-0.3, 0.3, 0);
  g.add(palung);
  const jerami = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 0.35), hayMat);
  jerami.position.set(-0.3, 0.45, 0);
  g.add(jerami);

  return g;
}

// Aset 3D Perkebunan Luas (Bedengan Terawat, Pohon Buah Ranum, Rumpun Rempah Subur)
function createPerkebunanLuas(w: number, h: number): THREE.Group {
  const g = new THREE.Group();
  const soilMat = new THREE.MeshLambertMaterial({ color: 0x5a3d28 });
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4226 });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
  const fruitMat = new THREE.MeshLambertMaterial({ color: 0xd90429 });
  const rempahColors = [0x9333ea, 0x16a34a, 0xf59e0b, 0x059669];

  // Tanah bedengan
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, h), soilMat);
  base.position.y = 0.125;
  g.add(base);

  // 4 Pohon buah ranum di 4 sudut perkebunan
  const corners = [
    [-w / 2 + 1.1, -h / 2 + 1.1],
    [w / 2 - 1.1, -h / 2 + 1.1],
    [-w / 2 + 1.1, h / 2 - 1.1],
    [w / 2 - 1.1, h / 2 - 1.1],
  ];
  for (const [cx, cz] of corners) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 2.0, 6), trunkMat);
    trunk.position.set(cx, 1.0, cz);
    g.add(trunk);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 7), leafMat);
    canopy.position.set(cx, 2.3, cz);
    g.add(canopy);
    // Buah ranum merah pada dahan pohon
    for (let fb = 0; fb < 4; fb++) {
      const fa = (fb / 4) * Math.PI * 2;
      const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), fruitMat);
      fruit.position.set(cx + Math.cos(fa) * 0.75, 2.1 + (fb % 2) * 0.2, cz + Math.sin(fa) * 0.75);
      g.add(fruit);
    }
  }

  // Rumpun rempah herbal di petak tengah
  for (let rx = -w / 2 + 1.8; rx <= w / 2 - 1.8; rx += 0.8) {
    for (let rz = -h / 2 + 1.8; rz <= h / 2 - 1.8; rz += 0.8) {
      const col = rempahColors[Math.floor(Math.abs(rx * 5 + rz * 11)) % rempahColors.length];
      const herb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), new THREE.MeshLambertMaterial({ color: col }));
      herb.position.set(rx, 0.4, rz);
      g.add(herb);
    }
  }

  return g;
}

function buildBuilding(kind: string, w: number, h: number, level = 1): THREE.Group {
  // ASET 3D FANTASY VILLAGE (Level 1, 2, 3) untuk hunian / gubuk / pondok tabib
  if (kind === "gubuk" || kind === "gubuk_besar" || kind === "rumah" || kind === "pondok_tabib") {
    const effectiveLvl = kind === "gubuk_besar" ? Math.max(2, level) : level;
    const hObj = createFantasyHouse(effectiveLvl, w, h);
    if (kind === "pondok_tabib") {
      // Tanaman herbal obat di depan pondok tabib
      for (let i = 0; i < 3; i++) {
        const herb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5), new THREE.MeshLambertMaterial({ color: 0x16a34a }));
        herb.position.set(-1.0 + i * 0.45, 0.2, 1.6);
        hObj.add(herb);
      }
    }
    return hObj;
  }

  const g = new THREE.Group();
  const wood = 0x8a5a33;
  const thatch = 0xc9a86a;
  const leather = 0xb98a5e;
  if (kind === "tenda_kulit") {
    // Tenda teepee kulit kerbau purba menjulang tinggi & luas
    const tent = pyramid(Math.max(w + 0.8, h + 0.8) * 0.85, 6.2, leather, 3.1);
    tent.scale.z = 0.85;
    g.add(tent);
    // Tiang-tiang pancang kayu bersilangan di puncaknya
    for (const px of [-0.35, 0.35]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7.2, 5), new THREE.MeshLambertMaterial({ color: wood }));
      pole.position.set(px, 3.6, 0);
      pole.rotation.z = px * -0.08;
      g.add(pole);
    }
    // Pintu tenda kulit tergulung
    g.add(box(0.7, 1.8, 0.1, 0x5b3a29, 0, 0.9, (h + 0.8) / 2 - 0.1));
  } else if (kind === "api_unggun") {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), new THREE.MeshLambertMaterial({ color: 0x8d8d8d }));
      s.position.set(Math.cos(a) * 0.4, 0.1, Math.sin(a) * 0.4);
      g.add(s);
    }
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 7), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
    flame.position.y = 0.55;
    flame.name = "api";
    g.add(flame);
  } else if (kind === "lumbung") {
    // Aset 3D Fantasy Warehouse (80% Kayu, 20% Batu, Loading Dock, Hoist Crane, Shingle Roof)
    return createFantasyWarehouse(w, h);
  } else if (kind === "bengkel_batu") {
    g.add(box(w, 2.2, h, 0x8d8d8d, 0, 1.1, 0));
    g.add(box(w + 0.2, 0.15, h + 0.2, 0x6d6d6d, 0, 2.3, 0));
    g.add(box(0.5, 0.35, 0.3, 0x4a4a4a, 0.4, 2.5, 0.2));
  } else if (kind === "pagar") {
    for (let i = 0; i < 5; i++) {
      const px = -w / 2 + (i * w) / 4;
      g.add(box(0.12, 1.3, 0.12, wood, px, 0.65, 0));
    }
    g.add(box(w, 0.1, 0.08, wood, 0, 0.95, 0));
    g.add(box(w, 0.1, 0.08, wood, 0, 0.45, 0));
  } else if (kind === "rak_jemur") {
    g.add(box(0.08, 1.5, 0.08, wood, -0.5, 0.75, 0));
    g.add(box(0.08, 1.5, 0.08, wood, 0.5, 0.75, 0));
    g.add(box(1.2, 0.08, 0.08, wood, 0, 1.45, 0));
    for (let i = 0; i < 3; i++) {
      g.add(box(0.22, 0.3, 0.02, 0x92400e, -0.3 + i * 0.3, 1.2, 0.05));
    }
  } else if (kind === "lingkaran_batu") {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), new THREE.MeshLambertMaterial({ color: 0x8d8d8d }));
      s.position.set(Math.cos(a) * (w / 2), 0.3, Math.sin(a) * (h / 2));
      g.add(s);
    }
  } else if (kind === "totem") {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 3.4, 7), new THREE.MeshLambertMaterial({ color: wood }));
    pole.position.y = 1.7;
    g.add(pole);
    g.add(box(0.3, 0.2, 0.1, 0xfacc15, 0, 2.7, 0.24));
    g.add(box(0.3, 0.2, 0.1, 0xb91c1c, 0, 2.1, 0.24));
    g.add(pyramid(0.35, 0.7, 0x2e7d32, 3.7));
  } else if (kind === "ladang") {
    g.add(box(w, 0.12, h, 0x6b4226, 0, 0.06, 0));
    for (let i = 0; i < 4; i++) {
      g.add(box(w - 0.3, 0.35, 0.16, 0x2e7d32, 0, 0.24, -h / 2 + 0.35 + i * ((h - 0.6) / 3)));
    }
  } else if (kind === "kebun_rempah") {
    // RONDE 17 — kebun rempah: beda dari ladang (4 baris seragam).
    // Petak tanah + patok kayu di 4 sudut + rumpun rempah 3x3 warna
    // selang-seling (hijau tua/muda/kuning-hijau) + 2 batu kecil.
    g.add(box(w, 0.14, h, 0x5d3a1f, 0, 0.07, 0));
    for (const sx of [-1, 1])
      for (const sz of [-1, 1])
        g.add(box(0.09, 0.55, 0.09, wood, sx * (w / 2 - 0.12), 0.28, sz * (h / 2 - 0.12)));
    const rempah = [0x2e7d32, 0x66bb6a, 0x9ccc65];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        g.add(box(0.3, 0.32, 0.3, rempah[(i + j) % 3], -w / 2 + 0.45 + i * ((w - 0.9) / 2), 0.3, -h / 2 + 0.45 + j * ((h - 0.9) / 2)));
    g.add(box(0.28, 0.18, 0.22, 0x9e9e9e, w / 2 - 0.35, 0.22, -h / 2 + 0.3));
    g.add(box(0.22, 0.14, 0.2, 0xbdbdbd, -w / 2 + 0.35, 0.2, h / 2 - 0.3));
  } else if (kind === "bengkel_kayu") {
    g.add(box(w, 2.2, h, wood, 0, 1.1, 0));
    g.add(box(w + 0.2, 0.15, h + 0.2, thatch, 0, 2.3, 0));
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.1, 6), new THREE.MeshLambertMaterial({ color: 0x6b4226 }));
      log.rotation.z = Math.PI / 2;
      log.position.set(0, 0.3 + i * 0.3, h / 2 + 0.4);
      g.add(log);
    }
  } else if (kind === "jembatan") {
    // Footprint 4x1 melintasi sungai: papan + pagar sisi.
    for (let i = 0; i < 4; i++) {
      g.add(box(0.95, 0.14, 0.95, 0xa67c52, -1.5 + i, 0.18, 0));
    }
    g.add(box(4, 0.08, 0.08, wood, 0, 0.9, -0.45));
    g.add(box(4, 0.08, 0.08, wood, 0, 0.9, 0.45));
    for (const px of [-1.5, -0.5, 0.5, 1.5]) {
      g.add(box(0.08, 0.8, 0.08, wood, px, 0.55, -0.45));
      g.add(box(0.08, 0.8, 0.08, wood, px, 0.55, 0.45));
    }
  } else if (kind === "perahu") {
    const hull = box(1.9, 0.5, 0.7, wood, 0, 0.25, 0);
    hull.name = "perahu-hull";
    g.add(hull);
    g.add(box(0.3, 0.3, 0.5, 0x6b4226, -0.7, 0.55, 0));
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 5), new THREE.MeshLambertMaterial({ color: wood }));
    mast.position.set(0, 1.1, 0);
    g.add(mast);
    g.add(box(0.7, 0.5, 0.05, 0xfdf6e3, 0.2, 1.2, 0));
  } else if (kind === "gubuk_besar") {
    // Gubuk besar adat purba megah: teras panggung bertiang 6 tiang, dinding tinggi 4.4, atap pelana jerami tinggi > 9.5 unit
    const vw = w + 1.8;
    const vh = h + 1.8;
    // Lantai panggung kayu tebal
    g.add(box(vw, 0.55, vh, 0x4a2e18, 0, 0.275, 0));
    // Tangga panggung depan luas
    g.add(box(1.4, 0.28, 0.5, 0x5a3d28, 0, 0.14, vh / 2 + 0.25));
    // Dinding rumah utama
    g.add(box(vw - 0.4, 4.4, vh - 0.4, wood, 0, 0.55 + 2.2, 0));
    // 6 Pilar kayu kokoh (4 sudut + 2 serambi depan)
    for (const sx of [-vw / 2 + 0.2, 0, vw / 2 - 0.2]) {
      for (const sz of [-vh / 2 + 0.2, vh / 2 - 0.2]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 5.2, 6), new THREE.MeshLambertMaterial({ color: 0x3d2110 }));
        post.position.set(sx, 2.6, sz);
        g.add(post);
      }
    }
    // Atap pelana tumpangsari bertingkat sangat megah
    g.add(box(vw + 1.4, 0.6, vh + 1.4, thatch, 0, 0.55 + 4.4 + 0.3, 0));
    g.add(pyramid(Math.max(vw, vh) * 1.1, 4.6, thatch, 0.55 + 4.4 + 0.6 + 2.3));
    // Pintu ganda berkanopi
    g.add(box(1.2, 2.6, 0.15, 0x2e1808, 0, 0.55 + 1.3, vh / 2 - 0.18));
    g.add(box(1.8, 0.2, 0.6, thatch, 0, 0.55 + 2.8, vh / 2));
  } else if (kind === "tenda_besar") {
    // Tenda besar pimpinan suku: tenda kulit megah tinggi 8.2 unit bertiang ganda & bendera suku
    const tent = pyramid(Math.max(w + 1.2, h + 1.2) * 0.95, 7.5, leather, 3.75);
    tent.scale.z = 0.9;
    g.add(tent);
    for (const px of [-0.6, 0.6]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 8.8, 6), new THREE.MeshLambertMaterial({ color: wood }));
      pole.position.set(px, 4.4, 0);
      pole.rotation.z = px * -0.06;
      g.add(pole);
    }
    g.add(box(1.0, 2.4, 0.12, 0x4a2818, 0, 1.2, (h + 1.2) / 2 - 0.1));
  } else if (kind === "balai") {
    g.add(box(w, 0.3, h, 0x8d8d8d, 0, 0.15, 0));
    for (const [lx, lz] of [[-w / 2 + 0.2, -h / 2 + 0.2], [w / 2 - 0.2, -h / 2 + 0.2], [-w / 2 + 0.2, h / 2 - 0.2], [w / 2 - 0.2, h / 2 - 0.2]] as const) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 6), new THREE.MeshLambertMaterial({ color: wood }));
      post.position.set(lx, 1.3, lz);
      g.add(post);
    }
    g.add(box(w + 0.4, 0.2, h + 0.4, thatch, 0, 2.7, 0));
    g.add(box(w * 0.6, 0.15, h * 0.6, 0x6b4226, 0, 0.45, 0));
  } else if (kind === "dapur_umum") {
    g.add(box(w, 2.0, h, wood, 0, 1.0, 0));
    g.add(pyramid(Math.max(w, h) * 0.75, 1.6, thatch, 2.8));
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), new THREE.MeshLambertMaterial({ color: 0x4a4a4a }));
    pot.scale.y = 0.8;
    pot.position.set(0, 0.5, h / 2 + 0.4);
    g.add(pot);
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 6), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
    fire.position.set(0, 0.25, h / 2 + 0.4);
    fire.name = "api";
    g.add(fire);
  } else if (kind === "sawah_luas") {
    return createSawahLuas(w, h);
  } else if (kind === "peternakan_luas") {
    return createPeternakanLuas(w, h);
  } else if (kind === "perkebunan_luas") {
    return createPerkebunanLuas(w, h);
  } else if (kind === "paviliun_makan") {
    // Aset 3D Paviliun Rimba Nirwana (Joglo Tumpangsari, Soko Guru, Mezzanine, Kolam Refleksi)
    return createPaviliunNirwana(w, h);
  } else if (kind === "menara_jaga") {
    for (const [lx, lz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]] as const) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.4, 5), new THREE.MeshLambertMaterial({ color: wood }));
      leg.position.set(lx, 1.7, lz);
      g.add(leg);
    }
    g.add(box(1.6, 0.2, 1.6, wood, 0, 3.5, 0));
    g.add(box(1.6, 0.9, 0.1, wood, 0, 4.0, -0.75));
    g.add(box(1.6, 0.9, 0.1, wood, 0, 4.0, 0.75));
    g.add(pyramid(1.3, 1.0, thatch, 5.0));
  } else if (kind === "sumur_batu") {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.9, 10), new THREE.MeshLambertMaterial({ color: 0x8d8d8d }));
    ring.position.y = 0.45;
    g.add(ring);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 10), new THREE.MeshLambertMaterial({ color: 0x38bdf8 }));
    water.position.y = 0.8;
    g.add(water);
    for (const px of [-0.6, 0.6]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 5), new THREE.MeshLambertMaterial({ color: wood }));
      post.position.set(px, 1.2, 0);
      g.add(post);
    }
    g.add(box(1.5, 0.12, 0.5, thatch, 0, 2.0, 0));
  } else if (kind === "gapura") {
    for (const px of [-w / 2 + 0.2, w / 2 - 0.2]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.8, 6), new THREE.MeshLambertMaterial({ color: wood }));
      post.position.set(px, 1.4, 0);
      g.add(post);
    }
    g.add(box(w, 0.25, 0.3, wood, 0, 2.9, 0));
    g.add(pyramid(w * 0.4, 0.8, thatch, 3.4));
  } else {
    // pondok_tabib (default): rumah + rumpun herbal (skala sama gubuk).
    g.add(box(w, GUBUK_DINDING, h, wood, 0, GUBUK_DINDING / 2, 0));
    g.add(pyramid(Math.max(w, h) * 0.78, GUBUK_ATAP, thatch, GUBUK_DINDING + GUBUK_ATAP / 2));
    for (let i = 0; i < 3; i++) {
      const herb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), new THREE.MeshLambertMaterial({ color: 0x2e7d32 }));
      herb.position.set(-w / 2 - 0.3 + i * 0.3, 0.16, h / 2 + 0.3);
      g.add(herb);
    }
  }
  return g;
}

// Model konstruksi bertahap (seperti GIF): fondasi -> rangka -> atap.
function buildKonstruksi(kind: string, w: number, h: number, progres: number): THREE.Group {
  const g = new THREE.Group();
  const wood = 0x8a5a33;
  // Fondasi selalu ada.
  g.add(box(w, 0.18, h, 0x8d8d8d, 0, 0.09, 0));
  for (const [lx, lz] of [[-w / 2 + 0.2, -h / 2 + 0.2], [w / 2 - 0.2, -h / 2 + 0.2], [-w / 2 + 0.2, h / 2 - 0.2], [w / 2 - 0.2, h / 2 - 0.2]] as const) {
    g.add(box(0.12, 1.2, 0.12, wood, lx, 0.6, lz));
  }
  if (progres >= 35) {
    // Rangka: dinding setengah (skala rumah baru).
    g.add(box(w, 1.4, h, wood, 0, 0.7, 0));
  }
  if (progres >= 70) {
    // Atap + bentuk akhir (transparan ringan sampai selesai).
    const top = buildBuilding(kind, w, h);
    top.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        const mat = o.material as THREE.MeshLambertMaterial;
        mat.transparent = true;
        mat.opacity = 0.85;
      }
    });
    g.add(top);
  }
  return g;
}

// Warga berkaki: badan + kepala + 2 kaki (ayun bergantian) + perkakas di
// pivot bahu (dianimasikan saat bekerja). Pemburu: tombak + busur (toggle).
function buildCitizen(peran: string, nomor: string, gender?: string, opts?: { tombakIblis?: boolean }): THREE.Group {
  const g = new THREE.Group();
  // RONDE 9 — subgrup POSE: semua bagian badan di dalam pose supaya
  // tidur = pose rebah (rotasi X -90°) tanpa mengubah posisi grup di
  // ubin. Kepala/kaki/perkakas ikut rebah sebagai satu badan.
  const pose = new THREE.Group();
  g.add(pose);
  const st = ROLE_STYLE[peran] ?? { color: 0x6b7280, tool: "", label: peran };
  const bodyMat = new THREE.MeshLambertMaterial({ color: st.color });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.5, 4, 10), bodyMat);
  body.position.y = 0.95;
  pose.add(body);
  // RONDE 9 — karakter lebih bagus: ikat pinggang + mata (wajah tidak
  // lagi polos) + lengan (ayun berlawanan kaki saat jalan).
  pose.add(box(0.56, 0.12, 0.56, 0x3e2723, 0, 0.78, 0));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), new THREE.MeshLambertMaterial({ color: skinDariNomor(nomor) }));
  head.position.y = 1.55;
  pose.add(head);
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), eyeMat);
    eye.position.set(side * 0.09, 1.58, 0.22);
    pose.add(eye);
  }
  // RONDE 9 — rambut per gender: laki PENDEK (topi + poni kecil),
  // perempuan PANJANG (topi + panel belakang + 2 helai samping).
  // Gender tak dikenal -> pendek (tampilan lama).
  if (specRambut(gender).panjang) {
    pose.add(box(0.4, 0.14, 0.4, 0x2b2118, 0, 1.76, 0));
    pose.add(box(0.42, 0.75, 0.12, 0x2b2118, 0, 1.32, -0.24));
    pose.add(box(0.1, 0.6, 0.1, 0x2b2118, -0.24, 1.35, 0));
    pose.add(box(0.1, 0.6, 0.1, 0x2b2118, 0.24, 1.35, 0));
  } else {
    pose.add(box(0.38, 0.14, 0.38, 0x2b2118, 0, 1.76, 0));
    pose.add(box(0.36, 0.08, 0.1, 0x2b2118, 0, 1.68, 0.24));
  }
  // Kaki RONDE 4 — BESAR + JELAS (temuan user: ayunan lama tidak terlihat
  // di HP): kaki terpisah 0,20 tebal x 0,72 panjang (dulu 0,16 x 0,55),
  // pangkal pinggul y=0,72 (ujung kaki tepat di tanah), jarak antar kaki
  // ±0,17, + sepatu kontras di ujung kaki (anak mesh kaki, ikut berayun).
  // Ayunan 1,0 rad via sudutAyunan (dulu 0,7 rad) — gerak kaki ~0,6 unit.
  const legGeo = new THREE.BoxGeometry(0.2, 0.72, 0.2);
  legGeo.translate(0, -0.36, 0);
  const legMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
  const footGeo = new THREE.BoxGeometry(0.22, 0.12, 0.32);
  const footMat = new THREE.MeshLambertMaterial({ color: 0xc9a86a });
  const legL = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.17, 0.72, 0);
  const footL = new THREE.Mesh(footGeo, footMat);
  footL.position.set(0, -0.66, 0.06);
  legL.add(footL);
  const legR = new THREE.Mesh(legGeo, legMat);
  legR.position.set(0.17, 0.72, 0);
  const footR = new THREE.Mesh(footGeo, footMat);
  footR.position.set(0, -0.66, 0.06);
  legR.add(footR);
  pose.add(legL);
  pose.add(legR);
  // Lengan (RONDE 9): pivot di bahu, geometri ke bawah, ayun lawan kaki.
  const armGeo = new THREE.BoxGeometry(0.12, 0.62, 0.12);
  armGeo.translate(0, -0.31, 0);
  const armMat = new THREE.MeshLambertMaterial({ color: skinDariNomor(nomor) });
  const armL = new THREE.Mesh(armGeo, armMat);
  armL.position.set(-0.38, 1.28, 0);
  const armR = new THREE.Mesh(armGeo, armMat);
  armR.position.set(0.38, 1.28, 0);
  pose.add(armL);
  pose.add(armR);
  // Pivot perkakas di bahu kanan.
  const toolPivot = new THREE.Group();
  toolPivot.position.set(0.42, 1.0, 0.1);
  pose.add(toolPivot);
  const stickMat = new THREE.MeshLambertMaterial({ color: 0x6b4226 });
  const mk = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return m;
  };
  let toolKind = st.tool;
  let tombakIblisGroup: THREE.Group | null = null;
  if (opts?.tombakIblis) {
    // RONDE 14 — TOMBAK IBLIS FIGO: model verbatim dari aset user
    // (tombakIblis.ts, kode r128 apa adanya + shim senjataIblis.ts).
    // Skala 0,42 + angkat 0,55 + miring 0,12: ujung bilah ~2,68 (di atas
    // kepala 1,81), pommel ~0,15 di atas tanah — dramatis tapi tidak
    // tenggelam. Hanya untuk pemilik tombak_iblis (Figo); warga lain
    // (termasuk kepala_suku lain bila ada) tetap pakai perkakas peran.
    const spear = buatTombakIblis();
    spear.scale.setScalar(0.42);
    spear.position.set(0, 0.55, 0);
    spear.rotation.z = 0.12;
    toolPivot.add(spear);
    tombakIblisGroup = spear;
    toolKind = "tombak_iblis";
  } else if (st.tool === "tombak") {
    const s = mk(new THREE.CylinderGeometry(0.045, 0.045, 1.6, 5), stickMat, 0, 0.1, 0);
    s.rotation.z = 0.2;
    toolPivot.add(s);
    const tip = mk(new THREE.ConeGeometry(0.09, 0.3, 6), new THREE.MeshLambertMaterial({ color: 0x9ca3af }), 0.05, 0.95, 0);
    toolPivot.add(tip);
  } else if (st.tool === "kapak" || st.tool === "beliung" || st.tool === "palu") {
    const s = mk(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 5), stickMat, 0, 0, 0);
    s.rotation.z = 0.3;
    toolPivot.add(s);
    toolPivot.add(box(0.34, 0.16, 0.16, st.tool === "palu" ? 0x6b7280 : 0x9ca3af, 0.12, 0.32, 0));
  } else if (st.tool === "keranjang") {
    toolPivot.add(box(0.4, 0.28, 0.4, 0xc9a86a, 0, -0.35, 0.05));
  } else if (st.tool === "tongkat" || st.tool === "tongkat_suku") {
    const s = mk(new THREE.CylinderGeometry(0.045, 0.045, 1.5, 5), stickMat, 0, 0.1, 0);
    toolPivot.add(s);
    if (st.tool === "tongkat_suku") {
      const feather = mk(new THREE.ConeGeometry(0.13, 0.5, 6), new THREE.MeshLambertMaterial({ color: 0xfacc15 }), 0, 0.95, 0);
      toolPivot.add(feather);
    }
  } else if (st.tool === "obor") {
    const s = mk(new THREE.CylinderGeometry(0.045, 0.045, 0.9, 5), stickMat, 0, 0, 0);
    toolPivot.add(s);
    const api = mk(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff7a1a }), 0, 0.55, 0);
    api.name = "api-alat";
    toolPivot.add(api);
  } else if (st.tool === "lumpang") {
    toolPivot.add(box(0.36, 0.24, 0.36, 0x8d8d8d, 0, -0.3, 0.05));
  } else if (st.tool === "periuk") {
    const pot = mk(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshLambertMaterial({ color: 0xa67c52 }), 0, -0.3, 0.05);
    pot.scale.y = 0.8;
    toolPivot.add(pot);
  } else if (st.tool === "jala") {
    const s = mk(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 5), stickMat, 0, 0, 0);
    s.rotation.z = 0.3;
    toolPivot.add(s);
    const net = mk(new THREE.TorusGeometry(0.3, 0.04, 5, 14), new THREE.MeshLambertMaterial({ color: 0xd9c8a9 }), 0.28, 0.55, 0);
    toolPivot.add(net);
  } else if (st.tool === "cangkul") {
    const s = mk(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 5), stickMat, 0, 0, 0);
    s.rotation.z = 0.3;
    toolPivot.add(s);
    toolPivot.add(box(0.3, 0.22, 0.08, 0x6b7280, 0.22, -0.42, 0));
  } else if (st.tool === "pahat") {
    const s = mk(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 5), stickMat, 0, 0.1, 0);
    s.rotation.z = 0.2;
    toolPivot.add(s);
    toolPivot.add(box(0.1, 0.22, 0.1, 0x9ca3af, 0.06, 0.42, 0));
  } else if (st.tool === "tongkat_jalan") {
    const s = mk(new THREE.CylinderGeometry(0.045, 0.045, 1.5, 5), stickMat, 0, 0.1, 0);
    toolPivot.add(s);
  } else if (st.tool === "tali_panjat") {
    const coil = mk(new THREE.TorusGeometry(0.18, 0.05, 5, 12), new THREE.MeshLambertMaterial({ color: 0xd9c8a9 }), 0, -0.3, 0.05);
    toolPivot.add(coil);
  } else if (st.tool === "alat_tenun") {
    toolPivot.add(box(0.5, 0.08, 0.3, 0x6b4226, 0, -0.3, 0.05));
    toolPivot.add(box(0.08, 0.4, 0.08, 0x6b4226, -0.22, -0.3, 0.05));
    toolPivot.add(box(0.08, 0.4, 0.08, 0x6b4226, 0.22, -0.3, 0.05));
  } else if (st.tool === "jerat") {
    const loop = mk(new THREE.TorusGeometry(0.22, 0.04, 5, 12), new THREE.MeshLambertMaterial({ color: 0xd9c8a9 }), 0, 0.1, 0);
    toolPivot.add(loop);
    const s = mk(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5), stickMat, 0, -0.3, 0);
    s.rotation.z = 0.5;
    toolPivot.add(s);
  }
  // Busur pemburu (disembunyikan kecuali sedang berburu).
  let busur: THREE.Group | null = null;
  if (peran === "pemburu") {
    busur = new THREE.Group();
    busur.position.set(0.42, 1.0, 0.1);
    const curve = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 6, 16, Math.PI), new THREE.MeshLambertMaterial({ color: 0x6b4226 }));
    curve.rotation.z = Math.PI / 2;
    busur.add(curve);
    busur.visible = false;
    pose.add(busur);
  }
  // Bungkusan daging yang dibawa pulang (RONDE 10): di punggung,
  // terlihat HANYA bila membawa_daging (diatur loop render).
  const dagingBawa = box(0.42, 0.24, 0.34, 0x7f1d1d, 0, 1.0, -0.35);
  dagingBawa.visible = false;
  pose.add(dagingBawa);
  g.userData = { legL, legR, head, body, toolPivot, toolKind, busur, pose, armL, armR, dagingBawa, tombakIblis: tombakIblisGroup };
  return g;
}

const HEWAN_STYLE: Record<string, { color: number; scale: number; label: string }> = {
  rusa: { color: 0x8a5a33, scale: 1, label: "Rusa" },
  kelinci: { color: 0xd9c8a9, scale: 0.5, label: "Kelinci" },
  ayam: { color: 0xf5f0e1, scale: 0.55, label: "Ayam Hutan" },
  babi_hutan: { color: 0x5b4636, scale: 0.9, label: "Babi Hutan" },
  serigala: { color: 0x6b7280, scale: 0.95, label: "Serigala" },
  beruang: { color: 0x3f2d20, scale: 1.4, label: "Beruang" },
};

function buildAnimal(jenis: string): THREE.Group {
  const g = new THREE.Group();
  const st = HEWAN_STYLE[jenis] ?? { color: 0x6b7280, scale: 1, label: jenis };
  const s = st.scale;
  const mat = new THREE.MeshLambertMaterial({ color: st.color });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42 * s, 10, 8), mat);
  body.scale.set(1.3, 0.85, 0.85);
  body.position.y = 0.5 * s;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 8, 6), mat);
  head.position.set(0.55 * s, 0.72 * s, 0);
  g.add(head);
  const headBaseY = 0.72 * s;
  // Kaki terpisah + disimpan di userData (ronde 3/4: animasi hewan).
  // Pasangan diagonal: depanKiri+belakangKanan vs depanKanan+belakangKiri.
  const legGeo = new THREE.BoxGeometry(0.1 * s, 0.45 * s, 0.1 * s);
  legGeo.translate(0, -0.225 * s, 0);
  const kaki: Record<string, THREE.Mesh> = {};
  for (const [key, lx, lz] of [
    ["depanKiri", 0.3, -0.2],
    ["depanKanan", 0.3, 0.2],
    ["belakangKiri", -0.3, -0.2],
    ["belakangKanan", -0.3, 0.2],
  ] as const) {
    const leg = new THREE.Mesh(legGeo, new THREE.MeshLambertMaterial({ color: 0x3e2723 }));
    leg.position.set(lx * s, 0.45 * s, lz * s);
    g.add(leg);
    kaki[key] = leg;
  }
  let tail: THREE.Mesh | null = null;
  if (jenis === "rusa") {
    for (const side of [-1, 1]) {
      const ant = new THREE.Mesh(new THREE.ConeGeometry(0.05 * s, 0.4 * s, 5), new THREE.MeshLambertMaterial({ color: 0xd9c8a9 }));
      ant.position.set(0.55 * s, 1.05 * s, side * 0.12 * s);
      g.add(ant);
    }
  } else if (jenis === "kelinci") {
    for (const side of [-1, 1]) {
      const ear = box(0.08 * s, 0.35 * s, 0.08 * s, st.color, 0.5 * s, 1.0 * s, side * 0.1 * s);
      g.add(ear);
    }
  } else if (jenis === "ayam") {
    const comb = box(0.08 * s, 0.14 * s, 0.08 * s, 0xb91c1c, 0.55 * s, 0.95 * s, 0);
    g.add(comb);
  } else if (jenis === "babi_hutan") {
    g.add(box(0.2 * s, 0.16 * s, 0.2 * s, 0xd9a066, 0.78 * s, 0.62 * s, 0));
  } else if (jenis === "serigala") {
    tail = box(0.4 * s, 0.1 * s, 0.1 * s, st.color, -0.6 * s, 0.55 * s, 0);
    tail.rotation.z = 0.4;
    g.add(tail);
  }
  g.userData = { kaki, head, headBaseY, tail, body, bodyBaseScaleY: 0.85 };
  return g;
}

export default function Map3D({ map, selectedId, onSelectTile, followId, onTapWarga, onLepasKunci, onTapBangunan, gameFase, cuaca = "cerah", jamTotal, onResourceHarvested, roadLevel = 1, labelTampil = true }: Props) {
  const onResourceHarvestedRef = useRef(onResourceHarvested);
  onResourceHarvestedRef.current = onResourceHarvested;
  const roadLevelRef = useRef(roadLevel);
  roadLevelRef.current = roadLevel;
  const labelTampilRef = useRef(labelTampil);
  labelTampilRef.current = labelTampil;
  const wrapRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<J | null>(map);
  mapRef.current = map;
  const selectedRef = useRef<string | null>(selectedId);
  selectedRef.current = selectedId;
  const followRef = useRef<string | null>(followId);
  followRef.current = followId;
  const onSelectRef = useRef(onSelectTile);
  onSelectRef.current = onSelectTile;
  const onTapWargaRef = useRef(onTapWarga);
  onTapWargaRef.current = onTapWarga;
  const onLepasKunciRef = useRef(onLepasKunci);
  onLepasKunciRef.current = onLepasKunci;
  // Analog kamera (permintaan user 2026-11-04, ganti D-pad): tongkat
  // analog di dalam wrap menggeser target kamera. Kamera + kontrol
  // disimpan di ref saat dibuat di effect, supaya handler JSX bisa pakai.
  const panRef = useRef<{ kamera: any; kontrol: any; batalAnimasi: () => void } | null>(null);
  const analogIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const zoomIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analogRef = useRef<{ nx: number; ny: number }>({ nx: 0, ny: 0 });
  const analogSeretRef = useRef(false);
  const analogDasarRef = useRef<HTMLDivElement | null>(null);
  const analogKnopRef = useRef<HTMLDivElement | null>(null);
  const [analogTampil, setAnalogTampil] = useState(true);
  const onTapBangunanRef = useRef(onTapBangunan);
  onTapBangunanRef.current = onTapBangunan;
  const faseRef = useRef(gameFase);
  faseRef.current = gameFase;
  const jamRef = useRef(jamTotal);
  jamRef.current = jamTotal;

  // Setting label karakter (2026-11-04): container display none membuat
  // browser melewatkan layout/paint seluruh label (nama, dialog, aksi,
  // HP) — ini penghematan utamanya di HP. Loop frame juga melewatkan
  // update posisi label bila disembunyikan (lihat labelTampilRef).
  useEffect(() => {
    const el = labelsRef.current;
    if (el) el.style.display = labelTampil ? "" : "none";
  }, [labelTampil]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const labelsEl = labelsRef.current;
    if (!wrap || !labelsEl) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfe3f5);
    scene.fog = new THREE.Fog(0xbfe3f5, 340, 900); // RONDE 11: jauh 900 (map 600 terlihat dari zoom-out 520).

    const camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / Math.max(wrap.clientHeight, 1), 0.1, 1200);
    camera.position.set(0, 130, 130);

    const controls = new MapControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    // RONDE 11 — kamera lebih enak (keluhan user: "susah geser"):
    // damping 0,10 (luncur halus), pan 1,2 (map 600 butuh geser sedikit
    // lebih jauh), rotate 0,6 (orbit tidak mabuk), zoom-out sampai 520
    // (map 3x lipat bisa dilihat lebih luas). Skema dasar TETAP: 1 jari /
    // klik-kiri = PAN, pinch/wheel = zoom, 2 jari / klik-kanan = rotate.
    controls.dampingFactor = 0.1;
    controls.panSpeed = 1.2;
    controls.rotateSpeed = 0.6;
    controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
    controls.screenSpacePanning = true;
    // Zoom SANGAT dekat diizinkan (sampai karakter terlihat jelas besar):
    // jarak minimal 4 (orang ~1,83 unit mengisi ~40% tinggi layar).
    controls.minDistance = 4;
    controls.maxDistance = 520;
    // RONDE 11 — geser = ambil alih: saat user MULAI menggeser (PAN),
    // kunci kamera dilepas dengan lembut (bukan dilawan follow-lerp).
    // OrbitControls.state (three 0.187): PAN = 2, TOUCH_PAN = 4; bila
    // state tidak terbaca, lepas kunci untuk semua gestur (aman).
    controls.addEventListener("start", () => {
      const st = (controls as unknown as { state?: number }).state;
      const isPan = st === undefined || st === 2 || st === 4;
      if (isPan && followRef.current) onLepasKunciRef.current?.();
    });
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minPolarAngle = Math.PI * 0.1;
    controls.update();

    const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x5d7a4a, 1.0);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2d9, 1.4);
    sun.position.set(40, 80, 20);
    scene.add(sun);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
    moon.position.set(-80, 140, -120);
    moon.visible = false;
    scene.add(moon);
    // Bintang (murah: satu Points, hanya terlihat malam).
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      const a = rnd(i, 5) * Math.PI * 2;
      const e = 0.3 + rnd(i, 6) * 1.1;
      const r = 320;
      starPos[i * 3] = Math.cos(a) * Math.cos(e) * r;
      starPos[i * 3 + 1] = Math.sin(e) * r;
      starPos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false }));
    stars.visible = false;
    scene.add(stars);

    // Awan melayang (POLISH ronde 5): 6 gumpalan prosedural melayang
    // pelan melintasi langit — langit tidak lagi statis. Lambert agar
    // ikut redup saat malam. Raycast dimatikan (tap warga hanya raycast
    // wargaGroup, tapi tetap aman dari tabrakan).
    const clouds: THREE.Group[] = [];
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Group();
      const n = 3 + Math.floor(rnd(i, 11) * 3);
      for (let j = 0; j < n; j++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(3 + rnd(i * 10 + j, 12) * 3, 10, 8), cloudMat);
        s.position.set(j * 4 - n * 2, rnd(i * 10 + j, 13) * 1.2, rnd(i * 10 + j, 14) * 2);
        s.scale.y = 0.45;
        s.raycast = () => {};
        c.add(s);
      }
      c.position.set(rnd(i, 15) * 240 - 120, 30 + rnd(i, 16) * 12, rnd(i, 17) * 200 - 100);
      c.userData.speed = 0.4 + rnd(i, 18) * 0.5;
      scene.add(c);
      clouds.push(c);
    }

    const riverTex = riverTexture();
    let terrain: THREE.Mesh | null = null;
    let river: THREE.Mesh | null = null;
    let nodesGroup: THREE.Group | null = null;
    let gunungGroup: THREE.Group | null = null;
    let buildingsGroup = new THREE.Group();
    scene.add(buildingsGroup);
    let konstruksiGroup = new THREE.Group();
    scene.add(konstruksiGroup);
    const wargaGroup = new THREE.Group();
    scene.add(wargaGroup);
    const hewanGroup = new THREE.Group();
    scene.add(hewanGroup);
    let fireGroup = new THREE.Group();
    scene.add(fireGroup);
    // LENTERA RESTORAN (2026-11-03): cahaya hangat di sekitar paviliun.
    let lenteraGroup = new THREE.Group();
    scene.add(lenteraGroup);
    let boats: THREE.Group[] = [];
    // RONDE 20 — IKAN SUNGAI: 8 ikan deterministik berenang bolak-balik
    // di alur sungai (kerucut pipih oranye, menghadap arah renang).
    // Jumlah yang tampak = min(stok ikan, 8); sungai sepi = tak terlihat.
    const fishGroup = new THREE.Group();
    scene.add(fishGroup);
    const fishGeo = new THREE.ConeGeometry(0.14, 0.5, 6);
    fishGeo.rotateX(Math.PI / 2); // kerucut menghadap +z (arah renang)
    const fishMat = new THREE.MeshLambertMaterial({ color: 0xff9f43 });
    const fishes: { mesh: THREE.Mesh; offset: number; speed: number }[] = [];
    for (let fi = 0; fi < 8; fi++) {
      const fm = new THREE.Mesh(fishGeo, fishMat);
      fm.visible = false;
      fishGroup.add(fm);
      fishes.push({ mesh: fm, offset: (fi % 3) * 0.8 - 0.8, speed: 1.2 + (fi % 4) * 0.5 });
    }

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 0.95, 24),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    ring.visible = false;
    scene.add(ring);

    const wargaMap = new Map<
      string,
      { group: THREE.Group; label: HTMLDivElement; bar: HTMLDivElement; hpWrap: HTMLDivElement; hpFill: HTMLDivElement; actionWrap: HTMLDivElement; actionText: HTMLSpanElement; actionFill: HTMLDivElement; bubble: HTMLDivElement; pips: HTMLDivElement; pipSpans: HTMLSpanElement[]; dx: number; dz: number; tx: number; tz: number; ux: number; uz: number; goal: TujuanTerkunci; speedPerSec: number; data: J; idx: number; cycle: number; pace: number; lastChip: number; lastShot: number; lastPip: number; progShown: number; progStart: number; progTarget: number; progT0: number; jalur?: { x: number; z: number }[]; jalurKey?: string; lastActionCycle?: number; actionT0?: number; actionActiveKind?: string }
    >();
    // RONDE 10: daging tergeletak + hewan jatuh + proyektil + serpihan.
    const dagingMap = new Map<string, THREE.Mesh>();
    const fallingAnimals: { group: THREE.Group; t0: number }[] = [];
    // RONDE 15 — node tumbang/hancur: mesh sementara untuk ubin node
    // yang hilang dari payload (bukan lenyap instan).
    const fallingNodes: { group: THREE.Group; t0: number; kind: string }[] = [];
    type Proyektil = { mesh: THREE.Group; t0: number; from: THREE.Vector3; to: THREE.Vector3 };
    const proyektils: Proyektil[] = [];
    // RONDE 12 — serangan hewan buas: lunge + goyang warga (visual).
    // Sim "diserang" + kabur sudah ada sejak lama, tapi hewan tidak
    // pernah TERLIHAT menyerang (hanya bubble "Tolong!"). Lunge =
    // hewan buas terdekat (label cocok) menerjang ke arah warga lalu
    // kembali, 0,9 detik, + goyang warga; ulang tiap 5 detik selama
    // jendela interaksi aktif (sama dengan jendela bubble).
    const lungeAktif = new Map<string, { hewanId: string; t0: number }>();
    const lungeSelesai = new Map<string, number>();
    type Chip = { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number };
    const chips: Chip[] = [];
    for (let ci = 0; ci < 40; ci++) {
      const cm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), new THREE.MeshLambertMaterial({ color: 0x6b4226 }));
      cm.visible = false;
      scene.add(cm);
      chips.push({ mesh: cm, vx: 0, vy: 0, vz: 0, life: 0 });
    }
    const hewanMap = new Map<
      string,
      { group: THREE.Group; label: HTMLDivElement; hpBar: HTMLDivElement; hpFill: HTMLDivElement; dx: number; dz: number; tx: number; tz: number; speedPerSec: number; pace: number; id: string; jenis: string; cycle: number; hp: number; hpMax: number; jalur?: { x: number; z: number }[]; jalurKey?: string }
    >();
    const konstruksiLabels = new Map<string, HTMLDivElement>();
    let terrainSig = "";
    let nodeSig = "";
    let riverSig = "";
    let gunungSig = "";
    // RONDE 15 — ubin node payload sebelumnya (tile -> kind) untuk
    // deteksi node yang hilang (tumbang) tiap sync, independen dari
    // nodeSig (sig bisa sama bila 1 node hilang + 1 node lain muncul).
    let prevNodeKind = new Map<string, string>();
    let placeSig = "";
    // Jalur display memutar bangunan (2026-11-04): footprint bangunan
    // + lingkaran gunung sebagai rintangan display — display tidak lagi
    // jalan lurus menembus rumah menuju tujuan server.
    let rintanganTampil = new Set<string>();
    let gunungTampil: { cx: number; cy: number; r: number }[] = [];
    let gridTampil = { gw: 200, gh: 200, gmin: 0 };
    let konstruksiSig = "";
    let jalanSig = "";
    let jalanGroup = new THREE.Group();
    let jalanGeo: THREE.BufferGeometry | null = null;
    let jalanMat: THREE.Material | null = null;
    let modeApplied: ModeCahaya | null = null;
    // Bingkai kampung sekali saat load (POLISH ronde 5): kamera ease
    // ke pusat bangunan agar warga terbaca + jalannya kelihatan di
    // zoom normal HP. Hanya sebelum interaksi user, sekali saja —
    // sentuhan/roda mouse/follow membatalkannya, tidak pernah melawan
    // input user.
    let framedOnce = false;
    let userTouched = false;
    let frameAnim: { t: number; fromT: THREE.Vector3; toT: THREE.Vector3; fromP: THREE.Vector3; toP: THREE.Vector3 } | null = null;
    // Analog: pegangan kamera + kontrol + pembatal animasi bingkai awal
    // (closure menangkap binding frameAnim, jadi batalAnimasi() yang
    // dipanggil belakangan tetap membatalkan animasi yang sedang jalan).
    panRef.current = { kamera: camera, kontrol: controls, batalAnimasi: () => { frameAnim = null; } };
    // RONDE 11: dunia berpusat di PUSAT grid (min + w/2 = 100, SAMA
    // seperti era 200x200) — koordinat dunia ubin lama TIDAK BERGESER.
    const toWorld = (gx: number, gy: number, gw: number, gh: number, gmin = 0) => ({ x: gx - (gmin + gw / 2) + 0.5, z: gy - (gmin + gh / 2) + 0.5 });

    // r36: lewati material bersama (cache villageMats/roadMats) —
    // material itu dipakai ulang rebuild berikutnya, jadi membuangnya
    // di sini hanya memaksa unggah ulang shader/program yang sama.
    // Geometri tetap dibuang (dibuat per build, bukan cache bersama),
    // dan cleanup unmount di akhir komponen tetap membuang semua.
    const disposeGroup = (gr: THREE.Group) => {
      gr.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.InstancedMesh) {
          o.geometry.dispose();
          const mat = o.material as THREE.Material | THREE.Material[];
          const mats = Array.isArray(mat) ? mat : [mat];
          mats.forEach((x) => {
            if (!isVillageMaterial(x) && !isRoadMaterial(x)) x.dispose();
          });
        }
      });
    };

    const syncStatic = () => {
      const m = mapRef.current;
      if (!m) return;
      const gw = Number(m.grid?.w ?? 200);
      const gh = Number(m.grid?.h ?? 200);
      const gmin = Number(m.grid?.min ?? 0);
      const cx = gmin + gw / 2;
      const cy = gmin + gh / 2;
      gridTampil = { gw, gh, gmin };
      const tSig = `${gw}x${gh}`;
      if (tSig !== terrainSig) {
        terrainSig = tSig;
        if (terrain) {
          scene.remove(terrain);
          terrain.geometry.dispose();
          (terrain.material as THREE.Material).dispose();
        }
        terrain = terrainMesh(gw, gh);
        scene.add(terrain);
      }
      const rSig = `${(m.riverXs ?? []).length}:${(m.riverXs ?? [])[0]}:${(m.riverXs ?? [])[(m.riverXs ?? []).length - 1]}`;
      if (rSig !== riverSig) {
        riverSig = rSig;
        if (river) {
          scene.remove(river);
          river.geometry.dispose();
          (river.material as THREE.Material).dispose();
          river = null;
        }
        river = riverMesh(m.riverXs ?? [], cx, gmin, riverTex);
        scene.add(river);
      }
      const sig = `${(m.nodes ?? []).length}:${(m.nodes ?? []).map((n: J) => n.kind).join("")}`;
      // RONDE 15 — node tumbang: ubin yang ADA di sync lalu HILANG di
      // sync ini (bukan diganti node lain di ubin sama) -> mesh jatuh /
      // hancur sementara 1,5 detik. Dijalankan tiap sync (bukan hanya
      // saat sig berubah) supaya tumbang tidak terlewat.
      {
        const kindNow = new Map<string, string>();
        for (const n of (m.nodes ?? [])) kindNow.set(`${(n as J).gx},${(n as J).gy}`, String((n as J).kind));
        if (prevNodeKind.size > 0) {
          for (const [tile, kindLama] of prevNodeKind) {
            if (kindNow.has(tile)) continue;
            const [gx, gy] = tile.split(",").map(Number);
            const tw = toWorld(gx, gy, gw, gh, gmin);
            const grp = buildFallingNode(kindLama);
            if (grp) {
              grp.position.set(tw.x, 0, tw.z);
              scene.add(grp);
              fallingNodes.push({ group: grp, t0: performance.now(), kind: kindLama });
            }
          }
        }
        prevNodeKind = kindNow;
      }
      if (sig !== nodeSig) {
        nodeSig = sig;
        if (nodesGroup) {
          scene.remove(nodesGroup);
          disposeGroup(nodesGroup);
          nodesGroup = null;
        }
        nodesGroup = nodeMeshes(m.nodes ?? [], cx);
        scene.add(nodesGroup);
      }
      const gSig = (m.gunung ?? []).map((g: J) => `${g.cx},${g.cy},${g.r}`).join("|");
      if (gSig !== gunungSig) {
        gunungSig = gSig;
        gunungTampil = (m.gunung ?? []).map((g: J) => ({ cx: Number(g.cx), cy: Number(g.cy), r: Number(g.r) }));
        if (gunungGroup) {
          scene.remove(gunungGroup);
          disposeGroup(gunungGroup);
          gunungGroup = null;
        }
        gunungGroup = gunungMeshes(m.gunung ?? [], cx);
        scene.add(gunungGroup);
      }
      const pSig = (m.placements ?? []).map((p: J) => `${p.kind}:${p.gx},${p.gy},${p.w},${p.h}:${p.level ?? 1}:${p.rotasi ?? 0}`).join("|");
      if (pSig !== placeSig) {
        placeSig = pSig;
        const rint = new Set<string>();
        for (const p of m.placements ?? []) {
          const w = Number(p.w ?? 1);
          const h = Number(p.h ?? 1);
          for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) rint.add(`${p.gx + dx},${p.gy + dy}`);
        }
        rintanganTampil = rint;
        const next = new THREE.Group();
        const nextBoats: THREE.Group[] = [];
        const nextFire = new THREE.Group();
        const nextLentera = new THREE.Group();
        for (const p of m.placements ?? []) {
          const kind = String(p.kind);
          const w = Number(p.w ?? 1);
          const h = Number(p.h ?? 1);
          const lvl = Number(p.level ?? 1);
          const rot = Number(p.rotasi ?? 0);
          const b = buildBuilding(kind, w, h, lvl);
          // RONDE 12 — tap bangunan: identitas placement di userData
          // supaya raycast mesh (bukan tanah) tahu bangunan apa yang
          // diketuk — model tinggi seperti gudang tidak akurat bila
          // dipetakan lewat titik tanah di belakangnya.
          b.userData.placement = { id: String(p.id), kind, gx: Number(p.gx), gy: Number(p.gy), level: lvl };
          b.position.set(p.gx + w / 2 - cx, 0, p.gy + h / 2 - cy);
          if (rot) b.rotation.y = rot;
          next.add(b);
          if (kind === "perahu") nextBoats.push(b);
          if (kind === "api_unggun" && nextFire.children.length < 6) {
            const light = new THREE.PointLight(0xff7a1a, 0, 14, 2);
            light.position.set(p.gx + 0.5 - cx, 1.2, p.gy + 0.5 - cy);
            nextFire.add(light);
          }
          // LENTERA SEKITAR RESTORAN (2026-11-03): cahaya hangat di
          // sudut paviliun, menyala malam seperti api unggun.
          if (kind === "paviliun_makan") {
            const sudut: [number, number][] = [
              [p.gx + 0.5, p.gy + 0.5],
              [p.gx + w - 0.5, p.gy + 0.5],
              [p.gx + w / 2, p.gy + h - 0.5],
            ];
            for (const [lx, lz] of sudut) {
              const light = new THREE.PointLight(0xffa033, 0, 10, 2);
              light.position.set(lx - cx, 1.5, lz - cy);
              nextLentera.add(light);
            }
          }
        }
        scene.remove(buildingsGroup);
        disposeGroup(buildingsGroup);
        buildingsGroup = next;
        scene.add(buildingsGroup);
        scene.remove(fireGroup);
        fireGroup = nextFire;
        scene.add(fireGroup);
        scene.remove(lenteraGroup);
        lenteraGroup = nextLentera;
        scene.add(lenteraGroup);
        boats = nextBoats;
      }
      // ASET 3D MODULAR ROAD (Level 1, 2, 3) + AUTO-ADAPT CONNECTION PIECE
      const curRoadLvl = roadLevelRef.current ?? 1;
      const jSig = `${curRoadLvl}:` + (m.jalan ?? []).map((j: J) => `${j.gx},${j.gy}`).join("|");
      if (jSig !== jalanSig) {
        jalanSig = jSig;
        scene.remove(jalanGroup);
        disposeGroup(jalanGroup);
        jalanGroup = new THREE.Group();
        const roadSet = new Set<string>((m.jalan ?? []).map((j: J) => `${j.gx},${j.gy}`));
        for (const j of m.jalan ?? []) {
          const gx = Number(j.gx);
          const gy = Number(j.gy);
          const piece = determineRoadPiece(gx, gy, roadSet);
          const tileMesh = createModularRoadTile(piece.type, curRoadLvl);
          tileMesh.rotation.y = piece.rotationY;
          tileMesh.position.set(gx + 0.5 - cx, 0.02, gy + 0.5 - cy);
          jalanGroup.add(tileMesh);
        }
        scene.add(jalanGroup);
      }
      const kSig = (m.konstruksi ?? []).map((k: J) => `${k.id}:${k.tipe}:${k.progres}`).join("|");
      if (kSig !== konstruksiSig) {
        konstruksiSig = kSig;
        const next = new THREE.Group();
        const seenK = new Set<string>();
        for (const k of m.konstruksi ?? []) {
          const id = String(k.id);
          seenK.add(id);
          const w = Number(k.w ?? 2);
          const h = Number(k.h ?? 2);
          const b = buildKonstruksi(String(k.tipe), w, h, Number(k.progres ?? 0));
          b.position.set(Number(k.gx) + w / 2 - cx, 0, Number(k.gy) + h / 2 - cy);
          // Pekerja di lokasi (visual): perajin dengan palu berayun.
          // Posisi LOKAL relatif ke pusat plot (grup b sudah di pusat plot).
          const worker = buildCitizen("perajin", "0000");
          worker.scale.setScalar(0.85);
          worker.position.set(w / 2 + 0.8, 0, 0);
          worker.userData.isWorker = true;
          b.add(worker);
          next.add(b);
          let lbl = konstruksiLabels.get(id);
          if (!lbl) {
            lbl = document.createElement("div");
            lbl.className = "map3d-label";
            labelsEl.appendChild(lbl);
            konstruksiLabels.set(id, lbl);
          }
          lbl.textContent = `${String(k.tipe)} ${Number(k.progres ?? 0)}%`;
          (lbl as any)._pos = { x: Number(k.gx) + w / 2 - cx, z: Number(k.gy) + h / 2 - cy };
          if (k.pembangun_nama) lbl.title = `Pembangun: ${k.pembangun_nama}`;
        }
        scene.remove(konstruksiGroup);
        disposeGroup(konstruksiGroup);
        konstruksiGroup = next;
        scene.add(konstruksiGroup);
        for (const [id, lbl] of [...konstruksiLabels]) {
          if (!seenK.has(id)) {
            lbl.remove();
            konstruksiLabels.delete(id);
          }
        }
      }
    };

    const syncWarga = () => {
      const m = mapRef.current;
      if (!m) return;
      const gw = Number(m.grid?.w ?? 200);
      const gh = Number(m.grid?.h ?? 200);
      const gmin = Number(m.grid?.min ?? 0);
      const seen = new Set<string>();
      (m.warga ?? []).forEach((w: J, idx: number) => {
        seen.add(String(w.id));
        const tw = toWorld(Number(w.gx), Number(w.gy), gw, gh, gmin);
        const cur = wargaMap.get(String(w.id));
        if (cur) {
          // RONDE 5: tujuan + laju server untuk pacing trayektori
          // kontinyu (display berjalan menuju tujuan dengan laju server,
          // bukan burst ke posisi server lalu diam menunggu update).
          const jump = Math.hypot(tw.x - cur.tx, tw.z - cur.tz);
          if (jump > 0.01) cur.pace = paceTampil(jump);
          cur.tx = tw.x;
          cur.tz = tw.z;
          const tj = (w as any).tujuan as { gx?: number; gy?: number } | null | undefined;
          // RONDE 8 — kunci tujuan: display mengejar goal TERKUNCI, bukan
          // mentah-mentah tujuan server tiap sync. Goal hanya berpindah
          // bila server benar-benar mengubah tujuan/fase (lihat tampil.ts:
          // kunciTujuan) — warga yang sudah tiba DIAM sampai ada tujuan
          // baru yang sah, tanpa goyang. ux/uz tetap disimpan sebagai
          // kebenaran server (bukan yang dikejar).
          let ux = cur.tx;
          let uz = cur.tz;
          if (tj && typeof tj.gx === "number" && typeof tj.gy === "number") {
            const tww = toWorld(tj.gx, tj.gy, gw, gh, gmin);
            ux = tww.x;
            uz = tww.z;
          }
          cur.ux = ux;
          cur.uz = uz;
          const kunci = kunciTujuanBaru(
            tj && typeof tj.gx === "number" && typeof tj.gy === "number" ? { gx: tj.gx, gy: tj.gy } : null,
            String((w as any).fase_siklus ?? ""),
            { x: tw.x, z: tw.z },
            { x: ux, z: uz },
          );
          cur.goal = kunciTujuan(cur.goal, kunci.goal, kunci.key);
          // RONDE 9: laju display ikut durasi jam (malam 6 detik -> 10x).
          const durasiDetik = durasiJamMs(jamRef.current % 24) / 1000;
          cur.speedPerSec = typeof (w as any).kecepatan === "number" && (w as any).kecepatan > 0 ? lajuServerPerDetik((w as any).kecepatan, durasiDetik) : cur.pace;
          cur.data = w;
          // RONDE 15 — jendela interpolasi progres kumpul: server hanya
          // mengubah progres tiap tick jam; display menghaluskannya
          // sepanjang jam supaya pip pentung terisi satu per satu
          // (~6 detik/pip), bukan loncat 0->4->9->10 tiap tick.
          const progSrv = Number((w as any).progres_aksi_pct ?? 0);
          if (progSrv !== cur.progTarget) {
            if (progSrv < cur.progTarget) { cur.progStart = progSrv; cur.progShown = progSrv; }
            else { cur.progStart = cur.progShown; }
            cur.progTarget = progSrv;
            cur.progT0 = performance.now();
          }
          cur.idx = idx;
        } else {
          const punyaTombak = Array.isArray((w as any).perkakas) && (w as any).perkakas.some((p: any) => p.jenis === "tombak_iblis");
          const group = buildCitizen(String(w.peran ?? "-"), String(w.nomor ?? "0000"), String((w as any).gender ?? ""), { tombakIblis: punyaTombak });
          group.userData.wargaId = String(w.id);
          group.position.set(tw.x, 0, tw.z);
          wargaGroup.add(group);
          const label = document.createElement("div");
          label.className = "map3d-label";
          const bar = document.createElement("div");
          bar.className = "map3d-bar";
          label.appendChild(bar);
          const hpWrap = document.createElement("div");
          hpWrap.className = "map3d-hp-wrap";
          const hpFill = document.createElement("div");
          hpFill.className = "map3d-hp-fill";
          hpWrap.appendChild(hpFill);
          label.appendChild(hpWrap);
          const actionWrap = document.createElement("div");
          actionWrap.className = "map3d-action-wrap";
          actionWrap.style.display = "none";
          const actionText = document.createElement("span");
          actionText.className = "map3d-action-text";
          const actionBar = document.createElement("div");
          actionBar.className = "map3d-action-bar";
          const actionFill = document.createElement("div");
          actionFill.className = "map3d-action-fill";
          actionBar.appendChild(actionFill);
          actionWrap.appendChild(actionText);
          actionWrap.appendChild(actionBar);
          label.appendChild(actionWrap);
          // RONDE 15 — pip pentung kumpul (10 pip = 1 ronde kumpul):
          // tampil di bawah label saat kumpul node nyata.
          const pips = document.createElement("div");
          pips.style.cssText = "display:none;justify-content:center;gap:1px;margin-top:2px;";
          const pipSpans: HTMLSpanElement[] = [];
          for (let pi = 0; pi < 10; pi++) {
            const sp = document.createElement("span");
            sp.style.cssText = "display:inline-block;width:5px;height:5px;border-radius:1px;background:rgba(255,255,255,0.25);";
            pips.appendChild(sp);
            pipSpans.push(sp);
          }
          label.appendChild(pips);
          labelsEl.appendChild(label);
          const bubble = document.createElement("div");
          bubble.className = "map3d-bubble";
          labelsEl.appendChild(bubble);
          // RONDE 8: goal awal = kunci tujuan server (sama seperti sync).
          const tj0 = (w as any).tujuan as { gx?: number; gy?: number } | null | undefined;
          let ux0 = tw.x;
          let uz0 = tw.z;
          if (tj0 && typeof tj0.gx === "number" && typeof tj0.gy === "number") {
            const tww0 = toWorld(tj0.gx, tj0.gy, gw, gh, gmin);
            ux0 = tww0.x;
            uz0 = tww0.z;
          }
          const kunci0 = kunciTujuanBaru(
            tj0 && typeof tj0.gx === "number" && typeof tj0.gy === "number" ? { gx: tj0.gx, gy: tj0.gy } : null,
            String((w as any).fase_siklus ?? ""),
            { x: tw.x, z: tw.z },
            { x: ux0, z: uz0 },
          );
          wargaMap.set(String(w.id), {
            group,
            label,
            bar,
            hpWrap,
            hpFill,
            actionWrap,
            actionText,
            actionFill,
            bubble,
            pips,
            pipSpans,
            dx: tw.x,
            dz: tw.z,
            tx: tw.x,
            tz: tw.z,
            ux: ux0,
            uz: uz0,
            goal: { x: kunci0.goal.x, z: kunci0.goal.z, key: kunci0.key },
            jalur: [],
            jalurKey: "",
            speedPerSec: typeof (w as any).kecepatan === "number" && (w as any).kecepatan > 0 ? lajuServerPerDetik((w as any).kecepatan, durasiJamMs(jamRef.current % 24) / 1000) : 0.45,
            data: w,
            idx,
            cycle: Math.random() * Math.PI * 2,
            pace: 0.45,
            lastChip: 0,
            lastShot: 0,
            lastPip: 0,
            progShown: Number((w as any).progres_aksi_pct ?? 0),
            progStart: Number((w as any).progres_aksi_pct ?? 0),
            progTarget: Number((w as any).progres_aksi_pct ?? 0),
            progT0: 0,
            lastActionCycle: 0,
            actionT0: performance.now(),
            actionActiveKind: "",
          });
        }
      });
      for (const [id, cur] of [...wargaMap]) {
        if (!seen.has(id)) {
          wargaGroup.remove(cur.group);
          disposeGroup(cur.group);
          cur.label.remove();
          cur.bubble.remove();
          wargaMap.delete(id);
        }
      }
    };

    const syncHewan = () => {
      const m = mapRef.current;
      if (!m) return;
      const gw = Number(m.grid?.w ?? 200);
      const gh = Number(m.grid?.h ?? 200);
      const gmin = Number(m.grid?.min ?? 0);
      const seen = new Set<string>();
      for (const h of m.hewan ?? []) {
        seen.add(String(h.id));
        const tw = toWorld(Number(h.gx), Number(h.gy), gw, gh, gmin);
        const cur = hewanMap.get(String(h.id));
        if (cur) {
          const jump = Math.hypot(tw.x - cur.tx, tw.z - cur.tz);
          if (jump > 0.01) cur.pace = paceTampil(jump);
          cur.tx = tw.x;
          cur.tz = tw.z;
          // RONDE 5: laju server untuk pacing kontinyu (fallback: pace lama).
          cur.speedPerSec = typeof (h as any).kecepatan === "number" && (h as any).kecepatan > 0 ? lajuServerPerDetik((h as any).kecepatan, durasiJamMs(jamRef.current % 24) / 1000) : cur.pace;
          // RONDE 15 — HP ikut payload (hewan lama = penuh).
          cur.hpMax = typeof (h as any).hpMax === "number" ? (h as any).hpMax : cur.hpMax;
          cur.hp = typeof (h as any).hp === "number" ? (h as any).hp : cur.hpMax;
        } else {
          const group = buildAnimal(String(h.jenis ?? "-"));
          group.position.set(tw.x, 0, tw.z);
          hewanGroup.add(group);
          const label = document.createElement("div");
          label.className = "map3d-label map3d-label-hewan";
          label.textContent = HEWAN_STYLE[String(h.jenis)]?.label ?? String(h.jenis);
          // RONDE 15 — bar HP hewan (tampil saat terluka / diburu).
          const hpBar = document.createElement("div");
          hpBar.style.cssText = "width:30px;height:4px;background:rgba(0,0,0,0.55);border-radius:2px;margin:2px auto 0;display:none;";
          const hpFill = document.createElement("div");
          hpFill.style.cssText = "height:100%;border-radius:2px;background:#4ade80;";
          hpBar.appendChild(hpFill);
          label.appendChild(hpBar);
          labelsEl.appendChild(label);
          const hpMax0 = typeof (h as any).hpMax === "number" ? (h as any).hpMax : 1;
          const hp0 = typeof (h as any).hp === "number" ? (h as any).hp : hpMax0;
          hewanMap.set(String(h.id), { group, label, hpBar, hpFill, dx: tw.x, dz: tw.z, tx: tw.x, tz: tw.z, speedPerSec: 0.45, pace: 0.45, id: String(h.id), jenis: String(h.jenis ?? "-"), cycle: Math.random() * Math.PI * 2, hp: hp0, hpMax: hpMax0, jalur: [], jalurKey: "" });
        }
      }
      for (const [id, cur] of [...hewanMap]) {
        if (!seen.has(id)) {
          // RONDE 10 — hewan JATUH (bukan lenyap instan): label hilang
          // langsung, badan rebah (rotasi Z -> 1,4) + tenggelam 0,2
          // selama ~1,2 detik, baru grup dihapus (di loop render).
          cur.label.remove();
          fallingAnimals.push({ group: cur.group, t0: performance.now() });
          hewanMap.delete(id);
        }
      }
    };

    // RONDE 10 — daging tergeletak: bungkusan merah di ubin daging.
    const syncDaging = () => {
      const m = mapRef.current;
      if (!m) return;
      const gw = Number(m.grid?.w ?? 200);
      const gh = Number(m.grid?.h ?? 200);
      const gmin = Number(m.grid?.min ?? 0);
      const seenD = new Set<string>();
      for (const d of (m as any).daging ?? []) {
        const id = String(d.id);
        seenD.add(id);
        const tw = toWorld(Number(d.gx), Number(d.gy), gw, gh, gmin);
        let mesh = dagingMap.get(id);
        if (!mesh) {
          mesh = box(0.5, 0.25, 0.35, 0x7f1d1d, 0, 0.15, 0);
          scene.add(mesh);
          dagingMap.set(id, mesh);
        }
        mesh.position.set(tw.x, 0.15, tw.z);
      }
      for (const [id, mesh] of [...dagingMap]) {
        if (!seenD.has(id)) {
          scene.remove(mesh);
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
          dagingMap.delete(id);
        }
      }
    };

    syncStatic();
    syncWarga();
    syncHewan();
    syncDaging();
    let syncTick = 0;

    const downPos = { x: 0, y: 0, t: 0 };
    const raycaster = new THREE.Raycaster();
    const planeY0 = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const ndc = new THREE.Vector2();
    const hitPoint = new THREE.Vector3();
    const el = renderer.domElement;
    const onDown = (e: PointerEvent) => {
      downPos.x = e.clientX;
      downPos.y = e.clientY;
      downPos.t = performance.now();
      userTouched = true;
      frameAnim = null;
    };
    const onUp = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      if (moved > 6 || performance.now() - downPos.t > 600) return;
      const rect = el.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      // Ketuk KARAKTER dulu (raycast model warga): kunci + ikuti + profil.
      const hits = raycaster.intersectObjects(wargaGroup.children, true);
      for (const hit of hits) {
        let o: THREE.Object3D | null = hit.object;
        while (o) {
          const wid = (o.userData as J | undefined)?.wargaId;
          if (typeof wid === "string") {
            onTapWargaRef.current(wid);
            return;
          }
          o = o.parent;
        }
      }
      // Ketuk BANGUNAN dulu (raycast mesh, bukan tanah — model tinggi
      // seperti gudang tidak akurat bila dipetakan lewat tanah).
      // Tanpa handler (pemanggil lama) jatuh ke logika tanah di bawah.
      const bHits = raycaster.intersectObjects(buildingsGroup.children, true);
      for (const hit of bHits) {
        let o: THREE.Object3D | null = hit.object;
        while (o) {
          const pl = (o.userData as J | undefined)?.placement as J | undefined;
          if (pl && typeof pl.kind === "string") {
            if (onTapBangunanRef.current) {
              onTapBangunanRef.current({ id: String(pl.id), kind: pl.kind, gx: Number(pl.gx), gy: Number(pl.gy), level: Number(pl.level ?? 1) });
              return;
            }
            break;
          }
          o = o.parent;
        }
      }
      const hit = raycaster.ray.intersectPlane(planeY0, hitPoint);
      if (!hit) return;
      const m = mapRef.current;
      const gw = Number(m?.grid?.w ?? 200);
      const gh = Number(m?.grid?.h ?? 200);
      const gmin = Number(m?.grid?.min ?? 0);
      const gx = Math.floor(hitPoint.x + gmin + gw / 2);
      const gy = Math.floor(hitPoint.z + gmin + gh / 2);
      if (gx >= gmin && gy >= gmin && gx < gmin + gw && gy < gmin + gh) onSelectRef.current(gx, gy);
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    const onWheel = () => {
      userTouched = true;
      frameAnim = null;
    };
    el.addEventListener("wheel", onWheel, { passive: true });

    const ro = new ResizeObserver(() => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w > 0 && h > 0) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    });
    ro.observe(wrap);

    const floatingPops: { el: HTMLDivElement; x: number; y: number; z: number; t0: number }[] = [];
    const harvestedLocalKeys = new Set<string>();
    let raf = 0;
    let last = performance.now();
    // RONDE 49 (Ide 27) — penghitung baseline render: frame ke-120
    // (~2 detik @60fps) baru sampel, supaya kompilasi shader/upload
    // tekstur awal tidak masuk baseline; flag sekali saja.
    let frameBaseline = 0;
    let baselineTercatat = false;
    const vec = new THREE.Vector3();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      // Sungai mengalir: geser tekstur arus.
      riverTex.offset.y -= dt * 0.12;

      // RONDE 20 — IKAN SUNGAI: ikan berenang bolak-balik mengikuti alur
      // sungai; jumlah yang tampak = min(stok ikan, 8) — sungai sepi
      // (stok 0) = tidak ada ikan terlihat.
      {
        const mF = mapRef.current;
        const rxs: number[] = mF?.riverXs ?? [];
        const stokIkan = Number(mF?.ikan ?? 30);
        const tampil = Math.max(0, Math.min(fishes.length, stokIkan));
        const cxF = gridTampil.gmin + gridTampil.gw / 2;
        const cyF = gridTampil.gmin + gridTampil.gh / 2;
        for (let fi = 0; fi < fishes.length; fi++) {
          const f = fishes[fi];
          if (fi >= tampil || rxs.length === 0) { f.mesh.visible = false; continue; }
          // Posisi sepanjang sungai: gy berosilasi perlahan (deterministik
          // dari index + waktu), x = tepi sungai di baris itu + offset.
          const span = rxs.length;
          const fase = (t * f.speed * 0.05 + fi * 0.37) % 2;
          const idx = fase < 1 ? fase * (span - 1) : (2 - fase) * (span - 1);
          const i0 = Math.max(0, Math.min(span - 2, Math.floor(idx)));
          const frac = idx - i0;
          const rx0 = rxs[i0] ?? 80;
          const rx = rx0 + ((rxs[i0 + 1] ?? rx0) - rx0) * frac;
          const gy = gridTampil.gmin + i0 + frac;
          f.mesh.visible = true;
          f.mesh.position.set(rx + 0.5 + f.offset - cxF, 0.12 + Math.sin(t * 2 + fi) * 0.03, gy - cyF + 0.5);
          // Hadap arah gerak (bolak-balik): fase naik = +z, turun = -z.
          f.mesh.rotation.y = fase < 1 ? 0 : Math.PI;
        }
      }

      // Awan melayang pelan, melingkar di atas peta.
      for (const c of clouds) {
        c.position.x += dt * (c.userData.speed as number);
        if (c.position.x > 140) c.position.x = -140;
      }

      // Palet cahaya per mode waktu (POLISH ronde 5): sore = golden hour
      // hangat, bukan siang biasa. Hanya warna/cahaya — tanpa mekanik.
      const night = isNight(faseRef.current);
      const mode: ModeCahaya = night ? "malam" : faseRef.current === "sore" ? "sore" : "siang";
      if (mode !== modeApplied) {
        modeApplied = mode;
        const p = paletCahaya(mode);
        (scene.background as THREE.Color).set(p.bg);
        (scene.fog as THREE.Fog).color.set(p.bg);
        hemi.intensity = p.hemi;
        sun.visible = p.sunVisible;
        sun.color.set(p.sun);
        moon.visible = p.moon;
        stars.visible = p.stars;
      }
      // Cahaya api unggun: hanya malam, berdenyut.
      fireGroup.children.forEach((light, i) => {
        if (light instanceof THREE.PointLight) {
          light.intensity = night ? 26 + Math.sin(t * 13 + i * 2.1) * 7 : 0;
        }
      });
      // Lentera restoran: hanya malam, berdenyut lembut.
      lenteraGroup.children.forEach((light, i) => {
        if (light instanceof THREE.PointLight) {
          light.intensity = night ? 14 + Math.sin(t * 9 + i * 2.7) * 3 : 0;
        }
      });
      // Perahu bergoyang di air.
      for (const b of boats) {
        b.rotation.z = Math.sin(t * 1.8) * 0.04;
        b.position.y = 0.06 + Math.sin(t * 2.2) * 0.05;
      }

      // KAMERA IKUTI: bila ada karakter terkunci, target kamera menempel
      // posisi tampil karakter. RONDE 11: geser (PAN) SELALU pan — tidak
      // lagi diubah jadi orbit saat terkunci (itu akar "susah geser":
      // drag malah orbit + follow-lerp melawan input). Geser mulai =
      // kunci dilepas (listener 'start' di atas); orbit tetap via
      // klik-kanan / 2 jari.
      const followIdNow = followRef.current;
      const following = Boolean(followIdNow && wargaMap.has(followIdNow as string));
      if (following) {
        const cur = wargaMap.get(followIdNow as string)!;
        const k = 1 - Math.exp(-dt * 6);
        controls.target.x += (cur.dx - controls.target.x) * k;
        controls.target.z += (cur.dz - controls.target.z) * k;
        frameAnim = null;
      }
      // Bingkai kampung sekali saat load (lihat deklarasi): target =
      // pusat bangunan (fallback: pusat warga), jarak 80 — warga ~3%
      // tinggi layar HP, jalan 0,5 u/dtk ≈ 5 px/dtk: jelas terlihat,
      // bukan sub-pixel seperti jarak default 184.
      if (!framedOnce && !userTouched && !following) {
        const mF = mapRef.current;
        const pls = ((mF?.placements ?? []) as J[]);
        const wgs = ((mF?.warga ?? []) as J[]);
        if (mF && (pls.length > 0 || wgs.length > 0)) {
          framedOnce = true;
          const gwF = Number(mF.grid?.w ?? 200);
          const ghF = Number(mF.grid?.h ?? 200);
          const gminF = Number(mF.grid?.min ?? 0);
          const pts = pls.length > 0
            ? pls.map((p) => {
                const cx = Number(p.gx) + (Number(p.w ?? 1) - 1) / 2;
                const cy = Number(p.gy) + (Number(p.h ?? 1) - 1) / 2;
                const tw = toWorld(cx, cy, gwF, ghF, gminF);
                return { x: tw.x, z: tw.z };
              })
            : wgs.map((w) => {
                const tw = toWorld(Number(w.gx), Number(w.gy), gwF, ghF, gminF);
                return { x: tw.x, z: tw.z };
              });
          const c = pusatDariTitik(pts);
          const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
          frameAnim = {
            t: 0,
            fromT: controls.target.clone(),
            toT: new THREE.Vector3(c.x, 0, c.z),
            fromP: camera.position.clone(),
            toP: new THREE.Vector3(c.x + dir.x * 80, dir.y * 80, c.z + dir.z * 80),
          };
        } else if (mF) {
          // Data sudah ada tapi tanpa bangunan/warga — jangan cek lagi.
          framedOnce = true;
        }
      }
      if (frameAnim) {
        frameAnim.t = Math.min(1, frameAnim.t + dt / 1.6);
        const e = frameAnim.t * frameAnim.t * (3 - 2 * frameAnim.t);
        controls.target.lerpVectors(frameAnim.fromT, frameAnim.toT, e);
        camera.position.lerpVectors(frameAnim.fromP, frameAnim.toP, e);
        if (frameAnim.t >= 1) frameAnim = null;
      }
      const m0 = mapRef.current;
      const clamp = Number(m0?.grid?.w ?? 200) / 2 + 10;
      controls.target.x = THREE.MathUtils.clamp(controls.target.x, -clamp, clamp);
      controls.target.z = THREE.MathUtils.clamp(controls.target.z, -clamp, clamp);
      controls.update();

      syncTick++;
      if (syncTick % 30 === 0) {
        syncStatic();
        syncWarga();
        syncHewan();
        syncDaging();
      }

      // Warga: pacing trayektori laju server menuju tujuan (jalan
      // kontinyu, tanpa snap kecuali desync nyata > AMBANG_SNAP_DESYNC)
      // + kaki + perkakas animasi + idle hidup.
      let selFound = false;
      // RONDE 22 — antre label warga untuk dirapikan (tumpuk) setelah
      // loop, supaya nama tidak saling menutupi saat warga berkerumun.
      // RONDE 48 (Ide 33): label HEWAN ikut antrean yang sama — dulu
      // diposisi langsung di loop hewan, jadi bisa menumpuk di atas
      // label warga yang sudah dirapikan di pusat kampung. Entri hewan
      // tidak punya bubble (bubble: null).
      const labelAntre: { label: HTMLDivElement; bubble: HTMLDivElement | null; sx: number; sy: number; bubbleText: string; isSelectedW: boolean }[] = [];
      const wRect = wrap.getBoundingClientRect();
      const camDist = camera.position.distanceTo(controls.target);
      const jamNow = jamRef.current;
      for (const [id, cur] of wargaMap) {
        // RONDE 5 — pacing trayektori kontinyu: display berjalan dengan
        // laju server (speedPerSec = kecepatan/60) MENUJU TUJUAN, bukan
        // bergegas ke posisi server lalu diam ~50 detik menunggu update
        // berikutnya (pola burst-diam yang dikeluhkan user). RONDE 6:
        // snap HANYA di atas AMBANG_SNAP_DESYNC — ambang 8 lama menarik
        // display mundur tiap menit karena posisi server basi tertinggal
        // 1 lompatan penuh di tengah menit (bug sawtooth ronde 5).
        if (Math.hypot(cur.tx - cur.dx, cur.tz - cur.dz) > AMBANG_SNAP_DESYNC) {
          cur.dx = cur.tx;
          cur.dz = cur.tz;
        }
        const goalX = cur.goal.x;
        const goalZ = cur.goal.z;
        // Jalur memutar bangunan (2026-11-04): ganti garis lurus ke goal
        // dengan waypoint BFS — display tidak lagi memotong rumah.
        let tx = goalX;
        let tz = goalZ;
        const { gw, gh, gmin } = gridTampil;
        const cxT = gmin + gw / 2;
        const cyT = gmin + gh / 2;
        const tileDari = { gx: Math.round(cur.dx + cxT - 0.5), gy: Math.round(cur.dz + cyT - 0.5) };
        const tileKe = { gx: Math.round(goalX + cxT - 0.5), gy: Math.round(goalZ + cyT - 0.5) };
        const jalurBasi = !cur.jalur || cur.jalurKey !== cur.goal.key || (cur.jalur.length > 0 && Math.hypot(cur.jalur[0].x - cur.dx, cur.jalur[0].z - cur.dz) > Math.hypot(goalX - cur.dx, goalZ - cur.dz) + 2);
        if (jalurBasi) {
          const tiles = jalurTampil(tileDari, tileKe, rintanganTampil, (gx, gy) => gunungTampil.some((g) => (gx - g.cx) ** 2 + (gy - g.cy) ** 2 <= g.r * g.r));
          cur.jalurKey = cur.goal.key;
          cur.jalur = tiles ? tiles.map((t) => toWorld(t.gx, t.gy, gw, gh, gmin)) : [];
        }
        if (cur.jalur && cur.jalur.length > 0) {
          tx = cur.jalur[0].x;
          tz = cur.jalur[0].z;
        }
        const stepR = langkahDisplay(cur.dx, cur.dz, tx, tz, cur.speedPerSec, dt);
        if (stepR.tiba && cur.jalur && cur.jalur.length > 0) cur.jalur.shift();
        const px = stepR.x;
        const pz = stepR.z;
        const stepJalan = stepR.moved;
        const moving = stepJalan > 0;
        if (moving) {
          cur.group.rotation.y = Math.atan2(tx - cur.dx, tz - cur.dz);
        }
        const fase = String(cur.data.fase_siklus ?? "");
        const berenang = cur.data.sedang_berenang === true;
        const u = cur.group.userData as any;
        // RONDE 15 — progres kumpul tampil: interpolasi halus sepanjang
        // jam (lihat sync) supaya pip terisi satu per satu.
        if (fase === "kumpul") {
          const durMs = durasiJamMs(jamRef.current % 24);
          if (cur.progTarget >= cur.progStart && durMs > 0) {
            const k = Math.min(1, (now - cur.progT0) / durMs);
            cur.progShown = cur.progStart + (cur.progTarget - cur.progStart) * k;
          } else {
            cur.progShown = cur.progTarget;
          }
        } else {
          cur.progShown = Number(cur.data.progres_aksi_pct ?? 0);
        }
        // RONDE 15 — menunggu tick terasa hidup: display sudah tiba di
        // tujuan tapi server belum ganti fase (tunggu sampai tick jam
        // berikut, maks ~60 detik) -> langkah kecil cari-cari di sekitar
        // tujuan (radius <=1 tile, jauh di bawah snap 250) + ayun kaki
        // halus, bukan berdiri mematung. Hanya fase jalan (berjalan /
        // jalan_santai); kumpul/istirahat/kembali/makan punya animasinya.
        // cur.dx/dz TIDAK diubah (wiggle hanya render) supaya tidak ada
        // drift saat tujuan baru datang.
        let wigX = 0;
        let wigZ = 0;
        const wiggle = !moving && stepR.tiba && fase === "jalan";
        if (wiggle) {
          const ang = t * 0.45 + cur.cycle;
          wigX = Math.cos(ang) * 0.9;
          wigZ = Math.sin(ang) * 0.9;
        }
        // RONDE 9 — pose tidur: rebah horizontal + napas di ubin hunian
        // (bukan berdiri + Zzz saja); bangun = pose tegak kembali.
        const tidur = fase === "istirahat";
        if (u.pose) {
          const ps = poseTidur(tidur);
          u.pose.rotation.x = ps.rotX;
          u.pose.position.z = ps.centerZ;
          u.pose.position.y = tidur ? 0.28 + Math.sin(t * 1.5) * 0.04 : 0;
        }
        // RONDE 22 — tidur di dalam (r42): warga yang istirahat di jam
        // malam tidak dirender di luar — mereka tidur di dalam hunian
        // (tidak berkerumun di luar rumah). Jalan pulang (kembali) dan
        // istirahat siang tetap terlihat seperti biasa.
        const tidurDalam = tidurDiDalam(fase, faseRef.current);
        cur.group.visible = !tidurDalam;
        // RONDE 10 — saat kumpul diam: hadapkan warga ke node-nya (dari
        // ubin sebelah, bukan menatap sembarang arah).
        if (!moving && fase === "kumpul" && cur.data.node && typeof cur.data.node.gx === "number") {
          const mK = mapRef.current;
          const nw = toWorld(Number(cur.data.node.gx), Number(cur.data.node.gy), Number(mK?.grid?.w ?? 200), Number(mK?.grid?.h ?? 200), Number(mK?.grid?.min ?? 0));
          cur.group.rotation.y = Math.atan2(nw.x - cur.dx, nw.z - cur.dz);
        }
        if (moving && stepJalan > 0) {
          // Kaki TERIKAT jarak tempuh (bukan timer): ayun hanya saat
          // benar-benar berpindah; diam = kaki diam (tanpa treadmill).
          // RONDE 4: amplitudo 1,0 rad + kaki besar (tampil.ts) — ayunan
          // JELAS TERLIHAT di HP zoom normal, bukan cuma ada di kode.
          cur.cycle += langkahAyunan(stepJalan);
          const swing = sudutAyunan(cur.cycle);
          if (u.legL) u.legL.rotation.x = swing;
          if (u.legR) u.legR.rotation.x = -swing;
          // RONDE 9 — lengan ayun berlawanan kaki (jalan natural).
          if (u.armL) u.armL.rotation.x = -swing;
          if (u.armR) u.armR.rotation.x = swing;
          if (u.head) u.head.rotation.y *= 0.9;
          if (u.body) u.body.scale.y = 1;
        } else {
          if (u.legL) u.legL.rotation.x *= 0.8;
          if (u.legR) u.legR.rotation.x *= 0.8;
          if (u.armL) u.armL.rotation.x *= 0.8;
          if (u.armR) u.armR.rotation.x *= 0.8;
          // RONDE 5 — idle HIDUP, bukan patung: saat diam di luar
          // istirahat, kepala menoleh pelan + badan bernapas halus.
          // Istirahat tetap pakai bob napas di bawah (kepala diam).
          if (fase !== "istirahat") {
            if (u.head) u.head.rotation.y = Math.sin(t * 0.5 + cur.cycle) * 0.35;
            if (u.body) u.body.scale.y = 1 + Math.sin(t * 1.5) * 0.02;
            // RONDE 15 — kaki cari-cari saat wiggle menunggu tick.
            if (wiggle) {
              if (u.legL) u.legL.rotation.x = Math.sin(t * 2) * 0.3;
              if (u.legR) u.legR.rotation.x = -Math.sin(t * 2) * 0.3;
            }
          } else {
            if (u.head) u.head.rotation.y *= 0.9;
            if (u.body) u.body.scale.y = 1;
          }
        }
        // Perkakas: ayun saat kumpul; busur saat berburu (pemburu).
        const kerja = fase === "kumpul";
        const berburu = String(cur.data.status_teks ?? "").includes("Mengejar") || cur.data.target_hewan;
        // RONDE 10 — pemburu membidik mangsanya (hadap ke posisi tampil
        // hewan, bukan ke tujuan kerja lama).
        if (berburu && cur.data.target_hewan) {
          const mangsaAim = hewanMap.get(String(cur.data.target_hewan));
          if (mangsaAim) cur.group.rotation.y = Math.atan2(mangsaAim.dx - cur.dx, mangsaAim.dz - cur.dz);
        }
        if (u.busur) {
          const pakaiBusur = Boolean(berburu && (cur.data.perkakas ?? []).some((p: J) => p.jenis === "busur"));
          u.busur.visible = pakaiBusur;
          if (u.toolPivot) u.toolPivot.visible = !pakaiBusur;
          if (pakaiBusur) u.busur.rotation.x = Math.sin(t * 6) * 0.12;
        }
        if (u.toolPivot) {
          if (kerja) {
            const tool = String(u.toolKind ?? "");
            if (tool === "obor") {
              const api = u.toolPivot.children.find((c: any) => c.name === "api-alat");
              if (api) api.scale.setScalar(1 + Math.sin(t * 11) * 0.18);
              u.toolPivot.rotation.x = Math.sin(t * 3) * 0.08;
            } else if (tool === "keranjang" || tool === "lumpang" || tool === "periuk") {
              // RONDE 10 (lanjutan): memasak di paviliun = aduk periuk
              // (ayun kuat), bukan goyang halus seperti keranjang biasa.
              const memasak = String((cur.data.node as any)?.pseudo ?? "") === "restoran";
              u.toolPivot.rotation.x = memasak ? Math.sin(t * 3) * 0.35 : Math.sin(t * 2) * 0.06;
            } else if (tool === "tongkat" || tool === "tongkat_suku") {
              u.toolPivot.rotation.x = Math.sin(t * 2.5) * 0.12;
            } else if (tool === "kapak" || tool === "beliung") {
              // RONDE 10 — ayunan kapak/beliung lambat + kuat (1 Hz),
              // bukan getar generik — tebang KELIHATAN.
              u.toolPivot.rotation.x = ayunanPerkakas(tool, t);
            } else {
              u.toolPivot.rotation.x = Math.sin(t * 10) * 0.55 - 0.2;
            }
          } else if (berburu) {
            // RONDE 10 — ancang-ancang lempar tombak saat berburu.
            u.toolPivot.rotation.x = Math.sin(t * 8) * 0.7;
          } else if (String(cur.data.aksi_sekarang ?? "") === "membantu") {
            // RONDE 14 — membantu: ayun perkakas membantu (bukan diam).
            u.toolPivot.rotation.x = Math.sin(t * 2.5) * 0.3;
          } else {
            u.toolPivot.rotation.x *= 0.85;
          }
        }
        // RONDE 10 (lanjutan) — MAKAN di paviliun: angguk kepala ke
        // meja + tangan ke mulut (bukan diam mematung). Fase "makan"
        // hanya terjadi di tengah paviliun — warga KELIHATAN makan di
        // dalam, bukan di luar gedung.
        if (fase === "makan") {
          if (u.head) u.head.rotation.x = Math.sin(t * 3) * 0.3;
          if (u.armR) u.armR.rotation.x = -0.9 + Math.sin(t * 3) * 0.25;
        }
        // RONDE 13 — MEMBANTU: ayun lengan ke depan (seperti kerja ringan)
        // saat berdiri di sebelah pekerja — bukan diam mematung.
        if (String(cur.data.aksi_sekarang ?? "") === "membantu") {
          if (u.armR) u.armR.rotation.x = -0.6 + Math.sin(t * 3) * 0.3;
          if (u.armL) u.armL.rotation.x = -0.3 + Math.sin(t * 3 + 1) * 0.2;
        }
        // RONDE 10 — bungkusan daging terlihat saat dibawa pulang.
        if (u.dagingBawa) u.dagingBawa.visible = Boolean(cur.data.membawa_daging);
        // RONDE 14 — bara + aura tombak iblis beranimasi (hook verbatim
        // dari aset: userData.update). Hanya ada pada mesh Figo.
        if (u.tombakIblis && typeof u.tombakIblis.userData?.update === "function") {
          u.tombakIblis.userData.update(t);
        }
        // RONDE 10 — serpihan tebang/pahat: tiap ~0,9 detik saat kumpul
        // dengan kapak/beliung, <=4 serpihan dari ubin node.
        if (kerja && (u.toolKind === "kapak" || u.toolKind === "beliung") && cur.data.node && typeof cur.data.node.gx === "number" && now - cur.lastChip > 900) {
          cur.lastChip = now;
          const mC = mapRef.current;
          const nwC = toWorld(Number(cur.data.node.gx), Number(cur.data.node.gy), Number(mC?.grid?.w ?? 200), Number(mC?.grid?.h ?? 200), Number(mC?.grid?.min ?? 0));
          const isPohon = String(cur.data.node.kind) === "pohon";
          let spawned = 0;
          for (const c of chips) {
            if (spawned >= 4) break;
            if (c.life > 0) continue;
            c.life = 0.8;
            (c.mesh.material as THREE.MeshLambertMaterial).color.set(isPohon ? 0x6b4226 : 0x9ca3af);
            c.mesh.position.set(nwC.x, 0.5, nwC.z);
            const a = Math.random() * Math.PI * 2;
            const sp = 0.8 + Math.random() * 0.8;
            c.vx = Math.cos(a) * sp;
            c.vz = Math.sin(a) * sp;
            c.vy = 1.2 + Math.random() * 0.8;
            c.mesh.visible = true;
            spawned++;
          }
        }
        // RONDE 15 — serpihan tiap pip pentung (SEMUA perkakas, bukan
        // cuma kapak/beliung): tiap pip baru = 1 pentung yang kelihatan
        // (3 serpihan dari ubin node, warna ikut jenis node). Pip turun
        // (reset ronde) tidak memicu serpihan.
        if (kerja && cur.data.node && !(cur.data.node as any).pseudo && typeof cur.data.node.gx === "number") {
          const pipChip = hitungPipKumpul(cur.progShown);
          if (pipChip > cur.lastPip) {
            const mC2 = mapRef.current;
            const nwC2 = toWorld(Number(cur.data.node.gx), Number(cur.data.node.gy), Number(mC2?.grid?.w ?? 200), Number(mC2?.grid?.h ?? 200), Number(mC2?.grid?.min ?? 0));
            const kindN = String(cur.data.node.kind);
            const colN = kindN === "pohon" ? 0x6b4226 : kindN === "semak_beri" ? 0x388e3c : kindN === "padang_buruan" ? 0xc9b458 : kindN === "urat_emas" ? 0xfacc15 : 0x9ca3af;
            let spawned2 = 0;
            for (const c of chips) {
              if (spawned2 >= 3) break;
              if (c.life > 0) continue;
              c.life = 0.8;
              (c.mesh.material as THREE.MeshLambertMaterial).color.set(colN);
              c.mesh.position.set(nwC2.x, 0.5, nwC2.z);
              const a2 = Math.random() * Math.PI * 2;
              const sp2 = 0.8 + Math.random() * 0.8;
              c.vx = Math.cos(a2) * sp2;
              c.vz = Math.sin(a2) * sp2;
              c.vy = 1.2 + Math.random() * 0.8;
              c.mesh.visible = true;
              spawned2++;
            }
          }
          cur.lastPip = pipChip;
        } else if (cur.lastPip !== 0) {
          cur.lastPip = 0;
        }
        // RONDE 10 — proyektil berburu: tiap ~4 detik per pemburu, terbang
        // 0,6 detik dari pemburu ke mangsa dengan busur.
        if (berburu && cur.data.target_hewan && now - cur.lastShot > 4000) {
          const mangsaShot = hewanMap.get(String(cur.data.target_hewan));
          if (mangsaShot) {
            cur.lastShot = now;
            const pg = new THREE.Group();
            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 5), new THREE.MeshLambertMaterial({ color: 0x6b4226 }));
            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 6), new THREE.MeshLambertMaterial({ color: 0x9ca3af }));
            tip.position.y = 0.6;
            pg.add(shaft);
            pg.add(tip);
            scene.add(pg);
            proyektils.push({ mesh: pg, t0: now, from: new THREE.Vector3(cur.dx, 1.0, cur.dz), to: new THREE.Vector3(mangsaShot.dx, 0.5, mangsaShot.dz) });
          }
        }
        // RONDE 9: napas tidur ditangani pose (bukan bob grup) — bob grup
        // istirahat = 0 supaya badan tidak mengambang ganda.
        const bob = moving ? Math.abs(Math.sin(cur.cycle)) * 0.06 : 0;
        const yPos = berenang ? -0.25 : bob;
        // RONDE 12 — goyang saat diserang hewan buas (lunge aktif frame
        // sebelumnya; picu di bawah, di bagian bubble interaksi).
        const goyang = lungeAktif.has(id) ? Math.sin(now / 25) * 0.07 : 0;
        cur.group.position.set(px + goyang + wigX, yPos, pz + wigZ);
        cur.dx = px;
        cur.dz = pz;
        if (selectedRef.current === id || followRef.current === id) {
          ring.position.set(px + wigX, 0.08, pz + wigZ);
          ring.visible = true;
          selFound = true;
        }
        // Label nama + peran + bar progres (RONDE 15: bar + pip pakai
        // progres tampil yang diinterpolasi, bukan mentah server).
        const isSelectedW = selectedRef.current === id || followRef.current === id;
        const st = ROLE_STYLE[String(cur.data.peran ?? "-")];
        const nama = String(cur.data.nama ?? "");
        const peranLabel = st?.label ?? String(cur.data.peran ?? "");
        const showBar = fase === "kumpul" && cur.progShown > 0;

        // Pips pentung: hanya kumpul node nyata dan saat terseleksi
        const nodeNyata = fase === "kumpul" && (cur.data.node as any) && !(cur.data.node as any).pseudo;
        const pipNow = nodeNyata ? hitungPipKumpul(cur.progShown) : 0;
        cur.pips.style.display = (isSelectedW && nodeNyata) ? "flex" : "none";
        if (isSelectedW && nodeNyata) {
          for (let pi = 0; pi < cur.pipSpans.length; pi++) {
            cur.pipSpans[pi].style.background = pi < pipNow ? "#facc15" : "rgba(255,255,255,0.25)";
          }
        }

        const labelKey = `${nama}|${peranLabel}|${isSelectedW ? "1" : "0"}`;
        if (cur.label.dataset.key !== labelKey) {
          cur.label.dataset.key = labelKey;
          cur.label.innerHTML = "";
          const b = document.createElement("b");
          b.className = "map3d-name-text";
          b.textContent = nama;
          cur.label.appendChild(b);
          if (isSelectedW) {
            const s = document.createElement("span");
            s.className = "map3d-role-text";
            s.textContent = peranLabel;
            cur.label.appendChild(document.createElement("br"));
            cur.label.appendChild(s);
          }
          cur.label.appendChild(cur.hpWrap);
          cur.label.appendChild(cur.actionWrap);
          cur.label.appendChild(cur.bar);
        }

        // Update HP Bar: hanya tampil jika terluka (< 90%) atau karakter dipilih pemain
        const hpVal = Math.max(0, Math.min(100, Number(cur.data.sehat ?? 100)));
        cur.hpFill.style.width = `${hpVal}%`;
        if (hpVal > 60) cur.hpFill.style.backgroundColor = "#22c55e";
        else if (hpVal > 30) cur.hpFill.style.backgroundColor = "#f59e0b";
        else cur.hpFill.style.backgroundColor = "#ef4444";
        cur.hpWrap.style.display = (isSelectedW || hpVal < 90) ? "block" : "none";

        // Bar progres kerja hanya saat dipilih
        cur.bar.style.display = (isSelectedW && showBar) ? "block" : "none";
        if (isSelectedW && showBar) cur.bar.style.width = `${Math.min(100, cur.progShown)}%`;

        // Update Action Progress Bar
        let actionKind = "";
        let actionLabel = "";
        let actionDurationSec = 5.0;

        const nodeKind = String((cur.data.node as any)?.kind ?? "");
        const statusTeks = String(cur.data.status_teks ?? "");
        const aksiSekarang = String(cur.data.aksi_sekarang ?? "");
        const inter = cur.data.interaksi as J | null;

        if (inter && inter.jenis === "diserang") {
          actionKind = "bela_diri";
          actionLabel = "🛡️ Menghalau Hewan!";
          actionDurationSec = 30.0;
        } else if (inter && (inter.jenis === "gotong_royong" || inter.jenis === "ngobrol" || inter.jenis === "gelud")) {
          actionKind = "gotong_royong";
          actionLabel = "🤝 Gotong Royong";
          actionDurationSec = 20.0;
        } else if (fase === "berobat" || statusTeks.includes("Tabib") || aksiSekarang === "berobat") {
          actionKind = "berobat";
          actionLabel = "🌿 Perawatan Tabib...";
          actionDurationSec = 25.0;
        } else if (fase === "makan" || statusTeks.includes("paviliun") || statusTeks.includes("Restoran") || statusTeks.includes("Makan") || aksiSekarang === "makan") {
          actionKind = "makan";
          actionLabel = "🍜 Makan di Restoran Sichuan...";
          actionDurationSec = 30.0;
        } else if (fase === "bangun" || statusTeks.includes("Membangun")) {
          actionKind = "bangun";
          actionLabel = "🔨 Membangun...";
          actionDurationSec = 45.0;
        } else if (fase === "kumpul") {
          if (nodeKind === "pohon") {
            actionKind = "tebang";
            actionLabel = "🪓 Menebang Kayu Purba...";
            actionDurationSec = 90.0;
          } else if (nodeKind === "singkapan_batu" || nodeKind === "urat_emas" || nodeKind === "urat_besi") {
            actionKind = "tambang";
            actionLabel = "⛏️ Memahat Bebatuan...";
            actionDurationSec = 120.0;
          } else if (nodeKind === "semak_beri") {
            actionKind = "petik";
            actionLabel = "🍓 Memetik Buah Liar...";
            actionDurationSec = 45.0;
          } else if (nodeKind === "padang_buruan" || cur.data.target_hewan) {
            actionKind = "buru";
            actionLabel = "🏹 Mengintai & Berburu...";
            actionDurationSec = 90.0;
          } else if (cur.data.peran === "pemancing" || cur.data.peran === "nelayan" || cur.data.tempat_kerja === "sungai") {
            actionKind = "mancing";
            actionLabel = "🎣 Menunggu Sambaran Ikan...";
            actionDurationSec = 75.0;
          } else {
            actionKind = "kerja";
            actionLabel = "🌾 Bekerja Tekun...";
            actionDurationSec = 80.0;
          }
        } else if (aksiSekarang === "rehat_stok_penuh" || statusTeks.includes("Lumbung penuh")) {
          actionKind = "rehat";
          actionLabel = "☕ Rehat Santai (Lumbung Penuh)...";
          actionDurationSec = 60.0;
        }

        if (actionKind) {
          const isCombat = actionKind === "bela_diri";
          const shouldShowAction = isSelectedW || isCombat;
          cur.actionWrap.style.display = shouldShowAction ? "flex" : "none";
          const elapsed = (now / 1000) % actionDurationSec;
          const pct = Math.min(100, Math.floor((elapsed / actionDurationSec) * 100));
          if (shouldShowAction) {
            cur.actionText.textContent = `${actionLabel} ${pct}%`;
            cur.actionFill.style.width = `${pct}%`;
          }

          // DETEKSI AKSI PANEN SELESAI
          const currentCycle = Math.floor(now / (actionDurationSec * 1000));
          if (cur.lastActionCycle !== undefined && currentCycle > cur.lastActionCycle) {
            let resName = "";
            let resLabel = "";
            if (actionKind === "tebang") { resName = "kayu"; resLabel = "+1 Kayu 🪵"; }
            else if (actionKind === "tambang") {
              resName = nodeKind === "urat_emas" ? "emas" : nodeKind === "urat_besi" ? "besi" : "batu";
              resLabel = nodeKind === "urat_emas" ? "+1 Emas 🪙" : nodeKind === "urat_besi" ? "+1 Besi ⛓️" : "+1 Batu 🪨";
            } else if (actionKind === "petik") { resName = "beri"; resLabel = "+1 Buah Beri 🍓"; }
            else if (actionKind === "buru") { resName = "daging"; resLabel = "+1 Daging 🥩"; }
            else if (actionKind === "mancing") { resName = "ikan"; resLabel = "+1 Ikan 🐟"; }

            if (resName) {
              if (onResourceHarvestedRef.current) {
                onResourceHarvestedRef.current(resName, 1);
              }
              if (labelsRef.current) {
                const pop = document.createElement("div");
                pop.className = "map3d-float-badge";
                pop.textContent = resLabel;
                labelsRef.current.appendChild(pop);
                floatingPops.push({ el: pop, x: px, y: 2.2, z: pz, t0: now });
              }
              if (cur.data.node && typeof cur.data.node.gx === "number") {
                const nKey = `${cur.data.node.gx},${cur.data.node.gy}`;
                if (!harvestedLocalKeys.has(nKey)) {
                  harvestedLocalKeys.add(nKey);
                  const mC2 = mapRef.current;
                  const twN = toWorld(cur.data.node.gx, cur.data.node.gy, Number(mC2?.grid?.w ?? 200), Number(mC2?.grid?.h ?? 200), Number(mC2?.grid?.min ?? 0));
                  const grpN = buildFallingNode(cur.data.node.kind ?? "pohon");
                  if (grpN) {
                    grpN.position.set(twN.x, 0, twN.z);
                    scene.add(grpN);
                    fallingNodes.push({ group: grpN, t0: now, kind: cur.data.node.kind ?? "pohon" });
                  }
                  if (nodesGroup) {
                    scene.remove(nodesGroup);
                    disposeGroup(nodesGroup);
                    const cxN = Number(mC2?.grid?.w ?? 200) / 2 + Number(mC2?.grid?.min ?? 0);
                    const activeNodes = (mC2?.nodes ?? []).filter((nd: J) => !harvestedLocalKeys.has(`${nd.gx},${nd.gy}`));
                    nodesGroup = nodeMeshes(activeNodes, cxN);
                    scene.add(nodesGroup);
                  }
                  fetch("/api/panen", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ gx: cur.data.node.gx, gy: cur.data.node.gy, resource: resName, wargaId: id }),
                  })
                    .then((r) => r.json())
                    .then((data) => {
                      if (data.full && labelsRef.current) {
                        const popFull = document.createElement("div");
                        popFull.className = "map3d-float-badge";
                        popFull.textContent = "☕ Lumbung Penuh! Rehat...";
                        popFull.style.backgroundColor = "rgba(245, 158, 11, 0.95)";
                        labelsRef.current.appendChild(popFull);
                        floatingPops.push({ el: popFull, x: px, y: 2.6, z: pz, t0: performance.now() });
                      }
                    })
                    .catch(() => {});
                }
              }
            }
          }
          cur.lastActionCycle = currentCycle;
        } else {
          cur.actionWrap.style.display = "none";
        }

        // Action animations
        if (actionKind === "tebang" && u.toolPivot) {
          u.toolPivot.rotation.x = -0.4 + Math.sin(t * 7) * 0.9;
          if (u.armR) u.armR.rotation.x = -0.6 + Math.sin(t * 7) * 0.7;
        } else if (actionKind === "tambang" && u.toolPivot) {
          u.toolPivot.rotation.x = -0.5 + Math.sin(t * 5) * 1.0;
          if (u.armR) u.armR.rotation.x = -0.7 + Math.sin(t * 5) * 0.8;
        } else if (actionKind === "petik") {
          if (u.head) u.head.rotation.x = 0.35 + Math.sin(t * 4) * 0.15;
          if (u.armR) u.armR.rotation.x = -0.3 + Math.sin(t * 4) * 0.35;
          if (u.armL) u.armL.rotation.x = -0.3 + Math.cos(t * 4) * 0.35;
        } else if (actionKind === "rehat") {
          if (u.head) u.head.rotation.x = 0.1 + Math.sin(t * 1.5) * 0.05;
          if (u.armR) u.armR.rotation.x = 0.2;
          if (u.armL) u.armL.rotation.x = 0.2;
        } else if (actionKind === "bela_diri") {
          if (u.toolPivot) u.toolPivot.rotation.x = Math.sin(t * 8) * 0.7;
          if (u.armR) u.armR.rotation.x = Math.sin(t * 8) * 0.8;
          if (u.armL) u.armL.rotation.x = -Math.sin(t * 8) * 0.8;
        } else if (actionKind === "gotong_royong") {
          if (u.head) u.head.rotation.x = 0.2 + Math.sin(t * 2) * 0.15;
          if (u.armR) u.armR.rotation.x = -0.4 + Math.sin(t * 3) * 0.3;
          if (u.armL) u.armL.rotation.x = -0.4 + Math.cos(t * 3) * 0.3;
        } else if (actionKind === "berobat") {
          if (u.head) u.head.rotation.x = 0.2 + Math.sin(t * 2) * 0.1;
          if (u.armR) u.armR.rotation.x = -0.3 + Math.sin(t * 2) * 0.2;
          if (u.armL) u.armL.rotation.x = -0.3 + Math.cos(t * 2) * 0.2;
        } else if (actionKind === "makan") {
          if (u.head) u.head.rotation.x = 0.35 + Math.sin(t * 3) * 0.15;
          if (u.armR) u.armR.rotation.x = -0.7 + Math.sin(t * 3) * 0.25;
        } else if (actionKind === "mancing" && u.toolPivot) {
          u.toolPivot.rotation.x = -0.7 + Math.sin(t * 3) * 0.15;
          if (u.armR) u.armR.rotation.x = -0.5 + Math.sin(t * 3) * 0.1;
        }
        // RONDE 13 — Bubble EVENT-ONLY: hanya interaksi sim yang aktif
        // (ngobrol/debat/gelud/diserang/momen, jendela ~1 jam game).
        // Dialog ambient + Zzz tidak lagi dirender (tidur = pose rebah).
        let bubbleText = "";
        if (inter && typeof inter.sampai_jam === "number") {
          bubbleText = teksBubbleEvent(inter, jamNow);
        }
        const isCombatEvent = inter && inter.jenis === "diserang";
        if (bubbleText && !isSelectedW && !isCombatEvent) {
          for (const [otherId, otherCur] of wargaMap) {
            if (otherId === id) break;
            if (otherCur.bubble && otherCur.bubble.style.display !== "none") {
              const dTo = Math.hypot(cur.dx - otherCur.dx, cur.dz - otherCur.dz);
              if (dTo < 10.0) {
                bubbleText = "";
                break;
              }
            }
          }
        }
        // RONDE 12 — picu lunge hewan buas saat interaksi "diserang"
        // aktif (jendela sama dengan bubble "Tolong!"): cari hewan
        // buas label-cocok terdekat, ulang tiap 5 detik selama aktif.
        if (inter && inter.jenis === "diserang" && typeof inter.sampai_jam === "number" && bubbleInteraksiAktif(inter.sampai_jam, jamNow)) {
          if (!lungeAktif.has(id) && now - (lungeSelesai.get(id) ?? 0) > 5000) {
            const musuh = cariHewanBuas(
              [...hewanMap.values()].map((c) => ({ id: c.id, jenis: c.jenis, x: c.dx, z: c.dz })),
              String(inter.dengan ?? ""),
              cur.dx, cur.dz, 8,
              (j) => HEWAN_STYLE[j]?.label ?? j
            );
            if (musuh) lungeAktif.set(id, { hewanId: musuh, t0: now });
          }
        } else if (lungeAktif.has(id)) {
          lungeAktif.delete(id);
        }
        vec.set(px + wigX, 2.1, pz + wigZ).project(camera);
        const camDistWarga = camera.position.distanceTo(cur.group.position);
        const offscreen = vec.z > 1 || vec.z < -1 || camDistWarga > 140;
        if (!labelTampilRef.current) {
          cur.label.style.display = "none";
          cur.bubble.style.display = "none";
        } else if (tidurDalam) {
          cur.label.style.display = "none";
          cur.bubble.style.display = "none";
        } else if (offscreen) {
          cur.label.style.display = "none";
          cur.bubble.style.display = "none";
        } else {
          cur.label.style.display = "block";
          const sx = (vec.x * 0.5 + 0.5) * wRect.width;
          const sy = (-vec.y * 0.5 + 0.5) * wRect.height;
          cur.label.classList.toggle("sel", isSelectedW);
          labelAntre.push({ label: cur.label, bubble: cur.bubble, sx, sy, bubbleText, isSelectedW });
        }
      }
      if (!selFound) ring.visible = false;
      // RONDE 48 (Ide 33): penerapan rapikan PINDAH ke setelah loop
      // hewan — label hewan ikut antrean yang sama sebelum dirapikan,
      // supaya satu panggilan rapikanLabelBertumpuk menata warga +
      // hewan sekaligus. (Dulu blok ini langsung setelah loop warga.)

      // Hewan: dead reckoning sama + ANIMASI (ronde 3/4): kaki gaya
      // diagonal terikat jarak tempuh, kepala mengangguk/merumput saat diam,
      // ekor mengibas, badan bernapas saat diam, badan membungkuk saat lari.
      // Label hanya saat kamera cukup dekat.
      // RONDE 12 — bersihkan lunge yang hewan/warganya sudah hilang.
      for (const [wid, lg] of [...lungeAktif]) {
        if (!hewanMap.has(lg.hewanId) || !wargaMap.has(wid)) lungeAktif.delete(wid);
      }
      // RONDE 15 — hewan yang sedang diburu pemburu (untuk bar HP).
      const diburu = new Set<string>();
      for (const wCur of wargaMap.values()) {
        const th = (wCur.data as any).target_hewan;
        if (th) diburu.add(String(th));
      }
      for (const [, cur] of hewanMap) {
        // RONDE 5 — pacing laju server (bukan burst paceTampil): hewan
        // berjalan dengan kecepatan servernya sendiri sepanjang menit.
        // RONDE 6: snap HANYA di atas AMBANG_SNAP_DESYNC — ambang 8 lama
        // menteleport hewan tiap menit (lompatan server 60–150 tile >
        // 8, tepat setelah tiap batas jam). Display mengejar posisi
        // server dengan laju yang sama, jadi tiba bersamaan dengan
        // lompatan berikutnya tanpa teleport.
        if (Math.hypot(cur.tx - cur.dx, cur.tz - cur.dz) > AMBANG_SNAP_DESYNC) {
          cur.dx = cur.tx;
          cur.dz = cur.tz;
        }
        // Jalur memutar bangunan untuk HEWAN (2026-11-04, tindak lanjut
        // run sebelumnya): pola yang sama seperti warga — BFS waypoint
        // via jalurTampil, bukan garis lurus menembus rumah. Kunci jalur
        // = ubin tujuan server; dihitung ulang bila tujuan berubah
        // atau waypoint pertama sudah tidak masuk akal. Gagal BFS ->
        // jalur kosong = garis lurus seperti dulu (fallback aman).
        let wx = cur.tx;
        let wz = cur.tz;
        {
          const { gw, gh, gmin } = gridTampil;
          const cxT = gmin + gw / 2;
          const cyT = gmin + gh / 2;
          const tileDariH = { gx: Math.round(cur.dx + cxT - 0.5), gy: Math.round(cur.dz + cyT - 0.5) };
          const tileKeH = { gx: Math.round(cur.tx + cxT - 0.5), gy: Math.round(cur.tz + cyT - 0.5) };
          const keyH = `${tileKeH.gx},${tileKeH.gy}`;
          const jalurBasiH = !cur.jalur || cur.jalurKey !== keyH || (cur.jalur.length > 0 && Math.hypot(cur.jalur[0].x - cur.dx, cur.jalur[0].z - cur.dz) > Math.hypot(cur.tx - cur.dx, cur.tz - cur.dz) + 2);
          if (jalurBasiH) {
            const tilesH = jalurTampil(tileDariH, tileKeH, rintanganTampil, (gx, gy) => gunungTampil.some((g) => (gx - g.cx) ** 2 + (gy - g.cy) ** 2 <= g.r * g.r));
            cur.jalurKey = keyH;
            cur.jalur = tilesH ? tilesH.map((t) => toWorld(t.gx, t.gy, gw, gh, gmin)) : [];
          }
          if (cur.jalur && cur.jalur.length > 0) {
            wx = cur.jalur[0].x;
            wz = cur.jalur[0].z;
          }
        }
        const stepHewan = langkahDisplay(cur.dx, cur.dz, wx, wz, cur.speedPerSec, dt);
        if (stepHewan.tiba && cur.jalur && cur.jalur.length > 0) cur.jalur.shift();
        const px = stepHewan.x;
        const pz = stepHewan.z;
        const stepH = stepHewan.moved;
        const bergerak = stepH > 0;
        if (bergerak) {
          cur.group.rotation.y = Math.atan2(wx - cur.dx, wz - cur.dz);
        }
        const hu = cur.group.userData as any;
        if (bergerak && stepH > 0) {
          cur.cycle += langkahHewan(stepH);
          if (hu.kaki) {
            for (const key of ["depanKiri", "depanKanan", "belakangKiri", "belakangKanan"] as const) {
              if (hu.kaki[key]) hu.kaki[key].rotation.x = sudutKakiHewan(cur.cycle, key);
            }
          }
        } else {
          if (hu.kaki) {
            for (const key of ["depanKiri", "depanKanan", "belakangKiri", "belakangKanan"] as const) {
              if (hu.kaki[key]) hu.kaki[key].rotation.x *= 0.8;
            }
          }
        }
        // Kepala: merumput/mengangguk saat diam, tegak saat bergerak.
        if (hu.head) {
          const graze = bergerak ? 0 : Math.max(0, Math.sin(t * 0.9 + cur.cycle)) * 0.16;
          hu.head.position.y = hu.headBaseY - graze;
          hu.head.rotation.x = bergerak ? 0 : Math.sin(t * 1.4 + cur.cycle) * 0.12;
        }
        // Ekor mengibas (serigala); badan bernapas saat diam.
        if (hu.tail) hu.tail.rotation.z = 0.4 + Math.sin(t * 3 + cur.cycle) * 0.18;
        if (hu.body) {
          const napas = bergerak ? 0 : Math.sin(t * 2 + cur.cycle) * 0.03;
          hu.body.scale.y = hu.bodyBaseScaleY * (1 + napas);
          hu.body.rotation.x = bergerak ? -0.08 : 0;
        }
        const yH = bergerak ? Math.abs(Math.sin(cur.cycle)) * 0.05 : 0;
        cur.group.position.set(px, yH, pz);
        // RONDE 12 — lunge hewan buas: menerjang ke arah warga yang
        // diserang lalu kembali (0,9 detik, sinus pulang-pergi),
        // sambil menghadap warga (bukan arah jalannya sendiri).
        for (const [wid, lg] of [...lungeAktif]) {
          if (lg.hewanId !== cur.id) continue;
          const wPos = wargaMap.get(wid);
          if (!wPos) { lungeAktif.delete(wid); continue; }
          const ph = (now - lg.t0) / 900;
          if (ph >= 1) { lungeAktif.delete(wid); lungeSelesai.set(wid, now); continue; }
          const ddx = wPos.dx - px;
          const ddz = wPos.dz - pz;
          const dist = Math.hypot(ddx, ddz) || 1;
          const mag = Math.sin(ph * Math.PI) * Math.min(dist * 0.7, 3);
          cur.group.position.x += (ddx / dist) * mag;
          cur.group.position.z += (ddz / dist) * mag;
          cur.group.rotation.y = Math.atan2(ddx, ddz);
        }
        cur.dx = px;
        cur.dz = pz;
        vec.set(px, 1.4, pz).project(camera);
        if (!labelTampilRef.current || vec.z > 1 || vec.z < -1 || camDist > 130) {
          cur.label.style.display = "none";
        } else {
          cur.label.style.display = "block";
          const sx = (vec.x * 0.5 + 0.5) * wRect.width;
          const sy = (-vec.y * 0.5 + 0.5) * wRect.height;
          // RONDE 48 (Ide 33): label hewan TIDAK diposisi langsung —
          // masuk antrean yang sama dengan label warga; transform
          // diterapkan sekali setelah loop hewan (blok rapikan di
          // bawah), supaya hewan + warga dirapikan bersama.
          labelAntre.push({ label: cur.label, bubble: null, sx, sy, bubbleText: "", isSelectedW: false });
          // RONDE 15 — bar HP hewan: tampil saat terluka (hp < maks)
          // atau sedang diburu; warna hijau >50%, kuning >25%, merah.
          const pctHp = lebarBarHp(cur.hp, cur.hpMax);
          const showHp = cur.hp < cur.hpMax || diburu.has(cur.id);
          cur.hpBar.style.display = showHp ? "block" : "none";
          if (showHp) {
            cur.hpFill.style.width = `${pctHp}%`;
            cur.hpFill.style.background = pctHp > 50 ? "#4ade80" : pctHp > 25 ? "#facc15" : "#ef4444";
          }
        }
      }

      // RONDE 22 — rapikan label bertumpuk (r48: antrean kini gabungan
      // warga + hewan): label yang berkerumun digeser ke bawah supaya
      // semua nama tetap terbaca; bubble ikut labelnya (tetap di atas
      // label). Entri hewan tidak punya bubble — dijaga null.
      if (labelAntre.length > 0) {
        const syBaru = rapikanLabelBertumpuk(labelAntre.map((a) => ({ x: a.sx, y: a.sy })));
        labelAntre.forEach((a, i) => {
          const syA = syBaru[i];
          a.label.style.transform = `translate(-50%, -100%) translate(${a.sx.toFixed(1)}px, ${syA.toFixed(1)}px)`;
          if (!a.bubble) return;
          if (a.bubbleText) {
            a.bubble.style.display = "block";
            if (a.bubble.textContent !== a.bubbleText) a.bubble.textContent = a.bubbleText;
            const bubbleOffsetY = a.isSelectedW ? 54 : 32;
            a.bubble.style.transform = `translate(-50%, -100%) translate(${a.sx.toFixed(1)}px, ${(syA - bubbleOffsetY).toFixed(1)}px)`;
          } else {
            a.bubble.style.display = "none";
          }
        });
      }

      // RONDE 10 — hewan jatuh: rebah + tenggelam 1,2 detik lalu hapus.
      for (let fi = fallingAnimals.length - 1; fi >= 0; fi--) {
        const f = fallingAnimals[fi];
        const pr = (now - f.t0) / 1200;
        if (pr >= 1) {
          hewanGroup.remove(f.group);
          disposeGroup(f.group);
          fallingAnimals.splice(fi, 1);
        } else {
          f.group.rotation.z = pr * 1.4;
          f.group.position.y = -0.2 * pr;
        }
      }
      // RONDE 15 — node tumbang/hancur: pohon roboh miring, lainnya
      // menyusut + tenggelam, semua fade-out, total 1,5 detik.
      for (let fi = fallingNodes.length - 1; fi >= 0; fi--) {
        const f = fallingNodes[fi];
        const pr = (now - f.t0) / 1500;
        if (pr >= 1) {
          scene.remove(f.group);
          disposeGroup(f.group);
          fallingNodes.splice(fi, 1);
        } else {
          f.group.traverse((o) => {
            if (o instanceof THREE.Mesh) (o.material as THREE.MeshLambertMaterial).opacity = 1 - pr * 0.9;
          });
          if (f.kind === "pohon") {
            f.group.rotation.z = pr * 1.35;
            f.group.position.y = -0.2 * pr;
          } else {
            const s = 1 - pr;
            f.group.scale.set(s, s, s);
            f.group.position.y = -0.3 * pr;
          }
        }
      }
      // RONDE 10 — serpihan: gerak + gravitasi, hilang 0,8 detik.
      for (const c of chips) {
        if (c.life <= 0) continue;
        c.life -= dt;
        c.mesh.position.x += c.vx * dt;
        c.mesh.position.z += c.vz * dt;
        c.mesh.position.y += c.vy * dt;
        c.vy -= 4 * dt;
        if (c.life <= 0) c.mesh.visible = false;
      }
      // RONDE 10 — proyektil: lurus + busur 0,6 detik, lalu hapus.
      for (let pi = proyektils.length - 1; pi >= 0; pi--) {
        const pr2 = proyektils[pi];
        const tt = (now - pr2.t0) / 600;
        if (tt >= 1) {
          scene.remove(pr2.mesh);
          disposeGroup(pr2.mesh);
          proyektils.splice(pi, 1);
        } else {
          const px2 = pr2.from.x + (pr2.to.x - pr2.from.x) * tt;
          const pz2 = pr2.from.z + (pr2.to.z - pr2.from.z) * tt;
          const py2 = pr2.from.y + (pr2.to.y - pr2.from.y) * tt + Math.sin(Math.PI * tt) * 1.2;
          pr2.mesh.position.set(px2, py2, pz2);
          pr2.mesh.lookAt(pr2.to.x, py2, pr2.to.z);
        }
      }

      // SFX proximity tiap ~6 frame (snapshot ringkas -> engine audio).
      if (syncTick % 6 === 0) {
        const dirV = new THREE.Vector3();
        camera.getWorldDirection(dirV);
        const rightV = new THREE.Vector3().crossVectors(dirV, new THREE.Vector3(0, 1, 0)).normalize();
        const mA = mapRef.current;
        const gwA = Number(mA?.grid?.w ?? 200);
        const ghA = Number(mA?.grid?.h ?? 200);
        const gminA = Number(mA?.grid?.min ?? 0);
        const cxA = gminA + gwA / 2;
        const apiPos = (mA?.placements ?? [])
          .filter((p: J) => String(p.kind) === "api_unggun")
          .map((p: J) => ({
            x: Number(p.gx) + Number(p.w ?? 1) / 2 - cxA,
            z: Number(p.gy) + Number(p.h ?? 1) / 2 - cxA,
          }));
        const riverArr: number[] = mA?.riverXs ?? [];
        let jarakAir = 999;
        if (riverArr.length) {
          const row = Math.max(0, Math.min(riverArr.length - 1, Math.round(controls.target.z + cxA) - gminA));
          jarakAir = Math.abs(controls.target.x - (riverArr[row] + 1 - cxA));
        }
        updateAudioScene({
          camX: camera.position.x,
          camY: camera.position.y,
          camZ: camera.position.z,
          rightX: rightV.x,
          rightZ: rightV.z,
          // RONDE 23 — ambien: fase + cuaca ikut snapshot supaya lapis
          // angin/hujan/malam mengikuti jam dan cuaca game.
          faseWaktu: faseRef.current,
          cuaca,
          warga: [...wargaMap.values()].map((c) => ({
            id: String(c.data.id ?? ""),
            x: c.dx,
            z: c.dz,
            bergerak: Math.hypot(c.tx - c.dx, c.tz - c.dz) > 0.03,
            fase: String(c.data.fase_siklus ?? ""),
            bunyiPerkakas: SFX_PERKAKAS[String(c.data.peran ?? "")] ?? null,
          })),
          api: apiPos,
          jarakAir,
          hewan: [...hewanMap.values()].map((c) => ({ id: c.id, jenis: c.jenis, x: c.dx, z: c.dz })),
        });
      }

      // Label konstruksi (progres) diproyeksikan.
      for (const [, lbl] of konstruksiLabels) {
        const pos = (lbl as any)._pos as { x: number; z: number } | undefined;
        if (!pos) continue;
        vec.set(pos.x, 2.2, pos.z).project(camera);
        if (vec.z > 1 || vec.z < -1) {
          lbl.style.display = "none";
        } else {
          lbl.style.display = "block";
          const sx = (vec.x * 0.5 + 0.5) * wRect.width;
          const sy = (-vec.y * 0.5 + 0.5) * wRect.height;
          lbl.style.transform = `translate(-50%, -100%) translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
        }
      }
      // Pekerja konstruksi mengayun palu.
      konstruksiGroup.traverse((o) => {
        if (o instanceof THREE.Group && o.userData.isWorker) {
          const u = o.userData as any;
          if (u.toolPivot) u.toolPivot.rotation.x = Math.sin(t * 9) * 0.55 - 0.2;
        }
      });

      for (let i = floatingPops.length - 1; i >= 0; i--) {
        const fp = floatingPops[i];
        const age = now - fp.t0;
        if (age > 1600) {
          if (fp.el.parentElement) fp.el.parentElement.removeChild(fp.el);
          floatingPops.splice(i, 1);
          continue;
        }
        const prog = age / 1600;
        vec.set(fp.x, fp.y + prog * 1.6, fp.z).project(camera);
        if (vec.z > 1 || vec.z < -1) {
          fp.el.style.display = "none";
        } else {
          fp.el.style.display = "block";
          const sx = (vec.x * 0.5 + 0.5) * wRect.width;
          const sy = (-vec.y * 0.5 + 0.5) * wRect.height;
          fp.el.style.transform = `translate(-50%, -100%) translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(${1 + prog * 0.2})`;
          fp.el.style.opacity = `${1 - prog * prog}`;
        }
      }
      renderer.render(scene, camera);

      // RONDE 49 (Ide 27) — BASELINE draw call sekali saat scene mapan:
      // `renderer.info` adalah pengukur resmi (hontran/Glitchless);
      // dibaca TEPAT SETELAH render (info direset tiap render call,
      // three 0.187) supaya angkanya milik frame yang baru di-render.
      // Sampel setelah ~120 frame agar lonjakan awal (kompilasi shader,
      // upload tekstur) tidak masuk baseline; flag di closure effect
      // supaya tidak di-log ulang saat tab kembali dari hidden (Ide 9
      // memulai ulang loop yang sama). Display-only: console.info saja,
      // tanpa ubah render/sim; angka dicatat di CHANGELOG sebagai
      // baseline sebelum instancing (Ide 28).
      if (!baselineTercatat) {
        frameBaseline++;
        if (frameBaseline >= 120) {
          baselineTercatat = true;
          const info = renderer.info;
          console.info("[Nusantara baseline render]", {
            drawCalls: info.render.calls,
            triangles: info.render.triangles,
            geometries: info.memory.geometries,
            textures: info.memory.textures,
            programs: info.programs?.length ?? 0,
            pixelRatio: renderer.getPixelRatio(),
          });
        }
      }
    };
    raf = requestAnimationFrame(loop);

    // Jeda loop render saat tab disembunyikan (Ide 9, 2026-11-04):
    // browser memang sudah menahan RAF di tab hidden, tapi frame yang
    // tertunda tetap terjadwal; membatalkannya eksplisit + reset `last`
    // saat kembali mencegah frame basi, loop ganda, dan lompatan dt.
    // Sim TIDAK ikut dijeda: jam game jalan di server, jadi saat kembali
    // desa tampil di waktu server terbaru. Penjaga raf = 0 memastikan
    // hanya satu loop yang berjalan.
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (analogIntervalRef.current) clearInterval(analogIntervalRef.current);
      if (zoomIntervalRef.current) clearInterval(zoomIntervalRef.current);
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("wheel", onWheel);
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.InstancedMesh || o instanceof THREE.Points) {
          (o as THREE.Mesh).geometry?.dispose();
          const mat = (o as THREE.Mesh).material as THREE.Material | THREE.Material[];
          if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
          else mat?.dispose();
        }
      });
      riverTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === wrap) wrap.removeChild(renderer.domElement);
      labelsEl.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Analog kamera: geser target ke arah vektor LAYAR (nx = kanan,
  // ny = atas-layar, masing-masing -1..1). Target digeser saja —
  // update() OrbitControls tiap frame menerjemahkan kamera ikut (sama
  // seperti PAN bawaan). Seret analog juga melepas kunci follow, sama
  // seperti mulai menggeser.
  const geserKameraVektor = (nx: number, ny: number, langkah: number) => {
    const p = panRef.current;
    if (!p) return;
    if (followRef.current) onLepasKunciRef.current?.();
    const target = p.kontrol.target as { x: number; z: number };
    const px = p.kamera.position.x - target.x;
    const pz = p.kamera.position.z - target.z;
    if (px * px + pz * pz < 1e-6) return;
    // hadap = arah pandang kamera di bidang tanah (target - posisi).
    let hx = -px;
    let hz = -pz;
    const hl = Math.hypot(hx, hz);
    hx /= hl;
    hz /= hl;
    // kanan layar = hadap × atas (0,1,0) = (-hz, hx) di bidang XZ.
    const kx = -hz;
    const kz = hx;
    target.x += (kx * nx + hx * ny) * langkah;
    target.z += (kz * nx + hz * ny) * langkah;
  };
  // Jejari gerak knop (px): dasar 120 - knop 52, dibagi 2.
  const MAX_ANALOG = 34;
  const aturKnop = (dx: number, dy: number) => {
    const el = analogKnopRef.current;
    if (el) el.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const gerakAnalog = (e: React.PointerEvent<HTMLDivElement>) => {
    // Hanya saat diseret (pointerdown dulu) — hover mouse desktop
    // tidak boleh menggerakkan knop.
    if (!analogSeretRef.current) return;
    const dasar = analogDasarRef.current;
    if (!dasar) return;
    const r = dasar.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const mag = Math.hypot(dx, dy);
    if (mag > MAX_ANALOG) {
      dx = (dx / mag) * MAX_ANALOG;
      dy = (dy / mag) * MAX_ANALOG;
    }
    analogRef.current = { nx: dx / MAX_ANALOG, ny: -dy / MAX_ANALOG };
    aturKnop(dx, dy);
  };
  const mulaiAnalog = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    analogSeretRef.current = true;
    const p = panRef.current;
    if (p) {
      if (followRef.current) onLepasKunciRef.current?.();
      p.batalAnimasi();
    }
    gerakAnalog(e);
    if (analogIntervalRef.current) clearInterval(analogIntervalRef.current);
    // Tiap 50 ms: geser sesuai arah + besar defleksi (penuh = 20 unit/detik).
    analogIntervalRef.current = setInterval(() => {
      const v = analogRef.current;
      const mag = Math.hypot(v.nx, v.ny);
      if (mag > 0.15) geserKameraVektor(v.nx, v.ny, mag * 1.0);
    }, 50);
  };
  const berhentiAnalog = () => {
    analogSeretRef.current = false;
    if (analogIntervalRef.current) {
      clearInterval(analogIntervalRef.current);
      analogIntervalRef.current = null;
    }
    analogRef.current = { nx: 0, ny: 0 };
    aturKnop(0, 0);
  };
  // Naik/turun kamera (zoom): geser posisi di sepanjang sumbu pandang.
  // Naik = menjauh (lihat lebih luas), turun = mendekat (lihat dekat).
  // update() OrbitControls menjepit jarak ke [minDistance, maxDistance].
  // Zoom TIDAK melepas follow (target tetap mengikuti warga).
  const zoomKamera = (arah: "naik" | "turun") => {
    const p = panRef.current;
    if (!p) return;
    p.batalAnimasi();
    const target = p.kontrol.target as { x: number; y: number; z: number };
    const pos = p.kamera.position as { x: number; y: number; z: number };
    let dx = pos.x - target.x;
    let dy = pos.y - target.y;
    let dz = pos.z - target.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < 1e-6) return;
    dx /= dist;
    dy /= dist;
    dz /= dist;
    const langkah = Math.max(0.5, dist * 0.06);
    const s = arah === "naik" ? langkah : -langkah;
    pos.x += dx * s;
    pos.y += dy * s;
    pos.z += dz * s;
  };
  // Tahan = zoom terus; lepas = berhenti. Capture pointer supaya
  // pointerup di luar tombol tetap menghentikan zoom.
  const mulaiZoom = (arah: "naik" | "turun") => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    zoomKamera(arah);
    if (zoomIntervalRef.current) clearInterval(zoomIntervalRef.current);
    zoomIntervalRef.current = setInterval(() => zoomKamera(arah), 50);
  };
  const berhentiZoom = () => {
    if (zoomIntervalRef.current) {
      clearInterval(zoomIntervalRef.current);
      zoomIntervalRef.current = null;
    }
  };

  return (
    <div ref={wrapRef} className="map3d-wrap">
      <div ref={labelsRef} className="map3d-labels" />
      {/* Analog kamera kiri (permintaan user 2026-11-04, ganti D-pad):
          klaster pojok kiri-bawah peta, z 10 (di atas kanvas + label
          z 5, di bawah modal z 50+). Sembunyikan -> tombol 🕹️ di
          pojok yang sama untuk memunculkan lagi. */}
      {analogTampil ? (
        <div className="analog-kamera">
          <button type="button" title="Sembunyikan kontrol kamera" aria-label="Sembunyikan kontrol kamera" className="analog-sembunyi" onClick={() => setAnalogTampil(false)}>✕</button>
          <button type="button" title="Kamera naik (lihat lebih luas)" aria-label="Kamera naik" className="analog-zoom-btn" onPointerDown={mulaiZoom("naik")} onPointerUp={berhentiZoom} onPointerLeave={berhentiZoom} onPointerCancel={berhentiZoom} onContextMenu={(e) => e.preventDefault()}>▲</button>
          <button type="button" title="Kamera turun (lihat lebih dekat)" aria-label="Kamera turun" className="analog-zoom-btn" onPointerDown={mulaiZoom("turun")} onPointerUp={berhentiZoom} onPointerLeave={berhentiZoom} onPointerCancel={berhentiZoom} onContextMenu={(e) => e.preventDefault()}>▼</button>
          <div ref={analogDasarRef} className="analog-dasar" title="Analog kamera: seret ke 8 arah untuk menggeser peta" onPointerDown={mulaiAnalog} onPointerMove={gerakAnalog} onPointerUp={berhentiAnalog} onPointerLeave={berhentiAnalog} onPointerCancel={berhentiAnalog} onContextMenu={(e) => e.preventDefault()}>
            <div ref={analogKnopRef} className="analog-knop" />
          </div>
        </div>
      ) : (
        <button type="button" title="Tampilkan kontrol kamera" aria-label="Tampilkan kontrol kamera" className="analog-muncul" onClick={() => setAnalogTampil(true)}>🕹️</button>
      )}
      {!map && <div className="map3d-loading">Memuat peta 3D…</div>}
    </div>
  );
}
