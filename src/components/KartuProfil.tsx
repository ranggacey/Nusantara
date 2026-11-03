"use client";
import React, { useState, useEffect } from "react";
import Karakter3DPreview from "@/components/Karakter3DPreview";
// Kartu profil karakter gaya MMORPG modern — ditampilkan saat kamera
// mengunci karakter (ketuk karakter di peta). Bukan kartu polos: bingkai
// emas, aksen warna per peran, potret SVG bikinan sendiri (bukan pixel,
// bukan emoji, bukan foto download), bar stat + kebutuhan, perkakas,
// hunian, aksi sekarang, sifat/bakat. Data dari peta (live, refresh tiap
// poll) — tidak perlu fetch tambahan.
import { NeoIcon } from "@/components/icons";
import { infoBakat } from "@/lib/batu/bakat";
import { LABEL_ALAT } from "@/lib/batu/peran";

type J = Record<string, any>;

const ROLE_META: Record<string, { label: string; color: string }> = {
  kepala_suku: { label: "Kepala Suku", color: "#b91c1c" },
  pemburu: { label: "Pemburu", color: "#92400e" },
  pengumpul: { label: "Pengumpul", color: "#15803d" },
  penebang: { label: "Penebang", color: "#78350f" },
  penambang: { label: "Penambang", color: "#475569" },
  perajin: { label: "Perajin", color: "#1d4ed8" },
  tabib: { label: "Tabib", color: "#0f766e" },
  penjaga_api: { label: "Penjaga Api", color: "#ea580c" },
  peramu: { label: "Peramu", color: "#7c3aed" },
  juru_masak: { label: "Juru Masak", color: "#be185d" },
};

const SKIN = ["#f2c9a0", "#d9a066", "#a9714b", "#7a4a2b"];
function skinDariNomor(nomor: string): string {
  let h = 0;
  for (const c of nomor) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return SKIN[h % SKIN.length];
}

const FASE_LABEL: Record<string, string> = {
  jalan: "Berjalan",
  kumpul: "Mengumpulkan",
  kembali: "Kembali",
  istirahat: "Istirahat",
};

// RONDE 9: potret ikut gender — laki rambut pendek (topi saja),
/// perempuan rambut panjang (panel samping + belakang).
function Potret({ peran, nomor, gender }: { peran: string; nomor: string; gender?: string }) {
  const panjang = gender === "perempuan";
  const meta = ROLE_META[peran] ?? { label: peran, color: "#6b7280" };
  const skin = skinDariNomor(nomor);
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#0b1e3a" stroke="#facc15" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="27" fill={meta.color} opacity="0.35" />
      {/* Bahu / jubah peran */}
      <path d="M14 54 Q32 34 50 54 L50 60 L14 60 Z" fill={meta.color} />
      {/* Kepala */}
      <circle cx="32" cy="28" r="11" fill={skin} />
      {/* Rambut: laki pendek (topi saja), perempuan panjang (samping+belakang) */}
      <path d="M21 28 Q21 15 32 15 Q43 15 43 28 Q38 20 32 20 Q26 20 21 28 Z" fill="#2b2118" />
      {panjang && (<>
        <rect x="20" y="26" width="5" height="18" rx="2" fill="#2b2118" />
        <rect x="39" y="26" width="5" height="18" rx="2" fill="#2b2118" />
      </>)}
      {/* Mata */}
      <circle cx="28" cy="29" r="1.6" fill="#1e293b" />
      <circle cx="36" cy="29" r="1.6" fill="#1e293b" />
      {/* Ikat kepala emas */}
      <rect x="22" y="21" width="20" height="2.6" rx="1.3" fill="#facc15" />
    </svg>
  );
}

