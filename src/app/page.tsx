// Halaman utama Negara Emas — Zaman Batu (observer only).
// LAYOUT FULLSCREEN: peta 3D mengisi layar; panel-panel (pengaturan,
// inventori, warga, cari, bangun, kabar) dibuka lewat TOMBOL toggle.
// DUNIA BERSAMA REAL-TIME: semua pengunjung melihat kampung yang sama
// (warga, posisi, waktu, cuaca dari server) — tidak ada dunia per HP,
// tidak ada restart.
// - Bangunan LIHAT SAJA (NPC-only, tanpa tombol antre).
// - TIDAK ADA chat pemain -> warga (dihapus). Warga ngobrol sesama warga
//   lewat bubble di peta.
// - Siang/malam dari SISTEM (jam game server, sama untuk semua) —
//   setting siang/malam DIHAPUS, tidak ada user yang mengatur game.
// - Tombol kanan-bawah = TAMBAH KARAKTER (ronde 7, keputusan user 21:40
//   yang membalik ronde 2): warga baru masuk dunia shared, terlihat semua HP.
// - Bangunan LIHAT SAJA (NPC-only, tanpa tombol antre).
// - TIDAK ADA chat pemain -> warga (dihapus). Warga ngobrol sesama warga
//   lewat bubble di peta.
// - Siang/malam dari SISTEM (jam game server, sama untuk semua) —
//   setting siang/malam DIHAPUS, tidak ada user yang mengatur game.
// - Tombol orientasi KHUSUS MOBILE (default portrait).
// - SFX proximity: suara mengikuti jarak kamera (tombol speaker = mute).
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { gameTime, labelJamGame, cuacaGame } from "@/lib/clock";
import { labelCuaca } from "@/lib/world";
import { formatLabel, formatK } from "@/lib/format";
import KartuProfil from "@/components/KartuProfil";
import { BUILD_ID } from "@/lib/version";
import TambahKarakter from "@/components/TambahKarakter";
import { NeoIcon, type IconName } from "@/components/icons";
import { ensureAudio, setSuaraAktif } from "@/lib/audio";

// Peta 3D butuh WebGL/window → client-only (ssr:false), jangan dirender server.
// Fallback muat jujur: selama chunk 3D diunduh setelah hydration, tampilkan
// teks yang sama dengan layar muat di dalam Map3D, bukan frame kosong.
const Map3D = dynamic(() => import("@/components/Map3D"), {
  ssr: false,
  loading: () => <div className="map3d-loading">Memuat peta 3D…</div>,
});
import { Warga3DPreview } from "@/components/Warga3DPreview";
import { MusyawarahModal } from "@/components/MusyawarahModal";
import { bangunanById, biayaUpgradeBangunan, refundBongkarBangunan, cukupBiaya, kebutuhanKampungBerikutnya, aksiPertamaBerikutnya } from "@/lib/batu/sumberdaya";
import { wargaTanpaTugas } from "@/lib/batu/tampil";

type J = Record<string, any>;

const RES = [
  { id: "kayu", label: "Kayu", icon: "/batu/icons/kayu.png" },
  { id: "batu", label: "Batu", icon: "/batu/icons/batu.png" },
  { id: "emas", label: "Emas", icon: "/batu/icons/emas.png" },
  { id: "besi", label: "Besi", icon: "/batu/icons/besi.png" },
  { id: "pangan", label: "Pangan", icon: "/batu/icons/pangan.png" },
  { id: "kulit", label: "Kulit", icon: "/batu/icons/kulit.png" },
];

const PANELS: { id: string; label: string; icon: IconName }[] = [
  { id: "pengaturan", label: "Pengaturan", icon: "gear" },
  { id: "inventori", label: "Inventori", icon: "inventory" },
  { id: "warga", label: "Warga", icon: "users" },
  { id: "cari", label: "Cari", icon: "search" },
  { id: "bangun", label: "Bangun", icon: "build" },
  { id: "kabar", label: "Kabar", icon: "bell" },
];

