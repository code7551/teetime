import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(token);

    const { id } = await params;
    const body = await request.json();

    const db = await getDb();
    const paymentsCol = db.collection("payments");

    const paymentDoc = await paymentsCol.findOne({ _id: new ObjectId(id) });
    if (!paymentDoc) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Update the payment
    const { _id, ...updateFields } = body;
    const updateData = {
      ...updateFields,
      reviewedBy: decodedToken.uid,
      reviewedAt: new Date().toISOString(),
    };
    await paymentsCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // If approving, update studentHours and write audit log
    if (body.status === "approved") {
      const studentId = paymentDoc.studentId as string;
      const hoursAdded = paymentDoc.hoursAdded as number;

      await db.collection("studentHours").updateOne(
        { studentId },
        {
          $inc: {
            remainingHours: hoursAdded,
            totalHoursPurchased: hoursAdded,
          },
          $setOnInsert: {
            studentId,
            totalHoursUsed: 0,
          },
        },
        { upsert: true }
      );

      // Read back updated hours for audit log
      const updatedHours = await db
        .collection("studentHours")
        .findOne({ studentId });
      const remainingHoursAfter = (updatedHours?.remainingHours as number) ?? 0;

      // Look up student name
      const studentDoc = await db
        .collection("users")
        .findOne({ uid: studentId });
      const studentName = (studentDoc?.displayName as string) || "";

      await db.collection("auditLogs").insertOne({
        action: "hours_added",
        studentId,
        studentName,
        hours: hoursAdded,
        remainingHoursAfter,
        referenceType: "payment",
        referenceId: id,
        performedBy: decodedToken.uid,
        note: "อนุมัติชำระเงิน",
        createdAt: new Date().toISOString(),
      });
    }

    const updated = await paymentsCol.findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ id, ...updated, _id: undefined });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
