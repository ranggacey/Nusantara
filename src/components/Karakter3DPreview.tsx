"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildCitizen, ROLE_STYLE } from "@/lib/batu/modelKarakter";
import { LABEL_ALAT } from "@/lib/batu/peran";

type WargaProps = {
  warga: Record<string, any>;
};

export default function Karakter3DPreview({ warga }: WargaProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const peran = String(warga.peran ?? "-");
  const nomor = String(warga.nomor ?? "0000");
  const gender = String(warga.gender ?? "");
  const perkakasList: Array<{ jenis: string; level?: number; damage?: number }> = Array.isArray(warga.perkakas)
    ? warga.perkakas
    : [];

  const punyaTombakIblis = perkakasList.some((p) => p.jenis === "tombak_iblis");
  const punyaBusur = perkakasList.some((p) => p.jenis === "busur");
  const perkakasUtama = perkakasList.length > 0 ? perkakasList[0].jenis : undefined;

  // Nama alat / senjata untuk badge
  let labelSenjata = "Tangan Kosong";
  if (punyaTombakIblis) {
    labelSenjata = "🗡️ Tombak Iblis";
  } else if (perkakasUtama) {
    const nama = LABEL_ALAT[perkakasUtama] ?? perkakasUtama;
    const ico =
      perkakasUtama === "busur"
        ? "🏹"
        : perkakasUtama === "kapak"
        ? "🪓"
        : perkakasUtama === "beliung"
        ? "⛏️"
        : perkakasUtama === "tombak"
        ? "🗡️"
        : perkakasUtama === "palu"
        ? "🔨"
        : "🛠️";
    labelSenjata = `${ico} ${nama}`;
  } else {
    const defaultTool = ROLE_STYLE[peran]?.tool;
    if (defaultTool) {
      const nama = LABEL_ALAT[defaultTool] ?? defaultTool;
      labelSenjata = `🛠️ ${nama}`;
    }
  }

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 280;
    const height = 150;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 1.3, 3.8);
    camera.lookAt(0, 0.95, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 1.2);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    backLight.position.set(-2, 2, -3);
    scene.add(backLight);

    // Pedestal
    const pedestalGroup = new THREE.Group();
    const diskGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.12, 24);
    const diskMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.position.y = -0.06;
    pedestalGroup.add(disk);

    const ringGeo = new THREE.TorusGeometry(0.88, 0.025, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    pedestalGroup.add(ring);
    scene.add(pedestalGroup);

    // Citizen 3D Model
    const citizen = buildCitizen(peran, nomor, gender, {
      tombakIblis: punyaTombakIblis,
      toolOverride: perkakasUtama,
      showBusur: punyaBusur,
    });
    scene.add(citizen);

    // Interactive Drag Orbit
    let isDragging = false;
    let prevMouseX = 0;
    let rotationVelocity = 0;
    let autoRotate = true;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      autoRotate = false;
      prevMouseX = e.clientX;
      renderer.domElement.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      citizen.rotation.y += deltaX * 0.018;
      rotationVelocity = deltaX * 0.018;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {}
      setTimeout(() => {
        autoRotate = true;
      }, 2500);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);

    // Animation Loop
    let animId = 0;
    let t0 = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - t0) / 1000;
      t0 = now;

      if (autoRotate) {
        citizen.rotation.y += 0.8 * dt;
      } else if (!isDragging) {
        citizen.rotation.y += rotationVelocity;
        rotationVelocity *= 0.92;
      }

      // Idle breathing and slight arm movement
      const u = citizen.userData;
      if (u) {
        if (u.head) u.head.rotation.x = Math.sin(now * 0.002) * 0.04;
        if (u.armL) u.armL.rotation.x = Math.sin(now * 0.002) * 0.05;
        if (u.armR && !u.tombakIblis) u.armR.rotation.x = -Math.sin(now * 0.002) * 0.05;
        if (u.tombakIblis && typeof u.tombakIblis.userData?.update === "function") {
          u.tombakIblis.userData.update(now * 0.001);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 280;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [peran, nomor, gender, punyaTombakIblis, punyaBusur, perkakasUtama]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        borderRadius: "10px",
        overflow: "hidden",
        background: "radial-gradient(circle at center, #1e293b 0%, #090d16 100%)",
        border: "1px solid rgba(250, 204, 21, 0.35)",
        boxShadow: "inset 0 0 15px rgba(0,0,0,0.6)",
        marginBottom: "10px",
      }}
    >
      <div ref={mountRef} style={{ width: "100%", height: "150px", cursor: "grab" }} />
      <div
        style={{
          position: "absolute",
          top: "6px",
          right: "8px",
          fontSize: "10px",
          color: "#94a3b8",
          pointerEvents: "none",
          background: "rgba(0,0,0,0.5)",
          padding: "2px 6px",
          borderRadius: "4px",
        }}
      >
        Putar 3D 🔄
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "6px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          background: "rgba(15, 23, 42, 0.85)",
          border: "1px solid rgba(250, 204, 21, 0.4)",
          padding: "3px 10px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 700,
          color: "#fef08a",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
        }}
      >
        <span>Senjata:</span>
        <span style={{ color: "#fff" }}>{labelSenjata}</span>
      </div>
    </div>
  );
}
