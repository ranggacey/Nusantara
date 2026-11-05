import * as THREE from "three";

// ==========================================
// FANTASY VILLAGE 3D ASSETS (LEVEL 1, 2, 3)
// ==========================================

// Shared Materials Cache
let villageMats: {
  stoneBase: THREE.MeshStandardMaterial;
  stoneDark: THREE.MeshStandardMaterial;
  woodL1: THREE.MeshStandardMaterial;
  woodL2: THREE.MeshStandardMaterial;
  woodL3: THREE.MeshStandardMaterial;
  woodTrim: THREE.MeshStandardMaterial;
  roofL1: THREE.MeshStandardMaterial;
  roofL2: THREE.MeshStandardMaterial;
  roofL3: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  leaf: THREE.MeshStandardMaterial;
} | null = null;

function getVillageMats() {
  if (villageMats) return villageMats;  villageMats = {
    stoneBase: new THREE.MeshStandardMaterial({ color: "#808080", roughness: 0.8 }),
    stoneDark: new THREE.MeshStandardMaterial({ color: "#555555", roughness: 0.9 }),
    woodL1: new THREE.MeshStandardMaterial({ color: "#A08060", roughness: 0.9 }),
    woodL2: new THREE.MeshStandardMaterial({ color: "#8B5A2B", roughness: 0.8 }),
    woodL3: new THREE.MeshStandardMaterial({ color: "#5C3A21", roughness: 0.7 }),
    woodTrim: new THREE.MeshStandardMaterial({ color: "#3A2010", roughness: 0.9 }),
    roofL1: new THREE.MeshStandardMaterial({ color: "#8B5A2B", roughness: 1.0 }),
    roofL2: new THREE.MeshStandardMaterial({ color: "#4A3B32", roughness: 0.9 }),
    roofL3: new THREE.MeshStandardMaterial({ color: "#2B2B36", roughness: 0.8 }),
    metal: new THREE.MeshStandardMaterial({ color: "#222222", roughness: 0.5, metalness: 0.8 }),
    glass: new THREE.MeshStandardMaterial({ color: "#FADB5F", emissive: new THREE.Color("#886600"), roughness: 0.2 }),
    leaf: new THREE.MeshStandardMaterial({ color: "#228B22", roughness: 0.9 }),
  };
  return villageMats;
}

// Predikat material bersama (r36, penutup celah audit Ide 30):
// material di cache module-level ini dipakai ulang tiap rebuild
// bangunan, jadi disposeGroup TIDAK boleh membuangnya — membuang
// lalu render ulang hanya memaksa Three mengunggah ulang shader/
// program yang sama. Cleanup unmount (traverse akhir komponen)
// tetap membuang semua, karena di sana komponen benar-benar lepas.
export function isVillageMaterial(mat: THREE.Material): boolean {
  return (Object.values(getVillageMats()) as THREE.Material[]).includes(mat);
}

function enableShadows(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

function createPitchedRoof(width: number, height: number, depth: number, material: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, height);
  shape.lineTo(-width / 2, 0);

  const extrudeSettings = { depth, bevelEnabled: false };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.translate(0, 0, -depth / 2);
  const roof = new THREE.Mesh(geo, material);

  const baseGeo = new THREE.BoxGeometry(width, 0.1, depth);
  const base = new THREE.Mesh(baseGeo, material);
  base.position.y = 0.05;
  roof.add(base);

  enableShadows(roof);
  return roof;
}

function createWindow(w: number, h: number): THREE.Group {
  const mats = getVillageMats();
  const group = new THREE.Group();

  const frameGeo = new THREE.BoxGeometry(w, h, 0.2);
  const frame = new THREE.Mesh(frameGeo, mats.woodTrim);

  const glassGeo = new THREE.BoxGeometry(Math.max(0.1, w - 0.2), Math.max(0.1, h - 0.2), 0.1);
  const glass = new THREE.Mesh(glassGeo, mats.glass);

  const vBarGeo = new THREE.BoxGeometry(0.1, Math.max(0.1, h - 0.1), 0.25);
  const vBar = new THREE.Mesh(vBarGeo, mats.woodTrim);
  const hBarGeo = new THREE.BoxGeometry(Math.max(0.1, w - 0.1), 0.1, 0.25);
  const hBar = new THREE.Mesh(hBarGeo, mats.woodTrim);

  group.add(frame, glass, vBar, hBar);
  enableShadows(group);
  return group;
}

