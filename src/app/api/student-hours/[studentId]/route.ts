import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    const doc = await adminDb
      .collection("studentHours")
      .doc(studentId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({
        studentId,
        remainingHours: 0,
        totalHoursPurchased: 0,
        totalHoursUsed: 0,
      });
    }

    return NextResponse.json({ studentId, ...doc.data() });
  } catch (error) {
    console.error("Error fetching student hours:", error);
    return NextResponse.json(
      { error: "Failed to fetch student hours" },
      { status: 500 }
    );
  }
}
