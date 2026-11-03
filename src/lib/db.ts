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
