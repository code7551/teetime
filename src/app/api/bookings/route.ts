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

    // Resolve user names dynamically
    const userIds = new Set<string>();
    docs.forEach((doc) => {
      if (doc.proId) userIds.add(doc.proId as string);
      if (doc.studentId) userIds.add(doc.studentId as string);
    });

    const userNameMap = new Map<string, string>();
    if (userIds.size > 0) {
      const userDocs = await db
        .collection("users")
        .find({
          _id: {
            $in: [...userIds].map((uid) => uid as unknown as ObjectId),
          },
        })
        .project({ displayName: 1, nickname: 1 })
        .toArray();
      userDocs.forEach((u) => {
        const name = (u.nickname as string) || (u.displayName as string) || "";
        userNameMap.set(u._id.toString(), name);
      });
    }

    const bookings: Booking[] = docs.map((doc) => ({
      id: doc._id.toString(),
      ...doc,
      _id: undefined,
      studentName: userNameMap.get(doc.studentId as string) || undefined,
      proName: userNameMap.get(doc.proId as string) || undefined,
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

    // Check if the pro already has an active booking that overlaps this time slot
    const conflictingBooking = await db.collection("bookings").findOne({
      proId,
      date,
      status: { $in: ["scheduled", "completed"] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        {
          error: `โปรโค้ชมีนัดหมายแล้วในเวลา ${conflictingBooking.startTime} - ${conflictingBooking.endTime}`,
        },
        { status: 400 },
      );
    }

    // Look up student to get course info for hourly rate
    const studentDoc = await db
      .collection("users")
      .findOne({ _id: studentId as unknown as ObjectId });

    // Calculate and store hourly rate from student's course at booking time
    let hourlyRate = 0;
    const courseId = studentDoc?.courseId as string | undefined;
    if (courseId) {
      const courseDoc = await db
        .collection("courses")
        .findOne({ _id: new ObjectId(courseId) });
      if (courseDoc && (courseDoc.hours as number) > 0) {
        hourlyRate = (courseDoc.price as number) / (courseDoc.hours as number);
      }
    }

    const bookingData: Omit<Booking, "id"> = {
      studentId,
      proId,
      date,
      startTime,
      endTime,
      status: "scheduled",
      createdAt: new Date().toISOString(),
      hourlyRate,
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
