import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/line-accounts
 * Returns all students that have linked LINE accounts,
 * with each LINE userId as a separate entry for easy listing.
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

    // Get all students
    const snapshot = await adminDb
      .collection("users")
      .where("role", "==", "student")
      .get();

    interface LineAccountEntry {
      lineUserId: string;
      studentId: string;
      studentName: string;
      studentNickname?: string;
      studentPhone: string;
      proId?: string;
      linkedCount: number;
    }

    const accounts: LineAccountEntry[] = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const lineUserIds: string[] = data.lineUserIds || [];

      lineUserIds.forEach((lineUserId) => {
        accounts.push({
          lineUserId,
          studentId: doc.id,
          studentName: data.displayName || "",
          studentNickname: data.nickname,
          studentPhone: data.phone || "",
          proId: data.proId,
          linkedCount: lineUserIds.length,
        });
      });
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching LINE accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch LINE accounts" },
      { status: 500 }
    );
  }
}
