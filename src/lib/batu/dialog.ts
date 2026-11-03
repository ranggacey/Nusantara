// Dialog scripted zaman batu — SETIAP baris ditandai peran (wajib).
// Aturan (memperbaiki keluhan "presiden ngomong soal mie = nyasar peran"):
// - Baris peran lain TIDAK BOLEH dipakai silang.
// - Daftar larangan era di bawah tidak boleh muncul di baris mana pun,
//   baik scripted maupun LLM. Pelanggaran = bug dialog.
// - Bubble antar warga: dialogUntukPeran (ngobrol biasa), debatBaris
//   (tantang + jawab untuk debat), geludBaris (teriak saat gelud).
import type { PeranId } from "./peran";

export const FORBIDDEN_MODERN = [
  "mie", "hp", "motor", "mobil", "presiden", "wakil", "uang", "rupiah",
  "gaji", "sekolah", "kantor", "polisi", "puskesmas", "listrik", "internet",
  "pasar", "toko", "pesawat", "kereta", "televisi", "radio", "jual", "beli",
  "rumah", "gedung", "jalan raya", "dokter",
];

export function berisiModern(teks: string): boolean {
  const t = ` ${teks.toLowerCase()} `;
  return FORBIDDEN_MODERN.some((w) => {
    const re = new RegExp(`[^a-z]${w.replace(/ /g, "[^a-z]+")}[^a-z]`);
    return re.test(t);
  });
}

