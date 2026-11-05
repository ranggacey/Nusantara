// Identitas build aplikasi (RONDE 8 — penjaga versi).
// NAIKKAN string ini di SETIAP rilis (r9, r10, ...) — client membandingkan
// nilai baked-in ini dengan /api/version dari deployment yang sedang live;
// bila berbeda, client menampilkan pil "Versi baru — ketuk untuk muat
// ulang" (bukan auto-reload, supaya tidak mengganggu tontonan user).
// Bila lupa menaikkan, pill tidak akan muncul untuk rilis itu — jadi ini
// bagian dari checklist rilis, bukan hiasan.
// Latar: laporan ronde 8 ("malah loop") ternyata direkam di tab yang
// masih menjalankan bundle RONDE 5 (bukti: tidak ada tombol ＋ Tambah
// karakter + hint tanpa baris tombol ＋) — sawtooth snap-8 yang sudah
// diperbaiki ronde 6. Tanpa penjaga versi, setiap deploy berikutnya
// berisiko dilaporkan ulang sebagai bug baru oleh tab lama.
export const BUILD_ID = "r45";
