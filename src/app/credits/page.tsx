// Halaman Kredit zaman batu (server component, fetch dari API sendiri).
async function getCredits() {
  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const r = await fetch(`${base}/api/credits`, { cache: "no-store" });
    return await r.json();
  } catch {
    return null;
  }
}

export default async function CreditsPage() {
  const data = await getCredits();
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <a href="/" style={{ color: "#22d3ee" }}>
        &larr; Kembali ke kampung
      </a>
      <h1 className="font-pixel" style={{ fontSize: 16 }}>
        {data?.judul ?? "Negara Emas — Zaman Batu"}
      </h1>
      <div className="px-panel" style={{ padding: 14, lineHeight: 1.6, fontSize: 13 }}>
        <p>Era: {data?.era ?? "Prasejarah Nusantara"}</p>
        <p>{data?.aset ?? ""}</p>
        <p>{data?.figur ?? ""}</p>
        <p>{data?.ikon ?? ""}</p>
        <p>{data?.dialog ?? ""}</p>
        {data?.tambahan && <p>{data.tambahan}</p>}
      </div>
    </main>
  );
}
