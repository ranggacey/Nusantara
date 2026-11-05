import * as THREE from "three";

// Cache material agar procedural canvas texture hanya dibuat 1x
let cachedMaterials: {
  matWoodMain: THREE.MeshStandardMaterial;
  matWoodFlooring: THREE.MeshStandardMaterial;
  matWoodBeam: THREE.MeshStandardMaterial;
  matWoodRoof: THREE.MeshStandardMaterial;
  matStone: THREE.MeshStandardMaterial;
  matLattice: THREE.MeshStandardMaterial;
  matLanternPaper: THREE.MeshStandardMaterial;
  matGoldAccent: THREE.MeshStandardMaterial;
  matWater: THREE.MeshStandardMaterial;
  matFoliage: THREE.MeshStandardMaterial;
  matBlossom: THREE.MeshStandardMaterial;
  matBamboo: THREE.MeshStandardMaterial;
} | null = null;

function getMaterials() {
  if (cachedMaterials) return cachedMaterials;

  // SSR check
  if (typeof document === "undefined") {
    const dummy = new THREE.MeshStandardMaterial();
    return {
      matWoodMain: dummy,
      matWoodFlooring: dummy,
      matWoodBeam: dummy,
      matWoodRoof: dummy,
      matStone: dummy,
      matLattice: dummy,
      matLanternPaper: dummy,
      matGoldAccent: dummy,
      matWater: dummy,
      matFoliage: dummy,
      matBlossom: dummy,
      matBamboo: dummy,
    };
  }

  // --- Procedural Texture Generators (PBR Wood & Stone) ---
  function createWoodPlankTexture(width: number, height: number, isDark = false, isFlooring = false) {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d")!;

    const baseR = isDark ? 68 : isFlooring ? 135 : 110;
    const baseG = isDark ? 42 : isFlooring ? 85 : 70;
    const baseB = isDark ? 24 : isFlooring ? 45 : 38;

    ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
    ctx.fillRect(0, 0, width, height);

    const numPlanks = isFlooring ? 8 : 6;
    const plankH = height / numPlanks;

    for (let i = 0; i < numPlanks; i++) {
      const py = i * plankH;
      const shadeDiff = (Math.random() - 0.5) * 22;
      ctx.fillStyle = `rgba(${Math.max(0, baseR + shadeDiff)}, ${Math.max(0, baseG + shadeDiff)}, ${Math.max(0, baseB + shadeDiff)}, 0.4)`;
      ctx.fillRect(0, py, width, plankH);

      const numGrains = 40;
      for (let g = 0; g < numGrains; g++) {
        const gy = py + Math.random() * plankH;
        ctx.strokeStyle = `rgba(${baseR - 35}, ${baseG - 25}, ${baseB - 15}, ${0.15 + Math.random() * 0.25})`;
        ctx.lineWidth = 0.8 + Math.random() * 1.5;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        const waveAmp = 2 + Math.random() * 3;
        for (let x = 0; x < width; x += 20) {
          ctx.lineTo(x, gy + Math.sin(x * 0.04) * waveAmp);
        }
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(15, 10, 5, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();

      ctx.fillStyle = "rgba(25, 15, 8, 0.9)";
      for (let n = 25; n < width; n += width / 4) {
        ctx.beginPath();
        ctx.arc(n, py + 6, 2.2, 0, Math.PI * 2);
        ctx.arc(n, py + plankH - 6, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createSolidBeamTexture() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 512;
    const ctx = c.getContext("2d")!;

    ctx.fillStyle = "#3a2414";
    ctx.fillRect(0, 0, 256, 512);

    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 256;
      ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? "20, 10, 5" : "75, 45, 25"}, ${0.12 + Math.random() * 0.25})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (Math.random() - 0.5) * 12, 512);
      ctx.stroke();
    }

    for (let k = 0; k < 4; k++) {
      const kx = 30 + Math.random() * 196;
      const ky = 60 + Math.random() * 392;
      const grad = ctx.createRadialGradient(kx, ky, 2, kx, ky, 22);
      grad.addColorStop(0, "rgba(18, 10, 5, 0.9)");
      grad.addColorStop(0.5, "rgba(45, 25, 12, 0.6)");
      grad.addColorStop(1, "rgba(58, 36, 20, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(kx, ky, 10, 24, Math.PI * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createRoofSirapTexture() {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d")!;

    ctx.fillStyle = "#452c1b";
    ctx.fillRect(0, 0, 512, 512);

    const rowH = 32;
    const rows = 512 / rowH;
    for (let r = 0; r < rows; r++) {
      const ry = r * rowH;
      const colW = 24 + Math.random() * 8;
      const cols = 512 / colW;
      for (let cl = 0; cl < cols; cl++) {
        const rx = cl * colW;
        ctx.fillStyle = `rgba(${55 + Math.random() * 25}, ${35 + Math.random() * 18}, ${20 + Math.random() * 12}, 0.85)`;
        ctx.fillRect(rx, ry, colW - 2, rowH - 1);

        ctx.strokeStyle = "rgba(20, 10, 5, 0.95)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rx + colW - 2, ry);
        ctx.lineTo(rx + colW - 2, ry + rowH);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(12, 6, 3, 0.95)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, ry + rowH);
      ctx.lineTo(512, ry + rowH);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createStoneTexture() {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d")!;

    ctx.fillStyle = "#63635e";
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 4000; i++) {
      const g = 60 + Math.random() * 45;
      ctx.fillStyle = `rgba(${g}, ${g}, ${g - 4}, 0.35)`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }

    const numRows = 8;
    const rH = 512 / numRows;
    for (let r = 0; r < numRows; r++) {
      const y = r * rH;
      ctx.strokeStyle = "rgba(28, 28, 26, 0.85)";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      const offset = (r % 2) * 45;
      for (let x = offset; x < 512 + 90; x += 90) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + rH);
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
        ctx.fillRect(x + 3, y + 3, 90 - 6, 8);
        ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
        ctx.fillRect(x + 3, y + rH - 10, 90 - 6, 8);
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createLatticeTexture() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d")!;

    ctx.fillStyle = "#f5eedb";
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = "rgba(220, 205, 175, 0.25)";
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }

    ctx.strokeStyle = "#4a2f18";
    ctx.lineWidth = 4;
    const grid = 32;
    for (let x = 0; x <= 256; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y <= 256; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  const woodPlankTex = createWoodPlankTexture(512, 512, false, false);
  woodPlankTex.repeat.set(2, 2);

  const woodFloorTex = createWoodPlankTexture(512, 512, false, true);
  woodFloorTex.repeat.set(4, 4);

  const darkBeamTex = createSolidBeamTexture();
  darkBeamTex.repeat.set(1, 3);

  const roofSirapTex = createRoofSirapTexture();
  roofSirapTex.repeat.set(4, 3);

  const stoneTex = createStoneTexture();
  stoneTex.repeat.set(3, 3);

  const latticeTex = createLatticeTexture();
  latticeTex.repeat.set(2, 2);

  cachedMaterials = {
    matWoodMain: new THREE.MeshStandardMaterial({
      map: woodPlankTex,
      roughness: 0.68,
      metalness: 0.05,
      color: 0xcd8d54,
    }),
    matWoodFlooring: new THREE.MeshStandardMaterial({
      map: woodFloorTex,
      roughness: 0.55,
      metalness: 0.08,
      color: 0xb57842,
    }),
    matWoodBeam: new THREE.MeshStandardMaterial({
      map: darkBeamTex,
      roughness: 0.62,
      metalness: 0.08,
      color: 0x8a522a,
    }),
    matWoodRoof: new THREE.MeshStandardMaterial({
      map: roofSirapTex,
      roughness: 0.82,
      metalness: 0.04,
      color: 0x6e4122,
    }),
    matStone: new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.88,
      metalness: 0.05,
      color: 0x8e8e88,
    }),
    matLattice: new THREE.MeshStandardMaterial({
      map: latticeTex,
      roughness: 0.5,
      metalness: 0.0,
      emissive: 0xfaecc5,
      emissiveIntensity: 0.35,
    }),
    matLanternPaper: new THREE.MeshStandardMaterial({
      color: 0xffe294,
      roughness: 0.3,
      metalness: 0.0,
      emissive: 0xffaa33,
      emissiveIntensity: 0.85,
    }),
    matGoldAccent: new THREE.MeshStandardMaterial({
      color: 0xd4a359,
      roughness: 0.35,
      metalness: 0.75,
    }),
    matWater: new THREE.MeshStandardMaterial({
      color: 0x1a454d,
      roughness: 0.12,
      metalness: 0.35,
      transparent: true,
      opacity: 0.88,
    }),
    matFoliage: new THREE.MeshStandardMaterial({
      color: 0x2d5e2e,
      roughness: 0.75,
      metalness: 0.05,
    }),
    matBlossom: new THREE.MeshStandardMaterial({
      color: 0xf5a2b8,
      roughness: 0.65,
      metalness: 0.02,
    }),
    matBamboo: new THREE.MeshStandardMaterial({
      color: 0x4f7d39,
      roughness: 0.5,
      metalness: 0.08,
    }),
  };

  return cachedMaterials;
}

export function createPaviliunNirwana(w: number = 4, h: number = 4): THREE.Group {
  const root = new THREE.Group();
  const mats = getMaterials();
  const restaurantGroup = new THREE.Group();
  root.add(restaurantGroup);

  // 1. Natural Stone Foundation & Plinth (20% Batu Alam)
  const stoneGroup = new THREE.Group();
  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(32, 1.2, 28), mats.matStone);
  baseMesh.position.set(0, 0.6, 0);
  baseMesh.receiveShadow = true;
  baseMesh.castShadow = true;
  stoneGroup.add(baseMesh);

  const terraceMesh = new THREE.Mesh(new THREE.BoxGeometry(29, 0.7, 25), mats.matStone);
  terraceMesh.position.set(0, 1.45, 0);
  terraceMesh.receiveShadow = true;
  terraceMesh.castShadow = true;
  stoneGroup.add(terraceMesh);

  // Front Stone Stairs
  const numSteps = 5;
  for (let s = 0; s < numSteps; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.35, 1.0), mats.matStone);
    step.position.set(0, 0.18 + s * 0.35, 14.2 - s * 1.0);
    step.receiveShadow = true;
    step.castShadow = true;
    stoneGroup.add(step);
  }

  // Stone Balustrades Flanking the Steps
  const balL = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 4.8), mats.matStone);
  balL.position.set(-4.8, 1.2, 12.5);
  balL.castShadow = true;
  balL.receiveShadow = true;
  stoneGroup.add(balL);

  const balR = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 4.8), mats.matStone);
  balR.position.set(4.8, 1.2, 12.5);
  balR.castShadow = true;
  balR.receiveShadow = true;
  stoneGroup.add(balR);

  // Umpak Tiang Batu Alam
  const umpakGeo = new THREE.CylinderGeometry(0.55, 0.72, 0.5, 8);
  const colPositions = [
    [-4.5, -3.5], [4.5, -3.5], [-4.5, 3.5], [4.5, 3.5],
    [-9.5, -7.5], [0, -7.5], [9.5, -7.5],
    [-9.5, 0], [9.5, 0],
    [-9.5, 7.5], [9.5, 7.5],
    [-7.5, 11.5], [-2.5, 11.5], [2.5, 11.5], [7.5, 11.5],
  ];
  colPositions.forEach((pos) => {
    const umpak = new THREE.Mesh(umpakGeo, mats.matStone);
    umpak.position.set(pos[0], 1.95, pos[1]);
    umpak.castShadow = true;
    umpak.receiveShadow = true;
    stoneGroup.add(umpak);
  });
  restaurantGroup.add(stoneGroup);

  // 2. Main Timber Superstructure (80% Kayu Solid)
  const timberGroup = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(28.4, 0.18, 24.4), mats.matWoodFlooring);
  deck.position.set(0, 1.89, 0);
  deck.receiveShadow = true;
  timberGroup.add(deck);

  // 4 Grand Soko Guru Pillars
  const sokoGeo = new THREE.BoxGeometry(0.72, 8.8, 0.72);
  const sokoCoords = [
    [-4.5, -3.5], [4.5, -3.5], [-4.5, 3.5], [4.5, 3.5],
  ];
  sokoCoords.forEach((c) => {
    const col = new THREE.Mesh(sokoGeo, mats.matWoodBeam);
    col.position.set(c[0], 6.4, c[1]);
    col.castShadow = true;
    col.receiveShadow = true;
    timberGroup.add(col);

    // Carved Timber Capital / Dougong Bracket Set on top
    for (let b = 0; b < 3; b++) {
      const brkGeo = new THREE.BoxGeometry(1.8 + b * 0.4, 0.22, 1.8 + b * 0.4);
      const brk = new THREE.Mesh(brkGeo, mats.matWoodMain);
      brk.position.set(c[0], 10.4 + b * 0.26, c[1]);
      brk.castShadow = true;
      timberGroup.add(brk);
    }
  });

  // Perimeter Posts
  const perimGeo = new THREE.BoxGeometry(0.5, 4.8, 0.5);
  const perimCoords = [
    [-9.5, -7.5], [0, -7.5], [9.5, -7.5],
    [-9.5, 0], [9.5, 0],
    [-9.5, 7.5], [9.5, 7.5],
    [-7.5, 11.5], [-2.5, 11.5], [2.5, 11.5], [7.5, 11.5],
  ];
  perimCoords.forEach((c) => {
    const col = new THREE.Mesh(perimGeo, mats.matWoodBeam);
    col.position.set(c[0], 4.4, c[1]);
    col.castShadow = true;
    col.receiveShadow = true;
    timberGroup.add(col);
  });

  // Beams
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(20, 0.45, 0.45), mats.matWoodBeam);
  b1.position.set(0, 4.8, -3.5);
  timberGroup.add(b1);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(20, 0.45, 0.45), mats.matWoodBeam);
  b2.position.set(0, 4.8, 3.5);
  timberGroup.add(b2);

  const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 16), mats.matWoodBeam);
  b3.position.set(-4.5, 4.8, 0);
  timberGroup.add(b3);
  const b4 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 16), mats.matWoodBeam);
  b4.position.set(4.5, 4.8, 0);
  timberGroup.add(b4);

  // Perimeter Ring Beams
  const pb1 = new THREE.Mesh(new THREE.BoxGeometry(20.5, 0.4, 0.4), mats.matWoodBeam);
  pb1.position.set(0, 4.8, -7.5);
  timberGroup.add(pb1);
  const pb2 = new THREE.Mesh(new THREE.BoxGeometry(20.5, 0.4, 0.4), mats.matWoodBeam);
  pb2.position.set(0, 4.8, 7.5);
  timberGroup.add(pb2);

  const pb3 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 16.5), mats.matWoodBeam);
  pb3.position.set(-9.5, 4.8, 0);
  timberGroup.add(pb3);
  const pb4 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 16.5), mats.matWoodBeam);
  pb4.position.set(9.5, 4.8, 0);
  timberGroup.add(pb4);

  // Veranda Front Beam
  const vb = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 0.4), mats.matWoodBeam);
  vb.position.set(0, 4.8, 11.5);
  timberGroup.add(vb);

  restaurantGroup.add(timberGroup);

  // 3. Second Floor Mezzanine & Wooden Balcony
  const mezzGroup = new THREE.Group();
  const mezRear = new THREE.Mesh(new THREE.BoxGeometry(19, 0.22, 6), mats.matWoodFlooring);
  mezRear.position.set(0, 5.0, -4.5);
  mezRear.receiveShadow = true;
  mezzGroup.add(mezRear);

  const mezL = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 9), mats.matWoodFlooring);
  mezL.position.set(-6.9, 5.0, 2);
  mezL.receiveShadow = true;
  mezzGroup.add(mezL);

  const mezR = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 9), mats.matWoodFlooring);
  mezR.position.set(6.9, 5.0, 2);
  mezR.receiveShadow = true;
  mezzGroup.add(mezR);

  // Cantilevered Front Balcony
  const mezFront = new THREE.Mesh(new THREE.BoxGeometry(12, 0.25, 4.5), mats.matWoodFlooring);
  mezFront.position.set(0, 5.0, 8.5);
  mezFront.receiveShadow = true;
  mezFront.castShadow = true;
  mezzGroup.add(mezFront);

  // Balcony Corbels
  for (let c = -4; c <= 4; c += 2.6) {
    const corbel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 2.2), mats.matWoodBeam);
    corbel.position.set(c, 4.2, 7.2);
    corbel.rotation.x = 0.55;
    corbel.castShadow = true;
    mezzGroup.add(corbel);
  }

  // Railings
  function createRailing(length: number, isZ = false) {
    const railGrp = new THREE.Group();
    const topRail = new THREE.Mesh(
      new THREE.BoxGeometry(isZ ? 0.16 : length, 0.14, isZ ? length : 0.16),
      mats.matWoodMain
    );
    topRail.position.y = 1.1;
    topRail.castShadow = true;
    railGrp.add(topRail);

    const botRail = new THREE.Mesh(
      new THREE.BoxGeometry(isZ ? 0.16 : length, 0.14, isZ ? length : 0.16),
      mats.matWoodMain
    );
    botRail.position.y = 0.15;
    railGrp.add(botRail);

    const count = Math.floor(length / 0.55);
    const balGeo = new THREE.BoxGeometry(isZ ? 0.1 : 0.12, 0.85, isZ ? 0.12 : 0.1);
    for (let i = 0; i <= count; i++) {
      const bal = new THREE.Mesh(balGeo, mats.matWoodMain);
      const pos = -length / 2 + (i / count) * length;
      if (isZ) bal.position.set(0, 0.62, pos);
      else bal.position.set(pos, 0.62, 0);
      bal.castShadow = true;
      railGrp.add(bal);
    }
    return railGrp;
  }

  const fRail = createRailing(12);
  fRail.position.set(0, 5.0, 10.7);
  mezzGroup.add(fRail);

  const fRailL = createRailing(4.5, true);
  fRailL.position.set(-6.0, 5.0, 8.5);
  mezzGroup.add(fRailL);

  const fRailR = createRailing(4.5, true);
  fRailR.position.set(6.0, 5.0, 8.5);
  mezzGroup.add(fRailR);

  // Interior Railings
  const atRailF = createRailing(8.8);
  atRailF.position.set(0, 5.0, 6.2);
  mezzGroup.add(atRailF);

  const atRailL = createRailing(7.8, true);
  atRailL.position.set(-4.3, 5.0, 2.3);
  mezzGroup.add(atRailL);

  const atRailR = createRailing(7.8, true);
  atRailR.position.set(4.3, 5.0, 2.3);
  mezzGroup.add(atRailR);

  // Upper Columns
  const upColGeo = new THREE.BoxGeometry(0.42, 4.2, 0.42);
  [
    [-6.0, 8.5], [6.0, 8.5],
    [-4.5, 10.7], [0, 10.7], [4.5, 10.7],
  ].forEach((pos) => {
    const uc = new THREE.Mesh(upColGeo, mats.matWoodBeam);
    uc.position.set(pos[0], 7.1, pos[1]);
    uc.castShadow = true;
    mezzGroup.add(uc);
  });

  restaurantGroup.add(mezzGroup);

  // 4. Multi-Tiered Tropical Rustic Roof (Joglo Tumpangsari)
  const roofGroup = new THREE.Group();

  function createRoofTier(
    wBottom: number,
    dBottom: number,
    wTop: number,
    dTop: number,
    height: number,
    yPos: number,
    overhang: number
  ) {
    const tier = new THREE.Group();
    const actualWBot = wBottom + overhang * 2;
    const actualDBot = dBottom + overhang * 2;
    const thickness = 0.28;

    // Front Slope
    const fLength = Math.hypot(height, (actualDBot - dTop) / 2);
    const fAngle = Math.atan2((actualDBot - dTop) / 2, height);
    const fGeo = new THREE.BoxGeometry(actualWBot, thickness, fLength);
    const fMesh = new THREE.Mesh(fGeo, mats.matWoodRoof);
    fMesh.position.set(0, yPos + height / 2, (dTop + (actualDBot - dTop) / 2) / 2);
    fMesh.rotation.x = Math.PI / 2 - fAngle;
    fMesh.castShadow = true;
    fMesh.receiveShadow = true;
    tier.add(fMesh);

    // Back Slope
    const bMesh = new THREE.Mesh(fGeo, mats.matWoodRoof);
    bMesh.position.set(0, yPos + height / 2, -(dTop + (actualDBot - dTop) / 2) / 2);
    bMesh.rotation.x = -(Math.PI / 2 - fAngle);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    tier.add(bMesh);

    // Left Slope
    const sLength = Math.hypot(height, (actualWBot - wTop) / 2);
    const sAngle = Math.atan2((actualWBot - wTop) / 2, height);
    const sGeo = new THREE.BoxGeometry(sLength, thickness, dTop);
    const lMesh = new THREE.Mesh(sGeo, mats.matWoodRoof);
    lMesh.position.set(-(wTop + (actualWBot - wTop) / 2) / 2, yPos + height / 2, 0);
    lMesh.rotation.z = Math.PI / 2 - sAngle;
    lMesh.castShadow = true;
    lMesh.receiveShadow = true;
    tier.add(lMesh);

    // Right Slope
    const rMesh = new THREE.Mesh(sGeo, mats.matWoodRoof);
    rMesh.position.set((wTop + (actualWBot - wTop) / 2) / 2, yPos + height / 2, 0);
    rMesh.rotation.z = -(Math.PI / 2 - sAngle);
    rMesh.castShadow = true;
    rMesh.receiveShadow = true;
    tier.add(rMesh);

    // Rafters
    const numRaftersX = 18;
    for (let i = 0; i < numRaftersX; i++) {
      const rx = -actualWBot / 2 + 1.2 + (i / (numRaftersX - 1)) * (actualWBot - 2.4);
      const raf = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.22, actualDBot - 0.8),
        mats.matWoodBeam
      );
      raf.position.set(rx, yPos + height * 0.35, 0);
      raf.castShadow = true;
      tier.add(raf);
    }

    // Corner Finials
    const corners = [
      [-actualWBot / 2, actualDBot / 2, 0.78],
      [actualWBot / 2, actualDBot / 2, -0.78],
      [-actualWBot / 2, -actualDBot / 2, 2.35],
      [actualWBot / 2, -actualDBot / 2, -2.35],
    ];
    corners.forEach((c) => {
      const finial = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 1.6), mats.matGoldAccent);
      finial.position.set(c[0] * 0.95, yPos + 0.2, c[1] * 0.95);
      finial.rotation.y = c[2];
      finial.rotation.x = -0.3;
      finial.castShadow = true;
      tier.add(finial);
    });

    return tier;
  }

  // Tier 1
  const tier1 = createRoofTier(22, 18, 14, 11, 2.2, 4.8, 2.4);
  roofGroup.add(tier1);

  // Clerestory Lattice Wall
  const clereLattice = new THREE.Mesh(new THREE.BoxGeometry(13.8, 1.3, 10.8), mats.matLattice);
  clereLattice.position.set(0, 7.3, 0);
  clereLattice.castShadow = true;
  roofGroup.add(clereLattice);

  // Tier 2
  const tier2 = createRoofTier(14, 11, 4.5, 3.2, 3.2, 7.9, 1.8);
  roofGroup.add(tier2);

  // Ridge Crest
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.42, 0.7), mats.matWoodBeam);
  ridge.position.set(0, 11.2, 0);
  ridge.castShadow = true;
  roofGroup.add(ridge);

  // Makara Finials
  const finGeo = new THREE.ConeGeometry(0.35, 1.2, 6);
  const finL = new THREE.Mesh(finGeo, mats.matGoldAccent);
  finL.position.set(-3.2, 11.8, 0);
  finL.rotation.z = 0.55;
  finL.castShadow = true;
  roofGroup.add(finL);

  const finR = new THREE.Mesh(finGeo, mats.matGoldAccent);
  finR.position.set(3.2, 11.8, 0);
  finR.rotation.z = -0.55;
  finR.castShadow = true;
  roofGroup.add(finR);

  restaurantGroup.add(roofGroup);

  // 5. Exterior Details, Windows, Grand Entrance & Lanterns
  const extGroup = new THREE.Group();

  // Perimeter Walls
  const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.8, 14.6), mats.matLattice);
  wallL.position.set(-9.4, 3.3, 0);
  wallL.castShadow = true;
  extGroup.add(wallL);

  const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.8, 14.6), mats.matLattice);
  wallR.position.set(9.4, 3.3, 0);
  wallR.castShadow = true;
  extGroup.add(wallR);

  const wallB = new THREE.Mesh(new THREE.BoxGeometry(18.6, 2.8, 0.22), mats.matWoodMain);
  wallB.position.set(0, 3.3, -7.4);
  wallB.castShadow = true;
  extGroup.add(wallB);

  // Grand Main Entrance Portico
  const gateGroup = new THREE.Group();
  gateGroup.position.set(0, 1.9, 7.5);

  const doorColGeo = new THREE.BoxGeometry(0.65, 3.4, 0.65);
  const dColL = new THREE.Mesh(doorColGeo, mats.matWoodBeam);
  dColL.position.set(-2.4, 1.7, 0);
  dColL.castShadow = true;
  gateGroup.add(dColL);

  const dColR = new THREE.Mesh(doorColGeo, mats.matWoodBeam);
  dColR.position.set(2.4, 1.7, 0);
  dColR.castShadow = true;
  gateGroup.add(dColR);

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.55, 0.7), mats.matWoodBeam);
  lintel.position.set(0, 3.4, 0);
  lintel.castShadow = true;
  gateGroup.add(lintel);

  const sign = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.85, 0.16), mats.matGoldAccent);
  sign.position.set(0, 3.9, 0.2);
  sign.castShadow = true;
  gateGroup.add(sign);

  const doorLeafGeo = new THREE.BoxGeometry(1.6, 2.8, 0.12);
  const doorL = new THREE.Mesh(doorLeafGeo, mats.matWoodMain);
  doorL.position.set(-1.8, 1.4, -0.6);
  doorL.rotation.y = -0.7;
  doorL.castShadow = true;
  gateGroup.add(doorL);

  const doorR = new THREE.Mesh(doorLeafGeo, mats.matWoodMain);
  doorR.position.set(1.8, 1.4, -0.6);
  doorR.rotation.y = 0.7;
  doorR.castShadow = true;
  gateGroup.add(doorR);

  extGroup.add(gateGroup);

  // Hanging Lanterns
  function createHangingLantern(x: number, y: number, z: number, size = 1.0) {
    const lGrp = new THREE.Group();
    lGrp.position.set(x, y, z);

    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7), mats.matWoodBeam);
    rope.position.y = 0.35;
    lGrp.add(rope);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.35 * size, 0.18 * size, 6), mats.matWoodBeam);
    cap.position.y = 0.12 * size;
    lGrp.add(cap);

    const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * size, 0.22 * size, 0.1 * size, 6), mats.matWoodBeam);
    bot.position.y = -0.42 * size;
    lGrp.add(bot);

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * size, 0.28 * size, 0.45 * size, 8), mats.matLanternPaper);
    core.position.y = -0.15 * size;
    lGrp.add(core);

    return lGrp;
  }

  extGroup.add(createHangingLantern(-2.4, 4.4, 7.8, 1.1));
  extGroup.add(createHangingLantern(2.4, 4.4, 7.8, 1.1));
  extGroup.add(createHangingLantern(-7.5, 4.4, 11.5, 0.9));
  extGroup.add(createHangingLantern(7.5, 4.4, 11.5, 0.9));
  extGroup.add(createHangingLantern(-9.5, 4.4, 0, 0.9));
  extGroup.add(createHangingLantern(9.5, 4.4, 0, 0.9));
  extGroup.add(createHangingLantern(-4.2, 7.8, 10.8, 0.85));
  extGroup.add(createHangingLantern(4.2, 7.8, 10.8, 0.85));

  restaurantGroup.add(extGroup);

  // 6. Interior Tavern Dining Hall, Counter Kasir & Bar
  const intGroup = new THREE.Group();
  const barGroup = new THREE.Group();
  barGroup.position.set(-5.8, 1.9, 0);

  const barTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 6.4), mats.matWoodFlooring);
  barTop.position.set(0, 1.05, 0);
  barTop.castShadow = true;
  barTop.receiveShadow = true;
  barGroup.add(barTop);

  const barFront = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 6.2), mats.matWoodBeam);
  barFront.position.set(0, 0.5, 0);
  barFront.castShadow = true;
  barGroup.add(barFront);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.4), mats.matGoldAccent);
  chest.position.set(0, 1.3, 2.2);
  chest.castShadow = true;
  barGroup.add(chest);

  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.2, 6.0), mats.matWoodMain);
  shelf.position.set(-2.2, 1.7, 0);
  shelf.castShadow = true;
  barGroup.add(shelf);

  for (let k = 0; k < 3; k++) {
    const keg = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.9, 10), mats.matWoodBeam);
    keg.position.set(-2.0, 1.0, -1.8 + k * 1.5);
    keg.rotation.z = Math.PI / 2;
    keg.castShadow = true;
    barGroup.add(keg);
  }
  intGroup.add(barGroup);

  function createDiningTableSet(x: number, z: number, rot = 0, isRound = false) {
    const tableGrp = new THREE.Group();
    tableGrp.position.set(x, 1.9, z);
    tableGrp.rotation.y = rot;

    if (isRound) {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.12, 12), mats.matWoodMain);
      top.position.y = 0.88;
      top.castShadow = true;
      tableGrp.add(top);

      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.85, 8), mats.matWoodBeam);
      leg.position.y = 0.42;
      leg.castShadow = true;
      tableGrp.add(leg);

      for (let s = 0; s < 4; s++) {
        const ang = (s / 4) * Math.PI * 2;
        const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.5, 8), mats.matWoodBeam);
        stool.position.set(Math.cos(ang) * 1.7, 0.25, Math.sin(ang) * 1.7);
        stool.castShadow = true;
        tableGrp.add(stool);
      }
    } else {
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 3.2), mats.matWoodMain);
      top.position.y = 0.88;
      top.castShadow = true;
      tableGrp.add(top);

      const legCoords = [[-0.6, -1.3], [0.6, -1.3], [-0.6, 1.3], [0.6, 1.3]];
      legCoords.forEach((lc) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.85, 0.18), mats.matWoodBeam);
        leg.position.set(lc[0], 0.42, lc[1]);
        leg.castShadow = true;
        tableGrp.add(leg);
      });

      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 3.0), mats.matWoodMain);
      b1.position.set(-1.25, 0.5, 0);
      b1.castShadow = true;
      tableGrp.add(b1);

      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 3.0), mats.matWoodMain);
      b2.position.set(1.25, 0.5, 0);
      b2.castShadow = true;
      tableGrp.add(b2);
    }

    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.22, 6), mats.matStone);
    pot.position.set(0, 1.05, 0);
    tableGrp.add(pot);

    return tableGrp;
  }

  intGroup.add(createDiningTableSet(0, -3.2, 0, false));
  intGroup.add(createDiningTableSet(0, 2.5, 0, false));
  intGroup.add(createDiningTableSet(5.6, -2.5, 0.4, true));
  intGroup.add(createDiningTableSet(5.6, 2.8, -0.3, true));
  intGroup.add(createDiningTableSet(-5.5, 10.2, 0, true));
  intGroup.add(createDiningTableSet(5.5, 10.2, 0.2, true));

  const mezTable1 = createDiningTableSet(0, -4.5, 0, false);
  mezTable1.position.y = 5.0;
  intGroup.add(mezTable1);

  const mezTable2 = createDiningTableSet(0, 8.5, 0, true);
  mezTable2.position.y = 5.0;
  intGroup.add(mezTable2);

  // Chandelier
  const chandGroup = new THREE.Group();
  chandGroup.position.set(0, 8.8, 0);
  const chandFrame = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.2, 8), mats.matWoodBeam);
  chandGroup.add(chandFrame);
  intGroup.add(chandGroup);

  restaurantGroup.add(intGroup);

  // 7. Surrounding Garden & MMORPG Details
  const envGroup = new THREE.Group();

  // Reflection Pond
  const pondGroup = new THREE.Group();
  pondGroup.position.set(13.5, 0.1, 7.5);

  const pondBorder = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.65, 8, 24), mats.matStone);
  pondBorder.rotation.x = Math.PI / 2;
  pondBorder.position.y = 0.55;
  pondBorder.castShadow = true;
  pondBorder.receiveShadow = true;
  pondGroup.add(pondBorder);

  const waterMesh = new THREE.Mesh(new THREE.CircleGeometry(5.0, 24), mats.matWater);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = 0.48;
  waterMesh.receiveShadow = true;
  pondGroup.add(waterMesh);

  // Lily Pads & Flowers
  const lilyPadGeo = new THREE.CircleGeometry(0.45, 12);
  const lilyPadMat = new THREE.MeshStandardMaterial({ color: 0x245520, roughness: 0.6 });
  for (let l = 0; l < 8; l++) {
    const ang = (l / 8) * Math.PI * 2;
    const dist = 1.2 + (l % 3) * 1.0;
    const pad = new THREE.Mesh(lilyPadGeo, lilyPadMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(Math.cos(ang) * dist, 0.5, Math.sin(ang) * dist);
    pondGroup.add(pad);

    if (l % 2 === 0) {
      const flower = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.22, 6), mats.matBlossom);
      flower.position.set(pad.position.x, 0.62, pad.position.z);
      pondGroup.add(flower);
    }
  }

  // Bamboo spout
  const bambooPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), mats.matBamboo);
  bambooPost.position.set(-3.8, 1.0, -1.5);
  pondGroup.add(bambooPost);

  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), mats.matBamboo);
  spout.position.set(-3.4, 1.3, -1.1);
  spout.rotation.z = -0.55;
  spout.rotation.y = 0.45;
  pondGroup.add(spout);

  envGroup.add(pondGroup);

  // Stone Lanterns (Tōrō)
  function createStoneLantern(x: number, z: number) {
    const slGrp = new THREE.Group();
    slGrp.position.set(x, 0.0, z);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.4, 6), mats.matStone);
    base.position.y = 0.2;
    base.castShadow = true;
    slGrp.add(base);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 6), mats.matStone);
    post.position.y = 0.85;
    post.castShadow = true;
    slGrp.add(post);

    const chamber = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.65), mats.matStone);
    chamber.position.y = 1.4;
    chamber.castShadow = true;
    slGrp.add(chamber);

    const core = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.4, 0.48), mats.matLanternPaper);
    core.position.y = 1.4;
    slGrp.add(core);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.45, 6), mats.matStone);
    roof.position.y = 1.85;
    roof.castShadow = true;
    slGrp.add(roof);

    return slGrp;
  }

  envGroup.add(createStoneLantern(-6.5, 14.5));
  envGroup.add(createStoneLantern(6.5, 14.5));
  envGroup.add(createStoneLantern(14.0, 13.5));
  envGroup.add(createStoneLantern(-12.0, 4.0));

  // Bamboo Clusters
  function createBambooCluster(bx: number, bz: number, count = 6) {
    const bGrp = new THREE.Group();
    bGrp.position.set(bx, 0, bz);

    for (let b = 0; b < count; b++) {
      const ox = ((b % 3) - 1) * 0.8;
      const oz = (Math.floor(b / 3) - 0.5) * 0.8;
      const bHeight = 7.0 + (b % 4);
      const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, bHeight, 8), mats.matBamboo);
      cane.position.set(ox, bHeight / 2, oz);
      cane.castShadow = true;
      bGrp.add(cane);

      for (let t = 0; t < 3; t++) {
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.4, 6), mats.matFoliage);
        tuft.position.set(ox, bHeight - t * 1.2, oz);
        tuft.castShadow = true;
        bGrp.add(tuft);
      }
    }
    return bGrp;
  }

  envGroup.add(createBambooCluster(-16, -6, 6));
  envGroup.add(createBambooCluster(-15, 6, 5));
  envGroup.add(createBambooCluster(18, -8, 6));

  // Blossom Trees
  function createBlossomTree(tx: number, tz: number, isPink = true) {
    const treeGrp = new THREE.Group();
    treeGrp.position.set(tx, 0, tz);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.7, 4.2, 8), mats.matWoodBeam);
    trunk.position.y = 2.1;
    trunk.castShadow = true;
    treeGrp.add(trunk);

    const canopyMat = isPink ? mats.matBlossom : mats.matFoliage;
    const foliageCenters = [
      [0, 4.8, 0, 2.4],
      [-1.4, 4.2, 0.5, 1.8],
      [1.3, 4.5, -0.6, 1.9],
      [0.4, 5.6, 0.8, 1.6],
    ];

    foliageCenters.forEach((fc) => {
      const cloud = new THREE.Mesh(new THREE.DodecahedronGeometry(fc[3], 1), canopyMat);
      cloud.position.set(fc[0], fc[1], fc[2]);
      cloud.castShadow = true;
      treeGrp.add(cloud);
    });

    return treeGrp;
  }

  envGroup.add(createBlossomTree(-12, -12, true));
  envGroup.add(createBlossomTree(15, -12, false));
  envGroup.add(createBlossomTree(20, 2, true));

  // Mount Area & Cart
  const mountArea = new THREE.Group();
  mountArea.position.set(-13.5, 0, 11.5);

  const hPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.6, 8), mats.matWoodBeam);
  hPost1.position.set(-1.8, 0.8, 0);
  mountArea.add(hPost1);

  const hPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.6, 8), mats.matWoodBeam);
  hPost2.position.set(1.8, 0.8, 0);
  mountArea.add(hPost2);

  const hBar = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.16, 0.16), mats.matWoodBeam);
  hBar.position.set(0, 1.2, 0);
  mountArea.add(hBar);

  const cartBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 1.6), mats.matWoodMain);
  cartBody.position.set(1.2, 0.85, -2.5);
  cartBody.rotation.y = 0.35;
  mountArea.add(cartBody);

  const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.14, 12);
  const wheelL = new THREE.Mesh(wheelGeo, mats.matWoodBeam);
  wheelL.rotation.x = Math.PI / 2;
  wheelL.position.set(1.4, 0.55, -1.6);
  mountArea.add(wheelL);

  const wheelR = new THREE.Mesh(wheelGeo, mats.matWoodBeam);
  wheelR.rotation.x = Math.PI / 2;
  wheelR.position.set(1.0, 0.55, -3.4);
  mountArea.add(wheelR);

  envGroup.add(mountArea);
  restaurantGroup.add(envGroup);

  // r38 — SKALA DISESUAIKAN KE FOOTPRINT (laporan user 2026-11-05:
  // "rumah nembus restoran"). Model aslinya berdimensi ~32x28 unit,
  // footprint di dunia 8x8 tile (1 tile = 1 unit). Sebelum r38 skala
  // 0.88 membuat paviliun ~28x24 unit + tinggi 12 unit — visualnya
  // menelan bangunan tetangga meski petak tile-nya tidak tumpang.
  // Mulai r38: skala = min(w/32, h/28), paviliun muat di dalam
  // petaknya sendiri seperti bangunan lain. Konsekuensi jujur:
  // paviliun jadi jauh lebih pendek/gemuk (lebar ~8 unit, tinggi
  // ~3) — bukan lagi landmark menjulang. Bila nanti paviliun ingin
  // kembali menjulang, footprint-nya yang harus diperbesar di
  // katalog (bukan skala modelnya).
  const scale = Math.min(w / 32, h / 28);
  restaurantGroup.scale.set(scale, scale, scale);

  return root;
}
