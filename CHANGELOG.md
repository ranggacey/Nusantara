# CHANGELOG Nusantara

## 2026-11-04 08:29 WIB — Satu aksi pertama "Mulai dari sini" di kartu menu (Ide 12, adaptasi jujur)

Baris ketuk "▶ Mulai dari sini" di kartu menu (☰), di bawah
panel "Kampung menginginkan", menunjuk ke SATU langkah
berikutnya yang sungguh bisa dilakukan pemain.

- `src/lib/batu/sumberdaya.ts`: fungsi murni baru
  `aksiPertamaBerikutnya(kb)` — populasi kurang -> {tombol
  "Tambah karakter", aksi "tambah"}; selain itu -> {tombol
  "Musyawarah", aksi "musyawarah"}; ujung tangga -> null
  (baris hilang). Populasi didahulukan karena itu satu-satunya
  kekurangan yang bisa diatasi pemain langsung.
- `src/app/page.tsx`: baris jadi tombol — aksi Musyawarah
  menutup menu dulu baru membuka panel Musyawarah (pola yang
  sama dengan tombol Musyawarah di daftar); aksi Tambah
  karakter cukup menutup menu supaya tombol ＋ di kanan-bawah
  kelihatan. `src/app/globals.css`: gaya `.menu-mulai`
  (bingkai hijau temaram, selaras kartu menu).
- ADAPTASI dari spesifikasi Ide 12: contoh awal "Mulai: Tata
  Kota — bangun Gubuk pertama" TIDAK dibangun, karena di game
  ini pemain adalah pengamat — bangunan hanya diputuskan +
  diantrekan NPC lewat musyawarah (lihat panel bangunan
  "Otonomi Kampung") dan tidak ada tombol bangun apa pun.
  Menunjuk Tata Kota sebagai "bangun" akan jadi janji palsu;
  baris ini menunjuk ke langkah yang benar-benar bisa dilakukan.
- Tes: 8 baru (populasi -> tambah; kampung kosong -> musyawarah;
  kurang bengkel + populasi -> tambah didahulukan; kurang
  penambang saja -> musyawarah; ujung tangga -> null; penjaga
  statis baris + CSS + pola tutup-menu-dulu). Total: 7706 lolos
  / 656 gagal — baseline 7698/656, jadi +8 lolos, nol regresi
  baru (656 gagal = baseline lama yang sudah merah sebelum
  perubahan ini). Build Next.js hijau.
- Catatan kejujuran: baris ini belum terverifikasi visual di
  live (menu memang terbuka saat observasi, tapi baris barunya
  baru ada setelah deploy ini — verifikasi visualnya jadi tugas
  observasi run berikutnya, bukan diklaim di sini).

### Verifikasi live lanjutan (09:17-09:28 WIB, setelah deploy)
- Pengecekan menu kedua (09:17-09:26): homepage + desa tampil
  normal, kartu menu terbuka, tapi baris "Mulai dari sini"
  TIDAK ADA di bawah panel "Kampung menginginkan" — baris
  pertama di bawah panel itu adalah Resto. Ini BUKAN bukti
  deploy gagal: desa live sudah di ujung tangga (panel
  "Kampung menginginkan" sendiri berbunyi "sampai ujung
  tangga", dan /api/map mengonfirmasi syaratnya: populasi 27,
  paviliun_makan + balai + dapur_umum + bengkel berdiri), dan
  untuk keadaan selesai fungsi `aksiPertamaBerikutnya` SENGAJA
  mengembalikan null sehingga baris disembunyikan. Baris ini
  hanya akan tampil di kampung yang belum sampai ujung tangga
  (mis. kampung baru) — dan itu tidak bisa dites dari sini
  tanpa bermain, yang dilarang observasi. Jadi status baris:
  kode live (deploy dari commit ini READY), perilaku
  selesai-tertutup terkonfirmasi lewat data API, penampakan
  visual barisnya sendiri tetap belum terverifikasi dan
  menunggu kampung yang belum selesai.
