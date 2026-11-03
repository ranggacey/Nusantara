// Ikon MMORPG modern bikinan sendiri (SVG inline, prosedural).
// BUKAN emoji, BUKAN font icon, BUKAN download, BUKAN pixel.
// Dipakai semua tombol: setting, inventori, gacha, peta, bangun, cari,
// kabar, warga, zoom, orientasi, siang/malam, tutup.
"use client";

export type IconName =
  | "gear"
  | "inventory"
  | "dice"
  | "map"
  | "build"
  | "chat"
  | "search"
  | "bell"
  | "users"
  | "close"
  | "zoomIn"
  | "zoomOut"
  | "rotate"
  | "sun"
  | "moon"
  | "home"
  | "suara"
  | "suaraMati";

const STROKE = "#0b1e3a";

function Gear({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3.2" fill="#facc15" stroke={STROKE} strokeWidth="1.4" />
      <circle cx="12" cy="12" r="8.2" fill="#22d3ee" stroke={STROKE} strokeWidth="1.4" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x="10.6" y="0.6" width="2.8" height="3.4" rx="0.8" fill="#22d3ee" stroke={STROKE} strokeWidth="1" transform={`rotate(${i * 45} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="3.2" fill="#facc15" stroke={STROKE} strokeWidth="1.4" />
    </svg>
  );
}

function Generic({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {children}
    </svg>
  );
}

export function NeoIcon({ name, size = 22 }: { name: IconName; size?: number }) {
  switch (name) {
    case "gear":
      return <Gear size={size} />;
    case "inventory":
      return (
        <Generic size={size}>
          <path d="M8 7a4 4 0 0 1 8 0" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
          <rect x="5" y="7" width="14" height="13" rx="3" fill="#b98a5e" stroke={STROKE} strokeWidth="1.4" />
          <rect x="9" y="11" width="6" height="5" rx="1.5" fill="#22d3ee" stroke={STROKE} strokeWidth="1.2" />
          <path d="M5 12h14" stroke={STROKE} strokeWidth="1" opacity="0.4" />
        </Generic>
      );
    case "dice":
      return (
        <Generic size={size}>
          <rect x="3" y="3" width="18" height="18" rx="4" fill="#fdf6e3" stroke={STROKE} strokeWidth="1.6" />
          <circle cx="8.5" cy="8.5" r="1.8" fill="#b91c1c" />
          <circle cx="15.5" cy="8.5" r="1.8" fill="#b91c1c" />
          <circle cx="12" cy="12" r="1.8" fill="#b91c1c" />
          <circle cx="8.5" cy="15.5" r="1.8" fill="#b91c1c" />
          <circle cx="15.5" cy="15.5" r="1.8" fill="#b91c1c" />
        </Generic>
      );
    case "map":
      return (
        <Generic size={size}>
          <path d="M4 5.5 9 3l5 2.5L20 3v14l-5 2.5L10 17 4 19.5v-14Z" fill="#6fae5a" stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M9 3v14M14 5.5V19" stroke={STROKE} strokeWidth="1" opacity="0.5" />
          <path d="M6 9c2-1.5 4 1.5 6 0" stroke="#3f8fd2" strokeWidth="1.6" strokeLinecap="round" />
        </Generic>
      );
    case "build":
      return (
        <Generic size={size}>
          <rect x="2.5" y="3" width="10" height="6" rx="1.5" fill="#9ca3af" stroke={STROKE} strokeWidth="1.4" transform="rotate(-30 7.5 6)" />
          <rect x="10" y="10" width="3.4" height="11" rx="1.4" fill="#8a5a33" stroke={STROKE} strokeWidth="1.2" transform="rotate(-30 11.7 15.5)" />
        </Generic>
      );
    case "chat":
      return (
        <Generic size={size}>
          <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4.5A2 2 0 0 1 4 14V5Z" fill="#22d3ee" stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="8.5" cy="9.5" r="1.3" fill={STROKE} />
          <circle cx="12" cy="9.5" r="1.3" fill={STROKE} />
          <circle cx="15.5" cy="9.5" r="1.3" fill={STROKE} />
        </Generic>
      );
    case "search":
      return (
        <Generic size={size}>
          <circle cx="11" cy="11" r="6.5" fill="#fdf6e3" stroke={STROKE} strokeWidth="1.8" />
          <path d="m16 16 4 4" stroke="#facc15" strokeWidth="2.4" strokeLinecap="round" />
        </Generic>
      );
    case "bell":
      return (
        <Generic size={size}>
          <path d="M12 3a5.5 5.5 0 0 1 5.5 5.5c0 3 1 4.5 1.8 5.5H4.7c.8-1 1.8-2.5 1.8-5.5A5.5 5.5 0 0 1 12 3Z" fill="#facc15" stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="12" cy="18.5" r="1.8" fill="#22d3ee" stroke={STROKE} strokeWidth="1.2" />
        </Generic>
      );
    case "users":
      return (
        <Generic size={size}>
          <circle cx="9" cy="8" r="3.4" fill="#f2c9a0" stroke={STROKE} strokeWidth="1.4" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0Z" fill="#22d3ee" stroke={STROKE} strokeWidth="1.4" />
          <circle cx="17" cy="9" r="2.6" fill="#d9a066" stroke={STROKE} strokeWidth="1.3" />
          <path d="M15 19a4.5 4.5 0 0 1 5.5-4.4" fill="none" stroke={STROKE} strokeWidth="1.3" />
        </Generic>
      );
    case "close":
      return (
        <Generic size={size}>
          <path d="m6 6 12 12M18 6 6 18" stroke="#f87171" strokeWidth="2.6" strokeLinecap="round" />
        </Generic>
      );
    case "zoomIn":
      return (
        <Generic size={size}>
          <circle cx="11" cy="11" r="6.5" fill="#fdf6e3" stroke={STROKE} strokeWidth="1.8" />
          <path d="m16 16 4 4M11 8v6M8 11h6" stroke="#0b1e3a" strokeWidth="1.8" strokeLinecap="round" />
        </Generic>
      );
    case "zoomOut":
      return (
        <Generic size={size}>
          <circle cx="11" cy="11" r="6.5" fill="#fdf6e3" stroke={STROKE} strokeWidth="1.8" />
          <path d="m16 16 4 4M8 11h6" stroke="#0b1e3a" strokeWidth="1.8" strokeLinecap="round" />
        </Generic>
      );
    case "rotate":
      return (
        <Generic size={size}>
          <rect x="7" y="2.5" width="10" height="19" rx="2" fill="#fdf6e3" stroke={STROKE} strokeWidth="1.5" />
          <path d="M17.5 15.5a5.5 5.5 0 1 1-1.6-3.9" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" />
          <path d="m18.5 7.5-1.4 1.6-1.4-1" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </Generic>
      );
    case "sun":
      return (
        <Generic size={size}>
          <circle cx="12" cy="12" r="4.2" fill="#facc15" stroke={STROKE} strokeWidth="1.4" />
          {Array.from({ length: 8 }).map((_, i) => (
            <path key={i} d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4" stroke="#facc15" strokeWidth="1.8" strokeLinecap="round" transform={`rotate(${i * 45} 12 12)`} />
          ))}
        </Generic>
      );
    case "moon":
      return (
        <Generic size={size}>
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" fill="#fde68a" stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" />
        </Generic>
      );
    case "home":
      return (
        <Generic size={size}>
          <path d="M4 11 12 4l8 7" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10v9h12v-9" fill="#b98a5e" stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" />
          <rect x="10" y="14" width="4" height="5" fill="#0b1e3a" />
        </Generic>
      );
    case "suara":
      return (
        <Generic size={size}>
          <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="#22d3ee" stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M16 9a4 4 0 0 1 0 6" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
          <path d="M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="#facc15" strokeWidth="1.6" strokeLinecap="round" />
        </Generic>
      );
    case "suaraMati":
      return (
        <Generic size={size}>
          <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="#9ca3af" stroke={STROKE} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="m16 9 5 6M21 9l-5 6" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
        </Generic>
      );
  }
}