export const LINES: Record<PeranId, string[]> = {
  kepala_suku: [
    "Api unggun malam ini harus tetap menyala, {nama}. Dingin bisa datang tiba-tiba.",
    "Hasil buruan hari ini kita bagi rata. Tidak ada yang tidur lapar di kampung ini.",
    "Aku dengar kabar dari hulu sungai: kawanan rusa bergerak ke selatan.",
    "Tetua dulu bilang, kampung yang rukun tidak pernah kekurangan.",
    "Besok kita musyawarah di dekat api: siapa pergi ke hutan, siapa menjaga kampung.",
    "Tombak-tombak harus diasah sebelum musim dingin tiba.",
    "Anak-anak, dengarkan: sungai ini memberi kita ikan dan air, jagalah ia.",
    "Aku sudah hitung stok lumbung. Cukup untuk beberapa hari, tapi kita harus tetap kumpul.",
    "Kalau ada yang sakit, panggil tabib sebelum matahari tenggelam.",
    "Jejak di tanah basah itu milik babi hutan. Besar, hati-hati.",
    "Kampung ini berdiri karena semua orang bekerja. Tidak ada yang hanya menonton.",
    "Malam ini kita bercerita tentang leluhur di sekitar api. Datanglah, {nama}.",
  ],
  pemburu: [
    "Tombakku sudah tajam. Hari ini aku mengincar rusa di padang.",
    "Jejak segar! Kawanan itu lewat sini pagi tadi, {nama}.",
    "Daging segar untuk kampung, kulitnya untuk tenda baru.",
    "Berburu itu soal sabar. Satu gerakan salah, buruan kabur semua.",
    "Aku pasang jerat di dekat semak. Semoga besok ada hasil.",
    "Angin dari utara bagus untuk mengendap-endap. Mereka tidak mencium kita.",
    "Kulit rusa ini tebal, bagus untuk baju dingin.",
    "Pernah aku mengejar babi hutan sampai ke sungai. Untung lariku cepat.",
    "Kepala suku bilang bagi rata. Aku setuju, asal jeratku tidak diutak-atik.",
    "Lihat tulang itu? Itu sisa perburuanku minggu lalu. Bersih dimakan api? Bukan, dimakan waktu.",
    "Besok aku pergi lebih pagi. Binatang keluar saat embun masih ada.",
    "Tombak patah kemarin. Perajin janji membuatkan yang baru dari kayu keras.",
  ],
  pengumpul: [
    "Semak di dekat sungai sedang berbuah lebat, {nama}. Keranjangku sudah setengah penuh.",
    "Umbi ini enak kalau dibakar di api unggun. Coba nanti malam.",
    "Aku menemukan madu di batang lapuk! Tapi lebahnya galak, hati-hati.",
    "Jamur yang ini aman dimakan, yang itu jangan. Aku hafal dari baunya.",
    "Buah beri merah manis, yang hitam pekat lebih mengenyangkan.",
    "Keranjang anyamanku awet, buatan perajin kampung sendiri.",
    "Hari ini aku kumpul sampai tiga keranjang. Lumbung makin penuh.",
    "Anak-anak suka ikut memetik, tapi mereka sering makan di tempat. Hehe.",
    "Akar ini pahit, tapi tabib bilang bagus untuk perut.",
    "Semak berduri itu menyimpan buah paling manis. Luka kecil tidak apa-apa.",
    "Musim buah hampir habis. Kita harus kumpul lebih banyak minggu ini.",
    "Aku menandai semak yang sudah dipetik dengan ranting patah, biar tidak kembali sia-sia.",
  ],
  penebang: [
    "Kapak batuku sudah tajam. Pohon ini tumbang sebelum tengah hari.",
    "Kayu keras untuk gubuk, ranting kering untuk api unggun.",
    "Pohon besar itu kubiarkan. Akarnya menahan tanah di tepi sungai.",
    "Satu pohon, banyak guna: gubuk, tombak, kayu bakar.",
    "Tanganku kapalan, tapi lumbung butuh kayu terus.",
    "Hati-hati kalau menebang dekat sarang lebah. Aku sudah dua kali dikejar.",
    "Kayu ini ringan tapi kuat. Cocok untuk rangka tenda.",
    "Penjaga api minta kayu bakar tambahan. Malam ini dingin, katanya.",
    "Aku menanam? Tidak, hutan memberi sendiri. Kita hanya mengambil secukupnya.",
    "Batang lurus itu untuk tombak pemburu. Yang bengkok untuk kayu bakar.",
    "Suara kapak di hutan itu musikku, {nama}.",
    "Gubuk baru butuh tiga puluh kayu. Aku sudah kumpulkan sebagian.",
  ],
  penambang: [
    "Urat emas ini berkilau di dalam batu. Indah, tapi keras dipahat.",
    "Pahatku tumpul lagi. Perajin harus membuatkan yang baru.",
    "Besi dari tanah ini berat, tapi tombak jadi lebih kuat.",
    "Gua di balik bukit menyimpan batu bagus. Aku gali pelan-pelan.",
    "Debu batu membuat batuk. Aku tutup hidung dengan kulit.",
    "Emas tidak bisa dimakan, tapi kepala suku bilang simpan saja. Kelak ada gunanya.",
    "Batu yang ini keras, yang itu rapuh. Tanganku sudah hafal bedanya.",
    "Aku menemukan urat baru kemarin. Belum kuceritakan ke siapa-siapa.",
    "Mengangkat batu seharian membuat punggungku panas. Tapi lumbung butuh batu.",
    "Kilau kuning di celah batu itu emas, bukan pantulan api. Aku yakin.",
    "Besi ini kutempa? Belum bisa. Untuk sekarang, kita pahat dan asah saja.",
    "Hati-hati di gua, {nama}. Gelap dan licin. Bawa obor dari api unggun.",
  ],
  perajin: [
    "Kapak baru sudah jadi. Tajam, gagangnya pas di tangan.",
    "Batu ini bagus untuk perkakas. Lihat, retaknya lurus.",
    "Aku menganyam tali dari serat kulit. Kuat, tidak mudah putus.",
    "Tombak pemburu patah kemarin. Hari ini kubuatkan yang lebih kuat.",
    "Periuk tanah liatku retak saat dibakar. Besok kucoba lagi.",
    "Setiap batu punya watak. Yang keras untuk kapak, yang halus untuk pisau.",
    "Gubuk baru butuh rangka kayu. Aku bantu potong dan pasang.",
    "Pisau batu ini bisa menguliti rusa dengan cepat. Pemburu pasti senang.",
    "Aku suka bunyi batu dipahat. Seperti lagu, tapi lebih berdebu.",
    "Tali, kapak, tombak, periuk — semua dari tangan kampung sendiri.",
    "Kalau ada batu bagus, bawa ke bengkelku. Jangan dibuang.",
    "Kerja perajin itu pelan, {nama}. Terburu-buru, perkakas jadi rapuh.",
  ],
  tabib: [
    "Daun ini kutumbuk untuk luka. Perih sebentar, sembuh kemudian.",
    "Akar pahit ini untuk perut kembung. Minum sedikit saja.",
    "Demamnya turun setelah kuolesi ramuan dingin semalam.",
    "Aku kumpulkan tumbuhan obat sebelum matahari tinggi. Saat itulah khasiatnya kuat.",
    "Luka pemburu itu dalam, tapi sudah kubalut kulit bersih.",
    "Jangan makan jamur yang tidak kukenal, {nama}. Perutmu bisa memberontak.",
    "Doa leluhur kubacakan pelan, ramuan kuoleskan perlahan.",
    "Madu bagus untuk tenggorokan. Aku simpan sedikit di pondokku.",
    "Anak yang batuk itu kuberi uap daun hangat. Tidurnya jadi nyenyak.",
    "Setiap tumbuhan punya guna, asal tahu takarannya.",
    "Aku menanam tumbuhan obat di dekat pondok, biar tidak jauh mencari.",
    "Kalau ada yang sakit, datang sebelum gelap. Malam hari jalannya licin.",
  ],
  penjaga_api: [
    "Api ini tidak boleh padam, {nama}. Ia menghangatkan dan melindungi kita.",
    "Kayu bakar malam ini cukup, tapi besok aku harus kumpul lagi.",
    "Bara dijaga, bukan dibiarkan. Api besar boros kayu, api kecil mudah mati.",
    "Malam dingin, binatang menjauh kalau api menyala terang.",
    "Aku menumpuk kayu kering di dekat api, biar tidak kehujanan.",
    "Asap api ini tanda kampung kita. Dari jauh, orang tahu ada kehidupan.",
    "Ceritakan kisah leluhur di dekat api, tapi jangan terlalu dekat. Jilat api itu panas.",
    "Hujan semalam hampir memadamkan api. Untung bara masih hidup di bawah abu.",
    "Penebang janji mengirim kayu keras. Kayu keras apinya lama.",
    "Api unggun ini pusat kampung. Semua kabar berkumpul di sini.",
    "Aku berjaga bergantian dengan yang lain, tapi malam ini giliranku.",
    "Lihat percikan itu? Kayu damar memang begitu. Indah, tapi jangan ditiru terlalu dekat.",
  ],
  peramu: [
    "Lumpang ini kutumbuk pelan, {nama}. Ramuan bagus tidak boleh terburu-buru.",
    "Daun pahit ini kujadikan ramuan penambah tenaga. Minum sedikit, badan hangat.",
    "Aku meramu dari semak pagi ini. Wanginya saja sudah menyembuhkan setengah.",
    "Ramuan penenang ini untuk yang susah tidur. Satu teguk, mimpi indah.",
    "Tabib dan aku berbagi tumbuhan: dia mengobati luka, aku meramu tenaga.",
    "Jangan campur akar ini dengan buah itu. Racunnya diam-diam, {nama}.",
    "Ramuan merah ini kubuat dari beri matang. Rasanya asam, khasiatnya kuat.",
    "Lumpang batuku sudah halus dipakai bertahun-tahun. Seperti teman lama.",
    "Siapa lelah sehabis berburu, datang ke pondokku. Ada ramuan hangat.",
    "Aku mencatat ramuan di kulit kayu, biar tidak lupa takarannya.",
    "Musim hujan tumbuhan obat tumbuh subur. Lumayan, stok ramuanku penuh.",
    "Ramuan ini bukan sihir, {nama}. Ini daun, akar, dan kesabaran.",
  ],
  juru_masak: [
    "Periuk ini mendidih pelan, {nama}. Masakan enak tidak boleh diburu waktu.",
    "Daging buruan hari ini kumasak dengan beri. Manis, gurih, mengenyangkan.",
    "Aku memanggang umbi di bara api. Kulitnya gosong, dalamnya lembut.",
    "Pemburu membawa daging, pengumpul membawa beri — tugasku meraciknya jadi santap.",
    "Sup tulang ini kubuat semalaman. Pagi ini semua warga makan hangat.",
    "Garam? Tidak ada. Asap dan beri sudah cukup memberi rasa, {nama}.",
    "Periuk tanah liatku retak kemarin. Perajin janji menambalnya.",
    "Siapa pulang berburu dengan perut kosong, datang ke api. Periukku selalu ada isi.",
    "Masakan malam ini: daging panggang dan umbi bakar. Makanlah yang banyak.",
    "Aku mengeringkan daging di rak jemur, biar awet untuk hari hujan.",
    "Anak-anak berebut kerak periuk. Katanya bagian itu paling gurih. Hehe.",
    "Kampung yang makan bersama tidak mudah bertengkar, {nama}.",
  ],
    pemancing: [
    "Umpanku sudah disambar, {nama}! Ikan sungai hari ini gemuk-gemuk.",
    "Joran bambu ini lentur tapi kuat. Tarikan ikan besar pun tak patah.",
    "Memancing itu melatih kesabaran jiwa. Tenang seperti aliran sungai.",
    "Pelampung merah putihku bergerak-gerak di pusaran air tenang.",
    "Ikan segar langsung kubawa ke juru masak untuk dipanggang.",
  ],
  nelayan: [
    "Sungai pagi ini jernih, {nama}. Ikan berenang dekat permukaan, jala sudah siap.",
    "Jala ini kuanyam dari serat kulit. Sekali tebar, ikan tidak lolos.",
    "Tombak ikan lebih cepat dari jala untuk ikan besar. Tapi jala dapat banyak sekaligus.",
    "Aku memancing di hilir, dekat rumpun bambu air. Di sana ikan berkumpul.",
    "Air surut, ikan mudah ditangkap. Air pasang, aku menepi dan memperbaiki jala.",
    "Ikan bakar malam ini untuk semua. Juru masak sudah menunggu hasilku.",
    "Hati-hati melangkah di batu sungai, {nama}. Licin, tapi ikannya banyak.",
    "Aku menandai lubuk dalam dengan tongkat. Di sanalah ikan besar bersembunyi.",
    "Sungai memberi kita makan tanpa harus berburu jauh. Jagalah ia tetap bersih.",
    "Jala robek kemarin, kup perbaiki semalaman. Hari ini menebar lagi.",
    "Kalau hujan, sungai keruh dan ikan menghilang. Aku pulang lebih cepat.",
    "Dulu kakekku memancing dengan tangan kosong. Aku tidak seberani itu, hehe.",
  ],
  petani: [
    "Ladang ini kucangkul pagi-pagi, {nama}. Tanahnya gembur, benih cepat tumbuh.",
    "Umbi di ladang sudah bisa dipanen minggu ini. Lumbung akan penuh lagi.",
    "Aku menanam di dekat kampung, biar mudah dijaga dari babi hutan.",
    "Cangkul batuku tumpul lagi. Perajin janji mengasahnya besok.",
    "Tanaman ini butuh air sungai. Aku menyiramnya setiap sore.",
    "Pengumpul membawa beri dari hutan, aku menanam umbi di ladang. Sama-sama pangan.",
    "Hama? Burung dan babi. Aku pasang orang-orangan dari jerami.",
    "Panen kali ini bagus. Sebagian disimpan, sebagian dimasak juru masak.",
    "Tanah ladang harus diistirahatkan bergantian, kalau tidak jadi kurus.",
    "Aku menandai bedeng yang baru ditanam dengan ranting, biar tidak terinjak.",
    "Hujan semalam membantu. Tanah basah, benih cepat bertunas.",
    "Ladang dekat kampung itu anugerah, {nama}. Pangan tidak perlu dicari jauh-jauh.",
  ],
  penjaga: [
    "Aku berpatroli keliling kampung, {nama}. Tidak ada hewan buas yang boleh mendekat.",
    "Jejak serigala di dekat pagar semalam. Aku sudah mengusirnya dengan tombak.",
    "Patroli pagi, patroli sore. Kampung aman kalau ada yang berjaga.",
    "Beruang itu besar, tapi ia takut api dan suara. Aku berteriak, ia pergi.",
    "Aku memeriksa pagar bambu setiap putaran. Yang rapuh segera kuperbaiki.",
    "Penjaga api menjaga bara, aku menjaga kampung. Sama-sama jaga malam.",
    "Kalau ada yang mendekat di gelap, aku bersiul dulu. Kalau diam, aku mendekat.",
    "Tombakku selalu tajam. Hewan buas tidak berani dua kali.",
    "Aku berjalan pelan di sekeliling gubuk, mendengarkan. Kampung tidur nyenyak.",
    "Babi hutan itu merusak ladang kemarin. Hari ini aku jaga ladang lebih ketat.",
    "Kepala suku bilang: penjaga yang baik itu yang tidak terlihat, tapi selalu ada.",
    "Putaran terakhir sebelum tidur. Semua tenang, semua aman.",
  ],
  pengukir: [
    "Batu ini kuukir pelan, {nama}. Pahat yang terburu-buru membuat retak.",
    "Totem leluhur sudah setengah jadi. Wajahnya harus gagah, bukan marah.",
    "Pisau batu ini kuasah dari singkapan pagi tadi. Tajamnya pas.",
    "Perajin membuat perkakas, aku membuat ukiran. Sama-sama dari batu.",
    "Ukiran di batu ini cerita kampung kita: sungai, api, dan rusa.",
    "Pahat batuku patah kemarin. Untung penambang memberi batu baru.",
    "Batu keras untuk totem, batu halus untuk pisau. Tanganku hafal bedanya.",
    "Aku mengukir di dekat bengkel, sambil mendengar kabar kampung.",
    "Totem selesai, kampung punya penanda. Leluhur menjaga kita dari batu.",
    "Debu ukiran membuat mataku perih. Aku membasuhnya di sungai.",
    "Kalau ada batu bagus, bawa padaku. Jangan dibuang, jangan dipecah.",
    "Ukiran bagus itu sabar, {nama}. Satu goresan salah, batu tidak bisa diulang.",
  ],
  penjelajah: [
    "Aku berjalan jauh hari ini, {nama}. Di balik bukit ada hutan yang belum dijelajahi.",
    "Jejak baru! Arah ini belum pernah dilewati warga kampung.",
    "Aku menandai jalan pulang dengan patahan ranting, biar tidak tersesat.",
    "Sungai di utara bercabang. Cabang kecil itu mungkin menyimpan ikan.",
    "Aku menemukan singkapan batu baru kemarin. Penambang pasti senang.",
    "Menjelajah itu soal kaki dan mata. Kaki kuat, mata awas.",
    "Bekal: air, umbi bakar, dan tombak pendek. Cukup untuk sehari jalan.",
    "Di seberang sungai ada padang luas. Besok pemburu harus ke sana.",
    "Aku tidak takut tersesat. Matahari dan sungai selalu menunjuk pulang.",
    "Setiap perjalanan kubawa kabar: sumber baru, jejak hewan, atau bahaya.",
    "Hutan lebat itu menyimpan buah. Tapi juga menyimpan babi hutan. Hati-hati.",
    "Kampung kecil, dunia besar. Tugasku membuat dunia itu dekat, {nama}.",
  ],
  pemanjat: [
    "Pohon ini tinggi, tapi aku sudah di tengahnya, {nama}. Buahnya banyak.",
    "Tali panjatku kuat, simpulnya tidak pernah lepas. Aku memeriksa dua kali.",
    "Kayu dari atas lebih kering, bagus untuk tombak. Buahnya untuk lumbung.",
    "Aku memanjat sebelum matahari tinggi. Siang, kulit pohon licin oleh getah.",
    "Dari atas sini kampung kelihatan kecil. Sungai berkilau seperti ular.",
    "Buah yang matang jatuh sendiri. Yang mentah kubiarkan untuk minggu depan.",
    "Penebang menebang dari bawah, aku mengambil dari atas. Sama-sama kayu.",
    "Sarang burung di dahan itu kubiarkan. Telurnya bukan untuk kita.",
    "Angin kencang di atas pohon itu menakutkan. Aku memeluk batang erat-erat.",
    "Tali ini kubuat dari kulit. Perajin mengajariku simpul yang benar.",
    "Satu pohon, dua hasil: kayu untuk gubuk, buah untuk perut.",
    "Kalau dahan berderak, aku turun. Nyawa lebih penting dari buah, {nama}.",
  ],
  penenun: [
    "Serat ini kutenun pelan, {nama}. Benang putus kalau ditarik kasar.",
    "Kulit dari padang kubuat tali dan baju. Tidak ada yang terbuang.",
    "Alat tenunku dari kayu keras. Perajin membuatnya sesuai tanganku.",
    "Aku menenun di dekat api, sambil mendengar kabar kampung.",
    "Kain kulit ini untuk musim dingin. Hangat, tidak tembus angin.",
    "Serat rumput padang itu kuat kalau dipilin tiga. Aku sudah mencoba.",
    "Pemburu membawa kulit, aku mengolahnya. Kerjasama kampung, begitu.",
    "Tali jerat penjerat itu buatanku. Kuat, tidak mudah putus.",
    "Menenun itu sabar, seperti meramu. Hasilnya tidak bisa diburu waktu.",
    "Aku mengeringkan serat di rak jemur dulu, baru ditenun.",
    "Baju kulit baru untuk yang pergi berburu jauh. Biar tidak kedinginan.",
    "Setiap helai punya cerita: padang, tangan, dan api, {nama}.",
  ],
  penjerat: [
    "Jerat ini kupasang di jalur hewan, {nama}. Dekat air, tapi tidak terlalu dekat.",
    "Jerat rotan harus disamarkan dengan daun. Hewan itu waspada.",
    "Pagi ini jeratku dapat kelinci. Dagingnya untuk lumbung, kulitnya untuk penenun.",
    "Aku memeriksa jerat setiap pagi. Yang kosong kupindah, yang dapat kubawa pulang.",
    "Pemburu mengejar, aku menunggu. Dua cara berburu, sama-sama pangan.",
    "Jalur babi hutan itu kuberi jerat besar. Tali ganda, patok dalam.",
    "Jangan sentuh jeratku, {nama}. Sekali terpicu, harus dipasang ulang.",
    "Aku belajar dari kakek: jerat bagus itu yang tidak terlihat, tapi tidak kejam.",
    "Hujan semalam merusak dua jerat. Hari ini kubuat lagi dari rotan baru.",
    "Kelinci itu cepat, tapi jalurnya tetap. Jerat menunggu di sana.",
    "Hasil jerat kubagi rata, seperti hasil buruan. Kepala suku yang membagi.",
    "Padang ini kaya, asal jerat dipasang di tempat yang benar.",
  ],
};

