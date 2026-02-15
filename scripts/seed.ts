/**
 * Seed script for a fresh MongoDB + Firebase Auth setup.
 *
 * What it does:
 *   1. Connects to MongoDB Atlas
 *   2. Drops all existing collections (fresh start)
 *   3. Creates indexes for query performance
 *   4. Creates / resets the Firebase Auth owner account
 *   5. Seeds the owner user document in MongoDB
 *
 * Run:  npx tsx scripts/seed.ts
 */

import "dotenv/config";
import { MongoClient } from "mongodb";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// ── Config ───────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = "teetime";

const OWNER_EMAIL = "code7551@gmail.com";
const OWNER_PASSWORD = "123456789";
const OWNER_DISPLAY_NAME = "Owner";

// ── Firebase Admin init ──────────────────────────────────────────────
function getAdminAuth() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "",
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "",
        privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(
          /\\n/g,
          "\n"
        ),
      }),
    });
  }
  return getAuth();
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🔌 Connecting to MongoDB Atlas...");
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`   Connected to database: ${DB_NAME}\n`);

  // ── Step 1: Drop existing collections ──────────────────────────────
  console.log("🗑  Dropping existing collections...");
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.dropCollection(col.name);
    console.log(`   Dropped: ${col.name}`);
  }
  if (collections.length === 0) console.log("   (none found)");
  console.log();

  // ── Step 2: Create indexes ─────────────────────────────────────────
  console.log("📇 Creating indexes...");

  // users
  await db.collection("users").createIndex({ role: 1 });
  await db.collection("users").createIndex({ lineUserIds: 1 });
  await db.collection("users").createIndex({ role: 1, createdAt: -1 });
  console.log("   users: role, lineUserIds, role+createdAt");

  // bookings
  await db.collection("bookings").createIndex({ proId: 1, date: 1 });
  await db.collection("bookings").createIndex({ studentId: 1, status: 1 });
  await db.collection("bookings").createIndex({ date: 1 });
  await db.collection("bookings").createIndex({ createdAt: -1 });
  console.log("   bookings: proId+date, studentId+status, date, createdAt");

  // payments
  await db.collection("payments").createIndex({ status: 1, createdAt: -1 });
  await db.collection("payments").createIndex({ studentId: 1 });
  console.log("   payments: status+createdAt, studentId");

  // reviews
  await db.collection("reviews").createIndex({ studentId: 1 });
  await db.collection("reviews").createIndex({ proId: 1 });
  await db.collection("reviews").createIndex({ bookingId: 1 });
  await db.collection("reviews").createIndex({ createdAt: -1 });
  console.log("   reviews: studentId, proId, bookingId, createdAt");

  // courses
  await db.collection("courses").createIndex({ createdAt: -1 });
  console.log("   courses: createdAt");

  console.log();

  // ── Step 3: Create Firebase Auth owner ─────────────────────────────
  console.log("🔑 Setting up Firebase Auth owner account...");
  const adminAuth = getAdminAuth();

  let uid: string;
  try {
    // Check if user already exists
    const existing = await adminAuth.getUserByEmail(OWNER_EMAIL);
    uid = existing.uid;
    // Reset password
    await adminAuth.updateUser(uid, {
      password: OWNER_PASSWORD,
      displayName: OWNER_DISPLAY_NAME,
    });
    console.log(`   Found existing account (${uid}), password reset.`);
  } catch {
    // User doesn't exist — create
    const newUser = await adminAuth.createUser({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
      displayName: OWNER_DISPLAY_NAME,
    });
    uid = newUser.uid;
    console.log(`   Created new account (${uid}).`);
  }
  console.log(`   Email:    ${OWNER_EMAIL}`);
  console.log(`   Password: ${OWNER_PASSWORD}`);
  console.log();

  // ── Step 4: Seed owner document in MongoDB ─────────────────────────
  console.log("👤 Seeding owner user document...");
  await db.collection("users").insertOne({
    _id: uid as any,
    email: OWNER_EMAIL,
    displayName: OWNER_DISPLAY_NAME,
    role: "owner",
    phone: "",
    createdAt: new Date().toISOString(),
  });
  console.log(`   Inserted user { _id: "${uid}", role: "owner" }`);
  console.log();

  // ── Done ───────────────────────────────────────────────────────────
  await client.close();
  console.log("✅ Seed complete! You can now run: npm run dev");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
