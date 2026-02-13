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
    if (status) {
      query = query.where("status", "==", status);
    }
    query = query.orderBy("createdAt", "desc");

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
    const {
      studentId,
      proId,
      date,
      startTime,
      endTime,
      studentName,
      proName,
    } = body;

    if (!studentId || !proId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const bookingData: Omit<Booking, "id"> = {
      studentId,
      proId,
      date,
      startTime,
      endTime,
      status: "scheduled",
      createdAt: new Date().toISOString(),
      ...(studentName && { studentName }),
      ...(proName && { proName }),
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
