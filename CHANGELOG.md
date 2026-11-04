# CHANGELOG Nusantara

## 2026-11-04 18:29 WIB — Klaster analog naik di atas pil Panduan Kontrol (temuan observasi live)

Observasi run ini menemukan tumpukan: pil "🎮 Panduan Kontrol"
(`.bottom-controls`, bottom 12px kiri, z 25) menumpuk bagian bawah
dasar analog yang juga duduk di bottom 12px kiri (z 10) — dasar
analog tertutup sebagian dan area sentuhnya berlapis. Perbaikan
satu baris posisi, tanpa memindah pil mana pun:

- `src/app/globals.css`: `.analog-kamera` dan `.analog-muncul`
  (tombol 🕹️ saat klaster disembunyikan) bottom 12px -> 60px:
  klaster kini menumpuk DI ATAS pil (~32px) dengan jeda 12px
  (12 + 32 + 12 ≈ 56, dibulatkan 60), tetap di kolom kiri-bawah
  yang terjangkau jempol. Komentar CSS menjelaskan hitungannya
  supaya kontrol berikutnya tidak mengulang tumpukan yang sama
  (aturan kolom kiri, Ide 24).
- `src/lib/version.ts`: BUILD_ID r28 -> r29.
- Tes: 2 penjaga statis baru (blok `.analog-kamera` dan
  `.analog-muncul` masing-masing menyebut bottom 60px) + 4 penjaga
  versi diperbarui r28 -> r29. Total: 7762 lolos / 656 gagal —
  baseline r28 7760/656, jadi +2 lolos, nol regresi baru (tidak ada
  gagal bernama analog/r29/Panduan). Build Next.js hijau.
- Kejujuran: popover Panduan Kontrol yang DIBUKA sengaja masih
  menutupi analog selama terbuka (popover z 45, ditutup lewat ✕-nya
  sendiri) — yang diperbaiki adalah tumpukan permanen pilnya, bukan
  popover sesaat itu. Penampakan visual perbaikan di live menjadi
  tugas verifikasi pasca-deploy, bukan klaim di sini.

### Observasi live (browser, hanya melihat, 18:29-18:32 WIB)
- Muat pertama: frame biru gelap dengan teks "Memuat peta 3D…"
  (bukan frame kosong tanpa teks seperti run-run lama) dan desa
  sudah tampil pada pengecekan 30 detik — jadi tampil dalam
  <30 detik, bukan klaim detik persis. Tidak ada error atau area
  blank menetap setelah muat.
- Desa hidup: 6 warga desa baru terkonfirmasi (Figo, Nera, Praboti,
  Evos dyroth, Siti, Budi — cocok dengan desa pasca-reset 17:14);
  jam game berjalan (03.51 -> 04.01 Malam). Warga tampak berkerumun
  di tengah dengan pergeseran kecil dan satu bubble obrolan yang
  sama bertahan ~1 menit — dicatat sebagai tampilan diam, bukan
  bukti sim menganggur (sim jalan di server). Hewan terlihat sebagai
  label (Rusa, Kelinci, Ayam Hutan, Serigala) tapi figuranya kecil
  di zoom itu.
- Klaster analog kiri-bawah tampil UTUH (✕, ▲, ▼, dasar + knop
  kuning) dan tidak terpotong tepi layar — menutup kekhawatiran
  run 17:21 soal dasar analog terpotong (kemungkinan artefak
  viewport browser saat itu). Pil ＋ Tambah karakter kanan-bawah
  utuh, tidak menumpuk apa pun. Satu-satunya tumpukan yang
  ditemukan adalah pil Panduan Kontrol di atas dasar analog —
  itulah yang diperbaiki run ini.
- Panel "🎯 Kampung menginginkan" TERLIHAT dan isinya KONSISTEN
  dengan desa baru: "Kampung menetap: Lumbung, Ladang, Sumur Batu.
  Masih kurang: 1 Gubuk, 1 Api Unggun." — bukan lagi teks ujung
  tangga, karena 2 gubuk desa baru masih antre (belum berdiri).
  Entri "👥 Papan Warga" ada di kartu menu (di bawah lipatan,
  tidak terbaca visual langsung — dicatat jujur, bukan diklaim
  terlihat). Menu dibuka dan ditutup normal, responsif.

### Riset + backlog (brief research/2026-11-04-1829.md)
- Sudut: SOSIAL/QoL + UX SENTUH (rotasi dari KEMBALI BERMAIN 16:29).
  Sumber: Wandr (target sentuh harus besar DAN berjarak — tetangga
  yang terlalu dekat adalah generator salah ketuk; aksi utama di
  sepertiga bawah) + forum Age of Empires III (pemain lebih mau
  MELIHAT warga menganggur lewat banner/daftar daripada kerja mereka
  diambil alih otomatis).
- Ide 24 (aturan kolom kontrol kiri, jeda minimal 12px antar kontrol
  di pojok yang sama) masuk IDE-FITUR.md dan langsung diterapkan
  run ini untuk analog. Riset ini juga MENGUATKAN Ide 5 (penanda
  warga tanpa pos, display-only) sebagai irisan berikutnya — tanpa
  mengubah spesifikasinya menjadi otomasi. Tidak direkomendasikan:
  warga menganggur otomatis cari kerja terdekat, bunyi peringatan
  tiap jumlah menganggur bertambah, dan memindah pil Panduan Kontrol
  ke atas layar (melanggar jangkauan jempol yang sama).