// Debat: tantangan (penantang) + jawaban (lawan). Hasil dipengaruhi INT.
export const DEBAT_TANTANG = [
  "Aku tidak setuju! Rombongan besok harus ke hutan barat, bukan ke sungai.",
  "Dengar aku: stok lumbung harus dijaga, jangan dibagi semua malam ini.",
  "Kau salah, {nama}. Jejak itu milik rusa, bukan babi hutan.",
  "Aku tantang pendapatmu: api besar itu boros kayu, bara saja cukup.",
  "Tidak, tidak. Jembatan harus di hilir, bukan di dekat gubuk.",
  "Kau bilang berburu pagi lebih baik — aku bilang sore lebih tenang.",
  "Musyawarah kemarin keputusannya terburu-buru. Aku minta diulang.",
  "Aku tidak percaya gua itu aman. Kita harus periksa dulu sebelum menggali.",
];

export const DEBAT_JAWAB = [
  "Boleh jadi kau benar, tapi dengar dulu alasanku.",
  "Hmm, aku tetap pada pendirianku — hutan barat lebih jauh.",
  "Baiklah, kali ini aku mengalah. Besok kita coba caramu.",
  "Jangan keras-keras, {nama}. Kita satu kampung, bukan musuh.",
  "Alasanmu masuk akal. Aku setuju setengah, sisanya nanti dibahas.",
  "Aku tidak setuju, tapi aku menghormati caramu berpikir.",
  "Kau menang debat kali ini. Aku yang memasak malam ini.",
  "Sudahlah, kita tanya kepala suku saja di musyawarah.",
];

