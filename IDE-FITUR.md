# Ide Fitur Nusantara (backlog)

Dibaca cron tiap run, bersama DESAIN-EKONOMI.md dan brief riset
terbaru di `research/`. Ide yang sudah dibangun dicoret dari sini
dan dicatat di CHANGELOG.md, jangan dibangun dua kali.

## Laporan user 2026-11-05 ~13:48 WIB (video + chat) — SELESAI di r38

User main di nusantara.ranggafigo.com dan merekam buktinya:
pemburu "Ys" berdiri di samping rusa "Rusa" yang bar HP-nya
tetap penuh; tidak ada warga yang mengumpulkan buah/hewan;
minta semua warga bisa melawan dan membunuh hewan; rumah
dibangun menembus restoran sementara "tata kota" AI bilang
tidak ada yang menumpuk; minta sistem petak ala game strategi
(rumah 2x2 = 4 petak).

- 1) Pemburu menyerang tapi hewan tidak mati — SELESAI:
  akar tiga lapis (kabur 120-150 tile/jam sebelum giliran
  pemburu; pemburu hanya mengincar dalam 6 tile dan tidak
  pernah mendatangi mangsa jauh; serangan hanya bila sudah
  bersebelahan di awal giliran) + akar keempat yang ketemu
  saat tes (mengembara 120 tile/jam). Perbaikan: kabur +
  mengembara jinak dibatasi 30 tile/jam, pemburu cari 40 tile,
  lari 1.5x, serang begitu tiba di samping mangsa.
- 2) Tidak ada yang mengumpulkan buah/hewan — SELESAI:
  `lajuKumpul` dikembalikan ke 20 + 5*stat %/jam (dulu
  0.25 + 0.05*stat: satu ronde 150-300 jam game).
- 3) Semua warga bisa melawan/membunuh hewan — SELESAI:
  gate peran dihapus di `stepPerburuan` (pemburu cari 40 tile,
  warga lain oportunis 3 tile) + duel hewan buas terbuka untuk
  semua warga stamina >= 20 (warga lemah tetap kalah/kabur).
- 4) Rumah menembus restoran — SELESAI: penjaga akhir petak
  sebelum placement ditulis (batal + refund bila menumpuk)
  + model paviliun diskalakan pas footprint 8x8 (dulu 0.88,
  visual ~28x24 menelan tetangga).
- 5) "Tata kota" bilang tidak menumpuk — SELESAI: satu helper
  petak kanonik (`ukuranPetak`/`petakBangunan`/
  `occupiedDariPlacements`/`plotBebas`) dipakai sim, rapikan,
  dan tatakota; rapikan/tatakota kini juga memeriksa bangunan
  yang sedang dibangun.
- 6) Sistem petak ala game strategi — SELESAI: tiap bangunan
  menempati petak (gubuk 2x2 = 4, paviliun 8x8 = 64);
  penempatan menolak petak terisi; konsisten di penempatan
  manual (sim) dan cek AI (rapikan/tatakota).
- Sisa yang dicatat, bukan dikerjakan di r38: paviliun jadi
  jauh lebih pendek/gemuk (lebar ~8, tinggi ~3) — bila ingin
  kembali menjulang, footprint katalognya yang diperbesar;
  hewan buas kini bisa dikalahkan warga kuat mana pun — bila
  beruang harus menakutkan lagi, naikkan ambang duel
  (14/18/22), bukan gate peran. Detail di CHANGELOG.md r38.

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
~~SEBAGIAN DIBANGUN 2026-11-04 20:29 WIB~~ — irisan Papan Warga:
fungsi murni `wargaTanpaTugas` di `tampil.ts` (warga dihitung tanpa
tugas bila node null + fase istirahat + aksi beristirahat/rehat
stok penuh; santai sebagai alihan aktif dan istirahat dengan node
masih terpasang sengaja TIDAK dihitung) + tag "💤 tanpa tugas"
(ikon + teks, bukan warna saja, sesuai riset aksesibilitas run ini)
di tiap baris Papan Warga + baris ringkasan di kepala daftar bila
ada yang tanpa tugas. Display-only, tanpa ubah sim. SISA: ikon di
atas warga di peta 3D + satu baris ringkas di kabar kampung.
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
~~SEBAGIAN DIBANGUN 2026-11-04 16:29 WIB~~ — fallback `loading` di
dynamic import `Map3D` (teks "Memuat peta 3D…" + gaya
`.map3d-loading` yang sama dengan layar muat di dalam Map3D),
menutup jendela kosong setelah hydration selama chunk diunduh.
SISA: frame SEBELUM hydration masih mungkin gelap (butuh cangkang
HTML statis di layout) + pemisahan chunk 3D dari paket awal belum
diukur ulang. Verifikasi visual live menyusul (butuh chunk dingin).

Sumber: Mobitoss (muat hanya layar pertama + progres bergerak,
bukan layar kosong) + Playgama (cap DPR, kurangi draw call).
Masalah: muat pertama pernah 60-90 detik ("Memuat Peta 3D..."),
terasa macet. Cara kerja: progres bertahap yang jujur (data dunia
-> peta -> karakter) + pisahkan chunk 3D dari paket awal supaya
halaman ringan tampil dulu. Dampak sedang-tinggi, usaha sedang
(perlu uji ukuran chunk build).

## Ide 8 — Cap DPR kanvas di HP + culling luar viewport (dari riset 2026-11-04 02:29 WIB, sudut performa)
~~SEBAGIAN SUDAH ADA — ditemukan run 2026-11-06 16:29 WIB~~ — cap DPR
SUDAH di kode (`renderer.setPixelRatio(Math.min(
window.devicePixelRatio, 2))`, Map3D baris 1122); Glitchless run ini
menyarankan 1.5, tapi tanpa angka live TIDAK diturunkan. SISA:
culling luar viewport (three sudah frustum-cull per mesh; instanced
= all-or-nothing per bounding volume, jadi butuh
computeBoundingSphere per batch — pola yang dipakai r54 untuk
padi).

Sumber: Playgama (batasi DPR ke 1-2) + ulasan Idle City Builder
(pemain minta sembunyikan bagian peta yang tak terlihat).
Masalah: HP menengah ngelag saat desa ramai. Cara kerja: batasi
pixel ratio renderer di HP, lewati render objek di luar viewport.
Dampak sedang, usaha kecil-sedang (culling butuh uji visual tepi
layar).

## Ide 9 — Jeda loop render saat tab disembunyikan (dari riset 2026-11-04 02:29 WIB, sudut performa)
~~DIBANGUN 2026-11-04 10:29 WIB~~ — listener `visibilitychange`
di `Map3D.tsx` (hidden -> cancelAnimationFrame + raf = 0;
visible -> reset timestamp + mulai lagi hanya bila raf = 0;
listener dilepas saat cleanup) + BUILD_ID r20 + 5 tes penjaga.
Catatan jujur: browser modern sudah menahan RAF di tab hidden,
jadi nilai tambah ini ada di frame basi yang dibatalkan eksplisit,
pencegahan loop ganda, dan reset timestamp — efek baterai tidak
diukur dan tidak diklaim. Sim tidak ikut dijeda (dunia bersama).

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
kecil-sedang. CATATAN riset 2026-11-05 20:29 (Village in the Shade:
hubungan membuka cerita; Moonfrost: cerita warga berkembang):
cek dulu apakah kabar menyimpan pasangan ngobrol secara terstruktur
— bila hanya teks bebas, irisan pertama adalah baris kroniknya saja
(Ide 23), bukan hitungan pasangan. Detail di
research/2026-11-05-2029.md.