## 2026-11-04 17:23 WIB — Kumpul biasa minimal 1 maksimal 3, nol dihapus (permintaan user)

Perintah user: "sehari 1 orang bisa dpt minimal 1 maksimal 3".
Diterapkan ke sumber BIASA (pangan/kayu/batu/kulit) — satu-satunya
bacaan yang konsisten dengan desain langka yang masih berlaku
(besi/emas cap-nya 2, bukan 3, dan kelangkaannya tidak dicabut).

- `src/lib/batu/sim.ts`: `peluangKumpul` biasa 0/1/2/3 =
  45/35/15/5% -> 1/2/3 = 64/27/9% (renormalisasi 35:15:5 r23,
  rata-rata ~1,45; NOL tidak mungkin lagi karena peluang 0 = 0).
  Bump berbakat (+1, 50%, maks 3) tidak berubah — min tetap 1,
  maks tetap 3. Cap harian tetap 3 biasa / 2 langka; juru masak
  x1,5 pangan tetap dijepit cap 3. Besi/emas TIDAK diubah
  (tetap boleh nol, cap 2). Komentar aturan + DESAIN-EKONOMI.md
  diperbarui sesuai.
- `src/lib/version.ts`: BUILD_ID r27 -> r28.
- Tes: asersi roll kayu biasa diperbarui (min 1, maks 3,
  rata-rata 1,3..1,6, nol = 0 atas 20000 roll) + asersi baru
  berbakat biasa (tetap 1..3, rata-rata 1,7..2,1); tes besi/emas
  tidak diubah (tetap boleh nol) + 4 penjaga versi r27 -> r28.
  Total: 7760 lolos / 656 gagal — baseline 656 gagal, nol regresi
  baru (asersi roll baru semua lolos). Build Next.js hijau.

## 2026-11-04 17:16 WIB — Analog kiri ganti D-pad + tombol naik/turun + bisa disembunyikan (permintaan user)

Umpan balik user atas D-pad r25/r26: "aneh, harusnya di sebelah
kiri". D-pad dihapus total, diganti kontrol gaya game HP:

- `src/components/Map3D.tsx`: klaster pojok KIRI-bawah peta (z 10).
  Tongkat analog (dasar 120px, knop 52px, jejari gerak 34px):
  seret ke 8 arah (maju/mundur/kiri/kanan + serong) untuk menggeser
  kamera; arah dihitung dari kamera (kanan = sumbu X kamera di
  bidang tanah, atas = arah pandang kamera di bidang tanah) jadi
  selalu sesuai arah layar walau kamera di-orbit. Kecepatan ikut
  besar defleksi (penuh = 20 unit/detik, zona mati 0.15); lepas =
  knop kembali tengah + berhenti. Seret melepas kunci follow +
  membatalkan animasi bingkai awal (sama seperti mulai menggeser);
  hover mouse desktop tanpa tekan tidak menggerakkan knop.
  Di atas analog: tombol ▲ naik dan ▼ turun untuk zoom kamera
  (naik = menjauh/lihat lebih luas, turun = mendekat/lihat dekat;
  tahan = zoom terus; TIDAK melepas follow supaya bisa zoom sambil
  mengikuti warga). Paling atas klaster: tombol ✕ untuk
  menyembunyikan seluruh kontrol; saat tersembunyi hanya tampil
  tombol 🕹️ di pojok yang sama untuk memunculkan lagi. Geser jari
  dan cubit/scroll tetap jalan seperti biasa.
- `src/app/globals.css`: kelas .dpad-* dihapus, diganti .analog-*.
- `src/lib/version.ts`: BUILD_ID r26 -> r27.
- Tes: penjaga D-pad diganti penjaga analog (dasar + knop, tombol
  naik/turun, sembunyikan/munculkan, zona mati, interval cleanup,
  CSS baru, D-pad lama hilang) + 4 penjaga versi r26 -> r27.
  Total: 7758 lolos / 656 gagal — baseline 656 gagal, nol regresi
  baru. Build Next.js hijau.

## 2026-11-04 17:10 WIB — D-pad naik supaya tombol bawah tidak tertutup pil Tambah (perbaikan verifikasi r25)

Verifikasi browser r25 menemukan: 4 tombol D-pad tampil + ketuk
Papan Warga sudah benar (papan tertutup, kartu profil Figo tampil,
kamera mengikuti), TAPI tombol ▼ tertutup sebagian oleh pil kuning
＋ Tambah karakter (fixed, right 18px, bottom 24px, tinggi ~40px,
z 35) yang menumpuk pojok kanan-bawah viewport — tepat di atas
baris bawah D-pad yang tadinya di bottom 12px.

- `src/app/globals.css`: `.dpad-kamera` bottom 12px -> 76px
  (di atas pil Tambah + jeda 12px). Posisi kanan-bawah tetap
  (jempol kanan), tidak dipindah ke kiri karena kiri-bawah sudah
  ditempati tombol "Lepas Kunci Kamera" saat follow aktif.
- `src/lib/version.ts`: BUILD_ID r25 -> r26.
- Tes: 4 penjaga versi diperbarui r25 -> r26 + 1 penjaga baru
  (wadah D-pad bottom 76px). Total: 7756 lolos / 656 gagal —
  baseline 656 gagal, nol regresi baru. Build Next.js hijau.