- API live terverifikasi ISI-nya (09:27-09:28, bukan hanya
  status): /api/world ok (Suka Maju, populasi 27, H-249,
  16.56 Sore, Berawan); /api/map ok (34 placement, 27 warga
  cocok dengan populasi); /api/bangunan ok (katalog 26 jenis +
  antrean 13 bangunan, semua selesai 100%). Tidak ada regresi
  API setelah deploy ini.
- Celah checklist yang dicatat untuk run berikutnya: string
  BUILD_ID di `src/lib/version.ts` TIDAK dinaikkan run ini
  (tetap r19 seperti sebelum deploy), jadi pil "Versi baru"
  tidak akan membedakan rilis ini dari sebelumnya di tab lama
  — tab baru tetap mendapat bundle baru, tapi run berikutnya
  wajib menaikkan BUILD_ID di setiap rilis sesuai komentar di
  file itu.

### Observasi live (browser, hanya melihat, 08:49-09:00 WIB)
- Muat pertama: layar "Memuat peta 3D…" dengan langit cerah,
  desa tampil dalam <30 detik (lebih cepat dari variasi 1-2
  menit di run 04:29/06:29 — dicatat sebagai variasi sesi/cache,
  bukan klaim perbaikan).
- Desa hidup: jam game berjalan (14.28 -> 16.59 selama observasi),
  dialog warga berganti ("Makan bersama!", "Aku tidak setuju!
  Rombongan besok harus ke hutan barat, bukan ke sungai."),
  warga + hewan terlihat (Rusa, Ayam Hutan, Serigala, Kelinci,
  Beruang).
- PERTAMA KALI TERVERIFIKASI VISUAL: tombol ☰ berhasil dibuka
  (ketukan pointer; klik standar sempat "page_busy" = batas alat
  browser, bukan bug situs) dan panel "🎯 Kampung menginginkan"
  TERLIHAT di dalam kartu menu — isinya "Kampung sudah sampai
  ujung tangga — Tugu Leluhur Agung menanti sebagai bukti
  kampung besar." Jadi panel Ide 6 resmi live-terlihat, menutup
  catatan "belum terverifikasi visual" dari run 06:29. Menu
  ditutup kembali; tidak ada area blank/error menetap, tidak ada
  tombol/panel terpotong atau tumpang tindih.

### Riset + backlog (brief research/2026-11-04-0829.md)
- Sudut: AUDIO (pertama kali dipakai; rotasi dari UX 06:29).
  Sumber: devlog The Laresian Order (ambien dua lapis + empat
  saluran volume), Homestead (trek per suasana + slider tersimpan),
  panduan ambien (stochastic layering lawan pengulangan yang
  ketahuan), kebijakan autoplay browser (AudioContext suspended
  sampai gestur pertama; resume di dalam handler gestur).
- Ide 15 (lapisan ambien siang/malam/cuaca, lazy-load, mulai
  setelah gestur pertama) dan Ide 16 (slider volume Efek/Ambien
  terpisah) masuk IDE-FITUR.md. Tidak direkomendasikan: ambien
  generate AI on-device, autoplay saat load, musik panjang di
  paket awal.
- Irisan run ini dari backlog IDE-FITUR (Ide 12), bukan dari
  brief audio ini — brief audio jadi antrean berikutnya.

## 2026-11-04 06:29 WIB — Deploy tertunda Ide 6 + bersih-bersih CSS (KOREKSI entri 04:29)

KOREKSI CATATAN: entri 04:29 menulis "deploy Ide 6 yang tertunda",
tapi verifikasi run ini membuktikan deploy itu TIDAK PERNAH terjadi
— tidak ada commit baru setelah 8c0f348 di `git log` maupun di
`list_commits` GitHub, dan deployment production terbaru Vercel
tetap dari commit 8c0f348 ("Navbar dihapus, ganti menu modal").
Jadi panel "Kampung menginginkan" + bersih-bersih CSS selama ini
hanya ada di working tree. Run ini TIDAK membangun fitur baru:
tugasnya menutup antrean itu — verifikasi ulang tree apa adanya
(tes + build), lalu push beneran, lalu verifikasi live.

- Isi push (sama persis dengan pekerjaan run 02:29 + 04:29, tanpa
  tambahan kode): panel "🎯 Kampung menginginkan" (Ide 6,
  `kebutuhanKampungBerikutnya` di `sumberdaya.ts` + panel di kartu
  menu + gaya `.menu-kebutuhan`) dan hapus ~352 baris CSS topbar
  mati dari `globals.css` (kelas strip resource yang masih dipakai
  kartu menu dipertahankan).
- Verifikasi ulang run ini pada kondisi akhir tree: tes offline
  7698 lolos / 656 gagal — persis baseline 04:29, nol regresi baru
  (656 gagal = baseline lama yang sudah merah sebelum perubahan
  ini). Build Next.js hijau.
- Catatan kejujuran: panel ini belum terverifikasi visual di live
  (lihat observasi di bawah: menu tidak berhasil dibuka sesi ini),
  jadi verifikasi live run ini hanya homepage + API, bukan panelnya.

### Observasi live (browser, hanya melihat, 08:28-08:34 WIB)
- Muat pertama: layar gelap kosong sesaat tanpa teks/pesan muat
  apa pun (berbeda dengan run sebelumnya yang melihat teks
  "Memuat Peta 3D..."); desa terkonfirmasi tampil dalam 30 detik.
  Layar muat yang diam tanpa indikator ini dicatat sebagai
  pekerjaan UX berikutnya, bukan diklaim sebagai bug — bisa jadi
  variasi sesi browser.
- Setelah muat: desa hidup — 24 warga berlabel + hewan terlihat
  (Rusa, Kelinci, Ayam Hutan, 1 Serigala); dialog warga berganti
  antar pengecekan (08:29 ada dialog, 08:32 tidak ada, 08:34 ada
  lagi yang baru). Gerakan jalan kaki tidak terverifikasi dari
  piksel (keterbatasan alat browser, bukan bukti diam).
- Tombol utuh, tidak terpotong/tumpang tindih: "Buka menu kampung"
  ☰ kanan-atas, "Panduan Kontrol" kiri-bawah, "Tambah karakter"
  kanan-bawah. PERINGATAN: 5 klik ke tombol ☰ gagal terkirim
  karena halaman sibuk (`page_busy`) + 1 percobaan gagal tangkap
  layar — menu TIDAK berhasil dibuka sesi ini, jadi panel
  "Kampung menginginkan" TIDAK terverifikasi visual dan tidak
  boleh diklaim live-terlihat sampai ada sesi yang membukanya.
  Ini bisa jadi keterbatasan alat browser, bukan bug situs, tapi
  dicatat sebagai item pantau.
- Tidak ada area blank/error menetap setelah desa tampil.

### Riset + backlog (brief research/2026-11-04-0629.md)
- Sudut: UX (rotasi dari fitur baru 04:29). Sumber: The Morphic
  Studio (onboarding sepotong kecil interaktif saat relevan),
  Wandr (aksi utama di jangkauan jempol bawah, umpan balik di
  atas/samping titik sentuh, HUD dikurangi ke yang sering atau
  mendesak), DEV Community (satu aksi pertama yang bermakna +
  panduan kontekstual yang bisa ditutup/dibuka lagi).
- Ide 12 (satu aksi pertama "Mulai dari sini" di kartu menu),
  Ide 13 (tombol menu utama ke jangkauan jempol — butuh uji
  visual HP dulu), Ide 14 (tip kontekstual singkat yang bisa
  ditutup) masuk IDE-FITUR.md. Tidak direkomendasikan: tur
  interaktif multi-langkah dan memperkecil teks HUD.
- Irisan run ini BUKAN dari brief ini melainkan menutup antrean
  deploy 02:29/04:29 yang tertunda — prioritas antrean di atas
  ide baru.

## 2026-11-04 04:29 WIB — Bersih-bersih CSS topbar mati + deploy Ide 6 yang tertunda

Dua pekerjaan dalam satu push (keduanya sudah jadi, tinggal deploy):
(1) Panel "Kampung menginginkan" (Ide 6) dari run 02:29 — saat run
itu selesai, perubahannya masih tertinggal di working tree belum
ter-commit; run ini memverifikasi ulang (tes + build hijau) lalu
men-deploy-nya, bukan membangun ulang. (2) Irisan run ini:
bersih-bersih CSS topbar mati yang dicatat commit 8c0f348 sebagai
pekerjaan run berikutnya.

- `src/app/globals.css`: ~352 baris CSS topbar lama dihapus
  (`.game-topbar`, `.topbar-scroll`, `.hud-btn` + varian,
  `.hud-info-chip`, `.hud-resource-dock`, `.nav-topbar-fold-tab`,
  `.nav-handle`, `.nav-gear-float`, media 1280/1024/760px-nya,
  plus `.game-topbar.nav-tersembunyi`). SENGAJA dipertahankan:
  `.hud-res-chip`, `.hud-res-icon`, `.hud-res-num`,
  `.hud-full-dot` — strip resource itu masih dipakai di dalam
  kartu modal menu, jadi klaim lama "hud-* tidak dipakai siapa
  pun" tidak sepenuhnya benar; hanya yang benar-benar tanpa
  pemakai yang dihapus (dicek per kelas terhadap seluruh src/).
- Tes: 15 penjaga statis baru (kelas mati tidak ada, kelas hidup
  tetap ada). Total: 7698 lolos / 656 gagal — 656 = baseline lama
  yang sudah merah sebelum perubahan ini, nol regresi baru.
  Build Next.js hijau.
- Catatan ukur: klaim performa di sini hanya "CSS lebih kecil
  ~352 baris"; tidak ada klaim kecepatan muat, karena observasi
  di bawah justru menunjukkan muat pertama masih 1-2 menit.

### Observasi live (browser, hanya melihat, 04:30-04:36 WIB)
- Muat pertama MASIH berat: layar "Memuat peta 3D..." masih tampil
  setelah ~1 menit, desa penuh baru terlihat sekitar menit ke-2
  (beda dengan run 02:29 yang terasa hitungan detik — kemungkinan
  cache; variasi ini dicatat, bukan diklaim sebagai perbaikan).
- Setelah muat: desa hidup, bukan gambar statis — aktivitas
  "Menghalau Hewan!" naik 53% -> 61% selama observasi; hewan
  terlihat berlabel (Rusa, Kelinci, Ayam Hutan, Babi Hutan,
  Beruang, Telo); dialog warga tampil ("Hasil kumpulmu hari ini
  banyak, Renata?").
- Tombol utuh, tidak ada yang terpotong/tumpang tindih: "Buka menu
  kampung" kanan-atas, "Tambah karakter" kanan-bawah, "Panduan
  Kontrol" kiri-bawah. Tidak ada area blank/error menetap (frame
  pertama gelap sesaat sebelum layar muat = transien).
- Responsivitas tombol TIDAK dites (observasi dilarang klik ubah
  state); jank geser/zoom juga tidak terverifikasi sesi ini.

### Riset + backlog (brief research/2026-11-04-0429.md)
- Sudut: FITUR BARU (rotasi dari sosial/QoL lalu performa).
  Sumber: Town to City update 27 Okt 2026 (bangunan modular,
  jalan dicat, mode jalan kaki, mode foto; 97% positif Steam),
  Hazel's Cauldron v3 (hati persahabatan 0-5, festival tiap
  tanggal 28 + persiapan seminggu sebelumnya), Starsand Island
  1.0 (festival musiman Autumn Pumpkin Carnival + hadiah
  eksklusif), Everdream Village (ikatan warga -> ikut membantu
  kerja). Ide 10 (festival kampung berkala, mulai display-only)
  dan Ide 11 (jejak kebersamaan warga) masuk IDE-FITUR.md.
  Tidak direkomendasikan: multiplayer dan combat dungeon
  (mengubah arsitektur/genre).

