# CHANGELOG Nusantara

## 2026-11-05 — r38: perburuan yang benar-benar membunuh, semua warga bisa berburu, kumpul jalan lagi, satu sumber kebenaran petak (laporan user 2026-11-05 ~13:48 WIB, video + chat)

Perubahan dalam 2 kalimat: pemburu kini aktif mencari mangsa
(radius 40 tile), berlari mengejar (1.5x), dan menyerang begitu
tiba di samping mangsa — sementara hewan jinak kabur dan
mengembara paling 30 tile/jam, jadi rusa tidak lagi lolos
selamanya dan HP-nya benar-benar berkurang sampai mati jadi
daging; di sisi lain, laju kumpul dikembalikan ke kontrak
(20 + 5*stat %/jam) supaya warga benar-benar mengumpulkan buah,
semua warga boleh menyerang hewan dekat dan berduel hewan buas,
dan penempatan + AI tata kota kini memakai satu helper petak
kanonik (ukuran dari baris, kalau tidak ada footprint katalog)
dengan penjaga akhir sebelum placement ditulis serta model
paviliun yang diskalakan pas footprint 8x8.

- `src/lib/batu/sim.ts`: `lajuKumpul` kembali ke `20 + stat*5`
  (dulu 0.25 + 0.05*stat: satu ronde butuh 150-300 jam game,
  warga diam di semak berhari-hari, pangan kampung 0).
- `src/lib/batu/sim.ts`: konstanta baru `JARAK_KABUR_JINAK` 30,
  `JARAK_CARI_MANGSA` 40, `JARAK_SERANG_OPORTUNIS` 3,
  `PENGALI_KEJAR` 1.5. `stepHewan`: hewan jinak kabur paling 30
  tile/jam (dulu 120-150) dan mengembara paling 30 tile/jam
  (dulu secepat larinya — ini akar yang terlewat di diagnosis
  awal: di jarak 10 tile rusa bahkan belum "kabur", ia
  mengembara 120 tile/jam keluar dari jangkauan cari).
  `stepPerburuan`: tanpa gate peran — pemburu mencari dalam 40
  tile dan berlari 1.5x lalu menyerang begitu tiba di samping
  mangsa di jam yang sama (dulu giliran habis hanya untuk
  berjalan, jadi mangsa yang kabur tiap jam tak pernah
  tersentuh); warga lain oportunis dalam 3 tile. Duel hewan
  buas di `stepHewan` terbuka untuk semua warga stamina >= 20
  (dulu hanya pemburu) — warga lemah tetap kalah lalu kabur.
- `src/lib/batu/dunia.ts`: helper petak kanonik baru
  `ukuranPetak` (w/h baris bila valid, kalau tidak footprint
  katalog, kalau tidak dikenal 1x1), `petakBangunan`,
  `occupiedDariPlacements`, `plotBebas`; `pasanganTumpuk`
  ditulis ulang di atasnya (dulu default w/h 1 di sim, 2 di
  rapikan/tatakota — dua sumber kebenaran, AI bisa berkata
  "tidak ada yang menumpuk" sementara bangunan menembus).
- `src/lib/batu/sim.ts`: semua konstruksi occupied/rintangan
  ad-hoc diganti helper kanonik (tileTamu, rintanganUntuk,
  tileHunian, rintangan advance, rencanaJalan, plot antrean)
  + PENJAGA AKHIR PETAK sebelum upsert placement selesai:
  bila satu ubin footprint sudah terisi, bangunannya batal
  dengan kabar jujur + biaya dikembalikan (bukan menumpuk).
- `src/app/api/gemini/rapikan/route.ts` + `tatakota/route.ts`:
  occupied dari helper kanonik + bangunan yang sedang DIBANGUN
  (koleksi `bangunan` status antre/dibangun, gx/gy sudah
  ditetapkan) ikut menghalangi — rapikan lama hanya memeriksa
  `peta_tile`, padahal yang user lihat kemungkinan bangunan
  yang sedang dibangun menembus restoran.
- `src/lib/batu/assetPaviliun3D.ts`: skala paviliun
  `min(w/32, h/28)` sesuai footprint (dulu tetap 0.88 ->
  ~28x24 unit, menelan bangunan tetangga secara visual meski
  petak tile-nya tidak tumpang). Konsekuensi jujur: paviliun
  jadi jauh lebih pendek/gemuk (lebar ~8 unit, tinggi ~3),
  bukan lagi landmark menjulang — bila ingin menjulang lagi,
  footprint katalognya yang harus diperbesar, bukan skalanya.
- `src/lib/version.ts`: BUILD_ID r37 -> r38.
- Tes: 20 penjaga baru r38 (pemburu kejar + bunuh rusa 10 tile
  dalam 4 jam, kabur <= 30, pengumpul serang rusa dekat + tidak
  mengejar yang jauh, pengumpul kuat duel serigala HP 8->7,
  lajuKumpul(8)=60, petakBangunan paviliun 64 / gubuk 4,
  pasanganTumpuk deteksi tanpa w/h + tanpa false-positive,
  plotBebas tolak/terima, paviliun tanpa skala 0.88) + tes r12
  (pengumpul vs serigala) diubah jadi warga LEMAH supaya
  cakupan "kalah lalu kabur" tetap ada + 11 pin versi r37 ->
  r38. Total: 7865 lolos / 645 gagal — baseline 7834/656,
  jadi +31 lolos, -11 gagal, NOL kegagalan baru. 11 tes lama
  yang berbalik lolos semuanya terkait lajuKumpul (laju 25-70,
  laju 999=5015, kumpul siang +60%, kumpul selesai ->
  kembali/tujuan hunian, paceklik progres 20->80 + kabar +
  lapar, bakat INT 60->66, node tumbang sisa 0 + lelah ->
  pulang, paceklik lapar). Tes model hasil lama (jumlahKumpul
  4-9, stok +45) tetap gagal sesuai desain: DESAIN-EKONOMI.md
  menetapkan roll 1-3/hari + cap 3, bukan model lama.
- Perilaku yang berubah dan dilaporkan eksplisit: hewan jinak
  bergerak paling 30 tile/jam (kabur + mengembara) sehingga
  lebih mudah ditemui di dekat kampung; semua warga bisa
  memburu/duel sehingga hewan buas (serigala/beruang) kini bisa
  dikalahkan warga kuat mana pun — ancaman hewan buas jadi
  lebih ringan; bila nanti beruang harus menakutkan lagi,
  ambang duel (14/18/22) yang perlu dinaikkan, bukan gate peran.

## 2026-11-05 12:29 WIB — Baris "Tonggak kampung" di kartu menu (Ide 29) + brief riset onboarding/prestasi

Perubahan dalam 2 kalimat: kartu menu kini menampilkan satu
baris ringkas "🏅 Tonggak kampung: N dari 7" berisi tonggak yang
sudah tercapai plus SATU berikutnya yang paling dekat, diturunkan
dari data poll yang sudah ada; display-only, tanpa hadiah
ekonomi dan tanpa ubah sim.

- `src/lib/batu/sumberdaya.ts`: fungsi murni baru `tonggakKampung`
  (populasi + jenis bangunan berdiri -> 7 tonggak dari tangga
  DESAIN-EKONOMI §2: Api pertama, Gubuk pertama, Lumbung berdiri,
  Populasi 10, Bengkel pertama (kayu ATAU batu), Balai berdiri,
  Paviliun makan berdiri; `berikutnya` = tonggak pertama yang
  belum tercapai, null bila semua tercapai; populasi tidak valid
  diperlakukan 0).
- `src/app/page.tsx`: baris `.menu-tonggak` di kartu menu, di
  bawah panel "Kampung menginginkan" + "Mulai dari sini",
  memakai placements + populasi yang sudah dihitung panel
  kebutuhan — tanpa fetch baru.
- `src/app/globals.css`: `.menu-tonggak` (+ title/isi) senada
  panel kebutuhan, tanpa animasi (patuh reduced-motion r31).
- `src/lib/version.ts`: BUILD_ID r36 -> r37. Build Next.js hijau.
- Tes: 14 penjaga baru (total 7, kampung kosong -> berikutnya
  api pertama, api saja -> berikutnya gubuk, ambang populasi
  9 vs 10, bengkel batu menghitung bengkel pertama, tangga
  penuh -> 7 + berikutnya null, populasi NaN -> 0, baris
  terpasang di page, CSS ada, BUILD_ID r37) + penjaga versi
  diperbarui r36 -> r37. Total: 7834 lolos / 656 gagal —
  baseline r36 7820/656, jadi +14 lolos, nol regresi baru
  (656 gagal yang sama adalah baseline lama; nol FAIL bertanda
  tonggak).
- Riset: brief research/2026-11-05-1229.md (sudut ONBOARDING +
  PRESTASI, rotasi dari performa 10:29) — Cities: Skylines II
  (milestone terlihat di panel progresi), panduan Android
  (tier + progres terukur yang terlihat + sebagian bisa dicapai
  sejam pertama), devlog Saltwick (tampilkan hitungan tiap yang
  terkunci + mana yang paling dekat), devlog Doomscroll 2077
  (angka mentah membosankan, butuh kait emosional — tonggak
  dinamai peristiwa, bukan angka). Tidak direkomendasikan:
  hadiah ekonomi per tonggak (dunia bersama, bisa digandakan),
  prestige/reset, dan puluhan achievement sekaligus.
- Sisa Ide 29 yang BELUM dibangun: kilas "Tonggak baru!" saat
  tonggak tercapai (butuh snapshot localStorage) + panel detail
  tonggak — keduanya antrean run berikut, bukan disisipkan ke
  run ini.