## 2026-11-04 16:58 WIB — Kamera: ketuk Papan Warga menuju karakter + tombol arah D-pad (permintaan user)

Selama ini ketuk karakter di peta SUDAH mengunci kamera (follow-lerp
di Map3D: target kamera meluncur ke posisi tampil karakter lalu
mengikutinya) + kartu profil MMORPG. Tapi ketuk baris Papan Warga
hanya membuka panel detail — kamera tidak bergerak, jadi user harus
mencari sendiri warga itu di peta. Update ini menyamakan keduanya.

- `src/app/page.tsx`: onClick baris Papan Warga kini memanggil
  `tapWarga(id)` (set followId + selectedId, sama persis dengan
  ketuk karakter di peta) setelah menutup papan — bukan lagi
  `detailWarga` (panel samping). Efeknya: papan tertutup, kamera
  meluncur halus ke atas/dekat karakter lalu mengikutinya, dan
  kartu profil (3D preview, stat, stamina, lapar, HP, bakat,
  renungan) tampil. Kunci dilepas lewat tombol "Batal kunci" di
  kartu, atau ketuk tanah kosong, seperti perilaku kunci yang
  sudah ada. Subjudul papan + komentar kode diperbarui sesuai
  perilaku baru. Jalur detail panel samping tetap ada lewat
  ketuk tile / pencarian, tidak dihapus.
