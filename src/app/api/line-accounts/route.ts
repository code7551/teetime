import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/** Ensure TTL index exists (1 day = 86400 seconds). Called once lazily. */
let ttlIndexEnsured = false;
async function ensureTTLIndex() {
  if (ttlIndexEnsured) return;
  const db = await getDb();
  await db
    .collection("lineAccesses")
    .createIndex({ accessedAt: 1 }, { expireAfterSeconds: 86400 });
  ttlIndexEnsured = true;
}

/**
 * GET /api/line-accounts
 * Returns all LINE mini app access logs from the last 24 hours.
 * Documents are auto-expired by MongoDB TTL index.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers
      .get("Authorization")
      ?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await adminAuth.verifyIdToken(token);

    const db = await getDb();
    const docs = await db
      .collection("lineAccesses")
      .find()
      .sort({ accessedAt: -1 })
      .toArray();

    const accesses = docs.map((doc) => ({
      id: doc._id.toString(),
      lineUserId: doc.lineUserId,
      displayName: doc.displayName || "",
      email: doc.email || null,
      accessedAt: doc.accessedAt,
      createdAt: doc.createdAt || doc.accessedAt,
    }));

    return NextResponse.json(accesses);
  } catch (error) {
    console.error("Error fetching LINE accesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch LINE accesses" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/line-accounts
 * Body: { lineUserId: string; displayName: string; email?: string }
 *
 * Logs a LINE mini app access. Each access is stored as a separate document
 * in the "lineAccesses" collection with a TTL of 1 day (auto-deleted by MongoDB).
 * This lets us track how many unique people interact with the app.
 */
export async function POST(request: NextRequest) {
  try {
    const { lineUserId, displayName, email } = await request.json();

    if (!lineUserId) {
      return NextResponse.json(
        { error: "lineUserId is required" },
        { status: 400 }
      );
    }

    await ensureTTLIndex();

    const db = await getDb();
    await db.collection("lineAccesses").updateOne(
      { lineUserId },
      {
        $set: {
          displayName: displayName || "",
          email: email || null,
          accessedAt: new Date(),
        },
        $setOnInsert: {
          lineUserId,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error logging LINE access:", error);
    return NextResponse.json(
      { error: "Failed to log LINE access" },
      { status: 500 }
    );
  }
}
