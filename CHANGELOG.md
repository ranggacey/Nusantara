# CHANGELOG Nusantara

## 2026-11-03 malam — Aturan kumpul susah + restoran lebih besar + Gemini tukang mikir

Perintah user 23:21-23:37 WIB: halaman restoran dibesarkan, lampu
temaram, Gemini jadi tukang mikir penempatan + jalan, stok dibuat
susah (cap harian + gudang tidak boleh meluber), warga tidak boleh
diam saja saat stok penuh. Hapus rumah (sisakan 1 rumah + 1 gudang)
dikerjakan user manual, bukan asisten.

### Ekonomi: kumpul dibuat susah (src/lib/batu/sim.ts)
- Roll hasil kumpul baru `rollHasilKumpul`: pangan/kayu/batu/kulit
  1-3 (50/30/20), besi/emas langka 0-2 (besi biasa 55/35/10,
  berbakat 40/45/15; emas 45/40/15). Bonus STR/perkakas/bakat
  lama yang MENAMBAH jumlah dihapus — keunggulan kini hanya
  menggeser peluang di dalam cap.
- Cap harian per warga per hari game: 3 untuk pangan/kayu/batu/
  kulit, 2 untuk besi/emas (`sisaCapHarian`, `catatKumpulHarian`,
  field baru `kumpul_hari`/`kumpul_harian` di Warga).
- SEMUA jalur penambah stok kini lewat `tambahStokClamp`
  (clamp kapasitas gudang): pengiriman node, bonus kulit,
  bonus buah pemanjat, dan pengiriman buruan (dulu tanpa clamp —
  ini biang stok meluber). Jalur kurang (makan, masak, crafting)
  tidak berubah.
- Stok penuh tidak lagi berarti diam: `terapkanRehatStokPenuh`
  kini mencoba bantu warga lain dulu, lalu jalan santai, dan
  rehat murni hanya jalan terakhir.
- Tes: 25 tes baru (distribusi roll, cap harian, clamp, alihan
  stok penuh, jalurSegmen) — semua lolos. Tes lama r10
  (buruan rusa +6) disesuaikan ke +3 sesuai cap harian.
  Catatan jujur: total tes 7627 lolos / 657 gagal — 657 gagal
  itu SUDAH merah di baseline sebelum perubahan ini (ekspektasi
  lama r11/r14/r15/r18 yang drift dari kode salinan), nol
  regresi baru dari perubahan ini.

### Restoran lebih besar + lampu
- `RestoranInterior3D`: lantai 24x20 -> 36x28, dinding ikut
  melebar, tiang samping pindah ke x=±17, balok atap memanjang,
  2 meja bundar baru di sayap kiri/kanan, 3 lentera tambahan
  (sayap kiri, sayap kanan, dinding belakang), kamera mundur
  (0,13,26) dan maxDistance 30 -> 46 supaya ruangan bisa
  dijelajahi lebih lega.
- `Map3D`: 3 titik cahaya lentera hangat (0xffa033) di sudut
  paviliun_makan, menyala hanya malam dengan denyut lembut,
  mengikuti pola api unggun yang sudah ada.

### Gemini tukang mikir (penasihat, bukan auto-build)
- `jalurSegmen` baru di `src/lib/batu/jalan.ts` (ekstrak dari
  `rencanaJalan`, perilaku rencanaJalan tidak berubah).
- `POST /api/gemini/jalan`: Gemini memilih segmen jalan
  berikutnya dari kandidat segmen yang masih bersisa (jalur
  dihitung BFS oleh kode); fallback scripted = urutan tetap.
- `POST /api/gemini/penempatan`: Gemini memilih petak terbaik
  untuk bangunan baru dari kandidat petak kosong tepi jalan
  yang divalidasi kode (tidak menabrak bangunan, bukan air,
  bukan gunung); fallback scripted = kandidat pertama.
- Tombol "Jalan Gemini" di topbar (di samping "Tata Kota"),
  pola alert sama seperti Tata Kota. Kedua route TIDAK menulis
  database; pembangunan tetap lewat sim dan alur bangunan
  normal. Key hanya dibaca dari env Vercel, tidak pernah
  ditulis di chat/repo.

