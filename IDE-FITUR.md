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
kecil-sedang.

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

## Ide-ide berikutnya

Diisi dari riset web tiap run cron (fitur baru yang fresh,
optimalisasi, dan lain-lain). Tiap ide ditulis dengan: masalah
pemain, cara kerja singkat, dan perkiraan dampak vs usaha.
