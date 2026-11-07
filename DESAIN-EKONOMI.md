# Desain Ekonomi & Progresi Nusantara

Spesifikasi user 2026-11-03 (aturan kumpul) + rancangan asisten (tangga
progresi). File ini DIBACA cron tiap run sebelum memilih apa yang dibangun.
Implementasi bertahap, satu irisan kecil per run, wajib tes offline.
Keputusan user di bagian 1 TIDAK BOLEH dilanggar atau "diakali" lewat
pengali lain — KECUALI override 2026-11-05 di bawah ini, yang
merupakan perintah eksplisit user dan mengalahkan bagian 1.

## OVERRIDE USER 2026-11-05 — RESOURCE 5x (mengalahkan bagian 1)

Perintah eksplisit user 2026-11-05 ~18:57 WIB (pangan 0 terus, warga
kelaparan): hasil kumpul dikali 5. Implementasi r45:

- PENGALI_KUMPUL = 5 pada hasil kumpul pangan/kayu/batu/kulit (termasuk
  daging buruan dan bonus buah pemanjat; satu ronde = roll 1-3 x5 =
  5-15 per ronde, bukan 45 — roll tetap 1-3, pengali yang berubah).
- Cap harian biasa naik 3 -> 15 (3 x 5) supaya pengali tidak langsung
  terpotong cap; cap dihitung dari HASIL AKHIR yang masuk stok.
- Besi/emas TIDAK dikali (tetap langka, cap 2/hari) — keputusan asisten,
  dicatat di sini: user minta "resource 5x" karena pangan 0; besi/emas
  langka adalah identitas ekonomi yang sudah disepakati, bukan penyebab
  paceklik.
- Kapasitas gudang TIDAK berubah; pembusukan hanya di atas kapasitas,
  jadi hasil 5x tidak langsung hangus — tapi stok di atas kapasitas
  tetap membusuk (pangan 50%/hari), jadi 5x bukan alasan menimbun.
- Override ini MENGGANTIKAN kalimat "TIDAK ADA cara apa pun yang
  menembus cap 3" di bagian 1 untuk keempat sumber biasa; bagian 1
  selebihnya (roll 50/30/20, besi/emas langka, floor minimal 1) tetap
  berlaku.

## 1. Aturan kumpul harian (spesifikasi user, WAJIB)

Satuan: per warga, per hari game, per jenis sumber yang ia kumpulkan
lewat perannya. Yang dihitung adalah HASIL AKHIR yang masuk stok
(setelah semua pengali), bukan roll mentah.

### Pangan, kayu, batu: maksimal 3 per hari per orang

Roll harian per warga pengumpul:

- 1 = 50%, 2 = 30%, 3 = 20% (rata-rata 1,7 per hari).
- TIDAK ADA cara apa pun yang menembus cap 3. Pengali yang sudah ada
  (bakat, perkakas bengkel, pengali ronde) hanya boleh menggeser
  peluang DI DALAM cap (mis. penebang berpengalaman: 1 = 35%,
  2 = 40%, 3 = 25%), bukan menambah hasil di atas 3.
- Hujan tetap memotong hasil seperti aturan lama, tapi floor
  "minimal 1" hanya berlaku untuk ketiga sumber ini.

### Besi: langka, berporsentase, boleh nol

Hanya penambang, hanya dari node urat besi. Roll harian penambang
untuk besi:

- Biasa: 0 = 55%, 1 = 35%, 2 = 10% (rata-rata 0,55 per hari).
- Penambang berbakat: 0 = 40%, 1 = 45%, 2 = 15% (rata-rata 0,75).
- Seharian penuh tanpa besi itu NORMAL, bukan bug. Besi TIDAK
  PERNAH di atas 2 per hari per orang.
- Hujan TIDAK membuat besi lebih mudah, dan TIDAK ADA floor
  minimal 1 untuk besi.

### Emas dan kulit (proposal, ikut pola yang sama)

- Emas: ikut pola besi (0 = 45%, 1 = 40%, 2 = 15%) sampai
  diputuskan lain. Emas dipakai upgrade tingkat, jadi harus
  terasa langka juga.
- Kulit: ikut roll pangan dari buruan yang sama (pemburu membawa
  pangan + kulit, total per hari tetap dalam cap 3 per jenis).