- D-pad kamera (`src/components/Map3D.tsx` + `src/app/globals.css`,
  keluhan susulan user di tengah pengerjaan: "pergerakan kamera
  susah"): 4 tombol arah (◀ ▲ ▼ ▶) pojok kanan-bawah peta, di atas
  kanvas (z 10) tapi di bawah modal. Arah dihitung dari kamera
  (kanan = sumbu X kamera di bidang tanah, atas = arah pandang
  kamera di bidang tanah), jadi tombol selalu sesuai arah layar
  walau kamera sudah di-orbit. Target digeser saja — update()
  OrbitControls tiap frame menerjemahkan kamera ikut, sama
  seperti PAN bawaan. Ketuk = 1 langkah (2 unit), tahan = geser
  terus 20 unit/detik; lepas (termasuk lepas di luar tombol,
  pointer capture) = berhenti. Tekan D-pad juga melepas kunci
  follow + membatalkan animasi bingkai awal, sama seperti mulai
  menggeser — jadi tidak pernah dilawan follow-lerp. Geser jari
  tetap jalan seperti biasa; D-pad hanya alternatif. Tombol 48px
  (≥44px, jangkauan jempol), label aria + title Indonesia.
- `src/lib/version.ts`: BUILD_ID r24 -> r25.
- Tes: 4 penjaga versi diperbarui r24 -> r25 (mekanisme bump yang
  disengaja, seperti rilis sebelumnya), 1 penjaga papan diperbarui
  ke perilaku baru (tapWarga, bukan detailWarga), 11 penjaga statis
  baru untuk D-pad. Total: 7755 lolos / 656 gagal — baseline
  7743/656, jadi +12 lolos, himpunan gagal kembali identik baseline
  (nol regresi baru, dicek nama gagal: tidak ada dpad/papan/r25).
  Build Next.js hijau (termasuk perbaikan komentar JSX papan yang
  sempat membuat build merah di tengah pengerjaan).

## 2026-11-04 16:29 WIB — Fallback muat jujur untuk chunk 3D (Ide 7, irisan kecil)

Selama ini `Map3D` diimpor lewat `dynamic(..., { ssr: false })` TANPA
`loading`, jadi selama chunk 3D diunduh setelah hydration, area peta
kosong tanpa teks apa pun — persis frame gelap yang berulang kali
dilaporkan observasi (termasuk run ini: frame gelap penuh tanpa teks/
spinner, desa baru tampil dalam <30 detik).

- `src/app/page.tsx`: dynamic import kini memakai
  `loading: () => <div className="map3d-loading">Memuat peta 3D…</div>`
  — gaya + teks yang sama dengan layar muat di dalam `Map3D`
  (`!map` → `.map3d-loading`), jadi tidak ada gaya/teks muat kedua
  yang bisa drift. `ssr: false` dipertahankan (WebGL/window tidak
  boleh dirender server).
- `src/lib/version.ts`: BUILD_ID r23 -> r24.
- Tes: 6 penjaga statis baru (dynamic import ada, ssr:false
  dipertahankan, fallback loading ada, gaya + teks sama, CSS
  `.map3d-loading` ada, BUILD_ID r24) + 3 penjaga versi lama
  diperbarui r23 -> r24 (mekanisme bump yang disengaja). Total:
  7743 lolos / 656 gagal — baseline 7737/656, jadi +6 lolos, nol
  regresi baru. Build Next.js hijau.
- Kejujuran: yang ditutup irisan ini hanya jendela SETELAH hydration
  (chunk diunduh). Frame SEBELUM hydration JS masih mungkin gelap
  karena React belum jalan — itu butuh cangkang HTML statis di
  layout dan menjadi sisa Ide 7, tidak diklaim beres di sini.
  Penampakan visual fallback di live belum terverifikasi (butuh
  sesi dengan cache/chunk dingin) — jadi tugas observasi run
  berikutnya, bukan klaim di sini.

### Observasi live (browser, hanya melihat, 16:30-16:35 WIB) — DENGAN PERINGATAN
- Yang KONSISTEN dengan semua run sebelumnya dan dipakai di sini:
  frame pertama gelap penuh tanpa teks/spinner/indikator, hanya
  tombol menu, "Panduan Kontrol", dan "＋ Tambah karakter"; desa
  tampil dalam <30 detik; tidak ada pesan error.
- Yang TIDAK DIPAKAI karena BERTENTANGAN dengan kode tree dan API
  yang terverifikasi: laporan browser menyebut menu berisi
  Beranda/Gacha/Profil Negara/dst. dan modal "Papan Warga" berisi
  7 warga (Raja/Menteri/dst.) — tree Nusantara punya menu ☰
  (Resto, Musyawarah, Tata Kota, ...) dan Papan Warga dari
  `map.warga` (27 warga, nama + nomor + peran + status_teks,
  tanpa usia/jabatan Raja). Daftar menu dan isi modal dari
  laporan itu TIDAK dipakai di entri ini; kemungkinan alat
  browser mengamati tab/sesi lain. Panel "Kampung menginginkan"
  yang tidak terlihat di laporan itu juga tidak disimpulkan
  apa-apa — panel itu ada di kode menu dan terverifikasi
  terlihat di run 08:29/10:29/12:29/14:29.
- Catatan data live (BUKAN dari laporan browser): pembacaan
  /api/world lewat text-fetch run ini memberi salinan CACHE
  20 menit (r22, H-276, pangan 632.266) — TIDAK dipakai sebagai
  keadaan live saat ini. Sementara itu, catatan memori terpisah
  yang masuk saat run ini berjalan mengonfirmasi dari DUA
  pembacaan independen: stok live kini ~0 (kayu 1, batu 1,
  emas 1, besi 1, pangan 0, kulit 1; kapasitas tetap). Itu BUKAN
  efek pembusukan r23 (lantainya di kapasitas, tidak pernah 0)
  dan tidak ada mekanik belanja massal/endpoint reset di kode —
  penyebab pengosongan masih diselidiki di jalur lain, rollback
  kode tidak mengembalikan stok, dan cron ini DILARANG menulis
  DB sehingga tidak mengambil tindakan apa pun atas stok.
  Perubahan run ini (fallback muat, display-only) tidak
  menyentuh sim/stok sama sekali.

### Riset + backlog (brief research/2026-11-04-1629.md)
- Sudut: KEMBALI BERMAIN / rekap (rotasi dari UX 14:29). Sumber:
  Plai: Village Tale (kronik kampung satu baris + produksi
  dibatasi 8 jam lalu warga "jujur tidur"), Knightfall Idle
  (dunia bersama persisten, waktu pergi disimulasikan saat
  kembali, cap 8 jam), studi engagement idle game (kejar
  ketertinggalan lebih cepat terasa memuaskan, tapi angka
  harus jujur sesuai ekspektasi).
- Ide 22 ("Selama kamu pergi" di kartu menu, display-only dari
  snapshot localStorage vs poll terbaru, maks 3 baris, tanpa
  hadiah offline) dan Ide 23 (kronik kampung satu baris dari
  data poll, bukan LLM) masuk IDE-FITUR.md. Tidak
  direkomendasikan: hadiah offline/klaim sumber saat kembali
  (menggandakan stok di dunia bersama), cap 8 jam untuk sim
  (sim server tidak pernah tidur), rekap berbasis LLM tiap
  kunjungan (boros + rawan mengarang peristiwa).
- Irisan run ini dari backlog Ide 7 (bukan dari brief ini) —
  brief ini jadi antrean berikutnya.

## 2026-11-04 16:45 WIB — Kelangkaan realistis: kumpul sangat susah + pembusukan stok (perintah user)

Keluhan user 16:14 WIB: makanan 400 ribu jam 10 jadi 600 ribu,
"terlalu gampang nyarinya", minta dibuat sangat susah mengikuti
dunia nyata — padahal semua stok sudah ratusan ribu. Cek live
16:18 WIB membenarkan: kayu 13.648/740, batu 21.337/630, emas
2.096/210, besi 2.522/265, pangan 632.260/850, kulit 12.265/425.

Temuan akar: ledger kumpul harian (`kumpul_hari`/`kumpul_harian`)
TIDAK PERNAH tersimpan di bulkWrite `advanceWorld`, jadi cap harian
reset tiap poll (3 detik) dan tiap poll memberi jatah penuh lagi —
itulah yang dulu menumpuk stok sampai ratusan ribu walau clamp
gudang sudah ada. Semua jalur tambah sudah diperiksa: tidak ada
yang lolos clamp, jadi gunung stok sekarang adalah warisan
pra-clamp, bukan pertumbuhan baru — tapi tanpa pembusukan ia tidak
akan habis dimakan 27 warga.

- `src/lib/batu/sim.ts`: roll baru — biasa 0/1/2/3 = 45/35/15/5%
  (rata-rata 0,8, dulu 1,7; hari tanpa hasil kini normal); besi
  biasa 80/17/3% (rata-rata 0,23) dan berbakat 70/25/5% (0,35);
  emas 75/20/5% (0,30). Bump bakat hanya untuk sumber biasa, tetap
  di dalam cap. Fungsi baru `terapkanPembusukan`: tiap ganti hari
  game, kelebihan di atas kapasitas susut — pangan 50%/hari,
  kayu/batu/kulit 10%/hari, emas/besi 0% — plus kabar bila pangan
  busuk >= 100. BulkWrite kini menyimpan `kumpul_hari` +
  `kumpul_harian` (perbaikan akar). Cap harian 3/2 dan aturan
  lapar/makan tidak diubah.
- `src/lib/version.ts`: BUILD_ID r22 -> r23.
- Tes: 12 penjaga baru (distribusi roll baru + hari-nol, pembusukan
  per sumber + stok dalam kapasitas aman, bulkWrite menyimpan ledger,
  advanceWorld memanggil pembusukan). Hasil: 7737 lolos / 656 gagal
  — himpunan gagal IDENTIK dengan baseline (stash comparison), nol
  regresi.
- Observasi: menu live 16:14 WIB (tangkapan layar user) normal,
  desa hidup, panel "Kampung menginginkan" menampilkan ujung tangga
  (Tugu Leluhur Agung menanti). Verifikasi pasca-deploy menyusul
  di entri berikut.

## 2026-11-04 14:29 WIB — Papan Warga satu layar di kartu menu (Ide 18)

Satu entri baru "👥 Papan Warga" di kartu menu (☰) yang membuka daftar
seluruh warga dalam satu layar — jawaban untuk keluhan berulang di
observasi: siapa sedang apa hanya bisa diketahui dengan mengetuk warga
satu per satu di peta atau membaca label kecil yang berdesakan dan
tumpang tindih di tengah yang ramai.

- `src/app/page.tsx`: state `showPapanWarga` + entri menu (setelah
  Inventori) + modal papan. Daftar dirender dari `map.warga` yang SUDAH
  diambil poll — tanpa fetch baru, tanpa ubah sim, display-only di luar
  ketuk baris. Tiap baris: nama (nomor), peran diformat, status/aktivitas
  saat ini (`status_teks`); ketuk baris menutup papan lalu membuka panel
  detail warga yang sudah ada (`detailWarga`, pola daftar -> detail dari
  riset). Panel Warga lama TIDAK diganti: papan ini hanya pintu masuknya.
  Tutup lewat ✕, ketuk latar, ATAU tombol Tutup di bawah daftar
  (jangkauan jempol, Ide 21). Kosong saat peta belum termuat: satu baris
  "Belum ada data warga — tunggu peta termuat."
- `src/app/globals.css`: `.papan-warga-list/.papan-warga-row/.papan-warga-nama/
  .papan-warga-status/.papan-warga-tutup` — baris minimal 48px dengan jarak
  6px antar baris (Ide 20: patokan target sentuh Android + jarak antar
  target, teks nama 13px sama seperti judul menu). Modal memakai
  `overlay-full` + `modal-box` yang sudah bisa scroll, jadi daftar 27
  warga tidak membuat halaman meluber.
- `src/lib/version.ts`: BUILD_ID r21 -> r22.
- Tes: 9 penjaga statis baru (state + entri menu, daftar dari map.warga,
  tanpa fetch di blok papan, ketuk baris -> tutup + detailWarga, tombol
  Tutup, peran diformat, CSS baris 48px + CSS Tutup). Tiga penjaga versi
  lama diperbarui r21 -> r22 (mekanisme bump yang disengaja, seperti run
  sebelumnya). Total: 7725 lolos / 656 gagal — baseline 7716/656, jadi +9
  lolos, nol regresi baru (656 = baseline lama yang sudah merah sebelum
  perubahan ini; runner tsx, karena node murni gagal di impor tanpa
  ekstensi di tree ini). Build Next.js hijau.
- Catatan kejujuran: penampakan visual papan di live BELUM terverifikasi
  (observasi run ini hanya melihat, tidak mengklik entri baru karena
  entri itu baru ada setelah deploy ini) — verifikasi visualnya jadi
  tugas observasi run berikutnya, bukan diklaim di sini. Yang
  terverifikasi run ini adalah datanya: /api/map live memuat warga
  dengan field persis yang dipakai papan (nama, nomor, peran,
  status_teks; contoh warga pertama Joel 0001 penebang
  "Jalan-jalan…", kedua Nana 0002 penjaga_api "Makan di paviliun…")
  dan TIDAK ada `label_peran` — karena itu peran diformat pakai
  `formatLabel` seperti panel Warga yang sudah ada.

### Observasi live (browser, hanya melihat, 14:30-14:37 WIB)
- Muat pertama: frame gelap kosong sesaat tanpa teks, lalu langit +
  "Memuat peta 3D…"; desa tampil dalam ~1 menit (bukan hitungan detik
  seperti run 02:29, bukan 1-2 menit seperti run 04:29 — dicatat sebagai
  variasi sesi/cache, bukan klaim perbaikan maupun regresi).
- Desa hidup: posisi warga berubah antar tangkapan, bubble obrolan
  berganti pembicara dan kalimat; hewan terlihat berlabel (Rusa,
  Kelinci, Ayam Hutan, Serigala, Beruang). Tidak ada warga yang tampak
  beku total atau indikator error; tapi banyak warga tampak berkeliaran
  di padang terbuka jauh dari rumah tanpa tujuan tugas yang kelihatan —
  tampilan diam, bukan bukti sim menganggur (sim jalan di server).
- Tombol utuh, tidak terpotong/tumpang tindih: ☰ kanan-atas, "＋ Tambah
  karakter" kanan-bawah, "🎮 Panduan Kontrol" kiri-bawah; menu terbuka
  bisa di-scroll dan entri-entrinya terjangkau. Satu kejadian sesaat:
  dua ketukan tombol tutup menu mengembalikan "page_busy" (batas alat
  browser) dan Escape tidak menutupnya, ketukan ketiga berhasil —
  dicatat sebagai gangguan alat, bukan bug situs yang terbukti.
- Panel "🎯 Kampung menginginkan" TERLIHAT dan isinya KONSISTEN dengan
  kode: "Kampung sudah sampai ujung tangga — Tugu Leluhur Agung menanti
  sebagai bukti kampung besar." TIDAK ada baris tugas/progress
  (makan/tombak/rumah) di dalam panel ini saat dicek — jadi temuan
  "tugas 2/20, 0/2, 0/1" dari run 12:29 TIDAK terulang dan tetap tidak
  terjelaskan dari observasi saja; kemungkinan run itu membaca panel
  lain, dan hal itu dicatat, bukan diklaim bug.
- PERINGATAN KEJUJURAN OBSERVASI: daftar entri menu yang dilaporkan
  alat browser run ini (Gacha, Event, Beli Emas, Toko, dst.) TIDAK
  COCOK dengan kode menu di tree maupun rilis r21 yang terverifikasi
  lewat /api/version — daftar itu TIDAK dipakai di entri ini.
  Yang dipakai dari observasi hanya butir-butir yang konsisten dengan
  kode/API di atas. "Papan Warga" sendiri dipastikan belum ada lewat
  kode (grep: tidak ada string itu di page.tsx sebelum run ini),
  bukan lewat daftar menu laporan tersebut.
- API live pra-deploy (bukan hanya status): /api/version = r21 (cocok
  HEAD lokal ed82341); /api/world ok (Suka Maju, populasi 27, H-269,
  11.53 Siang, Cerah); /api/map ok (warga + field seperti di atas).
  Stok live masih meluber dari data lama (mis. pangan 590.000 vs kap
  850) — sudah diketahui, clamp kode hanya mencegah penambah baru,
  dan cron dilarang menulis DB, jadi dicatat saja.

### Riset + backlog (brief research/2026-11-04-1429.md)
- Sudut: UX (rotasi dari FITUR BARU 12:29). Sumber: Wandr (aksi utama
  di sepertiga bawah, target sentuh + jarak antar target, umpan balik
  jangan di bawah jari, pengurangan bukan pemadatan, jalan keluar panel
  jangan hanya pojok atas) + panduan pemula Foundation di Steam
  (daftar warga satu tempat: pekerjaan + status, klik warga -> detail).
- Ide 18 dibangun run ini; Ide 20 (baris berjarak) dan Ide 21 (tombol
  tutup terjangkau) diterapkan di dalamnya + dicatat sebagai pola untuk
  panel berikutnya. Tidak direkomendasikan: kolom statistik padat ala
  desktop di daftar, mengganti panel Warga yang ada, filter/sortir
  lanjutan di rilis pertama.


### Verifikasi pasca-deploy (16:15-16:21 WIB, hanya melihat)
- Homepage termuat normal (judul "Negara Emas — Zaman Batu", layar
  "Memuat peta 3D…" lalu desa 3D penuh, tanpa blank/error).
- /api/map ok: 27 warga (0001-0027; pertama Joel 0001 penebang).
- /api/bangunan ok: katalog ada (Gubuk, tenda_kulit, api_unggun,
  lumbung, bengkel_batu, dst.) + antrean tidak kosong (entri selesai
  100% di depan). Tidak ada regresi API setelah deploy ini.
- VISUAL TERKONFIRMASI SEBAGIAN: entri "Papan Warga" kini ADA di kartu
  menu ☰ (menu dibuka, dilihat, ditutup lagi). Isi daftar di dalam
  modalnya sendiri belum diketuk/dilihat — entri itu sengaja tidak
  diketuk pada verifikasi ini — jadi penampakan daftarnya tetap jadi
  tugas observasi run berikutnya, tapi keberadaan entrinya sudah
  bukan lagi klaim tanpa bukti.

## 2026-11-04 12:29 WIB — Jeda poll data saat tab disembunyikan (Ide 17)

Pasangan dari jeda loop render (Ide 9): poll data `/api/world`,
`/api/map`, `/api/bangunan` kini berhenti saat tab tidak terlihat,
lalu dilanjutkan lagi saat kembali dengan satu fetch segar.

- `src/app/page.tsx`: effect poll mendapat listener
  `visibilitychange` — hidden -> interval dibersihkan + ref
  di-null-kan (penjaga anti interval ganda); visible -> `muat()`
  segar dulu, baru interval 3 detik dimulai lagi. Alasan fetch
  segar dulu: jam game jalan di server selama tab hidden, jadi
  menunggu interval berikutnya akan menampilkan dunia tertinggal.
  Interval label jam 1 detik TIDAK dijeda (murah, dan label jam
  harus tetap benar saat kembali). Sim tidak ikut dijeda: dunia
  bersama tetap jalan untuk semua orang.
- `src/lib/version.ts`: BUILD_ID r20 -> r21 (pil "Versi baru" bisa
  membedakan rilis ini). Tiga penjaga tes yang mengunci string r20
  ikut diperbarui ke r21 — itu mekanisme bump yang disengaja,
  bukan regresi (pelajaran run ini: penjaga versi tersebar di tiga
  tempat di tests/batu.test.ts, bukan satu).
- Tes: 5 penjaga statis baru (effect poll ada, listener dipasang,
  hidden -> bersih + ref null, visible -> fetch segar + mulai lagi,
  listener dilepas). Total: 7716 lolos / 656 gagal — baseline
  7711/656, jadi +5 lolos, nol regresi baru. Sempat terlihat
  7714/658 sebelum dua penjaga r20 lama diperbarui, dan perbandingan
  daftar FAIL membuktikan 2 selisih itu persis dua penjaga r20
  tersebut (bukan efek perubahan poll).
- Build Next.js hijau.
- Catatan kejujuran: penghematan ini kecil dalam hitungan request
  (poll hanya tiap 3 detik, dan browser modern sudah men-throttle
  interval di tab hidden) — nilainya ada di berhentinya fetch yang
  tidak dilihat siapa pun dan kembalinya UI yang langsung segar.
  Efek kuota/baterai tidak diukur dan tidak diklaim.

### Observasi live (browser, hanya melihat, 12:29-12:33 WIB)
- Muat pertama: frame pertama gelap kosong tanpa teks/spinner/
  pesan muat apa pun (hanya tombol menu, "Panduan Kontrol", dan
  "＋ Tambah karakter"); desa tampil pada pengecekan 30 detik
  berikutnya — jadi tampil dalam jendela 30 detik pertama, bukan
  klaim "30 detik persis". Frame gelap tanpa indikator ini masih
  menjadi pekerjaan Ide 7 (layar muat jujur), belum diklaim bug.
- Desa hidup: malam lalu siang, warga bernama terlihat (Figo, Nuna,
  Renata, Jokowi, Gibran, Siti, Wahid, Bajir) dengan bubble obrolan
  berganti ("Makan bersama!", ajakan gotong royong, ajakan ke
  hutan); label + bubble berpindah antar pengecekan 30 detik.
  Hewan terdaftar (Rusa, Kelinci, Ayam Hutan) tapi sprite-nya kecil
  dan jauh sehingga gerakannya kurang jelas dibanding warga.
- Menu ☰: terbuka dan tertutup normal; tidak ada tombol yang tidak
  merespons. Label + bubble kadang tumpang tindih di tengah yang
  ramai (sekitar Renata/Jokowi) — dicatat sebagai kerapian label,
  bukan error. Baris "Orientasi" di bawah lipatan dengan scrollbar
  = scroll normal, bukan terpotong.
- Panel "🎯 Kampung menginginkan" TERLIHAT, tapi isinya BERBEDA dari
  run sebelumnya: kini menampilkan "Makan bersama untuk naikkan
  mood" 2/20, "Rakit 2 tombak" 0/2, "Bangun 1 rumah" 0/1 — bukan
  lagi teks "sampai ujung tangga". Penyebab perbedaan ini tidak
  terjelaskan dari observasi saja (kemungkinan panel menampilkan
  tugas/misi di samping kebutuhan tangga); dicatat sebagai hal
  yang perlu dicek run berikutnya, bukan diklaim bug maupun
  perubahan diam-diam. Baris "Mulai dari sini" TIDAK ADA — masih
  konsisten dengan by design run 08:29/10:29 (fungsi sengaja null
  di ujung tangga), tapi mengingat isi panel yang berubah, status
  "ujung tangga" desa live ini perlu dikonfirmasi ulang lewat
  /api/map pada verifikasi pasca-deploy run ini.
- Tidak ada area blank/error menetap setelah desa tampil.

### Riset + backlog (brief research/2026-11-04-1229.md)
- Sudut: FITUR BARU (rotasi dari PERFORMA 10:29). Sumber: Farming
  Season "Village Seasons" (ganti musim visual: semi berbunga,
  gugur emas, dingin bersalju — murni visual menurut sumbernya),
  Village in the Shade update #2 (event ulang tahun protagonis di
  tahun ke-2 + hadiah dari warga berafinitas >= 3), ulasan Houston
  Press (peta satu layar berisi info setiap warga dipuji karena
  menghormati waktu pemain), panduan ASKA (jadwal Kerja/Santai/
  Tidur; jadwal default yang terlalu banyak kerja membuat AI bodoh).
