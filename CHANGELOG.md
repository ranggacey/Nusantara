## 2026-11-06 ~12:29 WIB — r52: label hewan meredup saat tidak diburu (Ide 38, riset UX)

Perubahan dalam 2 kalimat: label hewan kini meredup ke opacity 0.45 bila hewan itu tidak sedang diburu dan tidak terluka, dan kembali penuh (1) begitu diburu atau terluka — kondisi yang sama persis dengan tampilnya bar HP; label warga tidak disentuh, jadi yang relevan (warga bekerja + hewan yang sedang diburu) yang menonjol di tengah 26–28 label hewan.

- `src/lib/batu/tampil.ts`: helper murni baru `opacityLabelHewan(relevan)` + konstanta `OPACITY_LABEL_HEWAN_TENANG = 0.45`. Nilai 0.45 adalah adaptasi jujur dari 20% WoW: nameplate WoW punya bar HP besar + nama besar, label hewan Nusantara 10px di atas kanvas 3D terang — 20% akan hampir tak terbaca dan melanggar aturan keterbacaan PUNCHEV sendiri.
- `src/components/Map3D.tsx`: satu baris di loop hewan — `cur.label.style.opacity = String(opacityLabelHewan(showHp))` — tepat setelah `showHp` dihitung; kondisi bar HP (`hp < hpMax || diburu.has(id)`) tidak berubah, kelas `.map3d-label-hewan` (opacity dasar 0.9) tidak diubah, antrean rapikan (r48) tidak disentuh. Display-only, tanpa ubah sim.
- Tes: blok RONDE 52 baru, 17 asersi — helper (penuh 1, tenang 0.45, konstanta, redup di antara 20% dan penuh); call site (helper dipakai, opacity dari `showHp`, kondisi bar HP utuh, impor utuh); kelas dasar tetap ada; PENJAGA Ide 39: `.map3d-label.sel` mengandung `z-index: 25;`; audit sumber + versi. Total: 8162 lolos / 637 gagal vs baseline 8145/637 — daftar gagal IDENTIK baseline (comm kosong dua arah), +17 asersi baru hijau semua. Build Next.js hijau.
- `src/lib/version.ts`: `BUILD_ID` r51 -> r52 (23 pin versi ikut naik).
- Pembukuan backlog: Ide 38 ditandai SELESAI. Ide 39 ditandai SUDAH ADA (bukan dibangun ulang): `.map3d-label.sel` sudah punya `z-index: 25` sejak commit af5cdfa — label terpilih sudah paling depan; yang ditulis Ide 39 soal "tergeser ke bawah antrean" adalah posisi Y rapikan, bukan tertutup. Ide 48 (label hewan memudar dengan jarak kamera, pola WoW "dozens of nameplates from afar") masuk backlog — sengaja TIDAK digabung dengan Ide 38 supaya efek masing-masing terukur.
- Catatan commit: entri ini ikut membawa edit verifikasi r51 di CHANGELOG.md (bagian "Verifikasi live r51") yang ditulis run 10:29 tapi belum sempat di-commit sebelum push itu.

### Observasi live (browser, hanya melihat, 12:30–12:36 WIB)
- Muat pertama TIDAK berat: layar "Memuat peta 3D..." lalu desa tampil utuh dalam ~1 menit (batas atas, bukan pengukuran detik persis); setelah itu normal, tanpa jank yang terlihat. Tombol kamera ▲/▼ merespons dan mengubah zoom; uji drag analog TIDAK meyakinkan (tool browser timeout saat ambil frame, bukan bukti tombol rusak — analog sempat tampak tertekan dan framing bergeser).
- Warga: bergerak bertujuan, label aktivitas berubah — progres "🛡️ Menghalau Hewan!" Renata terlihat 9% -> 57% -> 0% -> 24% -> 38%; Miners, Go Younjung, Evos dyroth berpindah posisi antar tampilan. Label pusat MASIH bertumpuk (Siti, Budi, ribran gakabuming, Figo, Praboti, Ys, Renata di sekitar pusat desa) — rapikan menggeser, klaster yang padat tetap padat; bukan regresi r52 (r52 tidak menyentuh label warga).
- Hewan: TERLIHAT, 26–28 label (API: 28 ekor — rusa 7, kelinci 7, ayam 4, babi_hutan 4, beruang 4, serigala 2); 10 ekor di dekat pusat (rusa 4, kelinci 5, ayam 1) — sabuk r50/r51 bekerja ke depan. Label hewan MENUMPUK dengan label warga di pusat (Kelinci di bawah paviliun, Rusa dekat Renata) — prasyarat Ide 38 yang dibangun run ini. Beberapa hewan berbagi koordinat persis (tiga di 82,-148; dua di 82,104; dua di 109,81; dua di 100,117) — data lama, bukan ulah r52.
- Menu ☰ buka-tutup + scroll normal, semua baris terbaca. Keadaan game (H-453, Sore, Cerah, populasi 12): Kayu 160/160, Batu 130/130, Pangan 200/200, Emas 1/40, Besi 47/55, Kulit 95/95. "Selama kamu pergi" tampil (+200 Pangan, +10 Kayu, +9 Batu, +1 Emas, +2 Besi, +5 Kulit). Kronik: "📜 H-444: Perang saudara 1 — 1 jatuh." "Pasar Minggu — 3 hari lagi" + tarif tukar (Pangan 1 = Kayu 4, Batu 1 = Kayu 3, Emas 1 = Besi 4).
- CATATAN KEJUJURAN: dua baris menu seperti dilaporkan observer run ini BERBEDA dari catatan r51 — "Kampung menginginkan: Batu 4, Kayu 6, Pangan 3" (r51: "Zaman besi & monumen … masih kurang populasi 20") dan "Tonggak kampung: 25% Kemajuan Kampung, Bangun 2 Balai 0/2 • Bangun 1 Balai Besar" (r51: "7 dari 7"). Kemungkinan observer salah baca baris atau tampilan panel memang berubah; BUKAN diklaim defect dan BUKAN diklaim regresi — dicek ulang run berikutnya.
- Peran kumpul (cek /api/map run ini): penebang, penambang, pemburu, petani, pengumpul, pemanjat, penjerat ADA; pemancing (nelayan) TIDAK ADA — sama seperti snapshot r51. Ikan tetap 30/30 (penuh, regrow otomatis), jadi kondisi pemicu Ide 47 (peran kosong + stok di bawah kapasitas) TETAP tidak terpenuhi; Ide 47 tetap penjaga, bukan dibangun sekarang.
- Konsol browser TIDAK bisa diakses lewat perkakas browser run ini, jadi angka baseline draw call r49 TETAP belum terverifikasi live — bukan bukti tidak ada, hanya tidak terjangkau dari sini.

### Riset + backlog (brief research/2026-11-06-1229.md)
- Sudut: UX (rotasi dari fitur baru 10:29). Sumber dibaca penuh: PUNCHEV "6 Tips For Improving The User Interface Of Your Game" (minimize clutter: hanya yang esensial + relevan konteks; teks terbaca: kontras + ukuran, jangan perkecil teks fungsional; isyarat visual untuk interaktif; konsistensi) + forum resmi WoW "How do you manage all the floating npc names?" (pemain set nameplate non-target 20% alpha di luar combat; target aktif digeser ke depan; sembunyi total menyusahkan identifikasi — "I wish there's a way that can activate friendly nameplates only when they are in close proximity").
- Yang DIBANGUN run ini adalah Ide 38 dari riset 00:29 (prioritas backlog di atas ide riset terbaru; prasyarat observasinya — label hewan menumpuk dengan label warga — terpenuhi di observasi run ini). Ide riset run ini yang masuk backlog: Ide 48 (label hewan memudar dengan jarak kamera). Ide 39 dicatat SUDAH ADA (z-index 25 di `.sel`), bukan dibangun ulang. Tidak direkomendasikan: sembunyikan semua label hewan (kehilangan satu-satunya cara mengenali hewan buruan), nameplate motion stacking ala ElvUI (rapikan sudah ada), perkecil font label hewan di bawah 10px (melawan keterbacaan), toggle sembunyikan label di Pengaturan (menambah kontrol tanpa bukti pemain meminta).

### Verifikasi live r52 (browser + API, PENDING — diisi setelah deploy)

## 2026-11-06 ~10:29 WIB — r51: sabuk per spesies — mangsa dekat, predator jauh (Ide 44, riset ekonomi/sim)

Perubahan dalam 2 kalimat: wilayah jelajah hewan kini per spesies — hewan jinak (rusa/kelinci/ayam) tetap di sabuk 45 tile dari pusat kampung, hewan buas (babi hutan/serigala/beruang) punya sabuk 90 tile, dipakai respawn DAN jangkar pulang lewat satu helper `sabukHewan`; predator terasa liar dan jauh, mangsa tetap berkumpul dekat kampung untuk diburu, dan reaksi kabur/mendekat tetap menang atas wilayah.

- `src/lib/batu/sim.ts`: konstanta baru `SABUK_HEWAN_BUAS = 90` + `sabukHewan(jenis)` (buas -> 90, jinak/tak dikenal -> 45); `lokasiRespawnHewan` menerima parameter jenis ke-3 (default "rusa", jadi pemanggil lama tidak berubah) dan memakai sabuk itu di cabang bias 80%; kedua call site (seed awal + respawn berkala) meneruskan `sp.id`; cabang pulang `stepHewan` memakai `sabukHewan(h.jenis)` sebagai ambang, bukan lagi konstanta tunggal. Satu-satunya yang berubah adalah ANGKA wilayah per spesies — kecepatan langkah, kabur, dan perburuan tidak disentuh.
- Tes: blok RONDE 51 baru, 26 asersi — pemetaan sabuk (3 jinak 45, 3 buas 90, tak dikenal 45); respawn 200 titik beruang (mayoritas dalam 90, sebagian besar di luar 45) vs 200 titik rusa (mayoritas tetap dalam 45); jangkar deterministik (rusa d=60 pulang ke 30 dalam 1 jam, beruang d=60 TIDAK pulang — mengembara ke 90 dengan arah acak dipatok, beruang jauh pulang 30/jam sampai 80); beruang yang didekati warga tetap mendekat (reaksi menang atas wilayah); audit sumber + versi. Blok r50 (d)+(f) diperbarui ke sabuk buas (beruang masuk 90 dalam 11 jam, maks 120 dalam 24 jam berikutnya; audit respawn/pulang kini memeriksa `sabuk`, bukan konstanta tunggal) — perilaku r50 untuk rusa TIDAK berubah. Total: 8145 lolos / 637 gagal vs baseline 8119/637 — daftar gagal IDENTIK baseline (comm kosong dua arah), +26 asersi baru hijau semua. Build Next.js hijau.
- `src/lib/version.ts`: `BUILD_ID` r50 -> r51 (21 pin versi + 1 pola `"r50"` ikut naik).
- Pembukuan backlog: Ide 44 ditandai SELESAI. Ide 45 (pengelana tanpa rumah: tag 🎒 di Papan Warga, pola Wanderers Pocket Isle — WAJIB cek struktur data rumah per warga dulu) + Ide 46 (lampu senja di sekitar balai/paviliun, pola My Village Story + Ide 2) + Ide 47 (sinyal "ujung rantai yang tipis" di kronik bila satu peran kumpul kosong — dicek live run ini: ke-6 sumber saat ini PUNYA pengumpulnya, jadi cabang itu tidak akan menyala hari ini; disimpan sebagai penjaga, bukan dibangun sekarang) masuk IDE-FITUR.md dari riset run ini.
- Catatan commit: entri ini ikut membawa edit verifikasi r50 di CHANGELOG.md (bagian "Verifikasi live r49 + r50") yang ditulis run 08:29 tapi belum sempat di-commit sebelum push itu.

