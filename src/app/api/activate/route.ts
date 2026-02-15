import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { verifyActivationCode } from "@/lib/jwt";

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
    const { code, lineUserId } = await request.json();

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
    const db = await getDb();
    const usersCol = db.collection("users");

    // Check student exists
    const studentDoc = await usersCol.findOne({
      _id: studentId as unknown as ObjectId,
    });
    if (!studentDoc) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลนักเรียน" },
        { status: 404 }
      );
    }

    if (studentDoc.role !== "student") {
      return NextResponse.json(
        { error: "รหัสนี้ไม่ใช่ของนักเรียน" },
        { status: 400 }
      );
    }

    // Check if this LINE account is already linked to this student
    const existingIds: string[] = (studentDoc.lineUserIds as string[]) || [];
    if (existingIds.includes(lineUserId)) {
      return NextResponse.json({
        success: true,
        message: "บัญชี LINE นี้เชื่อมต่อกับนักเรียนแล้ว",
        student: { uid: studentId, ...studentDoc, _id: undefined },
      });
    }

    // Add the LINE userId to the student's lineUserIds array
    await usersCol.updateOne(
      { _id: studentId as unknown as ObjectId },
      { $addToSet: { lineUserIds: lineUserId } }
    );

    const updatedDoc = await usersCol.findOne({
      _id: studentId as unknown as ObjectId,
    });

    return NextResponse.json({
      success: true,
      message: "เชื่อมต่อบัญชี LINE สำเร็จ!",
      student: { uid: studentId, ...updatedDoc, _id: undefined },
    });
  } catch (error) {
    console.error("Error activating student:", error);
    return NextResponse.json(
      { error: "ไม่สามารถเปิดใช้งานได้ กรุณาลองอีกครั้ง" },
      { status: 500 }
    );
  }
}
