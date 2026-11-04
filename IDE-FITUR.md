# Ide Fitur Nusantara (backlog)

Dibaca cron tiap run, bersama DESAIN-EKONOMI.md dan brief riset
terbaru di `research/`. Ide yang sudah dibangun dicoret dari sini
dan dicatat di CHANGELOG.md, jangan dibangun dua kali.

## Ide 1 — Bangunan bisa dipencet, buka halaman baru (dari user, 2026-11-03 23:19 WIB)

Contoh: restoran (paviliun makan / dapur umum) bisa dipencet dari
peta, lalu masuk ke halaman baru khusus bangunan itu.

- Halaman restoran menampilkan: hidangan yang tersedia, stok pangan
  yang bisa dimasak, siapa juru masaknya, dan tombol masak (kalau
  memang boleh interaksi, bukan sekadar lihat).
- Pola yang sama berlaku untuk bangunan lain kalau sudah terbukti
  enak: lumbung (isi stok), bengkel (perkakas), balai (musyawarah).
- Syarat: tetap ringan di HP (halaman baru = rute ringan, bukan
  kanvas 3D kedua), dan tidak mengubah data live di luar aturan
  game yang sudah ada.

## Ide 2 — Halaman restoran yang bisa dijelajahi + lampu (dari user, 2026-11-03 23:21 WIB)

Halaman baru restoran (paviliun makan / dapur umum) dibuat lebih
besar dan bisa dijelajahi, bukan sekadar panel kecil — supaya
eksplorasinya lebih bagus.

- Di dalam halaman restoran: kasih lampu hangat temaram ala
  lentera, supaya tidak gelap (user menyebutnya "lampu kayak
  murim-murim" — ditangkap sebagai lampu hangat temaram;
  koreksi kalau maksudnya lain).
- Di peta, sekitar restoran juga dikasih lampu (titik cahaya
  di sekeliling bangunan).
- Syarat: tetap ringan di HP (cahaya = sprite/emissive murah,
  bukan lampu dinamis per bangunan yang bikin ngelag).

## Ide 3 — Gemini jadi "tukang mikir": penempatan bangunan + jalan (dari user, 2026-11-03 23:21 WIB)

Pakai Gemini API key untuk dua hal:

- Penempatan bangunan yang bagus: Gemini menyarankan posisi
  bangunan baru (dekat apa, tidak menutup jalan, sesuai fungsi),
  lalu saran itu dicek kode (tidak menabrak bangunan lain, tidak
  di air, masih dalam grid) sebelum dipakai.
- Jalan yang bagus: Gemini membuat jalur jalan antar bangunan
  yang enak dilihat dan nyambung, dicek kode dengan pathfinding
  sederhana (BFS) sebagai validasi.
- Kalau key tidak ada atau Gemini gagal, SELALU ada fallback
  scripted (saran dari aturan biasa + BFS) — game tidak boleh
  macet hanya karena LLM tidak menjawab. Key tidak pernah dibaca
  atau ditulis di chat/repo; hanya dipakai lewat env Vercel.

## Ide 4 — Prinsip UX: gampang, bagus, enak (dari user, 2026-11-03 23:22 WIB)

Semua kerja cron juga dinilai dari sini: UI/UX harus gampang
dipahami, bagus dilihat, dan enak dipakai user — bukan sekadar
fitur jalan. Kalau satu perbaikan bikin tampilan lebih ribet,
itu bukan perbaikan.

## Ide 5 — Penanda warga tanpa pos + kabar ringkas (dari riset 2026-11-04 00:29 WIB, sudut sosial/QoL)

