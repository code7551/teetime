import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { AppUser } from "@/types";

export const dynamic = 'force-dynamic';

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
    const doc = await adminDb.collection("users").doc(uid).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user: AppUser = { uid: doc.id, ...doc.data() } as AppUser;
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

    const doc = await adminDb.collection("users").doc(uid).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update Firestore document
    await adminDb.collection("users").doc(uid).update(body);

    // Update Firebase Auth display name / email if provided (only for non-student roles)
    const userData = doc.data();
    if (userData?.role !== "student") {
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

    const updated = await adminDb.collection("users").doc(uid).get();
    return NextResponse.json({ uid, ...updated.data() });
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

    const doc = await adminDb.collection("users").doc(uid).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete from Firebase Auth (only for non-student roles) and Firestore
    const userData = doc.data();
    if (userData?.role !== "student") {
      try {
        await adminAuth.deleteUser(uid);
      } catch {
        // Student accounts don't have Firebase Auth records - ignore
      }
    }
    await adminDb.collection("users").doc(uid).delete();

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
