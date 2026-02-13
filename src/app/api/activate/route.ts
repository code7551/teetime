import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyActivationCode } from "@/lib/jwt";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

/**
 * POST /api/activate
 * Body: { code: string, lineUserId: string, lineDisplayName?: string }
 *
 * Validates the activation JWT and links the LINE userId to the student.
 * Supports multiple LINE accounts per student.
 */
export async function POST(request: NextRequest) {
  try {
    const { code, lineUserId, lineDisplayName } = await request.json();

    if (!code || !lineUserId) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสเปิดใช้งานและเข้าสู่ระบบ LINE" },
        { status: 400 }
      );
    }

    // Verify the JWT activation code
    let payload;
    try {
      payload = await verifyActivationCode(code);
    } catch {
      return NextResponse.json(
        { error: "รหัสเปิดใช้งานไม่ถูกต้องหรือหมดอายุ" },
        { status: 401 }
      );
    }

    const { studentId } = payload;

    // Check student exists
    const studentDoc = await adminDb.collection("users").doc(studentId).get();
    if (!studentDoc.exists) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลนักเรียน" },
        { status: 404 }
      );
    }

    const studentData = studentDoc.data();
    if (studentData?.role !== "student") {
      return NextResponse.json(
        { error: "รหัสนี้ไม่ใช่ของนักเรียน" },
        { status: 400 }
      );
    }

    // Check if this LINE account is already linked to this student
    const existingIds: string[] = studentData?.lineUserIds || [];
    if (existingIds.includes(lineUserId)) {
      return NextResponse.json({
        success: true,
        message: "บัญชี LINE นี้เชื่อมต่อกับนักเรียนแล้ว",
        student: { uid: studentId, ...studentData },
      });
    }

    // Add the LINE userId to the student's lineUserIds array
    await adminDb
      .collection("users")
      .doc(studentId)
      .update({
        lineUserIds: FieldValue.arrayUnion(lineUserId),
      });

    const updatedDoc = await adminDb
      .collection("users")
      .doc(studentId)
      .get();

    return NextResponse.json({
      success: true,
      message: "เชื่อมต่อบัญชี LINE สำเร็จ!",
      student: { uid: studentId, ...updatedDoc.data() },
    });
  } catch (error) {
    console.error("Error activating student:", error);
    return NextResponse.json(
      { error: "ไม่สามารถเปิดใช้งานได้ กรุณาลองอีกครั้ง" },
      { status: 500 }
    );
  }
}
