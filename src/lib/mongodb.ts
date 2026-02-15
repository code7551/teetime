import { MongoClient, type Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  if (!client) {
    client = new MongoClient(MONGODB_URI!);
    await client.connect();
  }

  db = client.db();
  return db;
}
