import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";
import { sendLinkNotification } from "@/lib/line";

export const dynamic = "force-dynamic";

/**
 * POST /api/users/[uid]/line-accounts
 * Body: { lineUserId: string }
 * Directly link a LINE account to a student (owner action) and send a flex notification.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
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
        { status: 400 },
      );
    }

    const db = await getDb();
    const usersCol = db.collection("users");

    const studentDoc = await usersCol.findOne({ uid });
    if (!studentDoc || studentDoc.role !== "student") {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 },
      );
    }

    const existingIds: string[] =
      (studentDoc.lineUserIds as string[]) || [];
    if (existingIds.includes(lineUserId)) {
      return NextResponse.json({
        success: true,
        message: "บัญชี LINE นี้เชื่อมต่อกับนักเรียนแล้ว",
      });
    }

    const alreadyLinked = await usersCol.findOne({
      lineUserIds: lineUserId,
    });
    if (alreadyLinked) {
      return NextResponse.json(
        {
          error: `บัญชี LINE นี้เชื่อมต่อกับ ${alreadyLinked.displayName} อยู่แล้ว`,
        },
        { status: 409 },
      );
    }

    await usersCol.updateOne(
      { uid },
      { $addToSet: { lineUserIds: lineUserId } },
    );

    await db
      .collection("linePendingLinks")
      .deleteOne({ lineUserId });

    try {
      await sendLinkNotification(
        lineUserId,
        studentDoc.displayName as string,
      );
    } catch (err) {
      console.error("Failed to send link notification:", err);
    }

    return NextResponse.json({
      success: true,
      message: "เชื่อมต่อบัญชี LINE สำเร็จ",
    });
  } catch (error) {
    console.error("Error linking LINE account:", error);
    return NextResponse.json(
      { error: "Failed to link LINE account" },
      { status: 500 },
    );
  }
}

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

    const studentDoc = await usersCol.findOne({ uid });
    if (!studentDoc) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    await usersCol.updateOne(
      { uid },
      { $pull: { lineUserIds: lineUserId } }
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
