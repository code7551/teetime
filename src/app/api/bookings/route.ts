import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { Booking } from "@/types";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const proId = searchParams.get("proId");
    const studentId = searchParams.get("studentId");
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Allow unauthenticated access for student-specific queries (LINE Mini App)
    if (!studentId) {
      const token = request.headers
        .get("Authorization")
        ?.replace("Bearer ", "");
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      await adminAuth.verifyIdToken(token);
    }

    let query: FirebaseFirestore.Query = adminDb.collection("bookings");
    if (proId) {
      query = query.where("proId", "==", proId);
    }
    if (studentId) {
      query = query.where("studentId", "==", studentId);
    }
    if (date) {
      query = query.where("date", "==", date);
    }
    if (startDate) {
      query = query.where("date", ">=", startDate);
    }
    if (endDate) {
      query = query.where("date", "<=", endDate);
    }
    if (status) {
      query = query.where("status", "==", status);
    }
    // If date range filter is used, order by date; otherwise by createdAt
    if (startDate || endDate) {
      query = query.orderBy("date", "asc");
    } else {
      query = query.orderBy("createdAt", "desc");
    }

    const snapshot = await query.get();
    const bookings: Booking[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[];

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await adminAuth.verifyIdToken(token);

    const body = await request.json();
    const { studentId, proId, date, startTime } = body;

    if (!studentId || !proId || !date || !startTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Auto-calculate endTime as startTime + 1 hour
    const [startH, startM] = startTime.split(":").map(Number);
    const endH = startH + 1;
    const endTime = `${String(endH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`;

    // Check student's remaining hours
    const studentHoursDoc = await adminDb
      .collection("studentHours")
      .doc(studentId)
      .get();
    const remainingHours = studentHoursDoc.exists
      ? (studentHoursDoc.data()?.remainingHours ?? 0)
      : 0;

    if (remainingHours < 1) {
      return NextResponse.json(
        {
          error: `นักเรียนมีชั่วโมงคงเหลือไม่เพียงพอ (เหลือ ${remainingHours} ชม.)`,
        },
        { status: 400 }
      );
    }

    // Look up student and pro names from Firestore
    const [studentDoc, proDoc] = await Promise.all([
      adminDb.collection("users").doc(studentId).get(),
      adminDb.collection("users").doc(proId).get(),
    ]);

    const studentName = studentDoc.exists
      ? studentDoc.data()?.displayName || "นักเรียน"
      : "นักเรียน";
    const proName = proDoc.exists
      ? proDoc.data()?.displayName || "โปร"
      : "โปร";

    const bookingData: Omit<Booking, "id"> = {
      studentId,
      proId,
      date,
      startTime,
      endTime,
      status: "scheduled",
      createdAt: new Date().toISOString(),
      studentName,
      proName,
    };

    const docRef = await adminDb.collection("bookings").add(bookingData);

    return NextResponse.json(
      { id: docRef.id, ...bookingData },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
