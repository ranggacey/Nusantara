import * as THREE from "three";

// Cache material agar procedural canvas texture hanya dibuat 1x
let cachedMaterials: {
  matTimberBeam: THREE.MeshStandardMaterial;
  matWoodPlank: THREE.MeshStandardMaterial;
  matWoodShingle: THREE.MeshStandardMaterial;
  matPropWood: THREE.MeshStandardMaterial;
  matStoneMasonry: THREE.MeshStandardMaterial;
  matWroughtIron: THREE.MeshStandardMaterial;
  matLanternGlow: THREE.MeshStandardMaterial;
  matRope: THREE.MeshStandardMaterial;
} | null = null;

function getMaterials(): NonNullable<typeof cachedMaterials> {
  if (cachedMaterials) return cachedMaterials;

  let seed = 4207;
  function sRand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  function makeWoodTextures(baseHex: number, grainDarkness: number, plankLines: number) {
    const size = 256;
    const alb = document.createElement("canvas");
    const nor = document.createElement("canvas");
    const rou = document.createElement("canvas");
    alb.width = alb.height = nor.width = nor.height = rou.width = rou.height = size;

    const aCtx = alb.getContext("2d")!;
    const nCtx = nor.getContext("2d")!;
    const rCtx = rou.getContext("2d")!;

    const c = new THREE.Color(baseHex);
    const rBase = c.r * 255;
    const gBase = c.g * 255;
    const bBase = c.b * 255;

    const aImg = aCtx.createImageData(size, size);
    const nImg = nCtx.createImageData(size, size);
    const rImg = rCtx.createImageData(size, size);
    const hField = new Float32Array(size * size);

    for (let y = 0; y < size; y++) {
      const ny = y / size;
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const idx = (y * size + x) * 4;

        const knot = Math.sin(nx * Math.PI * 2) * Math.cos(ny * Math.PI * 4) * 0.08;
        const fiber =
          Math.sin(ny * 85 + knot * 22 + Math.sin(nx * 14) * 1.6) * 0.5 +
          Math.sin(ny * 240 + nx * 9) * 0.28 +
          (sRand() - 0.5) * 0.22;

        let seam = 0;
        if (plankLines > 0) {
          const pPos = (ny * plankLines) % 1.0;
          if (pPos < 0.035 || pPos > 0.965) seam = 1.0;
        }

        const h = 0.5 + fiber * 0.22 - seam * 0.42;
        hField[y * size + x] = h;

        const shade = 1.0 + fiber * grainDarkness - seam * 0.48;
        aImg.data[idx] = Math.max(0, Math.min(255, rBase * shade));
        aImg.data[idx + 1] = Math.max(0, Math.min(255, gBase * shade));
        aImg.data[idx + 2] = Math.max(0, Math.min(255, bBase * shade));
        aImg.data[idx + 3] = 255;

        const rv = Math.max(85, Math.min(245, (0.68 - fiber * 0.14 + seam * 0.25) * 255));
        rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = rv;
        rImg.data[idx + 3] = 255;
      }
    }

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const hL = hField[y * size + ((x - 1 + size) % size)];
        const hR = hField[y * size + ((x + 1) % size)];
        const hU = hField[((y - 1 + size) % size) * size + x];
        const hD = hField[((y + 1) % size) * size + x];
        const dx = (hL - hR) * 2.6;
        const dy = (hU - hD) * 2.6;
        const dz = 1.0;
        const l = Math.sqrt(dx * dx + dy * dy + dz * dz);
        nImg.data[idx] = ((dx / l) * 0.5 + 0.5) * 255;
        nImg.data[idx + 1] = ((dy / l) * 0.5 + 0.5) * 255;
        nImg.data[idx + 2] = ((dz / l) * 0.5 + 0.5) * 255;
        nImg.data[idx + 3] = 255;
      }
    }

    aCtx.putImageData(aImg, 0, 0);
    nCtx.putImageData(nImg, 0, 0);
    rCtx.putImageData(rImg, 0, 0);

    function wrap(cv: HTMLCanvasElement, repX: number, repY: number) {
      const t = new THREE.CanvasTexture(cv);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repX, repY);
      return t;
    }

    return {
      map: wrap(alb, 2, 2),
      normalMap: wrap(nor, 2, 2),
      roughnessMap: wrap(rou, 2, 2),
    };
  }

  function makeStoneTextures() {
    const size = 256;
    const alb = document.createElement("canvas");
    const nor = document.createElement("canvas");
    alb.width = alb.height = nor.width = nor.height = size;
    const aCtx = alb.getContext("2d")!;
    const nCtx = nor.getContext("2d")!;
    const aImg = aCtx.createImageData(size, size);
    const nImg = nCtx.createImageData(size, size);
    const hField = new Float32Array(size * size);

    for (let y = 0; y < size; y++) {
      const ny = y / size;
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const idx = (y * size + x) * 4;

        const row = Math.floor(ny * 6.0);
        const offset = (row % 2) * 0.5;
        const bx = (nx * 4.0 + offset) % 1.0;
        const by = (ny * 6.0) % 1.0;

        const warpX = Math.sin(ny * 18.0) * 0.04;
        const warpY = Math.cos(nx * 18.0) * 0.04;
        const edgeDist = Math.min(
          Math.abs(bx + warpX),
          Math.abs(1.0 - (bx + warpX)),
          Math.abs(by + warpY),
          Math.abs(1.0 - (by + warpY))
        );

        const mortar = edgeDist < 0.055 ? 1.0 - edgeDist / 0.055 : 0.0;
        const crag =
          Math.sin(nx * 48) * Math.cos(ny * 48) * 0.22 +
          Math.sin((nx + ny) * 95) * 0.12 +
          (sRand() - 0.5) * 0.14;
        const moss = ny > 0.72 ? Math.max(0, Math.sin(nx * 24 + ny * 19)) * 0.22 : 0.0;

        const h = 0.65 + crag * 0.25 - mortar * 0.52;
        hField[y * size + x] = h;

        const blockTint = (((row * 7 + Math.floor(nx * 4 + offset)) % 5) - 2) * 7;
        let r = 108 + blockTint + crag * 28 - mortar * 42 - moss * 26;
        let g = 110 + blockTint + crag * 28 - mortar * 40 + moss * 14;
        let b = 114 + blockTint + crag * 26 - mortar * 38 - moss * 20;

        aImg.data[idx] = Math.max(0, Math.min(255, r));
        aImg.data[idx + 1] = Math.max(0, Math.min(255, g));
        aImg.data[idx + 2] = Math.max(0, Math.min(255, b));
        aImg.data[idx + 3] = 255;
      }
    }

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const hL = hField[y * size + ((x - 1 + size) % size)];
        const hR = hField[y * size + ((x + 1) % size)];
        const hU = hField[((y - 1 + size) % size) * size + x];
        const hD = hField[((y + 1) % size) * size + x];
        const dx = (hL - hR) * 3.4;
        const dy = (hU - hD) * 3.4;
        const dz = 1.0;
        const l = Math.sqrt(dx * dx + dy * dy + dz * dz);
        nImg.data[idx] = ((dx / l) * 0.5 + 0.5) * 255;
        nImg.data[idx + 1] = ((dy / l) * 0.5 + 0.5) * 255;
        nImg.data[idx + 2] = ((dz / l) * 0.5 + 0.5) * 255;
        nImg.data[idx + 3] = 255;
      }
    }

    aCtx.putImageData(aImg, 0, 0);
    nCtx.putImageData(nImg, 0, 0);

    const map = new THREE.CanvasTexture(alb);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(2, 1.5);

    const normalMap = new THREE.CanvasTexture(nor);
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(2, 1.5);

    return { map, normalMap };
  }

  const darkOakTex = makeWoodTextures(0x4a301d, 0.22, 0);
  const plankWallTex = makeWoodTextures(0x7c5434, 0.25, 10);
  const roofShakeTex = makeWoodTextures(0x3b281b, 0.3, 16);
  const crateWoodTex = makeWoodTextures(0x936842, 0.24, 6);
  const stoneTex = makeStoneTextures();

  cachedMaterials = {
    matTimberBeam: new THREE.MeshStandardMaterial({
      map: darkOakTex.map,
      normalMap: darkOakTex.normalMap,
      roughness: 0.82,
      metalness: 0.04,
    }),
    matWoodPlank: new THREE.MeshStandardMaterial({
      map: plankWallTex.map,
      normalMap: plankWallTex.normalMap,
      roughness: 0.78,
      metalness: 0.03,
    }),
    matWoodShingle: new THREE.MeshStandardMaterial({
      map: roofShakeTex.map,
      normalMap: roofShakeTex.normalMap,
      roughness: 0.86,
      metalness: 0.03,
    }),
    matPropWood: new THREE.MeshStandardMaterial({
      map: crateWoodTex.map,
      normalMap: crateWoodTex.normalMap,
      roughness: 0.76,
      metalness: 0.04,
    }),
    matStoneMasonry: new THREE.MeshStandardMaterial({
      map: stoneTex.map,
      normalMap: stoneTex.normalMap,
      roughness: 0.88,
      metalness: 0.05,
    }),
    matWroughtIron: new THREE.MeshStandardMaterial({
      color: 0x22262c,
      roughness: 0.42,
      metalness: 0.86,
    }),
    matLanternGlow: new THREE.MeshStandardMaterial({
      color: 0xffb74d,
      emissive: 0xff9800,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    }),
    matRope: new THREE.MeshStandardMaterial({
      color: 0xa6895b,
      roughness: 0.92,
      metalness: 0.0,
    }),
  };

  return cachedMaterials;
}

