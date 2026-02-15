import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";
import type { Booking } from "@/types";

export const dynamic = "force-dynamic";

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

    const db = await getDb();
    const filter: Record<string, unknown> = {};
    if (proId) filter.proId = proId;
    if (studentId) filter.studentId = studentId;
    if (date) filter.date = date;
    if (status) filter.status = status;

    // Date range filters
    if (startDate || endDate) {
      filter.date = {
        ...(startDate && { $gte: startDate }),
        ...(endDate && { $lte: endDate }),
      };
      // If exact date was also set, date range takes precedence
    }

    // If date range filter is used, order by date; otherwise by createdAt
    const sort: Record<string, 1 | -1> =
      startDate || endDate ? { date: 1 } : { createdAt: -1 };

    const docs = await db
      .collection("bookings")
      .find(filter)
      .sort(sort)
      .toArray();

    const bookings: Booking[] = docs.map((doc) => ({
      id: doc._id.toString(),
      ...doc,
      _id: undefined,
    })) as unknown as Booking[];

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 },
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
        { status: 400 },
      );
    }

    // Auto-calculate endTime as startTime + 1 hour
    const [startH, startM] = startTime.split(":").map(Number);
    const endH = startH + 1;
    const endTime = `${String(endH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`;

    const db = await getDb();

    // Check student's remaining hours
    const studentHoursDoc = await db
      .collection("studentHours")
      .findOne({ _id: studentId as unknown as ObjectId });
    const remainingHours = studentHoursDoc?.remainingHours ?? 0;

    if (remainingHours < 1) {
      return NextResponse.json(
        {
          error: `นักเรียนมีชั่วโมงคงเหลือไม่เพียงพอ (เหลือ ${remainingHours} ชม.)`,
        },
        { status: 400 },
      );
    }

    // Look up student and pro names
    const [studentDoc, proDoc] = await Promise.all([
      db.collection("users").findOne({ _id: studentId as unknown as ObjectId }),
      db.collection("users").findOne({ _id: proId as unknown as ObjectId }),
    ]);

    const studentName = studentDoc?.displayName || "นักเรียน";
    const proName = proDoc?.displayName || "โปร";

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

    const result = await db.collection("bookings").insertOne(bookingData);

    return NextResponse.json(
      { id: result.insertedId.toString(), ...bookingData },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}