### Observasi live (browser, hanya melihat, 10:31–10:38 WIB)
- Muat pertama TIDAK berat: desa 3D tampil utuh dalam 20 detik (batas atas, bukan pengukuran detik persis); geser joystick + zoom ▲ mulus tanpa jank; menu ☰ buka-tutup + scroll normal. Tidak ada area blank/error.
- Warga: 12 warga bergerak bertujuan, bukan diam — mayoritas mengerjakan "🛡️ Menghalau Hewan!" yang progresnya naik 15% -> 30% -> 44% -> ~78–98% lalu reset dan naik lagi (tugas pertahanan berulang); bubble "Tolong! Ada hewan buas!" sempat muncul di tengah. Beberapa warga di luar klaster (Evos dyroth tenggara, Budi selatan, Renata barat) masih bagian tugas yang sama.
- Hewan: TERLIHAT dan sebagian DEKAT kampung — 23 ekor (Rusa 5, Babi Hutan 5, Beruang 5, Kelinci 4, Ayam Hutan 3, Serigala 1): Ayam Hutan + Kelinci di utara gubuk, Babi + Rusa di selatan/barat gubuk, Beruang di timur; sebagian lain jauh (Beruang di tepi utara). Ini verifikasi visual pertama bahwa jangkar r50 BEKERJA: hewan tidak lagi semuanya tersebar 60–300+ unit (r49), sebagian sudah pulang ke dekat kampung — tapi predator masih tercampur dekat/jauh, persis alasan Ide 44 (r51) dibangun run ini.
- Keadaan game (dari menu, hanya dilihat): Suka Maju, populasi 12, H-445, 08.40 Pagi -> 10.34 Siang, Berawan. Stok: Kayu 160/160 (PENUH), Batu 130/130 (PENUH), Emas 1/40, Besi 47/55, Pangan 184/200 -> 200/200, Kulit 95/95 (PENUH). "Selama kamu pergi: Hari 442 → 445", "Kampung menginginkan: Zaman besi & monumen (Bengkel Besi, Tugu Leluhur Agung) — masih kurang populasi 20 (sekarang 12)", "Pasar Minggu: 3 hari lagi di Balai" (Rabu, 26 Nov 2026, H-448), "Tonggak kampung: 7 dari 7", kronik tampil sebagai baris "📜 Kayu penuh (160/160) — lumbung tidak muat lagi, waktunya membangun." (tetap tanpa label "Kronik kampung" di UI, sama seperti r46/r47 — bukan hilang).
- Catatan desain (bukan defect): di peta utama TIDAK ada HUD atas — strip sumber + jam hanya ada di dalam menu ☰. Peran warga live dicek lewat /api/map: penebang Figo, penjelajah Nera, petani Praboti, pengumpul Evos dyroth, pemanjat Siti, penjerat Budi, kepala suku ribran gakabuming, penambang Miners, juru masak Renata, pemburu Ys, penjaga api reja auditore, pengukir Go Younjung — ke-6 sumber punya pengumpulnya (alasan Ide 47 tidak dibangun run ini).
- Konsol browser TIDAK bisa diakses lewat perkakas browser run ini, jadi angka baseline draw call r49 TETAP belum terverifikasi live — bukan bukti tidak ada, hanya tidak terjangkau dari sini.

### Riset + backlog (brief research/2026-11-06-1029.md)
- Sudut: FITUR BARU (rotasi dari ekonomi/sim 08:29). Sumber dibaca penuh: devlog Pocket Isle "Your bakeries now keep working while you're away" (31 Okt 2026: tangan dialihkan ke ujung rantai yang paling tipis — alokasi mengikuti bottleneck, bukan urutan bangun; pulau bekerja saat pergi max 2 jam dengan aturan biasa; warga tanpa kerja + dompet kosong duduk dengan topi, koin pemain kembali terlihat sebagai barang yang dibeli; pendatang tanpa tempat tidur jadi pengelana yang main gitar di api unggun) + devlog My Village Story v0.9.5 -> v1.1.5 (4 Nov 2026: haat tiap hari ke-7 + pesanan desa berbonus; inkubator 3 malam; toko membuat benih tidak tak terbatas; kolam berumpan harian; lampu menyala saat senja; Save Code antar perangkat).
- Yang DIBANGUN run ini adalah Ide 44 dari riset run SEBELUMNYA (prioritas backlog IDE-FITUR di atas ide riset terbaru; prasyarat observasinya — jangkar r50 hidup — terpenuhi di observasi run ini). Ide riset run ini yang masuk backlog: Ide 45 (pengelana tanpa rumah), Ide 46 (lampu senja), Ide 47 (sinyal ujung rantai tipis di kronik). Tidak direkomendasikan: tawar-menawar/trading pedagang keliling, inkubator/rantai telur, Save Code (dunia bersama, tidak ada save per pemain), topi pengemis/koin pemain, water pistol (semua butuh interaksi langsung pemain-warga atau ekonomi baru — melawan peran pengamat), kerja offline ber-cap 2 jam (dunia bersama sudah jalan terus; "Selama kamu pergi" sudah merangkumnya).

### Verifikasi live r51 (browser + API, 10:56–10:58 WIB)
- Deployment Vercel dpl_3D8CzLBuYWD9mkoz3vWGPYKGNFWk READY (commit f0d54c45, production, alias nusantara.ranggafigo.com); `/api/version` = `{"ok":true,"build":"r51"}` — r51 benar-benar live.
- `/api/world` ok: Suka Maju, populasi 12, hari_total 446, 15.22 Sore, Cerah; kayu 160/160, batu 130/130, emas 1/40, besi 47/55, pangan 200/200, kulit 95/95; 20 bangunan semua "selesai" 100%. Koreksi catatan: `/api/world` TIDAK punya field hewan_liar/ikan/kesehatan/kebahagiaan — angka hewan selalu dari `/api/map`, bukan dari route ini.
- `/api/map` ok: grid 600, ikan 30, konstruksi [], daging [], 12 warga, 37 placements; 26 hewan (rusa 7, kelinci 3, ayam 4, babi 5, serigala 2, beruang 5) — dalam sabuk ≤ 45 dari pusat: 10 ekor; dalam ≤ 90: 17 ekor; 9 ekor masih > 90 (terjauh kelinci d304, rusa d266 — data lama yang masih dalam perjalanan pulang, bukan teleport instan). Artinya: r51 bekerja ke depan seperti r50; sebaran penuh per spesies butuh observasi ulang 1–2 hari game lagi, dicatat untuk run berikutnya.
- `/api/bangunan` ok: katalog 26, antrean semua "selesai" 100%. Homepage render (~15 detik, "Memuat peta 3D…" lalu desa tampil, tanpa error/blank); favicon 48x48 "N" (kotak hitam, huruf N putih) termuat. Tidak ada regresi API: semua route yang ok tetap ok.
- Angka baseline draw call r49 TETAP belum terverifikasi live (konsol browser tidak bisa diakses lewat perkakas browser — bukan bukti tidak ada, hanya tidak terjangkau dari sini).

## 2026-11-06 ~06:29 WIB — r49: baseline draw call sekali saat scene mapan (Ide 27, riset performa)

Perubahan dalam 2 kalimat: peta 3D kini mencatat sekali (setelah frame ke-120, saat scene mapan) angka `renderer.info` — draw call, segitiga, geometri, tekstur, program, pixel ratio — lewat `console.info` tepat setelah `renderer.render()`, supaya optimasi berikutnya (instancing Ide 28) punya angka awal yang terukur, bukan tebakan; murni display-only, tanpa ubah render atau sim.

- `src/components/Map3D.tsx`: penghitung `frameBaseline` + flag `baselineTercatat` di closure effect (tidak di-log ulang saat tab kembali dari hidden, karena loop yang sama dimulai ulang — Ide 9); log dibaca tepat setelah render (info direset tiap render call, three 0.187) dan hanya sekali.
- Tes: blok RONDE 49 baru, 16 asersi (baca setelah render + enam angka lengkap + ambang 120 frame + flag sekali + tepat satu console.info + bukan frameloop demand + audit versi). Total: 8087 lolos / 637 gagal vs baseline r48 8071/637 — daftar gagal IDENTIK baseline (md5 sama), +16 asersi baru hijau semua. Build Next.js hijau.
- `src/lib/version.ts`: `BUILD_ID` r48 -> r49 (20 pin versi ikut naik).
- Pembukuan backlog: Ide 27 ditandai SELESAI. KOREKSI CATATAN: brief research/2026-11-06-0429.md mengklaim Ide 27 "DIBANGUN run ini", tapi saat run ini mulai tree TIDAK berisi `renderer.info` sama sekali (grep kosong) — klaim itu tidak tercermin di kode; yang benar dibangun di r49 ini. Ide 41 (baris "Sering bersama" di Papan Warga) + Ide 42 (rumor berguna ber-atribusi di kabar) masuk backlog dari riset run ini.
- r48 ikut ter-deploy lewat push ini: commit 97bf1df (label hewan ikut antrean rapikan, Ide 33) sudah dibuat run 00:29 tapi tertunda karena tabrakan dengan perubahan sesi lain yang belum commit; perubahan sesi lain itu sudah tidak ada lagi di tree (page.tsx/globals.css bersih), dan tes r48 di tree ini terverifikasi ulang hijau (8071/637, daftar gagal identik) sebelum commit — jadi r48 + r49 berangkat bersama dalam satu push, dua commit terpisah.

### Observasi live (browser, hanya melihat, 07:11–07:19 WIB)
- Muat pertama TIDAK berat: layar "Memuat peta 3D…" lalu desa tampil utuh <15 detik (batas atas, bukan pengukuran detik persis); setelah itu normal. Geser/zoom mulus tanpa jank; analog merespons; menu ☰ buka-tutup, scroll menu bekerja. Tidak ada area blank/error.
- Hewan: TERLIHAT lagi — Kelinci, Rusa, Beruang di tepi peta + Ayam Hutan dan Beruang di utara desa setelah pan. Ini menjawab misteri r47/r48 (dua run hewan tidak tampak): /api/map mencatat 26 ekor, tapi hanya 3 yang dalam ~30 unit dari pusat desa (kelinci 85,117; beruang 84,122; rusa 106,74) — sisanya tersebar 60–300+ unit di grid 600x600, di luar viewport tengah, bukan hilang. Catatan jujur: sebaran ini lebar untuk bias respawn r42 (80% ke sabuk 12–45 tile dari pusat) — kemungkinan hewan mengembara menjauh setelah spawn; bukan regresi dan r49 tidak menyentuh hewan, tapi layak dicek run berikutnya apakah bias respawn masih bekerja atau hewan sekadar mengembara terlalu jauh.
- Warga: klaster tengah (Budi, Figo, Nera, Evos dyroth, Praboti, Siti, Go Younjung, ribran gakabuming) tampak diam di tempat dalam jendela menit, tapi progres kerja maju: reja auditore + Ys "🛡️ Menghalau Hewan!" naik 6% -> 30% -> 66% -> 80% -> 93% lalu reset ke ~1% dan naik lagi; Miners bergerak terlihat dari tengah desa ke tenggara jauh. Catatan: label layar reja/Ys ("Menghalau Hewan!") tidak cocok dengan aksi di /api/map saat itu (reja "Jalan-jalan…", Ys "Pulang, kelelahan…") — label progres jadi satu-satunya bukti aktivitas mereka; dicatat, bukan regresi r49 (r49 tidak menyentuh label warga).
- Label warga di klaster tengah masih bertumpuk di zoom default (Budi/Figo/Nera/Evos/Praboti/Siti), dan label Siti sebagian menutupi bangunan/pohon — tapi semua tetap terbaca. Rapikan r22/r44 bekerja (ada celah antar pil), hanya klaster yang padat; bukan regresi.
- Kronik: observer TIDAK menemukan baris berlabel "Kronik kampung" setelah scroll seluruh menu — tapi sesuai verifikasi r47, kronik memang tidak berlabel itu di UI, hanya "📜 " + kalimatnya; bagian "Kayu penuh" yang terlihat di menu kemungkinan adalah baris kronik (cabang stok penuh). Bukan bukti hilang; verifikasi ulang dilakukan di langkah verifikasi r49 ini.
- Keadaan game (dari menu, hanya dilihat): Suka Maju, populasi 12 (target 20), Hari 431 -> 432, Sore Berawan -> Malam Cerah. Stok: Kayu 160/160 (PENUH), Batu 130/130 (PENUH), Emas 1/40, Besi 47/55, Pangan 200/200 -> 187/200 -> 190 (bergerak wajar). "Selama kamu pergi: Hari 390 → 431" (Ide 22 bekerja). "Pasar Minggu: 3 hari lagi di Balai" lalu "2 hari lagi" setelah hari maju (Ide 35 bekerja, hitung mundur hidup). "Tonggak kampung: 7 dari 7". "Kampung menginginkan: Zaman besi & monumen (Bengkel Besi, Tugu Leluhur Agung)" — tingkat 5 DESAIN-EKONOMI.md masih terkunci, menunggu populasi 20.

### Riset + backlog (brief research/2026-11-06-0629.md)
- Sudut: SOSIAL/QoL (rotasi dari performa 04:29). Sumber dibaca penuh: wiki Minecraft Comes Alive Reborn "Villager" (hubungan lewat Talk: ngobrol +5/-2 hati, lelucon, cerita bertingkat + penalti memori, peluk/cium/flirt ikut jumlah hati; hadiah sama 3x = bosan; "Rumors": warga memberi info struktur + koordinat atau mengaku belum dengar apa-apa; panel warga satu layar) + ulasan GamesRadar Lakeburg Legacies (social city builder: matchmaking 3 lapis pertanyaan, jurnal mencatat pertemuan sampai perselingkuhan, retak hubungan = lingkungan kerja buruk; kritik: bangunan dangkal + rumah warga di layar terpisah).
- Ide 41 (baris "Sering bersama" di Papan Warga, pola jurnal Lakeburg + panel MCA — WAJIB cek struktur data pasangan ngobrol dulu, lihat catatan Ide 11) + Ide 42 (rumor berguna ber-atribusi di kabar, pola Rumors MCA, isi hanya fakta dari data poll) masuk IDE-FITUR.md sebagai backlog. Tidak direkomendasikan: matchmaking/pernikahan ala Lakeburg (melawan peran pengamat), interaksi pemain-warga ala MCA (butuh avatar pemain), gosip karangan LLM (melanggar aturan kronik Ide 23), hadiah antar warga sebagai sistem ekonomi baru.

### Verifikasi live r48 + r49 (browser + API, PENDING — diisi setelah deploy)

## 2026-11-06 ~08:29 WIB — r50: hewan punya kampung halaman — wilayah jelajah pulang ke sabuk (riset ekonomi/sim)

