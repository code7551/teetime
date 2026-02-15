import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const db = await getDb();

    const doc = await db
      .collection("studentHours")
      .findOne({ _id: studentId as unknown as ObjectId });

    if (!doc) {
      return NextResponse.json({
        studentId,
        remainingHours: 0,
        totalHoursPurchased: 0,
        totalHoursUsed: 0,
      });
    }

    return NextResponse.json({ studentId, ...doc, _id: undefined });
  } catch (error) {
    console.error("Error fetching student hours:", error);
    return NextResponse.json(
      { error: "Failed to fetch student hours" },
      { status: 500 }
    );
  }
}