Sumber: devlog Cradle of Mankind ("no post, no work" + gossip feed)
dan ulasan Animal Valley (pemain minta sinyal "semua pekerja
menganggur"). Masalah: warga diam terlihat sama saja, entah stok
penuh, menunggu tick, atau tanpa pos kerja — pemain tidak tahu
harus memperbaiki apa. Cara kerja: display-only, ikon kecil di
atas warga yang status sim-nya menganggur tanpa pos + satu baris
ringkas di kabar kampung ("3 warga belum punya pos kerja"). Tidak
mengubah sim. Dampak tinggi, usaha kecil. Detail di
research/2026-11-04-0029.md.

## Ide 6 — Papan kebutuhan kampung (dari riset 2026-11-04 00:29 WIB)
~~DIBANGUN 2026-11-04 02:29 WIB~~ — panel "🎯 Kampung menginginkan" di
kartu menu (display-only, fungsi murni `kebutuhanKampungBerikutnya`
di `sumberdaya.ts` + 15 tes): menampilkan 1 tingkat berikutnya dari
tangga DESAIN-EKONOMI.md beserta yang masih kurang. Belum mengunci
bangunan apa pun; kunci tingkat tetap pekerjaan terpisah.

Sumber: Cradle of Mankind (kampung "meminta" hal baru di ambang
populasi) + Hearthbound (daily goals pemandu). Masalah: setelah
kampung stabil, pemain tidak tahu target berikutnya. Cara kerja:
panel ringan "Kampung menginginkan" yang menampilkan 1-2 kebutuhan
berikutnya dari tangga DESAIN-EKONOMI.md (mis. "populasi 12 +
satu bengkel -> Balai"). Jembatan menuju kunci tingkat: panelnya
dulu, kuncinya belakangan. Dampak sedang-tinggi, usaha sedang.
Tidak direkomendasikan dari riset ini: voice chat/trading antar
pemain dan combat gua real-time (terlalu berat / mengubah genre).

## Ide 7 — Layar muat jujur + tunda chunk 3D (dari riset 2026-11-04 02:29 WIB, sudut performa)

Sumber: Mobitoss (muat hanya layar pertama + progres bergerak,
bukan layar kosong) + Playgama (cap DPR, kurangi draw call).
Masalah: muat pertama pernah 60-90 detik ("Memuat Peta 3D..."),
terasa macet. Cara kerja: progres bertahap yang jujur (data dunia
-> peta -> karakter) + pisahkan chunk 3D dari paket awal supaya
halaman ringan tampil dulu. Dampak sedang-tinggi, usaha sedang
(perlu uji ukuran chunk build).

## Ide 8 — Cap DPR kanvas di HP + culling luar viewport (dari riset 2026-11-04 02:29 WIB, sudut performa)

Sumber: Playgama (batasi DPR ke 1-2) + ulasan Idle City Builder
(pemain minta sembunyikan bagian peta yang tak terlihat).
Masalah: HP menengah ngelag saat desa ramai. Cara kerja: batasi
pixel ratio renderer di HP, lewati render objek di luar viewport.
Dampak sedang, usaha kecil-sedang (culling butuh uji visual tepi
layar).

## Ide 9 — Jeda loop render saat tab disembunyikan (dari riset 2026-11-04 02:29 WIB, sudut performa)

Sumber: Mobitoss (Page Visibility API). Masalah: baterai terkuras
saat tab ditinggal terbuka. Cara kerja: hentikan requestAnimationFrame
saat hidden, lanjutkan saat kembali. Dampak kecil-sedang, usaha kecil.

## Ide 10 — Festival kampung berkala (dari riset 2026-11-04 04:29 WIB, sudut fitur baru)

Sumber: Hazel's Cauldron (festival tiap tanggal 28 + persiapan
seminggu sebelumnya bikin festival lebih besar), Starsand Island
(Autumn Pumpkin Carnival: cerita + aktivitas + hadiah musiman).
Masalah: setelah kampung stabil, hari-hari game terasa sama; tidak
ada momen yang ditunggu bersama. Cara kerja: tiap N hari game
(mis. 30), Pesta Panen di balai/paviliun — kabar mengumumkan H-7,
warga berkumpul/makan bersama di hari H, hiasan musiman di sekitar
balai. Mulai versi display-only (pengumuman + kumpul visual),
tanpa ekonomi baru. Dampak tinggi, usaha sedang. Tidak
direkomendasikan dari riset ini: multiplayer dan combat dungeon
(mengubah arsitektur/genre).

## Ide 11 — Jejak kebersamaan warga (dari riset 2026-11-04 04:29 WIB, sudut fitur baru)

Sumber: Hazel's Cauldron (hati persahabatan 0-5 + cerita terbuka),
Everdream Village (ikatan warga -> mereka ikut membantu kerja).
Masalah: obrolan warga sudah ada di sim tapi tidak meninggalkan
jejak — pemain tidak tahu siapa dekat dengan siapa. Cara kerja:
dari data sim yang sudah ada, tampilkan satu baris di kabar
("Duo paling kompak: X & Y") + ikon hati kecil di atas pasangan
itu saat berdekatan. Display-only. Dampak sedang, usaha
kecil-sedang.

## Ide 12 — Satu aksi pertama "Mulai dari sini" di kartu menu (dari riset 2026-11-04 06:29 WIB, sudut UX)

Sumber: Morphic Studio (tutorial sepotong kecil saat relevan) +
DEV Community (satu aksi pertama yang bermakna). Masalah: pemain
baru membuka menu ☰ dan melihat 10 tombol sekaligus tanpa tahu
mana yang pertama; panel "Kampung menginginkan" memberi target
tapi belum memberi langkah yang bisa diketuk. Cara kerja: satu
baris sorotan di atas daftar tombol menu yang menunjuk ke SATU
tombol berikutnya (mis. "Mulai: Tata Kota — bangun Gubuk
pertama") dari fungsi kebutuhanKampungBerikutnya yang sudah ada;
display-only, hilang saat tingkat selesai. Dampak sedang-tinggi,
usaha kecil.

## Ide 13 — Tombol menu utama ke jangkauan jempol (dari riset 2026-11-04 06:29 WIB, sudut UX)

Sumber: Wandr (aksi utama di setengah bawah layar, dekat jempol;
pojok atas jauh butuh geser genggaman). Masalah: tombol ☰ di
pojok atas paling sulit dijangkau satu tangan padahal menu itu
paling sering dipakai. Cara kerja: pertimbangkan pindah tombol
menu utama ke bawah-kanan dekat "Tambah karakter" dengan jarak
antar target sentuh yang cukup — BUKAN duplikasi (tombol ganda
pernah jadi keluhan). Dampak sedang, usaha sedang; JANGAN dipindah
sebelum uji visual HP (risiko tumpang tindih tombol bawah).

## Ide 14 — Tip kontekstual singkat yang bisa ditutup (dari riset 2026-11-04 06:29 WIB, sudut UX)

Sumber: DEV Community (panduan kontekstual di dekat kontrol asing,
bisa ditutup, bisa dibuka lagi). Masalah: 10 tombol menu sudah
punya penjelasan satu baris, tapi pemain baru tetap tidak tahu
urutan mainnya (kumpul -> bangun -> musyawarah). Cara kerja: satu
baris tip di kartu menu ("Kumpul dulu — warga bekerja sendiri,
lalu bangun lewat Tata Kota") dengan tombol ✕ yang menyimpan
pilihan di localStorage, bisa dibuka lagi dari
Pengaturan/Orientasi. Display-only, tanpa ubah sim. Dampak sedang,
usaha kecil. Tidak direkomendasikan dari riset ini: tur
interaktif multi-langkah (rapuh di kanvas 3D, belum ada bukti
pemain tersesat di langkah spesifik) dan memperkecil teks HUD
(melawan aturan keterbacaan HP).

## Ide-ide berikutnya

Diisi dari riset web tiap run cron (fitur baru yang fresh,
optimalisasi, dan lain-lain). Tiap ide ditulis dengan: masalah
pemain, cara kerja singkat, dan perkiraan dampak vs usaha.
