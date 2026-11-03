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

Sumber: Cradle of Mankind (kampung "meminta" hal baru di ambang
populasi) + Hearthbound (daily goals pemandu). Masalah: setelah
kampung stabil, pemain tidak tahu target berikutnya. Cara kerja:
panel ringan "Kampung menginginkan" yang menampilkan 1-2 kebutuhan
berikutnya dari tangga DESAIN-EKONOMI.md (mis. "populasi 12 +
satu bengkel -> Balai"). Jembatan menuju kunci tingkat: panelnya
dulu, kuncinya belakangan. Dampak sedang-tinggi, usaha sedang.
Tidak direkomendasikan dari riset ini: voice chat/trading antar
pemain dan combat gua real-time (terlalu berat / mengubah genre).

## Ide-ide berikutnya

Diisi dari riset web tiap run cron (fitur baru yang fresh,
optimalisasi, dan lain-lain). Tiap ide ditulis dengan: masalah
pemain, cara kerja singkat, dan perkiraan dampak vs usaha.
