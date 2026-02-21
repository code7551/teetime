import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";
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

    const db = await getDb();
    const usersCol = db.collection("users");

    // If lineUserId is provided, find student whose lineUserIds array contains it
    if (lineUserId) {
      const docs = await usersCol
        .find({ lineUserIds: lineUserId })
        .limit(1)
        .toArray();
      const users = docs.map(
        (doc) =>
          ({
            uid: doc._id as unknown as string,
            ...doc,
            _id: undefined,
          }) as unknown as AppUser,
      );
      return NextResponse.json(users);
    }

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;

    const docs = await usersCol.find(filter).sort({ createdAt: -1 }).toArray();

    const users: AppUser[] = docs.map((doc) => ({
      uid: doc._id as unknown as string,
      ...doc,
      _id: undefined,
    })) as unknown as AppUser[];

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
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
        { status: 400 },
      );
    }

    const db = await getDb();
    const usersCol = db.collection("users");

    if (role === "student") {
      // Students don't get Firebase Auth accounts
      const computedDisplayName =
        displayName ||
        [firstName, lastName].filter(Boolean).join(" ") ||
        "นักเรียน";

      const studentId = new ObjectId().toHexString();

      const studentData: Record<string, unknown> = {
        _id: studentId,
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

      await usersCol.insertOne(studentData);

      // Generate activation code JWT
      const activationCode = await createActivationCode(
        studentId,
        computedDisplayName,
      );

      // Initialize student hours
      await db.collection("studentHours").updateOne(
        { _id: studentId as unknown as ObjectId },
        {
          $set: {
            studentId,
            remainingHours: 0,
            totalHoursPurchased: 0,
            totalHoursUsed: 0,
          },
        },
        { upsert: true },
      );

      const { _id, ...rest } = studentData;
      return NextResponse.json(
        {
          uid: studentId,
          ...rest,
          activationCode,
        },
        { status: 201 },
      );
    }

    // For owner/pro: require email + password, create Firebase Auth user
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required for this role" },
        { status: 400 },
      );
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    const userData: Record<string, unknown> = {
      _id: userRecord.uid,
      email,
      displayName,
      role,
      phone: phone || "",
      createdAt: new Date().toISOString(),
      ...(proId && { proId }),
      ...(commissionRate !== undefined && { commissionRate }),
    };

    await usersCol.insertOne(userData);

    const { _id, ...rest } = userData;
    return NextResponse.json({ uid: userRecord.uid, ...rest }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
