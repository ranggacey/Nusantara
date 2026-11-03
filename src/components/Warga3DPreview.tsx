"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildCitizen } from "@/lib/batu/modelKarakter";

interface Props {
  warga: Record<string, any> | null;
}

export function Warga3DPreview({ warga }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!warga || !mountRef.current) return;

    const width = 220;
    const height = 240;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // dark slate

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 1.3, 3.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);

    // Pencahayaan
    const amb = new THREE.AmbientLight(0xfff3e0, 0.9);
    scene.add(amb);

    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(3, 5, 4);
    scene.add(dir);

    const rim = new THREE.DirectionalLight(0x38bdf8, 0.8);
    rim.position.set(-3, 3, -3);
    scene.add(rim);

    // Pedestal batu melingkar
    const pedestalGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.18, 24);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.8,
      metalness: 0.1,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.09;
    scene.add(pedestal);

    const ringGeo = new THREE.TorusGeometry(0.92, 0.03, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // Karakter 3D
    const punyaTombak = Array.isArray(warga.perkakas) && warga.perkakas.some((p: any) => p.jenis === "tombak_iblis");
    const citizen = buildCitizen(
      String(warga.peran ?? "pengumpul"),
      String(warga.nomor ?? "0000"),
      String(warga.gender ?? ""),
      { tombakIblis: punyaTombak }
    );
    scene.add(citizen);

    // Interaksi drag putar
    let isDragging = false;
    let prevMouseX = 0;
    let rotationAngle = 0;
    let autoRotate = true;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      autoRotate = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const delta = e.clientX - prevMouseX;
      rotationAngle += delta * 0.02;
      prevMouseX = e.clientX;
    };

    const onPointerUp = () => {
      isDragging = false;
      setTimeout(() => {
        autoRotate = true;
      }, 3000);
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    let animId: number;
    let t = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.016;

      if (autoRotate) {
        rotationAngle += 0.012;
      }

      citizen.rotation.y = rotationAngle;
      pedestal.rotation.y = rotationAngle;
      ring.rotation.z = rotationAngle;

      // Napas halus & animasi pose
      const u = citizen.userData;
      if (u) {
        if (u.body) u.body.scale.y = 1 + Math.sin(t * 2) * 0.02;
        if (u.head) u.head.position.y = 1.35 + Math.sin(t * 2) * 0.01;
        if (u.tombakIblis && typeof u.tombakIblis.userData?.update === "function") {
          u.tombakIblis.userData.update(t);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      if (mountRef.current && dom) {
        mountRef.current.removeChild(dom);
      }
      renderer.dispose();
      pedestalGeo.dispose();
      pedestalMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
    };
  }, [warga]);

  if (!warga) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 10 }}>
      <div
        ref={mountRef}
        style={{
          width: 220,
          height: 240,
          borderRadius: 12,
          overflow: "hidden",
          border: "2px solid rgba(245, 158, 11, 0.4)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4), inset 0 0 16px rgba(245, 158, 11, 0.15)",
          position: "relative",
          cursor: "grab",
          background: "radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 100%)",
        }}
      />
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, fontStyle: "italic" }}>
        👆 Geser untuk memutar karakter 3D
      </div>
    </div>
  );
}
