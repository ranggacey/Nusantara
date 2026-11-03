// Koneksi MongoDB Atlas — SERVER ONLY. File ini tidak pernah diimpor
// dari komponen client. Kredensial hanya dibaca dari env server
// (MONGODB_URI), tidak pernah ditulis ke kode, repo, atau log.
import { MongoClient, Db, Document } from "mongodb";

const uri = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : "";
if (!uri) {
  console.warn("[negara-emas] MONGODB_URI belum di-set (server env).");
}

declare global {
  var __neMongo: MongoClient | undefined;
}

let client: MongoClient | undefined = global.__neMongo;

export function getDb(): Db {
  const envUri = (process.env.MONGODB_URI ?? "").trim();
  if (!envUri) {
    throw new Error("MONGODB_URI belum dikonfigurasi di server.");
  }
  if (!client) {
    client = new MongoClient(envUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    });
    global.__neMongo = client;
  }
  return client.db("negaraemas");
}

export async function getCollection<T extends Document = Document>(name: string) {
  const db = getDb();
  return db.collection<T>(name);
}

// INDEKS UNIK POSISI PLACEMENT (2026-11-03, anti-duplikat):
// satu posisi = satu bangunan. Dijalankan best-effort dari
// getDuniaDoc (sekali per proses server): bila masih ada dokumen
// ganda lama di peta_tile, pembuatan indeks GAGAL dan hanya dicatat
// (permainan tetap jalan dengan penjaga level kode); setelah data
// ganda dibersihkan, proses server berikutnya membuat indeksnya dan
// segala race tulis posisi sama menjadi mustahil di level database.
let indexPlacementDicoba = false;

export async function pastikanIndexPlacement(): Promise<boolean> {
  if (indexPlacementDicoba) return false;
  indexPlacementDicoba = true;
  try {
    const col = await getCollection("peta_tile");
    await col.createIndex({ gx: 1, gy: 1 }, { unique: true, name: "uniq_posisi" });
    return true;
  } catch (err) {
    console.warn(
      "[negara-emas] Indeks uniq_posisi peta_tile belum bisa dibuat (mungkin masih ada dokumen ganda lama):",
      (err as Error)?.message ?? err
    );
    return false;
  }
}