- Masak (juru masak mengubah pangan jadi hidangan) BUKAN kumpul,
  jadi tidak kena cap ini; pembatasnya tetap kapasitas hidangan
  paviliun.

### Kenapa angka ini

Biaya bangunan sekarang receh (api unggun 10 kayu, gubuk 30 kayu,
rak jemur 8 kayu) sementara kumpul terasa gratis, jadi semua
terbangun sekejap. Dengan rata-rata 1,7 per hari per orang:

- Gubuk (30 kayu) = sekitar 18 hari-kerja satu penebang, atau
  sekitar 6 hari untuk 3 penebang. Terasa diusahakan, bukan gratis.
- Balai (50 kayu + 20 batu) = sekitar 30 hari-kayu + 12 hari-batu.
- Kapasitas gudang yang sudah ada (kayu 200, batu 150, pangan 200,
  kulit 100, emas 50, besi 60) tetap berlaku sebagai rem kedua.

Kalau hasil tes terasa terlalu lambat atau cepat, yang diubah
hanya PERSENTASE roll-nya, bukan cap-nya.

## 2. Tangga progresi: dari receh ke besar (rancangan asisten)

Prinsip: tiap tingkat dibuka oleh bangunan tingkat sebelumnya yang
SUDAH BERDIRI + populasi, bukan oleh waktu saja. Biaya naik, tapi
SELALU dalam sumber yang sudah bisa dikumpulkan di tingkat itu
(jangan minta besi sebelum penambang ada).

### Tingkat 0 — Bertahan hidup (awal game, tanpa syarat)

Api unggun (10 kayu, 5 batu), rak jemur (8 kayu, 2 kulit),
gubuk (30 kayu, 10 kulit) / tenda kulit (20 kulit, 10 kayu).
Fungsi: tidur, makan, kumpul. Ini "hal receh" pertama yang
langsung bisa disentuh pemain.

### Tingkat 1 — Kampung menetap

Syarat buka: 1 gubuk + api unggun berdiri.
Lumbung (40 kayu, 10 batu), ladang (10 kayu), sumur batu
(25 batu), pagar (15 kayu), totem (20 kayu, 5 batu).
Fungsi: simpan stok bersama, air, pangan stabil dari ladang.

### Tingkat 2 — Pertukangan

Syarat buka: lumbung berdiri + populasi minimal 8.
Bengkel kayu (30 kayu, 5 batu), bengkel batu (30 batu, 20 kayu),
pondok tabib (20 kayu, 10 kulit), lingkaran batu (20 batu).
Fungsi: perkakas (menggeser peluang roll ke arah 3, tetap dalam
cap), obat, musyawarah. Bengkel adalah hadiah pertama untuk
pemain yang sudah menetap.

### Tingkat 3 — Kampung besar

Syarat buka: satu bengkel berdiri + populasi minimal 12.
Balai (50 kayu, 20 batu), dapur umum (30 kayu, 15 batu),
menara jaga (40 kayu, 10 batu), gapura (20 kayu, 10 batu),
jembatan (40 kayu, 10 batu), perahu (30 kayu, 10 kulit),
gubuk besar (50 kayu, 15 kulit) / tenda besar (30 kulit, 15 kayu).
Fungsi: musyawarah resmi, makan bersama, pertahanan, penyeberangan.

### Tingkat 4 — Pangan skala besar

Syarat buka: balai + dapur umum berdiri.
Kebun rempah (15 kayu, 5 batu), sawah luas (30 kayu, 10 batu),
peternakan luas (35 kayu, 15 kulit), perkebunan luas
(25 kayu, 5 batu), paviliun makan (60 kayu, 20 batu, footprint 8).
Fungsi: surplus pangan untuk populasi besar; hidangan paviliun
(1 pangan = 1 hidangan, lapar -60) jadi andalan.

### Tingkat 5 — Zaman besi & monumen (BARU, belum ada di katalog)

Syarat buka: penambang aktif + paviliun makan berdiri + populasi
minimal 20. Ini ujung progresi, dan alasan besi langka itu
akhirnya berharga:

- Bengkel besi (proposal biaya: 40 kayu, 30 batu, 15 besi):
  tempat kerja penambang dan perajin besi; membuka perkakas besi
  (geseran peluang roll terbesar yang diizinkan, tetap dalam cap).
