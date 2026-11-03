import * as THREE from "three";
import { buatTombakIblis } from "@/lib/batu/senjataIblis";

export const ROLE_STYLE: Record<string, { color: number; tool: string; label: string }> = {
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
  nelayan: { color: 0x0284c7, tool: "joran_pancing", label: "Pemancing" },
  pemancing: { color: 0x0284c7, tool: "joran_pancing", label: "Pemancing" },
  petani: { color: 0x65a30d, tool: "cangkul", label: "Petani" },
  penjaga: { color: 0x7f1d1d, tool: "tombak", label: "Penjaga Kampung" },
  pengukir: { color: 0x57534e, tool: "pahat", label: "Pengukir Batu" },
  penjelajah: { color: 0x0f766e, tool: "tongkat_jalan", label: "Penjelajah" },
  pemanjat: { color: 0x854d0e, tool: "tali_panjat", label: "Pemanjat" },
  penenun: { color: 0x9d174d, tool: "alat_tenun", label: "Penenun" },
  penjerat: { color: 0x365314, tool: "jerat", label: "Penjerat" },
};

export const SKIN = [0xf5d0a9, 0xe0ad7b, 0xbf8256, 0x8c5332];

export const skinDariNomor = (nomor: string) => {
  let h = 0;
  for (const c of nomor) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return SKIN[h % SKIN.length];
};

export const specRambut = (gender?: string): { panjang: boolean } => {
  return { panjang: gender === "perempuan" };
};

export function box(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x, y, z);
  return m;
}

