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
    await adminAuth.verifyIdToken(token);

    const { id } = await params;
    const body = await request.json();

    const db = await getDb();
    const coursesCol = db.collection("courses");

    const courseDoc = await coursesCol.findOne({ _id: new ObjectId(id) });
    if (!courseDoc) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const { _id, ...updateData } = body;
    await coursesCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    const updated = await coursesCol.findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ id, ...updated, _id: undefined });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const coursesCol = db.collection("courses");

    const courseDoc = await coursesCol.findOne({ _id: new ObjectId(id) });
    if (!courseDoc) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await coursesCol.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