- Monumen akhir, "Tugu Leluhur Agung" (proposal biaya: 120 kayu,
  100 batu, 40 besi, 30 emas — angka ini diambil dari tabel
  upgrade tingkat 1 yang sudah ada di sumberdaya.ts, jadi nyambung
  dengan ekonomi yang ada): bangunan kemenangan kampung, tanpa
  fungsi ekonomi, murni bukti kampung sudah sampai ujung tangga.
- STATUS r63 (2026-11-07 14:29 WIB): tonggak ke-8 SELESAI (Ide 78,
  BUILD_ID r63) — baris menu Suka Maju kini "7 dari 8". SISA
  tingkat 5: perkakas besi (Ide 79).
- Proyek besi itu lintas musim: 40 besi dengan rata-rata 0,55
  per hari per penambang = sekitar 73 hari-penambang. Satu
  penambang butuh berbulan-bulan game; tiga penambang berbakat
  sekitar 24 hari. Layak jadi tujuan akhir, bukan belanjaan
  mingguan.

### Upgrade bangunan

Tabel upgrade tingkat 1/2/3 yang sudah ada (mis. tingkat 1:
120 kayu, 100 batu, 150 pangan, 70 kulit, 30 emas, 40 besi)
tetap berlaku, tapi tingkat upgrade ikut terkunci oleh tangga:
upgrade tingkat 2 baru bisa dibuka setelah balai berdiri,
upgrade tingkat 3 setelah paviliun makan berdiri (proposal).

## 3. Implementasi (untuk cron / sesi bangun)

File yang disentuh:

- `src/lib/batu/sim.ts` — roll hasil kumpul + cap harian per warga
  (butuh hitung hasil harian per warga, reset tiap hari game;
  besi boleh 0, tanpa floor).
- `src/lib/batu/sumberdaya.ts` — syarat buka tiap tingkat +
  biaya bangunan baru tingkat 5.
- `tests/batu.test.ts` — tes baru yang WAJIB hijau: cap 3 tidak
  tertembus dalam 1000 hari simulasi; distribusi besi dalam
  toleransi statistik (rata-rata 0,4–0,7 biasa, 0,6–0,9 berbakat);
  ada hari-hari besi 0; bangunan tingkat 5 terkunci sebelum syarat
  terpenuhi dan terbuka setelahnya.

Urutan bangun yang disarankan:

1. Cap kumpul + roll besi (aturan bagian 1).
1b. Clamp stok di semua jalur + aktivitas alihan saat stok penuh
    (bagian 5).
2. Kunci tingkat (syarat buka bagian 2) untuk bangunan yang
   sudah ada.
3. Bangunan tingkat 5 + monumen.
4. Tuning persentase dari hasil tes, tanpa menyentuh cap.

Jangan diubah tanpa persetujuan user: harga bangunan yang sudah
ada, kapasitas gudang, aturan lapar/makan, dan cap di bagian 1.

## 5. Kap gudang dan stok meluber (temuan user 2026-11-03)

Gejala yang dilaporkan user: stok pangan sampai ratusan ribu,
padahal gudang mentok (patokan user: 850) sehingga stok tidak
boleh lebih — akibatnya karakter tidak ngapa-ngapain (cek
"stok penuh" mematikan peran kumpul, tapi jalur penambah lain
tetap meluberkan stok).

Aturan perbaikan:

- SEMUA jalur penambah stok WAJIB clamp di kapasitas gudang,
  tanpa kecuali — termasuk buruan/delivery daging yang sekarang
  lolos dari cek penuh. Stok tidak boleh melebihi kapasitas
  lewat jalur mana pun.
- Kalau stok untuk peran warga sudah penuh, warga JANGAN diam
  saja: alihkan ke aktivitas lain (bantu bangun, sosial,
  istirahat) supaya kampung tetap hidup.
- Angka kapasitas per sumber yang sudah ada di kode (kayu 200,
  batu 150, pangan 200, kulit 100, emas 50, besi 60) tetap jadi
  acuan sampai user menetapkan angka 850 sebagai kap total atau
  per gudang — jangan menebak, tanyakan saat implementasi.

## 6. Reset kampung sementara (permintaan user, BELUM dieksekusi)

Target yang diminta user "untuk sekarang": sisakan 1 rumah +
1 gudang (lumbung), rumah-rumah lain dihapus.

