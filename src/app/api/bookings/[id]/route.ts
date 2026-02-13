import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await adminAuth.verifyIdToken(token);

    const { id } = await params;
    const bookingRef = adminDb.collection("bookings").doc(id);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ id, ...bookingDoc.data() });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await adminAuth.verifyIdToken(token);

    const { id } = await params;
    const body = await request.json();

    const bookingRef = adminDb.collection("bookings").doc(id);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const bookingData = bookingDoc.data();

    // Update the booking
    await bookingRef.update(body);

    // If marking as completed, update studentHours
    if (body.status === "completed" && bookingData) {
      const studentHoursRef = adminDb
        .collection("studentHours")
        .doc(bookingData.studentId);
      const studentHoursDoc = await studentHoursRef.get();

      // Calculate hours from startTime and endTime
      const start = bookingData.startTime as string;
      const end = bookingData.endTime as string;
      const [startH, startM] = start.split(":").map(Number);
      const [endH, endM] = end.split(":").map(Number);
      const hoursUsed = endH - startH + (endM - startM) / 60;

      if (studentHoursDoc.exists) {
        await studentHoursRef.update({
          remainingHours: FieldValue.increment(-hoursUsed),
          totalHoursUsed: FieldValue.increment(hoursUsed),
        });
      } else {
        await studentHoursRef.set({
          studentId: bookingData.studentId,
          remainingHours: -hoursUsed,
          totalHoursPurchased: 0,
          totalHoursUsed: hoursUsed,
        });
      }
    }

    const updated = await bookingRef.get();
    return NextResponse.json({ id, ...updated.data() });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