function createDoor(w: number, h: number, isDouble = false): THREE.Group {
  const mats = getVillageMats();
  const group = new THREE.Group();

  const frameGeo = new THREE.BoxGeometry(w + 0.4, h + 0.2, 0.3);
  const frame = new THREE.Mesh(frameGeo, mats.woodTrim);
  frame.position.y = h / 2;

  const panelGeo = new THREE.BoxGeometry(w, h, 0.15);
  const panelMat = new THREE.MeshStandardMaterial({ color: "#4A2A18" });
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(0, h / 2, 0.05);

  if (isDouble) {
    const splitGeo = new THREE.BoxGeometry(0.05, h, 0.2);
    const split = new THREE.Mesh(splitGeo, mats.woodTrim);
    split.position.set(0, h / 2, 0.1);
    group.add(split);

    const handleGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const h1 = new THREE.Mesh(handleGeo, mats.metal);
    h1.position.set(-0.2, h / 2, 0.15);
    const h2 = new THREE.Mesh(handleGeo, mats.metal);
    h2.position.set(0.2, h / 2, 0.15);
    group.add(h1, h2);
  } else {
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), mats.metal);
    handle.position.set(w / 2 - 0.2, h / 2, 0.15);
    group.add(handle);
  }

  group.add(frame, panel);
  enableShadows(group);
  return group;
}

function createLantern(): THREE.Group {
  const mats = getVillageMats();
  const group = new THREE.Group();

  const capGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.1, 4);
  const top = new THREE.Mesh(capGeo, mats.metal);
  top.position.y = 0.5;
  const base = new THREE.Mesh(capGeo, mats.metal);

  const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 4);
  const body = new THREE.Mesh(bodyGeo, mats.glass);
  body.position.y = 0.25;

  const light = new THREE.PointLight(0xfadb5f, 0.8, 4);
  light.position.y = 0.25;

  group.add(top, body, base, light);

  const mountGeo = new THREE.BoxGeometry(0.1, 0.1, 0.4);
  const mount = new THREE.Mesh(mountGeo, mats.metal);
  mount.position.set(0, 0.4, -0.2);
  group.add(mount);

  enableShadows(group);
  return group;
}

function createTimberFrames(w: number, h: number, d: number): THREE.Group {
  const mats = getVillageMats();
  const group = new THREE.Group();
  const t = 0.15;
  const mat = mats.woodTrim;

  const vGeo = new THREE.BoxGeometry(t, h + t, t);
  const poses = [
    [-w / 2, 0, -d / 2],
    [w / 2, 0, -d / 2],
    [-w / 2, 0, d / 2],
    [w / 2, 0, d / 2],
  ];
  poses.forEach((p) => {
    const m = new THREE.Mesh(vGeo, mat);
    m.position.set(p[0], p[1], p[2]);
    group.add(m);
  });

  const hGeo = new THREE.BoxGeometry(w, t, t);
  const dGeo = new THREE.BoxGeometry(t, t, d);

  [-h / 2, h / 2].forEach((y) => {
    const m1 = new THREE.Mesh(hGeo, mat);
    m1.position.set(0, y, -d / 2);
    const m2 = new THREE.Mesh(hGeo, mat);
    m2.position.set(0, y, d / 2);
    const m3 = new THREE.Mesh(dGeo, mat);
    m3.position.set(-w / 2, y, 0);
    const m4 = new THREE.Mesh(dGeo, mat);
    m4.position.set(w / 2, y, 0);
    group.add(m1, m2, m3, m4);
  });

  enableShadows(group);
  return group;
}