### Anti-duplikat bangunan (pesan Fina, 2026-11-03 malam)
Fina melaporkan: 1 bangunan kesimpan berkali-kali, ID beda posisi
sama, dari proses yang jalan barengan. Tampilan game sudah 1 per
posisi (dedupe), tapi dokumen gandanya masih ada. Fina menghapus
salinannya (sisakan 1 per posisi, yang pertama menang — sama
dengan aturan dedupe tampilan); asisten TIDAK menghapus apa pun
di database. Yang diperbaiki di kode Nusantara supaya tidak
menumpuk lagi:
- Seed dunia (`getDuniaDoc`) kini idempotent: dunia + placement
  awal ditulis lewat upsert, bukan insertOne mentah.
- Pemilihan plot antrean kini menghalangi plot antrean lain yang
  sudah ditetapkan — dua antrean tidak lagi dapat plot sama
  dalam satu advance yang sama.
- Upsert penyelesaian bangunan kini kunci POSISI saja (dulu
  kind+posisi): bangunan berbeda pun tidak bisa menumpuk di
  ubin yang sama. Yang kalah race batal dengan kabar jujur
  ("posisinya sudah dipakai bangunan lain"), antrean ditutup
  supaya tidak menggantung.
- `pastikanIndexPlacement` baru di `src/lib/db.ts`: indeks unik
  `{gx, gy}` ("uniq_posisi") di peta_tile, dipanggil best-effort
  sekali per proses server dari `getDuniaDoc`. Selama salinan
  lama masih ada, pembuatan indeks gagal dan hanya dicatat
  (permainan tetap jalan); setelah Fina membersihkan salinan,
  proses server berikutnya membuat indeksnya dan race tulis
  posisi sama menjadi mustahil di level database.
- Tes: 6 penjaga statis baru (seed tanpa insertOne, upsert kunci
  posisi, kabar batal, plot antrean menghalangi, indeks unik).
- Urutan penting: bersihkan salinan dulu, baru indeks bisa
  terbentuk. Tanpa pembersihan, penjaga level kode tetap
  mencegah tumpukan BARU, tapi indeks belum aktif.

## 2026-11-04 — Tabrakan penuh + display memutar bangunan + Rapikan Gemini

### Tabrakan: tidak bisa nembus bangunan, kecuali malam masuk rumah sendiri
Temuan awal: sim SUDAH memblokir bangunan (footprint = rintangan,
gerak memutar + langkah menyamping sejak RONDE 2), tapi ada tiga
celah: (1) display jalan lurus ke tujuan sehingga di layar warga
memotong rumah — ini yang paling kelihatan; (2) gerak mengizinkan
ubin tujuan yang rintangan (pengecualian final-step); (3) hewan kabur
(gerakMenjauh) mengabaikan rintangan sama sekali. Yang diperbaiki:
- `gerak`: pengecualian tujuan DIHAPUS — bangunan dan gunung tidak
  bisa ditembus bahkan sebagai tujuan. Alur paviliun aman karena
  masuk/keluar lewat kolom pintu (rintanganUntuk), bukan lewat
  pengecualian ini (dibuktikan tes r10 yang tetap lolos).
- `rintanganUntuk`: malam hari (20:00–06:00, sama dengan faseDariJam)
  footprint rumah SENDIRI dikeluarkan dari rintangan — warga bisa
  masuk rumahnya untuk tidur. Siang hari rumah sendiri tetap padat;
  rumah orang lain dan hewan selalu menganggap semua rumah padat.
- `gerakMenjauh`: hewan kabur kini menghormati rintangan (berhenti di
  tembok, bukan lewat). Dua pemanggil di stepHewan sudah diberi
  ctx.rintangan.
- Display (`Map3D`): jalur warga kini BFS waypoint (`jalurTampil`
  baru di tampil.ts, murni + dites) menghindari footprint bangunan +
  lingkaran gunung, dihitung ulang tiap ganti tujuan terkunci;
  ubin tujuan tetap boleh sebagai langkah terakhir (tidur malam).
  Gagal BFS -> fallback garis lurus seperti dulu. Display hewan
  belum diubah (tindak lanjut).
