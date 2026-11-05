import * as THREE from "three";

// ==========================================
// MODULAR 3D ROAD ASSETS (LEVEL 1, 2, 3)
// ==========================================

export type RoadType = "straight" | "corner" | "tjunction" | "crossroad" | "deadend";

// Shared Materials Library
let roadMats: {
  grass: THREE.MeshStandardMaterial;
  dirt: THREE.MeshStandardMaterial;
  dirtPebble: THREE.MeshStandardMaterial;

  cobbleBase: THREE.MeshStandardMaterial;
  cobbleStone: THREE.MeshStandardMaterial;
  cobbleBorder: THREE.MeshStandardMaterial;

  royalGrass: THREE.MeshStandardMaterial;
  royalBase: THREE.MeshStandardMaterial;
  royalGold: THREE.MeshStandardMaterial;
  royalStone: THREE.MeshStandardMaterial;
} | null = null;

function getRoadMats() {
  if (roadMats) return roadMats;
  roadMats = {
    grass: new THREE.MeshStandardMaterial({ color: "#5b8231", roughness: 1.0 }),
    dirt: new THREE.MeshStandardMaterial({ color: "#6e4e32", roughness: 0.9 }),
    dirtPebble: new THREE.MeshStandardMaterial({ color: "#523a25", roughness: 0.9 }),

    cobbleBase: new THREE.MeshStandardMaterial({ color: "#303030", roughness: 0.9 }),
    cobbleStone: new THREE.MeshStandardMaterial({ color: "#7a7a7a", roughness: 0.8 }),
    cobbleBorder: new THREE.MeshStandardMaterial({ color: "#575757", roughness: 0.7 }),

    royalGrass: new THREE.MeshStandardMaterial({ color: "#4a752c", roughness: 0.9 }),
    royalBase: new THREE.MeshStandardMaterial({ color: "#e6d8b8", roughness: 0.6 }),
    royalGold: new THREE.MeshStandardMaterial({ color: "#c49f37", roughness: 0.3, metalness: 0.5 }),
    royalStone: new THREE.MeshStandardMaterial({ color: "#f2e8d0", roughness: 0.4 }),
  };
  return roadMats;
}

// Predikat material bersama (r36, pasangan isVillageMaterial):
// cache module-level ini dipakai ulang tiap rebuild jalan, jadi
// disposeGroup TIDAK boleh membuangnya; cleanup unmount tetap
// membuang semua saat komponen benar-benar lepas.
export function isRoadMaterial(mat: THREE.Material): boolean {
  return (Object.values(getRoadMats()) as THREE.Material[]).includes(mat);
}

const TILE_SIZE = 4;
const HALF_TILE = TILE_SIZE / 2;

// Determines mathematically if a point is on the road surface
function isPath(x: number, z: number, type: RoadType, hw: number): boolean {
  const inN = z < 0 && Math.abs(x) <= hw;
  const inS = z > 0 && Math.abs(x) <= hw;
  const inE = x > 0 && Math.abs(z) <= hw;
  const inW = x < 0 && Math.abs(z) <= hw;
  const inCenter = Math.abs(x) <= hw && Math.abs(z) <= hw;

  if (inCenter) return true;
  if (type === "straight") return inN || inS;
  if (type === "corner") return inN || inE;
  if (type === "tjunction") return inN || inS || inE;
  if (type === "crossroad") return inN || inS || inE || inW;
  if (type === "deadend") return inN;
  return false;
}

// Generates a perfect seamless 2D contour of the road for extrusion
function getRoadShape(type: RoadType, hw: number): THREE.Shape {
  const hasN = ["straight", "corner", "tjunction", "crossroad", "deadend"].includes(type);
  const hasS = ["straight", "tjunction", "crossroad"].includes(type);
  const hasE = ["corner", "tjunction", "crossroad"].includes(type);
  const hasW = ["crossroad"].includes(type);

  const s = new THREE.Shape();
  s.moveTo(hw, -hw); // NE corner of center

  // Draw perimeter clockwise
  if (hasN) {
    s.lineTo(hw, -HALF_TILE);
    s.lineTo(-hw, -HALF_TILE);
    s.lineTo(-hw, -hw);
  } else {
    s.lineTo(-hw, -hw);
  }

  if (hasW) {
    s.lineTo(-HALF_TILE, -hw);
    s.lineTo(-HALF_TILE, hw);
    s.lineTo(-hw, hw);
  } else {
    s.lineTo(-hw, hw);
  }

  if (hasS) {
    s.lineTo(-hw, HALF_TILE);
    s.lineTo(hw, HALF_TILE);
    s.lineTo(hw, hw);
  } else {
    s.lineTo(hw, hw);
  }

  if (hasE) {
    s.lineTo(HALF_TILE, hw);
    s.lineTo(HALF_TILE, -hw);
    s.lineTo(hw, -hw);
  } else {
    s.lineTo(hw, -hw);
  }

  return s;
}