// ==========================================
// 1. HOUSE LEVEL 1: RUMAH KAYU BERSAHAJA
// ==========================================
export function buildFantasyHouseLevel1(): THREE.Group {
  const mats = getVillageMats();
  const house = new THREE.Group();

  const fWidth = 4.2,
    fHeight = 0.6,
    fDepth = 4.2;
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(fWidth, fHeight, fDepth), mats.stoneBase);
  foundation.position.y = fHeight / 2;
  house.add(foundation);

  const bWidth = 3.8,
    bHeight = 2.8,
    bDepth = 3.8;
  const body = new THREE.Mesh(new THREE.BoxGeometry(bWidth, bHeight, bDepth), mats.woodL1);
  body.position.y = fHeight + bHeight / 2;
  house.add(body);

  const trim = createTimberFrames(bWidth, bHeight, bDepth);
  trim.position.copy(body.position);
  house.add(trim);

  const roofH = 2.2;
  const roof = createPitchedRoof(4.6, roofH, 4.6, mats.roofL1);
  roof.position.y = fHeight + bHeight;
  house.add(roof);

  // Front Door (facing +Z / South)
  const door = createDoor(1.2, 2.0);
  door.position.set(0, fHeight, bDepth / 2 + 0.05);
  house.add(door);

  const win = createWindow(1.0, 1.0);
  win.position.set(-1.2, fHeight + 1.2, bDepth / 2 + 0.05);
  house.add(win);

  const win2 = createWindow(1.0, 1.0);
  win2.rotation.y = Math.PI / 2;
  win2.position.set(bWidth / 2 + 0.05, fHeight + 1.2, 0);
  house.add(win2);

  const chimW = 0.8,
    chimH = 4.5,
    chimD = 1.0;
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(chimW, chimH, chimD), mats.stoneBase);
  chimney.position.set(-bWidth / 2 - 0.2, chimH / 2, 0);
  house.add(chimney);

  // Firewood stack
  const logGeo = new THREE.CylinderGeometry(0.15, 0.15, 1, 6);
  for (let i = 0; i < 5; i++) {
    const log = new THREE.Mesh(logGeo, mats.woodTrim);
    log.rotation.x = Math.PI / 2;
    log.position.set(bWidth / 2 + 0.5, 0.15 + (i % 2) * 0.25, 0.5 + Math.random() * 0.1);
    house.add(log);
  }

  enableShadows(house);
  // Scale to fit ~2x2 game tile footprint (+30% size)
  house.scale.set(0.625, 0.625, 0.625);
  return house;
}