- Ide 18 (Papan Warga satu layar, display-only dari data /api/map
  yang sudah diambil) dan Ide 19 (musim visual kampung, display-only
  tanpa efek ekonomi sim) masuk IDE-FITUR.md. Tidak
  direkomendasikan: jadwal warga diatur pemain (mengubah pengamat
  jadi manajer), aturan horor larangan keluar malam, event ulang
  tahun per warga (sim tidak menyimpan tanggal lahir).
- Irisan run ini dari backlog Ide 17 (brief performa 10:29), bukan
  dari brief fitur baru ini — brief ini jadi antrean berikutnya.

## 2026-11-04 10:29 WIB — Jeda loop render saat tab disembunyikan (Ide 9)

Loop render 3D utama di `src/components/Map3D.tsx` kini dijeda
eksplisit saat tab tidak terlihat, lalu dilanjutkan lagi saat
kembali — tanpa menyentuh sim atau data apa pun.

- `Map3D.tsx`: listener `visibilitychange` — hidden ->
  `cancelAnimationFrame(raf)`, raf = 0; visible -> reset
  `last = performance.now()` lalu `requestAnimationFrame(loop)`
  lagi, hanya bila raf = 0 (penjaga anti loop ganda); listener
  dilepas di cleanup unmount. Sim TIDAK ikut dijeda: jam game
  jalan di server, jadi saat kembali desa tampil di waktu
  server terbaru, bukan waktu yang tertinggal.
