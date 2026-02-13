import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = 'force-dynamic';

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

    const paymentRef = adminDb.collection("payments").doc(id);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    const paymentData = paymentDoc.data();

    // Update the payment
    const updateData = {
      ...body,
      reviewedBy: decodedToken.uid,
      reviewedAt: new Date().toISOString(),
    };
    await paymentRef.update(updateData);

    // If approving, update studentHours
    if (body.status === "approved" && paymentData) {
      const studentHoursRef = adminDb
        .collection("studentHours")
        .doc(paymentData.studentId);
      const studentHoursDoc = await studentHoursRef.get();

      if (studentHoursDoc.exists) {
        await studentHoursRef.update({
          remainingHours: FieldValue.increment(paymentData.hoursAdded),
          totalHoursPurchased: FieldValue.increment(paymentData.hoursAdded),
        });
      } else {
        // Create studentHours document if it doesn't exist
        await studentHoursRef.set({
          studentId: paymentData.studentId,
          remainingHours: paymentData.hoursAdded,
          totalHoursPurchased: paymentData.hoursAdded,
          totalHoursUsed: 0,
        });
      }
    }

    const updated = await paymentRef.get();
    return NextResponse.json({ id, ...updated.data() });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