// ==========================================
// 2. HOUSE LEVEL 2: RUMAH SAYAP & BERAS BARIL
// ==========================================
export function buildFantasyHouseLevel2(): THREE.Group {
  const mats = getVillageMats();
  const house = new THREE.Group();

  const fh = 0.8;
  const mw = 4.8,
    mh = 3.5,
    md = 4.8;
  const ww = 2.8,
    wh = 2.8,
    wd = 3.0;

  const fMain = new THREE.Mesh(new THREE.BoxGeometry(mw + 0.4, fh, md + 0.4), mats.stoneBase);
  fMain.position.y = fh / 2;
  const fWing = new THREE.Mesh(new THREE.BoxGeometry(ww + 0.4, fh, wd + 0.4), mats.stoneBase);
  fWing.position.set(mw / 2 + ww / 2 - 0.5, fh / 2, 0);
  house.add(fMain, fWing);

  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(mw, mh, md), mats.woodL2);
  mainBody.position.y = fh + mh / 2;
  house.add(mainBody);

  const mainTrim = createTimberFrames(mw, mh, md);
  mainTrim.position.copy(mainBody.position);
  house.add(mainTrim);

  const wingBody = new THREE.Mesh(new THREE.BoxGeometry(ww, wh, wd), mats.woodL2);
  wingBody.position.set(mw / 2 + ww / 2 - 0.5, fh + wh / 2, 0);
  house.add(wingBody);

  const wingTrim = createTimberFrames(ww, wh, wd);
  wingTrim.position.copy(wingBody.position);
  house.add(wingTrim);

  const mainRoofH = 3.0;
  const mainRoof = createPitchedRoof(mw + 1.0, mainRoofH, md + 1.0, mats.roofL2);
  mainRoof.position.y = fh + mh;
  house.add(mainRoof);

  const wingRoofH = 2.0;
  const wingRoof = createPitchedRoof(ww + 0.8, wingRoofH, wd + 0.8, mats.roofL2);
  wingRoof.rotation.y = Math.PI / 2;
  wingRoof.position.set(mw / 2 + ww / 2 - 0.5, fh + wh, 0);
  house.add(wingRoof);

  // Porch / Canopy
  const porchW = 2.5,
    porchD = 1.5;
  const porchFloor = new THREE.Mesh(new THREE.BoxGeometry(porchW, 0.2, porchD), mats.woodL2);
  porchFloor.position.set(0, fh + 0.1, md / 2 + porchD / 2);
  house.add(porchFloor);

  const pillarGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8);
  const p1 = new THREE.Mesh(pillarGeo, mats.woodTrim);
  p1.position.set(-porchW / 2 + 0.2, fh + 1.25, md / 2 + porchD - 0.2);
  const p2 = new THREE.Mesh(pillarGeo, mats.woodTrim);
  p2.position.set(porchW / 2 - 0.2, fh + 1.25, md / 2 + porchD - 0.2);
  house.add(p1, p2);

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(porchW + 0.4, 0.2, porchD + 0.4), mats.roofL2);
  canopy.rotation.x = -Math.PI / 8;
  canopy.position.set(0, fh + 2.5, md / 2 + porchD / 2);
  house.add(canopy);

  // Double Door facing +Z
  const door = createDoor(1.6, 2.2, true);
  door.position.set(0, fh, md / 2 + 0.05);
  house.add(door);

  const lantern = createLantern();
  lantern.position.set(-1.2, fh + 1.8, md / 2 + 0.2);
  house.add(lantern);

  const w1 = createWindow(1.2, 1.2);
  w1.rotation.y = Math.PI / 2;
  w1.position.set(mw / 2 + ww + 0.05 - 0.5, fh + 1.2, 0);
  house.add(w1);

  const w2 = createWindow(1.2, 1.2);
  w2.rotation.y = -Math.PI / 2;
  w2.position.set(-mw / 2 - 0.05, fh + 1.2, 0);
  house.add(w2);

  // Decorative Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12);
  const barrel = new THREE.Mesh(barrelGeo, mats.woodTrim);
  barrel.position.set(porchW / 2 - 0.4, fh + 0.4, md / 2 + 0.5);
  const ringGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.05, 12);
  const r1 = new THREE.Mesh(ringGeo, mats.metal);
  r1.position.y = 0.2;
  const r2 = new THREE.Mesh(ringGeo, mats.metal);
  r2.position.y = -0.2;
  barrel.add(r1, r2);
  house.add(barrel);

  enableShadows(house);
  // Scale to fit ~2x2 game tile footprint (+30% size)
  house.scale.set(0.575, 0.575, 0.575);
  return house;
}

