import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/users/[uid]/line-accounts
 * Body: { lineUserId: string }
 * Revoke a specific LINE account from a student.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const token = request.headers
      .get("Authorization")
      ?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await adminAuth.verifyIdToken(token);

    const { uid } = await params;
    const { lineUserId } = await request.json();

    if (!lineUserId) {
      return NextResponse.json(
        { error: "lineUserId is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCol = db.collection("users");

    const studentDoc = await usersCol.findOne({ _id: uid as unknown as import("mongodb").ObjectId });
    if (!studentDoc) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Remove the LINE userId from the array and clean up display name
    await usersCol.updateOne(
      { _id: uid as unknown as import("mongodb").ObjectId },
      {
        $pull: { lineUserIds: lineUserId },
        $unset: { [`lineDisplayNames.${lineUserId}`]: "" },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking LINE account:", error);
    return NextResponse.json(
      { error: "Failed to revoke LINE account" },
      { status: 500 }
    );
  }
}
