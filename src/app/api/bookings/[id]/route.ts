import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

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
    const db = await getDb();
    const doc = await db
      .collection("bookings")
      .findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Resolve user names dynamically
    const userIds = [doc.studentId, doc.proId].filter(Boolean) as string[];
    const userDocs = await db
      .collection("users")
      .find({ _id: { $in: userIds.map((uid) => uid as unknown as ObjectId) } })
      .project({ displayName: 1, nickname: 1 })
      .toArray();
    const userNameMap = new Map(
      userDocs.map((u) => [
        u._id.toString(),
        (u.nickname as string) || (u.displayName as string) || "",
      ])
    );

    return NextResponse.json({
      id,
      ...doc,
      _id: undefined,
      studentName: userNameMap.get(doc.studentId as string) || undefined,
      proName: userNameMap.get(doc.proId as string) || undefined,
    });
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
    const decodedToken = await adminAuth.verifyIdToken(token);

    const { id } = await params;
    const body = await request.json();
    const db = await getDb();
    const bookingsCol = db.collection("bookings");

    const bookingDoc = await bookingsCol.findOne({ _id: new ObjectId(id) });

    if (!bookingDoc) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Remove _id from body to prevent conflicts
    const { _id, ...updateData } = body;

    // Update the booking
    await bookingsCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // If marking as completed, update studentHours
    if (body.status === "completed") {
      const studentId = bookingDoc.studentId as string;

      // Calculate hours from startTime and endTime
      const start = bookingDoc.startTime as string;
      const end = bookingDoc.endTime as string;
      const [startH, startM] = start.split(":").map(Number);
      const [endH, endM] = end.split(":").map(Number);
      const hoursUsed = endH - startH + (endM - startM) / 60;

      await db.collection("studentHours").updateOne(
        { _id: studentId as unknown as ObjectId },
        {
          $inc: {
            remainingHours: -hoursUsed,
            totalHoursUsed: hoursUsed,
          },
          $setOnInsert: {
            studentId,
            totalHoursPurchased: 0,
          },
        },
        { upsert: true }
      );

      // Read back updated hours for audit log
      const updatedHours = await db
        .collection("studentHours")
        .findOne({ _id: studentId as unknown as ObjectId });
      const remainingHoursAfter = (updatedHours?.remainingHours as number) ?? 0;

      const proId = (bookingDoc.proId as string) || "";

      // Look up names from users collection
      const [studentUserDoc, proUserDoc] = await Promise.all([
        db.collection("users").findOne({ _id: studentId as unknown as ObjectId }),
        proId
          ? db.collection("users").findOne({ _id: proId as unknown as ObjectId })
          : Promise.resolve(null),
      ]);
      const studentName = (studentUserDoc?.displayName as string) || "";
      const proName = (proUserDoc?.displayName as string) || "";

      await db.collection("auditLogs").insertOne({
        action: "hours_deducted",
        studentId,
        studentName,
        proId,
        proName,
        hours: -hoursUsed,
        remainingHoursAfter,
        referenceType: "booking",
        referenceId: id,
        performedBy: decodedToken.uid,
        note: "ยืนยันสอนเสร็จสิ้น",
        createdAt: new Date().toISOString(),
      });
    }

    const updated = await bookingsCol.findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ id, ...updated, _id: undefined });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