// Gelud: teriakan singkat saat bertarung (hasil dipengaruhi STR/AGI/STA).
export const GELUD = [
  "Ayo, siapa takut!",
  "Rasakan ini!",
  "Jangan lari, hadapi aku!",
  "Hyaa!",
  "Kau duluan yang mulai!",
  "Sudah cukup! Aku menyerah…",
];

export function dialogUntukPeran(peran: string, nama: string, seed = Math.random): string {
  const list = (LINES as Record<string, string[]>)[peran];
  if (!list || list.length === 0) return "";
  const teks = list[Math.floor(seed() * list.length)];
  return teks.replace(/\{nama\}/g, nama);
}

// Satu pertukaran debat: { tantang, jawab }. Seed deterministik per pasangan.
export function debatBaris(namaLawan: string, seed = Math.random): { tantang: string; jawab: string } {
  const t = DEBAT_TANTANG[Math.floor(seed() * DEBAT_TANTANG.length)];
  const j = DEBAT_JAWAB[Math.floor(seed() * DEBAT_JAWAB.length)];
  return { tantang: t.replace(/\{nama\}/g, namaLawan), jawab: j.replace(/\{nama\}/g, namaLawan) };
}

export function geludBaris(seed = Math.random): string {
  return GELUD[Math.floor(seed() * GELUD.length)];
}