function BarBesar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
        <span style={{ color: "#e2f5ff", fontWeight: 700 }}>{label}</span>
        <b>{Math.round(value)}</b>
      </div>
      <div className="ne-bar" style={{ height: 10, border: "1px solid #334155" }}>
        <div style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function KartuProfil({ warga, onBatal }: { warga: J; onBatal: () => void }) {
  const [pikiranGemini, setPikiranGemini] = useState<string | null>(null);
  const [loadingGemini, setLoadingGemini] = useState(false);

  const mintaPikiranGemini = async () => {
    setLoadingGemini(true);
    try {
      const res = await fetch("/api/gemini/pikir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: warga.nama,
          peran: warga.peran,
          status_teks: warga.status_teks,
          aksi_sekarang: warga.aksi_sekarang,
          lapar: warga.lapar,
          stamina: warga.stamina,
          sifat: warga.sifat,
          bakat: warga.bakat,
        }),
      });
      const data = await res.json();
      if (data.ok && data.pikiran) {
        setPikiranGemini(data.pikiran);
      }
    } catch {}
    finally {
      setLoadingGemini(false);
    }
  };

  useEffect(() => {
    setPikiranGemini(null);
    mintaPikiranGemini();
  }, [warga.id, warga.nama]);
  const peran = String(warga.peran ?? "-");
  const meta = ROLE_META[peran] ?? { label: peran, color: "#6b7280" };
  const stat = warga.stat ?? {};
  const perkakas: J[] = Array.isArray(warga.perkakas) ? warga.perkakas : [];
  const hunian = warga.hunian as J | null;
  return (
    <div className="follow-card">
      <div style={{ height: 5, background: meta.color, borderRadius: "12px 12px 0 0" }} />
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Potret peran={peran} nomor={String(warga.nomor ?? "0000")} gender={String(warga.gender ?? "")} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>{warga.nama}</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              Warga #{warga.nomor} • {warga.umur ?? "?"} tahun • {warga.tahap_hidup ?? ""}
            </div>
            <div style={{ marginTop: 4 }}>
              <span
                style={{
                  display: "inline-block",
                  background: meta.color,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 999,
                  textShadow: "0 1px 2px #000",
                }}
              >
                {meta.label}
              </span>
            </div>
          </div>
          <button
            className="icon-btn"
            title="Batal kunci"
            onClick={onBatal}
            style={{ width: 36, height: 36, flexShrink: 0 }}
          >
            <NeoIcon name="close" size={20} />
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <Karakter3DPreview warga={warga} />
        </div>

        <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.5 }}>
          <div style={{ fontStyle: "italic", color: "#fde68a" }}>“{warga.status_teks ?? warga.aksi_sekarang ?? ""}”</div>
          {typeof warga.bio === "string" && warga.bio.length > 0 && (
            <div style={{ fontStyle: "italic", color: "#fca5a5", fontWeight: 700 }}>
              😈 “{warga.bio}”
            </div>
          )}
          <div style={{ opacity: 0.85 }}>
            {FASE_LABEL[String(warga.fase_siklus ?? "")] ?? warga.fase_siklus} • {warga.tempat_kerja ?? ""}
            {warga.sedang_berenang ? " • Berenang" : ""}
          </div>
        {/* Kotak Renungan Batin Karakter */}
        <div
          style={{
            marginTop: 8,
            padding: "8px 10px",
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))",
            border: "1px solid #38bdf8",
            borderRadius: 8,
            boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 4 }}>
              🧠 Suara Hati & Renungan Batin
            </span>
            <button
              onClick={mintaPikiranGemini}
              disabled={loadingGemini}
              style={{
                fontSize: 10,
                background: "rgba(56, 189, 248, 0.2)",
                border: "1px solid #38bdf8",
                color: "#e0f2fe",
                padding: "2px 6px",
                borderRadius: 4,
                cursor: loadingGemini ? "wait" : "pointer",
              }}
              title="Dengarkan renungan batin karakter ini lagi"
            >
              {loadingGemini ? "Merenung..." : "🔄 Renung"}
            </button>
          </div>
          <div style={{ fontSize: 11.5, fontStyle: "italic", color: "#f8fafc", lineHeight: 1.4 }}>
            {loadingGemini ? (
              <span style={{ color: "#94a3b8" }}>✨ Sedang merenungkan perjalanan hidup...</span>
            ) : pikiranGemini ? (
              <span>“{pikiranGemini}”</span>
            ) : (
              <span style={{ color: "#94a3b8" }}>Belum ada renungan batin. Ketuk tombol renung untuk mendengarkan bisikan hati.</span>
            )}
          </div>
        </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <BarBesar label="INT" value={Number(stat.int ?? 0)} max={10} color="#22d3ee" />
          <BarBesar label="STR" value={Number(stat.str ?? 0)} max={10} color="#ef4444" />
          <BarBesar label="AGI" value={Number(stat.agi ?? 0)} max={10} color="#22c55e" />
          <BarBesar label="STA" value={Number(stat.sta ?? 0)} max={10} color="#f59e0b" />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <BarBesar label="Stamina" value={Number(warga.stamina ?? 100)} max={100} color={Number(warga.stamina ?? 100) < 30 ? "#ef4444" : "#22d3ee"} />
          <BarBesar label="Lapar" value={Number(warga.lapar ?? 0)} max={100} color="#f59e0b" />
          <BarBesar label="Health Point (HP %)" value={Number(warga.healtpoint ?? warga.sehat ?? 100)} max={100} color={Number(warga.sehat ?? 100) < 60 ? "#ef4444" : "#22c55e"} />
        </div>

        <div style={{ fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
          <div>
            Perkakas:{" "}
            {perkkakasLabel(perkakas) || "—"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <NeoIcon name="home" size={15} />
            <span>Hunian: {hunian ? hunian.label : "Api unggun pusat"}</span>
          </div>
          <div>
            Sifat: {warga.sifat ?? "—"}
          </div>
          <div>
            ⭐ Bakat: <b>{infoBakat(String(warga.bakat ?? "")).nama}</b> — {infoBakat(String(warga.bakat ?? "")).efek}
          </div>
          {warga.interaksi && (
            <div>
              Interaksi: {warga.interaksi.jenis} dengan {warga.interaksi.dengan} — “{warga.interaksi.teks}”
            </div>
          )}
        </div>

        <button
          className="md-btn"
          onClick={onBatal}
          style={{
            marginTop: 10,
            width: "100%",
            padding: "9px 10px",
            fontWeight: 800,
            background: "#facc15",
            color: "#0b1e3a",
            border: "none",
          }}
        >
          Batal kunci — kembali ke peta bebas
        </button>
        <div style={{ fontSize: 11, opacity: 0.7, textAlign: "center", marginTop: 5 }}>
          Kamera mengikuti karakter • Geser = orbit • Cubit/scroll = zoom
        </div>
      </div>
    </div>
  );
}

function perkkakasLabel(perkakas: J[]): string {
  return perkakas
    .map((p) => {
      const nama = LABEL_ALAT[String(p.jenis ?? "")] ?? String(p.jenis ?? "");
      const dmg = typeof p.damage === "number" && p.damage > 0 ? ` • DMG ${p.damage}` : "";
      return `${nama} Lv${p.level ?? 0}${dmg}`;
    })
    .join(", ");
}