export function createFantasyWarehouse(w = 2, h = 2): THREE.Group {
  const root = new THREE.Group();
  root.name = "Gudang_Penyimpanan_MMORPG";

  const mats = getMaterials();
  const {
    matTimberBeam,
    matWoodPlank,
    matWoodShingle,
    matPropWood,
    matStoneMasonry,
    matWroughtIron,
    matLanternGlow,
    matRope,
  } = mats;

  const warehouseGroup = new THREE.Group();
  root.add(warehouseGroup);

  function addMesh(
    parent: THREE.Group,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    px = 0,
    py = 0,
    pz = 0,
    rx = 0,
    ry = 0,
    rz = 0
  ) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(px, py, pz);
    m.rotation.set(rx, ry, rz);
    parent.add(m);
    return m;
  }

  // --- PART A: 20% STONE ARCHITECTURE ---
  const stoneGroup = new THREE.Group();
  warehouseGroup.add(stoneGroup);

  // 1. Raised Stone Foundation Plinth
  addMesh(stoneGroup, new THREE.BoxGeometry(9.4, 1.15, 7.4), matStoneMasonry, 0, 0.575, 0);
  addMesh(stoneGroup, new THREE.BoxGeometry(9.65, 0.18, 7.65), matStoneMasonry, 0, 1.12, 0);

  // 2. Corner Stone Quoins & Buttress Pillars
  const cornerCoords = [
    [-4.65, 3.65],
    [4.65, 3.65],
    [-4.65, -3.65],
    [4.65, -3.65],
    [-4.65, 0.0],
    [4.65, 0.0],
  ];
  cornerCoords.forEach(([cx, cz]) => {
    addMesh(stoneGroup, new THREE.BoxGeometry(0.92, 1.65, 0.92), matStoneMasonry, cx, 0.825, cz);
    for (let q = 0; q < 4; q++) {
      const qw = q % 2 === 0 ? 0.72 : 0.58;
      const qd = q % 2 === 0 ? 0.58 : 0.72;
      addMesh(stoneGroup, new THREE.BoxGeometry(qw, 0.36, qd), matStoneMasonry, cx, 1.4 + q * 0.38, cz);
    }
  });

  // 3. Heavy Stone Steps
  for (let s = 0; s < 4; s++) {
    const stepW = 2.4 - s * 0.06;
    addMesh(
      stoneGroup,
      new THREE.BoxGeometry(stepW, 0.26, 0.46),
      matStoneMasonry,
      -2.65,
      0.13 + s * 0.26,
      5.85 - s * 0.42
    );
  }

  // --- PART B: 80% WOOD ARCHITECTURE ---
  const woodGroup = new THREE.Group();
  warehouseGroup.add(woodGroup);

  // Ground Floor Hall
  const gfY = 1.18 + 1.6;
  addMesh(woodGroup, new THREE.BoxGeometry(9.0, 3.2, 7.0), matWoodPlank, 0, gfY, 0);

  // Posts
  const postGeo = new THREE.BoxGeometry(0.28, 3.3, 0.28);
  const frontBackX = [-4.45, -2.15, 0.0, 2.15, 4.45];
  frontBackX.forEach((px) => {
    addMesh(woodGroup, postGeo, matTimberBeam, px, gfY, 3.52);
    addMesh(woodGroup, postGeo, matTimberBeam, px, gfY, -3.52);
  });
  [-1.8, 0.0, 1.8].forEach((pz) => {
    addMesh(woodGroup, postGeo, matTimberBeam, -4.52, gfY, pz);
    addMesh(woodGroup, postGeo, matTimberBeam, 4.52, gfY, pz);
  });

  // Beams
  addMesh(woodGroup, new THREE.BoxGeometry(9.4, 0.32, 0.36), matTimberBeam, 0, 4.38, 3.55);
  addMesh(woodGroup, new THREE.BoxGeometry(9.4, 0.32, 0.36), matTimberBeam, 0, 4.38, -3.55);
  addMesh(woodGroup, new THREE.BoxGeometry(0.36, 0.32, 7.4), matTimberBeam, -4.55, 4.38, 0);
  addMesh(woodGroup, new THREE.BoxGeometry(0.36, 0.32, 7.4), matTimberBeam, 4.55, 4.38, 0);

  // Upper Loft
  const ufY = 4.45 + 1.2;
  addMesh(woodGroup, new THREE.BoxGeometry(9.6, 2.4, 7.6), matWoodPlank, 0, ufY, 0);

  // Corbels
  for (let ix = -4; ix <= 4; ix += 2) {
    addMesh(woodGroup, new THREE.BoxGeometry(0.22, 0.45, 0.55), matTimberBeam, ix * 1.08, 4.28, 3.68);
    addMesh(woodGroup, new THREE.BoxGeometry(0.22, 0.45, 0.55), matTimberBeam, ix * 1.08, 4.28, -3.68);
  }

  // Gable Walls
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-3.95, 0);
  gableShape.lineTo(3.95, 0);
  gableShape.lineTo(0.0, 3.45);
  gableShape.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 9.6, bevelEnabled: false });
  gableGeo.translate(0, 6.8, -4.8);
  gableGeo.rotateY(Math.PI * 0.5);
  addMesh(woodGroup, gableGeo, matWoodPlank, 0, 0, 0);

  // Main Shingled Roof Slopes
  const roofSlopeLen = 5.65;
  const roofWidth = 10.6;
  const roofAngle = Math.atan2(3.5, 4.05);

  addMesh(woodGroup, new THREE.BoxGeometry(roofWidth, 0.24, roofSlopeLen), matWoodShingle, 0, 8.38, 2.12, roofAngle, 0, 0);
  addMesh(woodGroup, new THREE.BoxGeometry(roofWidth, 0.24, roofSlopeLen), matWoodShingle, 0, 8.38, -2.12, -roofAngle, 0, 0);

  // Ridge Beam & Finials
  addMesh(woodGroup, new THREE.BoxGeometry(11.1, 0.34, 0.34), matTimberBeam, 0, 10.32, 0);
  [-5.25, 5.25].forEach((gx) => {
    addMesh(woodGroup, new THREE.BoxGeometry(0.28, 1.45, 0.28), matTimberBeam, gx, 10.45, 0);
    addMesh(woodGroup, new THREE.ConeGeometry(0.22, 0.65, 6), matWroughtIron, gx, 11.42, 0);
  });

  // Hoist Dormer Crane & Suspended Cargo
  const dormerGroup = new THREE.Group();
  dormerGroup.position.set(1.15, 6.85, 3.35);
  woodGroup.add(dormerGroup);

  addMesh(dormerGroup, new THREE.BoxGeometry(2.35, 2.05, 1.85), matWoodPlank, 0, 0.65, 0);
  addMesh(dormerGroup, new THREE.BoxGeometry(1.65, 2.05, 2.15), matWoodShingle, -0.72, 1.92, 0.15, 0, 0, 0.65);
  addMesh(dormerGroup, new THREE.BoxGeometry(1.65, 2.05, 2.15), matWoodShingle, 0.72, 1.92, 0.15, 0, 0, -0.65);
  addMesh(dormerGroup, new THREE.BoxGeometry(0.28, 0.28, 2.95), matTimberBeam, 0, 2.42, 0.45);

  const pulleyWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.12, 16), matWroughtIron);
  pulleyWheel.rotation.z = Math.PI * 0.5;
  pulleyWheel.position.set(0, 2.18, 1.72);
  dormerGroup.add(pulleyWheel);

  addMesh(dormerGroup, new THREE.CylinderGeometry(0.035, 0.035, 2.85, 8), matRope, 0, 0.75, 1.72);

  // Suspended Crate
  const hoistedCrate = new THREE.Group();
  hoistedCrate.position.set(0, -1.25, 1.72);
  hoistedCrate.rotation.set(0.06, 0.28, -0.05);
  dormerGroup.add(hoistedCrate);
  addMesh(hoistedCrate, new THREE.BoxGeometry(0.92, 0.92, 0.92), matPropWood, 0, 0, 0);

  // Main Warehouse Cargo Doors
  addMesh(woodGroup, new THREE.BoxGeometry(2.65, 2.75, 0.24), matTimberBeam, 1.15, 2.58, 3.54);
  const doorLeft = new THREE.Group();
  doorLeft.position.set(0.0, 2.55, 3.6);
  doorLeft.rotation.y = -0.18;
  woodGroup.add(doorLeft);
  addMesh(doorLeft, new THREE.BoxGeometry(1.12, 2.52, 0.14), matPropWood, 0.56, 0, 0);
  addMesh(doorLeft, new THREE.BoxGeometry(0.72, 0.08, 0.2), matWroughtIron, 0.38, 0.85, 0.02);

  const doorRight = new THREE.Group();
  doorRight.position.set(2.3, 2.55, 3.6);
  doorRight.rotation.y = 0.08;
  woodGroup.add(doorRight);
  addMesh(doorRight, new THREE.BoxGeometry(1.12, 2.52, 0.14), matPropWood, -0.56, 0, 0);
  addMesh(doorRight, new THREE.BoxGeometry(0.72, 0.08, 0.2), matWroughtIron, -0.38, 0.85, 0.02);

  // Covered Loading Porch Deck
  addMesh(woodGroup, new THREE.BoxGeometry(9.4, 0.14, 1.8), matPropWood, 0, 1.16, 4.6);
  [-4.3, -1.2, 4.3].forEach((px) => {
    addMesh(woodGroup, new THREE.BoxGeometry(0.24, 2.65, 0.24), matTimberBeam, px, 2.48, 5.25);
  });
  addMesh(woodGroup, new THREE.BoxGeometry(9.5, 0.24, 0.24), matTimberBeam, 0, 3.75, 5.25);
  addMesh(woodGroup, new THREE.BoxGeometry(9.7, 0.18, 2.35), matWoodShingle, 0, 4.1, 4.55, 0.34, 0, 0);

  // Cargo Crates & Oak Barrels
  const barrelGeo = new THREE.CylinderGeometry(0.36, 0.32, 0.9, 10);
  const b1 = new THREE.Mesh(barrelGeo, matPropWood);
  b1.position.set(-0.65, 1.65, 4.35);
  woodGroup.add(b1);
  const b2 = new THREE.Mesh(barrelGeo, matPropWood);
  b2.position.set(-0.1, 1.65, 4.72);
  woodGroup.add(b2);

  const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), matPropWood);
  crate1.position.set(3.15, 1.65, 4.45);
  crate1.rotation.y = 0.18;
  woodGroup.add(crate1);

  // Hanging Iron Lanterns
  const lanternGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.28, 6);
  const l1 = new THREE.Mesh(lanternGeo, matLanternGlow);
  l1.position.set(-0.45, 3.2, 3.8);
  woodGroup.add(l1);
  const l2 = new THREE.Mesh(lanternGeo, matLanternGlow);
  l2.position.set(2.75, 3.2, 3.8);
  woodGroup.add(l2);

  // Skalakan ke footprint (lebar w, panjang h)
  const baseScale = Math.min(w, h) / 7.2;
  warehouseGroup.scale.set(baseScale, baseScale, baseScale);

  return root;
}