Perubahan dalam 2 kalimat: hewan yang mengembara kini punya jangkar wilayah jelajah — bila jaraknya dari pusat kampung melewati sabuk 45 tile (sabuk yang sama dengan respawn r42), langkah mengembaranya mengarah pulang ke pusat, bukan acak; di dalam sabuk tetap mengembara bebas, dan reaksi kabur/mendekat tidak disentuh (reaksi menang atas wilayah, pola RimWorld).

- Akar masalah (terbukti tes + observasi, bukan dugaan): `stepHewan` mengembara 1 arah acak x sampai 30 tile/jam tanpa jangkar — difusi ~147 tile/hari. Bias respawn r42 hanya mengatur hewan BARU; hewan yang hidup terus menjauh. Observasi r49: dari 26 ekor hanya 3 dalam ~30 unit dari pusat, sisanya 60–300+ unit; pemburu mencari dalam radius 40 sehingga mangsa praktis tak pernah ketemu. Observasi run ini mengulang polanya: hanya Ayam Hutan + Kelinci terlihat di tepi utara, Rusa/Babi/Beruang tidak tampak di viewport mana pun.
- `src/lib/batu/sim.ts`: konstanta baru `SABUK_HEWAN_MAKS = 45` dipakai respawn (`lokasiRespawnHewan`, dulu hardcode 45) dan jangkar mengembara; cabang mengembara `stepHewan`: di luar sabuk, arah = menuju PUSAT (bukan acak), dengan langkah dibatasi sisa jarak sumbu utama supaya berhenti TEPAT di garis pusat. Batasan itu penting: tanpa batas, langkah 30 tile mengayun melewati pusat tiap jam — beruang tes sempat osilasi (120,300) <-> (90,300) selamanya, sumbu lain tak pernah disentuh; tes r50 menemukan dan menjepit ini sebelum deploy. Cabang kabur (jinak) / mendekat (buas) TIDAK disentuh. Hewan di barat sungai tetap bisa masuk sabuk tanpa menyeberang (sungai x≈73–85 masih di dalam sabuk 45 dari pusat).
- Tes: blok RONDE 50 baru, 32 asersi — rusa jauh (300,100) pulang 30/jam sampai masuk sabuk dalam 6 jam + deterministik; rusa dalam sabuk tidak pernah > 75 dalam 48 jam; beruang (300,300) pulang TANPA osilasi (jarak turun tiap jam) dan masuk sabuk dalam 13 jam; rusa yang didekati warga tetap kabur menjauh (reaksi menang atas wilayah); audit sumber + versi. Total: 8119 lolos / 637 gagal vs baseline r49 8087/637 — daftar gagal IDENTIK baseline, +32 asersi baru hijau semua. Build Next.js hijau.
- `src/lib/version.ts`: `BUILD_ID` r49 -> r50 (21 pin versi ikut naik).
- KOREKSI ATAS KLAIM r49: entri r49 menulis "r48 + r49 berangkat bersama dalam satu push", tapi kenyataannya TIDAK: saat run ini mulai, `origin/main` masih di `7a05125` dan tree lokal `ahead 2` (r48 lokal `97bf1df` + r49 `07f2031` belum pernah sampai remote); live `/api/version` masih `r48`. Remote r48 (`992965d`, di-push sesi lain 07:30, tree IDENTIK dengan r48 lokal) adalah yang live. Run ini merekonsiliasi: `reset --hard origin/main` + cherry-pick r49 menjadi `93907bc` (diff bersih, tes baseline di tree rekonsiliasi 8087/637 identik), lalu r50 dibangun di atasnya; push run ini membawa r49 + r50 bersama.
- Pembukuan backlog: Ide 43 (kandang/pagar sebagai zona hewan, pola pen RimWorld + padang DF) + Ide 44 (sabuk per spesies: mangsa dekat, predator jauh, pola DayZ) masuk IDE-FITUR.md dari riset run ini.

### Observasi live (browser, hanya melihat, 09:22–09:29 WIB)
- Muat pertama 15–30 detik ("⏳ Memuat peta 3D…" sempat tampil, hilang jauh sebelum cek 30 detik); setelah itu normal, tanpa jank yang terlihat. Warga jelas bergerak/bekerja: Nera berjalan dari tengah ke tepi selatan, reja auditore + Go Younjung di ladang utara, Ys "🛡️ Menghalau Hewan!" dengan % yang berubah-ubah (53% -> 66% -> 58% -> 35% -> 27% -> 94% -> 41% -> 55% — naik-turun + reset, pola yang sama dicatat r49; bukan regresi r50 karena r50 tidak menyentuh label warga). Bubble Figo: "Evos dyroth: Kita butuh lebih banyak kayu!". Jam game maju cepat (16.27 -> 17.09, Sore).
- Hewan: TERLIHAT — Ayam Hutan di tepi utara dekat pepohonan + Kelinci di timur-laut, di setiap frame. Rusa, Babi Hutan, Beruang TIDAK terlihat di viewport mana pun (diduga di tepi peta) — persis gejala yang diperbaiki r50; verifikasi visual perbaikan ini butuh 1–2 hari game setelah deploy (hewan jauh pulang ~1 hari game), bukan menit.
- Menu ☰ buka-tutup normal, semua baris terbaca, tanpa blank/error. Stok: Kayu 160/160 (Penuh), Batu 130/130 (Penuh), Emas 1/40, Besi 47/55, Pangan 200/200 (Penuh), Kulit 95/95 (Penuh). H-440, populasi 12, "Selama kamu pergi: Hari 432 → 440", "Pasar Minggu: Besok Pasar Minggu di Balai" (benar: 440 % 7 = 6), Tonggak 7 dari 7, "Kampung menginginkan: Zaman besi & monumen (Bengkel Besi, Tugu Leluhur Agung)", kronik tampil sebagai baris "📜 Kayu penuh (160/160) — lumbung tidak muat lagi, waktunya membangun." (tetap tanpa label "Kronik kampung" di UI, sama seperti r46/r47 — bukan hilang).
- FLAG BELUM TERKONFIRMASI (bukan defect): satu drag analog (~2,7 detik, ke atas) tidak menggeser peta sama sekali; tombol zoom ▲/▼ berubah sangat halus per ketuk. Keduanya satu kali uji lewat pointer mouse di browser desktop — analog kemungkinan memakai sentuhan, jadi tidak disimpulkan rusak; kandidat cek ulang di HP / run berikutnya, bukan alasan menunda r50.
- Konsol browser TIDAK bisa diakses lewat perkakas browser run ini, jadi angka baseline draw call r49 ("[Nusantara baseline render]") TETAP belum terverifikasi live — tidak ada angka yang dikarang; baseline Ide 27 masih menunggu pembacaan konsol yang berhasil.

### Riset + backlog (brief research/2026-11-06-0829.md)
- Sudut: EKONOMI/SIM (rotasi dari sosial/QoL 06:29). Sumber dibaca penuh: RimWorld Wiki "Animal husbandry" (hewan jinak tanpa pen/zona "will wander around the map until they are lead to a pen" dan bisa keluar peta; kabur/draft mengabaikan zona — reaksi menang atas zona) + DayZ Deerisle "Domestic Animal Territories" (teritori = pusat + radius per spesies; mangsa 150–500m, predator 300–700m; spawn DAN jelajah di dalam teritori) + cuplikan forum Dwarf Fortress (milling 2–3 tile membuat hewan keluar padang walau berpagar — jalan acak murni itu difusi).
- Ide 1 (jangkar wilayah jelajah) DIBANGUN run ini. Ide 43 (kandang/pagar sebagai zona hewan) + Ide 44 (sabuk per spesies) masuk IDE-FITUR.md sebagai backlog. Tidak direkomendasikan: teleport hewan kembali ke kampung (menyembunyikan gejala), sistem penjinakan ala RimWorld (butuh pawang + avatar pemain), menghapus mengembara (desa terasa mati), kandang keras yang menahan kabur (melawan aturan reaksi-menang).

### Verifikasi live r49 + r50 (browser + API, 09:41–09:50 WIB)
- Deployment Vercel dpl_FqwipVm7t2RCafX2qFNv7ZRjxtAH READY (commit 00223d37, production, alias nusantara.ranggafigo.com); `/api/version` = `{"ok":true,"build":"r50"}` — r50 benar-benar live, bukan cache r48 (text-fetch sebelumnya sempat mengembalikan cache r48).
- `/api/world` ok: Suka Maju, populasi 12, hari_total 441, 16.09 Sore, Cerah; kayu 160/160, batu 130/130, emas 1/40, besi 47/55, pangan 200/200, kulit 95/95; hewan_liar 26, ikan 30, kesehatan 83, kebahagiaan 65. `/api/map` ok: grid 600, 12 warga, konstruksi [], daging []; 26 hewan (rusa 6, babi 6, ayam 5, beruang 4, kelinci 4, serigala 1) — 13 ekor dalam sabuk ≤ 45 dari pusat, 13 ekor masih di luar (terjauh rusa 77,351; tiga ekor menumpuk di koordinat sama 82,-148 — data lama, bukan ulah r50). Artinya: perbaikan r50 bekerja ke depan (hewan jauh pulang ~1–2 hari game), BUKAN teleport instan — verifikasi penuh butuh observasi ulang 1–2 hari game lagi, dicatat untuk run berikutnya. Jumlah placement tidak dihitung (JSON ribuan baris, tidak dikarang).
- `/api/bangunan` ok: katalog 26, antrean 14 semua "selesai" 100%. Homepage render (judul "Negara Emas — Zaman Batu", desa 3D + warga berlabel + hewan), favicon 48x48 "N" termuat; "🛡️ Menghalau Hewan!" bergerak live (42% -> 55% -> 25% -> 39%). Menu: "🛖 Pasar Minggu 6 hari lagi di Balai." (benar: H-442, 442 % 7 = 1), kronik "📜 Kayu penuh (160/160) — lumbung tidak muat lagi, waktunya membangun.", "Selama kamu pergi: Hari 432 → 442", pangan 194/200 saat menu dibaca (bergerak wajar).
- Tidak ada regresi API: semua route yang ok tetap ok, tidak ada blank/error. Angka baseline draw call r49 TETAP belum terverifikasi live (konsol browser tidak bisa diakses lewat perkakas browser di dua observasi run ini — bukan bukti tidak ada, hanya tidak terjangkau dari sini).

# CHANGELOG Nusantara

## 2026-11-06 ~00:29 WIB — r48: label hewan ikut antrean rapikan (Ide 33, riset UX)

Perubahan dalam 2 kalimat: label hewan kini masuk antrean yang sama dengan label warga sebelum dirapikan, jadi satu panggilan `rapikanLabelBertumpuk` menata warga + hewan sekaligus dan label hewan tidak lagi bisa menumpuk di atas label warga yang sudah dirapikan di pusat kampung; murni display-only, tanpa ubah sim, fungsi rapikannya sendiri tidak berubah.

- `src/components/Map3D.tsx`: tipe `labelAntre` mengizinkan `bubble: null` (entri hewan); loop hewan tidak lagi memosisi label langsung — ia mendorong `{ label, bubble: null, sx, sy }` ke antrean; blok penerapan rapikan pindah ke setelah loop hewan (satu titik penerapan transform, dijaga `if (!a.bubble) return;` untuk entri hewan).
- Tes: blok RONDE 48 baru, 11 asersi (kontrak antrean gabungan warga+hewan 0/28/56, hewan jauh tidak digeser, audit sumber: hewan masuk antrean + tidak ada posisi langsung + satu panggilan rapikan + satu titik transform + jaga bubble null + tipe null + blok rapikan setelah loop hewan, audit versi). Total: 8071 lolos / 637 gagal vs baseline 8060/637 — daftar gagal IDENTIK baseline (dibuktikan banding stash), +11 asersi baru hijau semua. Build Next.js hijau.
- `src/lib/version.ts`: `BUILD_ID` r47 -> r48 (20 pin versi ikut naik).
- Pembukuan backlog (bukan kode): Ide 17 (jeda poll saat tab hidden) ternyata SUDAH dibangun di r21 (commit ed82341) tapi belum pernah ditandai di IDE-FITUR.md — ditandai sekarang. Ide 33 ditandai SELESAI; dua ide turunan dari riset run ini masuk backlog sebagai Ide 38 (label hewan meredup saat tidak diburu) dan Ide 39 (label warga terpilih selalu paling depan).