## Ide 12 — Satu aksi pertama "Mulai dari sini" di kartu menu (dari riset 2026-11-04 06:29 WIB, sudut UX)
~~DIBANGUN 2026-11-04 08:29 WIB, DENGAN ADAPTASI JUJUR~~ — baris
ketuk "▶ Mulai dari sini" di kartu menu, di bawah panel
"Kampung menginginkan", dari fungsi murni baru
`aksiPertamaBerikutnya` di `sumberdaya.ts` + 8 tes. ADAPTASI:
spesifikasi awal mencontohkan "Mulai: Tata Kota — bangun Gubuk
pertama", tapi di game ini pemain adalah PENGAMAT (bangunan
hanya diputuskan + diantrekan NPC lewat musyawarah; tidak ada
tombol bangun), jadi menunjuk Tata Kota sebagai "bangun" adalah
janji palsu. Yang dibangun: populasi kurang -> baris menutup
menu supaya tombol ＋ Tambah karakter kelihatan (satu-satunya
kekurangan yang bisa diatasi pemain langsung, didahulukan);
selain itu -> baris membuka Musyawarah (forum tempat arah
kampung diputuskan); ujung tangga -> baris hilang. Display-only
di luar itu, tanpa ubah sim.

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
~~DIBANGUN 2026-11-05 00:29 WIB, DENGAN ADAPTASI JUJUR~~ — baris tip
di kartu menu (di bawah panel "Kampung menginginkan" + "Mulai dari
sini", di atas daftar tombol), teks "💡 Kamu menonton, bukan
mengatur: warga bekerja sendiri. Arah kampung diputuskan lewat
Musyawarah, dan target berikutnya ada di panel Kampung
menginginkan." Tombol ✕ menyimpan "0" di localStorage
(`ne_tip_kontekstual`); dibuka lagi dari panel Pengaturan
("Tip kontekstual di menu"). ADAPTASI: contoh awal "Kumpul dulu —
lalu bangun lewat Tata Kota" TIDAK dipakai, karena di game ini
pemain adalah pengamat dan tidak ada tombol bangun — tip menunjuk
Musyawarah sebagai tempat arah diputuskan, bukan Tata Kota sebagai
"bangun". Display-only, tanpa ubah sim. BUILD_ID r31 -> r32 + 7 tes
penjaga. Riset 00:29 (Wayline: tutorial opsional + bisa diakses
lagi, bukan ceramah pembuka) menguatkan spesifikasi ini persis.

Sumber: DEV Community (panduan kontekstual di dekat kontrol asing,
bisa ditutup, bisa dibuka lagi). Masalah: 10 tombol menu sudah
punya penjelasan satu baris, tapi pemain baru tetap tidak tahu
urutan mainnya (kumpul -> bangun -> musyawarah). Cara kerja: satu
baris tip di kartu menu dengan tombol ✕ yang menyimpan
pilihan di localStorage, bisa dibuka lagi dari
Pengaturan/Orientasi. Display-only, tanpa ubah sim. Dampak sedang,
usaha kecil. Tidak direkomendasikan dari riset ini: tur
interaktif multi-langkah (rapuh di kanvas 3D, belum ada bukti
pemain tersesat di langkah spesifik) dan memperkecil teks HUD
(melawan aturan keterbacaan HP).

## Ide 15 — Lapisan ambien kampung siang/malam/cuaca (dari riset 2026-11-04 08:29 WIB, sudut audio)

Sumber: devlog The Laresian Order (ambien dua lapis: loop tempat
+ bunyi acak jarang; crossfade antar tempat; empat saluran
volume), Homestead (trek per suasana + slider Master/Musik/Alam/
Efek yang tersimpan), panduan ambien (lapis loop beda panjang
supaya pola tidak ketahuan; ambien lebih pelan dari bunyi aksi),
kebijakan autoplay browser (AudioContext suspended sampai gestur
pertama; resume harus di dalam handler gestur). Masalah: di luar
SFX pendek, kampung itu bisu — malam terasa sama dengan siang,
hujan tidak terdengar, padahal fase dan cuaca sudah ada di sim.
Cara kerja: satu loop ambien yang berganti lembut menurut fase
(siang: burung + angin; malam: jangkrik + api jauh; hujan:
gemerisik) + bunyi acak jarang, mengikuti toggle Suara yang
sudah ada, mulai hanya setelah gestur pertama pemain,
lazy-load (bukan paket awal). Dampak sedang-tinggi, usaha
sedang; bagian tersulit adalah aset loop berlisensi yang ringan.
Tidak direkomendasikan dari riset ini: ambien generate AI
on-device (berat, boros baterai) dan autoplay saat load (diblokir
browser).

## Ide 16 — Slider volume terpisah: Efek / Ambien (dari riset 2026-11-04 08:29 WIB, sudut audio)

Sumber: Homestead (empat slider tersimpan) + Laresian Order
(empat saluran). Masalah: toggle Suara sekarang all-or-nothing
— pemain yang risih SFX tapi mau ambien (atau sebaliknya) tidak
punya pilihan. Cara kerja: di panel Pengaturan, pecah jadi dua
switch/slider (Efek, Ambien) + simpan di localStorage seperti
pilihan label karakter; default mengikuti toggle lama. Dampak
sedang, usaha kecil.

## Ide 17 — Jeda poll data saat tab hidden (dari riset 2026-11-04 10:29 WIB, sudut performa)
~~DIBANGUN 2026-11-04 (r21, commit ed82341) — dicatat di sini 2026-11-06
karena baru ketahuan belum pernah ditandai~~ — efek di `page.tsx`:
`muat()` awal + `mulaiPoll()` (interval 3 detik); `visibilitychange`:
hidden -> clearInterval + `pollRef.current = null`, visible -> `muat()`
segar + `mulaiPoll()` lagi; cleanup melepas listener + interval.
Interval lokal 1 detik untuk label jam TIDAK dijeda (murah, label jam
harus tetap benar saat kembali).

Sumber: Spicy Yoghurt + Codrops (lihat research/2026-11-04-1029.md).
Masalah: poll `/api/world` dkk. tetap jalan (meski di-throttle
browser) saat tab tidak dilihat. Cara kerja: di `page.tsx`,
hentikan interval poll saat hidden, lanjutkan saat visible dengan
satu fetch segar. Dampak kecil, usaha kecil-sedang; hati-hati:
jam game server tetap jalan, jadi saat kembali UI harus langsung
fetch ulang, bukan menunggu interval berikutnya.

## Ide 18 — Papan Warga satu layar (dari riset 2026-11-04 12:29 WIB, sudut fitur baru)
~~DIBANGUN 2026-11-04 14:29 WIB~~ — entri "👥 Papan Warga" di kartu menu
yang membuka modal daftar seluruh warga dari data `map.warga` yang
SUDAH diambil poll (nama + nomor, peran diformat, status/aktivitas
saat ini) — tanpa fetch baru, tanpa ubah sim, display-only di luar
ketuk baris. Ketuk baris menutup papan lalu membuka panel detail
warga yang sudah ada (pola daftar -> detail); panel Warga lama TIDAK
diganti, papan ini hanya pintu masuknya. Tutup lewat ✕, ketuk latar,
ATAU tombol Tutup di bawah daftar (jangkauan jempol, Ide 21);
baris setinggi 48px dengan jarak antar baris (Ide 20). Peran
diformat pakai `formatLabel` karena /api/map live terverifikasi
tidak mengirim `label_peran`. BUILD_ID r21 -> r22 + 9 tes penjaga.

Sumber: ulasan Village in the Shade (peta satu layar berisi posisi +
info setiap warga dipuji karena menghormati waktu pemain).
Masalah: untuk tahu siapa sedang apa, pemain harus mengetuk warga
satu per satu atau membaca label kecil yang berdesakan. Cara kerja:
satu entri di kartu menu ("Papan Warga") yang menampilkan daftar
seluruh warga dari data /api/map yang SUDAH diambil (nama, peran,
aktivitas/mood saat ini) — tanpa fetch baru, tanpa ubah sim.
Display-only. Dampak sedang-tinggi, usaha kecil. Jembatan menuju
Ide 5: baris warga tanpa pos bisa diberi tanda di papan ini.

## Ide 19 — Musim visual kampung (dari riset 2026-11-04 12:29 WIB, sudut fitur baru)

Sumber: Farming Season "Village Seasons" (semi berbunga, gugur emas,
dingin bersalju — murni visual, tanpa efek ekonomi menurut sumbernya).
Masalah: kampung terlihat sama sepanjang tahun game; tidak ada
penanda waktu berlalu selain angka hari. Cara kerja: rona/aksen
visual ringan yang berputar menurut hari game — murni tampilan,
TIDAK mengubah hasil kumpul/cuaca sim supaya tidak bertabrakan
dengan DESAIN-EKONOMI.md. Dampak sedang, usaha sedang; mulai dari
satu musim dulu, bukan empat sekaligus. Tidak direkomendasikan dari
riset ini: jadwal warga diatur pemain (mengubah pengamat jadi
manajer), aturan horor larangan keluar malam, dan event ulang tahun
per warga (sim tidak menyimpan tanggal lahir).

## Ide 20 — Baris daftar berjarak + teks tidak diperkecil (dari riset 2026-11-04 14:29 WIB, sudut UX)
~~DITERAPKAN di Papan Warga 2026-11-04 14:29 WIB~~ — dijadikan syarat
penerimaan Ide 18, bukan ide terpisah: baris minimal 48px (patokan
Android) dengan jarak antar baris, teks nama tidak lebih kecil dari
teks panel lain. Sumber: Wandr (target sentuh + jarak antar target)
+ panduan pemula Foundation (daftar ringkas -> detail).

## Ide 21 — Tombol tutup panel dalam jangkauan jempol (dari riset 2026-11-04 14:29 WIB, sudut UX)
~~DITERAPKAN di Papan Warga 2026-11-04 14:29 WIB~~ — tombol Tutup di
bawah daftar + ketuk latar sebagai jalan keluar kedua, bukan hanya
✕ pojok atas. Panel lama menyusul bila disentuh run berikutnya.
Sumber: Wandr (tombol tutup di pojok atas jauh = titik tersulit
satu tangan; sediakan ketuk di luar panel sebagai jalan keluar).

## Ide 22 — "Selama kamu pergi" di kartu menu (dari riset 2026-11-04 16:29 WIB, sudut kembali bermain)
~~DIBANGUN 2026-11-05 14:29 WIB~~ — blok "👋 Selama kamu pergi" di
kartu menu (di atas panel "Kampung menginginkan"): fungsi murni
`selamaKamuPergi` di `sumberdaya.ts` membandingkan cuplikan
kunjungan terakhir (localStorage `ne_kunjungan_terakhir`: hari
game + populasi + jenis bangunan selesai) dengan data poll
terbaru — maksimal 3 baris ("Hari 342 -> 349", "Penduduk 9 ->
11", "Bangunan selesai: Gubuk, Lumbung") + tombol ✕ yang
memajukan cuplikan ke keadaan sekarang. Cuplikan ditulis saat
tab disembunyikan/ditutup + di-seed dari poll pertama bila belum
ada; blok hanya muncul bila hari game sudah maju. Display-only,
tanpa fetch baru, tanpa ubah sim, TANPA hadiah offline, TANPA
selisih stok mentah (menyesatkan karena busuk/clamp). BUILD_ID
r38 -> r39 + 18 tes penjaga.
SISA: baris "yang menunggu" (antrean bangunan / warga tanpa
tugas dari data poll yang sudah ada) + tautan/jurnal lengkap dari
kabar kampung.

Sumber: Knightfall Idle (waktu pergi disimulasikan saat kembali,
cap 8 jam) + studi engagement idle game (kejar ketertinggalan
lebih cepat terasa memuaskan, angka harus jujur). Masalah: pemain
kembali setelah berjam-jam, jam game loncat puluhan hari, tapi
tidak ada yang merangkum apa yang berubah. Cara kerja: blok
ringkas di kartu menu membandingkan snapshot kunjungan terakhir
(localStorage: hari game + stok + populasi + bangunan selesai)
dengan data poll terbaru — maksimal 3 baris ("Hari 269 -> 276",
"Bangunan selesai: 2"). Display-only, tanpa fetch baru, tanpa
ubah sim, TANPA hadiah offline (dunia bersama jalan terus untuk
semua orang, bukan untuk satu pemain). Dampak sedang-tinggi,
usaha kecil-sedang.

## Ide 23 — Kronik kampung satu baris (dari riset 2026-11-04 16:29 WIB, sudut kembali bermain)
~~DIBANGUN 2026-11-05 20:29 WIB~~ — satu baris "📜 Kronik kampung" di
kartu menu (di bawah baris Tonggak, di atas tip): fungsi murni
`kronikKampung` di `sumberdaya.ts` dengan aturan prioritas
deterministik dari data poll yang sudah ada — pangan habis/menipis
(<= 25% kapasitas) -> bangunan sedang dibangun (progres terbesar,
dijepit 0..100) -> warga tanpa tugas -> stok penuh (urutan katalog)
-> tonggak berikutnya -> keadaan hari ini (hari + populasi + fase +
cuaca). Display-only, tanpa ubah sim, tanpa fetch baru. BUILD_ID
r45 -> r46 + 18 tes penjaga (tes 8042/637, daftar gagal identik
baseline). Penguat riset run ini: kronik satu baris Plai disebut
developernya "my favorite feature... a single line of text".
Sumber: Plai: Village Tale (satu baris kronik yang bereaksi pada
keadaan game, gaya Dwarf Fortress, lakonis). Masalah: kabar
kampung daftar panjang yang mudah tenggelam; pemain yang hanya
melirik 10 detik tidak menangkap "cerita hari ini". Cara kerja:
satu baris bergilir di kartu menu yang merangkum keadaan terkini
dari data poll (aturan prioritas sederhana, bukan LLM). Syarat:
kalimat harus berasal dari data nyata, bukan karangan. Dampak
sedang, usaha kecil.

## Ide 24 — Aturan kolom kontrol kiri (dari riset 2026-11-04 18:29 WIB, sudut sosial/QoL + UX sentuh)

Sumber: Wandr (target sentuh harus besar DAN berjarak — tetangga yang
terlalu dekat adalah generator salah ketuk). Masalah: tumpukan pil
"Panduan Kontrol" di atas dasar analog terjadi karena dua lapisan UI
(bottom-controls dan Map3D) sama-sama mengklaim pojok kiri-bawah
tanpa aturan bersama. Cara kerja: aturan tertulis — setiap kontrol
baru di kolom kiri-bawah WAJIB menumpuk di atas yang sudah ada
dengan jeda minimal 12px, tidak boleh berbagi koordinat bottom yang
sama; dijaga tes statis (bottom klaster analog + tombol 🕹️ = 60px).
Diterapkan run ini untuk analog; kontrol berikutnya wajib ikut.
Penguat Ide 5 dari riset yang sama: forum Age of Empires menunjukkan
pemain lebih mau MELIHAT warga menganggur (banner/daftar) daripada
kerja mereka diambil alih otomatis — jadi Ide 5 tetap display-only,
tanpa otomasi sim. Tidak direkomendasikan dari riset ini: warga
menganggur otomatis cari kerja terdekat, bunyi peringatan tiap jumlah
menganggur bertambah, dan memindah pil Panduan Kontrol ke atas layar.

## Ide 25 — Hormati prefers-reduced-motion di panel/modal (dari riset 2026-11-04 20:29 WIB, sudut aksesibilitas)
~~DIBANGUN 2026-11-04 22:29 WIB~~ — blok `@media
(prefers-reduced-motion: reduce)` di `globals.css`: transisi
panel/modal/papan dimatikan (muncul langsung), titik stok penuh
berhenti berdenyut tapi tetap merah statis, label melayang diganti
keyframes `floatFadeTenang` (hanya memudar di tempat, tanpa
naik/membesar). Kanvas 3D sengaja tidak disentuh. BUILD_ID
r30 -> r31 + 8 tes penjaga.

Sumber: RunMob (alternatif tenang, bukan hapus umpan balik) +
Game Accessibility Guidelines (kontras, teks jelas). Masalah:
animasi buka/tutup panel dan reveal yang bergerak bisa mengganggu
pemain yang sensitif gerak. Cara kerja: media query
`prefers-reduced-motion: reduce` di `globals.css` yang mengubah
animasi panel/modal menjadi fade singkat/statis. Dampak
kecil-sedang, usaha kecil. Mulai dari panel saja, bukan kanvas 3D.

## Ide 26 — Cincin fokus terlihat di menu dan modal (dari riset 2026-11-04 20:29 WIB, sudut aksesibilitas)
~~DIBANGUN 2026-11-05 04:29 WIB~~ — satu aturan `:focus-visible`
di `globals.css` untuk FAB menu + semua kontrol di kartu menu dan
modal (`.menu-fab`, `.menu-card :`, `.modal-box :`): outline putih
3px + offset 2px + box-shadow gelap 5px (= offset + lebar, dua nada
bersentuhan sehingga satu sisi selalu kontras di atas latar terang
maupun gelap) + fallback forced-colors (outline Highlight, tanpa
shadow). Tanpa transisi/animasi pada cincin (patuh reduced-motion
r31); TIDAK menghapus outline global apa pun dan TIDAK menyentuh
`.px-input` yang sudah punya `:focus` sendiri. BUILD_ID r32 -> r33
+ 6 tes penjaga. Uji Tab/Shift+Tab/Escape secara visual menyusul
(browser task run ini hanya mengamati, bukan menekan Tab).

Sumber: RunMob (indikator fokus harus tetap terlihat di atas
gambar game, urutan Tab mengikuti layar) + riset run ini
(Level Access + Modern CSS Layouts, dua nada + forced-colors).
Masalah: pemain keyboard/tab tidak tahu tombol mana yang sedang
aktif karena fokus tenggelam di atas gambar peta. Cara kerja: aturan
`:focus-visible` dengan outline kontras untuk tombol menu/modal
(bukan menghilangkan outline global). Dampak kecil, usaha kecil.
Uji dengan Tab/Shift+Tab/Escape.

## Ide 27 — Hitung draw call peta sebelum mengoptimalkan apa pun (dari riset 2026-11-04 22:29 WIB, sudut performa)
~~DIBANGUN 2026-11-06 06:29 WIB (r49)~~ — log `console.info("[Nusantara
baseline render]", { drawCalls, triangles, geometries, textures,
programs, pixelRatio })` SEKALI setelah frame ke-120, dibaca tepat
setelah `renderer.render()` (info direset tiap render call, three
0.187) supaya angkanya milik frame yang baru di-render; penghitung +
flag di closure effect (tidak di-log ulang saat tab kembali dari
hidden). Display-only, tanpa ubah render/sim. KOREKSI CATATAN: brief
research/2026-11-06-0429.md mengklaim ide ini "DIBANGUN run ini",
tapi tree saat run 06:29 dimulai TIDAK berisi `renderer.info` sama
sekali — klaim itu tidak tercermin di kode; yang benar dibangun di
r49 ini. Angka baseline live dicatat di CHANGELOG r49 setelah
verifikasi konsol. +14 tes penjaga (RONDE 49).

Sumber: Simplified (draw call = bottleneck utama WebGL, target HP
<50/frame) + Glitchless (`renderer.info` sebagai pengukur: draw
call + segitiga + geometri/tekstur yang hidup). Masalah: "ngelag
di HP" dilaporkan tanpa angka, jadi perbaikan performa selama ini
menebak. Cara kerja: tampilkan/log sekali `renderer.info.render.calls`
+ triangles dari Map3D, catat sebagai baseline di CHANGELOG sebelum
mengubah render apa pun. Display-only, tanpa ubah sim. Dampak
sedang (membuat optimasi berikutnya terukur), usaha kecil.

## Ide 28 — Instancing untuk pohon/batu yang berulang di peta (dari riset 2026-11-04 22:29 WIB, sudut performa)
~~SEBAGIAN DIBANGUN 2026-11-06 16:29 WIB (r54) — JENIS PERTAMA: PADI
SAWAH~~ — helper murni `rumpunPadi(w, h)` di `tampil.ts` (salinan
persis loop lama: posisi/rotasi/warna sama) + `createSawahLuas`
kini memakai SATU `InstancedMesh` (1 ConeGeometry + 1 material
putih + warna per rumpun via `setColorAt` + `computeBoundingSphere`
supaya culling tetap benar) — 16 draw call -> 1 per sawah 4x4.
CATATAN JUJUR: observasi live run ini (37 placements, /api/map
16:32 WIB) menemukan sawah_luas = 0 di desa — jadi draw call live
TIDAK berubah hari ini; efeknya hidup begitu sawah pertama
dibangun (balai + dapur umum sudah berdiri). +24 tes (RONDE 54).
SISA jenis: tiang pagar peternakan (~18 Mesh per peternakan),
rumpun rempah perkebunan, geometri per placement (Ide 51).

Sumber: Simplified + Glitchless (InstancedMesh: banyak salinan
geometri sama = 1 draw call; jangan buat geometri/material per
objek). Masalah: desa ramai = ratusan objek berulang yang
masing-masing satu draw call, pola yang kedua sumber sebut
penyebab utama ngelag HP. Cara kerja: kelompokkan mesh statis
berulang (pohon, batu, semak) per jenis menjadi InstancedMesh,
mulai dari satu jenis dulu, ukur draw call sebelum/sesudah
(Ide 27), pastikan klik/raycast tetap benar. Dampak
sedang-tinggi, usaha sedang. Bukan untuk satu run tanpa baseline
Ide 27 dulu. Tidak direkomendasikan dari riset ini: migrasi
WebGPU (perombakan renderer, risiko kompatibilitas) dan cap pixel
ratio membabi buta tanpa baseline + cek label.

Sumber: Simplified + Glitchless (InstancedMesh: banyak salinan
geometri sama = 1 draw call; jangan buat geometri/material per
objek). Masalah: desa ramai = ratusan objek berulang yang
masing-masing satu draw call, pola yang kedua sumber sebut
penyebab utama ngelag HP. Cara kerja: kelompokkan mesh statis
berulang (pohon, batu, semak) per jenis menjadi InstancedMesh,
mulai dari satu jenis dulu, ukur draw call sebelum/sesudah
(Ide 27), pastikan klik/raycast tetap benar. Dampak
sedang-tinggi, usaha sedang. Bukan untuk satu run tanpa baseline
Ide 27 dulu. Tidak direkomendasikan dari riset ini: migrasi
WebGPU (perombakan renderer, risiko kompatibilitas) dan cap pixel
ratio membabi buta tanpa baseline + cek label.

## Ide 29 — Tonggak kampung yang terlihat (dari riset 2026-11-05 00:29 WIB, sudut onboarding + prestasi)
~~SEBAGIAN DIBANGUN 2026-11-05 12:29 WIB~~ — irisan baris ringkas:
fungsi murni `tonggakKampung` di `sumberdaya.ts` (7 tonggak dari
tangga DESAIN-EKONOMI.md: Api pertama, Gubuk pertama, Lumbung,
Populasi 10, Bengkel pertama, Balai, Paviliun makan) + baris
"🏅 Tonggak kampung: N dari 7" di kartu menu (yang tercapai +
SATU berikutnya yang paling dekat; "Semua tonggak tercapai!"
bila penuh). Display-only, tanpa hadiah ekonomi, tanpa ubah
sim, tanpa fetch baru. BUILD_ID r36 -> r37 + 14 tes penjaga.
SISA: kilas "Tonggak baru!" (snapshot localStorage) + panel
detail tonggak.
Sumber: Wayline (umpan balik jelas + tutorial opsional) + catatan
desain idle (retensi = frekuensi umpan balik bermakna; milestone
otomatis pada ambang; achievement terbaik bila bermakna, bukan
kosmetik; jangan menumpuk banyak sistem sebelum satu loop
diinternalisasi). Masalah: antara panel "Kampung menginginkan"
(target berikutnya) dan kabar yang tenggelam, tidak ada rekam "apa
yang sudah dicapai" — pemain yang kembali hanya melihat keadaan
sesaat, bukan kemajuan kumulatif. Cara kerja: deretan kecil di
kartu menu yang diturunkan dari data poll yang SUDAH ada
(populasi, bangunan berdiri, hari game) — mis. "Gubuk pertama
berdiri", "Populasi 10", "Balai berdiri" — display-only, tanpa
efek ekonomi, tanpa sim baru, tanpa hadiah yang bisa digandakan di
dunia bersama. Mulai dari 4-5 tonggak tangga DESAIN-EKONOMI.md,
bukan puluhan achievement. Dampak sedang, usaha kecil-sedang.
Tidak direkomendasikan dari riset ini: lapisan prestige/reset,
hadiah klaim offline, tur interaktif multi-langkah, dan puluhan
achievement sekaligus (lihat brief research/2026-11-05-0029.md).

## Ide 30 — Audit geometri/material bersama sebelum instancing (dari riset 2026-11-05 02:29 WIB, sudut performa)
~~DIBANGUN 2026-11-05 06:29 WIB~~ — audit statis + 10 tes penjaga
(node alam sudah InstancedMesh per jenis; cache material desa
module-level; rebuild bergerbang signature + dispose traverse)
+ laporan celah di CHANGELOG sebagai prasyarat Ide 28, tanpa
mengubah render: geometri per placement belum dibagi, padi sawah
per rumpun (geometri + material baru — kandidat instancing
pertama), disposeGroup ikut membuang material cache bersama,
karakter bukan kandidat instancing (butuh pose per bagian).
Riset run ini menambah pembeda IGC: berbagi material saja tidak
menurunkan draw call. Detail di research/2026-11-05-0629.md.
~~CELAH DISPOSE DITUTUP 2026-11-05 10:29 WIB~~ — `disposeGroup`
kini melewati material bersama via predikat `isVillageMaterial`
/ `isRoadMaterial` (BUILD_ID r36, +10 tes); cleanup unmount
tetap membuang semua. SISA celah: geometri per placement + padi
per rumpun.

Sumber: Glitchless (ukur dulu lewat renderer.info; tiap mesh minimal
satu draw call) + Aetumi (InstancedMesh = satu geometri + satu
material + N matriks; culling instancing all-or-nothing). Masalah:
belum ada yang tahu apakah ngelag di HP berasal dari draw call,
bayangan, atau piksel — dan instancing (Ide 28) sia-sia bila tiap
pohon/batu ternyata masih membuat geometri/material sendiri di
loop render. Cara kerja: tes statis + audit kode Map3D — pastikan
geometri/material pohon, batu, semak dibuat sekali di luar loop
dan dipakai ulang semua salinan; laporkan temuan di CHANGELOG
sebagai prasyarat Ide 28, tanpa mengubah render dulu. Dampak
sedang, usaha kecil. BUKAN duplikat Ide 27 (angka baseline
runtime) maupun Ide 28 (InstancedMesh itu sendiri). Detail di
research/2026-11-05-0229.md.

## Ide 31 — Pesta kampung sebagai saluran buang pangan berlebih (dari riset 2026-11-05 08:29 WIB, sudut ekonomi/sim)

Sumber: panduan Northgard (pesta = cara membuang pangan berlebih
secara berguna, ditukar dorongan singkat) + Medieval Dynasty
(hasil busuk dialihkan jadi pupuk, bukan sekadar lenyap).
Masalah: pangan di atas kapasitas sekarang hanya menunggu
membusuk 50%/hari — pasif, tidak terasa sebagai keputusan.
Cara kerja: saat pangan melewati kapasitas, kabar mengumumkan
pesta; versi display-only dulu (pengumuman + warga berkumpul di
balai/paviliun di hari pesta), versi sim belakangan (kelebihan
pangan habis ditukar dorongan mood singkat). Jembatan dari Ide 10
(festival berkala): ini versi daruratnya, dipicu stok bukan
kalender. Dampak sedang, usaha sedang (display-only: kecil).
Tidak direkomendasikan dari riset ini: cap keras ala FreeCol
(hapus semua kelebihan seketika) dan pembusukan persen dari total
stok ala Utopia (menggerus stok dalam kapasitas yang dinyatakan
aman). Detail di research/2026-11-05-0829.md.

## Ide 38 — Label hewan meredup saat tidak diburu (dari riset 2026-11-06 00:29 WIB, sudut UX)
~~DIBANGUN 2026-11-06 12:29 WIB (r52)~~ — helper murni
`opacityLabelHewan` di `tampil.ts` (relevan -> 1, tenang -> 0.45)
+ satu baris di loop hewan Map3D (`cur.label.style.opacity` dari
`showHp`, kondisi yang sama dengan tampilnya bar HP: terluka ATAU
diburu). Nilai 0.45 adalah adaptasi jujur dari 20% WoW: label 10px
di atas kanvas 3D terang akan hampir tak terbaca di 20% (aturan
keterbacaan PUNCHEV). Display-only, tanpa ubah sim, tanpa ubah
antrean rapikan. +17 tes (RONDE 52: helper + call site + kelas
dasar + penjaga Ide 39 + audit versi). Observasi run ini (26–28
label hewan, menumpuk dengan label warga di pusat) adalah
prasyarat yang dipenuhi. Verifikasi visual (label hewan tenang
benar-benar meredup di layar) menyusul — browser task run ini
hanya mengamati sebelum deploy.
Sumber: forum WoW (transparansi 20% untuk nameplate bukan target di
luar combat). Masalah: 13-17 hewan berlabel sekaligus menambah
kebisingan visual di pusat kampung. Cara kerja (display-only): label
hewan yang tidak sedang diburu tampil dengan opacity lebih rendah;
yang sedang diburu tetap penuh + bar HP seperti sekarang. Dampak
kecil-sedang, usaha kecil. Detail di research/2026-11-06-0029.md.

## Ide 39 — Label warga terpilih selalu paling depan (dari riset 2026-11-06 00:29 WIB, sudut UX)
~~SUDAH ADA — dicek run 2026-11-06 12:29 WIB, TIDAK dibangun ulang~~ —
`.map3d-label.sel` di `globals.css` SUDAH punya `z-index: 25`
(commit af5cdfa), jadi label warga yang dipilih sudah menang atas
label lain (z-index auto) karena semua label adalah sibling di
`.map3d-labels`. Yang ditulis ide ini ("tergeser ke bawah antrean")
adalah soal posisi Y dari `rapikanLabelBertumpuk` (menggeser ke
bawah, bukan menumpuk), bukan soal tertutup. Dijaga tes RONDE 52
(asersi `.sel` mengandung `z-index: 25;`) supaya pembersihan CSS
masa depan tidak menghapusnya diam-diam. Bila observasi menemukan
label `.sel` benar-benar tertutup, itu defect baru dengan bukti
visual, bukan Ide 39.
Sumber: forum WoW ("current target shifted into the foreground").
Masalah: label warga yang sedang dipilih (`.sel`) bisa tergeser ke
bawah antrean dan tertutup label lain. Cara kerja (display-only):
dalam antrean gabungan, entri terpilih dijamin tidak digeser oleh
entri lain (ditempatkan terakhir / di depan). Dampak kecil, usaha
kecil. Detail di research/2026-11-06-0029.md.

## Ide 48 — Label hewan memudar dengan jarak kamera (dari riset 2026-11-06 12:29 WIB, sudut UX)
~~DIBANGUN 2026-11-06 14:29 WIB (r53)~~ — helper murni
`opacityLabelHewanJarak(relevan, camDist)` di `tampil.ts` (penuh sampai
80 = jarak bingkai normal Map3D, memudar linear ke 0 di 130 = ambang
sembunyi label, dikali opacity relevansi r52; NaN jatuh ke dasar) +
satu baris di loop hewan Map3D (`opacityLabelHewanJarak(showHp,
camDist)`). Display-only, tanpa ubah sim, label warga tidak disentuh.
+28 tes (RONDE 53: nilai tengah 105, monoton turun, fallback NaN,
penjaga Ide 38). Prasyarat observasi terpenuhi (hewan terlihat, label
menumpuk di pusat, zoom bekerja) + verifikasi visual r52 terkonfirmasi
run ini (label tenang pucat vs ber-bar HP penuh). Verifikasi VISUAL
efek r53 (label benar-benar memudar saat zoom keluar) menyusul —
butuh perbandingan zoom dekat vs jauh di layar.
Sumber: forum WoW (OP: "I will see dozens of floating nameplates
from afar" — puluhan nameplate dari kejauhan) + PUNCHEV (minimize
clutter). Masalah: dari kejauhan (zoom out), puluhan label kecil
menjadi bintik-bintik teks yang tidak terbaca tapi tetap memenuhi
layar. Cara kerja (display-only): opacity label hewan ikut jarak
kamera (`camDist` sudah ada di loop Map3D; label sudah
disembunyikan bila `camDist > 130`) — meredup bertahap saat kamera
menjauh, sebelum hilang total di 130. Mulai dari hewan dulu
(karena jumlahnya paling banyak), bukan warga. Dampak kecil,
usaha kecil. CATATAN: jangan digabung dengan Ide 38 dalam satu
run — dua perubahan opacity sekaligus membuat efek
masing-masing tidak terukur. Detail di research/2026-11-06-1229.md.

## Ide 49 — Musik adaptif berlapis mengikuti fase & cuaca (dari riset 2026-11-06 14:29 WIB, sudut audio)

Sumber: DepartureMusic (vertical layering untuk game cozy: stem
berbagi tempo/kunci/panjang loop yang sama; satu parameter kontinu
0–1 + lerp mengalahkan saklar diskrit; pad selalu bunyi, melodi saat
menjelajah, perkusi saat crafting, aksen saat momen bermakna).
Masalah: kampung bisu secara musikal — siang terasa sama dengan
malam, pasar dan hujan tidak terdengar bedanya, padahal fase, cuaca,
dan momen (pasar mingguan, tonggak) sudah ada di data poll. Cara
kerja: SATU parameter kontinu `intensitas` (0–1) dari data poll yang
sudah ada (fase siang/malam + cuaca + hari pasar/momen) → gain tiga
lapis prosedural (pad selalu bunyi; melodi masuk saat warga ramai/
aktif; aksen saat momen) dengan crossfade lerp, mengikuti toggle
Suara + gate gestur, tanpa aset, tanpa fetch baru, tanpa ubah sim.
Irisan pertama: fungsi murni `lapisanMusik(fase, cuaca, momen)` →
gain + tes; bunyinya belakangan setelah Ide 32 (ambien) hidup,
supaya satu infrastruktur audio. Dampak sedang-tinggi, usaha sedang.
Tidak direkomendasikan dari riset ini: FMOD/Wwise (middleware berat,
bukan web), generate AI on-device, satu loop statis (cara tercepat
merusak imersi game cozy). Detail di research/2026-11-06-1429.md.

## Ide 50 — Keluarga bunyi UI: konfirmasi, batal, gagal, terkunci (dari riset 2026-11-06 14:29 WIB, sudut audio)

Sumber: FlutuMusic (bunyi UI = desain umpan balik, bukan dekorasi;
tiap bunyi dinamai dari EVENT-nya; konfirmasi vs error beda BENTUK
bukan cuma volume; bunyi rutin pendek + variasi kecil; sonic
grammar; cooldown/voice-limit untuk ketukan cepat) + RouteNote
(petakan semua state antarmuka dulu; pisahkan focus dari
confirmation). Masalah: menu Nusantara (10 tombol + modal + papan)
tidak memberi umpan balik suara sama sekali — pemain hanya
mengandalkan visual untuk tahu ketukannya terdaftar, ditolak, atau
terkunci; padahal toggle Suara sudah ada. Cara kerja: satu keluarga
cue prosedural (osilator/filter dari infrastruktur `audio.ts` yang
sama) dengan bentuk berbeda per event — konfirmasi (naik, bersih),
batal (turun, pendek), gagal/terkunci (nada rendah, terputus,
dikenali tanpa menghukum) — pendek + variasi kecil + cooldown/
voice-limit untuk ketukan cepat; hanya memperkuat visual, bukan
menggantikan sinyal visual; ikut toggle Suara + gate gestur. Irisan
pertama: fungsi murni pemetaan event → spesifikasi cue + satu helper
osilator di `audio.ts` + tes. Mulai dari 4 event dulu (buka/tutup,
konfirmasi, batal, terkunci), bukan 15 sekaligus. Dampak sedang,
usaha kecil-sedang. Tidak direkomendasikan dari riset ini: bunyi di
tiap hover/animasi (bila tidak menjawab timing/konfirmasi/keadaan/
perhatian, diam lebih baik), bunyi sinematik untuk aksi rutin,
sukses/gagal hanya beda volume. Detail di
research/2026-11-06-1429.md.

## Ide 51 — BatchedMesh / bagi geometri untuk bangunan yang berulang (dari riset 2026-11-06 16:29 WIB, sudut performa)

Sumber: Aetumi ("Choose merging for frozen scenery and
`BatchedMesh` for distinct-but-batched objects; choose
`InstancedMesh` when the geometry is identical") + Glitchless
("Share one geometry and one material between copies; never
create them per object"). Masalah: audit Ide 30 menyisakan
"geometri per placement belum dibagi" — gubuk ada 6 di desa live
(/api/map 16:32 WIB), tiap gubuk membuat geometrinya sendiri;
begitu pula balai x3, menara jaga x3. Cara kerja: bagi
geometri/material per jenis bangunan (cache module-level seperti
material desa) ATAU `BatchedMesh` untuk jenis yang geometrinya
beda-beda tapi materialnya sama. Mulai dari satu jenis (gubuk),
ukur `renderer.info` sebelum/sesudah — jangan mulai sebelum angka
baseline live r49 terbaca. Dampak sedang, usaha sedang.
Perhatian: dispose jangan buang geometri bersama saat rebuild +
raycast tap tetap ke grup placement. Detail di
research/2026-11-06-1629.md.

## Ide 52 — LOD / detail meredup untuk objek kecil saat kamera jauh (dari riset 2026-11-06 16:29 WIB, sudut performa)

Sumber: Aetumi (LOD menukar versi murah saat objek jauh; "LOD
operates per object, so it does not combine with a single
InstancedMesh out of the box" — untuk field instanced, pisah jadi
tier per jarak). Masalah: rumpun padi, tiang pagar, herba — detail
kecil yang tetap digambar penuh segitiganya saat kamera jauh (zoom
keluar), padahal menutupi beberapa piksel saja. Cara kerja: untuk
objek UNIK (bukan instanced), pakai `THREE.LOD` dengan versi murah
di jarak jauh; untuk field instanced, pisah jadi tier per jarak
bila perlu. Mulai dari satu jenis dulu + ukur segitiga
sebelum/sesudah. Dampak kecil-sedang, usaha sedang. Bukan
prioritas sebelum Ide 51. Detail di research/2026-11-06-1629.md.

## Ide 53 — Baris "Yang menunggu" di blok "Selama kamu pergi" (dari riset 2026-11-06 18:29 WIB, sudut kembali bermain)
~~DIBANGUN 2026-11-06 18:29 WIB (r55)~~ — fungsi murni
`barisYangMenunggu` di `sumberdaya.ts` (bangunan sedang dibangun
progres terbesar + "dan N lagi", dijepit 0..100; jumlah warga tanpa
tugas; gabung " · "; null bila kosong) + satu baris "⏳ Yang
menunggu: …" di dalam blok `{pergi && (...)}` di `page.tsx`
(`dibangunList` + `tanpaTugasCount` dihitung sekali, dipakai kronik
dan baris ini). Display-only, tanpa ubah sim, tanpa fetch baru,
tanpa hadiah offline; kontrak `selamaKamuPergi` tetap maksimal 3
baris perubahan. +29 tes (RONDE 55). CATATAN JUJUR: antrean live
saat deploy semuanya selesai, jadi baris ini kemungkinan tidak
tampil sampai ada bangunan baru dibangun / warga tanpa tugas —
itu perilaku benar, verifikasi visual menyusul.
Sumber: gamedesign.gg (handoff return screen: "immediately point
the player at what ... to do next") + Strike-Command ("TODAY'S 3
THINGS"). Masalah: blok "Selama kamu pergi" berhenti di "apa yang
berubah" (observasi run ini: hanya "Hari 470 → 477"), pemain
kembali tetap tidak tahu apa yang butuh perhatian sekarang. Cara
kerja: satu baris tambahan di blok yang sama dari data poll yang
sudah ada. Dampak sedang, usaha kecil. Detail di
research/2026-11-06-1829.md.

## Ide 54 — Kilas "Tonggak baru!" sejak kunjungan terakhir (dari riset 2026-11-06 18:29 WIB, sudut kembali bermain)
~~DIBANGUN 2026-11-06 20:29 WIB (r56)~~ — fungsi murni `tonggakBaru`
di `sumberdaya.ts` (membandingkan cuplikan kunjungan terakhir
dengan keadaan poll terbaru lewat `tonggakKampung` yang sudah ada;
format cuplikan TIDAK perlu diubah — ketujuh tonggak diturunkan
dari populasi + jenis bangunan yang sudah tersimpan) + satu baris
"✨ Baru: …" di dalam blok Tonggak di `page.tsx` (hilang bila tidak
ada yang baru; BUKAN baris ke-4 blok pergi — kontrak "maksimal 3
baris" `selamaKamuPergi` dijaga tes) + CSS `.menu-tonggak-baru`
tanpa animasi (patuh reduced-motion). Display-only, tanpa hadiah
ekonomi, tanpa ubah sim, tanpa fetch baru. BUILD_ID r55 -> r56 +
24 tes penjaga (RONDE 56). CATATAN JUJUR: dunia live saat deploy
sudah "7 dari 7" (semua tonggak tercapai), jadi kilas ini TIDAK
akan tampil di Suka Maju sampai ada dunia/kampung baru yang
mencapai tonggak — itu perilaku benar, verifikasi visual menyusul
di dunia baru; yang terverifikasi adalah tes offline + tidak ada
regresi build/API. Penguat riset run ini: PocketGamer ("celebrate
their accomplishments — each goal achieved") + WizusLabs ("first
win ... reacts, immediately and generously") + Second Screen
("a short pop-up for real milestones").

## Ide 55 — Jurnal kembali: kabar sejak kunjungan terakhir (dari riset 2026-11-06 18:29 WIB, sudut kembali bermain)

Sumber: Monotony Idle (laporan 24 jam saat kembali) + SISA Ide 22
bagian kedua. Masalah: kabar kampung adalah daftar panjang yang
tenggelam; pemain yang kembali tidak bisa menyaring "apa yang
terjadi selama saya pergi". Cara kerja (display-only): bila data
poll sudah membawa kabar dengan penanda waktu/hari, tampilkan
tautan/jurnal ringkas dari blok "Selama kamu pergi" ke kabar yang
terjadi setelah hari kunjungan terakhir. Dampak sedang, usaha
sedang. Perhatian: cek dulu apakah kabar di poll membawa hari game
per entri — bila hanya teks bebas tanpa hari, ide ini mundur ke
pengecekan struktur data dulu (seperti catatan Ide 41/45). Detail
di research/2026-11-06-1829.md.

## Ide 56 — Denyut sekali + titik statis di tombol menu saat tonggak baru (dari riset 2026-11-06 20:29 WIB, sudut onboarding)
~~DIBANGUN 2026-11-06 22:29 WIB (r57)~~ — helper murni
`tonggakBaruBelumDilihat` di `sumberdaya.ts` (yang belum dilihat dari
`baru` vs `dilihat`; non-array -> [], entri kosong/bukan-string
dilewati) + state `tonggakDilihat` di `page.tsx` + hitungan
`tonggakBaru` di-hoist sekali sebelum return (`baruTonggak`, dipakai
FAB DAN kilas r56 — tidak ada dua hitungan) + handler `bukaMenu`
(menandai tonggak saat ini sebagai dilihat, lalu buka menu) +
`<span className="menu-fab-dot">` di FAB bila ada yang belum dilihat
+ CSS `.menu-fab-dot` (titik merah 12px, garis putih 2px,
`pointer-events: none`, denyut `denyutFabDot 0.8s ease-out 3` =
TERBATAS lalu diam jadi titik statis) + override reduced-motion
(`animation: none`, titik statis tetap tampil) + aria-label FAB
menyebut "ada tonggak baru" (screen reader). Display-only, tanpa
ubah sim, tanpa fetch baru, tanpa bunyi. BUILD_ID r56 -> r57 + 33
tes penjaga (RONDE 57; 3 asersi call-site r56 diperbarui ke
`baruTonggak`). CATATAN JUJUR: dunia live "7 dari 7", jadi titik
ini TIDAK akan tampil di Suka Maju sampai ada tonggak baru di
dunia/kampung baru — perilaku benar, verifikasi visual menyusul.
Sumber: Braze (red-dot blindness: lencana harus langka, bila selalu
ada ia kehilangan dampak; badge = pesan Low/pasif) + Pope Tech
(animasi status seperti pulsing dot butuh alternatif statis di bawah
reduced-motion; animasi otomatis >5 detik harus bisa dijeda, WCAG
2.2.2). Masalah: kilas "✨ Baru: …" (Ide 54) hanya terlihat bila
pemain membuka kartu menu. Cara kerja: lihat di atas. Dampak
kecil-sedang, usaha kecil. Detail di research/2026-11-06-2229.md.

## Ide 57 — Orientasi menyebut pekerjaan pemain dalam satu kalimat (dari riset 2026-11-06 20:29 WIB, sudut onboarding)

Sumber: WizusLabs (orientasi menjawab "di mana saya, ini apa, apa
yang saya sentuh?" dalam sekali lirik; instruksi menjawab
pertanyaan yang belum ditanyakan). Masalah: panel Orientasi yang
ada belum tentu menjawab ketiganya dalam sekali lirik untuk pemain
yang benar-benar baru. Cara kerja (display-only): audit panel
Orientasi + baris tip (Ide 14) terhadap tiga pertanyaan itu; bila
ada yang belum terjawab sekali lirik, perbaiki KALIMATNYA saja
(mis. "Kamu menonton kampung Suka Maju. Warga bekerja sendiri; arah
diputuskan lewat Musyawarah. Ketuk warga untuk mengikutinya.").
Tanpa ubah sim, tanpa panel baru, tanpa tutorial multi-langkah.
Dampak kecil, usaha kecil. Perhatian: ini audit teks, bukan
pembangunan fitur — kerjakan hanya bila observasi menunjukkan
pemain baru sungguh tersesat di satu pertanyaan. Detail di
research/2026-11-06-2029.md.

## Ide 58 — Denyut sekali pada tombol ＋ Tambah karakter saat populasi jadi penghambat (dari riset 2026-11-06 22:29 WIB, sudut UX/perhatian)
~~DIBANGUN 2026-11-07 00:29 WIB (r58)~~ — fungsi murni
`dotTambahAktif(butuhTambah, adaTonggakBelumDilihat)` di
`sumberdaya.ts` (true hanya bila butuh tambah DAN tidak ada tonggak
baru yang belum dilihat — ATURAN SATU PENANDA) + `kb`/`aksi`
di-hoist sekali sebelum return di `page.tsx` (dipakai baris "Mulai
dari sini" DAN penanda; tidak ada dua hitungan) + prop
`tandaPopulasi` di `TambahKarakter` (titik `.tk-fab-dot` di sudut
tombol ＋, denyut terbatas 3x lalu diam, titik statis di bawah
reduced-motion, aria-label menyebut "kampung masih kurang warga")
+ CSS `.tk-fab-dot` memakai keyframes `denyutFabDot` yang sama
dengan titik tonggak (tidak diduplikat). Display-only, tanpa ubah
sim, tanpa fetch baru, tanpa bunyi. BUILD_ID r57 -> r58 + 32 tes
penjaga (RONDE 58; 1 asersi lama diperbarui: `<TambahKarakter />`
-> `<TambahKarakter tandaPopulasi={dotTambah} />`). CATATAN JUJUR:
kondisi live saat deploy MEMENUHI (populasi 12 < 20, tonggak 7/7
tanpa yang baru) — jadi titik ini SEHARUSNYA tampil di Suka Maju
begitu r58 live; verifikasi visual dilakukan run ini setelah
deploy (berbeda dari r56/r57 yang tidak bisa tampil di dunia ini).
Titik hilang sendiri begitu populasi mencapai 20 (aksi pertama
bukan lagi "tambah") — tidak ada state "dilihat" seperti titik
tonggak, karena ini sinyal keadaan, bukan sinyal "baru".
Sumber: Braze (red-dot blindness) + pola Ide 56. Masalah: bila
"Kampung menginginkan" berkata populasi kurang — satu-satunya
kekurangan yang bisa diatasi pemain langsung (Ide 12) — tombol ＋
Tambah karakter tidak memberi sinyal apa pun di luar menu. Cara
kerja (display-only): pola titik + denyut terbatas yang sama seperti
Ide 56, di tombol ＋. Perhatian: ATURAN SATU PENANDA — bila titik
tonggak (Ide 56) sedang tampil, titik ini TIDAK tampil bersamaan;
dua titik sekaligus adalah awal red-dot blindness. Prioritas:
tonggak baru dulu, populasi sesudah titik tonggak dilihat. Dampak
kecil, usaha kecil. Detail di research/2026-11-06-2229.md.

## Ide 41 — Baris "Sering bersama" di Papan Warga (dari riset 2026-11-06 06:29 WIB, sudut sosial/QoL)

Sumber: Lakeburg Legacies (jurnal mencatat semua pertemuan, sapaan,
ambivalensi) + MCA Reborn (panel warga satu layar: nama, profesi, mood,
kepribadian, hati hubungan, analisis interaksi terakhir). Masalah:
obrolan warga sudah ada tapi tidak meninggalkan jejak — pemain tidak
tahu siapa dekat dengan siapa (sudah dicatat Ide 11). Cara kerja
(display-only): bila sim menyimpan pasangan ngobrol secara terstruktur,
tiap baris Papan Warga menampilkan satu nama teman terdekat ("Sering
bersama: Ys"); bila data tidak terstruktur, irisan pertama mundur ke
baris kroniknya saja (Ide 23 sudah hidup). WAJIB cek struktur data dulu
sebelum menghitung pasangan. Dampak sedang, usaha kecil-sedang.
Detail di research/2026-11-06-0629.md.

## Ide 42 — Rumor berguna ber-atribusi di kabar (dari riset 2026-11-06 06:29 WIB, sudut sosial/QoL)

Sumber: MCA Reborn ("Rumors": warga memberi info struktur + koordinat,
atau mengaku belum dengar apa-apa). Masalah: kabar kampung daftar
panjang yang mudah tenggelam; info berguna tidak punya pembawa. Cara
kerja (display-only): satu baris kabar sesekali ber-atribusi ("Kata
Budi: lumbung sudah penuh…") yang isinya HANYA fakta dari data poll
yang sudah ada — tanpa karangan (aturan Ide 23). Belum diputuskan:
frekuensi (biar tidak membanjiri kabar) + sumber fakta mana yang boleh
dikutip. Dampak sedang, usaha kecil. Tidak direkomendasikan dari riset
ini: matchmaking/pernikahan ala Lakeburg, interaksi pemain-warga ala
MCA, gosip karangan LLM, hadiah antar warga sebagai sistem ekonomi
baru. Detail di research/2026-11-06-0629.md.

## Ide 43 — Kandang/pagar sebagai zona hewan (dari riset 2026-11-06 08:29 WIB, sudut ekonomi/sim)

Sumber: RimWorld (pen + pen marker menahan hewan ternak; tanpa pen
mereka sesekali mencoba keluar peta) + Dwarf Fortress (padang/pasture
berpagar + dwarves mengembalikan hewan yang keluar). Masalah: hewan
jinak tetap bisa kabur jauh saat diusir atau dikejar; pemain tidak
punya cara menahan mereka di satu tempat. Cara kerja: bangunan
pagar/kandang baru — hewan jinak yang berada di dalamnya mendapat
jangkar yang lebih ketat (sabuk kecil di sekitar kandang, bukan
PUSAT). Butuh katalog bangunan + sim; bukan irisan kecil. Dampak
sedang, usaha sedang-besar. Detail di research/2026-11-06-0829.md.

## Ide 44 — Sabuk per spesies: mangsa dekat, predator jauh (dari riset 2026-11-06 08:29 WIB, sudut ekonomi/sim)
~~DIBANGUN 2026-11-06 10:29 WIB (r51)~~ — helper `sabukHewan(jenis)`
di `sim.ts` (jinak 45, buas 90, tak dikenal 45) dipakai respawn
(`lokasiRespawnHewan`, parameter jenis ke-3, default "rusa") DAN
jangkar pulang `stepHewan`; kedua call site meneruskan `sp.id`.
Tes RONDE 51 (26 asersi: pemetaan, respawn 200 titik per spesies,
jangkar deterministik, reaksi menang atas wilayah) + blok r50 (d)/(f)
diperbarui ke sabuk buas. Observasi run ini (hewan kembali dekat
kampung, predator masih tercampur) adalah prasyarat yang dipenuhi.
Detail di research/2026-11-06-0829.md.

Sumber: DayZ Deerisle (teritori mangsa 150–500m, predator 300–700m —
predator punya teritori lebih besar). Masalah: sekarang semua spesies
berbagi satu sabuk 45 — beruang dan serigala ikut berkumpul di dekat
kampung, padahal mereka seharusnya terasa liar dan jauh. Cara kerja:
sabuk jangkar + respawn berbeda per spesies — jinak (rusa/kelinci/
ayam) tetap 45, buas (babi/serigala/beruang) lebih lebar (mis. 90).
Hanya angka + satu parameter; tapi mengubah keseimbangan bahaya, jadi
butuh observasi dulu setelah Ide 1 (r50) hidup. Dampak kecil-sedang,
usaha kecil. Detail di research/2026-11-06-0829.md.

## Ide 45 — Pengelana tanpa rumah: tag di Papan Warga (dari riset 2026-11-06 10:29 WIB, sudut fitur baru)

Sumber: Pocket Isle (pendatang tanpa tempat tidur datang sebagai
pengelana — berjalan-jalan, mengintip rumah, main gitar di api unggun
pada malam hari; kehidupan ambien tanpa peran). Masalah: warga yang
belum punya rumah tidak terlihat bedanya dari warga lain — mereka
hanya "tidur" entah di mana, padahal r42 sudah menyembunyikan warga
tidur di dalam rumah saat malam. Cara kerja (display-only): bila sim
menyimpan penugasan rumah per warga secara terstruktur, baris Papan
Warga warga tanpa rumah diberi tag "🎒 pengelana" + satu baris ringkas
di kronik ("3 warga belum punya rumah"). Bila data tidak terstruktur,
irisan pertama mundur ke pengecekan struktur data dulu (seperti
catatan Ide 41). Tanpa ubah sim. Dampak kecil-sedang, usaha
kecil-sedang. Detail di research/2026-11-06-1029.md.

## Ide 46 — Lampu senja di sekitar balai/paviliun (dari riset 2026-11-06 10:29 WIB, sudut fitur baru)

Sumber: My Village Story ("Mornings turn into afternoons, dusk and
night, and the lamps come on") + Ide 2 (lampu lentera hangat
restoran). Masalah: malam di kampung gelap merata; tidak ada penanda
visual "pusat kampung masih hidup" saat senja, padahal fase malam
sudah ada di sim dan Ide 2 sudah meminta lampu hangat di restoran.
Cara kerja (visual saja): titik cahaya hangat murah (sprite/emissive,
bukan lampu dinamis per bangunan) di sekitar balai + paviliun makan
yang hanya menyala pada fase malam/senja. Mulai dari dua bangunan
itu, bukan semua bangunan. Dampak sedang, usaha sedang (butuh uji
visual malam + cek performa). Detail di research/2026-11-06-1029.md.

## Ide 47 — Sinyal "ujung rantai yang tipis" di kronik (dari riset 2026-11-06 10:29 WIB, sudut fitur baru)

Sumber: Pocket Isle ("hands go to the thin end of the chain": tangan
dialihkan ke ujung rantai yang paling tipis; urutan bangun tidak lagi
menentukan). Masalah: peran kumpul yang kosong (tidak ada penebang /
penambang / pemancing sama sekali) tidak terlihat — stok sumber itu
berhenti bertambah tanpa penjelasan, padahal pemain pengamat tidak
bisa menugaskan siapa pun; yang ia bisa hanya tahu dan menunggu
musyawarah. Cara kerja (display-only, fungsi murni di
`sumberdaya.ts`): dari data poll yang sudah ada (`map.warga` peran +
stok dunia), bila satu peran kumpul tidak punya satu pun warga
SEMENTARA stok sumbernya di bawah kapasitas, kronik menampilkan satu
baris ("Tidak ada yang mengumpulkan kayu — stok tidak bertambah")
dengan prioritas di bawah pangan habis/menipis tapi di atas stok
penuh. Tanpa ubah sim, tanpa fetch baru, tanpa janji otomasi alokasi
(pemain tetap pengamat; alokasi tetap urusan sim/musyawarah).
DICEK LIVE 2026-11-06 10:29: ke-6 sumber saat ini PUNYA pengumpulnya
(penebang Figo, penambang Miners, dst.), jadi cabang ini TIDAK akan
menyala hari ini — disimpan sebagai penjaga, bukan dibangun sekarang.
Dampak sedang, usaha kecil (satu cabang kronik + tes). Detail di
research/2026-11-06-1029.md.

## Ide-ide berikutnya

Diisi dari riset web tiap run cron (fitur baru yang fresh,
optimalisasi, dan lain-lain). Tiap ide ditulis dengan: masalah
pemain, cara kerja singkat, dan perkiraan dampak vs usaha.

## Ide 59 — Pesta yang membesar (dari riset 2026-11-07 00:29 WIB, sudut fitur baru; lanjutan Ide 10/35)

Sumber: Foundation Harvest Festival DLC ("Every celebration can
outshine the last": makin dikenal sebuah festival, makin banyak
dekorasi dan bagian festival yang terbuka, tamu makin bergengsi —
puncaknya kunjungan Raja; Aspiration baru sebagai garis tujuan).
Masalah: Pesta Panen (Ide 10) + Pasar Minggu (Ide 35) adalah acara
sekali jalan — tidak ada alasan menanti edisi berikutnya, tidak ada
yang terbuka setelah pesta pertama. Cara kerja: tiap pesta
menaikkan "pengakuan" kampung (display-only dulu: kronik + baris
Pasar menyebut "Pesta ke-N" dan apa yang baru — hiasan di sekitar
balai/paviliun, tamu kehormatan = warga bernama yang hadir);
versi sim belakangan (pengakuan membuka dekorasi). Dampak
sedang-tinggi, usaha kecil (display) / sedang (sim). Perhatian:
jangan janji hadiah ekonomi di irisan display-only. Detail di
research/2026-11-07-0029.md.

## Ide 60 — Buku Kampung / Kompendium (dari riset 2026-11-07 00:29 WIB, sudut fitur baru)

Sumber: Foundation (Compendium: ensiklopedia dalam game untuk resep
dan mekanisme, supaya pemain mudah melacak sistem yang sudah
terbuka). Masalah: aturan main (cap kumpul 15/hari, busuk pangan
50%, peran, tonggak) tersebar di kabar/menu — pemain baru tidak
punya satu tempat bertanya "ini gimana cara kerjanya?". Cara kerja:
entri "📖 Buku Kampung" di kartu menu membuka modal berisi
penjelasan singkat sistem yang sudah ada (teks statis dari
DESAIN-EKONOMI.md + angka live dari poll: cap, kapasitas,
pembusukan) — display-only, tanpa ubah sim, tanpa fetch baru.
Dampak sedang, usaha kecil-sedang. Perhatian: isi harus berasal
dari aturan yang benar-benar hidup di kode, bukan karangan. Detail
di research/2026-11-07-0029.md.

## Ide 61 — Penemuan pertama dirayakan di kronik (dari riset 2026-11-07 00:29 WIB, sudut fitur baru)

Sumber: Spiritstead (35 spirit bernama yang hanya muncul lewat
interaksi dunia tertentu; "Each discovery removes a slice of
repetitive clicking" — rasa penemuan yang diingat pemain).
Masalah: hal pertama kali (besi pertama, ikan pertama, warga
ke-10, bangunan tingkat baru) lewat tanpa jejak. Cara kerja
(display-only): kronik merayakan sekali saat suatu tonggak/data
pertama kali muncul dibanding cuplikan kunjungan terakhir
(memakai snapshot localStorage yang sudah ada untuk Ide 54/56) —
mis. "🎉 Besi pertama terkumpul!" Bukan sistem otomasi baru
(Nusantara sudah otomatis; pola spirit mentah TIDAK cocok) dan
bukan hadiah ekonomi. Dampak kecil-sedang, usaha kecil. Detail di
research/2026-11-07-0029.md.

## Ide 62 — "Duo paling kompak" dari obrolan yang sudah ada (dari riset 2026-11-07 02:29 WIB, sudut sosial/QoL; lanjutan Ide 11/41)

Sumber: Starsand Island (Game Rant, wawancara produser Golton Gao:
NPC dipengaruhi hubungan mereka SATU SAMA LAIN, bukan hanya oleh
pemain; hubungan yang dalam dirayakan seluruh kota; NPC yang dekat
membantu pekerjaan). Masalah: obrolan warga sudah ada di sim tapi
tidak meninggalkan jejak — pemain tidak tahu siapa dekat dengan
siapa. Cara kerja (display-only): SATU baris di kronik ("Duo paling
kompak: X & Y") dari pasangan ngobrol yang paling sering muncul,
BILA kabar menyimpan pasangan secara terstruktur. Bila hanya teks
bebas, irisan pertama mundur ke pengecekan struktur data dulu
(catatan yang sama seperti Ide 11/41). Dampak sedang, usaha
kecil-sedang. Detail di research/2026-11-07-0229.md.

## Ide 63 — Bakat warga terlihat di Papan Warga (dari riset 2026-11-07 02:29 WIB, sudut sosial/QoL)

Sumber: Village in the Shade (Noisy Pixel: suka/tidak suka tiap
warga TERLIHAT LANGSUNG, tanpa trial-and-error — dipuji sebagai
QoL). Masalah: untuk tahu siapa jago apa, pemain harus mengetuk
warga satu per satu; Papan Warga hanya menampilkan nama + peran.
Cara kerja (display-only): tiap baris Papan Warga menampilkan
bakat/keunggulan warga itu (mis. "berbakat menebang") dari data
poll yang sudah ada, BILA bakat ikut terkirim di /api/map. Bila
tidak, irisan pertama adalah cek struktur data dulu. Dampak sedang,
usaha kecil. Detail di research/2026-11-07-0229.md.

## Ide 64 — "Yang diminta warga" sebagai baris kronik (dari riset 2026-11-07 02:29 WIB, sudut sosial/QoL)

Sumber: Village in the Shade (tiket tugas warga SEKALIGUS membuka
blueprint/sistem baru — tugas receh punya alasan) + Ide 42 (rumor
ber-atribusi). Masalah: warga punya kebutuhan (stok penuh, peran
kosong) tapi tidak pernah "meminta" apa-apa — kampung terasa pasif.
Cara kerja (display-only): kronik sesekali menampilkan satu
permintaan warga yang berasal dari FAKTA poll (mis. "Budi: lumbung
sudah penuh…"). BUKAN tugas yang bisa diselesaikan pemain (ia
pengamat), jadi kalimatnya harus berupa kabar, bukan perintah.
Perhatian: jangan sampai terbaca sebagai janji ("lakukan X")
padahal pemain tidak bisa berbuat apa-apa — itu frustrasi, bukan
fitur. Dampak kecil-sedang, usaha kecil. Detail di
research/2026-11-07-0229.md.

## Ide 65 — Gelembung naik mengikuti tinggi label (dari riset 2026-11-07 04:29 WIB, sudut UX; lanjutan observasi r58/r02:29)
~~DIBANGUN 2026-11-07 06:29 WIB (r59)~~ — fungsi murni
`tinggiLabelWarga` + `offsetGelembungWarga` di `tampil.ts` (pil biasa
19, terpilih 39, HP 9, aksi 30, bar 7, celah 13) + `bubbleOffsetY`
di Map3D dari isi label antrean (dibaca dari inline style
actionWrap/hpWrap/bar) — pil biasa tetap offset 32 (tanpa regresi),
biasa+aksi 62, terpilih+aksi+HP 91. ADAPTASI JUJUR atas spesifikasi
awal: fungsi tidak hanya 2 parameter (adaAksi, terpilih) — HP dan
bar progres ikut dihitung, kalau tidak, warga terpilih yang sedang
kumpul + ber-aksi masih tertutup 3px; dan angka pil terpilih
dikoreksi 27 -> 39 karena baris peran ikut dihitung (spesifikasi
awal lupa baris peran). Pips pentung TIDAK dihitung (0px): pips
lepas dari DOM sejak rebuild label pertama (innerHTML="" tidak
mengembalikannya) — defect lama yang dicatat, bukan diperbaiki run
ini. +43 tes (RONDE 59; 2 asersi lama diperbarui: push hewan r48 +
versi r47). Observasi run ini mengonfirmasi ulang: bubble "Tolong!
Ada hewan buas!" memotong nama jadi "Go Youn...".

Sumber: jMonkeyEngine (offset eksplisit mengalahkan urutan gambar;
tumpang tindih transparan = soal posisi, bukan z-index) + AnchorKit
(dorong pelat yang bertumpuk supaya tetap terbaca). Masalah: gelembung
bicara menutupi label aksi warga ("🛡️ Menghalau Hewan!" + persen)
sampai nama tidak terbaca — terkonfirmasi dua run berturut-turut.
Mekanisme kode: `bubbleOffsetY` tetap 32 (54 bila terpilih) di
`Map3D.tsx:2807`, sementara label ber-aksi ~48px tingginya (pil
biasa ~19px) — dasar gelembung jatuh 16px di dalam label. Cara kerja:
fungsi murni `tinggiLabelWarga(adaAksi, terpilih)` di `tampil.ts` +
`bubbleOffsetY` dari tinggi itu + celah 13px (ber-aksi -> ~61).
Dampak sedang, usaha kecil. Detail di research/2026-11-07-0429.md.

## Ide 66 — Gelembung ikut antrean rapikan (dari riset 2026-11-07 04:29 WIB, sudut UX; lanjutan Ide 65)

Sumber: Mapbox US10460495B1 (grid index + bounding geometry untuk
deteksi tabrakan label) + AnchorKit (overlap separation). Masalah:
Ide 65 hanya menjauhkan gelembung dari labelnya SENDIRI — dua
gelembung dari dua warga berdekatan masih bisa saling menutupi.
Cara kerja: entri `labelAntre` membawa tinggi gelembungnya, dan
`rapikanLabelBertumpuk` menata gelembung seperti label. Dikerjakan
SETELAH Ide 65, bukan bersamaan, supaya efek masing-masing terukur.
Dampak sedang, usaha sedang. Detail di research/2026-11-07-0429.md.

## Ide 67 — Label + gelembung terpilih selalu paling depan (dari riset 2026-11-07 04:29 WIB, sudut UX; lanjutan Ide 39)

Sumber: AFS_UI_Labels (label tampil saat relevan/interaksi) +
jMonkeyEngine (satu node induk untuk bubble + teks). Masalah: saat
klaster ramai, label warga yang sedang dipilih bisa kalah dengan
label/gelembung tetangga. Cara kerja: `.sel` SUDAH z-index 25
(dijaga tes r52); irisan ini menambahkan aturan yang sama untuk
gelembung milik warga terpilih + memastikan rapikan tidak menggeser
entri terpilih ke bawah antrean. Display-only, tanpa ubah sim.
Dampak kecil, usaha kecil. Detail di research/2026-11-07-0429.md.

## Ide 68 — Musim visual dari hari game (dari riset 2026-11-07 06:29 WIB, sudut musim & cuaca; lanjutan Ide 19)

Sumber: Mameya Seasons (satu peta, empat musim — ganti palet, bukan
ganti peta) + Farming Season (musim murni visual tetap terasa sebagai
hadiah, tanpa keuntungan gameplay) + ValheimSeasons (transisi
bertahap, bukan saklar mendadak). Masalah: kampung terlihat sama
sepanjang tahun game; tidak ada penanda waktu berlalu selain angka
hari. Cara kerja: musim diturunkan dari hari game (mis. 30
hari/musim, fungsi murni `musimDariHari`) — murni tampilan, TANPA
efek ekonomi (aturan DESAIN-EKONOMI.md dijaga): rona tanah/daun
berubah per musim + partikel ringan khas musim (kelopak di semi,
daun gugur di gugur). Mulai dari SATU musim dulu (gugur: rona hangat
+ daun jatuh), bukan empat sekaligus. Dampak sedang, usaha sedang.
Detail di research/2026-11-07-0629.md.

## Ide 69 — Hujan terlihat di peta saat cuaca Hujan (dari riset 2026-11-07 06:29 WIB, sudut musim & cuaca)
~~DIBANGUN 2026-11-07 08:29 WIB (r60)~~ — fungsi murni
`intensitasHujan` di `tampil.ts` (petir -> "deras", hujan ->
"ringan", sisanya -> "") + overlay `.hujan-overlay` di `Map3D`
(DOM + animasi CSS, garis miring 105°, tile 120x240, keyframes
geser tepat satu tile; varian `.deras` tile 90x180 + 0,5 dtk) +
prop `efekCuaca` (default true) + toggle di Pengaturan
(`ne_efek_cuaca`, pola yang sama dengan toggle Label) + blok
reduced-motion (overlay DISEMBUNYIKAN, bukan dibekukan — garis
statis terlihat seperti goresan; sinyal cuaca tetap lewat teks
"Hujan" di menu). Aturan aksesibilitas dari riset 08:29 (XAG 117):
toggle matikan di dalam game + di bawah label (z 4 < 5) +
opasitas 0,3/0,45 + TANPA kilat/flash. Display-only, tanpa ubah
sim, tanpa draw call WebGL baru. +40 tes (RONDE 60: 31 audit versi
lama diperbarui r59 -> r60). CATATAN JUJUR: observasi pra-deploy
(H-533, Hujan) memastikan peta kering total — celah yang
diperbaiki; verifikasi VISUAL hujan benar-benar jatuh di layar
menyusul setelah deploy (tergantung cuaca hari game saat itu).
SISA: reaksi tanah (jalan lebih gelap saat hujan, ala Mameya) +
sinkron dengan ambien hujan (Ide 32) bila ambien hidup.
Sumber: RMCAD (cuaca menjelaskan keadaan game + sinkron dengan
ambien) + Mameya Seasons (overlay di lapisan atas + tanah bereaksi).
Masalah: cuaca "Hujan" hanya teks di menu — di peta tidak ada yang
berubah, padahal hujan memotong hasil kumpul (pemain tidak
"merasakan" kenapa hasil turun). Cara kerja: overlay hujan tipis di
depan kamera (garis jatuh miring, spawn rate dibatasi, patuh
reduced-motion + bisa dimatikan lewat Pengaturan) yang hanya aktif
saat data poll menyebut cuaca Hujan; tanah di jalan jadi lebih gelap
(reaksi tanah ala Mameya, versi murah: tint jalan). Display-only,
tanpa ubah sim, tanpa ubah ekonomi hujan yang sudah ada. Dampak
sedang, usaha kecil-sedang. Detail di research/2026-11-07-0629.md.

## Ide 70 — Kronik menyebut pergantian musim/cuaca (dari riset 2026-11-07 06:29 WIB, sudut musim & cuaca)

Sumber: RMCAD (peristiwa langka = momen yang diingat) + Valheim
(transisi bertahap layak dirayakan). Masalah: pergantian musim/cuaca
lewat tanpa jejak di kronik — pemain yang kembali tidak tahu musim
apa sekarang. Cara kerja (display-only): satu baris kronik saat
musim berganti dibanding cuplikan kunjungan terakhir ("Musim gugur
tiba — daun berguguran") atau saat hujan pertama hari itu. Memakai
snapshot localStorage yang sudah ada (Ide 54/56). Dampak kecil,
usaha kecil. Detail di research/2026-11-07-0629.md.

## Ide 71 — "Mode tenang": satu saklar gerakan di Pengaturan (dari riset 2026-11-07 08:29 WIB, sudut aksesibilitas)
~~DIBANGUN 2026-11-07 10:29 WIB (r61)~~ — state `kurangiGerakan`
di `page.tsx` (localStorage `ne_kurangi_gerakan`; default
mengikuti `prefers-reduced-motion` bila belum pernah disentuh) +
toggle "Kurangi gerakan (mode tenang)" di Pengaturan + kelas
`mode-tenang` di `.game-root` + CSS yang mencerminkan blok
reduced-motion (transisi panel mati, titik tonggak/populasi/stok
penuh jadi statis, badge melayang hanya memudar di tempat) +
hujan dimatikan lewat prop (`efekCuaca && !kurangiGerakan`,
tidak dirender sama sekali — bukan disembunyikan CSS). Kanvas 3D
tidak disentuh. BUILD_ID r60 -> r61 + 26 tes penjaga (RONDE 61;
asersi r60 `efekCuaca={efekCuaca}` diperbarui; 32 asersi audit
versi lama yang mengunci string "r60" ikut dinaikkan ke "r61"
sesuai pola house — daftar gagal tes tetap identik baseline,
637). Verifikasi visual (saklar di Pengaturan + titik jadi
statis saat mode nyala) menyusul — browser task run ini hanya
mengamati sebelum deploy.
Sumber: XAG 117 (mekanisme penonaktifan konten bergerak DI DALAM
game, bukan hanya setelan OS) + HyperDot ("Animate Background" off
= latar jadi statis). Masalah: `prefers-reduced-motion` hanya
membantu bila OS-nya mengaturnya; pemain yang sensitif gerak tapi
OS-nya tidak disetel tidak punya jalan mematikan gerakan dari dalam
game. Cara kerja: satu toggle "Kurangi gerakan" di Pengaturan
(localStorage, pola yang sama dengan toggle Suara/Label) yang
mematikan SEMUA gerakan non-inti sekaligus — overlay hujan (Ide
69), denyut titik (Ide 56/58), badge melayang — kanvas 3D tetap
jalan (inti permainan, seperti keputusan r31). Default mengikuti
`prefers-reduced-motion` bila toggle belum pernah disentuh.
Dampak sedang, usaha kecil-sedang. Detail di
research/2026-11-07-0829.md.

## Ide 72 — Kilat tanpa flash (dari riset 2026-11-07 08:29 WIB, sudut aksesibilitas; PENJAGA, bukan dibangun)

Sumber: XAG 118 + ISO 9241-391 (ambang fotosensitif: >3 flash/detik
di >25% layar, >5 detik) + Crimson Desert (Photosensitive Mode
meredam kilat tanpa menghapusnya) + Subnautica (toggle kilat
terpisah di Visual comfort). Masalah: suatu hari cuaca "petir"
mungkin ingin efek kilat — kilat dengan flash putih layar penuh
adalah pemicu fotosensitif klasik. Cara kerja (BUKAN dibangun
sekarang, hanya penjaga): bila kilat divisualkan, pakai
redup/terang perlahan (glow, bukan flash), frekuensi jauh di bawah
ambang, dengan toggle sendiri di Pengaturan. Sampai ada yang
membangunnya, "petir" tetap hujan deras tanpa kilat (keputusan
r60). Dampak kecil (sebagai penjaga) / —. Detail di
research/2026-11-07-0829.md.

## Ide 73 — Teks di atas efek cuaca tetap terbaca (dari riset 2026-11-07 08:29 WIB, sudut aksesibilitas; audit)

Sumber: XAG 117 (latar buram di belakang teks bila gerakan latar
tidak bisa dihindari, contoh Sea of Thieves) + RMCAD
(readability-first). Masalah: efek cuaca di atas peta bisa menutupi
label/teks bila lapisannya salah. Cara kerja: aturan tertulis —
overlay cuaca SELALU di bawah lapisan label (z < 5) dan opasitas
rendah; bila suatu hari ada overlay yang harus di atas label,
tambahkan scrim di belakang teks. Dijaga tes statis (z-index
overlay < z-index `.map3d-labels`) — sudah dijaga tes RONDE 60
untuk hujan. Dampak kecil, usaha kecil. Detail di
research/2026-11-07-0829.md.

## Ide 74 — Catat ukuran chunk tiap run sebagai angka performa (dari riset 2026-11-07 10:29 WIB, sudut performa)

Sumber: StackNotice (ukur dampak lewat bundle analyzer +
Lighthouse, bukan perasaan) + nazrulkabir (diagnosis dulu, baru
potong). Masalah: klaim "lebih ringan" selama ini tanpa angka —
"muat pertama ~30–60 detik" (r60) vs "≤20 detik" (r61) tidak bisa
dibandingkan karena cold start, koneksi, dan cache ikut bermain.
Cara kerja: tiap run yang menyentuh build, catat di CHANGELOG
ukuran 3 chunk terbesar + total `.next/static/chunks` dari build
itu. Baseline r61: total ~1,66 MB (belum gzip); chunk terbesar
740 KB (three.js, chunk Map3D yang sudah dynamic import);
berikutnya 224 KB, 161 KB. Catatan: Next.js 16 (Turbopack) TIDAK
lagi mencetak First Load JS di output build — angka chunk file
adalah penggantinya. Bila suatu hari angka naik >20% tanpa
alasan, itu sinyal untuk Ide 75. Dampak kecil (disiplin ukur) /
usaha kecil. Detail di research/2026-11-07-1029.md.

## Ide 75 — Dynamic-import modal berat yang jarang dibuka (dari riset 2026-11-07 10:29 WIB, sudut performa)

Sumber: StackNotice (uji lakmus: aksi utama bisa selesai tanpa
komponen itu dirender = kandidat lazy-load) + nazrulkabir (40%
pada kasus nyata). Masalah: bila MusyawarahModal / TambahKarakter
/ RestoranInterior3D diimpor statis di page.tsx, kodenya ikut
diunduh di muat pertama walau pemain tidak pernah membuka modal
itu. Cara kerja: cek impor di page.tsx; pindahkan SATU modal dulu
ke `next/dynamic` (fallback loading jujur, pola Map3D), ukur chunk
sebelum/sesudah (Ide 74), pastikan modal tetap terbuka normal.
Mulai dari satu modal, bukan semua sekaligus. Perhatian: jangan
dynamic-import komponen yang tampil di muat pertama. Dampak
sedang, usaha kecil-sedang. Detail di research/2026-11-07-1029.md.

## Ide 76 — Turunkan cap DPR ke 1,5 hanya bila angka live mendukung (dari riset 2026-11-07 10:29 WIB, sudut performa)

Sumber: Glitchless (cap 1,5) + Simplified (ponsel 3x = 9x piksel).
Masalah: HP menengah ngelag saat desa ramai; cap DPR 2 sudah ada
(Ide 8) tapi 1,5 disebut lebih aman untuk HP lemah. Cara kerja:
BUKAN dibangun sekarang — prasyaratnya angka baseline draw
call/segitiga live (Ide 27) terbaca dulu + observasi jank di HP
yang sama sebelum/sesudah. Bila angka live menunjukkan fill-rate
(piksel) sebagai penyebab, bukan draw call, barulah cap
diturunkan — dan label tetap dicek (teks 10px di DPR 1,5).
Dampak kecil-sedang, usaha kecil (bila prasyarat terpenuhi).
Detail di research/2026-11-07-1029.md.

## Ide 77 — Bengkel Besi + Tugu Leluhur Agung masuk katalog, terkunci tingkat 5 (dari riset 2026-11-07 12:29 WIB, sudut ekonomi/sim)
~~DIBANGUN 2026-11-07 12:29 WIB (r62)~~ — dua entri katalog
(`bengkel_besi`: 40 kayu + 30 batu + 15 besi; `tugu_leluhur_agung`:
120 kayu + 100 batu + 40 besi + 30 emas, keduanya footprint 2,
bukan hunian) + fungsi murni `tingkat5Terbuka(populasi,
jenisBerdiri, adaPenambang)` di `sumberdaya.ts` (penambang aktif +
paviliun makan BERDIRI + populasi 20) dipakai di TIGA tempat —
panel kebutuhan (target tanpa "(rencana)"), auto-queue sim
(bengkel dulu, tugu sesudah bengkel berdiri), filter kandidat
musyawarah (query `countDocuments({ peran: "penambang" })`) —
+ cabang 3D di Map3D (bengkel: dinding batu + landasan + bara
`api` + cerobong; tugu: alas + monolit + sabuk emas + puncak
emas) + sprite MEMAKAI ULANG aset yang ada (bengkel-batu.png /
totem.png, pola bangunan _luas — push_files tidak bisa mengunggah
berkas biner, jadi ikon baru tidak ikut commit ini; model 3D-nya
tetap baru dan khas) + ALASAN_BANGUNAN untuk keduanya.
Tanpa efek ekonomi baru (tugu murni monumen). +45 tes (RONDE 62)
+ 4 asersi katalog basi diperbaiki (hitungan 23 -> 28, footprint
paviliun 3 -> 8). CATATAN JUJUR: live pop 12 < 20, jadi keduanya
TIDAK akan diantrekan di Suka Maju sampai populasi 20 — itu
perilaku benar; verifikasi visual (tugu berdiri di peta) menunggu
dunia yang memenuhi syarat. SISA: tonggak ke-8 (Ide 78) +
perkakas besi (Ide 79).
Sumber: Valheim (satu gerbang -> banyak bukaan; besi tetap relevan
sampai akhir) + Forge of Empires (era baru mengubah tampilan kota;
bonus permanen Great Buildings TIDAK dicopy — DESAIN-EKONOMI
melarang hadiah ekonomi di luar cap). Detail di
research/2026-11-07-1229.md.

## Ide 78 — Tugu sebagai tonggak ke-8 "Kemenangan kampung" (dari riset 2026-11-07 12:29 WIB, sudut ekonomi/sim)

Sumber: Forge of Empires (Great Buildings sebagai investasi yang
dirayakan) + IMPERIUM (wonder = proyek akhir yang ditunggu).
Masalah: 7 tonggak berhenti di paviliun makan — tugu yang berdiri
tidak dirayakan di mana pun. Cara kerja: tonggak ke-8 di
`tonggakKampung` (tercapai bila tugu berdiri) + kilas "✨ Baru:"
+ kronik yang sudah ada (pola Ide 54/56) ikut merayakannya.
Display-only, tanpa hadiah ekonomi. Perhatian: ubah "7 dari 7"
jadi "7 dari 8" di Suka Maju adalah perubahan yang terlihat —
kerjakan dalam satu run sendiri supaya efeknya terukur. Dampak
kecil-sedang, usaha kecil. Detail di research/2026-11-07-1229.md.

## Ide 79 — Perkakas besi menggeser peluang roll (dari riset 2026-11-07 12:29 WIB, sudut ekonomi/sim)

Sumber: Valheim (besi membuka deretan perkakas baru) +
DESAIN-EKONOMI.md §2 ("bengkel besi membuka perkakas besi").
Masalah: setelah bengkel besi berdiri, besi tidak mengubah apa
pun — bengkel jadi bangunan pajangan. Cara kerja: bila bengkel
besi berdiri, perkakas besi memberi geseran peluang roll TERBESAR
yang diizinkan TETAP DI DALAM cap (pola bengkel kayu/batu yang
sudah ada). Perlu cek dulu apakah perkakas bengkel sudah
menggeser peluang lewat jalur yang sama; bila belum ada jalurnya,
irisan pertama adalah pengecekan itu. Besi/emas tetap tidak dapat
bump. Dampak sedang, usaha sedang. Detail di
research/2026-11-07-1229.md.

## Ide 80 — Label "Kronik kampung" di baris kronik (dari observasi 2026-11-07 12:29 WIB, sudut UX)

Sumber: observasi live run r62 (bukan riset web — temuan lapangan).
Masalah: baris kronik (Ide 23) tidak punya label yang terlihat —
isinya hanya "📜 {kalimat}", jadi pengamat tiga run berturut-turut
mengira baris itu tidak ada / mengiranya baris tip acak ("📜 Kayu
penuh (160/160) — …"), dan pencarian teks "Kronik" di menu tidak
menemukan apa-apa karena kata itu hanya ada di komentar kode.
Cara kerja (display-only): tambahkan label kecil "Kronik kampung"
di depan kalimat (pola label `.menu-tip-label` di baris tip Ide 14),
tanpa mengubah isi kalimat atau aturan prioritasnya. Dampak kecil,
usaha kecil. Detail di CHANGELOG r62.

## Ide r42 — Tidur di dalam + label tidak menumpuk + hewan dekat kampung (wewenang penuh user 2026-11-05, SELESAI di r42)

- Warga tidur di dalam rumah pada malam hari (sebelumnya berkerumun di luar): render menyembunyikan warga istirahat+malam (`tidurDiDalam`), sim tidak berubah.
- Label nama bertumpuk diperbaiki: `rapikanLabelBertumpuk` menggeser label yang bertabrakan ke bawah sampai terbaca; tombol menu ☰ kontras tinggi (latar kuning solid + ikon gelap).
- Hewan lebih banyak di dekat kampung: respawn/seed bias 80% ke sabuk 12–45 tile dari pusat, target populasi tetap ~25.

## Ide 32 — Ambien prosedural siang/malam/cuaca (dari riset 2026-11-05 16:29 WIB, sudut audio)

Sumber: dok desain suara 0 A.D. (lapis Environmental + Ambient:
angin, hujan, burung siang vs malam) + MDN Web Audio best
practices (AudioContext hanya resume di dalam gestur; kontrol
volume/mute wajib) + ulasan Village in the Shade (siang/malam
yang terdengar = penanda waktu) + CRYENGINE Dynamic Ambience
(lapis dasar + blend siang/malam + crossfade) + SEASON/Animal
Crossing (ambien lebih pelan dari SFX aksi, latar bukan sorotan).
Masalah: di luar SFX pendek, kampung itu bisu — malam terasa sama
dengan siang, hujan tidak terdengar, padahal fase dan cuaca sudah
ada di sim. Halangan lama ("aset loop berlisensi") hilang bila
prosedural: `audio.ts` sudah punya buffer noise 2 detik + loop api
+ loop sungai + gate gestur. Cara kerja: fungsi murni
`lapisanAmbien(fase, cuaca)` -> gain {angin, hujan, malam};
loop persisten baru dari noise yang sama (angin lowpass + LFO,
hujan bandpass, malam sangat pelan) + crossfade di
`updateAudioScene`; snapshot ditambah faseWaktu + cuaca dari data
poll yang sudah ada; ikut toggle Suara + gate gestur; tanpa aset,
tanpa fetch baru, tanpa ubah sim. Dampak sedang-tinggi, usaha
kecil-sedang. Lanjutan: bunyi acak jarang (jangkrik/burung
one-shot) + slider volume Efek/Ambien (Ide 16, setelah ambien
ada). Tidak direkomendasikan dari riset ini: ambien generate AI
on-device, autoplay saat load, loop berlisensi di paket awal,
musik latar penuh sebagai langkah pertama. Detail di
research/2026-11-05-1629.md.

## Ide 33 — Label hewan ikut antrean rapikan (dari riset 2026-11-05 18:29 WIB, sudut UX)
~~DIBANGUN 2026-11-06 00:29 WIB (r48)~~ — satu antrean gabungan
(warga + hewan) lewat `rapikanLabelBertumpuk` yang sama: loop hewan
mendorong `{ label, bubble: null, sx, sy }` ke `labelAntre`; blok
penerapan rapikan pindah ke setelah loop hewan (satu titik penerapan
transform, dijaga `if (!a.bubble) return;`); tipe antrean mengizinkan
`bubble: null`. Display-only, tanpa ubah sim; fungsi rapikannya tidak
berubah. +11 tes (kontrak antrean gabungan + audit sumber Map3D).
CATATAN KEJUJURAN: observasi live run ini tidak melihat satu pun
hewan (13 ekor di data, tidak tampak di tampilan apa pun — pengulangan
observasi r47), jadi perbaikan tumpukan label hewan vs warga BELUM
terverifikasi secara visual; yang terverifikasi adalah tes offline +
tidak ada regresi build/API. Verifikasi visual ditunda sampai hewan
terlihat lagi (kandidat run berikutnya: pan lebih luas / cek posisi
hewan dari /api/map).
Sumber: Wandr (kurangi, bukan padatkan) + audit kode Map3D.
Masalah: label hewan diposisikan langsung di loop hewan, tidak
pernah lewat `rapikanLabelBertumpuk` — hanya label warga yang
dirapikan. Di pusat kampung, tempat hewan jinak tinggal dekat
warga, label hewan bisa menumpuk di atas label warga yang sudah
dirapikan. BUKAN penyebab tumpukan yang teramati 18:29 (itu label
warga dengan jarak pil 18/20px, diperbaiki r44) — jadi backlog,
bukan dibangun sekarang. Cara kerja: satu antrean gabungan
(warga + hewan) lewat fungsi yang sama; transform label hewan
diterapkan setelah loop hewan. Display-only, tanpa ubah sim.
Dampak sedang, usaha kecil. Detail di research/2026-11-05-1829.md.

## Ide 35 — Pasar mingguan tiap 7 hari game (dari riset 2026-11-05 20:29 WIB, sudut fitur baru; spesifikasi Ide 10 festival)
~~SEBAGIAN DIBANGUN 2026-11-05 22:29 WIB~~ — irisan display-only:
fungsi murni `pasarMingguan` di `sumberdaya.ts` (hari kelipatan 7 =
hari pasar, H-1 = besok, sisanya hitung mundur; tempat mengikuti
bangunan berdiri: Balai -> Paviliun Makan -> tengah kampung) + satu
baris "🛖 Pasar Minggu …" di kartu menu di bawah Kronik + 18 tes
penjaga. Display-only, tanpa ubah sim, tanpa fetch baru, tanpa
janji ekonomi (belum ada jual-beli). SISA: pengumuman kabar H-1
(butuh sim/kabar), warga berkumpul visual di balai/paviliun di
hari H, pesanan desa berbonus versi sim.
Sumber: My Village Story (haat tiap 7 hari + pesanan desa berbonus +
telepon yang mengajukan pertanyaan yang tidak dijawab game) + Plai
(festival *hram* mingguan). Masalah: hari-hari game terasa sama; tidak
ada momen yang ditunggu bersama (sudah dicatat di Ide 10). Cara kerja
(versi display-only dulu): tiap hari game kelipatan 7, kabar mengumumkan
"Pasar minggu ini di balai" H-1, warga berkumpul di balai/paviliun di
hari H; versi sim belakangan (pesanan desa berbonus ala haat). Tidak
mengubah ekonomi di irisan pertama. Dampak sedang-tinggi, usaha sedang
(display-only: kecil). Detail di research/2026-11-05-2029.md.

## Ide 36 — Sisa busuk jadi pupuk ladang (dari riset 2026-11-05 22:29 WIB, sudut ekonomi/sim)

Sumber: Medieval Dynasty (makanan busuk -> "Rot" -> pupuk di Barn;
mengolah memulihkan kondisi 100%) + catatan Ide 31. Masalah: pangan
di atas kapasitas membusuk 50%/hari dan lenyap tanpa jejak — terasa
seperti hukuman pasif, bukan keputusan. Cara kerja (versi sim
belakangan): sebagian pangan yang busuk dicatat sebagai "pupuk" yang
mempercepat ladang/sawah satu musim; versi display-only dulu: baris
kronik saat pangan busuk hari itu besar ("Sebagian pangan membusuk —
andai saja bisa jadi pupuk…"). TIDAK mengubah ekonomi di irisan
pertama. Dampak sedang, usaha sedang (sim) / kecil (display-only).
Detail di research/2026-11-05-2229.md.

## Ide 37 — Hidangan paviliun membusuk lebih lambat dari pangan mentah (dari riset 2026-11-05 22:29 WIB, sudut ekonomi/sim)

Sumber: Vintage Story (memasak + wadah tersegel = umur simpan lebih
panjang; tapi bahan yang sudah busuk tidak bisa diselamatkan).
Masalah: pangan mentah dan hidangan paviliun membusuk dengan laju
yang sama, jadi tidak ada alasan mengolah sebelum busuk. Cara kerja:
hidangan paviliun membusuk lebih lambat dari pangan mentah (mis.
separuh laju), sehingga juru masak jadi penjaga stok, bukan sekadar
pengubah lapar. Perlu cek dulu apakah hidangan disimpan terpisah dari
stok pangan di sim — bila tidak, irisan pertama hanya display (baris
kronik saat hidangan dibuat). Aturan yang sama seperti sumbernya:
hanya pangan segar yang bisa diolah jadi hidangan awet. Dampak
sedang, usaha kecil-sedang. Detail di research/2026-11-05-2229.md.

## Ide 34 — Safe-area inset untuk klaster kontrol bawah (dari riset 2026-11-05 18:29 WIB, sudut UX)

Sumber: h-idris (safe area + sudut membulat) + Supagames
(`env(safe-area-inset-bottom)` + wrapper `pointer-events: none`).
Masalah: laporan observasi r43 — joystick analog kiri-bawah
terlihat terpotong tepi kiri viewport 1919x998, padahal CSS-nya
`left: 12px`; observasi 18:29 TIDAK mengulanginya (analog utuh
dengan margin jelas), jadi penyebabnya belum terkonfirmasi dan
TIDAK ada angka CSS yang diubah run ini. Cara kerja: klaster
bawah memakai inset safe-area + audit visual ulang sebelum
mengubah apa pun; jangan menebak penyebab dari CSS saja. Dampak
sedang, usaha kecil-sedang (butuh bukti visual dulu). Detail di
research/2026-11-05-1829.md.