// Creates a flat geometric footprint of the road
function createRoadFootprint(type: RoadType, hw: number, depth: number, material: THREE.Material, yOffset: number): THREE.Mesh {
  const shape = getRoadShape(type, hw);
  const extrudeSettings = { depth, bevelEnabled: false };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.rotateX(Math.PI / 2);
  geo.translate(0, yOffset + depth, 0);

  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return mesh;
}

// ==========================================
// 1. DIRT ROAD (LEVEL 1)
// ==========================================
export function createDirtRoadTile(type: RoadType): THREE.Group {
  const mats = getRoadMats();
  const group = new THREE.Group();
  const hw = 1.0;

  group.add(createRoadFootprint(type, hw, 0.05, mats.dirt, 0));

  // Scatter pebbles on path and grass on borders
  const dummy = new THREE.Object3D();
  const pebbleGeo = new THREE.DodecahedronGeometry(0.08, 0);
  const grassGeo = new THREE.BoxGeometry(0.05, 0.2, 0.05);

  const instPebbles = new THREE.InstancedMesh(pebbleGeo, mats.dirtPebble, 50);
  const instGrass = new THREE.InstancedMesh(grassGeo, mats.grass, 80);
  instPebbles.castShadow = true;
  instGrass.castShadow = true;

  let pIdx = 0;
  let gIdx = 0;

  for (let i = 0; i < 140; i++) {
    const x = (Math.random() - 0.5) * TILE_SIZE;
    const z = (Math.random() - 0.5) * TILE_SIZE;

    if (isPath(x, z, type, hw)) {
      if (pIdx < 50 && Math.random() > 0.4) {
        dummy.position.set(x, 0.05, z);
        dummy.scale.setScalar(0.5 + Math.random() * 0.8);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        dummy.updateMatrix();
        instPebbles.setMatrixAt(pIdx++, dummy.matrix);
      }
    } else {
      if (gIdx < 80) {
        dummy.position.set(x, 0.1, z);
        dummy.scale.set(1, 0.5 + Math.random() * 1.5, 1);
        dummy.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * Math.PI, (Math.random() - 0.5) * 0.5);
        dummy.updateMatrix();
        instGrass.setMatrixAt(gIdx++, dummy.matrix);
      }
    }
  }

  instPebbles.count = pIdx;
  instGrass.count = gIdx;
  group.add(instPebbles, instGrass);

  return group;
}

// ==========================================
// 2. COBBLESTONE ROAD (LEVEL 2)
// ==========================================
export function createCobblestoneRoadTile(type: RoadType): THREE.Group {
  const mats = getRoadMats();
  const group = new THREE.Group();
  const hw = 1.2;
  const innerHw = 1.0;

  group.add(createRoadFootprint(type, hw, 0.05, mats.cobbleBase, 0));

  const stoneGeo = new THREE.BoxGeometry(0.22, 0.1, 0.22);
  const instStones = new THREE.InstancedMesh(stoneGeo, mats.cobbleStone, 160);
  const borderGeo = new THREE.BoxGeometry(0.28, 0.12, 0.28);
  const instBorders = new THREE.InstancedMesh(borderGeo, mats.cobbleBorder, 80);
  instStones.castShadow = true;
  instStones.receiveShadow = true;
  instBorders.castShadow = true;
  instBorders.receiveShadow = true;

  let sIdx = 0;
  let bIdx = 0;
  const dummy = new THREE.Object3D();

  const step = 0.32;
  for (let x = -1.85; x <= 1.85; x += step) {
    for (let z = -1.85; z <= 1.85; z += step) {
      if (isPath(x, z, type, hw)) {
        const isBorder = !isPath(x, z, type, innerHw);

        dummy.position.set(x + (Math.random() - 0.5) * 0.07, 0.05 + 0.04, z + (Math.random() - 0.5) * 0.07);
        dummy.rotation.y = Math.random() * 0.5;

        if (isBorder && bIdx < 80) {
          dummy.scale.setScalar(0.8 + Math.random() * 0.3);
          dummy.updateMatrix();
          instBorders.setMatrixAt(bIdx++, dummy.matrix);
        } else if (sIdx < 160) {
          dummy.scale.set(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4);
          dummy.updateMatrix();
          instStones.setMatrixAt(sIdx++, dummy.matrix);
        }
      }
    }
  }

  instStones.count = sIdx;
  instBorders.count = bIdx;
  group.add(instStones, instBorders);

  return group;
}

