import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await adminAuth.verifyIdToken(token);

    const { uid } = await params;
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      );
    }

    // Verify the target user exists and is a pro
    const db = await getDb();
    const doc = await db.collection("users").findOne({ uid });

    if (!doc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (doc.role !== "pro") {
      return NextResponse.json(
        { error: "Can only reset password for pro accounts" },
        { status: 400 }
      );
    }

    // Update password in Firebase Auth
    await adminAuth.updateUser(uid, { password: newPassword });

    return NextResponse.json({ message: "รีเซ็ตรหัสผ่านสำเร็จ" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