Status: MENUNGGU konfirmasi dan mekanisme aman, karena:

- Dunia ini dipakai bersama — menghapus rumah akan terlihat di
  kedua situs (nusantara dan Negara Emas Fina), bukan hanya di
  satu sisi.
- Penghapusan itu destruktif dan warga penghuni rumah yang
  dihapus harus ditangani sim (pindah/tanpa rumah) supaya tidak
  rusak.
- Asisten tidak bisa menjalankan script ke DB produksi tanpa
  membaca connection string, dan membaca secret itu dilarang.
  Jalur yang mungkin: user menghapus lewat UI game kalau ada,
  atau user menjalankan sendiri script reset yang ada di tree
  (`scripts/reset-village-buildings.js`).

Jangan dieksekusi cron sebelum user mengonfirmasi ulang
dengan sadar dampak dunia bersama di atas.

## 7. Kelangkaan realistis (amendemen user 2026-11-04, MENGGANTIKAN persentase bagian 1)

Keluhan user 2026-11-04 16:14 WIB (dengan tangkapan layar menu):
makanan 400 ribu jam 10 jadi 600 ribu sekarang, "terlalu gampang
nyarinya", minta dibuat "sangat susah mengikuti dunia nyata" —
padahal semua stok sudah ratusan ribu (cek live: kayu 13.648/740,
batu 21.337/630, emas 2.096/210, besi 2.522/265, pangan 632.260/850,
kulit 12.265/425).

Temuan akar (bukan sekadar "angka kurang kecil"):

- Ledger kumpul harian (`kumpul_hari`/`kumpul_harian`) TIDAK PERNAH
  tersimpan di bulkWrite `advanceWorld` — jadi cap harian reset tiap
  poll (3 detik) dan tiap poll memberi jatah penuh lagi. Itulah yang
  dulu menumpuk stok sampai ratusan ribu walau clamp gudang sudah ada.
  Perbaikan: ledger WAJIB ikut `$set` bulkWrite (tes penjaga sumber).
- Clamp gudang sendiri benar (tidak ada jalur tambah yang lolos —
  semua lewat `tambahStokClamp` atau route yang ikut clamp), jadi
  gunung stok yang ada sekarang adalah WARISAN pra-clamp, bukan
  pertumbuhan baru. Tapi tanpa pembusukan, gunung itu tidak akan
  habis dimakan warga (27 warga makan ~1 pangan per makan).

Aturan baru (cap harian 3/2 dan aturan lapar/makan TIDAK berubah):

- Roll biasa (pangan/kayu/batu/kulit): 1 = 64%, 2 = 27%, 3 = 9%
  (rata-rata ~1,45/hari). NOL DIHAPUS atas perintah user 2026-11-04
  ("sehari 1 orang bisa dpt minimal 1 maksimal 3") — setiap trip
  biasa pasti membawa pulang minimal 1; cap harian tetap 3.
  Besi/emas TIDAK berubah (tetap boleh nol, cap 2).
- Besi: biasa 0 = 80%, 1 = 17%, 2 = 3% (rata-rata 0,23, dulu 0,55);
  berbakat 0 = 70%, 1 = 25%, 2 = 5% (rata-rata 0,35, dulu 0,75).
- Emas: 0 = 75%, 1 = 20%, 2 = 5% (rata-rata 0,30).
- Keunggulan (bakat/perkakas) tetap hanya menggeser peluang di
  dalam cap untuk sumber biasa; besi/emas tidak dapat bump.
- Pembusukan tiap ganti hari game, hanya untuk kelebihan di atas
  kapasitas: pangan 50%/hari (tanpa kulkas, di zaman batu makanan
  terbuka cepat busuk), kayu/batu/kulit 10%/hari (melapuk),
  emas/besi 0% (awet). Yang muat di dalam kapasitas aman. Kabar
  hanya bila pangan busuk >= 100 supaya tidak membanjiri kabar.
- Efek ke gunung warisan: pangan 632 ribu dengan busuk 50%/hari
  susut ke sekitar kapasitas dalam ~3 minggu game; kayu/batu/kulit
  menyusul lebih pelan. Setelah itu ekonomi berjalan pada angka
  baru yang jauh lebih kecil — dan itulah yang user minta.