### Observasi live (browser, hanya melihat, 00:31-00:38 WIB)
- Muat pertama TIDAK berat: layar "Memuat peta 3D…" + tips, desa tampil utuh <15 detik (lebih cepat dari 60-70 detik di observasi 20:30 dan <30 detik di 22:31 — variansi chunk/jaringan, bukan klaim perbaikan; r48 tidak menyentuh muat).
- Geser/zoom mulus tanpa jank; analog merespons; tombol ☰ membuka/menutup menu, ▲/▼ zoom bekerja. Menu muat di layar, bisa scroll, tidak ada tombol/panel tertutup. Tidak ada area blank/error.
- Warga: tidak beku, tapi mengembara pelan tanpa animasi kerja yang jelas — Figo, Nera, Go Younjung melayang jauh ke barat di luar desa, Ys jauh ke selatan, Evos ke timur; sebagian di tengah. Satu bubble muncul ("Ayo duduk sebentar, Praboti. Kakiku pegal."). Pola "warga melayang jauh dari desa" ini berulang di observasi r47 — dicatat, bukan regresi r48 (r48 tidak menyentuh gerak warga).
- Hewan: TIDAK SATU PUN terlihat di tampilan apa pun (dekat/sedang/zoom-jauh), padahal data halaman mencatat 13 ekor (4 Rusa, 2 Ayam Hutan, 1 Serigala, 3 Beruang, 1 Kelinci, 2 Babi Hutan). Ini pengulangan observasi r47 (17 ekor, tidak terlihat) — dua run berturut-turut hewan tidak tampak, padahal r42 sudah membias respawn 80% ke sabuk 12–45 tile dari pusat. Kemungkinan hewan hidup di tepi peta di luar viewport yang dipan observer, atau memang tidak ter-render; BELUM terbukti regresi dan r48 tidak menyentuh hewan — tapi karena perbaikan label hewan run ini justru tidak bisa diverifikasi secara visual live (tidak ada label hewan yang tampil untuk dibandingkan), dicatat jujur di sini: verifikasi visual Ide 33 ditunda sampai hewan terlihat lagi; yang terverifikasi run ini adalah tes offline + tidak ada regresi build/API. Kandidat run berikutnya: observasi hewan dengan pan yang lebih luas / cek posisi hewan dari /api/map.
- Label warga di pusat kampung (Budi, Siti, Evos dyroth, Praboti, Renata, reja auditore) berdekatan tapi tetap terpisah dan terbaca di zoom dekat — rapikan r22/r44 masih bekerja.
- Keadaan game (dari menu, hanya dilihat): Suka Maju, populasi 12 (target 20), Hari 405, ~09.27 Pagi, Berawan. Stok: Kayu 160/160 (PENUH), Batu 130/130 (PENUH), Emas 1/40, Besi 47/55, Pangan 200/200 (PENUH), Kulit 95/95 (PENUH). "Selama kamu pergi: Hari 390 → 405" (fitur Ide 22 bekerja). "Tonggak 7 dari 7"; menu menginginkan "Bengkel Besi" dan "Tugu Leluhur Agung" (tingkat 5 DESAIN-EKONOMI.md, masih terkunci). Jam game maju cepat: malam saat muat, pagi dalam beberapa menit tontonan.

### Riset + backlog (brief research/2026-11-06-0029.md)
- Sudut: UX (rotasi dari ekonomi/sim 22:29). Sumber dibaca: forum WoW "How do you manage all the floating npc names?" (dibaca penuh — pemain mengatasi banjir nameplate dengan filter: sembunyikan NPC ramah/netral bukan target, hanya quest/interaktif/musuh, transparansi 20% untuk bukan target di luar combat, toggle V/Shift+V; stacking menggeser pelat yang berkerumun tapi target selalu di-foreground) + utas stacking vs overlapping (stacking tanpa batas atas membuat pelat melayang jauh dari unitnya dan memantul; pemain meminta padding antar pelat; overlapping mengunci di atas kepala tapi 15+ pelat menutupi satu sama lain).
- Ide 33 DIBANGUN run ini. Ide 38 (label hewan meredup saat tidak diburu / bukan target, pola transparansi WoW) + Ide 39 (label warga terpilih selalu paling depan, pola foreground WoW) masuk IDE-FITUR.md sebagai backlog. Tidak direkomendasikan: sembunyikan semua label hewan (pemain butuh bedakan jinak vs buas), stacking ke atas tanpa batas (pelat melayang + memantul), memperkecil semua label (melawan aturan keterbacaan HP).

### Verifikasi live r48 (browser + API, PENDING — diisi setelah deploy)

## 2026-11-05 ~22:29 WIB — r47: Pasar Minggu tiap 7 hari game (Ide 35, riset fitur baru + ekonomi/sim)

Perubahan dalam 2 kalimat: kartu menu kini punya satu baris "🛖 Pasar Minggu" yang menghitung mundur ke hari pasar berikutnya (tiap hari game kelipatan 7), dengan tempat mengikuti bangunan yang berdiri (Balai, kalau tidak ada Paviliun Makan, kalau tidak ada tengah kampung); murni display dari hari game + daftar bangunan di poll yang sudah ada, tanpa ubah sim dan tanpa janji ekonomi — pasar belum jual-beli, baru penanda momen mingguan yang ditunggu.

- Fungsi murni `pasarMingguan(hari, jenisBerdiri)` di `src/lib/batu/sumberdaya.ts` (deterministik, display-only): `sisa = (7 - (h % 7)) % 7` — 0 -> "Hari ini Pasar Minggu di …", 1 -> "Besok Pasar Minggu di …", sisanya "Pasar Minggu N hari lagi di …"; hari 0/NaN/negatif diperlakukan sebagai hari 1; tidak pernah mengandung NaN.
- Wiring `page.tsx`: dihitung di IIFE kartu menu yang sama dengan `kronikKampung`/`tonggakKampung`, dirender sebagai `.menu-pasar` tepat di bawah baris Kronik; gaya di `globals.css` senada `.menu-kronik` (bingkai netral, tanpa animasi — patuh reduced-motion r31).
- Tes: blok RONDE 47 baru, 18 asersi (hari pasar kelipatan 7 + tempat Balai/Paviliun/tengah kampung + Balai menang atas Paviliun, H-1, hitung mundur 2/6 hari, hari live 397 -> pasar hari 399, input aneh -> hari 1, deterministik, audit sumber page/CSS/versi). Total: 8060 lolos / 637 gagal vs baseline 8042/637 — daftar gagal IDENTIK baseline, +18 asersi baru hijau semua. Satu pin versi usang `"r46"` di blok r10 ikut dinaikkan ke r47 (itu satu-satunya selisih dan kini hijau). Build Next.js hijau.
- `src/lib/version.ts`: `BUILD_ID` r46 -> r47 (18 pin versi ikut naik).

### Observasi live (browser, hanya melihat, 22:31-22:37 WIB)
- Muat pertama TIDAK berat: layar "Memuat peta 3D…" lalu desa tampil utuh dalam <30 detik (lebih cepat dari 60-70 detik di observasi 20:30 — variansi chunk/jaringan, bukan klaim perbaikan; r47 tidak menyentuh muat).
- Geser/zoom mulus, tanpa jank, blank, atau error. Tombol ☰ (ikonnya tampil sebagai kotak kecil, bukan ☰, di tangkapan layar — kosmetik), ▲/▼, analog, "+ Tambah karakter", "🎮 Panduan Kontrol" semua terlihat dan tidak tertutup. Menu lebih tinggi dari layar sehingga item bawah perlu scroll (scrollbar ada).
- Warga: sebagian besar tampak melayang sendiri jauh di luar desa di rumput kosong (Siti, Go Younjung, Evos dyroth di tepi peta; Ys jauh dari pusat), tanpa animasi kerja yang jelas. Pengecualian: Renata "🛡️ Menghalau Hewan!" naik 49% -> 62% -> 87% lalu reset ke 1% dan naik lagi, berulang — tanpa hewan yang terlihat dikejar di viewport. Bubble muncul ("Tolong! Ada hewan buas!", "Kamu sudah makan hari ini…") — satu bubble TIDAK sinkron cuaca: "Cerah, bagus untuk menjemur kulit." padahal header menunjukkan Hujan. Dicatat sebagai temuan observasi (dialog tidak sadar cuaca), bukan regresi r47; kandidat backlog kecil.
- Hewan: 17 ekor ada di data (Rusa, Serigala, Kelinci, Babi Hutan, Ayam Hutan, Beruang) tapi TIDAK SATU PUN terlihat berlabel di tampilan normal; baru di zoom-jauh ada label "Beruang" terpotong di tepi atas + bentuk gelap kecil di tepi jauh. Hewan tampaknya hidup di tepi peta — padahal r42 sudah membias respawn 80% ke sabuk 12-45 tile dari pusat. Belum terbukti regresi (observasi hanya satu pan + satu zoom), tapi perlu observasi ulang run berikutnya; bukan alasan menunda r47 (r47 tidak menyentuh hewan).
- Keadaan game (dari menu, hanya dilihat): Suka Maju, populasi 12, Hari 397, 09.00 Pagi, Hujan. Stok: Kayu 160/160 (PENUH), Batu 130/130 (PENUH), Emas 1/40, Besi 47/55, Pangan 183/200, Kulit 95/95 (PENUH). Gunung stok warisan sudah susut ke kisaran kapasitas — pembusukan r34 bekerja; pangan 183/200 (naik dari 143 di 20:30, masih dalam kapasitas). "Selama kamu pergi: Hari 390 → 397". "Kampung menginginkan: masih kurang populasi 20 (sekarang 12)". Tonggak 7 dari 7.
- CATATAN KEJUJURAN: observer TIDAK menemukan teks "Kronik kampung" di menu — tapi UI kronik memang tidak menampilkan label itu, hanya "📜 " + kalimatnya (mis. "📜 Hari 397 di Suka Maju — 12 warga, pagi hujan."), jadi pencarian observer berdasarkan label tidak bisa mengonfirmasi/membantah. Jalur kodenya tanpa syarat (selalu render) dan r46 sudah membuktikan kronik hidup live dua cabang; verifikasi visual ulang dilakukan di langkah verifikasi r47 ini.

### Riset + backlog (brief research/2026-11-05-2229.md)
- Sudut: EKONOMI/SIM (rotasi dari fitur baru 20:29). Sumber dibaca penuh: Medieval Dynasty — penjelasan resmi developer soal pembusukan di peti (2x lebih lambat dari inventaris; kondisi turun per musim; makanan busuk -> "Rot" -> pupuk di Barn; mengolah memulihkan kondisi 100%) + Vintage Story — panduan preservasi (suhu 0,1x-2,5x; cellar <= 5°C; crock tersegel 10x lebih lambat; vessel sayur -75%/biji -50%; memasak tidak menyelamatkan bahan yang sudah busuk; olahan menukar gizi dengan umur simpan, selai 45 hari); plus cuplikan Utopia (busuk ~1% dari TOTAL stok — ditolak, melanggar "yang di dalam kapasitas aman" di DESAIN-EKONOMI.md).
- Ide 35 DIBANGUN run ini (irisan display-only: pengumuman hitung mundur di kartu menu; SISA: pengumuman kabar H-1, kumpul visual warga di hari H, pesanan desa berbonus versi sim). Ide 36 (sisa busuk jadi pupuk ladang, dari Medieval Dynasty) + Ide 37 (hidangan paviliun membusuk lebih lambat dari pangan mentah, dari Vintage Story) masuk IDE-FITUR.md sebagai backlog. Tidak direkomendasikan: busuk persen dari total stok (Utopia), sistem suhu per makanan/ruangan, cellar sebagai bangunan baru sebelum kunci tingkat selesai.

### Verifikasi live r47 (browser + API, 22:48-22:50 WIB)
- Deployment Vercel dpl_7NALXFGKjDXABJvSwQmhkB4gS49s READY (commit 406f8df6, production); `/api/version` = `{"ok":true,"build":"r47"}`.
- `/api/world` ok: Suka Maju, populasi 12, hari_total 398, 06.43 Pagi, Cerah; sumber_daya Kayu 160/160, Batu 130/130, Emas 1/40, Besi 47/55, Pangan 185/200, Kulit 95/95. `/api/map` ok: grid 600, 12 warga, 37 placement, ikan 30. `/api/bangunan` ok: katalog 26, antrean 14 (turun dari 20 di r46 karena bangunan selesai — bukan regresi, r47 tidak menyentuh bangunan). Homepage + favicon 200.
- Pasar Minggu TERBUKTI HIDUP di kartu menu: "🛖 Besok Pasar Minggu di Balai." — benar secara hitungan (hari 398, 398 % 7 = 6, pasar hari 399) dan tempat benar (Balai berdiri). Kronik JUGA terkonfirmasi tampil: "📜 Kayu penuh (160/160) — lumbung tidak muat lagi, waktunya membangun." (cabang stok penuh, prioritas 4) — menjawab catatan observasi 22:31: kronik tidak hilang, hanya memang tidak berlabel "Kronik kampung" di UI. Tonggak 7 dari 7 tetap tampil; jam header maju live (07.45 -> 08.30 -> 08.39 Pagi, H-398, Cerah).
- Tidak ada regresi API: isi respons sama strukturnya dengan r46, hanya angka stok/hari yang bergerak wajar.

## 2026-11-05 ~20:29 WIB — r46: kronik kampung satu baris (Ide 23, riset fitur baru)

Perubahan dalam 2 kalimat: kartu menu kini punya satu baris "📜 Kronik kampung" — cerita hari ini yang ditulis dari data poll yang sudah ada (pangan, bangunan dibangun, warga tanpa tugas, tonggak), bukan karangan; kalimatnya dipilih aturan prioritas sederhana (pangan dulu, lalu bangunan, lalu keadaan hari), mengikuti pola kronik satu baris Plai yang disebut developernya fitur favoritnya.