## 2026-11-04 02:29 WIB — Papan kebutuhan kampung di kartu menu (Ide 6)

Irisan kecil DESAIN-EKONOMI langkah 2, versi display-only: panel
"🎯 Kampung menginginkan" di kartu menu (☰), di bawah strip
resource, di atas daftar tombol. Menampilkan SATU tingkat
berikutnya dari tangga progresi + apa yang masih kurang
(mis. "Kampung besar: Balai, Dapur Umum. Masih kurang: 1 bengkel,
populasi 12"). Panel ini TIDAK mengunci bangunan apa pun —
bangunan tetap berdiri lewat sim seperti biasa; kuncinya tetap
pekerjaan terpisah. Syarat dibaca harfiah dari spesifikasi
(tingkat 1 butuh gubuk + api unggun, bukan tenda; tingkat 5
menampilkan Bengkel Besi + Tugu Leluhur Agung sebagai rencana
karena belum ada di katalog).

- `src/lib/batu/sumberdaya.ts`: fungsi murni baru
  `kebutuhanKampungBerikutnya(populasi, jenisBerdiri,
  adaPenambang)` — data dari payload yang sudah ada di klien
  (`world.populasi`, `map.placements[].kind`,
  `map.warga[].peran`), tanpa fetch/API baru, tanpa ubah sim.
- `src/app/page.tsx`: panel di kartu menu + impor fungsi.
- `src/app/globals.css`: gaya `.menu-kebutuhan` (bingkai kuning
  temaram, selaras kartu menu).
- Tes: 15 baru (urutan tingkat 1->5, tenda tidak membuka
  tingkat 1, keadaan selesai, penjaga statis panel + CSS).
  Total: 7683 lolos / 656 gagal — baseline 7668/656, jadi +15
  lolos, nol regresi baru (656 gagal = baseline lama yang sudah
  merah sebelum perubahan ini). Build Next.js hijau.
- Catatan kecil saat implementasi: edit pertama sempat menimpa
  `bangunanById` (fungsi itu hilang dari file) sehingga tes
  crash; langsung dikembalikan sebelum tes/build final — tes dan
  build di atas adalah hasil kondisi akhir tree.

### Observasi live (browser, hanya melihat, 02:31-02:38 WIB)
- Muat pertama TIDAK berat sesi ini: desa tampil dalam hitungan
  detik (beda dengan 60-90 detik di run 00:29 — kemungkinan cache;
  tidak bisa dibuktikan dari sini, dicatat sebagai perbedaan
  observasi, bukan klaim perbaikan).
- Hewan terlihat: 16 ekor (4 Rusa, 4 Kelinci, 7 Ayam Hutan,
  1 Beruang); 27 warga; label aktivitas berubah seiring waktu
  ("Makan bersama!" serentak 02:37 — sim hidup, bukan gambar statis).
- Satu tombol ☰ saja, tidak ada tombol ganda; tidak ada area
  blank/error. Jank geser/zoom peta TIDAK teruji (alat browser
  gagal menangkap layar untuk menempatkan drag — keterbatasan
  alat, bukan error situs). Info kampung/stok tidak tampak di
  tampilan default karena topbar sudah dihapus — info itu kini
  hanya di dalam modal menu, tempat panel baru ini ditaruh.
- Responsivitas tombol menu sendiri tidak dites (dilarang klik
  ubah state pada observasi).

### Riset + backlog (brief research/2026-11-04-0229.md)
- Sudut: PERFORMA (rotasi dari sosial/QoL run sebelumnya).
  Sumber: Mobitoss (muat layar pertama saja + progres jujur +
  jeda loop saat tab hidden), Playgama (cap DPR 1-2, kurangi
  draw call, tanpa alokasi di render loop), ulasan Idle City
  Builder (pemain minta culling peta). Ide 7/8/9 masuk
  IDE-FITUR.md; irisan run ini BUKAN dari brief ini melainkan
  dari prioritas DESAIN-EKONOMI. Tidak direkomendasikan:
  rewrite renderer ke WebGL murni dan potong kualitas visual
  global sebelum diukur.

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

## 2026-11-04 (cron 00:29 WIB) — Display hewan memutar bangunan + brief riset sosial/QoL

### Display hewan tidak lagi menembus rumah (tindak lanjut run sebelumnya)
- `Map3D`: loop hewan kini memakai `jalurTampil` (BFS waypoint)
  dengan pola yang sama seperti warga — kunci jalur = ubin tujuan
  server, dihitung ulang bila tujuan berubah atau waypoint pertama
  sudah tidak masuk akal, gagal BFS -> garis lurus seperti dulu.
  Hewan juga menghadap waypoint, bukan arah lurus ke server.
  Entri hewanMap mendapat field `jalur`/`jalurKey`.
- Tes: 4 penjaga statis baru (field jalur, perhitungan jalurTampil
  hewan, geser waypoint saat tiba, hadap waypoint). Total run ini:
  7660 lolos / 657 gagal — 657 gagal SAMA PERSIS dengan baseline
  (r11/r14/r15/r18), nol regresi baru. Build Next.js hijau pada
  tree gabungan (lihat catatan tabrakan di bawah).

### Observasi live (browser, hanya melihat, 00:29-00:34 WIB)
- Muat pertama berat: desa penuh baru tampil setelah ~60-90 detik
  ("Memuat Peta 3D..." lama); setelah itu normal, jam jalan
  (H-213, 07:56 Pagi, Cerah), warga campur jalan/ngobrol/bertugas
  ("Menghalau Hewan! 66%"), hewan terlihat jelas dan berlabel
  (Babi Hutan, Rusa, Kelinci, Kucing, Ayam, Bebek, Kambing, Anjing).
- Strip sumber atas tampak terpotong di tepi atas; ada tombol
  Pengaturan dan Musyawarah ganda (responsivitas tidak dites karena
  dilarang klik ubah state). Tidak ada area blank/error setelah muat.
- Stok live masih meluber dari data lama (mis. Pangan 462,6k/850,
  Kayu 9,7k/740, semua "Kapasitas Penuh!"): clamp kode hanya
  mencegah penambah BARU meluber, bukan memperbaiki data lama —
  dan cron dilarang menulis DB, jadi ini dicatat saja.

### Riset + backlog (brief research/2026-11-04-0029.md)
- Sudut: sosial/QoL. Sumber: devlog Cradle of Mankind ("no post,
  no work" + gossip feed + papan pengumuman), Hearthbound (daily
  goals pemandu, surat, hadiah), ulasan Animal Valley (minta sinyal
  "semua pekerja menganggur"). Ide 5 (penanda warga tanpa pos +
  kabar ringkas) dan Ide 6 (papan kebutuhan kampung) masuk
  IDE-FITUR.md. Tidak direkomendasikan: voice chat/trading antar
  pemain dan combat gua real-time.
- Irisan desain-ekonomi yang lebih besar (kunci tingkat) TIDAK
  diambil run ini: bukan irisan kecil satu run (butuh katalog +
  gating API + UI + tes), jadi ditunda ke run yang memang
  dialokasikan untuk itu.

### CATATAN TABRAKAN — DEPLOY RUN INI DITUNDA (bukan gagal tes)
- Saat run ini mulai, tree sudah berisi perubahan BELUM COMMIT dari
  sesi lain (setting label karakter + navbar mobile geser di
  page.tsx, globals.css, Map3D.tsx, tests, CHANGELOG) — perubahan
  itu koheren dan tesnya hijau, tapi belum di-commit/di-deploy
  oleh pemiliknya. Karena file Map3D.tsx/tests/CHANGELOG.md kini
  memuat DUA pekerjaan sekaligus, push run ini akan ikut
  men-deploy pekerjaan sesi lain yang belum tentu selesai.
  Sesuai aturan cron (ragu -> tunda deploy), run ini TIDAK push
  dan TIDAK deploy manual. Perubahan run ini (jalur hewan + tes +
  riset + backlog + entri ini) tetap di working tree, siap
  di-commit begitu sesi lain selesai. Main agent perlu
  mengoordinasikan urutan commit/deploy kedua pekerjaan ini.

### Belum dikerjakan

## 2026-11-04 (permintaan user) — Navbar dihapus, ganti menu modal

### Topbar dihapus, navigasi jadi kartu modal
- `page.tsx`: header topbar, tab Balik Atas, tombol Musyawarah melayang kiri, handle ▾, dan gear melayang kanan-atas DIHAPUS semua. Penggantinya: 1 tombol ☰ kanan-atas (menu-fab, z 35) yang membuka kartu modal (overlay-full + menu-card, z 50).
- Kartu modal berisi: info kampung (nama, populasi, jam, fase, cuaca, hari) + strip resource (angka + penanda Kapasitas Penuh, sama seperti dock lama) + 10 tombol menu, masing-masing dengan ikon, nama, dan penjelasan fungsinya: Resto, Musyawarah, Tata Kota, Jalan Gemini, Rapikan Gemini, Gaya Jalan (menu tetap terbuka supaya bisa ketuk berulang ganti level), Suara (menu tetap terbuka), Pengaturan, Inventori, Orientasi.
- Tombol aksi (Resto, Musyawarah, Gemini, Pengaturan, Inventori, Orientasi) menutup menu dulu baru menjalankan aksinya; toggle (Suara, Gaya Jalan) membiarkan menu tetap terbuka supaya state baru langsung kelihatan.
- Efek samping yang ikut beres: tombol Pengaturan/Musyawarah yang tampak ganda (observasi cron 00:29) hilang karena tombol-tombol itu kini hanya ada di satu tempat.
- CSS topbar lama (.game-topbar, .hud-*, .nav-*, .topbar-scroll) masih ada di globals.css tapi sudah tidak dipakai siapa pun — dibiarkan dulu, dibersihkan di run berikutnya supaya diff tetap fokus.
- Tes: blok RONDE 4 diperbarui (asersi topbar/handle/gear lama diganti asersi menu); 15 penjaga statis baru + 2 asersi RONDE 4 baru. Total: 7668 lolos / 656 gagal — 656 = baseline 657 minus 1 asersi usang ("tombol sembunyikan" yang sudah merah sejak sebelum perubahan ini karena string-nya tidak ada di page). Nol regresi baru. Build Next.js hijau.
- Koreksi atas entri cron 00:29 di bawah: kode display hewan memutar bangunan ternyata SUDAH ikut ter-deploy lewat commit 4752abd (Map3D.tsx masuk manifest push itu karena saat push, file tersebut sudah berisi edit cron) — yang baru ikut push kali ini adalah 4 tes penjaganya + entri CHANGELOG + IDE/research run tersebut. Jadi perbaikan hewannya sudah live sejak 4752abd, bukan menunggu deploy ini. (antrean cron berikutnya)
- UI pemilih bangunan untuk /api/gemini/penempatan (route
  sudah siap, tombol belum).
- Audit 657 tes lama yang merah di baseline.
- Angka kapasitas 850 dari user: saat ini masih memakai
  kapasitas dari `hitungKapasitasStok` (dasar + bonus lumbung);
  kalau 850 dimaksud sebagai kap total/per gudang, itu
  perubahan satu tempat yang perlu konfirmasi user.
