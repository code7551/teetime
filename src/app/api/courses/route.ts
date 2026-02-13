import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { Course } from "@/types";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Public endpoint - courses list is accessible without auth (for student LINE Mini App)
    const snapshot = await adminDb
      .collection("courses")
      .orderBy("createdAt", "desc")
      .get();

    const courses: Course[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
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
    const { name, hours, price, description, isActive } = body;

    if (!name || hours === undefined || price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const courseData: Omit<Course, "id"> = {
      name,
      hours,
      price,
      description: description || "",
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("courses").add(courseData);

    return NextResponse.json(
      { id: docRef.id, ...courseData },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
