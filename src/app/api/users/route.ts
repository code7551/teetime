import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { createActivationCode } from "@/lib/jwt";
import type { AppUser, UserRole } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as UserRole | null;
    const lineUserId = searchParams.get("lineUserId");

    // Allow unauthenticated access for lineUserId lookups (student LINE Mini App)
    if (!lineUserId) {
      const token = request.headers
        .get("Authorization")
        ?.replace("Bearer ", "");
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      await adminAuth.verifyIdToken(token);
    }

    // If lineUserId is provided, find student whose lineUserIds array contains it
    if (lineUserId) {
      const snapshot = await adminDb
        .collection("users")
        .where("lineUserIds", "array-contains", lineUserId)
        .limit(1)
        .get();
      const users = snapshot.docs.map(
        (doc) => ({ uid: doc.id, ...doc.data() }) as AppUser
      );
      return NextResponse.json(users);
    }

    let query: FirebaseFirestore.Query = adminDb.collection("users");
    if (role) {
      query = query.where("role", "==", role);
    }
    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();
    const users: AppUser[] = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    })) as AppUser[];

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers
      .get("Authorization")
      ?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await adminAuth.verifyIdToken(token);

    const body = await request.json();
    const {
      email,
      password,
      displayName,
      firstName,
      lastName,
      role,
      phone,
      proId,
      commissionRate,
      nickname,
      gender,
      birthdate,
      learningGoals,
      avatarUrl,
      courseId,
    } = body;

    if (!role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (role === "student") {
      // Students don't get Firebase Auth accounts
      // Create Firestore doc with auto-generated ID
      const computedDisplayName =
        displayName || [firstName, lastName].filter(Boolean).join(" ") || "นักเรียน";

      const studentData: Record<string, unknown> = {
        displayName: computedDisplayName,
        role: "student",
        phone: phone || "",
        createdAt: new Date().toISOString(),
        lineUserIds: [],
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(proId && { proId }),
        ...(nickname && { nickname }),
        ...(gender && { gender }),
        ...(birthdate && { birthdate }),
        ...(learningGoals && { learningGoals }),
        ...(avatarUrl && { avatarUrl }),
        ...(courseId && { courseId }),
      };

      const docRef = await adminDb.collection("users").add(studentData);
      const studentId = docRef.id;

      // Generate activation code JWT
      const activationCode = await createActivationCode(
        studentId,
        displayName
      );

      // Initialize student hours
      await adminDb.collection("studentHours").doc(studentId).set({
        studentId,
        remainingHours: 0,
        totalHoursPurchased: 0,
        totalHoursUsed: 0,
      });

      return NextResponse.json(
        {
          uid: studentId,
          ...studentData,
          activationCode,
        },
        { status: 201 }
      );
    }

    // For owner/pro: require email + password, create Firebase Auth user
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required for this role" },
        { status: 400 }
      );
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    const userData: Record<string, unknown> = {
      email,
      displayName,
      role,
      phone: phone || "",
      createdAt: new Date().toISOString(),
      ...(proId && { proId }),
      ...(commissionRate !== undefined && { commissionRate }),
    };

    await adminDb.collection("users").doc(userRecord.uid).set(userData);

    return NextResponse.json(
      { uid: userRecord.uid, ...userData },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
