const { MongoClient, ObjectId } = require('mongodb');
// using --env-file=.env

async function run() {
  const uri = process.env.MONGODB_URI?.trim();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('negaraemas');

  console.log('Clearing old clustered peta_tile and bangunan...');
  await db.collection('peta_tile').deleteMany({});
  await db.collection('bangunan').deleteMany({});

  // Seed beautiful, spacious fantasy village
  const starterBuildings = [
    {
      tipe: 'api_unggun',
      status: 'selesai',
      progres: 100,
      gx: 100,
      gy: 100,
      w: 1,
      h: 1,
      pemrakarsa: 'Figo (Kepala Suku)',
      pembangun_nama: 'Warga Kampung',
      alasan: 'Pusat kehangatan dan perkumpulan kampung saat malam.',
      sumber_alasan: 'scripted',
      dibuat_hari: 1,
      dibuat_pada: new Date()
    },
    {
      tipe: 'pondok_tabib',
      status: 'selesai',
      progres: 100,
      gx: 92,
      gy: 100,
      w: 2,
      h: 2,
      pemrakarsa: 'Figo (Kepala Suku)',
      pembangun_nama: 'Makima',
      alasan: 'Tempat merawat dan menyembuhkan warga yang terluka atau sakit.',
      sumber_alasan: 'scripted',
      dibuat_hari: 1,
      dibuat_pada: new Date()
    },
    {
      tipe: 'lumbung',
      status: 'selesai',
      progres: 100,
      gx: 107,
      gy: 100,
      w: 2,
      h: 2,
      pemrakarsa: 'Figo (Kepala Suku)',
      pembangun_nama: 'Makima',
      alasan: 'Penyimpanan hasil pangan bersama.',
      sumber_alasan: 'scripted',
      dibuat_hari: 1,
      dibuat_pada: new Date()
    },
    {
      tipe: 'gubuk',
      status: 'selesai',
      progres: 100,
      gx: 95,
      gy: 107,
      w: 2,
      h: 2,
      pemrakarsa: 'Musyawarah Kampung',
      pembangun_nama: 'Nuril',
      alasan: 'Hunian nyaman dengan jarak lega antar rumah.',
      sumber_alasan: 'scripted',
      dibuat_hari: 1,
      dibuat_pada: new Date()
    },
    {
      tipe: 'gubuk_besar',
      status: 'selesai',
      progres: 100,
      gx: 104,
      gy: 107,
      w: 2,
      h: 2,
      pemrakarsa: 'Figo (Kepala Suku)',
      pembangun_nama: 'Nuril',
      alasan: 'Hunian komunal lega untuk warga istirahat.',
      sumber_alasan: 'scripted',
      dibuat_hari: 1,
      dibuat_pada: new Date()
    },
    {
      tipe: 'bengkel_batu',
      status: 'selesai',
      progres: 100,
      gx: 100,
      gy: 92,
      w: 2,
      h: 2,
      pemrakarsa: 'Musyawarah Kampung',
      pembangun_nama: 'Hercules',
      alasan: 'Tempat perajin menempa batu dan perkakas.',
      sumber_alasan: 'scripted',
      dibuat_hari: 1,
      dibuat_pada: new Date()
    },
    {
      tipe: 'jembatan',
      status: 'selesai',
      progres: 100,
      gx: 36,
      gy: 100,
      w: 4,
      h: 1,
      pemrakarsa: 'Figo (Kepala Suku)',
      pembangun_nama: 'Warga',
      alasan: 'Menyeberangi sungai tanpa basah.',
      sumber_alasan: 'scripted',
      dibuat_hari: 1,
      dibuat_pada: new Date()
    },
    {
      tipe: 'perahu',
      status: 'selesai',
      progres: 100,
      gx: 38,
      gy: 101,
      w: 2,
      h: 1,
      pemrakarsa: 'Nelayan',
      pembangun_nama: 'Warga',
      alasan: 'Sarana air untuk menyeberang dan menangkap ikan.',
      sumber_alasan: 'scripted',
      dibuat_hari: 1,
      dibuat_pada: new Date()
    }
  ];

  const insBgn = await db.collection('bangunan').insertMany(starterBuildings);
  console.log('Inserted', insBgn.insertedCount, 'clean buildings.');

  // Insert matching peta_tile
  const starterTiles = starterBuildings.map((b, i) => ({
    _id: insBgn.insertedIds[i],
    bangunan_id: String(insBgn.insertedIds[i]),
    kind: b.tipe,
    gx: b.gx,
    gy: b.gy,
    w: b.w,
    h: b.h
  }));

  const insTiles = await db.collection('peta_tile').insertMany(starterTiles);
  console.log('Inserted', insTiles.insertedCount, 'clean peta_tiles.');

  // Re-link hunian for citizens to the new gubuks
  const gubukTiles = starterTiles.filter(t => t.kind === 'gubuk' || t.kind === 'gubuk_besar');
  const wargaList = await db.collection('warga').find({}).toArray();
  for (let i = 0; i < wargaList.length; i++) {
    const w = wargaList[i];
    const targetGubuk = gubukTiles[i % gubukTiles.length];
    await db.collection('warga').updateOne(
      { _id: w._id },
      {
        $set: {
          hunian: { id: String(targetGubuk._id), gx: targetGubuk.gx, gy: targetGubuk.gy },
          sehat: 100, // pulihkan kesehatan
          lapar: 20
        }
      }
    );
  }
  console.log('Re-linked hunian and restored health for', wargaList.length, 'citizens.');

  await client.close();
  console.log('Village layout reset completed!');
}

run().catch(console.error);
