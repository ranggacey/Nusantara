// GET /api/credits — kredit zaman batu.
import { jsonOk } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return jsonOk({
    judul: "Negara Emas — Zaman Batu",
    era: "Prasejarah Nusantara",
    aset: "Semua sprite zaman batu (gubuk, tenda kulit, api unggun, lumbung, bengkel batu, pondok tabib, pohon, semak beri, padang buruan, singkapan batu, urat emas, urat besi) dibuat prosedural dari 0 untuk game ini. Bukan unduhan, bukan rip, tidak mirip TheoTown.",
    figur: "Figur warga digambar prosedural 12px dari kode (palet kulit/tanah).",
    ikon: "Ikon UI (gear, cuaca, tombol) dipertahankan dari era sebelumnya — itu chrome UI, bukan aset game.",
    dialog: "Dialog scripted ditulis dari 0 per peran; obrolan LLM memakai Gemini free tier dengan rotasi key dan filter larangan era.",
    tambahan:
      "Ronde 4: 7 bangunan prosedural baru (gubuk besar, tenda besar, balai musyawarah, dapur umum, menara jaga, sumur batu, gapura) + 8 peran baru dengan perkakas 3D prosedural (jala, cangkul, pahat, tongkat jalan, tali panjat, alat tenun, jerat) + animasi hewan prosedural (kaki diagonal, merumput, ekor, napas). Model hewan 3D unduhan (CC0/CC-BY) belum masuk: unduhan gratis itch.io memerlukan checkout interaktif yang tidak bisa diselesaikan tanpa browser, dan paket berbayar tidak dibeli tanpa persetujuan — model prosedural tetap dipakai sampai unduhan tersedia.",
  });
}
