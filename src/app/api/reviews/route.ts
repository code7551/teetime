import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendReviewNotificationToAll } from "@/lib/line";
import type { Review } from "@/types";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const proId = searchParams.get("proId");

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

    let query: FirebaseFirestore.Query = adminDb.collection("reviews");
    if (studentId) {
      query = query.where("studentId", "==", studentId);
    }
    if (proId) {
      query = query.where("proId", "==", proId);
    }
    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();
    const reviews: Review[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Review[];

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
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
    const {
      bookingId,
      studentId,
      proId,
      comment,
      videoUrl,
      studentName,
      proName,
      date,
    } = body;

    if (!bookingId || !studentId || !proId || !comment) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const reviewData: Omit<Review, "id"> = {
      bookingId,
      studentId,
      proId,
      comment,
      createdAt: new Date().toISOString(),
      ...(videoUrl && { videoUrl }),
      ...(studentName && { studentName }),
      ...(proName && { proName }),
      ...(date && { date }),
    };

    const docRef = await adminDb.collection("reviews").add(reviewData);

    // Send LINE notification to all linked LINE accounts
    try {
      const studentDoc = await adminDb
        .collection("users")
        .doc(studentId)
        .get();
      const studentData = studentDoc.data();
      const lineUserIds: string[] = studentData?.lineUserIds || [];

      if (lineUserIds.length > 0) {
        await sendReviewNotificationToAll(
          lineUserIds,
          proName || "โปร",
          comment,
          date || new Date().toISOString().split("T")[0]
        );
      }
    } catch (lineError) {
      // Log but don't fail the request if LINE notification fails
      console.error("Failed to send LINE notification:", lineError);
    }

    return NextResponse.json(
      { id: docRef.id, ...reviewData },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