### Observasi live (browser, hanya melihat, 12:29-12:32 WIB)
- Muat pertama jujur, bukan blank: layar gelap "Memuat peta
  3D…" lalu desa penuh tampil sebelum cek 60 detik (detik
  persis tidak diukur — pengamatan selang 60 detik).
- Warga berlabel (Figo, Nera, Praboti, Siti, Budi, Renata, Ys,
  Go Younjung, dll) — posisi hanya bergeser sedikit antara cek
  60 dan 120 detik, mengelompok di sekitar gubuk/bangunan besar,
  tanpa aktivitas kerja yang jelas terlihat di zoom dan cahaya
  malam itu; paling tepat digambarkan pelan/mengelompok, bukan
  terbukti bekerja.
- Hewan ada lewat label (Rusa, Kelinci, Ayam Hutan, Serigala,
  Beruang) tapi modelnya kecil/gelap, sulit dibedakan dari
  terrain — identifikasi berbasis label, bukan close-up.
- Strip sumber TIDAK tampak di atas layar tanpa membuka menu
  (hanya tombol ☰ kanan-atas) — itu wajar sejak navbar dihapus
  (strip kini tinggal di dalam kartu menu), bukan regresi.
- Tidak ada error/blank; tombol tidak tumpang tindih; satu-satunya
  tumpang tindih adalah label nama warga yang berdesakan di dekat
  bangunan (mis. Go Younjung/Renata, Nera/Praboti, satu label
  terpotong "ribran gakabuming"); lahan hijau luas adalah terrain,
  bukan area kosong; keseluruhan adegan gelap/kontras rendah
  (malam game) sehingga detail sulit dibaca.

