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
    const bookingId = searchParams.get("bookingId");
    const limitParam = searchParams.get("limit");

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
    if (bookingId) {
      query = query.where("bookingId", "==", bookingId);
    }
    query = query.orderBy("createdAt", "desc");

    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        query = query.limit(limit);
      }
    }

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

    // Check if a review already exists for this booking (upsert)
    const existingQuery = await adminDb
      .collection("reviews")
      .where("bookingId", "==", bookingId)
      .limit(1)
      .get();

    const reviewFields = {
      bookingId,
      studentId,
      proId,
      comment,
      updatedAt: new Date().toISOString(),
      ...(videoUrl !== undefined && { videoUrl: videoUrl || "" }),
      ...(studentName && { studentName }),
      ...(proName && { proName }),
      ...(date && { date }),
    };

    let reviewId: string;
    let isNew = false;

    if (!existingQuery.empty) {
      // Update existing review
      const existingDoc = existingQuery.docs[0];
      reviewId = existingDoc.id;
      await adminDb.collection("reviews").doc(reviewId).update(reviewFields);
    } else {
      // Create new review
      isNew = true;
      const reviewData: Omit<Review, "id"> = {
        ...reviewFields,
        createdAt: new Date().toISOString(),
      };
      const docRef = await adminDb.collection("reviews").add(reviewData);
      reviewId = docRef.id;
    }

    // Send LINE notification (only for new reviews)
    if (isNew) {
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
        console.error("Failed to send LINE notification:", lineError);
      }
    }

    const savedDoc = await adminDb.collection("reviews").doc(reviewId).get();
    return NextResponse.json(
      { id: reviewId, ...savedDoc.data() },
      { status: isNew ? 201 : 200 }
    );
  } catch (error) {
    console.error("Error creating/updating review:", error);
    return NextResponse.json(
      { error: "Failed to save review" },
      { status: 500 }
    );
  }
}