async function jget(url: string): Promise<J> {
  const r = await fetch(url);
  return r.json();
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ fontSize: 11, marginBottom: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        <b>{Math.round(value)}</b>
      </div>
      <div className="ne-bar">
        <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const [world, setWorld] = useState<J | null>(null);
  const [map, setMap] = useState<J | null>(null);
  const [panel, setPanel] = useState<string | null>(null);
  const [followId, setFollowId] = useState<string | null>(null);
  const [jamTampil, setJamTampil] = useState("");
  const [orientasi, setOrientasi] = useState<"portrait" | "landscape">("portrait");
  const [oriHint, setOriHint] = useState("");
  const [suara, setSuara] = useState(true);

  const [selected, setSelected] = useState<J | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedHunian, setSelectedHunian] = useState<J | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<J[]>([]);
  const [bangunan, setBangunan] = useState<J | null>(null);
  const [selectedBangunan, setSelectedBangunan] = useState<{ id: string; kind: string; gx: number; gy: number; level: number } | null>(null);
  const [showRestoran, setShowRestoran] = useState(false);
  const [aksiBangunanLoading, setAksiBangunanLoading] = useState(false);
  const [gudang, setGudang] = useState<J | null>(null);
  const [bonusStok, setBonusStok] = useState<Record<string, number>>({});
  const [showMusyawarah, setShowMusyawarah] = useState(false);
  const [loadingTataKota, setLoadingTataKota] = useState(false);

  const handleTataKotaGemini = async () => {
    setLoadingTataKota(true);
    try {
      const res = await fetch("/api/gemini/tatakota", { method: "POST" });
      const data = await res.json();
      if (data.ok && data.relokasi) {
        alert(`🏡 Musyawarah Tata Kota Berhasil!\n\n${data.relokasi.kind} dipindahkan ke samping jalan (${data.relokasi.ke.gx}, ${data.relokasi.ke.gy}).\n\nAlasan Kepala Suku: "${data.relokasi.alasan}"`);
        await muat();
      } else {
        alert(data.message || data.error || "Tata kota belum memerlukan relokasi saat ini.");
      }
    } catch {
      alert("Gagal memanggil musyawarah tata kota.");
    } finally {
      setLoadingTataKota(false);
    }
  };
  const [loadingJalanGemini, setLoadingJalanGemini] = useState(false);

  // GEMINI TUKANG MIKIR — RAPIKAN (2026-11-04): geser bangunan yang
  // menabrak bangunan lain, pilihan + penilaian dari Gemini.
  const [loadingRapikanGemini, setLoadingRapikanGemini] = useState(false);
  const handleRapikanGemini = async () => {
    setLoadingRapikanGemini(true);
    try {
      const res = await fetch("/api/gemini/rapikan", { method: "POST" });
      const data = await res.json();
      if (data.ok && data.dipindah) {
        alert(`🔧 Rapikan Gemini (${data.sumber === "llm" ? "Gemini" : "aturan kampung"})!\n\n${data.dipindah.label} digeser dari (${data.dipindah.dari.gx},${data.dipindah.dari.gy}) ke (${data.dipindah.ke.gx},${data.dipindah.ke.gy}) karena menumpuk dengan ${data.tumpang.label}.\n\nPenilaian Kepala Suku: "${data.penilaian}"\n\nAlasan: "${data.alasan}"`);
        await muat();
      } else {
        alert(data.message || data.error || "Tidak ada bangunan yang bertumpuk.");
      }
    } catch {
      alert("Gagal memanggil rapikan Gemini.");
    } finally {
      setLoadingRapikanGemini(false);
    }
  };

  // GEMINI TUKANG MIKIR — JALAN (2026-11-03): saran segmen jalan
  // berikutnya dari /api/gemini/jalan (penasihat, bukan auto-build).
  const handleJalanGemini = async () => {
    setLoadingJalanGemini(true);
    try {
      const res = await fetch("/api/gemini/jalan", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        alert(`🛤️ Saran Jalan Gemini (${data.sumber === "llm" ? "Gemini" : "aturan kampung"})!\n\nSegmen berikutnya: ${data.segmen} (${data.jumlahUbin} ubin tersisa).\n\nAlasan Kepala Suku: "${data.alasan}"\n\nPembangunan jalan tetap dikerjakan karakter pinter di kampung.`);
      } else {
        alert(data.message || data.error || "Belum ada jalan yang bisa disarankan.");
      }
    } catch {
      alert("Gagal memanggil saran jalan Gemini.");
    } finally {
      setLoadingJalanGemini(false);
    }
  };
  const [musyawarahData, setMusyawarahData] = useState<any>(null);

  const loadMusyawarah = useCallback(async () => {
    try {
      const res = await fetch("/api/musyawarah");
      if (res.ok) {
        const json = await res.json();
        setMusyawarahData(json.terbaru);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadMusyawarah();
  }, [loadMusyawarah]);
  const handleResourceHarvested = useCallback((resource: string, amount: number) => {
    setBonusStok((prev) => ({
      ...prev,
      [resource]: (prev[resource] ?? 0) + amount,
    }));
  }, []);
  // Menu kampung (2026-11-04, permintaan user): topbar DIHAPUS, diganti
  // 1 tombol kanan-atas (menu-fab) yang membuka kartu modal menu.
  // TIDAK ADA tombol gacha (keputusan user masih menunggu — ronde 2).
  const [menuOpen, setMenuOpen] = useState(false);
  // Papan Warga (2026-11-04, Ide 18): daftar seluruh warga dari data
  // peta yang sudah diambil — tanpa fetch baru, tanpa ubah sim.
  const [showPapanWarga, setShowPapanWarga] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [roadLevel, setRoadLevel] = useState<number>(1);
  // Setting label karakter (2026-11-04): default tampil; "0" di
  // localStorage = sembunyi (mode ringan, bertahan antar kunjungan).
  const [labelTampil, setLabelTampil] = useState(true);
  const toggleLabel = () => {
    setLabelTampil((v) => {
      const next = !v;
      try {
        localStorage.setItem("ne_label_karakter", next ? "1" : "0");
      } catch {}
      return next;
    });
  };
  // Tip kontekstual satu baris di kartu menu (2026-11-05, Ide 14):
  // satu kalimat yang menjelaskan model pengamat (warga bekerja
  // sendiri, arah diputuskan Musyawarah) — bukan tur multi-langkah.
  // ✕ menyimpan pilihan di localStorage; dibuka lagi dari Pengaturan.
  const [tipTampil, setTipTampil] = useState(true);
  const tutupTip = () => {
    setTipTampil(false);
    try {
      localStorage.setItem("ne_tip_kontekstual", "0");
    } catch {}
  };
  const tampilkanTip = () => {
    setTipTampil(true);
    try {
      localStorage.setItem("ne_tip_kontekstual", "1");
    } catch {}
  };
  const [versiBaru, setVersiBaru] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Offset jam perangkat -> jam server (dari /api/world server_ms):
  // label jam dihitung dari jam SERVER, bukan jam HP — dua HP yang jam
  // perangkatnya meleset tetap menampilkan waktu dunia yang sama.
  const clockOffsetRef = useRef(0);

  useEffect(() => {
    try {
      // Setting siang/malam DIHAPUS: nilai lama diabaikan + dibersihkan,
      // siang/malam kini murni dari jam game server (tidak ada override user).
      localStorage.removeItem("ne_daynight");
      const ori = localStorage.getItem("ne_orientasi");
      if (ori === "landscape") setOrientasi("landscape");
      if (localStorage.getItem("ne_suara") === "off") {
        setSuara(false);
        setSuaraAktif(false);
      }
      const rl = localStorage.getItem("ne_road_level");
      if (rl) setRoadLevel(Number(rl));
      if (localStorage.getItem("ne_label_karakter") === "0") setLabelTampil(false);
      if (localStorage.getItem("ne_tip_kontekstual") === "0") setTipTampil(false);
    } catch {
      /* abaikan */
    }
  }, []);

  // Audio: mulai HANYA setelah gestur pertama (kebijakan autoplay mobile).
  useEffect(() => {
    const mulai = () => ensureAudio();
    window.addEventListener("pointerdown", mulai);
    window.addEventListener("keydown", mulai);
    return () => {
      window.removeEventListener("pointerdown", mulai);
      window.removeEventListener("keydown", mulai);
    };
  }, []);

  const toggleSuara = () => {
    const next = !suara;
    setSuara(next);
    try {
      localStorage.setItem("ne_suara", next ? "on" : "off");
    } catch {
      /* abaikan */
    }
    ensureAudio();
    setSuaraAktif(next);
  };

  // Orientasi KHUSUS MOBILE (tombol disembunyikan di desktop via CSS).
  // Coba kunci via Screen Orientation API (Android Chrome, butuh fullscreen);
  // bila tidak didukung / ditolak (mis. iOS Safari), cukup ganti layout +
  // beri hint putar HP — tanpa crash.
  const toggleOrientasi = async () => {
    const next = orientasi === "portrait" ? "landscape" : "portrait";
    setOrientasi(next);
    try {
      localStorage.setItem("ne_orientasi", next);
    } catch {
      /* abaikan */
    }
    try {
      const so = (screen as unknown as { orientation?: { lock?: (o: string) => Promise<void> } }).orientation;
      if (so && typeof so.lock === "function") {
        try {
          await (document.documentElement as unknown as { requestFullscreen?: () => Promise<void> }).requestFullscreen?.();
        } catch {
          /* fullscreen ditolak: tetap coba lock */
        }
        await so.lock(next);
        setOriHint("");
      } else {
        setOriHint(`Putar HP-mu ke posisi ${next} (perangkat ini tidak mendukung kunci orientasi).`);
      }
    } catch {
      setOriHint(`Putar HP-mu ke posisi ${next} (kunci orientasi ditolak perangkat).`);
    }
  };

  const muat = useCallback(async () => {
    try {
      const [w, m, b] = await Promise.all([jget("/api/world"), jget("/api/map"), jget("/api/bangunan")]);
      if (w.ok) {
        setWorld(w);
        setBonusStok({});
        if (typeof w.server_ms === "number") clockOffsetRef.current = w.server_ms - Date.now();
      }
      if (m.ok) setMap(m);
      if (b.ok) setBangunan(b);
      // RONDE 8 — penjaga versi: bila deployment live lebih baru dari
      // bundle ini, tampilkan pil muat ulang (bukan auto-reload, supaya
      // tidak mengganggu tontonan). Gagal fetch versi = abaikan, bukan
      // alasan menggagalkan muat dunia/peta.
      try {
        const v = await jget("/api/version");
        if (typeof (v as any).build === "string" && (v as any).build !== BUILD_ID) setVersiBaru(true);
      } catch {
        /* abaikan */
      }
    } catch {
      /* jaringan gagal: tampilkan data terakhir */
    }
  }, []);

  // Ide 17 (2026-11-04): jeda poll data saat tab disembunyikan —
  // pasangan dari jeda loop render (Ide 9). Poll /api/world dkk. tidak
  // ada gunanya saat tidak dilihat; saat kembali, langsung fetch segar
  // (bukan menunggu interval berikutnya) karena jam game server tetap
  // jalan selama tab hidden. Interval lokal 1 detik untuk label jam
  // TIDAK dijeda: murah dan label jam harus tetap benar saat kembali.
  useEffect(() => {
    muat();
    const mulaiPoll = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(muat, 3000);
    };
    mulaiPoll();
    const onVis = () => {
      if (document.hidden) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
      } else {
        muat();
        mulaiPoll();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [muat]);

  useEffect(() => {
    const tick = () => {
      if (world?.epoch_ms) {
        const gt = gameTime(world.epoch_ms, Date.now() + clockOffsetRef.current);
        setJamTampil(labelJamGame(gt));
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [world?.epoch_ms]);

  const detailWarga = async (id: string) => {
    const r = await jget(`/api/warga/${id}`);
    if (r.ok) {
      setSelected(r);
      setSelectedId(id);
      setSelectedHunian(null);
      setPanel("warga");
    }
  };

  // Ketuk karakter di peta -> kamera kunci + ikuti + kartu profil MMORPG.
  // Ketuk karakter lain -> pindah kunci. Batal kunci -> peta bebas lagi.
  const tapWarga = useCallback((id: string) => {
    setFollowId(id);
    setSelectedId(id);
  }, []);
  const batalKunci = useCallback(() => {
    setFollowId(null);
  }, []);

  const handleUpgradeBangunan = async (bId: string) => {
    setAksiBangunanLoading(true);
    try {
      const res = await fetch("/api/bangunan/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal meningkatkan level bangunan");
      } else {
        alert(data.message || "Bangunan berhasil ditingkatkan!");
        if (selectedBangunan && (selectedBangunan.id === bId || selectedBangunan.id === data.id)) {
          setSelectedBangunan({ ...selectedBangunan, level: data.level });
        }
        if (gudang && (gudang.id === bId || gudang.id === data.id)) {
          setGudang({ ...gudang, level: data.level });
        }
        void muat();
      }
    } catch (e: any) {
      alert("Terjadi kesalahan: " + e.message);
    } finally {
      setAksiBangunanLoading(false);
    }
  };

  const handleBongkarBangunan = async (bId: string, bNama: string) => {
    if (!confirm(`Yakin ingin membongkar ${bNama}? 80% bahan akan dikembalikan ke persediaan desa!`)) {
      return;
    }
    setAksiBangunanLoading(true);
    try {
      const res = await fetch("/api/bangunan/bongkar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal membongkar bangunan");
      } else {
        alert(data.message || "Bangunan berhasil dibongkar!");
        setSelectedBangunan(null);
        setGudang(null);
        setSelectedHunian(null);
        setPanel(null);
        void muat();
      }
    } catch (e: any) {
      alert("Terjadi kesalahan: " + e.message);
    } finally {
      setAksiBangunanLoading(false);
    }
  };

  const pilihTile = async (gx: number, gy: number) => {
    if (!map) return;
    const w = (map.warga ?? []).find((x: J) => x.gx === gx && x.gy === gy);
    if (w) return void detailWarga(w.id);
    const p = (map.placements ?? []).find(
      (x: J) => gx >= x.gx && gx < x.gx + (x.w ?? 1) && gy >= x.gy && gy < x.gy + (x.h ?? 1)
    );
    if (p) {
      const bInfo = { id: String(p.id), kind: String(p.kind), gx: Number(p.gx), gy: Number(p.gy), level: Number(p.level ?? 1) };
      setSelectedBangunan(bInfo);
      if (p.kind === "paviliun_makan") {
        setPanel("bangunan_detail");
        return;
      }
      if (p.kind === "lumbung") {
        setGudang(bInfo);
        setPanel("gudang");
        return;
      }
      const h = await jget("/api/hunian");
      if (h.ok) {
        const hit = (h.hunian ?? []).find((x: J) => x.id === p.id);
        if (hit) {
          setSelectedHunian({ ...hit, kind: p.kind, level: p.level ?? 1 });
          setSelected(null);
          setSelectedId(null);
          setPanel("bangunan_detail");
          return;
        }
      }
      setPanel("bangunan_detail");
    }
    // Ketuk tanah kosong = lepas kunci kamera
    if (!p) {
      setFollowId(null);
      setSelectedBangunan(null);
    }
  };

  const tapBangunan = (p: { id: string; kind: string; gx: number; gy: number; level?: number }) => {
    const bInfo = { id: String(p.id), kind: String(p.kind), gx: Number(p.gx), gy: Number(p.gy), level: Number(p.level ?? 1) };
    setSelectedBangunan(bInfo);
    if (p.kind === "paviliun_makan") {
      router.push("/restoransichuan");
      return;
    }
    if (p.kind === "lumbung") {
      setGudang(bInfo);
      setPanel("gudang");
      return;
    }
    setPanel("bangunan_detail");
    void pilihTile(p.gx, p.gy);
  };

  const cari = async () => {
    const r = await jget(`/api/warga?q=${encodeURIComponent(searchQ.trim())}`);
    if (r.ok) setSearchResults(r.warga ?? []);
  };

  const rawStok = world?.sumber_daya ?? {};
  const stok: Record<string, number> = { ...rawStok };
  for (const [k, v] of Object.entries(bonusStok)) {
    stok[k] = (stok[k] ?? 0) + v;
  }
  const kapasitas: Record<string, number> = world?.kapasitas_stok ?? map?.kapasitas_stok ?? { kayu: 100, batu: 80, pangan: 120, kulit: 50, emas: 30, besi: 30 };
  const totalStok = RES.reduce((s, r) => s + Number(stok[r.id] ?? 0), 0);
  const cuaca = world ? cuacaGame(world.hari_total ?? 0) : "cerah";
  const togglePanel = (id: string) => setPanel((p) => (p === id ? null : id));

  // Agregat inventori: perkakas warga + hewan dari data peta.
  const perkakasAgg: Record<string, number> = {};
  for (const w of map?.warga ?? []) {
    for (const p of w.perkakas ?? []) {
      const k = `${p.jenis} Lv${p.level ?? 0}`;
      perkakasAgg[k] = (perkakasAgg[k] ?? 0) + 1;
    }
  }
  const hewanAgg: Record<string, number> = {};
  for (const h of map?.hewan ?? []) {
    hewanAgg[String(h.jenis)] = (hewanAgg[String(h.jenis)] ?? 0) + 1;
  }

  return (
    <div className={`game-root${orientasi === "landscape" ? " landscape-mode" : ""}`}>
      {/* Menu kampung (2026-11-04, permintaan user): topbar DIHAPUS,
          diganti 1 tombol kanan-atas yang membuka kartu modal menu.
          Semua tombol lama pindah ke sini, masing-masing dengan ikon,
          nama, dan penjelasan fungsinya. Info kampung + resource ikut
          di atas kartu supaya tidak ada info yang hilang. */}
      <button className="menu-fab" title="Menu Kampung" onClick={() => setMenuOpen(true)} aria-label="Buka menu kampung">
        <span>☰</span>
      </button>
      {menuOpen && (
        <div className="overlay-full" onClick={() => setMenuOpen(false)}>
          <div className="modal-box menu-card" onClick={(e) => e.stopPropagation()}>
            <div className="menu-card-head">
              <div>
                <div className="menu-card-title">☰ Menu Kampung</div>
                <div className="menu-card-sub">
                  🏰 {world?.kampung ?? "Suka Maju"} (👥 {world ? world.populasi : "…"}) • ⏰ {jamTampil?.includes("•") ? jamTampil.split("•")[1]?.trim() : (jamTampil || "12.00")} ({world?.label_fase ?? "Siang"}) • {labelCuaca(cuaca)} • H-{world?.hari_total ?? 1}
                </div>
              </div>
              <button className="menu-close" title="Tutup menu" onClick={() => setMenuOpen(false)} aria-label="Tutup menu">
                ✕
              </button>
            </div>
            <div className="menu-res-row">
              {RES.map((r) => {
                const current = world ? (stok[r.id] ?? 0) : null;
                const max = kapasitas[r.id] ?? 100;
                const isFull = typeof current === "number" && current >= max;
                const curFmt = current !== null ? formatK(current) : "…";
                const maxFmt = formatK(max);
                return (
                  <div
                    key={r.id}
                    className={`hud-res-chip${isFull ? " res-full" : ""}`}
                    title={`${r.label}: ${current ?? "…"} / ${max} ${isFull ? "(Kapasitas Penuh!)" : ""}`}
                  >
                    <img src={r.icon} alt={r.label} width={16} height={16} className="hud-res-icon" />
                    <span className="hud-res-num">{curFmt}/{maxFmt}</span>
                    {isFull && <span className="hud-full-dot" title="Kapasitas lumbung penuh" />}
                  </div>
                );
              })}
            </div>
            {/* Papan kebutuhan kampung (2026-11-04, Ide 6): display-only,
                1 tingkat berikutnya dari tangga DESAIN-EKONOMI §2. TIDAK
                mengunci bangunan apa pun — hanya memberi tahu target. */}
            {(() => {
              const kb = kebutuhanKampungBerikutnya(
                world?.populasi ?? 0,
                (map?.placements ?? []).map((p: J) => String(p.kind)),
                (map?.warga ?? []).some((w: J) => String(w.peran) === "penambang")
              );
              const aksi = aksiPertamaBerikutnya(kb);
              return (
                <>
                  <div className="menu-kebutuhan">
                    <div className="menu-kebutuhan-title">🎯 Kampung menginginkan</div>
                    {kb.selesai ? (
                      <div className="menu-kebutuhan-isi">Kampung sudah sampai ujung tangga — {kb.target} menanti sebagai bukti kampung besar.</div>
                    ) : (
                      <div className="menu-kebutuhan-isi">
                        <b>{kb.tingkat}: {kb.target}.</b> Masih kurang: {kb.kurang.join(", ")}.
                      </div>
                    )}
                  </div>
                  {/* Satu aksi pertama "Mulai dari sini" (2026-11-04,
                      Ide 12): baris ketuk yang menunjuk ke SATU
                      langkah berikutnya yang sungguh bisa dilakukan
                      pemain — Musyawarah (bangunan diputuskan NPC)
                      atau menutup menu supaya tombol ＋ Tambah
                      karakter kelihatan (populasi kurang). Hilang
                      saat kampung sudah di ujung tangga. */}
                  {aksi && (
                    <button
                      className="menu-mulai"
                      title={aksi.tombol}
                      onClick={() => {
                        setMenuOpen(false);
                        if (aksi.aksi === "musyawarah") setShowMusyawarah(true);
                      }}
                    >
                      <span className="menu-mulai-label">▶ Mulai dari sini: {aksi.tombol}</span>
                      <span className="menu-mulai-teks">{aksi.teks}</span>
                    </button>
                  )}
                </>
              );
            })()}
            {/* Tip kontekstual satu baris (2026-11-05, Ide 14): di bawah
                panel kebutuhan + "Mulai dari sini", di atas daftar tombol
                — terlihat saat menu dibuka, tidak memblokir apa pun.
                ✕ menutup + menyimpan; dibuka lagi dari Pengaturan. */}
            {tipTampil && (
              <div className="menu-tip">
                <div className="menu-tip-teks">
                  <span className="menu-tip-label">💡 Kamu menonton, bukan mengatur:</span>{" "}
                  warga bekerja sendiri. Arah kampung diputuskan lewat Musyawarah, dan target berikutnya ada di panel “Kampung menginginkan” di atas.
                </div>
                <button className="menu-tip-tutup" title="Tutup tip (bisa dibuka lagi dari Pengaturan)" aria-label="Tutup tip" onClick={tutupTip}>
                  ✕
                </button>
              </div>
            )}
            <div className="menu-list">
              <button className="menu-item" title="Masuk ke Interior Restoran Nirwana 3D" onClick={() => { setMenuOpen(false); router.push("/restoransichuan"); }}>
                <span className="menu-item-icon">🏮</span>
                <span>
                  <span className="menu-item-title">Resto</span>
                  <span className="menu-item-desc">Masuk ke interior Restoran Nirwana 3D: meja, lentera, dan suasana makan bersama.</span>
                </span>
              </button>
              <button className="menu-item" title="Musyawarah Bulanan Pemimpin Kampung" onClick={() => { setMenuOpen(false); setShowMusyawarah(true); }}>
                <span className="menu-item-icon">📜</span>
                <span>
                  <span className="menu-item-title">Musyawarah</span>
                  <span className="menu-item-desc">Rapat bulanan pemimpin kampung: kabar, keputusan, dan arah kampung.</span>
                </span>
              </button>
              <button className="menu-item" title="Tata Kota Kampung" onClick={() => { setMenuOpen(false); void handleTataKotaGemini(); }} disabled={loadingTataKota}>
                <span className="menu-item-icon">🏡</span>
                <span>
                  <span className="menu-item-title">{loadingTataKota ? "Menata..." : "Tata Kota"}</span>
                  <span className="menu-item-desc">Gemini memindahkan satu rumah ke tepi jalan supaya kampung lebih rapi.</span>
                </span>
              </button>
              <button className="menu-item" title="Saran Jalan Gemini" onClick={() => { setMenuOpen(false); void handleJalanGemini(); }} disabled={loadingJalanGemini}>
                <span className="menu-item-icon">🛤️</span>
                <span>
                  <span className="menu-item-title">{loadingJalanGemini ? "Memikir..." : "Jalan Gemini"}</span>
                  <span className="menu-item-desc">Gemini menyarankan segmen jalan berikutnya yang paling berguna untuk kampung.</span>
                </span>
              </button>
              <button className="menu-item" title="Rapikan Gemini: geser bangunan yang menabrak bangunan lain" onClick={() => { setMenuOpen(false); void handleRapikanGemini(); }} disabled={loadingRapikanGemini}>
                <span className="menu-item-icon">🔧</span>
                <span>
                  <span className="menu-item-title">{loadingRapikanGemini ? "Merapi..." : "Rapikan Gemini"}</span>
                  <span className="menu-item-desc">Gemini menggeser bangunan yang menumpuk dengan bangunan lain ke petak kosong.</span>
                </span>
              </button>
              <button
                className="menu-item"
                title={`Gaya Jalan: Level ${roadLevel} (${roadLevel === 3 ? "Kerajaan Megah" : roadLevel === 2 ? "Batu Koral" : "Tanah Liar"}). Ketuk untuk ganti.`}
                onClick={() => {
                  const next = roadLevel >= 3 ? 1 : roadLevel + 1;
                  setRoadLevel(next);
                  try {
                    localStorage.setItem("ne_road_level", String(next));
                  } catch {}
                }}
              >
                <span className="menu-item-icon">{roadLevel === 3 ? "👑" : roadLevel === 2 ? "🪨" : "🪵"}</span>
                <span>
                  <span className="menu-item-title">Gaya Jalan: Lv{roadLevel}</span>
                  <span className="menu-item-desc">Ganti tampilan jalan kampung: Tanah, Batu Koral, atau Kerajaan. Ketuk untuk ganti level.</span>
                </span>
              </button>
              <button className="menu-item" title={suara ? "Matikan suara (mute)" : "Nyalakan suara"} onClick={toggleSuara}>
                <span className="menu-item-icon">{suara ? "🔊" : "🔇"}</span>
                <span>
                  <span className="menu-item-title">Suara: {suara ? "Nyala" : "Mati"}</span>
                  <span className="menu-item-desc">Nyalakan atau matikan semua efek suara game.</span>
                </span>
              </button>
              <button className="menu-item" title="Pengaturan" onClick={() => { setMenuOpen(false); togglePanel("pengaturan"); }}>
                <span className="menu-item-icon">⚙️</span>
                <span>
                  <span className="menu-item-title">Pengaturan</span>
                  <span className="menu-item-desc">Atur suara, label karakter (mode ringan), orientasi, dan gaya jalan.</span>
                </span>
              </button>
              <button className="menu-item" title="Inventori" onClick={() => { setMenuOpen(false); togglePanel("inventori"); }}>
                <span className="menu-item-icon">🎒</span>
                <span>
                  <span className="menu-item-title">Inventori</span>
                  <span className="menu-item-desc">Lihat stok resource dan perkakas kampung.</span>
                </span>
              </button>
              <button className="menu-item" title="Papan Warga" onClick={() => { setMenuOpen(false); setShowPapanWarga(true); }}>
                <span className="menu-item-icon">👥</span>
                <span>
                  <span className="menu-item-title">Papan Warga</span>
                  <span className="menu-item-desc">Daftar semua warga dari data peta: nama, peran, dan aktivitas saat ini. Ketuk baris untuk detail.</span>
                </span>
              </button>
              <button className="menu-item" title="Ganti orientasi (mobile)" onClick={() => { setMenuOpen(false); void toggleOrientasi(); }}>
                <span className="menu-item-icon">🔄</span>
                <span>
                  <span className="menu-item-title">Orientasi: {orientasi}</span>
                  <span className="menu-item-desc">Putar tampilan antara portrait dan landscape (mobile).</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Papan Warga (2026-11-04, Ide 18): display-only, daftar dari
          map.warga yang SUDAH diambil poll — tanpa fetch baru, tanpa
          ubah sim. Baris diketuk -> kamera menuju + mengikuti warga
          itu + kartu profil (sama seperti ketuk karakter di peta,
          permintaan user 2026-11-04: ketuk papan karakter, kamera
          otomatis di atas/dekat karakter).
          Tutup lewat ✕, ketuk latar, ATAU tombol Tutup di bawah
          daftar (jangkauan jempol, bukan hanya pojok atas). */}
      {showPapanWarga && (
        <div className="overlay-full" onClick={() => setShowPapanWarga(false)}>
          <div className="modal-box menu-card" onClick={(e) => e.stopPropagation()}>
            <div className="menu-card-head">
              <div>
                <div className="menu-card-title">👥 Papan Warga</div>
                <div className="menu-card-sub">
                  {(map?.warga ?? []).length} warga • dari data peta yang sudah diambil • ketuk baris untuk menuju karakter
                </div>
              {(map?.warga ?? []).filter((w: J) => wargaTanpaTugas(w)).length > 0 && (
                <div className="papan-warga-tanpatugas">
                  💤 {(map?.warga ?? []).filter((w: J) => wargaTanpaTugas(w)).length} warga tanpa tugas — tidak ada target kerja saat ini
                </div>
              )}
              </div>
              <button className="menu-close" title="Tutup papan warga" onClick={() => setShowPapanWarga(false)} aria-label="Tutup papan warga">
                ✕
              </button>
            </div>
            <div className="papan-warga-list">
              {(map?.warga ?? []).length === 0 ? (
                <p style={{ fontSize: 12, opacity: 0.85 }}>Belum ada data warga — tunggu peta termuat.</p>
              ) : (
                (map?.warga ?? []).map((w: J) => (
                  <button
                    key={w.id}
                    className="papan-warga-row"
                    title={`${w.nama} (${w.nomor})`}
                    onClick={() => { setShowPapanWarga(false); tapWarga(String(w.id)); }}
                  >
                    <span className="papan-warga-nama">{w.nama} ({w.nomor})</span>
                    <span className="papan-warga-status">{formatLabel(String(w.peran ?? ""))} • {w.status_teks ?? "—"}{wargaTanpaTugas(w) ? " • 💤 tanpa tugas" : ""}</span>
                  </button>
                ))
              )}
            </div>
            <button className="papan-warga-tutup" onClick={() => setShowPapanWarga(false)}>
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* RONDE 8 — pil versi baru: muncul bila deployment live lebih baru
          dari bundle tab ini (tab lama). Ketuk = muat ulang sekali ke
          kode terbaru. z 55: di atas FAB/nav (35), di bawah modal (60). */}
      {versiBaru && (
        <button
          type="button"
          title="Muat ulang ke versi terbaru"
          aria-label="Muat ulang ke versi terbaru"
          onClick={() => window.location.reload()}
          style={{
            position: "fixed",
            top: 48,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 55,
            background: "#f5c542",
            color: "#241a00",
            border: "none",
            borderRadius: 999,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 2px 10px rgba(0,0,0,0.45)",
            cursor: "pointer",
          }}
        >
          Versi baru tersedia — ketuk untuk muat ulang
        </button>
      )}

      <div className="game-main fs-map">        <div className="game-canvas-wrap">
          <Map3D
            map={map}
            selectedId={selectedId}
            onSelectTile={pilihTile}
            followId={followId}
            onTapWarga={tapWarga}
            onLepasKunci={batalKunci}
            onTapBangunan={tapBangunan}
            gameFase={String(world?.fase ?? "")}
            jamTotal={Number(world?.jam_total ?? 0)}
            onResourceHarvested={handleResourceHarvested}
            roadLevel={roadLevel}
            labelTampil={labelTampil}
          />
        </div>

        <TambahKarakter />

        {followId && (() => {
          const w = (map?.warga ?? []).find((x: J) => x.id === followId);
          return w ? <KartuProfil warga={w} onBatal={batalKunci} /> : null;
        })()}

        {panel && (
          <aside className="side-panel md-panel" style={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
              {PANELS.map((t) => (
                <button
                  key={t.id}
                  className="icon-btn"
                  title={t.label}
                  style={{ width: 40, height: 40, borderColor: panel === t.id ? "#facc15" : undefined }}
                  onClick={() => setPanel(t.id)}
                >
                  <NeoIcon name={t.icon} size={24} />
                </button>
              ))}
              <button className="icon-btn" title="Tutup panel" style={{ width: 40, height: 40, marginLeft: "auto" }} onClick={() => setPanel(null)}>
                <NeoIcon name="close" size={22} />
              </button>
            </div>

            {panel === "pengaturan" && (
              <div>
                <h2 className="md-title" style={{ fontSize: 13 }}>Pengaturan</h2>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  Suara:{" "}
                  <button className="md-btn" style={{ padding: "4px 10px" }} onClick={toggleSuara}>
                    {suara ? "Nyala (ketuk untuk mute)" : "Mati (ketuk untuk nyalakan)"}
                  </button>
                </div>
                <p style={{ fontSize: 11, opacity: 0.75, marginTop: 0 }}>
                  Efek suara mengikuti jarak kamera: langkah kaki, perkakas (kapak/beliung/palu), api unggun, air sungai, dan suara
                  hewan — jauh tidak terdengar, dekat makin jelas. Suara mulai setelah sentuhan pertama (aturan autoplay HP).
                </p>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  Label karakter (nama, dialog, aksi):{" "}
                  <button className="md-btn" style={{ padding: "4px 10px" }} onClick={toggleLabel}>
                    {labelTampil ? "Tampil (ketuk untuk sembunyikan)" : "Sembunyi — mode ringan (ketuk untuk tampilkan)"}
                  </button>
                </div>
                <p style={{ fontSize: 11, opacity: 0.75, marginTop: 0 }}>
                  Mode ringan menyembunyikan semua label di atas karakter — nama, bubble dialog, teks aksi, dan bar HP — sehingga
                  browser tidak lagi menggambar dan menggeser puluhan label tiap detik. Karakter 3D-nya tetap jalan seperti biasa,
                  hanya labelnya yang hilang.
                </p>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  Tip kontekstual di menu:{" "}
                  <button className="md-btn" style={{ padding: "4px 10px" }} onClick={tipTampil ? tutupTip : tampilkanTip}>
                    {tipTampil ? "Tampil (ketuk untuk sembunyikan)" : "Sembunyi (ketuk untuk tampilkan)"}
                  </button>
                </div>
                <p style={{ fontSize: 11, opacity: 0.75, marginTop: 0 }}>
                  Satu baris di kartu menu yang mengingatkan model pengamat: warga bekerja sendiri, arah kampung diputuskan lewat
                  Musyawarah. Menutupnya dari menu menyimpan pilihan; tombol ini membukanya lagi.
                </p>
                <div className="orient-mobile-only" style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>Orientasi (mobile): {orientasi}</div>
                  <button className="md-btn" style={{ padding: "6px 10px" }} onClick={() => void toggleOrientasi()}>
                    Ganti ke {orientasi === "portrait" ? "Landscape" : "Portrait"}
                  </button>
                  {oriHint && <p style={{ fontSize: 11, marginTop: 6 }}>{oriHint}</p>}
                </div>
                <hr />
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Gaya & Level Jalan Kampung:</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { lvl: 1, label: "Tanah (Lv1)", icon: "🪵" },
                      { lvl: 2, label: "Batu Koral (Lv2)", icon: "🪨" },
                      { lvl: 3, label: "Kerajaan (Lv3)", icon: "👑" },
                    ].map((r) => (
                      <button
                        key={r.lvl}
                        type="button"
                        className="md-btn"
                        onClick={() => {
                          setRoadLevel(r.lvl);
                          try {
                            localStorage.setItem("ne_road_level", String(r.lvl));
                          } catch {}
                        }}
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          fontSize: 11,
                          fontWeight: roadLevel === r.lvl ? 800 : 500,
                          background: roadLevel === r.lvl ? "#facc15" : "rgba(30, 41, 59, 0.8)",
                          color: roadLevel === r.lvl ? "#0b1e3a" : "#e2f5ff",
                          borderColor: roadLevel === r.lvl ? "#facc15" : "rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        {r.icon} {r.label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 11, opacity: 0.75, marginTop: 6 }}>
                    Jalan 3D modular menyesuaikan belokan, pertigaan (T-junction), dan perempatan secara otomatis ke seluruh jaringan kampung.
                  </p>
                </div>
                <hr />
                <h3 className="md-title" style={{ fontSize: 13 }}>Dunia Bersama Real-Time</h3>
                <p style={{ fontSize: 12, lineHeight: 1.6 }}>
                  Kampung ini berjalan terus di server — walau tidak ada yang membuka web, waktu tetap berjalan dan warga tetap
                  hidup. Setiap orang yang membuka situs ini melihat kampung yang SAMA: warga, posisi, aksi, dan waktu yang sama
                  — tidak ada dunia per HP, tidak ada restart. Pembuatan warga oleh pengunjung dinonaktifkan: kampung hidup dengan
                  warganya sendiri, dan kamu menonton sebagai pengamat.
                </p>
                <hr />
                <p style={{ fontSize: 11, opacity: 0.75 }}>
                  <a href="/credits" style={{ color: "#22d3ee" }}>Kredit</a>
                </p>
              </div>
            )}

            {panel === "inventori" && (
              <div>
                <h2 className="md-title" style={{ fontSize: 13 }}>Inventori Kampung</h2>
                <div style={{ fontSize: 12, marginBottom: 6 }}>Resource suku:</div>
                {RES.map((r) => (
                  <div key={r.id} style={{ fontSize: 13, marginBottom: 3 }}>
                    <img src={r.icon} alt={r.label} width={22} height={22} style={{ verticalAlign: "middle", marginRight: 8, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }} />
                    {r.label}: <b>{stok[r.id] ?? 0}</b>
                  </div>
                ))}
                <hr />
                <div style={{ fontSize: 12, marginBottom: 6 }}>Perkakas warga:</div>
                {Object.keys(perkakasAgg).length === 0 && <div style={{ fontSize: 12 }}>Belum ada perkakas.</div>}
                {Object.entries(perkakasAgg).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 12, marginBottom: 2 }}>
                    {k}: <b>{v}</b>
                  </div>
                ))}
                <p style={{ fontSize: 11, opacity: 0.75 }}>Perkakas kasar (Lv0) dibuat warga sejak awal; crafting saat istirahat menaikkan ke Lv1 bila stok cukup.</p>
                <hr />
                <div style={{ fontSize: 12, marginBottom: 6 }}>Hewan ({(map?.hewan ?? []).length} ekor):</div>
                {Object.keys(hewanAgg).length === 0 && <div style={{ fontSize: 12 }}>Belum ada hewan terpantau.</div>}
                {Object.entries(hewanAgg).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 12, marginBottom: 2 }}>
                    {formatLabel(k)}: <b>{v}</b>
                  </div>
                ))}
              </div>
            )}

            {panel === "gudang" && gudang && (() => {
              const defLumbung = bangunanById("lumbung");
              const lvl = Math.min(3, Math.max(1, Number(gudang.level ?? 1)));
              const upgCost = lvl < 3 && defLumbung ? biayaUpgradeBangunan(defLumbung, lvl) : {};
              const refCost = defLumbung ? refundBongkarBangunan(defLumbung, lvl) : {};
              const canUpg = cukupBiaya(stok as any, upgCost);

              return (
                <div>
                  <h2 className="md-title" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🌾</span>
                    <span>Lumbung Penyimpanan</span>
                    <span style={{ fontSize: 11, background: "#f59e0b", color: "#000", padding: "1px 6px", borderRadius: 4, fontWeight: "bold" }}>
                      Lv {lvl}/3
                    </span>
                  </h2>

                  <div style={{ fontSize: 12, marginBottom: 8 }}>
                    Lumbung di ({gudang.gx}, {gudang.gy}) — Kapasitas Level {lvl}:
                  </div>

                  {RES.map((r) => {
                    const val = stok[r.id] ?? 0;
                    const max = kapasitas[r.id] ?? 100;
                    const pct = Math.min(100, Math.round((val / max) * 100));
                    const isFull = val >= max;

                    return (
                      <div key={r.id} style={{ fontSize: 12, marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span>
                            <img src={r.icon} alt={r.label} width={20} height={20} style={{ verticalAlign: "middle", marginRight: 6, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }} />
                            {r.label}
                          </span>
                          <span style={{ fontWeight: isFull ? "bold" : "normal", color: isFull ? "#ef4444" : undefined }}>
                            {val} / {max} {isFull ? "(PENUH!)" : ""}
                          </span>
                        </div>
                        <div className="ne-bar">
                          <div style={{ width: `${pct}%`, background: isFull ? "#ef4444" : "#22c55e" }} />
                        </div>
                      </div>
                    );
                  })}

                  <hr style={{ margin: "8px 0" }} />
                  <div style={{ fontSize: 12, marginBottom: 4 }}>
                    Total Disimpan: <b>{totalStok} unit</b>
                  </div>
                  <p style={{ fontSize: 11, opacity: 0.75, marginBottom: 10 }}>
                    Kapasitas dibatasi oleh level lumbung desa. Tingkatkan lumbung untuk menampung lebih banyak kayu, batu, pangan, dan bahan purba lainnya.
                  </p>

                  {/* Status Otonom Lumbung */}
                  <div style={{ marginTop: 8, padding: 10, background: "rgba(15, 23, 42, 0.8)", border: "1px solid #38bdf8", borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: "bold", color: "#38bdf8" }}>
                        🏛️ Status & Level Lumbung
                      </span>
                      <span style={{ fontSize: 11, background: "#f59e0b", color: "#000", padding: "1px 6px", borderRadius: 4, fontWeight: "bold" }}>
                        Level {lvl}/3
                      </span>
                    </div>
                    {lvl < 3 ? (
                      <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 6 }}>
                        Kebutuhan bahan upgrade ke Level {lvl + 1}:
                        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                          {Object.entries(upgCost).map(([k, v]) => (
                            <span key={k} style={{ color: (stok[k] ?? 0) >= (v ?? 0) ? "#4ade80" : "#f87171" }}>
                              {k}: {stok[k] ?? 0}/{v}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: "#facc15", fontWeight: "bold", marginBottom: 6 }}>
                        ⭐ Lumbung telah mencapai level maksimal (Level 3)!
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: 6 }}>
                      🧠 <b>Otonomi Kampung:</b> Pemain adalah pengamat. Keputusan meningkatkan level atau membongkar lumbung diputuskan secara berkala oleh musyawarah tetua dan warga desa bila kapasitas lumbung menipis.
                    </div>
                  </div>
                </div>
              );
            })()}

            {panel === "bangunan_detail" && selectedBangunan && (() => {
              const def = bangunanById(selectedBangunan.kind);
              const bNama = def?.label ?? selectedBangunan.kind;
              const lvl = Math.min(3, Math.max(1, Number(selectedBangunan.level ?? 1)));
              const upgCost = lvl < 3 && def ? biayaUpgradeBangunan(def, lvl) : {};
              const refCost = def ? refundBongkarBangunan(def, lvl) : {};
              const canUpg = cukupBiaya(stok as any, upgCost);

              return (
                <div>
                  <h2 className="md-title" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{selectedBangunan.kind === "paviliun_makan" ? "🏮" : "🏛️"}</span>
                    <span>{bNama}</span>
                    <span style={{ fontSize: 11, background: "#f59e0b", color: "#000", padding: "1px 6px", borderRadius: 4, fontWeight: "bold" }}>
                      Lv {lvl}/3
                    </span>
                  </h2>

                  <div style={{ fontSize: 12, marginBottom: 8, opacity: 0.85 }}>
                    Lokasi: ({selectedBangunan.gx}, {selectedBangunan.gy}) • {def?.deskripsi ?? "Bangunan desa zaman batu."}
                  </div>

                  {selectedBangunan.kind === "paviliun_makan" && (
                    <div style={{ margin: "10px 0", padding: 10, background: "rgba(217, 119, 6, 0.15)", border: "1px solid #d97706", borderRadius: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: "bold", color: "#fbbf24", marginBottom: 4 }}>
                        🏮 Dimensi Interior Restoran 3D
                      </div>
                      <div style={{ fontSize: 11, color: "#d6d3d1", marginBottom: 8 }}>
                        Jelajahi interior restoran secara terpisah: lihat Chef Gandi di dapur terbuka, Kasir Laras di meja kayu solid, pelayan, dan warga yang sedang makan bersama!
                      </div>
                      <button
                        onClick={() => router.push("/restoransichuan")}
                        className="md-btn"
                        style={{
                          width: "100%",
                          background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: 12,
                          padding: "8px 12px",
                          border: "1px solid #f59e0b",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        🏮 Masuk ke Interior Restoran Nirwana
                      </button>
                    </div>
                  )}

                  {selectedHunian && (
                    <div style={{ margin: "10px 0", padding: 8, background: "rgba(255,255,255,0.05)", borderRadius: 6, fontSize: 12 }}>
                      <div><b>Kapasitas Hunian:</b> {selectedHunian.isi ?? 0} / {selectedHunian.kapasitas ?? 2} orang</div>
                      <div><b>Penghuni:</b> {(selectedHunian.penghuni ?? []).map((s: J) => `${s.nama} (${s.nomor})`).join(", ") || "Belum ada penghuni"}</div>
                    </div>
                  )}

                  {/* Status Otonom Bangunan */}
                  <div style={{ marginTop: 10, padding: 10, background: "rgba(15, 23, 42, 0.8)", border: "1px solid #38bdf8", borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: "bold", color: "#38bdf8" }}>
                        🏛️ Status & Level Bangunan
                      </span>
                      <span style={{ fontSize: 11, background: "#f59e0b", color: "#000", padding: "1px 6px", borderRadius: 4, fontWeight: "bold" }}>
                        Level {lvl}/3
                      </span>
                    </div>
                    {lvl < 3 ? (
                      <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 6 }}>
                        Kebutuhan bahan upgrade ke Level {lvl + 1}:
                        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                          {Object.entries(upgCost).map(([k, v]) => (
                            <span key={k} style={{ color: (stok[k] ?? 0) >= (v ?? 0) ? "#4ade80" : "#f87171" }}>
                              {k}: {stok[k] ?? 0}/{v}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: "#facc15", fontWeight: "bold", marginBottom: 6 }}>
                        ⭐ Bangunan telah mencapai level maksimal (Level 3)!
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: 6 }}>
                      🧠 <b>Otonomi Kampung:</b> Keputusan meningkatkan level, membongkar, atau merelokasi bangunan ini sepenuhnya diputuskan oleh musyawarah tetua dan warga desa.
                    </div>
                  </div>
                </div>
              );
            })()}

            {panel === "warga" && (
              <div>
                <h2 className="md-title" style={{ fontSize: 13 }}>Warga</h2>
                {selected ? (
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    <Warga3DPreview warga={selected.warga} />
                    <div>
                      <b>{selected.warga?.nama}</b> ({selected.warga?.nomor})
                    </div>
                    <div>
                      {formatLabel(String(selected.warga?.peran))} • {selected.warga?.umur} tahun • {selected.warga?.tahap_hidup}
                    </div>
                    <div>
                      INT {selected.warga?.stat?.int} • STR {selected.warga?.stat?.str} • AGI {selected.warga?.stat?.agi} • STA{" "}
                      {selected.warga?.stat?.sta} • Bakat {selected.warga?.bakat} • Sifat {selected.warga?.sifat}
                    </div>
                    <div>Status: {selected.warga?.status_teks}</div>
                    <div>
                      Kerja: {selected.warga?.tempat_kerja} • Progres {selected.warga?.progres_aksi_pct ?? 0}%
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <Bar label="Stamina" value={selected.warga?.stamina ?? 100} color="#22d3ee" />
                      <Bar label="Lapar (tinggi = lapar)" value={selected.warga?.lapar ?? 0} color="#f59e0b" />
                      <Bar label="Sehat" value={selected.warga?.sehat ?? 100} color="#22c55e" />
                    </div>
                    {(selected.warga?.perkakas ?? []).length > 0 && (
                      <div>
                        Perkakas: {(selected.warga?.perkakas ?? []).map((p: J) => `${p.jenis} Lv${p.level ?? 0}`).join(", ")}
                      </div>
                    )}
                    {selected.warga?.interaksi && (
                      <div>
                        Interaksi: {selected.warga.interaksi.jenis} dengan {selected.warga.interaksi.dengan} — “{selected.warga.interaksi.teks}”
                      </div>
                    )}
                    {selected.hunian && (
                      <div>
                        Hunian: {selected.hunian.label} (isi {selected.hunian.isi}/{selected.hunian.kapasitas})
                      </div>
                    )}
                    {selected.serumah?.length > 0 && (
                      <div>Serumah: {selected.serumah.map((s: J) => `${s.nama} (${s.nomor})`).join(", ")}</div>
                    )}
                  </div>
                ) : selectedHunian ? (
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    <div>
                      <b>{selectedHunian.label}</b> (isi {selectedHunian.isi}/{selectedHunian.kapasitas})
                    </div>
                    <div>Penghuni: {(selectedHunian.penghuni ?? []).map((s: J) => `${s.nama} (${s.nomor})`).join(", ") || "—"}</div>
                  </div>
                ) : (
                  <p style={{ fontSize: 12 }}>Klik warga atau bangunan di peta untuk detail.</p>
                )}
              </div>
            )}

            {panel === "cari" && (
              <div>
                <h2 className="md-title" style={{ fontSize: 13 }}>Cari Warga</h2>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Nama atau nomor (mis. 0001)"
                    style={{ padding: 6, flex: 1 }}
                    onKeyDown={(e) => e.key === "Enter" && void cari()}
                  />
                  <button className="md-btn" style={{ padding: "6px 10px" }} onClick={() => void cari()}>
                    Cari
                  </button>
                </div>
                <div style={{ marginTop: 8 }}>
                  {searchResults.map((w: J) => (
                    <button key={w.id} className="md-btn" style={{ padding: "4px 8px", margin: "3px 3px 0 0" }} onClick={() => void detailWarga(w.id)}>
                      {w.nama} ({w.nomor}) — {formatLabel(String(w.peran))}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {panel === "bangun" && (
              <div>
                <h2 className="md-title" style={{ fontSize: 13 }}>Bangun (Lihat Saja)</h2>
                <p style={{ fontSize: 12 }}>
                  Bangunan hanya diputuskan + diantrekan NPC (kepala suku / musyawarah) dari kebutuhan + stok kampung. Pemain hanya
                  menonton — tidak ada tombol antre.
                </p>
                {(bangunan?.katalog ?? []).map((b: J) => (
                  <div key={b.id} style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.5 }}>
                    <img src={b.sprite} alt="" width={28} height={28} style={{ verticalAlign: "middle", marginRight: 6 }} />
                    <b>{b.label}</b> — {b.deskripsi}
                    <br />
                    Biaya:{" "}
                    {Object.entries(b.biaya ?? {})
                      .map(([k, v]) => `${v} ${k}`)
                      .join(", ")}
                  </div>
                ))}
                <hr />
                <div style={{ fontSize: 12 }}>Antrean &amp; pembangunan:</div>
                {(bangunan?.antrean ?? []).map((a: J) => (
                  <div key={a.id} style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
                    <b>{a.label}</b> — {a.status} {a.status === "dibangun" ? `${a.progres}%` : ""}
                    {a.pemrakarsa && (
                      <span>
                        <br />
                        Diputuskan: {a.pemrakarsa}
                      </span>
                    )}
                    {a.alasan && (
                      <span>
                        <br />“{a.alasan}” ({a.sumber_alasan === "llm" ? "Tetua Suku" : "Musyawarah"})
                      </span>
                    )}
                    {a.status === "antre" && Object.keys(a.kurang ?? {}).length > 0 && (
                      <span>
                        <br />
                        Kurang:{" "}
                        {Object.entries(a.kurang ?? {})
                          .map(([k, v]) => `${v} ${k}`)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                ))}
                {(bangunan?.antrean ?? []).length === 0 && <div style={{ fontSize: 12 }}>Belum ada antrean.</div>}
              </div>
            )}

            {panel === "kabar" && (
              <div>
                <h2 className="md-title" style={{ fontSize: 13 }}>Kabar Kampung</h2>
                {(world?.feed?.kabar ?? []).map((k: J, i: number) => (
                  <div key={i} style={{ fontSize: 12, marginBottom: 6 }}>
                    Hari {k.hari}: {k.teks}
                  </div>
                ))}
                <hr />
                <div style={{ fontSize: 12 }}>Warga terbaru:</div>
                {(world?.feed?.warga_terbaru ?? []).map((w: J, i: number) => (
                  <div key={i} style={{ fontSize: 12 }}>
                    {w.nama} ({w.nomor}) — {w.label_peran}
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}

        <div className="bottom-controls">
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div className="hud-help-wrap">
              <button
                type="button"
                className="hud-help-btn"
                onClick={() => setShowHelp((v) => !v)}
                title="Panduan Kontrol Kamera & Interaksi"
              >
                <span>🎮</span>
                <span>Panduan Kontrol</span>
              </button>
              {showHelp && (
                <div className="hud-help-popover">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <b style={{ color: "#facc15" }}>Panduan Kontrol</b>
                    <button type="button" className="hud-close-x" onClick={() => setShowHelp(false)}>✕</button>
                  </div>
                  <div className="hud-help-item"><span>🖱️ Geser:</span> Pindah arah kamera</div>
                  <div className="hud-help-item"><span>🔍 Scroll / Cubit:</span> Zoom dekat & jauh</div>
                  <div className="hud-help-item"><span>🔄 Klik kanan / 2 jari:</span> Putar arah pandang</div>
                  <div className="hud-help-item"><span>👤 Ketuk Karakter:</span> Kunci kamera & profil 3D</div>
                  <div className="hud-help-item"><span>🏮 Bangunan:</span> Info hunian & restoran</div>
                </div>
              )}
            </div>

            {followId && (
              <button
                type="button"
                className="hud-help-btn"
                onClick={batalKunci}
                style={{
                  background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                  borderColor: "#f87171",
                  color: "#ffffff",
                  fontWeight: 700,
                }}
                title="Lepas kunci kamera dari karakter saat ini"
              >
                <span>🔓</span>
                <span>Lepas Kunci Kamera</span>
              </button>
            )}
          </div>
        </div>

        <MusyawarahModal
          isOpen={showMusyawarah}
          onClose={() => setShowMusyawarah(false)}
          musyawarahData={musyawarahData}
          onRefresh={loadMusyawarah}
        />

      </div>
    </div>
  );
}