- `src/lib/version.ts`: BUILD_ID r19 -> r20 (menutup celah
  run sebelumnya: pil "Versi baru" kini bisa membedakan rilis
  ini). Dua penjaga tes lama yang mengunci string r19 ikut
  diperbarui ke r20 — itu mekanisme bump yang disengaja,
  bukan regresi.
- Tes: 5 penjaga statis baru (listener dipasang, hidden ->
  cancel, visible -> mulai lagi hanya bila raf 0 + reset
  timestamp, listener dilepas, BUILD_ID r20). Total: 7711 lolos
  / 656 gagal — baseline 7706/656, jadi +5 lolos, nol regresi
  baru (656 gagal = baseline lama; sempat terlihat 7709/658
  sebelum bump tes r19 diperbarui, dan perbandingan FAIL
  membuktikan 2 selisih itu persis dua penjaga r19 tersebut).
  Build Next.js hijau.
- Catatan kejujuran: browser modern SUDAH menahan RAF di tab
  hidden, jadi penghematan tambahan ini kecil — nilainya ada
  di frame basi yang dibatalkan eksplisit, pencegahan loop
  ganda, dan reset timestamp anti-lompatan. Efek baterai tidak
  diukur di sini dan tidak diklaim. Ide 17 (jeda poll data saat
  hidden) masuk backlog, tidak dibangun run ini.

