"use client";

import React, { useState } from "react";

interface Tokoh {
  id: string;
  nama: string;
  peran: string;
  gelar: string;
  keunggulan: string;
  stat: { int: number; str: number; agi: number; sta: number };
}

interface DialogTurn {
  pembicara: string;
  peran: string;
  gelar: string;
  teks: string;
}

interface HasilMusyawarah {
  id: string;
  bulan: number;
  hari: number;
  tema: string;
  tokoh: Tokoh[];
  dialog: DialogTurn[];
  kesimpulan: {
    bangunan_id: string;
    bangunan_nama: string;
    alasan: string;
  };
  dibuat_pada: string;
  sumber: "gemini" | "fallback";
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  musyawarahData: HasilMusyawarah | null;
  onRefresh: () => Promise<void>;
}

export function MusyawarahModal({ isOpen, onClose, musyawarahData, onRefresh }: Props) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGelarMusyawarah = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/musyawarah", { method: "POST" });
      if (res.ok) {
        await onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const tokohList = musyawarahData?.tokoh ?? [];
  const dialogList = musyawarahData?.dialog ?? [];
  const kesimpulan = musyawarahData?.kesimpulan;

  const badgeIcon = (gelar: string) => {
    if (gelar.includes("Pintar")) return "🎓";
    if (gelar.includes("Kuat")) return "⚔️";
    if (gelar.includes("Tangkas")) return "⚡";
    return "👑";
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
          border: "2px solid #f59e0b",
          borderRadius: 16,
          width: "100%",
          maxWidth: 720,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0,0,0,0.8), 0 0 25px rgba(245, 158, 11, 0.2)",
          color: "#f8fafc",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(245, 158, 11, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(245, 158, 11, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26 }}>📜</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fef3c7" }}>
                Musyawarah Bulanan Pemimpin Kampung
              </h2>
              <div style={{ fontSize: 12, color: "#fbbf24" }}>
                {musyawarahData?.tema || `Bulan ke-${musyawarahData?.bulan ?? 1} • Diskusi Tokoh Terhebat Kampung`}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: 22,
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* 4 Champions */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              🏛️ 4 Tokoh Terhebat yang Bermusyawarah
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
              {tokohList.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: "rgba(30, 41, 59, 0.8)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    borderRadius: 10,
                    padding: "8px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{badgeIcon(t.gelar)}</span>
                    <b style={{ fontSize: 13, color: "#fef08a" }}>{t.nama}</b>
                  </div>
                  <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 500 }}>{t.gelar}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{t.keunggulan}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dialog Transcript */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              💬 Jalannya Musyawarah & Debat
            </div>
            <div
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                borderRadius: 12,
                border: "1px solid rgba(148, 163, 184, 0.15)",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                maxHeight: 240,
                overflowY: "auto",
              }}
            >
              {dialogList.length === 0 ? (
                <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: 12 }}>
                  Belum ada catatan musyawarah. Klik tombol di bawah untuk menggelar musyawarah pertama!
                </div>
              ) : (
                dialogList.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      background: i % 2 === 0 ? "rgba(30, 41, 59, 0.5)" : "rgba(30, 41, 59, 0.25)",
                      padding: "8px 10px",
                      borderRadius: 8,
                      borderLeft: `3px solid ${i % 2 === 0 ? "#f59e0b" : "#38bdf8"}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                      <b style={{ color: "#fef08a" }}>{d.pembicara}</b>
                      <span style={{ color: "#94a3b8", fontSize: 11 }}>({d.gelar})</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.4 }}>
                      “{d.teks}”
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Kesimpulan & Keputusan Bangunan */}
          {kesimpulan && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)",
                border: "2px solid #f59e0b",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>🤝</span>
                <b style={{ fontSize: 14, color: "#fbbf24" }}>Hasil Kesepakatan Musyawarah:</b>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff" }}>
                Bangun: {kesimpulan.bangunan_nama}
              </div>
              <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
                {kesimpulan.alasan}
              </div>
              <div style={{ fontSize: 11, color: "#4ade80", marginTop: 4 }}>
                ✓ Telah disetujui bersama dan dijadwalkan dalam antrean gotong royong warga!
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(15, 23, 42, 0.6)",
          }}
        >
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Hikmah Musyawarah: <b style={{ color: "#38bdf8" }}>{musyawarahData?.sumber === "gemini" ? "Tetua Adat Kampung 🧠" : "Musyawarah Kampung"}</b>
          </div>
          <button
            onClick={handleGelarMusyawarah}
            disabled={loading}
            style={{
              background: loading ? "#475569" : "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
              border: "1px solid #f59e0b",
              borderRadius: 8,
              padding: "8px 16px",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(217, 119, 6, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {loading ? "⏳ Mengumpulkan Para Tokoh..." : "⚡ Gelar Musyawarah Adat Baru"}
          </button>
        </div>
      </div>
    </div>
  );
}
