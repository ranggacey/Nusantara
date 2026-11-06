"use client";
import Karakter3DPreview from "@/components/Karakter3DPreview";
// Tombol kanan-bawah "Tambah karakter" (ronde 7, keputusan user 2 Nov 2026
// 21:40 yang membalik ronde 2): nambah warga ke dunia SHARED — terlihat di
// semua HP, tanpa restart, tanpa reset.
// Alur TANPA tutorial 8 langkah (tombol ini untuk nambah, bukan onboarding):
// nama + gender -> roll gacha (4 stat + role-fit) -> konfirmasi -> gabung.
// Profil server tetap dipakai (gacha route butuh profil_id): client memakai
// profil pertama milik IP ini bila ada, bila belum ada dibuatkan profil
// default "Pengunjung" — user tidak pernah diminta nama profil.
// Peta refresh tiap 3 detik (poll page), jadi warga baru muncul sendiri
// beberapa detik setelah konfirmasi — tanpa reload halaman.
import { useState } from "react";
import { peranById, LABEL_ALAT } from "@/lib/batu/peran";
import { infoBakat } from "@/lib/batu/bakat";
import { gayaTombolGender } from "@/lib/batu/tampil";

// Mini potret SVG (RONDE 9 — preview creation): rambut ikut gender —
// laki = pendek (topi rambut saja), perempuan = panjang (panel samping
// + belakang). Sama dengan aturan rambut semua warga di Map3D.
function PotretMini({ gender }: { gender: "laki" | "perempuan" }) {
  const panjang = gender === "perempuan";
  return (
    <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#0b1e3a" stroke="#facc15" strokeWidth="2.5" />
      <path d="M14 54 Q32 34 50 54 L50 60 L14 60 Z" fill="#475569" />
      <circle cx="32" cy="28" r="11" fill="#d9a066" />
      <path d="M21 28 Q21 15 32 15 Q43 15 43 28 Q38 20 32 20 Q26 20 21 28 Z" fill="#2b2118" />
      {panjang && (<>
        <rect x="20" y="26" width="5" height="22" rx="2" fill="#2b2118" />
        <rect x="39" y="26" width="5" height="22" rx="2" fill="#2b2118" />
        <rect x="22" y="30" width="20" height="18" rx="4" fill="#2b2118" opacity="0.9" />
      </>)}
      <circle cx="28" cy="29" r="1.6" fill="#1e293b" />
      <circle cx="36" cy="29" r="1.6" fill="#1e293b" />
      <rect x="22" y="21" width="20" height="2.6" rx="1.3" fill="#facc15" />
    </svg>
  );
}

type J = Record<string, any>;

async function jget(url: string): Promise<J> {
  const r = await fetch(url);
  return r.json();
}

async function jpost(url: string, body: unknown): Promise<J> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ fontSize: 12, marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        <b>{value}</b>
      </div>
      <div className="ne-bar">
        <div style={{ width: `${Math.min(100, Math.max(0, value * 10))}%`, background: "#facc15" }} />
      </div>
    </div>
  );
}