// RONDE 13 — ngobrol beneran: obrolan santai antar 2 warga (bukan debat,
// bukan gelud). Baris generik era Zaman Batu — tanpa kata modern
// (cek berisiModern di test) + tanpa klaim peran tertentu, supaya bisa
// dipakai pasangan peran apa pun.
export const NGOBROL_TANYA = [
  "Eh, {nama}, semalam tidurmu nyenyak?",
  "Kamu sudah makan hari ini, {nama}?",
  "Besok ikut ke hutan, {nama}?",
  "Api unggun malam ini pasti ramai, {nama}.",
  "Lihat langit itu, {nama}. Cerah sekali hari ini.",
  "Kamu dengar kabar dari hulu sungai, {nama}?",
  "Ayo duduk sebentar, {nama}. Kakiku pegal.",
  "Hasil kumpulmu hari ini banyak, {nama}?",
];

export const NGOBROL_JAWAB = [
  "Nyak sekali! Gubukku hangat semalam.",
  "Sudah, makan beri dari semak dekat sungai.",
  "Ikut! Aku bawa keranjang tambahan.",
  "Iya, aku bawa kayu bakar tambahan.",
  "Cerah, bagus untuk menjemur kulit.",
  "Belum, kabar apa? Ceritakan!",
  "Boleh, sebentar saja. Habis itu aku kembali kerja.",
  "Lumayan, cukup untuk lumbung hari ini.",
];

export function ngobrolBaris(namaLawan: string, seed = Math.random): { tanya: string; jawab: string } {
  const t = NGOBROL_TANYA[Math.floor(seed() * NGOBROL_TANYA.length)];
  const j = NGOBROL_JAWAB[Math.floor(seed() * NGOBROL_JAWAB.length)];
  return { tanya: t.replace(/\{nama\}/g, namaLawan), jawab: j.replace(/\{nama\}/g, namaLawan) };
}
