import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/**
 * GET /api/pending-line-accounts
 * Returns all LINE accounts not yet linked to any student.
 * Combines data from both lineAccesses (miniapp visitors) and linePendingLinks (OA followers).
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

    const allLinkedIds = await db
      .collection("users")
      .distinct("lineUserIds");

    const linkedSet = new Set<string>(allLinkedIds.filter(Boolean));

    const [accessDocs, pendingDocs] = await Promise.all([
      db.collection("lineAccesses").find().sort({ accessedAt: -1 }).toArray(),
      db.collection("linePendingLinks").find().toArray(),
    ]);

    const pendingMap = new Map(
      pendingDocs.map((d) => [d.lineUserId, d]),
    );

    const seen = new Set<string>();
    const results: {
      lineUserId: string;
      displayName: string;
      pictureUrl: string;
      email: string | null;
      source: string;
    }[] = [];

    for (const doc of accessDocs) {
      if (linkedSet.has(doc.lineUserId) || seen.has(doc.lineUserId)) continue;
      seen.add(doc.lineUserId);
      const pending = pendingMap.get(doc.lineUserId);
      results.push({
        lineUserId: doc.lineUserId,
        displayName: doc.displayName || pending?.displayName || "",
        pictureUrl: pending?.pictureUrl || "",
        email: doc.email || null,
        source: pending ? "friend" : "visitor",
      });
    }

    for (const doc of pendingDocs) {
      if (linkedSet.has(doc.lineUserId) || seen.has(doc.lineUserId)) continue;
      seen.add(doc.lineUserId);
      results.push({
        lineUserId: doc.lineUserId,
        displayName: doc.displayName || "",
        pictureUrl: doc.pictureUrl || "",
        email: null,
        source: "friend",
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching pending LINE accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending LINE accounts" },
      { status: 500 },
    );
  }
}
