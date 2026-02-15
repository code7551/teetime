import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";
import type { Course } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Public endpoint - courses list is accessible without auth (for student LINE Mini App)
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get("includeHidden") === "true";

    const db = await getDb();
    const filter = includeHidden ? {} : { isActive: { $ne: false } };
    const docs = await db
      .collection("courses")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const courses: Course[] = docs.map((doc) => ({
      id: doc._id.toString(),
      ...doc,
      _id: undefined,
    })) as unknown as Course[];

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
    const { name, hours, price, description } = body;

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
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    const db = await getDb();
    const result = await db.collection("courses").insertOne(courseData);

    return NextResponse.json(
      { id: result.insertedId.toString(), ...courseData },
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
