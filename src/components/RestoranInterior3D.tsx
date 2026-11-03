"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildCitizen } from "@/lib/batu/modelKarakter";

export interface RestoranInterior3DProps {
  isOpen?: boolean;
  onClose?: () => void;
  isStandalonePage?: boolean;
}

interface TamuWarga {
  id: string;
  nama: string;
  nomor: string;
  peran: string;
  gender: string;
  lapar: number;
  stamina: number;
  sehat: number;
  status_teks?: string;
  dialog: string;
}

interface InspectableNPC {
  id?: string;
  isWarga?: boolean;
  nama: string;
  peran: string;
  dialog: string;
  lapar?: number;
  stamina?: number;
  sehat?: number;
}

const POSISI_KURSI = [
  { x: -1.8, y: -0.25, z: 0.5, rotY: Math.PI / 2 },
  { x: 1.8, y: -0.25, z: 1.8, rotY: -Math.PI / 2 },
  { x: -1.8, y: -0.25, z: -1.5, rotY: Math.PI / 2 },
  { x: 1.8, y: -0.25, z: -0.5, rotY: -Math.PI / 2 },
  { x: -6.5, y: -0.25, z: 5.0, rotY: 0 },
  { x: 6.5, y: -0.25, z: 5.0, rotY: 0 },
];