// ==========================================
// 3. ROYAL PAVED ROAD (LEVEL 3)
// ==========================================
export function createRoyalRoadTile(type: RoadType): THREE.Group {
  const mats = getRoadMats();
  const group = new THREE.Group();
  const hw = 1.4;
  const innerHw = 1.25;

  // Gold Trim
  group.add(createRoadFootprint(type, hw, 0.06, mats.royalGold, 0));
  // Ivory Mortar Base
  group.add(createRoadFootprint(type, innerHw, 0.08, mats.royalBase, 0));

  const tileGeo = new THREE.BoxGeometry(0.55, 0.06, 0.55);
  const instTiles = new THREE.InstancedMesh(tileGeo, mats.royalStone, 80);
  instTiles.castShadow = true;
  instTiles.receiveShadow = true;

  let tIdx = 0;
  const dummy = new THREE.Object3D();
  const step = 0.6;

  for (let x = -1.8; x <= 1.8; x += step) {
    for (let z = -1.8; z <= 1.8; z += step) {
      if (isPath(x, z, type, innerHw - 0.1) && tIdx < 80) {
        dummy.position.set(x, 0.08 + 0.03, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        instTiles.setMatrixAt(tIdx++, dummy.matrix);
      }
    }
  }

  instTiles.count = tIdx;
  group.add(instTiles);

  return group;
}

// ==========================================
// 4. ADAPTIVE LOGIC: AUTOMATIC CONNECTION PIECE
// ==========================================
export function determineRoadPiece(
  gx: number,
  gy: number,
  roadSet: Set<string>
): { type: RoadType; rotationY: number } {
  // Grid North is gy - 1 (-Z in Three.js)
  // Grid South is gy + 1 (+Z in Three.js)
  // Grid East is gx + 1 (+X in Three.js)
  // Grid West is gx - 1 (-X in Three.js)
  const hasN = roadSet.has(`${gx},${gy - 1}`);
  const hasS = roadSet.has(`${gx},${gy + 1}`);
  const hasE = roadSet.has(`${gx + 1},${gy}`);
  const hasW = roadSet.has(`${gx - 1},${gy}`);
  const count = (hasN ? 1 : 0) + (hasS ? 1 : 0) + (hasE ? 1 : 0) + (hasW ? 1 : 0);

  if (count === 4) {
    return { type: "crossroad", rotationY: 0 };
  }
  if (count === 3) {
    if (hasN && hasS && hasE) return { type: "tjunction", rotationY: 0 };
    if (hasN && hasS && hasW) return { type: "tjunction", rotationY: Math.PI };
    if (hasN && hasE && hasW) return { type: "tjunction", rotationY: -Math.PI / 2 };
    if (hasS && hasE && hasW) return { type: "tjunction", rotationY: Math.PI / 2 };
  }
  if (count === 2) {
    if (hasN && hasS) return { type: "straight", rotationY: 0 };
    if (hasE && hasW) return { type: "straight", rotationY: Math.PI / 2 };
    if (hasN && hasE) return { type: "corner", rotationY: 0 };
    if (hasE && hasS) return { type: "corner", rotationY: Math.PI / 2 };
    if (hasS && hasW) return { type: "corner", rotationY: Math.PI };
    if (hasW && hasN) return { type: "corner", rotationY: -Math.PI / 2 };
  }
  if (count === 1) {
    if (hasN) return { type: "deadend", rotationY: 0 };
    if (hasE) return { type: "deadend", rotationY: Math.PI / 2 };
    if (hasS) return { type: "deadend", rotationY: Math.PI };
    if (hasW) return { type: "deadend", rotationY: -Math.PI / 2 };
  }

  // Standalone or unlinked default
  return { type: "straight", rotationY: 0 };
}

// Master Dispatcher for 1x1 Grid Road Tile
export function createModularRoadTile(type: RoadType, level = 1): THREE.Group {
  let rawTile: THREE.Group;
  if (level === 2) {
    rawTile = createCobblestoneRoadTile(type);
  } else if (level >= 3) {
    rawTile = createRoyalRoadTile(type);
  } else {
    rawTile = createDirtRoadTile(type);
  }

  // Scale 4.0 tile down to 1.0 grid unit
  const wrapper = new THREE.Group();
  rawTile.scale.set(0.25, 0.5, 0.25);
  wrapper.add(rawTile);
  return wrapper;
}
