import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { createActivationCode } from "@/lib/jwt";

export const dynamic = "force-dynamic";

/**
 * POST /api/users/[uid]/activation-code
 * Regenerate activation code for a student.
 * Only accessible by owner/pro.
 */
export async function POST(
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

    const studentDoc = await adminDb.collection("users").doc(uid).get();
    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: "ไม่พบนักเรียน" },
        { status: 404 }
      );
    }

    const studentData = studentDoc.data();
    if (studentData?.role !== "student") {
      return NextResponse.json(
        { error: "ผู้ใช้นี้ไม่ใช่นักเรียน" },
        { status: 400 }
      );
    }

    const activationCode = await createActivationCode(
      uid,
      studentData?.displayName || ""
    );

    return NextResponse.json({ activationCode });
  } catch (error) {
    console.error("Error generating activation code:", error);
    return NextResponse.json(
      { error: "Failed to generate activation code" },
      { status: 500 }
    );
  }
}