- Fungsi murni `kronikKampung` di `src/lib/batu/sumberdaya.ts` (deterministik, display-only, tanpa ubah sim, tanpa fetch baru): pangan habis -> "Pangan habis — warga menahan lapar…"; pangan <= 25% kapasitas -> "Pangan menipis (n/kap)…"; bangunan sedang dibangun (progres terbesar, dijepit 0..100) -> "X sedang dibangun (n%) — palu berdentang…"; N warga tanpa tugas; stok penuh (urutan katalog RESOURCES); tonggak berikutnya -> "Selangkah lagi: …"; kalau tidak ada yang mendesak -> "Hari 389 di Suka Maju — 12 warga, pagi cerah." Selalu ada baris, tidak pernah kosong, tidak pernah mengandung NaN.
- Wiring `page.tsx`: dihitung di IIFE kartu menu yang sama dengan `tonggakKampung`/`selamaKamuPergi` (dari `world` + `map.warga` + `bangunan.antrean` status "dibangun" + `tg.berikutnya`, semua dari poll yang sudah ada), dirender sebagai `.menu-kronik` di bawah baris Tonggak, di atas tip; gaya di `globals.css` senada `.menu-tonggak` (bingkai netral, tanpa animasi — patuh reduced-motion r31).
- Tes: blok RONDE 46 baru, 18 asersi (fallback angka live 20:30, prioritas pangan > dibangun, ambang menipis 25%, progres terbesar menang + jepit 0..100 + NaN -> 0%, label kosong diabaikan, tanpa tugas, stok penuh + urutan katalog, tonggak, deterministik, input aneh tetap waras, audit sumber page/CSS/versi). Total: 8042 lolos / 637 gagal vs baseline r45 8024/637 — daftar nama gagal IDENTIK dengan baseline (dibuktikan banding stash; satu pin versi usang `"r45"` di blok r10 ikut dinaikkan ke r46, itu satu-satunya selisih dan kini hijau). Build Next.js hijau.
- `src/lib/version.ts`: `BUILD_ID` r45 -> r46 (17 pin versi ikut naik).

### Observasi live r45 (browser, hanya melihat, 20:30-20:35 WIB)
- Muat pertama: LAMBAT / terasa berat — layar "Memuat peta 3D…" polos (tanpa progress/persentase/spinner), desa baru tampil ~60-70 detik setelah buka (masih loading di cek ~35 dan ~65 detik). Lebih lambat dari observasi run sebelumnya (<30 detik); penyebab pastinya tidak terukur dari sini (bisa chunk dingin / variansi jaringan) — dicatat jujur, bukan diklaim sebagai regresi r45 (r45 tidak menyentuh muat/chunk). Sisa Ide 7 (cangkang HTML statis sebelum hydration + progres jujur) tetap antrean run performa berikutnya.
- Warga: 12 nama terdaftar; dalam jendela 15-20 detik posisi + bubble percakapan tampak identik (tidak terlihat berjalan/bekerja); dalam jeda ~1 menit Budi berpindah dari samping Siti ke samping Ys — mereka memang berpindah sesekali, tapi saat ditonton biasa terbaca diam di dekat gubuk. Bubble berubah ("Lihat langit itu, Evos dyroth. Cerah sekali hari ini." -> "Aku tidak setuju, tapi aku menghormati caramu berpikir."). Dua warga (ribran gakabuming, reja auditore) tidak terlihat di frame zoom-dekat (di balik bangunan/luar frame).
- Hewan: terlihat dan berlabel (36 label total: Rusa, Ayam Hutan, Serigala, Beruang, Kelinci, Babi Hutan); di satu frame hanya beberapa yang kelihatan, sisanya di luar kamera; tidak terlihat bergerak dalam jendela 15-20 detik (sama seperti warga).
- LABEL CHECK (verifikasi visual r44 yang tertunda): LOLOS di zoom dekat — klaster tengah (Figo, Nera, Praboti, Evos dyroth, Siti) menumpuk vertikal dengan celah jelas antar pil, tanpa teks menimpa teks; Ys, Go Younjung, Renata, Miners, Budi juga terpisah jelas. Catatan kecil di zoom lebar: pil Figo dan Budi yang berdiri bersebelahan bersentuhan (horizontal, bukan tumpukan vertikal yang diperbaiki r44), dan bubble percakapan tengah menutupi sebagian figur di area Budi/Nera.
- Kontrol: joystick analog kiri-bawah utuh (tidak terpotong), tombol ✕/▲/▼, tombol ☰ kuning, "+ Tambah karakter", "🎮 Panduan Kontrol" semua terlihat; zoom merespons langsung dan mulus; menu buka-tutup instan. Satu tumpang tindih kecil di zoom lebar: label "reja auditore" di kiri-bawah sebagian tertutup tombol "Panduan Kontrol".
- Tidak ada error, blank, atau jank. Kekosongan: desa hanya menempati petak kecil di tengah, dikelilingi rumput hijau kosong yang luas dengan sedikit pohon/batu/cakram — itu terrain, bukan blank. Scene sempat gelap/flat di awal lalu terang saat muat/zoom.
- Keadaan game (dari menu, hanya dilihat): Suka Maju, populasi 12, Hari 389, 08.01 Pagi, Cerah. Stok: Kayu 30/160, Batu 21/130, Emas 1/40, Besi 47/55, Pangan 143/200, Kulit 65/95. Pangan 143 (dari 0 saat r45) = pemulihan berlanjut, konsisten dengan efek 5x r45 — dicatat sebagai observasi, bukan bukti kausal r45. "Selama kamu pergi: Hari 381 → 389", bangunan selesai selagi pergi termasuk Gubuk Besar dan Perahu. Tonggak 7 dari 7.

### Riset + backlog (brief research/2026-11-05-2029.md)
- Sudut: FITUR BARU (rotasi dari UX 18:29). Sumber dibaca penuh: Plai: Village Tale (kronik satu baris = fitur favorit developer; daily bounties, festival *hram* mingguan, "new age") + My Village Story devlog v1.1.5 (haat/pasar tiap hari ke-7 + pesanan desa berbonus + satu pertanyaan yang dicatat di buku harian); plus cuplikan Village in the Shade (hubungan lewat festival/bantuan/hadiah -> cerita pribadi; kesukaan warga terlihat langsung = QoL dipuji) dan Moonfrost (cerita warga berkembang).
- Ide 23 DIBANGUN run ini (kronik satu baris). Ide 35 (pasar mingguan tiap 7 hari game, display-only dulu: pengumuman + kumpul di balai/paviliun) masuk IDE-FITUR.md sebagai backlog; Ide 11 (jejak kebersamaan) diperkuat riset run ini (Village in the Shade: hubungan membuka cerita; Moonfrost: cerita warga berkembang) dengan catatan: cek dulu apakah kabar menyimpan pasangan ngobrol secara terstruktur sebelum menghitung duo paling kompak. Tidak direkomendasikan: aturan horor/larangan malam, multiplayer/trading, prestige/reset "new age", kronik karangan LLM, pasar dengan ekonomi baru di irisan pertama.

### Verifikasi live r46 (browser, hanya melihat, ~20:50-21:00 WIB)
- Deployment Vercel dpl_EkaCfPLsfMWkvdaKNakiG8scAiSG READY (commit c50a7a0b, production); `/api/version` = `{"ok":true,"build":"r46"}`.
- `/api/world` ok: Suka Maju, populasi 12, hari_total 389, 18.24 Sore, Cerah; pangan 158/200, kayu 35/160, batu 31/130, emas 1/40, besi 47/55, kulit 65/95. `/api/map` ok: grid 600, ikan 30, 12 warga, 37 placement, konstruksi kosong. `/api/bangunan` ok: katalog 26, antrean 20 semua selesai 100 — tidak ada bangunan sedang dibangun saat verifikasi.
- Kronik TERBUKTI HIDUP di kartu menu: pertama "📜 Hari 389 di Suka Maju — 12 warga, sore cerah." (cabang fallback), semenit kemudian setelah pergantian hari "📜 12 warga tanpa tugas — mereka membantu tetangga sambil menunggu kerja." (cabang tanpa-tugas) — aturan prioritas bekerja live, kalimat berubah mengikuti keadaan. Blok Tonggak (7 dari 7) dan "Selama kamu pergi" (Hari 389 → 390) tetap tampil. Favicon 48x48 "N" termuat. Homepage render, tanpa error/blank/regresi; muat pertama kali ini ~10-25 detik (lebih cepat dari 60-70 detik di observasi 20:30 — variansi, bukan regresi).
- Catatan: placement /api/map 37 (naik dari 14 di verifikasi 18:40) — bangunan baru selesai sejak itu (Gubuk Besar, Perahu, paviliun) + kemungkinan cara hitung berbeda; BUKAN regresi r46 karena route map/bangunan tidak disentuh run ini.

## 2026-11-05 ~19:00 WIB — r45: warga beku + jalan 0 + pangan 0 (laporan user via video) + resource 5x

Perubahan dalam 2 kalimat: akar masalahnya ternyata BUKAN warga malas — warga kelaparan berkepanjangan sampai sehat jatuh ke 10, lalu cabang tabib yang baru menyetel mereka ke fase "jalan" tanpa node sehingga mereka beku di satu ubin (status berkedip, tidak pernah sampai tabib, tidak pernah kumpul, tidak pernah bangun jalan); r45 memperbaiki cabang berobat itu + gerak yang mengorbit bangunan + prioritas makan-darurat di atas berobat, dan atas perintah eksplisit user hasil kumpul dikali 5 (cap biasa 3 -> 15, besi/emas tetap langka).

- Bukti live (video user, hari 382, pop 12): kayu 149/160, batu 6/130, emas 1/40, besi 47/55, pangan 0/200, kulit 92/95; `jalan: []` (0 ubin); 10 dari 12 warga lapar=100, status "Berjalan mencari makan darurat…"; Evos dyroth + Siti "Membangun jalan lumbung-paviliun…" padahal `jalan: []` kosong.
- Masalah 1+2, akar penyebab (terbukti trace simulasi, bukan dugaan): (a) lapar >= 95 menggerus sehat -3/jam sampai sehat 10; (b) tabib preemption di `stepWarga` menyetel `fase_siklus = "jalan"` + `node = null` + `aksi = "berobat"`, padahal TIDAK ADA cabang gerak yang menangani warga tanpa node — fallthrough akhir lalu menimpa berobat dengan kerja baru tiap jam, warga beku, status berkedip; (c) `gerak` ke tengah bangunan (tujuan = rintangan) mengorbit footprint sampai budget habis — jalan ke tabib dari (85,94) berakhir di (104,121), 22 ubin dari pondok; (d) tabib membajak warga yang sedang kumpul / sedang mencari makan darurat, sehingga tidak ada ronde kumpul yang pernah selesai — deadlock kelaparan: sakit -> berobat -> tidak makan -> makin sakit. Gate jalan r40 (stamina >= 40, lapar < 90) hanya faktor penyerta, bukan akar: probe sehat=100 membangun 23 ubin jalan, probe sehat=10 membangun 0.
- Perbaikan sim (`src/lib/batu/sim.ts`): fase baru `"berobat"` + cabang berobat yang benar-benar berjalan ke Pondok Tabib (sembuh saat jarak Manhattan <= 2: sehat=100, stamina+40, istirahat 3 jam); `gerak` berhenti DI SEBELAH tujuan yang rintangan (Chebyshev <= 1) begitu tercapai — ubin tujuan tetap tidak dimasuki (kontrak tabrakan penuh); tabib TIDAK membajak ronde kumpul yang berjalan, TIDAK membajak warga yang sedang membawa hasil pulang, TIDAK membajak misi makan darurat (`node.darurat` — makan menghentikan penyebab sakitnya sendiri); aturan malam kini juga menangkap fase berobat.
- Masalah 3, perintah user 2026-11-05 (mengalahkan DESAIN-EKONOMI.md): `PENGALI_KUMPUL = 5` pada hasil kumpul pangan/kayu/batu/kulit (termasuk daging buruan x5 dan bonus buah pemanjat); cap harian biasa 3 -> 15 (3 x 5); besi/emas TIDAK dikali (tetap langka, cap 2/hari) — keputusan asisten, dicatat di DESAIN-EKONOMI.md; kapasitas gudang TIDAK berubah, pembusukan hanya di atas kapasitas.
- Simulasi 10 hari live-like (12 warga, posisi/status persis API ~19:00 WIB, pangan 0, sehat 10): SEBELUM — pangan akhir 3 (1 ronde kumpul/10 hari), jalan 0, 12/12 beku. SESUDAH — pangan akhir 200 (cap gudang), jalan 45 ubin (jam pertama 39), 95 ronde kumpul, lapar rata-rata akhir 68,3 (dari 100). Probe sehat=100: pangan 200, jalan 45 (jam pertama 15), 93 ronde, lapar akhir 76. Pangan > 0 berkelanjutan, bukan sesaat.
- Tes: 8024 lolos / 637 gagal (baseline r44: 7999/643 — turun 6 karena perbaikan, tanpa kegagalan baru; sisanya utang tes lama r15/r14/r11/r18 yang sudah gagal di baseline). Blok r45 baru: berobat (sakit -> fase berobat + bergerak + sembuh jam 13-18; sakit jam 20 -> pulang; bawa hasil sakit -> tetap pulang; konstanta 5x), gerak berhenti di sebelah tujuan rintangan (kasus tabib (85,94)->(105,100)), berobat tidak membajak darurat-makan, berobat tidak membajak kumpul, simulasi 10 hari (pangan akhir > 0, pangan > 0 di >= 8/10 hari, jalan >= 5, <= 2 beku di ubin awal, >= 20 ronde kumpul). Satu perbaikan tes: `PL45 as never` -> `as never[]` (build Next.js sempat gagal TS2488, kini hijau).
- `src/lib/version.ts`: `BUILD_ID` r44 -> r45. `DESAIN-EKONOMI.md`: override 5x tertanggal 2026-11-05 ditambahkan di atas bagian 1.
- Catatan jujur: warga pulang siang masih menunggu di ambang pintu gubuk sampai malam (footprint rumah padat di siang hari — desain lama, bukan regresi r45); satu ronde kumpul per warga per hari tetap jadi ritme normal. Jalan/pangan live butuh jam game untuk terlihat — verifikasi live hanya memastikan build r45 ter-deploy dan API sehat, bukan stok sudah pulih.