- Tes: 12 baru (gerak anti-tembus, malam/siang rumah sendiri,
  pulang malam, jalurTampil memutar/masuk/terkepung, pasanganTumpuk).

### Gemini menggeser bangunan yang nabrak (tombol "Rapikan Gemini")
- `pasanganTumpuk` baru di dunia.ts: deteksi footprint yang saling
  tumpang (bukan cuma posisi asal sama) — yang dipertahankan yang
  pertama di daftar (sama dengan aturan dedupe tampilan), yang
  digeser yang kedua.
- Route baru POST /api/gemini/rapikan: cari tumpukan pertama ->
  kandidat petak kosong tepi jalan (divalidasi kode) -> Gemini
  memilih petak + menilai kenapa penempatan lama jelek + alasan
  petak baru bagus -> MEMINDAHKAN bangunan + kabar kampung
  (jenis gemini_rapikan). Fallback scripted bila tanpa key/LLM gagal.
  Bila tidak ada tumpukan, tidak ada yang dipindah.
- Tombol "Rapikan Gemini" di topbar sebelah "Jalan Gemini", pola
  alert + muat ulang sama seperti tombol Gemini lain.

## 2026-11-04 — Setting label karakter (mode ringan) + navbar mobile geser

### Setting sembunyikan nama/dialog karakter (optimasi)
- Penyebab berat: tiap warga/hewan punya label DOM (nama, bar HP,
  teks aksi, pip, bubble dialog) yang diproyeksikan + digeser tiap
  frame. Satu toggle di panel Pengaturan ("Label karakter (nama,
  dialog, aksi)") menyembunyikan SEMUA label itu: prop labelTampil
  dari page -> Map3D; container labelsEl display none (browser
  melewatkan layout/paint seluruh label) + loop frame melewatkan
  update posisi label saat mati. Karakter 3D tetap jalan seperti
  biasa, hanya labelnya hilang. Pilihan tersimpan di localStorage
  kunci ne_label_karakter ("0" = sembunyi) sehingga bertahan antar
  kunjungan. Default tetap tampil (tidak mengubah pengalaman lama).
- Tes: 11 penjaga statis baru (kunci storage, toggle + prop,
  baris Pengaturan, prop/ref Map3D, container display, guard loop).

### Navbar mobile: strip geser horizontal
- Akar masalah (bukan sekadar "kepotong"): .game-topbar satu baris
  nowrap + overflow visible + grup kanan flex-shrink 0, dan TIDAK
  ADA aturan topbar di media query HP selama ini — jadi di layar
  390px tombol kanan (gear, inventori, Balik Atas) keluar layar dan
  tak terjangkau. Mengecilkan tombol saja tidak cukup karena isinya
  memang lebih lebar dari layar.
- Perbaikan: tiga grup topbar dibungkus .topbar-scroll. Di desktop
  display:contents (nol perubahan layout). Di HP (<=760px) strip
  menjadi satu baris geser horizontal: semua tombol tetap berteks
  penuh dan bisa dibaca, tinggal geser untuk mencapai ujung kanan;
  dock resource ikut strip (tidak lagi memendek sendiri); tombol
  diperkecil (27px, padding 8px, font 10.5px); pil era
  disembunyikan. Tab Balik Atas sengaja tetap di luar strip supaya
  tidak ikut kegeser. Pengecekan viewport HP via browser juga
  dijalankan untuk membuktikan potongan sebelum perbaikan.
- Tes: penjaga statis untuk wrapper, display contents, strip geser
  HP, pil era, dan posisi fold tab.

### Belum dikerjakan (antrean cron berikutnya)
- UI pemilih bangunan untuk /api/gemini/penempatan (route
  sudah siap, tombol belum).
- Audit 657 tes lama yang merah di baseline.
- Angka kapasitas 850 dari user: saat ini masih memakai
  kapasitas dari `hitungKapasitasStok` (dasar + bonus lumbung);
  kalau 850 dimaksud sebagai kap total/per gudang, itu
  perubahan satu tempat yang perlu konfirmasi user.