### Observasi live (browser, hanya melihat, 10:30-10:46 WIB)
- Muat pertama: tampilan awal gelap/kosong, lalu langit +
  "Memuat peta 3D…" tanpa persentase; desa tampil penuh dalam
  <60 detik (lebih lambat dari <30 detik run 08:29 — dicatat
  sebagai variasi sesi/cache, bukan klaim perbaikan maupun
  regresi; tidak ada error saat muat).
- Desa hidup: jam game berjalan (12.24 Siang -> 19.15 Sore,
  Berawan, H-253), posisi warga + hewan berubah antar
  tangkapan (Figo, Gibran, Joel, Wahyu, Jarvis, Bajir, Wahid,
  Hina, Sagita, Nuna, Nura, Pinka; hewan Kucing, Anjing, Ayam,
  Kambing). Di tampilan diam, warga tampak kecil dan tidak
  terlihat jelas sedang bekerja — terkesan mondar-mandir /
  idle di sekitar gubuk, dengan label mood ("Nyaman", "Lapar")
  dan bubble obrolan. Ini tampilan diam, bukan bukti warga
  tidak bekerja (sim jalan di server).
- Geser peta: drag pan selesai tanpa robek/beku/stutter yang
  terlihat di frame diam; zoom lewat scroll tidak terverifikasi
  jelas dari tangkapan. Jeda panjang selama observasi sebagian
  adalah jeda tangkapan alat browser (~8 detik per aksi),
  bukan lag game yang terbukti.