### Verifikasi live r45 (19:38-19:39 WIB, deployment dpl_J337YXFoMsYtiLvDvCYiPgz7bpGZ READY, commit bdbe1dd)
- `/api/version` = `{"ok":true,"build":"r45"}`. Homepage render ("Negara Emas — Zaman Batu", "Memuat peta 3D…"); favicon.ico 48x48 termuat. `/api/map` ok (grid 600, ikan 30, node lengkap, 14 placement); `/api/bangunan` ok (26 katalog, antrean paviliun_makan (96,109) progres 20 "dibangun"). `/api/world` TIDAK terverifikasi — fetch browser.open timeout (perilaku flaky yang sudah dikenal di endpoint ini, bukan bukti regresi; tidak diulang atas instruksi runtime).
- Kabar baik live (hari 385, ~3 hari game sejak video user hari 382): pangan 50/200 (dari 0), jalan 32 ubin (lumbung-paviliun ~24 + hunian-paviliun 8, dari 0), konstruksi paviliun_makan aktif (progres 20, ribran gakabuming). Warga sehat 91-100, lapar 28-91 (dari 10/12 lapar 100): Evos dyroth + Budi + ribran gakabuming sedang `bangun_jalan` hunian-paviliun; reja auditore `kumpul` kayu bakar; Ys berburu ("Melukai Beruang! HP 9/12"); Figo/Nera/Praboti/Miners `kembali` pulang setelah kerja.
- KEJUJURAN WAKTU: deployment r45 baru READY ~19:35 WIB, sedangkan pemulihan live (pangan 0->50, jalan 0->32) terjadi selama ~40 menit sebelumnya — jadi pemulihan ini TIDAK bisa diklaim sebagai hasil r45. Penyebab pemulihan live yang paling mungkin: jalur penyembuhan sosial yang sudah ada di r44 (interaksi "ngobrol dengan Tabib" -> "Minumlah ramuan herbal ini lalu beristirahatlah... lukamu telah sembuh!" tercatat di 5 warga, sampai_jam 9205-9253) menyembuhkan warga beku satu per satu, lalu mereka kembali bekerja. Bukti r45 tetap simulasi offline 10 hari (pangan 200, jalan 45, 95 ronde) — r45 memastikan warga sakit SEMBUH SECARA SISTEMATIS lewat cabang berobat (bukan menunggu kebetulan ngobrol dengan Tabib), dan hasil 5x berlaku mulai deploy ini. Efek 5x + berobat di live baru terlihat penuh dalam jam/hari game ke depan — awasi run berikut.

## 2026-11-05 ~18:29 WIB — r44: jarak label bertumpuk 18/20px -> 28px (observasi live)

Perubahan dalam 2 kalimat: label nama warga yang berkerumun kini benar-benar terpisah — jarak antar label dirapikan dari 18/20px menjadi 28px, karena pil label tingginya ~19px sehingga jarak lama hanya menyisakan celah 1-2px dan tumpukan terlihat seperti kolom yang bordernya bersentuhan; tidak ada yang berubah selain jarak itu (tanpa ubah sim, tanpa ubah tampilan lain).

- Akar (terbukti hitungan CSS, bukan tebakan): `.map3d-label` = font 11px x 1.2 + padding 4px + border 2px = ~19px tingginya; ambang bentrok 18px + langkah geser 20px menaruh dua pil hanya 1-2px berjarak. Konstanta baru `JARAK_LABEL_BERTUMPUK = 28` di `src/lib/batu/tampil.ts` = pil ~19px + celah ~9px, dipakai sebagai ambang DAN langkah (pemisahan akhir 28-55px). Pil terpilih (`.sel`, ~27px) celahnya menipis — diterima, karena hanya satu label terpilih dalam satu waktu.
- Tes: blok RONDE 24 baru, 11 asersi (tumpukan 5 label -> 0/28/56/84/112; ambang 24px masih bertabrakan, 30px bebas; horizontal <70px/>=70px tidak berubah; urutan input dipertahankan; audit sumber) + 2 asersi r22 diperbarui ke jarak baru (termasuk "urutan input dipertahankan": 120 -> 148 karena ambang 28). Total: 7998-7999 lolos / 642-643 gagal vs baseline 7987/643 — daftar nama gagal IDENTIK setelah nilai acak dinormalisasi; satu-satunya selisih antar run adalah tes flaky yang sudah dikenal (r15 acak + simulasi paceklik 12 jam, gagal di satu run dan lolos di run berikutnya pada tree yang sama, sebelum maupun sesudah perubahan ini — tanpa kaitan dengan label). Build Next.js hijau.
- `src/lib/version.ts`: `BUILD_ID` r43 -> r44 (16 pin versi ikut naik).

### Observasi live r44 (browser, hanya melihat, 18:29-18:32 WIB)
- Muat pertama: layar "Memuat peta 3D…" polos (tanpa progress bar/persentase/spinner), desa penuh tampil <30 detik; tidak terasa berat, tanpa error. Geser/zoom tidak dites (instruksi observe-only, tanpa klik).
- Warga tampak diam/berdiri di tempat selama 45-90 detik pengamatan (Figo, Nera, Praboti, Evos dyroth, Siti, Ys + klaster tengah) — tidak terlihat berjalan/menebang/bertani dari framing ini. Dicatat sebagai observasi, BUKAN vonis bug: warga bisa saja bekerja di node-nya (aksi di tempat) dan r41 sudah mengalihkan warga menganggur ke kerja berguna; verifikasi butuh pengamatan lebih lama / zoom ke node kerja.
- Hewan: hanya 1 Kelinci terlihat berlabel di viewport; 17 label hewan lain terdaftar di halaman tapi di luar kamera. Artinya tumpukan label yang teramati BUKAN label hewan — koreksi atas dugaan awal brief ini.
- Analog joystick kiri-bawah TIDAK terpotong run ini: lingkaran luar utuh dengan margin jelas dari tepi kiri, tombol ✕/▲/▼ semua terlihat. Laporan r43 tidak terulang — TIDAK ada angka CSS yang diubah; Ide 34 (safe-area) masuk backlog saja. Satu keanehan visual kecil: objek dunia 3D (cakram emas) menonjol dari balik tepi kanan tombol ▼ — objek scene di belakang UI, bukan tumpang tindih UI.
- Label warga di pusat kampung MASIH rapat: 5 label (Renata, Go Younjung, Budi, reja auditore, ribran gakabuming) menumpuk vertikal, border pil bersentuhan/hampir bersentuhan; teksnya sendiri tetap terbaca, tidak ada teks-menimpa-teks. Inilah yang diperbaiki r44 (jarak 28px). Verifikasi visual jarak baru menyusul run berikut (butuh muat dingin + framing yang sama).
- Label sempat berkedip: tumpukan 5 label hilang satu kali pengamatan lalu muncul lagi ~90 detik kemudian, tanpa warga berpindah. Dugaan: warga istirahat saat malam tiba lalu disembunyikan r42 (`tidurDiDalam`) — belum terverifikasi, dicatat saja.
- Tidak ada HUD hari/jam/cuaca/stok di tampilan default (hanya di kartu menu) — by design sejak navbar dihapus, bukan bug. Tidak ada area blank/error. Peta sebagian besar rumput kosong dengan desa kecil di tengah — itu terrain, bukan blank.
- Verifikasi r43 live (sebelum edit): `/api/version` = `{"ok":true,"build":"r43"}`.

### Riset + backlog (brief research/2026-11-05-1829.md)
- Sudut: UX (rotasi dari AUDIO 16:29). Sumber dibaca penuh: Wandr (jempol bukan kursor, target besar DAN berjarak, umpan balik di luar titik sentuh, kurangi isi layar) + Cursa (teks sekunder min 12-13px, scrim di atas gambar, target 44-48px + jarak 8-12px, jangan menempel tepi); plus h-idris (safe area), Supagames (safe-area-inset + cadangkan ruang kontrol), Egmatic (49% main satu tangan, lantai 48dp). Ide 33 (label hewan ikut antrean rapikan) dan Ide 34 (safe-area klaster kontrol) masuk IDE-FITUR.md sebagai backlog. Tidak direkomendasikan: perkecil font label di bawah 11px, pindah kontrol ke atas layar, tur interaktif multi-langkah, menebak penyebab analog terpotong tanpa bukti visual.

### Verifikasi live r44 (browser, 18:40-18:42 WIB)
- Deployment Vercel dpl_HXGrbNGU6SLeKxo1R5y75sgGmgAm READY (commit 0bc86c2, production); `/api/version` = `{"ok":true,"build":"r44"}`.
- `/api/world` ok: Suka Maju, populasi 12, hari 17 (total 381), tahun 2, jam 14.57 siang berawan; `/api/map` ok: grid 600, 12 warga, 14 placement, ikan 30, hewan + node lengkap; `/api/bangunan` ok: katalog 26 tipe, antrean 0, bangunan selesai 100%. Homepage render (judul "Negara Emas — Zaman Batu", peta 3D + warga + kontrol tampil); favicon.ico 48x48 "N" termuat.
- PERHATIAN (bukan regresi r44 — perubahan ini display-only, tidak menyentuh sim): `/api/world` menunjukkan pangan 0/600 (kayu 149, batu 6, emas 1, besi 47, kulit 92). Pangan sempat 462 ribu saat observasi 16:29; susut ini konsisten dengan pembusukan 50%/hari di atas kapasitas + produksi tipis pasca-r40, tapi angka NOL dengan 12 warga perlu diawasi run berikut (apakah pangan pulih atau paceklik berlanjut) — cron dilarang menulis DB, jadi hanya dicatat.
- Verifikasi visual jarak label baru 28px BELUM dilakukan (butuh framing kerumun yang sama seperti observasi 18:29) — antrean run berikut.

## 2026-11-05 ~16:29 WIB — r43: ambien prosedural siang/malam/cuaca (Ide 32, irisan 1)

Perubahan dalam 2 kalimat: kampung kini terdengar hidup — tiga lapis ambien prosedural (angin, hujan, malam) mengikuti fase dan cuaca game, dibuat dari noise yang sudah ada tanpa satu file audio pun; lapisnya crossfade pelan saat siang berganti malam atau hujan turun, dan ikut toggle Suara + gate gestur yang sudah ada, jadi tidak pernah bunyi sendiri saat load.

- Fungsi murni `lapisanAmbien(fase, cuaca)` di `src/lib/audio.ts` (angin/hujan/malam 0..1): siang cerah angin 0,10 saja; malam + lapis malam 0,08; hujan 0,22 + angin 0,14; petir 0,30 + angin 0,18; berawan angin naik 0,02; sore belum malam; nilai tak dikenal kembali ke default siang cerah (tanpa NaN). Semua gain dijepit 0..1 dan maksimal 0,30 — sengaja di bawah loop api (0,5) supaya ambien tetap latar, bukan sorotan.
- Tiga loop persisten baru di `getCtx()` memakai ulang `noiseBuf` 2 detik yang sama (tanpa aset, tanpa paket awal membengkak): angin lowpass 300 Hz + LFO 0,11 Hz, hujan bandpass 1200 Hz playback 1,3x, malam lowpass 200 Hz sangat pelan. `updateAudioScene` menerapkan gain lewat `setTargetAtTime(..., 0,5)` — crossfade pelan, bukan potong kasar.
- Wiring: `AudioSnapshot` ditambah `faseWaktu` + `cuaca`; Map3D meneruskan `faseRef.current` + prop baru `cuaca` (default "cerah"); page meneruskan `cuaca={cuaca}` dari `cuacaGame` yang sudah dihitung. Tidak ada fetch baru, tidak ada ubah sim. Suara mati (master 0) ikut membungkam ambien; sebelum gestur pertama ctx belum running dan `updateAudioScene` return seperti SFX lain — tidak melanggar autoplay.
- Tes: blok RONDE 23 baru, 14 asersi (tabel fase x cuaca, jepit 0..1 semua kombinasi, default tak dikenal, ambien pelan, audit wiring audio/Map3D/page) + 14 pin versi naik ke r43. Jujur dicatat: bunyi ambien TIDAK bisa diverifikasi dari sini (tidak ada tangkapan audio) — yang teruji offline adalah pemetaan gain + wiring; dengar langsung di HP user adalah verifikasi akhirnya.
- Lanjutan (belum): bunyi acak jarang jangkrik/burung one-shot + slider volume Efek/Ambien (Ide 16, menunggu ambien ada).