// ==========================================
// 3. HOUSE LEVEL 3: MANOR MEGAH 2 LANTAI
// ==========================================
export function buildFantasyHouseLevel3(): THREE.Group {
  const mats = getVillageMats();
  const house = new THREE.Group();

  const fh = 1.0;
  const mw = 6.0,
    mh = 6.0,
    md = 5.0;
  const fw = 4.0,
    fh2 = 7.0,
    fd = 3.0;
  const sideW = 2.5,
    sideH = 4.0,
    sideD = 4.0;

  const fBase = new THREE.Mesh(new THREE.BoxGeometry(11, fh, 7), mats.stoneBase);
  fBase.position.y = fh / 2;
  const fFront = new THREE.Mesh(new THREE.BoxGeometry(fw + 1, fh, fd + 1), mats.stoneBase);
  fFront.position.set(0, fh / 2, md / 2 + fd / 2);
  house.add(fBase, fFront);

  const fTrim = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.2, 7.2), mats.stoneDark);
  fTrim.position.y = fh;
  house.add(fTrim);

  // Main Body 2 Story
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(mw, mh, md), mats.woodL3);
  mainBody.position.set(0, fh + mh / 2, 0);
  house.add(mainBody);

  const mainTrim = createTimberFrames(mw, mh, md);
  mainTrim.position.copy(mainBody.position);
  house.add(mainTrim);

  const midTrim = new THREE.Mesh(new THREE.BoxGeometry(mw + 0.2, 0.2, md + 0.2), mats.woodTrim);
  midTrim.position.set(0, fh + 3.0, 0);
  house.add(midTrim);

  // Side Wings
  [-1, 1].forEach((dir) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(sideW, sideH, sideD), mats.woodL3);
    wing.position.set(dir * (mw / 2 + sideW / 2 - 0.2), fh + sideH / 2, 0);
    house.add(wing);

    const wTrim = createTimberFrames(sideW, sideH, sideD);
    wTrim.position.copy(wing.position);
    house.add(wTrim);

    const wRoof = createPitchedRoof(sideW + 0.8, 2.0, sideD + 0.8, mats.roofL3);
    wRoof.rotation.y = Math.PI / 2;
    wRoof.position.set(dir * (mw / 2 + sideW / 2 - 0.2), fh + sideH, 0);
    house.add(wRoof);
  });

  // Front Protrusion
  const frontBody = new THREE.Mesh(new THREE.BoxGeometry(fw, fh2, fd), mats.woodL3);
  frontBody.position.set(0, fh + fh2 / 2, md / 2 + fd / 2 - 0.5);
  house.add(frontBody);

  const frontTrim = createTimberFrames(fw, fh2, fd);
  frontTrim.position.copy(frontBody.position);
  house.add(frontTrim);

  // Roofs
  const mainRoof = createPitchedRoof(mw + 1.5, 3.5, md + 1.5, mats.roofL3);
  mainRoof.position.y = fh + mh;
  house.add(mainRoof);

  const frontRoof = createPitchedRoof(fw + 1.0, 2.5, fd + 1.0, mats.roofL3);
  frontRoof.rotation.y = Math.PI / 2;
  frontRoof.position.set(0, fh + fh2, md / 2 + fd / 2 - 0.5);
  house.add(frontRoof);

  // Dormer windows
  [-1.5, 1.5].forEach((x) => {
    const dormerGroup = new THREE.Group();
    const dBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.5), mats.woodL3);
    dBox.position.y = 0.6;
    const dRoof = createPitchedRoof(1.6, 1.0, 1.8, mats.roofL3);
    dRoof.position.y = 1.2;
    const dWin = createWindow(0.8, 0.8);
    dWin.position.set(0, 0.6, 0.76);

    dormerGroup.add(dBox, dRoof, dWin);
    dormerGroup.position.set(x, fh + mh + 0.5, md / 2 - 0.2);
    house.add(dormerGroup);
  });

  // 2nd Floor Balcony
  const balcW = fw + 0.5,
    balcD = 1.5;
  const balcFloor = new THREE.Mesh(new THREE.BoxGeometry(balcW, 0.2, balcD), mats.woodTrim);
  balcFloor.position.set(0, fh + 3.0, md / 2 + fd + balcD / 2 - 0.5);
  house.add(balcFloor);

  const railMat = mats.woodTrim;
  for (let i = 0; i < 5; i++) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), railMat);
    post.position.set(-balcW / 2 + 0.1 + (i * (balcW - 0.2)) / 4, fh + 3.5, md / 2 + fd + balcD - 0.6);
    house.add(post);
  }
  const railTop = new THREE.Mesh(new THREE.BoxGeometry(balcW, 0.1, 0.2), railMat);
  railTop.position.set(0, fh + 4.0, md / 2 + fd + balcD - 0.6);
  house.add(railTop);

  const bDoor = createDoor(1.2, 2.0);
  bDoor.position.set(0, fh + 3.1, md / 2 + fd - 0.45);
  house.add(bDoor);

  // Grand Entrance Pergola & Double Doors
  const grandDoor = createDoor(2.0, 2.6, true);
  grandDoor.position.set(0, fh, md / 2 + fd - 0.45);
  house.add(grandDoor);

  const pGroup = new THREE.Group();
  const pBeam = new THREE.Mesh(new THREE.BoxGeometry(fw + 1, 0.2, 0.2), mats.woodTrim);
  pBeam.position.set(0, 3.2, 1.5);
  const pCol1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 0.2), mats.stoneDark);
  pCol1.position.set(-fw / 2 - 0.2, 1.6, 1.5);
  const pCol2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 0.2), mats.stoneDark);
  pCol2.position.set(fw / 2 + 0.2, 1.6, 1.5);
  pGroup.add(pBeam, pCol1, pCol2);

  for (let i = 0; i < 7; i++) {
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 2.0), mats.woodTrim);
    rafter.position.set(-fw / 2 + (i * fw) / 6, 3.4, 0.8);
    pGroup.add(rafter);
  }
  pGroup.position.set(0, fh, md / 2 + fd - 1.0);
  house.add(pGroup);

  // Tiered Stone Chimney
  const cW = 1.5,
    cH = 9.0,
    cD = 2.0;
  const chimneyGroup = new THREE.Group();
  const cBase = new THREE.Mesh(new THREE.BoxGeometry(cW, cH / 2, cD), mats.stoneBase);
  cBase.position.y = cH / 4;
  const cTop = new THREE.Mesh(new THREE.BoxGeometry(cW - 0.4, cH / 2, cD - 0.4), mats.stoneBase);
  cTop.position.y = (cH / 4) * 3;
  const cCap = new THREE.Mesh(new THREE.BoxGeometry(cW, 0.4, cD), mats.stoneDark);
  cCap.position.y = cH;
  chimneyGroup.add(cBase, cTop, cCap);
  chimneyGroup.position.set(-mw / 2 - 0.5, fh, 0);
  house.add(chimneyGroup);

  // Grand Windows
  const gw1 = createWindow(1.5, 2.0);
  gw1.rotation.y = Math.PI / 2;
  gw1.position.set(mw / 2 + sideW - 0.15, fh + 1.2, 0);
  house.add(gw1);

  // Lanterns & Bushes
  const l1 = createLantern();
  l1.position.set(-1.8, fh + 2.2, md / 2 + fd - 0.3);
  house.add(l1);
  const l2 = createLantern();
  l2.position.set(1.8, fh + 2.2, md / 2 + fd - 0.3);
  house.add(l2);

  const bushGeo = new THREE.DodecahedronGeometry(0.6, 1);
  const poses = [
    [-4, fd + 1],
    [4, fd + 1],
    [-3, fd + 2.5],
    [3, fd + 2.5],
  ];
  poses.forEach((p) => {
    const bush = new THREE.Mesh(bushGeo, mats.leaf);
    bush.position.set(p[0], fh + 0.3, md / 2 + p[1]);
    bush.rotation.set(Math.random(), Math.random(), Math.random());
    house.add(bush);
  });

  enableShadows(house);
  // Scale to fit ~2x2 game tile footprint (+30% size)
  house.scale.set(0.50, 0.50, 0.50);
  return house;
}

// Master Dispatcher for Fantasy Village Houses
export function createFantasyHouse(level = 1, _w = 2, _h = 2): THREE.Group {
  if (level === 2) return buildFantasyHouseLevel2();
  if (level >= 3) return buildFantasyHouseLevel3();
  return buildFantasyHouseLevel1();
}