- Menu ☰: terbuka lewat ketukan langsung di lingkaran kanan
  atas (klik via referensi tombol berulang kali "page_busy" =
  batas alat browser, bukan bug situs; glif ☰ tampak kotak
  kecil emas di tangkapan = artefak render tangkapan, bukan
  bukti ikon rusak). Panel "🎯 Kampung menginginkan" TERLIHAT
  (ujung tangga, Tugu Leluhur Agung menanti). Baris "Mulai
  dari sini" TIDAK ADA — KONSISTEN dengan by design run
  08:29: desa live sudah di ujung tangga (populasi 27,
  paviliun + balai + dapur + bengkel berdiri) sehingga fungsi
  sengaja mengembalikan null. Entri "Festival Esok" +
  "Pustaka Leluhur" terlihat di satu pembukaan menu lalu tidak
  di pembukaan berikutnya — penyebabnya tidak terjelaskan dari
  observasi saja; dicatat sebagai hal yang perlu dicek run
  berikutnya, bukan diklaim bug.
- Tidak ada area blank/error menetap; tombol bawah "Panduan
  Kontrol" dan "＋ Tambah karakter" tetap terlihat, tidak
  tertutup.

### Riset + backlog (brief research/2026-11-04-1029.md)
- Sudut: PERFORMA (rotasi dari AUDIO 08:29). Sumber: Spicy
  Yoghurt (game loop + Page Visibility: pause saat hidden,
  resume dengan timestamp segar), Codrops (Three.js: frameloop
  'never' saat hidden, lepas listener saat cleanup), Reintech
  (cancelAnimationFrame + id null cegah frame menumpuk).
- Ide 9 dibangun run ini; Ide 17 (jeda poll data saat hidden)
  masuk IDE-FITUR.md. Tidak direkomendasikan: menghentikan sim
  server saat tab hidden (dunia bersama akan membeku untuk
  semua orang), klaim hemat baterai tanpa pengukuran, dan
  IntersectionObserver untuk kanvas fullscreen (tidak menambah
  sinyal dibanding visibilitychange).

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