### Verifikasi live r37 (deploy auto dari main, commit 119438a)
- /api/version: {"ok":true,"build":"r37"}. Homepage 200
  (judul "Negara Emas — Zaman Batu" + cangkang "Memuat peta
  3D…") dan ikon /batu/icons/kayu.png 200.
- /api/world ok: kampung Suka Maju, populasi 12, hari 362,
  11.50 Siang, Cerah; stok kayu 149/160, batu 6/130, emas 1/40,
  besi 47/55, pangan 0/200, kulit 92/95 — semua di dalam
  kapasitas, tidak ada regresi stok dari deploy ini.
- /api/map ok: 12 warga, 14 placements. /api/bangunan ok:
  katalog lengkap diawali Gubuk.
- Baris tonggak baru belum diverifikasi visual di browser
  (butuh buka kartu menu — observasi run ini hanya melihat
  tanpa klik); yang terverifikasi adalah kode + tesnya, dan
  pil "Versi baru tersedia" akan membedakan r37 dari r36.
  Verifikasi visual menyusul observasi run berikut.


Perubahan dalam 2 kalimat: `disposeGroup` di Map3D kini melewati
material cache bersama desa dan jalan yang dipakai ulang tiap
rebuild, sehingga rebuild bangunan/jalan tidak lagi membuang lalu
mengunggah ulang shader/program yang sama; geometri per build
tetap dibuang, dan cleanup unmount tetap membuang semua saat
komponen benar-benar lepas.

- `src/lib/batu/assetVillage3D.ts`: predikat baru
  `isVillageMaterial` (membaca `Object.values(getVillageMats())`,
  cache module-level 12 material, bukan daftar baru).
- `src/lib/batu/assetRoad3D.ts`: predikat baru `isRoadMaterial`
  (pasangan untuk cache 10 material jalan).
- `src/components/Map3D.tsx`: `disposeGroup` membuang geometri
  seperti biasa, tapi material hanya dibuang bila BUKAN
  `isVillageMaterial` dan BUKAN `isRoadMaterial`; traverse cleanup
  unmount di akhir komponen SENGAJA tidak diubah (di sana semua
  material tetap dibuang, karena komponen benar-benar dilepas —
  bukan rebuild). Sim, ekonomi, dan tampilan tidak berubah.
- `src/lib/version.ts`: BUILD_ID r35 -> r36. Build Next.js hijau.
- Tes: 10 penjaga baru (2 predikat diekspor, predikat membaca
  cache, disposeGroup melewati material bersama + tetap buang
  geometri, unmount tetap buang semua, 3 uji runtime predikat
  dengan material baru, BUILD_ID r36) + 8 penjaga versi
  diperbarui r35 -> r36. Total: 7820 lolos / 656 gagal —
  baseline r35 7810/656, jadi +10 lolos, nol regresi baru
  (656 gagal yang sama adalah baseline lama).
- Riset: brief research/2026-11-05-1029.md (sudut PERFORMA,
  rotasi dari ekonomi/sim 08:29) — forum three.js (jangan dispose
  geometri bersama internal), StudyRaid (lewati yang bertanda
  bersama saat cleanup), good.vibes.diy (dispose material bersama
  tepat sekali saat cleanup, bukan tiap rebuild), dev.to
  (renderer.info.memory sebagai pengukur kebocoran).
  Tidak direkomendasikan: membiarkan dispose semua tiap rebuild,
  menghapus dispose sama sekali, dan migrasi WebGPU/hapus bayangan
  tanpa baseline.
- Sisa celah audit r34 yang BELUM ditutup run ini: geometri per
  placement belum dibagi, dan padi sawah per rumpun (kandidat
  instancing pertama) — keduanya antrean run berikut, bukan
  disisipkan ke run ini.

### Observasi live (browser, hanya melihat, 10:29-10:32 WIB)
- Muat pertama: layar gelap "Memuat peta 3D…" dulu, desa penuh
  dalam <30 detik, tanpa error/blank menetap.
- Sim hidup, bukan gambar statis: jam game 19:33 -> 19:38 lalu
  ganti hari 06:15, label nama warga berpindah antar tampilan,
  bubble obrolan berganti, angka stok berubah.
- Hewan terlihat lewat label + figur kecil: Rusa, Kelinci, Ayam
  Hutan, Beruang (identifikasi spesies berbasis label, bukan
  close-up — dicatat jujur).
- Tombol/panel yang dites merespons: kartu Menu Kampung buka/
  tutup bersih, zoom ▲/▼ membesar-mengecil normal; panel menu
  yang terbuka menutupi tengah desa (redup di belakangnya) tapi
  menutup bersih. "Tambah karakter" dan "Panduan Kontrol" TIDAK
  diklik (di luar batas hanya-melihat), jadi fungsinya tidak
  terverifikasi run ini. Tidak ada area blank/error; lahan hijau
  luas di barat adalah terrain jarang bangunan, bukan panel
  kosong.
- Data menu: desa "Emas" (bukan "Suka Maju" seperti bacaan API
  run-run sebelumnya — dicatat apa adanya, bukan diklaim ganti
  nama; bisa jadi panel yang dibaca berbeda), populasi 12
  (Pekerja 4, Pengangguran 8), Hari ke-348 19:35 Malam -> Hari
  ke-349 06:15 Pagi, Cerah, Musim Kemarau.
- Stok: Kayu 159/160 -> 157/160, Batu 10/130 -> 14/130, Emas
  1/40, Besi 47/55, Pangan 0/200, Kulit 96/95 -> 93/95.
  Kulit yang semalam masih di atas kapasitas kini turun ke
  bawah kapasitas — searah pembusukan minimal-1 r35, BUKAN hasil
  run ini (run ini belum deploy saat observasi, dan hanya
  menyentuh dispose render).

### Verifikasi live r36 (deploy READY dpl_6GZzCcHQzviQ9HU3hfJ2PkpxDKiS, commit 400a324)
- /api/version: {"ok":true,"build":"r36"}. Homepage 200
  (judul "Negara Emas — Zaman Batu" + cangkang "Memuat peta
  3D…") dan ikon /batu/icons/kayu.png 200 (128x128).
- /api/world ok: kampung Suka Maju, populasi 10, hari 350,
  11.28 Siang, Cerah; stok kayu 157/160, batu 14/130, emas 1/40,
  besi 47/55, pangan 0/200, kulit 93/95 — cocok dengan tren
  observasi (kayu 157, kulit 93) dan di bawah kapasitas.
- /api/map ok (grid 600x600 + node pohon/semak/buruan/batu/
  urat emas-besi) dan /api/bangunan ok (katalog 26 jenis +
  antrean, paviliun makan masih antre kurang batu 6).
- TIDAK ADA regresi API setelah deploy ini (semua route yang
  tadinya ok tetap ok dengan isi yang konsisten). Perubahan ini
  hanya menyentuh dispose render, jadi tidak menyentuh sim/API
  sama sekali.
- Catatan selisih (jujur, bukan akibat deploy): panel menu saat
  observasi menyebut populasi 12 dan nama "Emas", sementara
  /api/world menyebut populasi 10 dan kampung Suka Maju —
  panel kemungkinan menampilkan nama dunia ("Negara Emas")
  dan hitungan yang berbeda dari API; API dijadikan acuan dan
  selisih ini dicatat untuk dicek lagi, bukan diklaim bug.

## 2026-11-05 08:29 WIB — Pembusukan sisa kecil tidak lagi macet (antrean r34) + brief riset ekonomi/sim

Perubahan dalam 2 kalimat: `terapkanPembusukan` kini membusukkan
minimal 1 unit per hari selama stok masih di atas kapasitas,
sehingga kelebihan kecil yang dulu dibulatkan ke nol akhirnya
susut sampai tepat ke kapasitas; laju persenan DESAIN-EKONOMI.md
(50% pangan, 10% kayu/batu/kulit, 0% emas/besi) dan stok dalam
kapasitas tidak berubah sama sekali.

- `src/lib/batu/sim.ts`: `hilang = Math.max(1, Math.floor(kelebihan
  x laju))` + komentar akar masalah. Contoh yang diperbaiki:
  kulit 104/95 (kelebihan 9 x 10% = 0,9 -> dulu 0/hari, selamanya)
  kini susut 1/hari dan sampai ke 95 dalam 9 hari game; begitu
  juga pangan 851/850 dan kayu 205/200.
- `tests/batu.test.ts`: 5 tes baru (kulit 104/95 susut 1 lalu
  konvergen tepat ke 95 dalam 20 hari tanpa turun di bawahnya;
  pangan 851/850 -> 850; kayu 205/200 susut 1) + penjaga versi
  r34 -> r35. Total: 7810 lolos / 656 gagal — baseline r34
  7805/656, jadi +5 lolos, nol regresi baru.
- `src/lib/version.ts`: BUILD_ID r34 -> r35. Build Next.js hijau.
- Riset: brief research/2026-11-05-0829.md (sudut ekonomi/sim,
  rotasi dari performa 06:29) — Utopia (busuk % dari total stok,
  tak pernah nol), FreeCol (cap keras: kelebihan langsung hilang,
  DITOLAK karena menghapus stok warisan seketika), Medieval
  Dynasty (busuk bertahap + dialihkan jadi pupuk), Northgard
  (pesta sebagai saluran buang berguna). Backlog baru: Ide 31
  (pesta kampung pemicu stok) di IDE-FITUR.md, belum dibangun.
- Catatan: run ini dimulai dari tree kotor yang ternyata persis
  isi commit r34 yang sudah live (d287e2a + 212445f) — tree
  di-reset ke origin/main sebelum edit, jadi tidak ada pekerjaan
  sesi lain yang ikut ter-push.

### Observasi live (browser, hanya melihat, 08:30-08:33 WIB)
- Muat pertama: "Memuat peta 3D…" lalu desa penuh tampil dalam
  30 detik (angka pasti tidak diukur detik per detik — jauh lebih
  ringan dari 60-90 detik pada observasi 2026-11-04 00:29, tapi
  jangan diklaim sebagai hasil perbaikan run ini karena run ini
  tidak menyentuh render).
- Panel Menu Kampung (08:32 WIB): "Kampung Negara Emas",
  Warga 9/17, Hari ke-4 12:44 Siang, Cerah, Kesehatan/Energi/
  Kebahagiaan 100%, Emas 200, Produktivitas 10/jam.
- Stok di panel: Pangan 1100/1500, Kayu 1189/1500, Batu
  1299/2000, Kulit 1275/1500 (semua di bawah kapasitas panel;
  angka kapasitas panel ini berbeda dari kap sim — dicatat
  apa adanya, bukan disamakan paksa). Laju panel: Kayu +120/jam,
  Batu +120/jam, Kulit +30/jam, Pangan -7/jam.
- Warga bergerak (posisi Siti, Renata, dll. berubah antar
  tampilan selama ~3 menit; adegan berganti malam -> siang),
  bukan beku; animasi kerja spesifik tidak terkonfirmasi dari
  tampilan diam, beberapa figur tampak berdiri dekat bangunan
  tengah di potret sesaat.
- Hewan terlihat jelas di tampilan zoom-out: Rusa, Kelinci,
  Ayam Hutan, Serigala, plus pohon/batu/node sumber.
- Panel Menu Kampung tampil penuh, buka/tutup normal; kontrol
  kamera ▲/▼, analog, "+ Tambah karakter", "Panduan Kontrol"
  terlihat penuh; ikon lingkaran pojok kanan-atas sangat dekat
  tepi layar tapi tidak menutupi apa pun (tidak diklik karena
  bisa mengubah state).
- Zoom kamera naik/turun merespons langsung, render ulang
  bersih tanpa stutter/ubin kosong yang terlihat; geser-drag
  sengaja tidak dites, jadi kelancaran drag + frame rate tidak
  terverifikasi. Tidak ada area blank/error setelah muat.
- CATATAN SELISIH (jujur, belum dijelaskan): panel menunjukkan
  Hari ke-4, padahal verifikasi r34 (06:29) mencatat hari 338
  dan desa Suka Maju — apakah dunia di-reset, atau panel yang
  dibaca adalah tampilan lain, belum bisa dipastikan dari
  observasi ini saja; tidak diklaim sebagai reset. Klik yang
  dilakukan browser hanya buka/tutup panel Menu Kampung
  (read-only) dan tombol zoom kamera; tidak ada profil, gacha,
  pengaturan, atau form yang diubah/dikirim.

### Verifikasi live r35 (deploy READY dpl_3KakiZ3kGhEE4d5UScjbxwaiMeEo, commit e339827)
- /api/version: {"ok":true,"build":"r35"}. Homepage 200
  (judul "Negara Emas — Zaman Batu" + cangkang "Memuat peta
  3D…") dan ikon /batu/gubuk.png 200 (128x128).
- /api/world ok: kampung Suka Maju, populasi 9, hari 342
  (hari_total 341), 09.55 Pagi, Cerah; stok kayu 176/160,
  kulit 104/95, pangan 0/200, batu 14/130, emas 1/40, besi
  47/55; kabar terbaru termasuk "Sebagian pangan membusuk
  (102 busuk)" hari 303 — sim jalan, tidak ada regresi API.
- /api/map ok (grid 600x600 + node pohon/semak/batu/urat)
  dan /api/bangunan ok (katalog + antrean, paviliun makan
  masih antre kurang batu 6). Tidak ada API yang tadinya ok
  berubah jadi error.
- Koreksi atas observasi browser: /api/world memastikan
  dunia ini Suka Maju hari 342, jadi "Hari ke-4" yang dibaca
  panel Menu Kampung di observasi bukan hari dunia — panel
  itu kemungkinan menampilkan angka lain (atau salah baca);
  API dijadikan acuan, dan selisih panel ini dicatat untuk
  dicek lagi, bukan diklaim sebagai reset dunia.
- Catatan jujur: kulit masih 104/95 saat verifikasi karena
  pembusukan baru berjalan tiap ganti hari game dan deploy
  baru saja live — penurunan 1/hari baru terlihat setelah
  pergantian hari berikutnya, bukan seketika saat verifikasi.

## 2026-11-05 06:29 WIB — Audit geometri/material bersama sebelum instancing (Ide 30) + brief riset performa

Perubahan dalam 2 kalimat: audit statis kode render 3D memastikan
pola baik yang sudah ada (node alam ter-instancing, material desa
di-cache, rebuild bergerbang signature) terkunci tes penjaga, dan
mencatat celah yang ditemukan sebagai prasyarat instancing
berikutnya; render, sim, dan ekonomi tidak diubah sama sekali.

- `tests/batu.test.ts`: 10 penjaga statis baru (helper
  `instanced()` ada; batang/tajuk pohon, semak, singkapan batu,
  urat emas/besi ter-instancing; cache `villageMats` module-level;
  `disposeGroup` traverse InstancedMesh + buang geometri; rebuild
  jalan bergerbang `jalanSig`) + 7 penjaga versi diperbarui
  r33 -> r34. Total: 7805 lolos / 656 gagal — baseline r33
  7795/656, jadi +10 lolos, nol regresi baru (656 gagal yang sama
  adalah baseline lama: r14/r15/r18, bukan dari run ini). Build
  Next.js hijau.
- `src/lib/version.ts`: BUILD_ID r33 -> r34.
- Backlog: Ide 30 dicatat DIBANGUN di IDE-FITUR.md; riset run ini
  menambah pembeda penting dari IGC: berbagi material saja TIDAK
  menurunkan draw call (hanya state change) — penurunan butuh
  instancing/merging/batching; dan pola dispose Glitchless
  ("lewati yang dibagi") sebagai syarat perbaikan dispose berikut.

### Temuan audit (prasyarat Ide 28, tanpa ubah render)
- SUDAH BENAR — node alam satu InstancedMesh per jenis: batang +
  tajuk pohon, semak, beri, padang buruan, singkapan batu, urat
  emas, urat besi. Ini kategori terbesar (node bisa ratusan) dan
  sudah 1 draw call per jenis, bukan per node.
- SUDAH BENAR — `assetVillage3D.ts` memakai cache material
  module-level (`villageMats`, 12 material) yang dibagi semua
  bangunan desa; dan rebuild bergerbang signature (mis. `jalanSig`)
  + `disposeGroup` traverse, jadi tidak ada rebuild tiap poll.
- CELAH — geometri TIDAK dibagi: tiap builder membuat geometri
  baru per placement (tiang pagar peternakan per tiang, tiang
  saung, dst.). Material dibagi tapi buffer geometri diduplikasi
  — bukan draw call ekstra (tiap mesh tetap 1 call), tapi beban
  GPU yang harus disatukan dulu sebelum instancing bangunan.
- CELAH TERBURUK — rumpun padi sawah: tiap rumpun = geometri BARU
  + material BARU (4 warna seharusnya 4 material bersama + 1
  geometri bersama, atau 1 InstancedMesh per warna). Sawah 8x8 =
  ratusan mesh; kandidat instancing pertama setelah node.
- CELAH — `disposeGroup` membuang JUGA material cache bersama
  (traverse memanggil `mat.dispose()` pada `villageMats`): Three
  mengunggah ulang saat render berikutnya, jadi bukan leak, tapi
  cache "dibuang + diunggah ulang" tiap rebuild bangunan — persis
  yang dilarang pola dispose Glitchless. Perbaikan (tandai
  material bersama, lewati di dispose) ditunda ke run berikut
  karena menyentuh jalur render.
- BUKAN KANDIDAT instancing — karakter: tiap warga ~15-25 mesh
  dengan geometri/material baru per warga, tapi butuh animasi
  pose per bagian; jalan keluarnya berbagi geometri per varian,
  bukan InstancedMesh. Bangunan butuh klik/raycast per objek, jadi
  untuk bentuk beda + satu material, BatchedMesh (IGC) lebih
  tepat daripada instancing; untuk yang statis total, merging.
- PENGALI BAYANGAN — aset desa mengaktifkan castShadow, jadi tiap
  mesh bisa 2+ draw call; tanpa baseline runtime Ide 27, angka
  total TIDAK diklaim.

### Observasi live (browser, hanya melihat, 06:32-06:35 WIB)
- Muat pertama tidak instan tapi tidak gagal: layar gelap
  "Memuat peta 3D…" dulu, desa terlihat pada cek berikut setelah
  jeda ~20 detik — total di bawah ~1 menit, tanpa blank/error
  menetap. Durasi detik persis tidak diukur (cek interval).
- Geser/zoom tidak ngelag pada sampel: 2 klik zoom + seret analog
  merespons langsung, tanpa blank tile/freeze/error. FPS tidak
  diukur — bukan klaim angka.
- Warga campuran: sebagian berkerumun diam di sekitar balai/gubuk
  (Figo, Nera, Praboti, Renata, ribran gakabuming, Siti), sebagian
  bergerak melintasi lapangan (Evos dyroth) — gerak terbukti,
  tujuan/tugasnya tidak terverifikasi dari tampilan (tanpa label
  tugas yang terlihat).
- Hewan TERLIHAT sebagai sprite (perbaikan dari run sebelumnya
  yang tidak melihat): rusa cokelat kecil di bawah label "Rusa"
  pada tampilan zoom, dan berpindah antar tampilan. Spesies lain
  di zoom lebar terlalu kecil untuk diidentifikasi pasti.
- Tombol/panel tidak ada yang tertutup/rusak: kartu menu awalnya
  terpotong di lipatan (Suara/Pengaturan/Orientasi di bawah),
  TAPI kartu bisa di-scroll dan ujung bawahnya utuh ("Orientasi:
  portrait"). Tidak ada bar status atas persisten terpisah —
  nama/waktu/cuaca/stok hanya ada di dalam kartu menu, bukan bar
  di atas peta (koreksi atas catatan run sebelumnya yang menyebut
  "bar status atas sempat terlihat").
- Baris tip r32/r33 TERLIHAT di kartu menu dengan teks persis
  (menonton bukan mengatur, arah lewat Musyawarah).
- Data menu saat observasi: Suka Maju, populasi 9, H-333, 07.11
  lalu 09.23 Pagi, Cerah; stok kayu 191/160 (Penuh), batu 14/130,
  emas 1/40, besi 47/55, pangan 0/200, kulit 104/95 (Penuh).
- TEMUAN STOK (dari data + kode, bukan tebak): kayu 266 (H-321)
  -> 225 -> 219 -> 191 (H-333) PERSIS mengikuti pembusukan 10%
  per hari game atas kelebihan di atas 160 (rasio ~0,53 per 6
  hari = 0,9^6) — jadi pembusukan kayu BERJALAN. Kulit TETAP
  104/95 di ketiga cek: mekanismenya ada di kode —
  `terapkanPembusukan` memakai `Math.floor`, sehingga kelebihan
  <10 tidak pernah busuk (floor(9 x 0,1) = 0; ambang yang sama
  untuk pangan <2). Kulit 104 "mentok" bukan bug baru, melainkan
  zona-mati floor; perbaikan (pembulatan/ambang minimal) adalah
  pekerjaan sim run berikut, BUKAN run ini (cron dilarang menulis
  DB dan run ini display/audit saja).

### Riset (brief research/2026-11-05-0629.md, sudut PERFORMA — rotasi dari aksesibilitas 04:29)
- Sumber: Glitchless (ukur dulu via renderer.info + frame
  tipikal/95th/terburuk; InstancedMesh + geometri/material dibagi,
  "never create them per object"; merge statis; dispose hanya yang
  tidak dibagi; bayangan satu lampu + kamera rapat; cap DPR HP)
  + Intelligent Graphic and Code (tiap mesh = 1 draw call walau
  material dibagi; InstancedMesh vs BatchedMesh vs merging menurut
  kendala; material per objek = pola boros eksplisit; target
  <100 desktop / <50 HP).
- Ide 30 dibangun run ini dari pola itu; Ide 28 tetap menunggu
  baseline Ide 27 + perbaikan dispose + geometri bersama.
- Tidak direkomendasikan: berbagi material saja lalu klaim draw
  call turun, dispose material bersama, instancing sekaligus tanpa
  baseline + cek raycast, dan migrasi WebGPU tanpa profil dulu.


### Verifikasi pasca-deploy r34
- Vercel: deploy production READY dpl_8fSduNH84pvYmDxwLn1GGVpYn2wA
  dari commit d287e2a7 (auto-deploy dari main). /api/version = r34.
- Homepage termuat (judul "Negara Emas — Zaman Batu", teks
  "Memuat peta 3D…" lalu peta 3D penuh dalam ~30 detik) + satu ikon
  termuat (/batu/icons/kayu.png 128x128, render utuh).
- /api/world ok (isi): Suka Maju, populasi 9, hari 338, 06.28
  Pagi, Cerah; stok kayu 182/160, batu 14/130, emas 1/40,
  besi 47/55, pangan 0/200, kulit 104/95.
- /api/map ok (isi): ok:true, grid 600x600, placements lengkap,
  9 warga sesuai populasi, stok PERSIS sama dengan /api/world —
  tidak ada selisih antar endpoint.
- /api/bangunan ok (isi): katalog 26 jenis + antrean 16 entri
  (hanya 1 antre: paviliun_makan, kurang 6 batu; sisanya selesai).
- TIDAK ADA regresi API setelah deploy ini (semua route yang
  tadinya ok tetap ok dengan isi yang konsisten). Perubahan ini
  audit + tes statis saja, jadi tidak menyentuh sim/API sama
  sekali — /api/world yang sempat timeout di satu fetch teks
  (browser.open) berhasil dibaca normal di verifikasi browser
  berikutnya, jadi itu gangguan fetch sesaat, bukan regresi.
- YANG TETAP berlaku: kayu 182/160 lanjut menyusut searah
  pembusukan (191 di H-333 -> 182 di H-338); kulit TETAP 104/95
  karena zona-mati floor (kelebihan <10 tidak busuk) — temuan
  run ini, perbaikan sim menyusul run berikut. Catatan baru dari
  verifikasi (bukan tindakan): /api/world menampilkan 20 entri
  bangunan vs 16 di antrean /api/bangunan, dengan duplikat di
  posisi yang sama — konsisten dengan laporan duplikat lama yang
  tampilannya sudah di-dedupe; tidak ada penghapusan data yang
  dilakukan run ini.

## 2026-11-05 04:29 WIB — Cincin fokus keyboard di menu/modal (Ide 26) + brief riset aksesibilitas

Perubahan dalam 2 kalimat: tombol di kartu menu dan modal kini
mendapat cincin fokus `:focus-visible` dua-nada yang terlihat di
atas latar terang maupun gelap, khusus untuk navigasi keyboard;
sim, ekonomi, kanvas 3D, dan urutan Tab tidak disentuh sama sekali.

- `src/app/globals.css`: satu aturan untuk `.menu-fab:focus-visible`,
  `.menu-card :focus-visible`, dan `.modal-box :focus-visible` —
  outline putih 3px + offset 2px + box-shadow gelap 5px (= offset +
  lebar, dua nada bersentuhan tanpa celah latar) + fallback
  forced-colors (outline `Highlight`, tanpa shadow). Tanpa
  transisi/animasi pada cincin sehingga otomatis patuh aturan
  reduced-motion r31. TIDAK menghapus outline global apa pun dan
  TIDAK menyentuh `.px-input` yang sudah punya `:focus` sendiri.
- `src/lib/version.ts`: BUILD_ID r32 -> r33.
- Tes: 6 penjaga statis baru (cakupan selektor, outline + offset,
  nada kedua 5px, fallback forced-colors, tidak ada penghapus
  outline global, BUILD_ID r33) + 6 penjaga versi diperbarui
  r32 -> r33. Total: 7795 lolos / 656 gagal — baseline r32
  7789/656, jadi +6 lolos, nol regresi baru (tidak ada gagal
  bernama fokus/r33). Build Next.js hijau.
- Backlog: Ide 26 dicatat DIBANGUN di IDE-FITUR.md; riset run ini
  menambah penguat Ide 26 (dua nada + forced-colors, bukan sekadar
  outline satu warna).

### Observasi live (browser, hanya melihat, 04:31-04:35 WIB)
- Muat pertama berat tapi tidak macet: overlay gelap + teks
  "Memuat peta 3D…" dulu, desa penuh dalam waktu kurang dari
  ~1 menit. Tidak ada blank/error menetap; tampilan awal sempat
  gelap/redup lalu cerah seiring waktu game (siang), konsisten
  dengan pergantian waktu, bukan error.
- Geser/zoom tidak ngelag pada uji sampel: seretan menggeser peta
  langsung, tombol ▲/▼ kamera mengubah skala langsung tiap klik.
  Kelancaran dinilai dari tangkapan diskret, bukan video kontinu
  — dicatat, bukan diklaim sebagai angka FPS.
- Warga mayoritas diam/berkerumun di sekitar bangunan tengah pada
  sampel beberapa menit ini (9 nama yang sama: Figo, Nera, Praboti,
  Evos dyroth, Siti, Budi, ribran gakabuming, Miners, Renata),
  hanya bergeser kecil antar tampilan, tanpa jalan jauh yang
  terlihat jelas. Ini SAMPEL observasi, bukan vonis "warga diam":
  run sebelumnya melihat warga bergerak, dan sim tidak diubah run
  ini — perilaku tugas spesifik tetap tidak terverifikasi dari
  tampilan ini saja.
- Hewan TIDAK terlihat jelas sebagai sprite di tampilan peta yang
  diamati, meski label hewan (Rusa, Kelinci, Ayam Hutan, Serigala,
  Beruang) terdaftar di halaman; kemungkinan di luar kamera atau
  di area peta lain — tidak terverifikasi, bukan diklaim hilang.
- Tombol/panel tidak ada yang tertutup: tombol menu kanan-atas,
  kontrol kamera/analog kiri-bawah, pil "🎮 Panduan Kontrol", dan
  pil "＋ Tambah karakter" utuh dan yang dites merespons. Dua
  catatan yang TIDAK terverifikasi run ini (bukan klaim bug):
  bagian bawah kartu menu melampaui lipatan layar ("Suara: Nyala"
  hanya sebagian terlihat, entri di bawahnya belum digulir untuk
  dicek — scroll internal kartu tidak diuji run ini, padahal
  run sebelumnya mencatat kartu menu bisa di-scroll); dan bar
  status atas yang sempat terlihat lalu tidak ada di tampilan
  akhir — tidak bisa dipastikan apakah itu auto-hide atau state
  UI lain.
- VERIFIKASI TERTUNDA YANG KINI SELESAI: baris tip r32 TERLIHAT
  di kartu menu live, di bawah panel "Kampung menginginkan" dan
  "Mulai dari sini", di atas daftar tombol, dengan teks persis
  seperti yang ditulis run 00:29 ("💡 Kamu menonton, bukan
  mengatur: warga bekerja sendiri. Arah kampung diputuskan lewat
  Musyawarah, dan target berikutnya ada di panel Kampung
  menginginkan di atas."). Tugas observasi run 02:29 itu kini
  tertutup.
- Data menu saat observasi: Suka Maju, populasi 9, H-325, 07.58
  Pagi, Cerah; panel "Kampung menginginkan: 📦 400 Kayu — Hadiah:
  100 Emas", "Mulai dari sini: 📜 Musyawarah: Pemilihan Kepala
  Kampung". Stok: kayu 225/160 (Penuh), batu 14/130, emas 1/40,
  besi 47/55, pangan 0/200, kulit 104/95 (Penuh). Kayu TURUN dari
  266/160 (verifikasi r32) searah pembusukan + konsumsi, tapi
  kayu dan kulit MASIH di atas kapasitas yang ditampilkan — status
  "perlu diselidiki" dari run-run sebelumnya TETAP berlaku, dan
  tidak ada tindakan atas stok yang diambil run ini (cron dilarang
  menulis DB, perubahan ini display-only CSS).

### Riset (brief research/2026-11-05-0429.md, sudut AKSESIBILITAS — rotasi dari performa 02:29)
- Sumber: Level Access (WCAG 2.4.7 terlihat, 1.4.11 kontras 3:1,
  2.4.13 perimeter 2px; `:focus-visible` bukan `:focus`; dua nada
  >= 9:1 satu sama lain dijamin lolos di atas latar solid apa pun;
  jangan pernah `outline: none` tanpa pengganti; forced-colors
  memakai `Highlight`; uji akhir = tab-through manual) +
  Modern CSS Layouts (cincin dua nada yang bersentuhan, outline =
  nada luar yang dipertahankan forced-colors, box-shadow tanpa
  blur = nada dalam, spread = offset + lebar; awas terpotong
  ancestor `overflow: hidden`).
- Ide 26 dibangun run ini persis dari pola dua nada itu; Ide 26
  yang lama hanya menyebut "outline kontras" tanpa dua nada —
  riset ini yang menaikkan spesifikasinya. Tidak
  direkomendasikan: hapus outline global dulu-ganti nanti, cincin
  satu warna, cincin hanya dari box-shadow, tabindex positif, dan
  animasi pada cincin.

### Verifikasi pasca-deploy r33
- Vercel: deploy production READY dpl_FjTUmt32jsisTMrybochKvzAM5DT
  dari commit 954d52f (auto-deploy dari main). /api/version = r33.
- Homepage termuat (judul "Negara Emas — Zaman Batu", teks
  "Memuat peta 3D…") + satu ikon termuat (/batu/icons/kayu.png
  128x128, render utuh).
- /api/world ok (isi): Suka Maju, populasi 9, hari 327, 17.32
  Sore, Cerah; stok kayu 219/160, batu 14/130, emas 1/40,
  besi 47/55, pangan 0/200, kulit 104/95 — cocok dengan
  /api/map (stok yang sama) dan searah tren observasi (kayu
  225 -> 219).
- /api/map ok (isi): ok:true, grid 600x600, placements lengkap
  (gubuk, lumbung, bengkel, paviliun 8x8), hewan terdata
  (rusa, kelinci, ayam, serigala, beruang — jadi hewan yang
  tidak terlihat di observasi tadi memang ada di data, hanya di
  luar kamera), warga termasuk Figo (penebang, beristirahat).
- /api/bangunan ok (isi): katalog 26 jenis + antrean (1 antre:
  paviliun_makan, kurang 6 batu; sisanya selesai).
- TIDAK ADA regresi API setelah deploy ini (semua route yang
  tadinya ok tetap ok dengan isi yang konsisten). Perubahan ini
  display-only CSS, jadi tidak menyentuh sim/API sama sekali.
- YANG TETAP berlaku: kayu 219/160 dan kulit 104/95 MASIH di atas
  kapasitas yang ditampilkan — status "perlu diselidiki" tetap,
  bukan akibat deploy ini, dan tidak ada tindakan atas stok yang
  diambil run ini.
- Yang TETAP belum terverifikasi visual: cincin fokus r33 itu
  sendiri (butuh sesi browser yang menekan Tab di menu/modal —
  observasi run ini hanya melihat, dan browser task tidak
  menekan Tab); CSS + tes membuktikan aturannya ada, dan
  penampakan visualnya menjadi tugas observasi run berikutnya.

## 2026-11-05 00:29 WIB — Tip kontekstual satu baris di kartu menu (Ide 14) + brief riset onboarding

Perubahan dalam 2 kalimat: kartu menu kini menampilkan satu baris
tip yang menjelaskan model pengamat game (warga bekerja sendiri,
arah kampung diputuskan lewat Musyawarah), yang bisa ditutup lewat
✕ dan dibuka lagi dari Pengaturan; sim, ekonomi, dan kanvas 3D
tidak disentuh sama sekali.

- `src/app/page.tsx`: state `tipTampil` + `tutupTip`/`tampilkanTip`
  (kunci localStorage `ne_tip_kontekstual`, pola yang sama dengan
  `ne_label_karakter`); baris `.menu-tip` di kartu menu, di bawah
  panel "Kampung menginginkan" + "Mulai dari sini", di atas daftar
  tombol — terlihat saat menu dibuka tanpa memblokir apa pun.
  Teks: "💡 Kamu menonton, bukan mengatur: warga bekerja sendiri.
  Arah kampung diputuskan lewat Musyawarah, dan target berikutnya
  ada di panel Kampung menginginkan." ADAPTASI JUJUR dari contoh
  awal Ide 14 ("Kumpul dulu — lalu bangun lewat Tata Kota"): frasa
  itu tidak dipakai karena pemain di game ini adalah pengamat dan
  tidak ada tombol bangun — menunjuk Tata Kota sebagai "bangun"
  akan jadi janji palsu, sama seperti adaptasi Ide 12. Panel
  Pengaturan mendapat baris "Tip kontekstual di menu" untuk membuka
  lagi tip yang ditutup.
- `src/app/globals.css`: `.menu-tip/.menu-tip-teks/.menu-tip-label/
  .menu-tip-tutup` (bingkai kuning temaram, tanpa animasi sehingga
  otomatis patuh pada aturan reduced-motion r31).
- `src/lib/version.ts`: BUILD_ID r31 -> r32.
- Tes: 7 penjaga statis baru (state + kunci localStorage, baris +
  teks model pengamat, ✕ menyimpan "0", Pengaturan membuka lagi,
  isi menunjuk Musyawarah + panel kebutuhan, CSS, BUILD_ID r32) +
  5 penjaga versi diperbarui r31 -> r32. Total: 7789 lolos / 656
  gagal — baseline r31 7782/656, jadi +7 lolos, nol regresi baru
  (tidak ada gagal bernama tip/r32). Build Next.js hijau.
- Backlog: Ide 14 dicatat DIBANGUN di IDE-FITUR.md; riset run ini
  menambah Ide 29 (tonggak kampung yang terlihat, display-only dari
  data poll yang sudah ada).

### Observasi live (browser, hanya melihat, 00:32-00:35 WIB)
- Muat pertama lambat tapi tidak macet: layar biru gelap + teks
  "Memuat peta 3D…" dulu, lalu langit + teks yang sama, desa penuh
  setelah jeda ~30 detik. Tidak ada error.
- Geser/zoom tidak ngelag pada uji lembut: seret tengah peta
  menggeser tanpa robek/ubin kosong, tombol ▲/▼ kamera merespons
  langsung dan adegan ter-render penuh.
- Warga tampak aktif, bukan diam: 9 nama terlihat (Figo, Nera,
  Praboti, Evos dyroth, Siti, Budi, ribran gakabuming, Miners,
  Renata), posisi berubah antar tampilan, pop-up melayang "+1
  Berry" berulang di dekat semak beri menandakan aktivitas kumpul.
  Label tugas per warga tidak terbaca dari tampilan (tidak ada
  label tugas yang ditampilkan), jadi tugas individu tidak
  terverifikasi dari observasi ini — dicatat, bukan disimpulkan.
- Hewan terlihat: Kelinci dan Ayam Hutan tampak di layar; Rusa,
  Serigala, Beruang disebut di data dunia.
- Tombol/panel tidak ada yang tertutup atau tumpang tindih:
  klaster analog kiri-bawah utuh, pil "🎮 Panduan Kontrol" utuh di
  bawahnya, pil "＋ Tambah karakter" kanan-bawah utuh, tombol menu
  kanan-atas membuka dan menutup menu dengan cepat. Satu keanehan
  visual kecil: glif ☰ tombol menu tampak sangat kecil/redup di
  tangkapan — tombolnya sendiri terlihat sebagai lingkaran gelap
  dan berfungsi, jadi ini dicatat sebagai keanehan tangkapan, bukan
  klaim ikon rusak (pola yang sama pernah muncul di run 10:29).
  Panel menu tinggi dan bisa di-scroll (entri bawah seperti
  Inventori, Papan Warga, Orientasi di bawah lipatan pertama) =
  scroll normal, bukan terpotong.
- Tidak ada area blank/error menetap setelah muat.
- Data menu saat observasi: Suka Maju, populasi 9, H-309, 08.53
  Pagi (berjalan ke 08.55 selama menu dibuka), Cerah, Level 6,
  Musim Kemarau. Stok: kayu 487/160, batu 13/130, emas 1/40, besi
  47/55, pangan 151/200, kulit 104/95 — kayu dan kulit MASIH di atas
  kapasitas yang ditampilkan, seperti run 22:29 (waktu itu kayu
  943/160). Ini BUKAN akibat deploy run ini (perubahan display-only
  + belum deploy saat observasi) dan BUKAN diklaim bug dari bacaan
  menu saja — tapi statusnya tetap "perlu diselidiki": hitung
  kasar dari sim Nusantara saja tidak menjelaskan 487 kayu
  pasca-reset sore 2026-11-04 (1 hari game = 15 menit nyata, cap
  kumpul 3/hari/orang, populasi 9), jadi penyebabnya belum bisa
  dipastikan dari kode tree ini saja; tidak ada tindakan atas stok
  yang diambil run ini, dan cron dilarang menulis DB.

### Riset (brief research/2026-11-05-0029.md, sudut ONBOARDING + PRESTASI — rotasi dari performa 22:29)
- Sumber: Wayline "Tutorials Aren't Docs" (pemain belajar dengan
  melakukan; tutorial opsional + mudah diakses lagi, bukan ceramah
  pembuka; dokumentasi sebagai referensi di menu) + catatan desain
  idle (retensi = frekuensi umpan balik bermakna; milestone
  otomatis pada ambang; achievement terbaik bila bermakna; jangan
  menumpuk banyak sistem sebelum satu loop dipahami).
- Ide 14 dibangun run ini (riset menguatkan spesifikasinya persis);
  Ide 29 masuk backlog. Tidak direkomendasikan: lapisan
  prestige/reset, hadiah klaim offline, tur interaktif
  multi-langkah, dan puluhan achievement sekaligus.

### Observasi live run ini (browser, hanya melihat, 02:31-02:33 WIB)
- Catatan proses: run 00:29 ternyata meninggalkan perubahan r32
  di tree lokal TANPA push — live saat observasi masih r31, jadi
  baris tip r32 BELUM bisa terlihat di sesi ini; yang diobservasi
  adalah keadaan live pra-r32, dan deploy r32 menjadi tugas run
  ini (bukan fitur baru tambahan di atasnya, supaya tidak menumpuk
  dua rilis).
- Muat pertama cukup berat tapi tidak macet: judul "Negara Emas —
  Zaman Batu" langsung tampil, layar "Memuat peta 3D…" dulu, desa
  penuh pada pengecekan ~1 menit berikutnya. Tidak ada error.
- Geser tidak ngelag pada uji lembut: dua seretan di rumput kosong
  menggeser peta mulus dua arah, tanpa robek/beku/area kosong.
  Zoom ▲/▼ TIDAK diuji run ini (instruksi observasi membatasi
  interaksi ke seretan lembut), jadi kelancaran zoom tetap belum
  terverifikasi — dicatat, bukan diklaim.
- Warga tampak bergerak, bukan beku total: Evos dyroth, Budi, Siti,
  Nera berpindah posisi antar tampilan, tapi dari zoom ini mereka
  mostly berkerumun/berkeliaran di sekitar bangunan tengah dan
  rumah — tidak terlihat jelas animasi membawa hasil, bertani,
  atau kerja perkakas — jadi perilaku tugas spesifik TIDAK bisa
  dikonfirmasi dari observasi ini, hanya bahwa mereka bergerak.
- Hewan terlihat sebagai label + model kecil: Rusa, Kelinci, Ayam
  Hutan, Serigala, Beruang; model individual sulit dibedakan di
  zoom itu.
- Tombol/panel tidak ada yang tertutup atau tidak merespons:
  menu kanan-atas dibuka dan ditutup normal lewat "Tutup"; kontrol
  kamera terlihat. Dua catatan kerapian (bukan error): label nama
  bertumpuk berat di klaster desa yang padat, dan lahan luas di
  luar desa adalah rumput/terrain kosong yang normal, bukan blank
  render. Tombol menu kanan-atas kecil di pojok tapi berfungsi.
- Data menu saat observasi: Suka Maju, populasi 9 (Figo, Nera,
  Praboti, Evos dyroth, Siti, Budi, ribran gakabuming, Miners,
  Renata), H-317, 06.55 -> 06.57 Pagi, Cerah, Level 16. Stok:
  kayu 304/160 (Penuh), batu 13/130, emas 1/40, besi 47/55,
  pangan 12/200, kulit 104/95 (Penuh). Kayu turun dari 487/160 di
  run 00:29 dan pangan dari 151/200 — searah dengan pembusukan di
  atas kapasitas + konsumsi — tapi kayu dan kulit MASIH di atas
  kapasitas yang ditampilkan, jadi status "perlu diselidiki" dari
  run-run sebelumnya TETAP berlaku; tidak ada tindakan atas stok
  yang diambil run ini (cron dilarang menulis DB, perubahan ini
  display-only).

### Riset run ini (brief research/2026-11-05-0229.md, sudut PERFORMA — rotasi dari onboarding 00:29)
- Sumber: Glitchless (ukur dulu lewat renderer.info: draw call +
  segitiga + geometri/tekstur hidup; laporkan frame tipikal, p95,
  terburuk — bukan rata-rata FPS) + Aetumi (InstancedMesh = satu
  geometri + satu material + N matriks; culling instancing
  all-or-nothing, jadi cocok untuk klaster lokal) + Simplified
  (patokan <50 draw call HP, <100 desktop — patokan, bukan klaim,
  karena baseline Nusantara belum pernah diukur).
- Ide 30 masuk backlog: audit geometri/material bersama di Map3D
  sebagai prasyarat Ide 28 (bukan duplikat Ide 27 baseline runtime
  maupun Ide 28 instancing). Ide 27/28 diperkuat, bukan dibangun
  ulang. Tidak direkomendasikan: migrasi WebGPU, cap pixel ratio
  membabi buta tanpa baseline, hapus bayangan sekaligus tanpa
  ukur, dan log renderer.info permanen di production.

### Verifikasi pasca-deploy r32 (03:23-03:24 WIB)
- Vercel: deploy production READY dpl_3z7QRNEBGwdjhPi6La1fsbbQaoeE
  dari commit 793bc64 (auto-deploy dari main). /api/version = r32.
- Homepage termuat (judul "Negara Emas — Zaman Batu", teks
  "Memuat peta 3D…") + satu ikon termuat (/batu/icons/kayu.png
  128x128, log + tunas hijau, render utuh).
- /api/world ok (isi): Suka Maju, populasi 9, hari 321, 12.12
  Siang, Cerah, Level 16; stok kayu 266/160, batu 14/130,
  emas 1/40, besi 47/55, pangan 0/200, kulit 104/95.
- /api/map ok (isi): ok:true, grid 600x600, 9 warga (Figo, Nera,
  Praboti, Evos dyroth, Siti, Budi, ribran gakabuming, Miners,
  Renata) — cocok dengan populasi /api/world.
- /api/bangunan ok (isi): katalog 26 jenis + 16 antrean (15
  selesai, 1 antre: paviliun_makan, kurang 6 batu).
- TIDAK ADA regresi API setelah deploy ini (semua route yang
  tadinya ok tetap ok). Perubahan ini display-only, jadi tidak
  menyentuh sim/API sama sekali.
- YANG TETAP berlaku: kayu 266/160 dan kulit 104/95 MASIH di atas
  kapasitas yang ditampilkan (turun dari 304/160 di observasi
  02:31, searah pembusukan + konsumsi, tapi belum sampai di
  bawah kap) — status "perlu diselidiki" dari run-run sebelumnya
  tetap, bukan akibat deploy ini, dan tidak ada tindakan atas
  stok yang diambil run ini.
- Yang TETAP belum terverifikasi visual: baris tip r32 itu sendiri
  di kartu menu live (butuh sesi browser yang membuka menu
  pasca-deploy r32 — observasi run ini dilakukan saat live masih
  r31, sebelum deploy); CSS + tes membuktikan aturannya ada, dan
  penampakan visualnya menjadi tugas observasi run berikutnya.

## 2026-11-04 22:29 WIB — Hormati prefers-reduced-motion di panel/modal (Ide 25) + brief riset performa

Perubahan dalam 2 kalimat: pemain yang mengaktifkan
"kurangi gerakan" di perangkatnya kini mendapat panel/modal yang
muncul langsung tanpa transisi, titik stok penuh yang statis, dan
label melayang yang hanya memudar di tempat; sim, ekonomi, dan
kanvas 3D tidak disentuh sama sekali.

- `src/app/globals.css`: blok `@media (prefers-reduced-motion:
  reduce)` — transisi dimatikan untuk `.overlay-full`,
  `.modal-box`, `.menu-card`, `.menu-fab`, `.menu-item`,
  `.side-panel`, `.papan-warga-row`, `.hud-res-chip`, dan
  `.map3d-label` (panel/modal/papan muncul langsung, bukan
  meluncur/membesar); `.hud-full-dot` berhenti berdenyut tapi
  tetap merah penuh (sinyal stok penuh dipertahankan lewat warna
  + bentuk, bukan gerak — pelajaran riset aksesibilitas run
  sebelumnya); `.map3d-float-badge` memakai keyframes baru
  `floatFadeTenang` (hanya opacity, tanpa translate/scale) selama
  1,6 detik yang sama. Kanvas 3D sengaja TIDAK disentuh: gerak
  kamera/warga di sana adalah inti permainan, bukan dekorasi panel.
- `src/lib/version.ts`: BUILD_ID r30 -> r31.
- Tes: 8 penjaga statis baru (media query ada; panel/modal/papan
  masuk di dalamnya; transisi dimatikan; titik penuh statis;
  label melayang pakai fade tenang; keyframes fade tenang ada;
  keyframes itu tanpa translate/scale; BUILD_ID r31) + 4 penjaga
  versi diperbarui r30 -> r31. Total: 7782 lolos / 656 gagal —
  baseline pra-perubahan 7774/656, jadi +8 lolos, nol regresi baru
  (himpunan gagal tidak berubah nama). Build Next.js hijau.
- Backlog: Ide 25 dicatat DIBANGUN di IDE-FITUR.md; riset run ini
  menambah Ide 27 (baseline draw call lewat `renderer.info`
  sebelum optimasi apa pun) dan Ide 28 (InstancedMesh untuk
  pohon/batu berulang, setelah baseline ada).

### Observasi live (browser, hanya melihat, 22:29-22:33 WIB)
- Muat pertama bukan frame kosong: layar biru gelap dengan teks
  "Memuat peta 3D…" lalu langit + teks yang sama, desa tampil
  dalam <1 menit (waktu persis tidak terukur dari stempel
  menit alat browser, jadi dilaporkan sebagai <1 menit).
- Geser/zoom tidak ngelag pada uji lembut: seret di rumput kosong
  menggeser peta tanpa lompat/beku yang terlihat, tombol ▼ kamera
  turun ditekan 3x mendekat bertahap dengan bersih. FPS tidak
  diukur, jadi ini penilaian respons dari tangkapan, bukan angka.
- Warga tampak sibuk, bukan diam: label tugas berprogres
  ("ladang 60%", "bengkel_kayu 10%", "Menghalau Hewan!" naik
  36% -> ~74-77%) plus peringatan "Tolong! Ada hewan buas!"
  di dekat gubuk. Sebagian warga berjalan antar gubuk, tapi kesan
  dominan adalah label tugas, bukan mondar-mandir tanpa tujuan.
- Hewan terlihat jelas dan banyak: Rusa, Kelinci, Ayam Hutan,
  Serigala, Beruang — termasuk beruang cukup dekat sampai memicu
  peringatan pertahanan desa.
- Tombol/panel tidak ada yang tertutup atau terpotong: klaster
  analog kiri-bawah utuh (dasar + knop kuning, ▲/▼, ✕), pil
  "🎮 Panduan Kontrol" di bawahnya utuh, pil "＋ Tambah karakter"
  kanan-bawah utuh, tombol ☰ kanan-atas membuka menu dan "Tutup
  menu" menutupnya bersih. Catatan jujur: knop analog, pil
  Panduan, pil Tambah, dan tombol ▲ tidak diketuk (observasi
  hanya melihat), jadi respons ketuknya tidak terverifikasi —
  hanya visibilitasnya, kecuali tombol ▼ yang terverifikasi
  merespons. Panel menu sendiri sangat tinggi (hampir setinggi
  layar, dengan scrollbar sendiri); "Tutup menu" tetap terjangkau
  di tampilan itu.
- Tidak ada area blank/error menetap; satu tampilan sempat jauh
  lebih gelap lalu cerah lagi, konsisten dengan pergantian
  waktu game, bukan error.
- Data menu saat observasi (BUKAN dari perubahan run ini, dicatat
  sebagai keadaan desa): Suka Maju, Zaman Batu, populasi 8 (Figo,
  Nera, Praboti, Evos dyroth, Siti, Budi, ribran gakabuming,
  Miners), H-301, 05.36 Malam, Berawan; bangunan antara lain
  Ladang x3, Gubuk x3, bengkel_kayu, Gudang, Balai Kampung,
  Api Unggun, Sumur, Menara Pengawas. PERHATIAN untuk run
  berikutnya, bukan diperbaiki run ini: stok yang ditampilkan
  menu melampaui kapasitas yang ditampilkan juga (kayu 943/160,
  pangan 655/200, kulit 110/95 — semua bertanda PENUH). Ini
  bertentangan dengan pemahaman clamp gudang dari run-run
  sebelumnya dan belum terjelaskan dari bacaan menu saja
  (bisa jadi angka kapasitas di menu bukan kap clamp yang sama);
  perubahan run ini display-only CSS dan tidak menyentuh sim/stok
  sama sekali, jadi tidak ada kaitannya dengan angka itu — tapi
  angka ini perlu dicek ulang lewat /api/world pada verifikasi
  pasca-deploy, bukan diklaim bug dari menu saja.

### Riset (brief research/2026-11-04-2229.md, sudut PERFORMA — rotasi dari aksesibilitas 20:29)
- Sumber: Simplified (draw call bottleneck utama WebGL; target HP
  <50/frame; merge geometri statis, InstancedMesh, cap pixel ratio
  2, matikan shadow map di HP) + Glitchless (ukur dulu lewat
  `renderer.info`; draw call ribuan sejak awal = mesh terpisah
  terlalu banyak; draw call naik terus = tidak di-dispose; uji di
  perangkat paling lambat).
- Ide 27 dan Ide 28 masuk IDE-FITUR.md (lihat di atas). Tidak
  direkomendasikan: migrasi WebGPU, cap pixel ratio membabi buta
  tanpa baseline, dan hapus bayangan/efek sekaligus tanpa ukur.

### Verifikasi pasca-deploy (22:44-22:46 WIB)
- Vercel: deploy production READY dpl_2Nn6Kp1N3HhArBZWBt4aikZtBqPy
  dari commit 404704a (auto-deploy dari main). /api/version = r31.
- Homepage termuat (judul "Negara Emas — Zaman Batu", teks
  "Memuat peta 3D…" lalu desa 3D penuh) + satu ikon termuat
  (/batu/icons/kayu.png 128x128). Catatan jujur: desa dirender
  kanvas, bukan <img>, jadi pemeriksaan gambar HTML di halaman
  melaporkan 0 gambar — ikon terverifikasi lewat URL-nya
  langsung, bukan lewat halaman.
- /api/world ok (isi, bukan hanya status): Suka Maju, populasi 8,
  hari 302, 19.23 Sore, Berawan; stok kayu 943/160, batu 22/130,
  pangan 650/200, kulit 110/95, emas 1/40, besi 46/55.
- /api/map ok (isi): ok:true, grid 600x600, 8 warga (Figo, Nera,
  Praboti, Evos dyroth, Siti, Budi, ribran gakabuming, Miners).
- /api/bangunan ok (isi): katalog 26 jenis + 10 antrean, semua
  status selesai progres 100 (2 Bengkel Kayu, 1 Ladang, 4 Gubuk,
  1 Pondok Tabib, 1 Lumbung, 1 Jembatan).
- TIDAK ADA regresi API setelah deploy ini (semua route yang
  tadinya ok tetap ok, isinya konsisten dengan desa H-301/302).
  Perubahan run ini display-only CSS, jadi tidak menyentuh
  sim/API sama sekali.
- YANG DIKONFIRMASI API, bukan lagi sekadar menu: stok di atas
  kapasitas yang ditampilkan memang nyata di /api/world (kayu
  943/160, pangan 650/200, kulit 110/95). Ini BUKAN akibat deploy
  ini dan BUKAN klaim bug dari satu bacaan — tapi temuan ini
  naik status dari "perlu dicek" menjadi "perlu diselidiki run
  berikutnya": dari mana angka di atas kapasitas itu berasal
  padahal clamp gudang sudah diklaim berlaku, dan apakah angka
  kapasitas di API ini kap yang sama dengan kap clamp.
- Yang TETAP belum terverifikasi visual: efek reduced-motion itu
  sendiri (butuh perangkat/browser dengan preferensi kurangi
  gerakan aktif + membuka panel — tidak bisa dibuktikan dari
  sesi observasi biasa); CSS + tes membuktikan aturannya ada.

## 2026-11-04 20:29 WIB — Tanda "tanpa tugas" di Papan Warga (sebagian Ide 5) + brief riset aksesibilitas

Perubahan dalam 2 kalimat: Papan Warga kini menandai warga yang
benar-benar tanpa target kerja dengan tag "💤 tanpa tugas" di
barisnya plus satu baris ringkasan di kepala daftar; sisanya
(display peta, sim, ekonomi) tidak disentuh sama sekali.

- `src/lib/batu/tampil.ts`: fungsi murni baru `wargaTanpaTugas`
  (warga dihitung tanpa tugas bila node null + fase istirahat +
  aksi beristirahat/rehat stok penuh). Sengaja TIDAK menghitung
  santai (node.pseudo "santai") karena itu alihan AKTIF — jalan
  santai/membantu warga lain, bukan diam — dan tidak menghitung
  istirahat yang nodenya masih terpasang (jeda sementara di tengah
  tugas, bukan tanpa tugas). Definisi ini dari data sim sendiri,
  bukan dari menebak status_teks.
- `src/app/page.tsx`: Papan Warga memakai fungsi itu — tag
  " • 💤 tanpa tugas" di baris warga yang bersangkutan, dan bila
  ada yang tanpa tugas, kepala daftar menampilkan baris ringkasan
  "💤 N warga tanpa tugas — tidak ada target kerja saat ini".
  Penanda memakai IKON + TEKS, bukan warna saja, sesuai pelajaran
  riset aksesibilitas run ini (warna saja hilang bagi pemain buta
  warna / layar HP di bawah sinar matahari). Display-only, tanpa
  fetch baru, tanpa ubah sim.
- `src/app/globals.css`: gaya `.papan-warga-tanpatugas` (teks
  12px tebal) untuk baris ringkasan itu.
- `src/lib/version.ts`: BUILD_ID r29 -> r30.
- Tes: 12 penjaga baru (8 perilaku fungsi + 4 statis: page memakai
  fungsi, tag ikon+teks ada, kelas ringkasan ada, CSS ada) + 4
  penjaga versi diperbarui r29 -> r30 (ternyata ada 4 asersi versi
  di file tes, bukan 1 — ketiganya diperbarui, bukan hanya yang
  pertama). Total: 7774 lolos / 656 gagal — baseline r29 7762/656,
  jadi +12 lolos, nol regresi baru (tidak ada gagal bernama
  tanpatugas/r30). Build Next.js hijau.
- Backlog: Ide 5 dicatat SEBAGIAN DIBANGUN di IDE-FITUR.md; sisa
  Ide 5 (ikon di atas warga di peta 3D + baris ringkas di kabar
  kampung) tetap antrean run berikutnya. Riset run ini menambah
  Ide 25 (prefers-reduced-motion di panel/modal) dan Ide 26
  (cincin fokus terlihat di menu/modal).

### Verifikasi pasca-deploy (20:42-20:44 WIB)
- Vercel: deploy production READY dpl_Dcwx8i263JWhfkTVo8jqEYfewZ7N
  dari commit 73a76ae (auto-deploy dari main). /api/version = r30.
- Homepage termuat (judul "Negara Emas — Zaman Batu", teks
  "Memuat peta 3D…") + satu ikon termuat (/batu/icons/kayu.png
  128×128).
- /api/world ok (isi, bukan hanya status): Suka Maju, populasi 6,
  hari 294, 16.50 Sore, Hujan Petir; stok kayu 1/40, batu 1/30,
  pangan 0/50, kulit 1/25, emas 1/10, besi 1/15 — konsisten dengan
  desa baru + aturan susah r23/r28, bukan regresi (perubahan run
  ini display-only, tidak menyentuh sim/API sama sekali).
- /api/bangunan ok (katalog lengkap + 1 antrean gubuk, kurang 29
  kayu / 9 kulit). Selisih kecil yang dicatat, bukan diklaim:
  bacaan /api/world menyebut 2 gubuk antre sementara /api/bangunan
  menampilkan 1 entri antrean — pola yang sama seperti run 18:29,
  penyebabnya tidak terjelaskan dari bacaan saja, dan tidak ada
  kaitannya dengan perubahan display-only run ini.
- /api/map ok (isi, bukan hanya status): ok:true, 6 warga (Figo,
  Nera, Praboti, Evos dyroth, Siti, Budi), grid 600×600, node
  pohon/semak/buruan/batu/urat emas-besi. Catatan jujur: bacaan
  teks langsung sempat timeout karena payload besar — bukan error
  API; verifikasi ini didapat lewat bacaan browser pemulihan yang
  membaca URL yang sama tanpa error.
- Yang TETAP belum terverifikasi visual: tag "💤 tanpa tugas" itu
  sendiri di Papan Warga live (butuh sesi browser yang membuka
  Papan Warga pasca-deploy — dan bila saat itu tidak ada warga
  yang tanpa tugas, tag memang tidak tampil, itu perilaku benar,
  bukan bug).

### Observasi live (browser, hanya melihat, 20:31-20:35 WIB)
- Muat pertama cukup berat tapi tidak ber menit-menit: teks
  "Memuat peta 3D…" / "Memuat dunia…" dulu, desa tampil penuh
  dalam <30 detik pada pengecekan berikutnya (tidak diukur
  detik persis, jadi dilaporkan sebagai <30 detik).
- Geser/zoom tidak ngelag pada uji lembut: zoom masuk 3x dan
  keluar 2x responsif, seret analog kiri-bawah menggeser peta
  mulus ke area baru. Tidak ada stutter/freeze yang teramati.
- Warga (6: Figo, Nera, Praboti, Evos dyroth, Siti, Budi) tidak
  diam total — mulai mengumpul di tengah lalu tersebar di peta —
  tapi di tampilan peta hanya nama + bilah kecil yang terbaca,
  TIDAK ada teks status aktivitas yang terbaca (bekerja/makan/
  istirahat). Inilah yang membuat irisan run ini berguna: status
  "tanpa tugas" kini setidaknya terbaca di Papan Warga, bukan
  hanya di peta yang tidak menampilkan status.
- Hewan ada tapi sulit terlihat: label Rusa, Kelinci, Ayam Hutan,
  Serigala terdaftar; satu label "Rusa" terlihat saat zoom,
  tapi badan hewan kecil/tidak jelas di zoom default dan tidak
  ada hewan terlihat di area lapang yang digeser — dicatat saja,
  bukan irisan run ini.
- Tombol/panel tidak ada yang tertutup atau tidak merespons:
  kontrol kamera kiri-bawah, "+ Tambah karakter" kanan-bawah,
  dan tombol panduan kiri-bawah semua merespons; kartu menu
  terbuka di tengah dengan rapi dan tertutup bersih lewat ✕.
  Tidak ada area blank/error; peta penuh terrain hijau, pohon,
  batu, dan cakram emas.
- Status dari menu kampung: Desa Suka Maju (6 orang), H-293,
  08.17 Pagi, cuaca "Hujan Petir" — tapi pemandangan tampak
  cerah tanpa hujan/petir yang jelas di tangkapan layar.
  Ketidaksesuaian cuaca visual ini DICATAT sebagai observasi,
  bukan diperbaiki run ini (butuh kepastian apakah cuaca visual
  memang belum diimplementasi atau hanya tidak tertangkap
  tangkapan layar). Stok semua 1 (kayu 1/40, batu 1/30, emas
  1/10, besi 1/15, pangan 1/50, kulit 1/25) — konsisten dengan
  desa baru pasca-reset + aturan susah r23/r28, bukan regresi.

### Riset (brief research/2026-11-04-2029.md, sudut AKSESIBILITAS)
- Sumber: Game Accessibility Guidelines ("Basic": kontras tinggi,
  teks jelas, kontrol besar DAN berjarak, dan tidak ada info
  penting yang hanya lewat satu warna tetap) + RunMob "Accessible
  web game design" (2026-10-20: jangan hanya kilatan warna —
  pasangkan dengan teks/bentuk/posisi; hormati reduced-motion
  dengan alternatif tenang, bukan hapus umpan balik; indikator
  fokus harus terlihat di atas gambar game).
- Tidak direkomendasikan dari riset ini: perombakan screen-reader
  penuh untuk kanvas 3D (terlalu besar untuk satu run), pembesaran
  teks otomatis yang mengubah layout HUD, dan penanda status yang
  hanya warna (persis yang dilarang kedua sumber).

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

### Verifikasi pasca-deploy (18:45-18:47 WIB)
- Vercel: deploy production READY dpl_27wekQ3ELs8cY5VHMTR88JoFFgQZ
  dari commit 88378bb (auto-deploy dari main). /api/version = r29.
- Homepage termuat (judul "Negara Emas — Zaman Batu", teks
  "Memuat peta 3D…") + satu ikon termuat (/batu/pohon.png 64×64).
- /api/world ok (isi, bukan hanya status): Suka Maju, populasi 6,
  hari 286, 19.00 Sore, Cerah; stok kayu 1/40, batu 1/30, pangan
  0/50, kulit 1/25, emas 1/10, besi 1/15 — konsisten dengan desa
  baru + aturan susah r23/r28, bukan regresi (perubahan run ini
  hanya CSS, tidak menyentuh sim sama sekali).
- /api/map ok (grid + node pohon/semak/urat besi-emas) dan
  /api/bangunan ok (katalog lengkap + antrean gubuk, kurang 29 kayu
  / 9 kulit per gubuk). Selisih kecil yang dicatat, bukan diklaim:
  bacaan /api/world menyebut 2 gubuk antre sementara bacaan
  /api/bangunan sesaat sesudahnya menampilkan 1 entri antrean —
  penyebabnya tidak terjelaskan dari bacaan saja (bisa jadi antrean
  berubah antar bacaan) dan tidak ada kaitannya dengan perubahan
  CSS run ini.
- Yang TETAP belum terverifikasi visual: posisi analog yang sudah
  dinaikkan itu sendiri (butuh sesi browser yang melihat klaster
  pasca-deploy) — CSS + tes membuktikan nilainya, tangkapan
  layarnya menjadi tugas observasi run berikutnya.

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