export default function RestoranInterior3D({
  isOpen = true,
  onClose,
  isStandalonePage = false,
}: RestoranInterior3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [inspectedNPC, setInspectedNPC] = useState<InspectableNPC | null>(null);
  const [restoData, setRestoData] = useState<any>(null);
  const [feedingLoading, setFeedingLoading] = useState(false);
  const [feedToast, setFeedToast] = useState<string | null>(null);

  // Ambil data restoran dan warga yang benar-benar lapar dari server
  const loadRestoData = useCallback(async () => {
    try {
      const res = await fetch("/api/restoran");
      if (res.ok) {
        const data = await res.json();
        setRestoData(data);
      }
    } catch (e) {
      console.error("[RestoranInterior3D] Gagal memuat data resto:", e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadRestoData();
    }
  }, [isOpen, loadRestoData]);

  // Handler untuk memberi makan warga lapar
  const handleBeriMakan = async (wargaId: string) => {
    setFeedingLoading(true);
    try {
      const res = await fetch("/api/restoran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wargaId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal memberi makan warga");
      } else {
        setFeedToast(`🍲 ${data.message || "Warga telah kenyang!"}`);
        setTimeout(() => setFeedToast(null), 4000);
        if (inspectedNPC && inspectedNPC.id === wargaId) {
          setInspectedNPC({
            ...inspectedNPC,
            lapar: 0,
            stamina: 100,
            dialog: "Wah sedap sekali! Rasa lapar hilang seketika, tenagaku pulih 100% dan siap kembali beraktivitas!",
          });
        }
        await loadRestoData();
      }
    } catch (e: any) {
      alert("Terjadi kesalahan: " + e.message);
    } finally {
      setFeedingLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x18100c); // Nuansa hangat remang kayu oriental
    scene.fog = new THREE.FogExp2(0x18100c, 0.016);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 11, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 3;
    controls.maxDistance = 30;
    controls.target.set(0, 2, 0);

    // ==========================================
    // PENCAHAYAAN TAVERN SICHUAN
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff3e0, 0.8);
    dirLight.position.set(6, 16, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Lentera Gantung Emas Oriental
    const lenteraLights: { light: THREE.PointLight; base: number; offset: number }[] = [];
    const tambahLentera = (x: number, y: number, z: number, warna = 0xffa033, intensitas = 1.5) => {
      const pl = new THREE.PointLight(warna, intensitas, 12, 1.8);
      pl.position.set(x, y, z);
      pl.castShadow = true;
      scene.add(pl);
      lenteraLights.push({ light: pl, base: intensitas, offset: Math.random() * 10 });

      // Model Kap Lentera Kertas Merah/Emas Sichuan
      const lGroup = new THREE.Group();
      lGroup.position.set(x, y, z);
      const lBox = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.22, 0.52, 8),
        new THREE.MeshBasicMaterial({ color: 0xff3b30 }) // Merah lampion Sichuan
      );
      lGroup.add(lBox);

      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(0.36, 0.18, 8),
        new THREE.MeshLambertMaterial({ color: 0xd4af37 }) // Emas trim
      );
      cap.position.y = 0.3;
      lGroup.add(cap);

      const rumbai = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.06, 0.3, 6),
        new THREE.MeshBasicMaterial({ color: 0xffcc00 })
      );
      rumbai.position.y = -0.38;
      lGroup.add(rumbai);

      const tali = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 3, 4),
        new THREE.MeshBasicMaterial({ color: 0x2b1810 })
      );
      tali.position.y = 1.7;
      lGroup.add(tali);

      scene.add(lGroup);
    };

    tambahLentera(-6, 5, 0, 0xffa033, 1.8); // Dekat Kasir
    tambahLentera(6, 5, -2, 0xff5511, 2.2); // Dekat Tungku Hotpot Koki
    tambahLentera(0, 6, 2, 0xffbb44, 2.0); // Balai Meja Utama
    tambahLentera(-5, 5, 6, 0xff9922, 1.4);
    tambahLentera(5, 5, 6, 0xff9922, 1.4);

    // ==========================================
    // MATERIAL RUANGAN
    // ==========================================
    const matLantai = new THREE.MeshStandardMaterial({ color: 0x3d2212, roughness: 0.6, metalness: 0.1 });
    const matKayuBalok = new THREE.MeshStandardMaterial({ color: 0x281408, roughness: 0.8 });
    const matDindingBambu = new THREE.MeshStandardMaterial({ color: 0xcc9966, roughness: 0.7 });
    const matBatuTungku = new THREE.MeshStandardMaterial({ color: 0x4a4744, roughness: 0.9 });
    const matEmasKoin = new THREE.MeshStandardMaterial({ color: 0xdfa024, metalness: 0.7, roughness: 0.3 });
    const matKarpetSichuan = new THREE.MeshStandardMaterial({ color: 0x8b1e16, roughness: 0.6 });

    // Lantai Restoran Mewah (24 x 20)
    const lantai = new THREE.Mesh(new THREE.BoxGeometry(24, 0.6, 20), matLantai);
    lantai.position.y = -0.3;
    lantai.receiveShadow = true;
    scene.add(lantai);

    // Karpet Merah Sutra Perjamuan di Tengah
    const karpet = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 14), matKarpetSichuan);
    karpet.position.set(0, 0.03, 1);
    karpet.receiveShadow = true;
    scene.add(karpet);

    // Tiang-tiang Kayu Penyangga Balai
    const posisiTiang = [
      [-11, -9], [-11, 0], [-11, 9],
      [11, -9], [11, 0], [11, 9],
      [-4, -9], [-4, 9],
      [4, -9], [4, 9],
    ];
    posisiTiang.forEach(([tx, tz]) => {
      const tiang = new THREE.Mesh(new THREE.BoxGeometry(0.7, 8, 0.7), matKayuBalok);
      tiang.position.set(tx, 4, tz);
      tiang.castShadow = true;
      tiang.receiveShadow = true;
      scene.add(tiang);
    });

    // Dinding Kisi-kisi Bambu & Rangka Kayu
    const dindingBlk = new THREE.Mesh(new THREE.BoxGeometry(24, 7, 0.4), matDindingBambu);
    dindingBlk.position.set(0, 3.5, -10);
    scene.add(dindingBlk);

    const dindingKiri = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 20), matDindingBambu);
    dindingKiri.position.set(-12, 3.5, 0);
    scene.add(dindingKiri);

    const dindingKanan = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 20), matDindingBambu);
    dindingKanan.position.set(12, 3.5, 0);
    scene.add(dindingKanan);

    // Balok Atap Langit-langit Terbuka
    for (let bz = -8; bz <= 8; bz += 4) {
      const balokX = new THREE.Mesh(new THREE.BoxGeometry(24, 0.4, 0.4), matKayuBalok);
      balokX.position.set(0, 7.2, bz);
      scene.add(balokX);
    }

    // ==========================================
    // AREA 1: MEJA KASIR BAR (Kiri)
    // ==========================================
    const barCounter = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 7), matKayuBalok);
    barCounter.position.set(-7, 0.6, -2);
    barCounter.castShadow = true;
    scene.add(barCounter);

    const barTop = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.15, 7.3), matLantai);
    barTop.position.set(-7, 1.25, -2);
    scene.add(barTop);

    const petiKoin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.5), matEmasKoin);
    petiKoin.position.set(-7, 1.5, -4.5);
    petiKoin.castShadow = true;
    scene.add(petiKoin);

    const rakBlk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.5, 6.5), matKayuBalok);
    rakBlk.position.set(-10.5, 2, -2);
    scene.add(rakBlk);

    for (let k = 0; k < 3; k++) {
      const tong = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.1, 12), matLantai);
      tong.rotation.z = Math.PI / 2;
      tong.position.set(-9.8, 1.2 + (k % 2) * 1.3, -4 + k * 2);
      scene.add(tong);
    }

    // ==========================================
    // AREA 2: DAPUR KOKI SICHUAN & KUALI HOTPOT
    // ==========================================
    const tungkuBatu = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 2.5), matBatuTungku);
    tungkuBatu.position.set(7.5, 0.6, -7.5);
    tungkuBatu.castShadow = true;
    scene.add(tungkuBatu);

    // Kuali Hotpot Besar
    const kuali = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.65, 0.75, 16),
      new THREE.MeshStandardMaterial({ color: 0x1f1f1f, metalness: 0.8, roughness: 0.3 })
    );
    kuali.position.set(7.5, 1.55, -7.5);
    kuali.castShadow = true;
    scene.add(kuali);

    // Kuah Merah Hotpot Pedas Sichuan (Glowing Mala Chili Broth)
    const kuahHotpot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.05, 16),
      new THREE.MeshBasicMaterial({ color: 0xd90429 }) // Merah cabai pedas
    );
    kuahHotpot.position.set(7.5, 1.9, -7.5);
    scene.add(kuahHotpot);

    // Potongan cabai merah di permukaan kuali
    for (let c = 0; c < 5; c++) {
      const ang = (c / 5) * Math.PI * 2;
      const cabai = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.02, 0.2, 5),
        new THREE.MeshBasicMaterial({ color: 0xef233c })
      );
      cabai.rotation.z = Math.PI / 3;
      cabai.position.set(7.5 + Math.cos(ang) * 0.4, 1.93, -7.5 + Math.sin(ang) * 0.4);
      scene.add(cabai);
    }

    // Api Tungku Bara Menyala
    const apiTungkuLight = new THREE.PointLight(0xff3300, 2.8, 7, 2);
    apiTungkuLight.position.set(7.5, 1.2, -7.5);
    scene.add(apiTungkuLight);

    // Meja Persiapan Bahan Masakan Sichuan
    const mejaDapur = new THREE.Mesh(new THREE.BoxGeometry(3, 1.1, 1.5), matKayuBalok);
    mejaDapur.position.set(7.5, 0.55, -4);
    mejaDapur.castShadow = true;
    scene.add(mejaDapur);

    // Talenan & Pisau
    const talenan = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.08, 0.6),
      new THREE.MeshLambertMaterial({ color: 0xd4a373 })
    );
    talenan.position.set(7.2, 1.14, -4);
    scene.add(talenan);

    // Cabai kering & bumbu rempah di talenan
    const cabaiMeja = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.1, 0.2),
      new THREE.MeshLambertMaterial({ color: 0xef233c })
    );
    cabaiMeja.position.set(7.2, 1.21, -4);
    scene.add(cabaiMeja);

    // ==========================================
    // AREA 3: MEJA PERJAMUAN MAKAN & KURSI
    // ==========================================
    const mejaPanjang = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 6), matKayuBalok);
    mejaPanjang.position.set(0, 0.55, 1);
    mejaPanjang.castShadow = true;
    scene.add(mejaPanjang);

    const bangkuL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 5.8), matLantai);
    bangkuL.position.set(-1.8, 0.3, 1);
    scene.add(bangkuL);

    const bangkuR = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 5.8), matLantai);
    bangkuR.position.set(1.8, 0.3, 1);
    scene.add(bangkuR);

    // Makanan di Meja Panjang
    const taruhMakanan = (x: number, y: number, z: number) => {
      const mangkok = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.2, 0.12, 12),
        new THREE.MeshLambertMaterial({ color: 0xf4f1de })
      );
      mangkok.position.set(x, y, z);
      scene.add(mangkok);

      const kuahPedas = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.26, 0.02, 12),
        new THREE.MeshBasicMaterial({ color: 0xd90429 })
      );
      kuahPedas.position.set(x, y + 0.06, z);
      scene.add(kuahPedas);

      const cangkirTeh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8),
        new THREE.MeshLambertMaterial({ color: 0x4a2e1b })
      );
      cangkirTeh.position.set(x + 0.35, y + 0.08, z);
      scene.add(cangkirTeh);
    };

    taruhMakanan(-0.4, 1.12, -1);
    taruhMakanan(0.4, 1.12, -0.5);
    taruhMakanan(-0.4, 1.12, 1.5);
    taruhMakanan(0.4, 1.12, 2.2);

    // Meja Bundar Santai
    const buatMejaBundar = (mx: number, mz: number) => {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.12, 16), matLantai);
      top.position.set(mx, 1.1, mz);
      top.castShadow = true;
      scene.add(top);

      const kaki = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.1, 8), matKayuBalok);
      kaki.position.set(mx, 0.55, mz);
      scene.add(kaki);

      for (let s = 0; s < 4; s++) {
        const ang = (s / 4) * Math.PI * 2;
        const kursi = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.6, 8), matKayuBalok);
        kursi.position.set(mx + Math.cos(ang) * 1.9, 0.3, mz + Math.sin(ang) * 1.9);
        scene.add(kursi);
      }
      taruhMakanan(mx, 1.18, mz);
    };

    buatMejaBundar(-6.5, 6.5);
    buatMejaBundar(6.5, 6.5);

    // ==========================================
    // UAP HOTPOT & ASAP AROMA SICHUAN
    // ==========================================
    const steamGeo = new THREE.BufferGeometry();
    const steamCount = 40;
    const steamPos = new Float32Array(steamCount * 3);
    for (let i = 0; i < steamCount; i++) {
      steamPos[i * 3 + 0] = 7.5 + (Math.random() - 0.5) * 1.3;
      steamPos[i * 3 + 1] = 1.9 + Math.random() * 2.8;
      steamPos[i * 3 + 2] = -7.5 + (Math.random() - 0.5) * 1.3;
    }
    steamGeo.setAttribute("position", new THREE.BufferAttribute(steamPos, 3));
    const steamMat = new THREE.PointsMaterial({
      color: 0xffcccc, // Sedikit semburat merah cabai
      size: 0.28,
      transparent: true,
      opacity: 0.4,
    });
    const steamPoints = new THREE.Points(steamGeo, steamMat);
    scene.add(steamPoints);

    // ==========================================
    // NPC INTERIOR RESTORAN
    // ==========================================
    const npcs: {
      group: THREE.Group;
      data: InspectableNPC;
      animator?: (t: number) => void;
    }[] = [];

    // 1. CHEF GANDI (Koki Utama Sichuan)
    const kokiGroup = buildCitizen("juru_masak", "0077", "laki-laki");
    kokiGroup.position.set(7.5, 0, -6.2);
    kokiGroup.rotation.y = Math.PI;
    scene.add(kokiGroup);

    const sendokAduk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6),
      new THREE.MeshLambertMaterial({ color: 0x8a5229 })
    );
    sendokAduk.rotation.x = Math.PI / 4;
    sendokAduk.position.set(0.3, 1.1, 0.4);
    kokiGroup.add(sendokAduk);

    npcs.push({
      group: kokiGroup,
      data: {
        nama: "Chef Gandi",
        peran: "Koki Utama Sichuan",
        dialog: "Kuah Hotpot Mala Sichuan kami diracik dengan cabai rempah pilihan dan kaldu tulang rusa purba! Yang lapar langsung kenyang dan bertenaga!",
      },
      animator: (t) => {
        kokiGroup.rotation.y = Math.PI + Math.sin(t * 2) * 0.15;
        sendokAduk.rotation.z = Math.sin(t * 3) * 0.2;
      },
    });

    // 2. KASIR LARAS (Meja Kasir Bar)
    const kasirGroup = buildCitizen("penenun", "0012", "perempuan");
    kasirGroup.position.set(-8.2, 0, -2.5);
    kasirGroup.rotation.y = Math.PI / 2;
    scene.add(kasirGroup);

    npcs.push({
      group: kasirGroup,
      data: {
        nama: "Kasir Laras",
        peran: "Kasir & Bendahara Restoran",
        dialog: "Selamat datang di Restoran Sichuan Nirwana! Silakan nikmati jamuan hangat. Semua warga desa yang kelaparan boleh bersantap di sini.",
      },
      animator: (t) => {
        kasirGroup.position.y = Math.sin(t * 1.5) * 0.03;
      },
    });

    // 3. PELAYAN BIMO (Membawa Nampan Makanan)
    const pelayanGroup = buildCitizen("penjaga_api", "0044", "laki-laki");
    pelayanGroup.position.set(-2, 0, -2);
    scene.add(pelayanGroup);

    const nampan = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.5), matKayuBalok);
    nampan.position.set(0, 1.2, 0.4);
    const mangkokNampan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.08, 0.1, 8),
      new THREE.MeshLambertMaterial({ color: 0xd90429 })
    );
    mangkokNampan.position.set(0, 1.28, 0.4);
    pelayanGroup.add(nampan);
    pelayanGroup.add(mangkokNampan);

    npcs.push({
      group: pelayanGroup,
      data: {
        nama: "Pelayan Bimo",
        peran: "Pelayan Restoran",
        dialog: "Semangkuk kuah pedas panas baru matang dari kuali Chef! Segera diantarkan ke meja tamu yang lapar!",
      },
      animator: (t) => {
        pelayanGroup.position.x = -2 + Math.sin(t * 0.6) * 1.5;
        pelayanGroup.position.z = -1 + Math.cos(t * 0.6) * 1.2;
        pelayanGroup.rotation.y = t * 0.6 + Math.PI / 2;
      },
    });

    // 4. WARGA DESA YANG BENAR-BENAR LAPAR (DUDUK DI MEJA)
    // Diisi secara dinamis HANYA oleh warga desa yang lapar (dari restoData.tamu)
    const tamuWargaList: TamuWarga[] = restoData?.tamu ?? [];

    tamuWargaList.forEach((tamu, idx) => {
      if (idx >= POSISI_KURSI.length) return;
      const seat = POSISI_KURSI[idx];

      const tamuMesh = buildCitizen(tamu.peran, tamu.nomor, tamu.gender);
      tamuMesh.position.set(seat.x, seat.y, seat.z);
      tamuMesh.rotation.y = seat.rotY;
      scene.add(tamuMesh);

      npcs.push({
        group: tamuMesh,
        data: {
          id: tamu.id,
          isWarga: true,
          nama: tamu.nama,
          peran: `${tamu.peran.toUpperCase()} (Lapar: ${tamu.lapar}%)`,
          dialog: tamu.dialog,
          lapar: tamu.lapar,
          stamina: tamu.stamina,
          sehat: tamu.sehat,
        },
        animator: (t) => {
          // Gerakan makan dan anggukan kepala
          tamuMesh.rotation.x = Math.sin(t * 2 + idx) * 0.08;
        },
      });
    });

    // Raycaster untuk mendeteksi klik pada karakter
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      let found: InspectableNPC | null = null;
      for (const npc of npcs) {
        const intersects = raycaster.intersectObjects(npc.group.children, true);
        if (intersects.length > 0) {
          found = npc.data;
          break;
        }
      }

      setInspectedNPC(found);
    };

    container.addEventListener("pointerdown", handlePointerDown);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ==========================================
    // RENDER LOOP
    // ==========================================
    let reqId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Api tungku berkedip
      apiTungkuLight.intensity = 2.4 + Math.sin(elapsedTime * 8) * 0.6;

      // Lentera berkedip lembut
      for (const l of lenteraLights) {
        l.light.intensity = l.base + Math.sin(elapsedTime * 3 + l.offset) * 0.2;
      }

      // Animasi partikel uap naik
      const pAttr = steamGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < steamCount; i++) {
        let py = pAttr.getY(i) + 0.015;
        if (py > 4.7) py = 1.9;
        pAttr.setY(i, py);
      }
      pAttr.needsUpdate = true;

      // Animasi NPC
      for (const npc of npcs) {
        if (npc.animator) npc.animator(elapsedTime);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("pointerdown", handlePointerDown);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isOpen, restoData]);

  if (!isOpen) return null;

  return (
    <div
      className={
        isStandalonePage
          ? "relative w-full h-screen flex flex-col bg-stone-950 text-stone-100 select-none overflow-hidden"
          : "fixed inset-0 z-50 flex flex-col bg-stone-950/95 backdrop-blur-md text-stone-100 select-none animate-in fade-in duration-300"
      }
    >
      {/* Top Bar Navigation */}
      <header className="flex items-center justify-between px-6 py-3.5 bg-stone-900/90 border-b border-amber-900/40 shadow-xl z-10">
        <div className="flex items-center gap-3">
          <span className="text-3xl filter drop-shadow">🏮</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-wide text-amber-300">
                Restoran Sichuan Nirwana — Balai Kuliner MMORPG
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-600/30 text-red-200 border border-red-500/40">
                🌶️ Masakan Pedas Sichuan
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Tempat berkumpul warga yang lapar menikmati Hotpot Daging Rusa pedas dan memulihkan stamina
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-stone-800/80 border border-amber-950 text-xs">
            <span className="text-amber-400 font-semibold">🍲 Pangan Desa:</span>
            <span className="text-emerald-300 font-bold">{restoData?.hidangan_tersedia ?? 0} porsi</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/50 border border-red-800/50 text-xs text-red-200">
            <span>🔥</span>
            <span>Menu Favorit: Hotpot Mala Sichuan</span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-950/60 active:scale-95 transition-all border border-amber-400/30"
            >
              <span>🌄</span>
              <span>Kembali ke Desa</span>
            </button>
          )}
        </div>
      </header>

      {/* 3D Canvas Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden" ref={mountRef}>
        {/* Floating Hint Controls */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none bg-stone-900/85 backdrop-blur border border-amber-900/50 rounded-xl px-4 py-2.5 text-xs text-stone-300 max-w-sm shadow-lg">
          <p className="font-semibold text-amber-300 mb-1">🎮 Panduan Restoran:</p>
          <p>• Klik & Seret = Putar Sudut Kamera (360°)</p>
          <p>• Scroll Wheel = Zoom Dekat ke Meja / Chef</p>
          <p>• Klik pada Koki, Kasir, atau Warga yang sedang makan untuk berinteraksi!</p>
        </div>

        {/* Floating Toast Notification */}
        {feedToast && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-emerald-700/95 border-2 border-emerald-400 text-white px-5 py-2.5 rounded-2xl shadow-2xl font-bold text-sm animate-in fade-in duration-200">
            {feedToast}
          </div>
        )}

        {/* Daftar Warga Lapar yang Sedang Makan */}
        <div className="absolute top-4 right-4 z-10 bg-stone-900/80 backdrop-blur border border-amber-900/50 rounded-xl p-3 text-xs text-stone-300 max-w-xs shadow-lg hidden sm:block">
          <p className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
            <span>🥢</span> Tamu Lapar di Meja:
          </p>
          {restoData?.tamu && restoData.tamu.length > 0 ? (
            <div className="space-y-1 mt-1.5">
              {restoData.tamu.map((t: TamuWarga) => (
                <div key={t.id} className="flex items-center justify-between gap-3 text-stone-200">
                  <span>{t.nama} ({t.peran})</span>
                  <span className="text-red-400 font-semibold">Lapar: {t.lapar}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stone-400 italic">Semua warga desa sedang kenyang bekerja.</p>
          )}
        </div>

        {/* NPC Dialogue Box when clicked */}
        {inspectedNPC && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-lg bg-stone-900/95 border-2 border-amber-500/70 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-amber-400">
                  {inspectedNPC.peran}
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{inspectedNPC.isWarga ? "🥢" : "💬"}</span> {inspectedNPC.nama}
                </h3>
              </div>
              <button
                onClick={() => setInspectedNPC(null)}
                className="text-stone-400 hover:text-white text-sm px-2 py-0.5 rounded-lg bg-stone-800"
              >
                ✕
              </button>
            </div>

            {/* Jika yang diklik adalah warga lapar: tampilkan status lapar & stamina */}
            {inspectedNPC.isWarga && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-stone-950/70 border border-stone-800">
                  <span className="text-stone-400">Tingkat Lapar:</span>
                  <div className="text-sm font-bold text-red-400">{inspectedNPC.lapar ?? 0}%</div>
                </div>
                <div className="p-2 rounded-lg bg-stone-950/70 border border-stone-800">
                  <span className="text-stone-400">Stamina:</span>
                  <div className="text-sm font-bold text-cyan-400">{inspectedNPC.stamina ?? 0}%</div>
                </div>
              </div>
            )}

            <p className="mt-2.5 text-sm text-amber-100/90 leading-relaxed italic bg-stone-950/60 p-3 rounded-xl border border-amber-900/30">
              "{inspectedNPC.dialog}"
            </p>

            {/* Tombol aksi suapi makan jika warga sedang lapar */}
            {inspectedNPC.isWarga && (inspectedNPC.lapar ?? 0) > 0 && inspectedNPC.id && (
              <button
                disabled={feedingLoading}
                onClick={() => handleBeriMakan(inspectedNPC.id!)}
                className="mt-3 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border border-red-400/40"
              >
                <span>🍲</span>
                <span>{feedingLoading ? "Menyajikan makanan..." : "Beri Makan Hotpot Sichuan (1 Pangan Desa)"}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