// Penanda populasi (2026-11-07, Ide 58): `tandaPopulasi` = true bila
// populasi sedang jadi penghambat tingkat berikutnya (satu-satunya
// kekurangan yang bisa diatasi pemain langsung) DAN titik tonggak
// (Ide 56) sedang tidak tampil — Aturan Satu Penanda. Titiknya
// berdenyut terbatas lalu diam (CSS), hilang sendiri begitu populasi
// mencapai angka yang dibutuhkan; tanpa ubah sim, tanpa bunyi.
export default function TambahKarakter({ tandaPopulasi = false }: { tandaPopulasi?: boolean }) {
  const [buka, setBuka] = useState(false);
  const [step, setStep] = useState<"form" | "roll" | "done">("form");
  const [nama, setNama] = useState("");
  const [gender, setGender] = useState<"laki" | "perempuan">("laki");
  const [profilId, setProfilId] = useState<string | null>(null);
  const [roll, setRoll] = useState<J | null>(null);
  const [created, setCreated] = useState<J | null>(null);
  const [error, setError] = useState("");
  const [sibuk, setSibuk] = useState(false);

  function tutup() {
    setBuka(false);
    setError("");
  }

  function mulaiUlang() {
    setStep("form");
    setRoll(null);
    setCreated(null);
    setError("");
  }

  async function pastikanProfil(): Promise<string> {
    if (profilId) return profilId;
    const g = await jget("/api/profil");
    const pertama = g?.profils?.[0]?.id;
    if (typeof pertama === "string" && pertama) {
      setProfilId(pertama);
      return pertama;
    }
    const c = await jpost("/api/profil", { nama_profil: "Pengunjung" });
    if (!c?.ok || !c?.profil?.id) throw new Error(c?.error ?? "Gagal menyiapkan profil.");
    setProfilId(String(c.profil.id));
    return String(c.profil.id);
  }

  async function doRoll() {
    setError("");
    setSibuk(true);
    try {
      const pid = await pastikanProfil();
      const r = await jpost("/api/gacha", { action: "roll", profil_id: pid });
      if (!r?.ok || !r?.roll) throw new Error(r?.error ?? "Gagal roll gacha.");
      setRoll(r.roll);
      setStep("roll");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal roll gacha.");
    } finally {
      setSibuk(false);
    }
  }

  async function doConfirm() {
    if (!profilId) return;
    setError("");
    setSibuk(true);
    try {
      const r = await jpost("/api/gacha", { action: "confirm", profil_id: profilId, nama: nama.trim(), gender });
      if (!r?.ok || !r?.warga) {
        // Roll kedaluwarsa (409): pending sudah dibersihkan server — roll ulang.
        if (r?.error && String(r.error).includes("kedaluwarsa")) {
          setRoll(null);
          setStep("form");
        }
        throw new Error(r?.error ?? "Gagal membuat karakter.");
      }
      setCreated(r.warga);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat karakter.");
    } finally {
      setSibuk(false);
    }
  }

  const peran = roll ? peranById(String(roll.peran)) : null;

  return (
    <>
      <button className="tk-fab" title={tandaPopulasi ? "Tambah karakter — kampung masih kurang warga!" : "Tambah karakter"} aria-label={tandaPopulasi ? "Tambah karakter, kampung masih kurang warga" : "Tambah karakter"} onClick={() => setBuka(true)}>
        ＋ Tambah karakter
        {/* Penanda populasi (2026-11-07, Ide 58): titik merah kecil di
            sudut tombol saat populasi jadi penghambat — denyut terbatas
            (CSS, 3x lalu diam), titik statis di bawah reduced-motion.
            aria-hidden: sinyalnya ada di aria-label. */}
        {tandaPopulasi && <span className="tk-fab-dot" aria-hidden="true" />}
      </button>

      {buka && (
        <div className="tk-overlay" onClick={tutup}>
          <div className="tk-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h2 className="md-title" style={{ fontSize: 14, margin: 0 }}>
                Tambah karakter
              </h2>
              <button className="icon-btn" title="Tutup" style={{ width: 32, height: 32 }} onClick={tutup}>
                ✕
              </button>
            </div>
            <p style={{ fontSize: 11, opacity: 0.75, marginTop: 0 }}>
              Warga baru bergabung ke kampung bersama — terlihat di semua HP, tanpa restart. Peran dipilih gacha sesuai stat
              (role-fit: syarat yang jauh di bawah stat tidak mungkin muncul).
            </p>

            {error && (
              <p style={{ fontSize: 12, color: "#fca5a5", marginTop: 0 }}>{error}</p>
            )}

            {step === "form" && (
              <div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>Nama karakter (2–24 huruf)</div>
                <input
                  className="tk-input"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="cth: Raka"
                  maxLength={24}
                />
                <div style={{ fontSize: 12, marginBottom: 4 }}>Gender</div>
                {/* RONDE 9 — perbaikan bug "tombol male/female kek gabisa
                    dipencet": gaya lama (borderColor saja) TIDAK KELIHATAN
                    karena .md-btn punya border:none + fontWeight 700->800
                    nyaris tak kentara. Sekarang: terpilih = emas penuh +
                    border NYATA, tak terpilih = gelap + border abu — beda
                    jelas di HP + label "Gender terpilih" + tap target
                    besar + touch-action manipulation. */}
                <div style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "center" }}>
                  <PotretMini gender={gender} />
                  {(["laki", "perempuan"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      className="md-btn"
                      aria-pressed={gender === g}
                      onClick={() => setGender(g)}
                      style={{
                        ...gayaTombolGender(gender === g),
                        padding: "12px 20px",
                        fontSize: 14,
                        touchAction: "manipulation",
                      }}
                    >
                      {g === "laki" ? "Laki-laki" : "Perempuan"}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, marginBottom: 12, color: "#fde68a" }}>
                  Gender terpilih: <b>{gender === "laki" ? "Laki-laki (rambut pendek)" : "Perempuan (rambut panjang)"}</b>
                </div>
                <button className="md-btn" disabled={sibuk || nama.trim().length < 2} onClick={doRoll} style={{ padding: "10px 16px", fontWeight: 800 }}>
                  {sibuk ? "Mengocok…" : "Roll gacha"}
                </button>
              </div>
            )}

            {step === "roll" && roll && (
              <div>
                <div style={{ marginBottom: 10 }}>
                  <Karakter3DPreview warga={{ peran: roll.peran, nomor: "0000", gender, nama: nama.trim() }} />
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                  <PotretMini gender={gender} />
                  <div>
                    <div style={{ fontSize: 13 }}>
                      <b>{nama.trim()}</b> — {roll.label_peran}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>
                      {gender === "laki" ? "Laki-laki • rambut pendek" : "Perempuan • rambut panjang"} • Umur {roll.umur} • Sifat {roll.sifat}
                    </div>
                  </div>
                </div>
                {/* RONDE 9 — BAKAT DITONJOLKAN (dulu kecil di baris
                    "Sifat X • Bakat Y"): kotak emas besar — nama bakat +
                    APA EFEKNYA di game (efeknya NYATA di sim, bukan
                    pajangan: lihat src/lib/batu/bakat.ts). */}
                <div
                  style={{
                    border: "2px solid #facc15",
                    borderRadius: 10,
                    padding: "10px 12px",
                    marginBottom: 10,
                    background: "rgba(250, 204, 21, 0.12)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#facc15" }}>
                    ⭐ Bakat: {infoBakat(String(roll.bakat ?? "")).nama}
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.5, marginTop: 2 }}>
                    {infoBakat(String(roll.bakat ?? "")).efek}
                  </div>
                </div>
                <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 8 }}>
                  {peran?.deskripsi ?? ""}
                  {peran ? ` • Perkakas ${LABEL_ALAT[peran.alat] ?? peran.alat}` : ""}
                </div>
                <StatBar label="INT" value={Number(roll.stat?.int ?? 0)} />
                <StatBar label="STR" value={Number(roll.stat?.str ?? 0)} />
                <StatBar label="AGI" value={Number(roll.stat?.agi ?? 0)} />
                <StatBar label="STA" value={Number(roll.stat?.sta ?? 0)} />
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="md-btn" disabled={sibuk} onClick={doRoll} style={{ padding: "10px 14px" }}>
                    Roll ulang
                  </button>
                  <button
                    className="md-btn"
                    disabled={sibuk}
                    onClick={doConfirm}
                    style={{ padding: "10px 16px", fontWeight: 800, background: "#facc15", color: "#0b1e3a", border: "none" }}
                  >
                    {sibuk ? "Menggabungkan…" : "Gabung ke kampung"}
                  </button>
                </div>
              </div>
            )}

            {step === "done" && created && (
              <div>
                <p style={{ fontSize: 13 }}>
                  <b>{created.nama}</b> ({created.nomor}) bergabung sebagai{" "}
                  <b>{peranById(String(created.peran))?.label ?? created.peran}</b>!
                </p>
                <p style={{ fontSize: 11, opacity: 0.8 }}>
                  Warga baru muncul di peta dalam beberapa detik (peta refresh tiap 3 detik) — ketuk karakternya untuk melihat
                  profil lengkap.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="md-btn" onClick={tutup} style={{ padding: "10px 16px", fontWeight: 800 }}>
                    Tutup
                  </button>
                  <button className="md-btn" onClick={mulaiUlang} style={{ padding: "10px 14px" }}>
                    Tambah lagi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
