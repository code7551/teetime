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
    const { paidStatus } = body;

    if (!paidStatus || !["paid", "unpaid"].includes(paidStatus)) {
      return NextResponse.json(
        { error: "Invalid paidStatus" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const bookingsCol = db.collection("bookings");

    const bookingDoc = await bookingsCol.findOne({ _id: new ObjectId(id) });
    if (!bookingDoc) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      paidStatus,
    };

    if (paidStatus === "paid") {
      updateData.paidAt = new Date().toISOString();
      updateData.paidBy = decodedToken.uid;
    } else {
      updateData.paidAt = null;
      updateData.paidBy = null;
    }

    await bookingsCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    const updated = await bookingsCol.findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ id, ...updated, _id: undefined });
  } catch (error) {
    console.error("Error updating paid status:", error);
    return NextResponse.json(
      { error: "Failed to update paid status" },
      { status: 500 }
    );
  }
}