export function buildCitizen(
  peran: string,
  nomor: string,
  gender?: string,
  opts?: { tombakIblis?: boolean; toolOverride?: string; showBusur?: boolean }
): THREE.Group {
  const g = new THREE.Group();
  const pose = new THREE.Group();
  g.add(pose);

  const st = ROLE_STYLE[peran] ?? { color: 0x6b7280, tool: "", label: peran };
  const skinColor = skinDariNomor(nomor);
  const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });

  // 1. Badan & Pakaian Tradisional Bergaya MMORPG (Tunic & Vest)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.95;
  pose.add(bodyGroup);

  // Tunic utama (torso lebih halus berundak)
  const bodyMat = new THREE.MeshLambertMaterial({ color: st.color });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.52, 10), bodyMat);
  bodyGroup.add(torso);

  // Rompi kulit / lapis bahu (leather trim)
  const vestMat = new THREE.MeshLambertMaterial({ color: 0x4a2e1b });
  const vestL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.26), vestMat);
  vestL.position.set(-0.16, 0.08, 0);
  bodyGroup.add(vestL);

  const vestR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.26), vestMat);
  vestR.position.set(0.16, 0.08, 0);
  bodyGroup.add(vestR);

  // Sabuk kulit tebal dengan gesper tulang/kuningan
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 10), vestMat);
  belt.position.y = -0.16;
  bodyGroup.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
  buckle.position.set(0, -0.16, 0.25);
  bodyGroup.add(buckle);

  // Rok terusan pendek / cawat kain tradisional
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.29, 0.2, 10), bodyMat);
  skirt.position.y = -0.28;
  bodyGroup.add(skirt);

  // 2. Kepala, Wajah Ekspresif & Rambut
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.55;
  pose.add(headGroup);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), skinMat);
  headGroup.add(headMesh);

  // Hidung & Telinga mungil
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), skinMat);
  nose.position.set(0, 0.01, 0.26);
  headGroup.add(nose);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), skinMat);
    ear.position.set(side * 0.26, 0.01, 0);
    headGroup.add(ear);
  }

  // Mata ekspresif (sclera putih + iris gelap + highlight putih)
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const irisMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
  for (const side of [-1, 1]) {
    const eyeWhite = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.02), whiteMat);
    eyeWhite.position.set(side * 0.09, 0.04, 0.245);
    eyeWhite.rotation.y = side * 0.12;
    headGroup.add(eyeWhite);

    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.025), irisMat);
    pupil.position.set(side * 0.09, 0.04, 0.25);
    pupil.rotation.y = side * 0.12;
    headGroup.add(pupil);
  }

  // Rambut bergaya 3D (poni bertekstur, ikatan rambut / sanggul)
  const hairColor = 0x221811;
  const hairMat = new THREE.MeshLambertMaterial({ color: hairColor });

  // Tempurung rambut utama
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65), hairMat);
  hairCap.position.y = 0.02;
  headGroup.add(hairCap);

  // Poni depan
  for (const px of [-0.12, 0, 0.12]) {
    const bang = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.06), hairMat);
    bang.position.set(px, 0.18, 0.22);
    bang.rotation.z = px * -0.5;
    headGroup.add(bang);
  }

  if (specRambut(gender).panjang) {
    // Rambut panjang terurai & kuncir ekor kuda wanita
    const braid = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.04, 0.65, 8), hairMat);
    braid.position.set(0, -0.18, -0.25);
    braid.rotation.x = -0.15;
    headGroup.add(braid);

    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 8), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
    tie.position.set(0, 0.05, -0.24);
    headGroup.add(tie);
  } else {
    // Sanggul / jambul pria zaman batu
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), hairMat);
    bun.position.set(0, 0.28, -0.06);
    headGroup.add(bun);
  }

  // Aksesori Kepala Khas Peran:
  if (peran === "pemancing" || peran === "nelayan") {
    // Caping bambu (conical straw hat)
    const capingGeo = new THREE.ConeGeometry(0.48, 0.18, 14);
    const capingMat = new THREE.MeshLambertMaterial({ color: 0xd4b373 });
    const caping = new THREE.Mesh(capingGeo, capingMat);
    caping.position.y = 0.26;
    headGroup.add(caping);
  } else if (peran === "kepala_suku") {
    // Mahkota bulu kepala suku
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 12), new THREE.MeshLambertMaterial({ color: 0xd97706 }));
    band.position.y = 0.12;
    headGroup.add(band);
    for (let f = -2; f <= 2; f++) {
      const feather = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.28, 5), new THREE.MeshLambertMaterial({ color: f % 2 === 0 ? 0xef4444 : 0x06b6d4 }));
      feather.position.set(f * 0.09, 0.28, 0);
      feather.rotation.z = f * -0.2;
      headGroup.add(feather);
    }
  } else if (peran === "pemburu") {
    // Ikat kepala kulit pemburu dengan taring binatang
    const hBand = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 12), new THREE.MeshLambertMaterial({ color: 0x78350f }));
    hBand.position.y = 0.11;
    headGroup.add(hBand);
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 5), new THREE.MeshLambertMaterial({ color: 0xfafaf9 }));
    tooth.position.set(0, 0.08, 0.28);
    tooth.rotation.x = Math.PI;
    headGroup.add(tooth);
  }

  // 3. Kaki & Sepatu Kulit (Moccasin Boots)
  const bootMat = new THREE.MeshLambertMaterial({ color: 0x5c3d2e });
  const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.72, 8);
  legGeo.translate(0, -0.36, 0);
  const pantsMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });

  const legL = new THREE.Mesh(legGeo, pantsMat);
  legL.position.set(-0.16, 0.72, 0);

  const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.28), bootMat);
  bootL.position.set(0, -0.64, 0.05);
  legL.add(bootL);

  const legR = new THREE.Mesh(legGeo, pantsMat);
  legR.position.set(0.16, 0.72, 0);

  const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.28), bootMat);
  bootR.position.set(0, -0.64, 0.05);
  legR.add(bootR);

  pose.add(legL);
  pose.add(legR);

  // 4. Lengan & Tangan Berkancing
  const armGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.62, 8);
  armGeo.translate(0, -0.31, 0);

  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-0.35, 1.25, 0);

  // Gelang/manset lengan kulit
  const cuffL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 8), vestMat);
  cuffL.position.y = -0.42;
  armL.add(cuffL);

  const armR = new THREE.Mesh(armGeo, skinMat);
  armR.position.set(0.35, 1.25, 0);

  const cuffR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 8), vestMat);
  cuffR.position.y = -0.42;
  armR.add(cuffR);

  pose.add(armL);
  pose.add(armR);

  // 5. Tool Pivot & Perkakas 3D Realistis
  const toolPivot = new THREE.Group();
  toolPivot.position.set(0.42, 0.95, 0.12);
  pose.add(toolPivot);

  const stickMat = new THREE.MeshLambertMaterial({ color: 0x784f33 });
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
  const activeTool = opts?.toolOverride || st.tool;
  let toolKind = activeTool;
  let tombakIblisGroup: THREE.Group | null = null;

  if (opts?.tombakIblis || activeTool === "tombak_iblis") {
    const spear = buatTombakIblis();
    spear.scale.setScalar(0.42);
    spear.position.set(0, 0.55, 0);
    spear.rotation.z = 0.12;
    toolPivot.add(spear);
    tombakIblisGroup = spear;
    toolKind = "tombak_iblis";
  } else if (activeTool === "joran_pancing") {
    // Joran pancing bambu melengkung elegan + senar & pelampung
    const rodGroup = new THREE.Group();
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.045, 1.9, 8), new THREE.MeshLambertMaterial({ color: 0xb5924d }));
    rod.rotation.z = -0.45;
    rod.rotation.x = 0.35;
    rod.position.set(0.3, 0.45, 0.45);
    rodGroup.add(rod);

    // Senar pancing tipis
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.3, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
    line.position.set(0.95, 0.55, 0.95);
    rodGroup.add(line);

    // Pelampung pancing merah putih
    const float = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
    float.position.set(0.95, -0.1, 0.95);
    rodGroup.add(float);

    toolPivot.add(rodGroup);
  } else if (activeTool === "tombak") {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.7, 6), stickMat);
    s.rotation.z = 0.2;
    toolPivot.add(s);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.34, 6), stoneMat);
    tip.position.set(0.05, 1.0, 0);
    toolPivot.add(tip);
  } else if (activeTool === "kapak" || activeTool === "beliung" || activeTool === "palu") {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 6), stickMat);
    s.rotation.z = 0.3;
    toolPivot.add(s);
    if (activeTool === "kapak") {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.08), stoneMat);
      blade.position.set(0.12, 0.35, 0);
      toolPivot.add(blade);
    } else if (activeTool === "beliung") {
      const pick = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 5), stoneMat);
      pick.rotation.z = Math.PI / 2;
      pick.position.set(0.15, 0.35, 0);
      toolPivot.add(pick);
    } else {
      const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.18), new THREE.MeshLambertMaterial({ color: 0x64748b }));
      hammer.position.set(0.12, 0.35, 0);
      toolPivot.add(hammer);
    }
  } else if (activeTool === "keranjang") {
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.36, 8), new THREE.MeshLambertMaterial({ color: 0xc9a86a }));
    basket.position.set(0, -0.28, 0.08);
    toolPivot.add(basket);
  } else if (activeTool === "tongkat" || activeTool === "tongkat_suku") {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), stickMat);
    toolPivot.add(s);
    if (activeTool === "tongkat_suku") {
      const feather = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 6), new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
      feather.position.set(0, 0.95, 0);
      toolPivot.add(feather);
    }
  } else if (activeTool === "obor") {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), stickMat);
    toolPivot.add(s);
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 6), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
    fire.position.set(0, 0.52, 0);
    fire.name = "api-alat";
    toolPivot.add(fire);
  } else {
    // Default tongkat / perkakas serbaguna
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), stickMat);
    s.rotation.z = 0.25;
    toolPivot.add(s);
  }

  let busur: THREE.Group | null = null;
  if (peran === "pemburu" || activeTool === "busur" || opts?.showBusur) {
    busur = new THREE.Group();
    busur.position.set(0.42, 1.0, 0.1);
    const curve = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 6, 16, Math.PI), new THREE.MeshLambertMaterial({ color: 0x6b4226 }));
    curve.rotation.z = Math.PI / 2;
    busur.add(curve);
    busur.visible = Boolean(opts?.showBusur || activeTool === "busur");
    pose.add(busur);
  }

  const dagingBawa = box(0.42, 0.24, 0.34, 0x7f1d1d, 0, 1.0, -0.35);
  dagingBawa.visible = false;
  pose.add(dagingBawa);

  g.userData = {
    legL,
    legR,
    head: headGroup,
    body: bodyGroup,
    toolPivot,
    toolKind,
    busur,
    pose,
    armL,
    armR,
    dagingBawa,
    tombakIblis: tombakIblisGroup,
  };

  return g;
}