### Observasi live r42 (browser, hanya melihat, 16:30-16:33 WIB)
- Muat pertama: layar "Memuat Peta 3D..." lalu desa penuh tampil dalam ≤20 detik (terasa agak berat, tapi tidak macet, tanpa error). Geser/zoom mulus, tanpa jank.
- Warga terlihat dan bergerak, tapi kebanyakan berkerumun di sekitar gubuk; tidak ada yang jelas terlihat berjalan ke ladang/tambang dari zoom itu. Hewan terlihat jelas dan berlabel (Rusa, Babi Hutan, Beruang, Kelinci, Ayam Hutan, Serigala; ~27 label hewan di peta).
- Siklus siang/malam terasa: terang saat buka, gelap ~50-70 detik kemudian (longhouse menyala), terang lagi sekitar 2 menit — sejalan dengan jam game yang cepat.
- TIDAK ada HUD di tampilan default (hari/jam/cuaca/stok hanya ada di kartu menu) — itu by design sejak navbar dihapus, bukan bug.
- DUA CACAT DICATAT, BELUM DIPERBAIKI RUN INI (antrean run berikut): (a) joystick analog kiri-bawah TERPOTONG tepi kiri viewport 1919×998 — CSS `.analog-kamera` sendiri `left: 12px`, jadi penyebab pastinya perlu inspeksi visual lanjutan (kemungkinan wrap/container meluber); (b) tumpukan label nama warga di tengah kampung MASIH bertumpuk susah dibaca, padahal r42 mengklaim `rapikanLabelBertumpuk` sudah merapikannya — verifikasi visual r42 untuk label ini BELUM lolos, perlu observasi lanjutan (mungkin rapikan hanya bekerja pada label yang masuk satu frame `labelAntre`, atau tumpukan 10+ warga tetap terlihat menumpuk walau sudah digeser).
- Verifikasi r42 live (sebelum observasi): deployment Vercel dpl_BtoARDef72WzPwevc1Na7fWkHxLc READY (commit 857e90d, 15:59 WIB), `/api/version` = `{"ok":true,"build":"r42"}`; `/api/world`, `/api/map`, `/api/bangunan` 200 dengan isi waras (Suka Maju, populasi 12, hari 373, grid 600, ikan ada). Catatan: grep homepage yang sempat menunjukkan "r39" adalah false positive — substring di hash chunk Turbopack (`0rqzdkolxr391.js`), bukan BUILD_ID.
- Tes + build tree r42 diverifikasi ulang run ini SEBELUM edit: build hijau; tes 7973 lolos / 643 gagal; banding stash vs HEAD membuktikan nol kegagalan baru (satu tes lama malah jadi lolos; tes paceklik flaky gagal di kedua sisi dengan nilai acak berbeda).

### Riset + backlog (brief research/2026-11-05-1629.md)
- Sudut: AUDIO (rotasi dari kembali-bermain 14:29). Sumber: dok desain suara 0 A.D. (lapis Environmental + Ambient), MDN Web Audio best practices (gesture gate + kontrol volume), ulasan Village in the Shade (siang/malam yang terdengar), CRYENGINE Dynamic Ambience (lapis dasar + blend siang/malam + crossfade), IEZA/SEASON (ambien lebih pelan dari SFX). Ide 32 (ambien prosedural) masuk IDE-FITUR.md; irisan 1-nya dibangun run ini. Tidak direkomendasikan: ambien generate AI on-device, autoplay saat load, loop berlisensi di paket awal, musik latar penuh sebagai langkah pertama.
- Catatan sinkronisasi tree: saat run ini mulai, tree lokal masih di r41 + perubahan r42 belum commit, sementara main remote SUDAH berisi r42 (commit 857e90d, 15:59 WIB — push via jalur lain, bukan dari tree ini). Sinkronisasi dilakukan lewat stash -> pull --ff-only -> pop; sempat konflik di IDE-FITUR.md (r42 dan run ini sama-sama menambah bagian di akhir file) dan diselesaikan dengan mempertahankan kedua bagian. Perubahan run ini (r43) dibangun di atas r42 yang sudah sinkron.

## 2026-11-05 ~17:00 WIB — r42: tidur di dalam rumah + label tidak menumpuk + hewan dekat kampung (wewenang penuh user)

Perubahan dalam 2 kalimat: warga yang istirahat di jam malam kini tidak dirender di luar — mereka tidur di dalam huniannya (tidak lagi berkerumun di luar rumah), dan label nama warga yang berkerumun dirapikan supaya tidak saling menutupi; hewan respawn/seed kini bias ke dekat kampung (80% percobaan dalam sabuk 12–45 tile dari pusat) supaya berburu terasa hidup, dan tombol menu ☰ diganti kontras tinggi (latar kuning solid + ikon gelap).

- Tidur di dalam — sim TIDAK berubah (warga tetap pulang ke ubin tidurnya di malam hari, bangun pagi seperti biasa; istirahat siang tetap terlihat). Yang berubah hanya render: helper murni baru `tidurDiDalam(faseSiklus, faseWaktu)` di `src/lib/batu/tampil.ts` (true hanya untuk istirahat + malam), dipakai `src/components/Map3D.tsx` untuk menyembunyikan grup 3D + label warga yang tidur di dalam. Jalan pulang (kembali) dan kumpul di malam hari tetap terlihat.
- Label bertumpuk — helper murni baru `rapikanLabelBertumpuk` di `tampil.ts` (greedy per urutan layar: bila dua label bertabrakan |dy| < 18 dan |dx| < 70, geser ke bawah 20px sampai bebas). Map3D kini mengumpulkan posisi label warga dalam satu frame (`labelAntre`) lalu menerapkan hasil rapikan sekaligus; bubble ikut labelnya. Label warga tidur di dalam tidak ikut antre (disembunyikan). Guard lama "loop frame melewatkan update label saat disembunyikan" sempat gagal karena edit pertama mengubah baris `if (!labelTampilRef.current)` — dikembalikan ke struktur asli (cabang `tidurDalam` terpisah) supaya guard tetap lolos tanpa mengubah tes.
- Hewan dekat kampung — helper baru `lokasiRespawnHewan` di `src/lib/batu/sim.ts`: 80% percobaan mengambil lokasi dalam sabuk Manhattan 12–45 dari PUSAT, sisanya sebaran lama; lokasi harus darat, >= 10 dari pusat, di dalam grid (null bila tidak ada dalam 40 percobaan). Dipakai di blok respawn `advanceWorld` dan di seed awal hewan (deterministik dari seed). Target populasi tetap ~25 ekor, tidak berubah.
- Tombol menu kontras tinggi — `.menu-fab` di `src/app/globals.css`: latar navy transparan + border kuning tipis diganti latar kuning solid #facc15, border 2px solid #0b182e, ikon #111827, bayangan lebih kuat; ukuran 44px dan posisi tidak berubah.
- Tes: `tests/batu.test.ts` +23 lolos (7973 lolos / 643 gagal vs baseline 7950/643 — daftar nama gagal identik kecuali tes paceklik flaky yang sudah dikenal, gagal di kedua sisi; nol kegagalan baru, dibuktikan banding stash). Tes baru r22 (23 asersi): tidurDiDalam 6 kasus, rapikanLabelBertumpuk 6 kasus, lokasiRespawnHewan sebaran (200 pick: hampir semua dapat lokasi, semua >= 10 dari pusat, tidak di air, mayoritas <= 45) + null, audit sumber (Map3D/sim/CSS). `BUILD_ID` naik ke r42 (14 pin versi ikut naik).
- Grid TIDAK diubah (tetap 600x600) sesuai perintah tugas — keputusan pengecilan masih di tangan user + Fina.

## 2026-11-05 ~16:40 WIB — r41: gotong royong (jalan + bangunan untuk siapa saja) + warga menganggur cari kerja berguna

Perubahan dalam 2 kalimat: jalan dan bangunan kini bisa dibuat SIAPA SAJA (aturan eksplisit user) — gate kepala_suku/INT>=9 untuk jalan dihapus, dan progres bangunan tidak lagi ditentukan jumlah perajin melainkan jumlah pembantu yang benar-benar tiba di lokasi (10 + 3/pembantu per jam, maks 4 pembantu); warga yang tidak punya tugas kini dialihkan dulu ke kerja berguna (bantu bangun bangunan terdekat, lalu kumpul/memancing) sebelum santai/istirahat, jadi tidak ada lagi yang diam berkelompok tanpa tujuan di siang hari.

- Jalan untuk siapa saja — `terapkanJalan` tidak lagi memeriksa `pintarUntukJalan` (kepala_suku / INT>=9); guard fit (stamina >= 40, lapar < 90) tetap, dan ubin tetap diklaim satu warga per jam lewat `jalanTugas` sehingga beberapa warga mengerjakan segmen yang sama di ubin berbeda. Tes r18/r19/r20 yang dulu menegaskan "INT 8 tidak membangun jalan" / "warga biasa tetap kumpul" diperbarui ke perilaku baru.
- Bangunan gotong royong — progres lama `10 + 3 x jumlah perajin` diganti `progresKonstruksiPerJam(pembantu di lokasi)` = 10 + 3/pembantu (maks 4 -> 22/jam, ~5 jam per bangunan; tanpa pembantu sama seperti sebelum r41, 10/jam). `pembangun_nama` tetap label lama (nama perajin/kepala/warga pertama) — hanya progres yang dihitung dari pembantu nyata. Penugasan bantu-bangun lewat `terapkanBantuBangun`: situs terdekat dengan slot kosong (maks 4), tujuan = ubin sebelah footprint (tidak berdiri di atas bangunan), status "Membantu membangun X…"; cabang baru "bangun" di `stepWarga` (jalan ke lokasi, lalu diam membantu sampai bangunan selesai/dibatalkan); situs yang hilang melepaskan pembantu ke kerja lain (tidak macet). Daftar `ctx.bangunanDibangun` di-refresh tiap jam game di `advanceWorld`.
- Warga menganggur cari kerja berguna — `ambilTargetKerja` kini mencoba bantu-bangun sebagai fallback terakhir bila tidak ada target kumpul (urutan: jalan dulu, kumpul, bantu bangun); cabang santai saat tiba tanpa target juga mencoba bantu-bangun sebelum santai lagi/bantu visual. Istirahat malam/tidur, pulang lapar/kelelahan, dan pemulihan sakit TIDAK diubah — istirahat tetap hanya bila lelah/sakit/malam.
- Tes: `tests/batu.test.ts` +28 lolos (7950 lolos / 643 gagal vs baseline 7922/642 — selisih 1 gagal adalah tes paceklik flaky yang sudah dikenal, gagal di kedua sisi; daftar nama gagal identik, nol kegagalan baru). Tes baru r21 (28 asersi): jalan untuk peran apa pun (INT 3), bantu-bangun untuk peran apa pun + guard fit + tanpa situs, cap 4 pembantu, hitung hanya yang sudah tiba + situs cocok, progres 10/13/22 per jam, tiba di lokasi -> membantu, situs hilang -> dialihkan, bangun istirahat tanpa target -> bantu bangun, santai tiba tanpa target -> bantu bangun, audit sumber. `BUILD_ID` naik ke r41 (13 pin versi ikut naik).
- Grid TIDAK diubah (tetap 600x600) sesuai perintah tugas — keputusan pengecilan masih di tangan user + Fina.

## 2026-11-05 ~16:00 WIB — r40: jalan akhirnya dibangun (2x lebar) + sungai/ikan/memancing + rumah menghadap jalan + pangan digampangin sedikit

Perubahan dalam 2 kalimat: jalan kini benar-benar dibangun warga (akar penyebabnya gate bangunanAktif + pemicu yang hampir tidak pernah terjadi — keduanya diperbaiki, 6 penugasan jadi 95 dalam simulasi 10 hari) dan semua jalan baru lebar 2 ubin; sungai kini berisi ikan yang bisa dipancing pemancing (jaminan gacha: roll berikutnya jadi pemancing bila kampung belum punya), rumah menghadap jalan terdekat, dan pangan sedikit digampangin (roll 50/30/20, makan -55, regrow 36-60 jam) — semua tetap dalam koridor DESAIN-EKONOMI.md, cap 3/orang/hari tidak berubah. Map TIDAK dikecilkan: grid tetap 600x600 karena pengecilan akan membuat Nusantara menyimpang dari Negara Emas (satu database bersama milik Fina) — keputusan dikembalikan ke user.

