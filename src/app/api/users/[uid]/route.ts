import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";
import type { AppUser } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await adminAuth.verifyIdToken(token);

    const { uid } = await params;
    const db = await getDb();
    const doc = await db.collection("users").findOne({ _id: uid as unknown as import("mongodb").ObjectId });

    if (!doc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user: AppUser = { uid: doc._id as string, ...doc, _id: undefined } as unknown as AppUser;
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await adminAuth.verifyIdToken(token);

    const { uid } = await params;
    const body = await request.json();
    const db = await getDb();
    const usersCol = db.collection("users");

    const doc = await usersCol.findOne({ _id: uid as unknown as import("mongodb").ObjectId });
    if (!doc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove _id and uid from body to prevent overwriting
    const { _id, uid: _uid, ...updateData } = body;

    await usersCol.updateOne(
      { _id: uid as unknown as import("mongodb").ObjectId },
      { $set: updateData }
    );

    // Update Firebase Auth display name / email if provided (only for non-student roles)
    if (doc.role !== "student") {
      const authUpdate: Record<string, string> = {};
      if (body.displayName) authUpdate.displayName = body.displayName;
      if (body.email) authUpdate.email = body.email;
      if (Object.keys(authUpdate).length > 0) {
        try {
          await adminAuth.updateUser(uid, authUpdate);
        } catch {
          // Student accounts don't have Firebase Auth records - ignore
        }
      }
    }

    const updated = await usersCol.findOne({ _id: uid as unknown as import("mongodb").ObjectId });
    return NextResponse.json({ uid, ...updated, _id: undefined });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await adminAuth.verifyIdToken(token);

    const { uid } = await params;
    const db = await getDb();
    const usersCol = db.collection("users");

    const doc = await usersCol.findOne({ _id: uid as unknown as import("mongodb").ObjectId });
    if (!doc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete from Firebase Auth (only for non-student roles) and MongoDB
    if (doc.role !== "student") {
      try {
        await adminAuth.deleteUser(uid);
      } catch {
        // Student accounts don't have Firebase Auth records - ignore
      }
    }
    await usersCol.deleteOne({ _id: uid as unknown as import("mongodb").ObjectId });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
