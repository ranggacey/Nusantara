// @ts-nocheck
// ============================================================================
// TOMBAK IBLIS MERAH — model senjata Figo (RONDE 14).
// Fungsi createCrimsonDemonicSpear di bawah ini adalah SALINAN VERBATIM
// (apa adanya, tanpa satu pun perubahan geometri/material/warna) dari
// aset user: ~/workspace/user/files/Crimson_Demonic_Spear_3D_Asset___MMORPG_Ready.html
// (Three.js r128 prosedural, 29KB, 667 baris).
// Yang TIDAK ikut disalin (bukan kode spear, melainkan scaffolding viewer
// halaman HTML itu): IIFE initViewport (renderer/scene/camera/lampu/
// OrbitControls/animate) dan penugasan window.createCrimsonDemonicSpear.
// Kompatibilitas three 0.187 (game) vs r128 (aset): aset memakai
// THREE.sRGBEncoding yang sudah tidak ada di three 0.187 — shim-nya ada
// DI LUAR file ini (src/lib/batu/senjataIblis.ts: objek THREE kompatibel
// + subclass CanvasTexture yang memetakan encoding -> colorSpace).
// File ini sendiri TIDAK diubah selain penambahan header ini + baris
// export di akhir.
// ============================================================================

function createCrimsonDemonicSpear(THREE) {
    const spearGroup = new THREE.Group();
    spearGroup.name = 'MMORPG_Crimson_Demonic_Spear';

    // --------------------------------------------------------------------------
    // 1. PROCEDURAL 1024x1024 PBR TEXTURES (Pitted Forged Iron + Crimson Veins)
    // --------------------------------------------------------------------------
    let seed = 918273;
    function sRand() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    function createCrimsonForgedTextures() {
      const size = 512;
      const albCanvas = document.createElement('canvas');
      const emiCanvas = document.createElement('canvas');
      const norCanvas = document.createElement('canvas');
      const rouCanvas = document.createElement('canvas');
      albCanvas.width = albCanvas.height = size;
      emiCanvas.width = emiCanvas.height = size;
      norCanvas.width = norCanvas.height = size;
      rouCanvas.width = rouCanvas.height = size;

      const aCtx = albCanvas.getContext('2d');
      const eCtx = emiCanvas.getContext('2d');
      const nCtx = norCanvas.getContext('2d');
      const rCtx = rouCanvas.getContext('2d');

      const aImg = aCtx.createImageData(size, size);
      const eImg = eCtx.createImageData(size, size);
      const nImg = nCtx.createImageData(size, size);
      const rImg = rCtx.createImageData(size, size);
      const hMap = new Float32Array(size * size);

      for (let y = 0; y < size; y++) {
        const ny = y / size;
        for (let x = 0; x < size; x++) {
          const nx = x / size;
          const idx = (y * size + x) * 4;

          // Multi-octave organic volcanic crag + blood-vein network
          const w1 = Math.sin(nx * 18.0 + Math.cos(ny * 14.0) * 2.2) * Math.cos(ny * 22.0 + Math.sin(nx * 16.0) * 2.0);
          const w2 = Math.sin((nx * 45.0 - ny * 38.0) + w1 * 3.0) * 0.5;
          const w3 = Math.cos((nx * 110.0 + ny * 95.0) + w2 * 2.5) * 0.25;
          const grit = (sRand() - 0.5) * 0.28;

          // Sharp magma/blood fissure veins where |w1 + w2*0.6| is near zero
          const veinRaw = 1.0 - Math.min(1.0, Math.abs(w1 * 0.75 + w2 * 0.45) * 4.2);
          const vein = Math.pow(Math.max(0, veinRaw), 2.4);
          const crimsonPatch = Math.max(0, w1 * 0.5 + 0.35 + w2 * 0.3);

          const heightVal = 0.55 + (w1 * 0.28 + w2 * 0.16 + w3 * 0.10 + grit * 0.12) - vein * 0.35;
          hMap[y * size + x] = heightVal;

          // Albedo: charred obsidian-iron base + dried blood-crimson crust + bright scarlet veins
          const r = 24 + crimsonPatch * 115 + vein * 135 + grit * 18;
          const g = 10 + crimsonPatch * 16 + vein * 28 + grit * 6;
          const b = 10 + crimsonPatch * 12 + vein * 12 + grit * 6;

          aImg.data[idx]     = Math.max(0, Math.min(255, r));
          aImg.data[idx + 1] = Math.max(0, Math.min(255, g));
          aImg.data[idx + 2] = Math.max(0, Math.min(255, b));
          aImg.data[idx + 3] = 255;

          // Emissive: deep smoldering crimson-orange inside veins & hot patches
          const emiStrength = Math.min(1.0, vein * 1.15 + Math.pow(crimsonPatch, 2.2) * 0.42);
          eImg.data[idx]     = Math.floor(emiStrength * 255);
          eImg.data[idx + 1] = Math.floor(Math.pow(emiStrength, 1.8) * 58);
          eImg.data[idx + 2] = Math.floor(Math.pow(emiStrength, 2.6) * 22);
          eImg.data[idx + 3] = 255;

          // Roughness: polished metallic ridges, rougher pitted crust
          const rough = Math.max(45, Math.min(235, (0.58 - w3 * 0.35 - vein * 0.22 + grit * 0.2) * 255));
          rImg.data[idx] = rImg.data[idx + 1] = rImg.data[idx + 2] = rough;
          rImg.data[idx + 3] = 255;
        }
      }

      // Compute normal map from height field
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const hL = hMap[y * size + ((x - 1 + size) % size)];
          const hR = hMap[y * size + ((x + 1) % size)];
          const hU = hMap[((y - 1 + size) % size) * size + x];
          const hD = hMap[((y + 1) % size) * size + x];
          const dx = (hL - hR) * 4.2;
          const dy = (hU - hD) * 4.2;
          const dz = 1.0;
          const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
          nImg.data[idx]     = ((dx / len) * 0.5 + 0.5) * 255;
          nImg.data[idx + 1] = ((dy / len) * 0.5 + 0.5) * 255;
          nImg.data[idx + 2] = ((dz / len) * 0.5 + 0.5) * 255;
          nImg.data[idx + 3] = 255;
        }
      }

      aCtx.putImageData(aImg, 0, 0);
      eCtx.putImageData(eImg, 0, 0);
      nCtx.putImageData(nImg, 0, 0);
      rCtx.putImageData(rImg, 0, 0);

      function makeTex(canvas, repX, repY, isSRGB) {
        const t = new THREE.CanvasTexture(canvas);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(repX, repY);
        if (isSRGB) t.encoding = THREE.sRGBEncoding;
        return t;
      }

      return {
        bladeMap: makeTex(albCanvas, 1.5, 3.0, true),
        bladeEmissive: makeTex(emiCanvas, 1.5, 3.0, true),
        bladeNormal: makeTex(norCanvas, 2.0, 4.0, false),
        bladeRoughness: makeTex(rouCanvas, 2.0, 4.0, false),
        shaftMap: makeTex(albCanvas, 1.0, 6.0, true),
        shaftEmissive: makeTex(emiCanvas, 1.0, 6.0, true),
        shaftNormal: makeTex(norCanvas, 1.5, 8.0, false),
        shaftRoughness: makeTex(rouCanvas, 1.5, 8.0, false)
      };
    }

    const tex = createCrimsonForgedTextures();

    // Primary Crimson-Forged Blade Material (PBR with smoldering inner glow & metallic bevels)
    const matCrimsonBlade = new THREE.MeshStandardMaterial({
      map: tex.bladeMap,
      emissiveMap: tex.bladeEmissive,
      emissive: new THREE.Color(0xff2208),
      emissiveIntensity: 0.95,
      normalMap: tex.bladeNormal,
      normalScale: new THREE.Vector2(1.45, 1.45),
      roughnessMap: tex.bladeRoughness,
      roughness: 0.46,
      metalness: 0.68,
      side: THREE.DoubleSide
    });

    // Dark Corrupted Shaft Material (Charred ironwood & dark bronze with crimson streaks)
    const matDarkShaft = new THREE.MeshStandardMaterial({
      map: tex.shaftMap,
      emissiveMap: tex.shaftEmissive,
      emissive: new THREE.Color(0xd91b0b),
      emissiveIntensity: 0.55,
      normalMap: tex.shaftNormal,
      normalScale: new THREE.Vector2(1.2, 1.2),
      roughnessMap: tex.shaftRoughness,
      roughness: 0.58,
      metalness: 0.52
    });

    // Dark Aged Bronze / Blackened Iron Collar Material (for pommel rings & guard fittings)
    const matDarkBronze = new THREE.MeshStandardMaterial({
      color: 0x2a211d,
      normalMap: tex.bladeNormal,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughness: 0.38,
      metalness: 0.85
    });

    // --------------------------------------------------------------------------
    // 2. GEOMETRY HELPER: DIAMOND-BEVEL FORGED BLADE ALONG A SPINE CURVE
    //    Builds a 6-node cross-section (left edge, upper/lower fuller, central
    //    spine ridge, right edge) with organic serrated edge crags.
    // --------------------------------------------------------------------------
    function buildBeveledBladeGeometry(spineSamples) {
      const geo = new THREE.BufferGeometry();
      const positions = [];
      const uvs = [];
      const indices = [];
      const ringSize = 8; // 8 vertices around the diamond/fuller cross-section per slice

      for (let i = 0; i < spineSamples.length; i++) {
        const s = spineSamples[i];
        const v = i / (spineSamples.length - 1);

        // Tangent along spine in XY plane to orient cross-section perpendicular to spine
        const prev = spineSamples[Math.max(0, i - 1)];
        const next = spineSamples[Math.min(spineSamples.length - 1, i + 1)];
        const tx = next.x - prev.x;
        const ty = next.y - prev.y;
        const tLen = Math.hypot(tx, ty) || 1.0;
        // Normal vector in XY plane perpendicular to spine
        const nx = -ty / tLen;
        const ny =  tx / tLen;

        // Organic jagged serration along blade edges (matches eroded dark-fantasy steel)
        const crag = Math.sin(v * 42.0) * 0.008 + Math.cos(v * 95.0) * 0.004;
        const w = Math.max(0.0015, s.halfWidth + (v > 0.05 && v < 0.92 ? crag * s.halfWidth : 0));
        const th = Math.max(0.001, s.halfThick);

        // 8-point cross section in (localWidthOffset, localZThickness):
        // 0: Left sharp cutting edge (-w, 0)
        // 1: Front-left bevel (-w*0.38, +th*0.62)
        // 2: Front central spine ridge (0, +th)
        // 3: Front-right bevel (+w*0.38, +th*0.62)
        // 4: Right sharp cutting edge (+w, 0)
        // 5: Back-right bevel (+w*0.38, -th*0.62)
        // 6: Back central spine ridge (0, -th)
        // 7: Back-left bevel (-w*0.38, -th*0.62)
        const profile = [
          [-w, 0],
          [-w * 0.36,  th * 0.58],
          [0,          th],
          [ w * 0.36,  th * 0.58],
          [ w, 0],
          [ w * 0.36, -th * 0.58],
          [0,         -th],
          [-w * 0.36, -th * 0.58]
        ];

        for (let p = 0; p <= ringSize; p++) {
          const pt = profile[p % ringSize];
          const localW = pt[0] + (s.asymOffset || 0);
          const localZ = pt[1];
          const px = s.x + nx * localW;
          const py = s.y + ny * localW;
          const pz = (s.z || 0) + localZ;
          positions.push(px, py, pz);
          uvs.push(p / ringSize, v);
        }
      }

      const stride = ringSize + 1;
      for (let i = 0; i < spineSamples.length - 1; i++) {
        for (let p = 0; p < ringSize; p++) {
          const a = i * stride + p;
          const b = a + 1;
          const c = (i + 1) * stride + p;
          const d = c + 1;
          indices.push(a, b, d, a, d, c);
        }
      }

      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    }

    // --------------------------------------------------------------------------
    // 3. CENTRAL MAIN SPEARHEAD (Mata Tombak Utama Tengah + Side Barbs)
    //    Spans from y = +0.42 (collar junction) to y = +2.68 (lethal tip)
    // --------------------------------------------------------------------------
    const mainBladeSamples = [];
    const mainSteps = 96;
    for (let i = 0; i <= mainSteps; i++) {
      const t = i / mainSteps; // 0 = base at guard, 1 = needle tip
      const y = 0.42 + t * 2.26;

      // Base leaf/dagger taper profile
      let w = 0.145 * Math.pow(1.0 - t, 0.68) * (0.65 + 0.55 * Math.sin(Math.min(1.0, t * 1.6) * Math.PI * 0.85));

      // Prominent lower side barbs (t ~ 0.22) and upper secondary barbs (t ~ 0.48)
      // just like the jagged side spurs on the central spear blade in the photo!
      const barb1 = Math.exp(-Math.pow((t - 0.22) / 0.042, 2)) * 0.075 * (t < 0.235 ? 1.0 : 0.35);
      const barb2 = Math.exp(-Math.pow((t - 0.46) / 0.038, 2)) * 0.052 * (t < 0.475 ? 1.0 : 0.30);
      const notch1 = Math.exp(-Math.pow((t - 0.265) / 0.022, 2)) * -0.028;
      const notch2 = Math.exp(-Math.pow((t - 0.505) / 0.020, 2)) * -0.022;

      w = Math.max(0.002, w + barb1 + barb2 + notch1 + notch2);
      if (t > 0.94) w *= (1.0 - t) / 0.06;

      const th = 0.044 * (1.0 - t * 0.78) + Math.exp(-Math.pow((t - 0.15) / 0.12, 2)) * 0.014;
      mainBladeSamples.push({ x: 0, y: y, z: 0, halfWidth: w, halfThick: th });
    }
    const mainBladeMesh = new THREE.Mesh(buildBeveledBladeGeometry(mainBladeSamples), matCrimsonBlade);
    mainBladeMesh.castShadow = true;
    mainBladeMesh.receiveShadow = true;
    spearGroup.add(mainBladeMesh);

    // Protruding swept-up side barb tips on the central spearhead (at y ~ 0.92 and y ~ 1.46)
    function addSideSpurPair(baseY, spreadX, heightDY, widthBase) {
      [-1, 1].forEach(function(sign) {
        const spurSamples = [];
        const steps = 24;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = sign * (0.04 + Math.pow(t, 0.85) * spreadX);
          const y = baseY + Math.pow(t, 1.25) * heightDY;
          const hw = widthBase * (1.0 - t * 0.92);
          const ht = 0.024 * (1.0 - t * 0.88);
          spurSamples.push({ x: x, y: y, z: 0, halfWidth: hw, halfThick: ht });
        }
        const m = new THREE.Mesh(buildBeveledBladeGeometry(spurSamples), matCrimsonBlade);
        m.castShadow = true;
        spearGroup.add(m);
      });
    }
    addSideSpurPair(0.76, 0.185, 0.24, 0.048);
    addSideSpurPair(1.28, 0.135, 0.19, 0.036);

    // --------------------------------------------------------------------------
    // 4. TWIN CRESCENT WING PRONGS (Sayap Trisula Sabit Kiri & Kanan)
    //    Each wing sweeps outward from the central heart guard (y ~ 0.52),
    //    splitting into:
    //      (a) A tall, wicked upward-and-inward curving crescent horn blade
    //      (b) A sharp downward-curving lower talon hook
    //      (c) A heavy webbed bridge connecting the crescent to the core
    // --------------------------------------------------------------------------
    [-1, 1].forEach(function(sign) {
      // 4A. Upper Crescent Wing Blade (curves out to X = +/-0.46, then hooks slightly inward at tip Y = 1.62)
      const upperWingSamples = [];
      const uSteps = 64;
      for (let i = 0; i <= uSteps; i++) {
        const t = i / uSteps;
        // Smooth cubic Bezier trajectory for the crescent horn
        const p0x = sign * 0.05, p0y = 0.48;
        const p1x = sign * 0.42, p1y = 0.56;
        const p2x = sign * 0.52, p2y = 1.08;
        const p3x = sign * 0.34, p3y = 1.64;
        const u = 1.0 - t;
        const x = u*u*u*p0x + 3*u*u*t*p1x + 3*u*t*t*p2x + t*t*t*p3x;
        const y = u*u*u*p0y + 3*u*u*t*p1y + 3*u*t*t*p2y + t*t*t*p3y;

        // Broad web at the elbow (t ~ 0.35), tapering to a razor point at t = 1.0
        const elbowBulge = Math.exp(-Math.pow((t - 0.34) / 0.20, 2)) * 0.068;
        const innerBarb = Math.exp(-Math.pow((t - 0.68) / 0.05, 2)) * 0.025;
        const hw = Math.max(0.002, (0.072 * (1.0 - Math.pow(t, 1.35)) + elbowBulge + innerBarb));
        const ht = Math.max(0.0015, 0.032 * (1.0 - t * 0.82));
        upperWingSamples.push({ x: x, y: y, z: 0, halfWidth: hw, halfThick: ht });
      }
      const upperWingMesh = new THREE.Mesh(buildBeveledBladeGeometry(upperWingSamples), matCrimsonBlade);
      upperWingMesh.castShadow = true;
      upperWingMesh.receiveShadow = true;
      spearGroup.add(upperWingMesh);

      // 4B. Lower Downward-Curving Talon Hook (curves outward and down from the wing elbow to Y = 0.18)
      const lowerHookSamples = [];
      const lSteps = 44;
      for (let i = 0; i <= lSteps; i++) {
        const t = i / lSteps;
        const p0x = sign * 0.26, p0y = 0.62;
        const p1x = sign * 0.48, p1y = 0.55;
        const p2x = sign * 0.46, p2y = 0.34;
        const p3x = sign * 0.33, p3y = 0.16;
        const u = 1.0 - t;
        const x = u*u*u*p0x + 3*u*u*t*p1x + 3*u*t*t*p2x + t*t*t*p3x;
        const y = u*u*u*p0y + 3*u*u*t*p1y + 3*u*t*t*p2y + t*t*t*p3y;

        const hw = Math.max(0.002, 0.068 * Math.pow(1.0 - t, 0.78));
        const ht = Math.max(0.0015, 0.028 * (1.0 - t * 0.82));
        lowerHookSamples.push({ x: x, y: y, z: 0, halfWidth: hw, halfThick: ht });
      }
      const lowerHookMesh = new THREE.Mesh(buildBeveledBladeGeometry(lowerHookSamples), matCrimsonBlade);
      lowerHookMesh.castShadow = true;
      spearGroup.add(lowerHookMesh);

      // 4C. Secondary Lower Guard Scrolls / Barbs (at Y = +0.08 to +0.36 below the main wings)
      const subGuardSamples = [];
      for (let i = 0; i <= 32; i++) {
        const t = i / 32;
        const p0x = sign * 0.03, p0y = 0.26;
        const p1x = sign * 0.20, p1y = 0.30;
        const p2x = sign * 0.24, p2y = 0.16;
        const p3x = sign * 0.17, p3y = 0.04;
        const u = 1.0 - t;
        const x = u*u*u*p0x + 3*u*u*t*p1x + 3*u*t*t*p2x + t*t*t*p3x;
        const y = u*u*u*p0y + 3*u*u*t*p1y + 3*u*t*t*p2y + t*t*t*p3y;
        const hw = Math.max(0.002, 0.046 * Math.pow(1.0 - t, 0.75));
        const ht = Math.max(0.0015, 0.022 * (1.0 - t * 0.8));
        subGuardSamples.push({ x: x, y: y, z: 0, halfWidth: hw, halfThick: ht });
      }
      const subGuardMesh = new THREE.Mesh(buildBeveledBladeGeometry(subGuardSamples), matCrimsonBlade);
      subGuardMesh.castShadow = true;
      spearGroup.add(subGuardMesh);
    });

    // --------------------------------------------------------------------------
    // 5. THORNY CORRUPTED NECK COLLAR (Leher Tombak Berduri Organik, Y = -0.35..+0.48)
    //    Matches the gnarled, spiky crimson growth above the character's grip!
    // --------------------------------------------------------------------------
    const collarGeo = new THREE.CylinderGeometry(0.068, 0.042, 0.82, 24, 32);
    const cPos = collarGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      let vx = cPos.getX(i);
      let vy = cPos.getY(i);
      let vz = cPos.getZ(i);
      const angle = Math.atan2(vz, vx);
      const rib = Math.sin(vy * 32.0 + angle * 4.0) * 0.009 + Math.cos(vy * 55.0 - angle * 6.0) * 0.006;
      const scaleXZ = 1.0 + rib * 8.0;
      cPos.setXYZ(i, vx * scaleXZ, vy + 0.06, vz * scaleXZ * 0.82);
    }
    collarGeo.computeVertexNormals();
    const collarMesh = new THREE.Mesh(collarGeo, matCrimsonBlade);
    collarMesh.castShadow = true;
    spearGroup.add(collarMesh);

    // 52 Individual Sharp Upward-Pointing Organic Thorns wrapping the Neck Collar
    for (let i = 0; i < 52; i++) {
      const frac = i / 52;
      const yBase = -0.32 + frac * 0.74;
      const theta = i * 2.39996 + (i % 3) * 0.25;
      const radiusAtY = 0.040 + frac * 0.026;
      const thornLen = 0.085 + (i % 5) * 0.024;
      const thornSamples = [];
      for (let s = 0; s <= 10; s++) {
        const st = s / 10;
        const rOut = radiusAtY + Math.pow(st, 0.85) * (0.048 + frac * 0.025);
        const px = Math.cos(theta) * rOut;
        const pz = Math.sin(theta) * rOut * 0.85;
        const py = yBase + Math.pow(st, 1.1) * thornLen;
        thornSamples.push({
          x: px,
          y: py,
          z: pz,
          halfWidth: 0.016 * (1.0 - st * 0.92),
          halfThick: 0.014 * (1.0 - st * 0.92)
        });
      }
      const thornMesh = new THREE.Mesh(buildBeveledBladeGeometry(thornSamples), matCrimsonBlade);
      thornMesh.castShadow = true;
      spearGroup.add(thornMesh);
    }

    // --------------------------------------------------------------------------
    // 6. LONG GNARLED DARK-FORGED SHAFT (Batang Tombak Panjang, Y = -2.55..0.0)
    //    Includes organic surface ridges, crimson blood veins, and bronze rings
    // --------------------------------------------------------------------------
    const shaftGeo = new THREE.CylinderGeometry(0.036, 0.031, 2.65, 28, 80);
    const sPos = shaftGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      let vx = sPos.getX(i);
      let vy = sPos.getY(i);
      let vz = sPos.getZ(i);
      const ang = Math.atan2(vz, vx);
      // Helical wood/forged-iron twist + subtle organic gnarl
      const gnarl = Math.sin(vy * 9.0 + ang * 2.0) * 0.0022 + Math.cos(vy * 27.0 - ang * 3.0) * 0.0012;
      const bendX = Math.sin(vy * 1.6) * 0.006;
      cPos;
      sPos.setXYZ(i, vx + Math.cos(ang) * gnarl + bendX, vy - 1.28, vz + Math.sin(ang) * gnarl);
    }
    shaftGeo.computeVertexNormals();
    const shaftMesh = new THREE.Mesh(shaftGeo, matDarkShaft);
    shaftMesh.castShadow = true;
    shaftMesh.receiveShadow = true;
    spearGroup.add(shaftMesh);

    // Ornate Dark Bronze Ferrule Rings along the Shaft & Grip
    [-0.36, -0.78, -1.65, -2.42, -2.56].forEach(function(ry, idx) {
      const rRad = idx < 2 ? 0.043 : 0.038;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(rRad, 0.0085, 14, 28), matDarkBronze);
      ring.rotation.x = Math.PI * 0.5;
      ring.position.y = ry;
      ring.castShadow = true;
      spearGroup.add(ring);
    });

    // --------------------------------------------------------------------------
    // 7. ORNATE POMMEL & BLOOD-CRIMSON BUTT-SPIKE (Ujung Bawah Tombak Runcing, Y = -2.55..-3.28)
    //    Matches the sharp crimson-tipped bottom spike at the character's boots!
    // --------------------------------------------------------------------------
    const pommelCollarGeo = new THREE.CylinderGeometry(0.045, 0.052, 0.22, 16, 8);
    const pommelCollar = new THREE.Mesh(pommelCollarGeo, matDarkBronze);
    pommelCollar.position.y = -2.52;
    pommelCollar.castShadow = true;
    spearGroup.add(pommelCollar);

    const buttSpikeSamples = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32; // 0 = collar base (-2.60), 1 = sharp bottom point (-3.28)
      const y = -2.60 - t * 0.68;
      const flare = Math.exp(-Math.pow((t - 0.12) / 0.08, 2)) * 0.018;
      const hw = Math.max(0.0015, (0.046 * Math.pow(1.0 - t, 0.85)) + flare);
      buttSpikeSamples.push({ x: 0, y: y, z: 0, halfWidth: hw, halfThick: hw * 0.88 });
    }
    const buttSpikeMesh = new THREE.Mesh(buildBeveledBladeGeometry(buttSpikeSamples), matCrimsonBlade);
    buttSpikeMesh.castShadow = true;
    spearGroup.add(buttSpikeMesh);

    // --------------------------------------------------------------------------
    // 8. SMOLDERING CRIMSON EMBER PARTICLES & GLOW LIGHTS (Aura Bara Merah)
    // --------------------------------------------------------------------------
    const emberCount = 90;
    const emberGeo = new THREE.BufferGeometry();
    const emberPos = new Float32Array(emberCount * 3);
    const emberSeed = new Float32Array(emberCount * 3);

    for (let i = 0; i < emberCount; i++) {
      const ex = (sRand() - 0.5) * 0.85;
      const ey = 0.15 + sRand() * 2.35;
      const ez = (sRand() - 0.5) * 0.35;
      emberPos[i * 3]     = ex;
      emberPos[i * 3 + 1] = ey;
      emberPos[i * 3 + 2] = ez;
      emberSeed[i * 3]     = ex;
      emberSeed[i * 3 + 1] = ey;
      emberSeed[i * 3 + 2] = 0.4 + sRand() * 0.8; // speed
    }
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));

    // Soft circular glow sprite generated on canvas
    const pCanvas = document.createElement('canvas');
    pCanvas.width = pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');
    const pGrad = pCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
    pGrad.addColorStop(0.0, 'rgba(255, 160, 90, 1.0)');
    pGrad.addColorStop(0.35, 'rgba(235, 35, 15, 0.75)');
    pGrad.addColorStop(1.0, 'rgba(120, 0, 0, 0.0)');
    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 64, 64);
    const emberTex = new THREE.CanvasTexture(pCanvas);

    const emberMat = new THREE.PointsMaterial({
      map: emberTex,
      size: 0.09,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const emberPoints = new THREE.Points(emberGeo, emberMat);
    spearGroup.add(emberPoints);

    // Embedded crimson point lights on the blade head and pommel tip
    const bladeGlowLight = new THREE.PointLight(0xff240a, 2.6, 4.5, 1.8);
    bladeGlowLight.position.set(0, 1.15, 0.25);
    spearGroup.add(bladeGlowLight);

    const pommelGlowLight = new THREE.PointLight(0xd91808, 1.1, 2.5, 2.0);
    pommelGlowLight.position.set(0, -2.95, 0.15);
    spearGroup.add(pommelGlowLight);

    // Optional animation hook for MMORPG render loop
    spearGroup.userData.update = function(elapsedTime) {
      const posAttr = emberGeo.attributes.position;
      const arr = posAttr.array;
      for (let i = 0; i < emberCount; i++) {
        const baseX = emberSeed[i * 3];
        const baseY = emberSeed[i * 3 + 1];
        const spd   = emberSeed[i * 3 + 2];
        const cycle = (baseY + elapsedTime * spd * 0.45) % 2.45;
        arr[i * 3]     = baseX + Math.sin(elapsedTime * 2.0 + i) * 0.04;
        arr[i * 3 + 1] = 0.15 + cycle;
      }
      posAttr.needsUpdate = true;
      bladeGlowLight.intensity = 2.4 + Math.sin(elapsedTime * 3.5) * 0.35;
      matCrimsonBlade.emissiveIntensity = 0.90 + Math.sin(elapsedTime * 2.8) * 0.18;
    };

    return spearGroup;
  }

export default createCrimsonDemonicSpear;