- Jalan tidak dibangun — akar penyebab (terbukti simulasi 10 hari, fixture live: 12 warga, 14 placement): `rencanaJalan` bekerja (rencana lumbung-paviliun 12 ubin ada), tapi `terapkanJalan` hanya dipicu saat keluar paviliun, hanya untuk kepala_suku/INT>=9, dan hanya bila tidak ada bangunan aktif; dengan gate terbuka pun hanya 6 penugasan -> 2 ubin dalam 10 hari, dan live 0 ubin jalan. Perbaikan `src/lib/batu/sim.ts`: gate `bangunanAktif` dihapus (bangunan maju lewat hitungan perajin, bukan lewat waktu tim pinter, jadi gate itu hanya membuat jalan kelaparan giliran selamanya (antrean NPC hampir tidak pernah kosong selama kandidat ada); (b) pemicu DIPERLUAS dari "keluar paviliun saja" ke SEMUA titik pilih kerja via ambilTargetKerja di bawah. Guard fit + tidak lapar tetap; preemption malam/lapar/stamina di atas tetap menang (cabang jalan keyed node pseudo "jalan", dan semua redirect men-null-kan node — tidak pernah menahan pulang).
- Jalan 2x lebar — `src/lib/batu/jalan.ts`: `jalurJalan` kini mengembalikan jalur yang sudah dilebarkan via `lebarkanJalan` (tiap ubin spine + 1 ubin tegak lurus yang bisa dilewati); `rencanaJalan` jatuh ke segmen `pelebaran` (via `jalurPelebaran`) bila semua segmen selesai, jadi jalan lama 1 ubin ikut dilebarkan; pelebaran melewati ubin yang salah satu sisi tegak lurusnya sudah terisi (jalan tidak merayap jadi 3-4 lebar) dan tidak menembus footprint/node/air. BFS boleh menyeberang sungai lewat ubin jembatan. Map3D tidak perlu diubah untuk lebar: `determineRoadPiece` sudah menggambar potongan T/simpang sehingga lajur ganda terbaca sebagai jalan lebar.
- Sungai + ikan + memancing — sungai dan alirannya SUDAH ada (alur air 3 ubin + tekstur arus yang bergeser tiap frame); peran pemancing/nelayan + status "Memancing di sungai…" juga SUDAH ada — yang hilang: tidak ada warga pemancing (live 0/12) dan tidak ada ikan. Baru di r40: stok ikan sungai `ikanSungai` (cap 30, +3/hari di pergantian hari `advanceWorld`, ditulis-balik ke `dunia.ikan_sungai`); tiap tangkapan -1 ikan, sungai sepi -> tidak ada hasil + kabar jujur "belum ada ikan yang menyangkut" dan pemancing beralih kumpul beri; `src/app/api/gacha/route.ts` menjamin roll gacha berikutnya menjadi pemancing bila kampung belum punya pemancing dan stat cukup (agi>=4, sta>=3 = syarat peran); `/api/map` mengembalikan `ikan`; Map3D menggambar 8 ikan deterministik yang berenang bolak-balik mengikuti alur sungai, jumlah tampak = min(stok, 8).
- Rumah menghadap jalan — akar penyebab: `rotasi` dihitung saat antre (`findHousePlotBesideRoad`) tapi tidak pernah ditulis ke dokumen placement, jadi `/api/map` mengembalikan rotasi 0 untuk semua rumah. Perbaikan: `src/lib/batu/sim.ts` menulis `rotasi` ke `docBaru` (+ fallback `rotasiKeJalan` bila rumah tidak dapat petak tepi jalan: tetap hadap jalan terdekat yang ada, default 0 bila belum ada jalan sama sekali); `advanceWorld` me-re-orientasi rumah di sekitar jalan yang baru selesai (jarak <= 8 ubin). Bonus perbaikan: `rotasiKeJalan` di `src/lib/batu/dunia.ts` salah menghadap utara untuk jalan yang langsung menempel di sisi timur/barat (tie-break `dy >= dx` saat dx=dy=0) — kini dinilai dari posisi ubin terhadap footprint (prioritas S, N, E, W, sama seperti `findHousePlotBesideRoad`). Map3D sudah menerapkan `b.rotation.y = rot` dengan benar, jadi tidak diubah.
- Pangan digampangin sedikit — akar penyebab angka 0 (terbukti simulasi): produksi dimakan secepat muncul (12 warga butuh ~16-24 pangan/hari vs ~15-19 produksi/hari) + lapar rata-rata ~90 = paceklik kronis. Yang diubah, semua dalam DESAIN-EKONOMI.md: roll biasa 64/27/9% (rata-rata 1,45) -> 50/30/20% (rata-rata 1,7 — angka doc sendiri), cap 3/hari/orang TIDAK berubah, besi/emas TIDAK berubah; seporsi makan -40 -> -55 lapar (restoran + istirahat, `LAPAR_HIDANGAN` tetap 60); regrow node 48-72 jam -> 36-60 jam; + pemancing sebagai produsen pangan tambahan. Angka simulasi: fixture baru (lapar awal 20) pangan akhir hari 7-15 (dulu 0), pangan > 0 selama 237/240 jam, produksi ~18/hari; fixture keras (live-like) lapar rata-rata hari ke-10 turun 94 -> 68. Stok tidak langsung melompat — pangan menumpuk bertahap karena keseimbangan baru tipis di atas konsumsi.
- Map 20% lebih kecil — TIDAK dilakukan. Grid 600x600 (`GRID_MIN=-200`, `GRID_MAX=400`, `PUSAT=(100,100)`) dipakai untuk menghitung terrain (node cincin, gunung, sungai) dan batas air; mengecilkan hanya di Nusantara akan membuat node/gunung menyimpang dari Negara Emas (kode sendiri, DB sama) dan placement di luar batas baru menjadi "air" di sim Nusantara sementara Negara Emas tetap bisa menempatinya. Pengecilan yang aman butuh kedua game mengubah konstanta bersama (koordinasi dengan Fina) + migrasi placement di luar batas. Tes penjaga r20 mengunci grid tetap 600 sampai keputusan itu diambil.
- Tes: `tests/batu.test.ts` +36 lolos (7922 lolos / 642 gagal vs baseline 7884/644 — daftar gagal identik kecuali 2 tes regrow lama yang kini LOLOS berkat percepatan regrow; tes paceklik 12 jam flaky di kedua sisi, gagal ~2/3 run baik sebelum maupun sesudah r40). Tes baru r20: lebar jalan, pelebaran 1->2 ubin dan tidak merayap ke 3, gate jalan dihapus, `ambilTargetKerja`, pemancing ke sungai / beralih beri saat sepi, tangkapan -1 ikan + pangan masuk stok, sungai sepi tanpa hasil gratis, orientasi 4 arah + tanpa jalan, roll 50/30/20 + besi tetap, makan -55, regrow 36-60, penjaga grid 600, audit sumber (gacha, /api/map, Map3D). `BUILD_ID` naik ke r40 (11 pin versi ikut naik).
- `src/lib/version.ts`: `BUILD_ID` r39 -> r40.

## 2026-11-05 14:29 WIB — Blok "Selama kamu pergi" di kartu menu (Ide 22) + brief riset kembali bermain

Perubahan dalam 2 kalimat: kartu menu kini menampilkan blok
"👋 Selama kamu pergi" yang merangkum apa yang berubah sejak
kunjungan terakhir pemain — hari game yang berlalu, perubahan
populasi, dan jenis bangunan selesai yang baru — maksimal 3 baris
dengan tombol ✕; cuplikannya disimpan di localStorage dan ditulis
saat tab disembunyikan/ditutup, tanpa fetch baru, tanpa ubah sim,
dan tanpa hadiah offline.

- `src/lib/batu/sumberdaya.ts`: fungsi murni baru `selamaKamuPergi`
  (+ tipe `CuplikanKampung`) — null bila tidak ada cuplikan
  (kunjungan pertama) atau hari game belum maju; baris hari selalu
  ada bila hari maju, lalu populasi bila berubah, lalu bangunan
  selesai yang baru dengan label katalog (maks 2 nama + "dan N
  lagi"); bangunan yang hilang diabaikan, duplikat kind dihitung
  sekali, input tidak valid diperlakukan 0. Sengaja TANPA selisih
  stok mentah: angka "yang didapat" akan menyesatkan karena stok
  membusuk/ter-clamp.
- `src/app/page.tsx`: state `cuplikanLalu` (dibaca dari
  `ne_kunjungan_terakhir` saat mount) + `cuplikanRef` yang
  dilacak dari tiap poll berhasil; kunjungan pertama di-seed dari
  poll pertama tanpa blok; `beforeunload` + `visibilitychange`
  hidden menulis cuplikan terakhir yang dilihat; ✕ (`tutupPergi`)
  memajukan cuplikan ke keadaan sekarang supaya blok tidak muncul
  lagi sampai ada hari baru berlalu. Blok dirender di atas panel
  "Kampung menginginkan" di kartu menu.
- `src/app/globals.css`: `.menu-pergi` (+ title/baris/tutup),
  bingkai biru tenang + tombol ✕ sebaris seperti tip, tanpa
  animasi (patuh reduced-motion r31).
- Tes: 18 asersi baru (10 fungsi murni + 8 penjaga statis:
  terpasang di menu, kunci localStorage, tulis saat
  hidden/ditutup, tombol ✕, CSS, BUILD_ID). Total: 7883 lolos /
  645 gagal — baseline 7865/645, nol regresi baru.
  10 asersi BUILD_ID lama ikut naik r38 → r39.
- Build Next.js hijau.
- BUILD_ID r38 → r39.

### Observasi live (browser, hanya melihat, 14:30-14:32 WIB)
- Muat pertama ringan: desa penuh tampil <20 detik ("Memuat peta
  3D…" sebentar), tanpa spinner macet/error.
- Geser/zoom peta tanpa jank yang terlihat; tombol ▲/▼ kamera
  dan menu ☰ merespons.
- Warga kebanyakan menganggur/berkeliaran (12 warga terlihat);
  Evos dyroth, Siti, Ys melayang jauh sendiri ke rumput/hutan
  kosong; tidak ada yang terlihat memakai perkakas/bekerja di
  ladang/tambang dalam frame yang diamati — obrolan (bubble)
  yang memberi kesan tujuan, mis. janji ikut ke hutan besok.
- Hewan terlihat tapi sedikit dan kecil: Babi Hutan (1) + Ayam
  Hutan (2); daftar hewan di halaman lebih banyak dari yang
  terlihat dalam satu frame.
- Minor: label nama bertumpuk di sekitar rumah; "ribran
  gakabuming" terpotong di tepi kiri; label "Ys" sebagian
  tertutup analog kiri-bawah; tombol ☰ kontras rendah (lingkaran
  gelap kecil di kanan-atas) walau berfungsi; panel menu bisa
  di-scroll, tidak terpotong.
- Area kosong: timur desa lapangan hijau luas hampir kosong
  (pohon/batu/semak tersebar). Jam game cepat: siang → malam
  sangat gelap (01:48) dalam ~1 menit, lalu siang lagi.
- Angka live saat observasi (H-365, 01:48 Malam, Cerah):
  populasi 12; Kayu 149/160, Batu 6/130, Emas 1/40, Besi 47/55,
  Pangan 0/200, Kulit 92/95; tonggak 5 dari 7; inventori kosong.
  Pangan 0 dan Batu 6 dicatat sebagai keadaan dunia, bukan
  disentuh run ini (cron dilarang menulis DB).

### Riset + backlog (brief research/2026-11-05-1429.md)
- Sudut: kembali bermain/retensi. Sumber: Stationfolk V0.30
  (kartu "While you were away": beberapa baris, tombol Detail ke
  jurnal + Tutup, tidak memblokir, jujur bila >12 jam dilewati),
  Flutter.dev Gaming UX (pesan welcome back: di mana berhenti +
  apa berubah + apa selanjutnya), Otherreach (away log = peristiwa
  yang selesai, bukan angka mentah), SimpleIdle (welcome back
  dialog; catch-up murah, jangan simulasi ulang). Ide 22 DIBANGUN
  run ini; sisa Ide 22 (baris "yang menunggu") + jurnal lengkap
  dari kabar kampung masuk backlog. Tidak direkomendasikan:
  hadiah offline, simulasi ulang waktu pergi, dialog pemblokir.

### Verifikasi live r39 (deploy auto dari main, commit 276d7e9)
- /api/version: {"ok":true,"build":"r39"}. Homepage 200 dan ikon
  /batu/icons/kayu.png 200.
- /api/world ok: kampung Suka Maju, populasi 12, hari 365,
  11.47 Siang, Cerah; stok kayu 149, batu 6, emas 1, besi 47,
  pangan 0, kulit 92 — sama seperti sebelum deploy, tidak ada
  regresi stok dari deploy ini. Pangan masih 0 (keadaan sebelum
  deploy).
- /api/map ok: 12 warga, 14 placements, 25 hewan.
  /api/bangunan ok: katalog lengkap diawali Gubuk.
- Blok "Selama kamu pergi" baru belum diverifikasi visual di
  browser (butuh kunjungan kedua setelah hari game berlalu +
  buka kartu menu); yang terverifikasi adalah kode + tesnya, dan
  API tetap ok.

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

### Verifikasi live r38 (deploy auto dari main, commit 59f3dbf, dpl_4P1Ez8qi9H4PyXns2Y4d57oDGESE READY)
- /api/version: {"ok":true,"build":"r38"}. Homepage 200
  (judul "Negara Emas — Zaman Batu") dan ikon
  /batu/icons/kayu.png 200.
- /api/world ok: kampung Suka Maju, populasi 12, hari 364,
  17.34 Sore, Hujan; stok kayu 149/160, batu 6/130, emas 1/40,
  besi 47/55, pangan 0/200, kulit 92/95 — semua di dalam
  kapasitas, tidak ada regresi stok dari deploy ini. Pangan
  masih 0 (keadaan sebelum deploy); laju kumpul baru butuh
  jam-jam game berjalan sebelum stok pangan terlihat naik.
- /api/map ok: 12 warga, 14 placements. /api/bangunan ok:
  katalog lengkap diawali Gubuk.
- Perburuan/paviliun baru belum diverifikasi visual di
  browser (butuh main + lihat HP rusa berkurang dan paviliun
  yang tidak lagi menelan tetangga); yang terverifikasi
  adalah kode + tesnya, dan API tetap ok.

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
