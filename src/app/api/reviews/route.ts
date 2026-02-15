import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";
import { sendReviewNotificationToAll } from "@/lib/line";
import type { Review } from "@/types";

export const dynamic = "force-dynamic";

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

    const db = await getDb();
    const filter: Record<string, unknown> = {};
    if (studentId) filter.studentId = studentId;
    if (proId) filter.proId = proId;
    if (bookingId) filter.bookingId = bookingId;

    let cursor = db
      .collection("reviews")
      .find(filter)
      .sort({ createdAt: -1 });

    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        cursor = cursor.limit(limit);
      }
    }

    const docs = await cursor.toArray();
    const reviews: Review[] = docs.map((doc) => ({
      id: doc._id.toString(),
      ...doc,
      _id: undefined,
    })) as unknown as Review[];

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

    const db = await getDb();
    const reviewsCol = db.collection("reviews");

    // Check if a review already exists for this booking (upsert)
    const existingReview = await reviewsCol.findOne({ bookingId });

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

    if (existingReview) {
      // Update existing review
      reviewId = existingReview._id.toString();
      await reviewsCol.updateOne(
        { _id: existingReview._id },
        { $set: reviewFields }
      );
    } else {
      // Create new review
      isNew = true;
      const reviewData = {
        ...reviewFields,
        createdAt: new Date().toISOString(),
      };
      const result = await reviewsCol.insertOne(reviewData);
      reviewId = result.insertedId.toString();
    }

    // Send LINE notification (only for new reviews)
    if (isNew) {
      try {
        const studentDoc = await db
          .collection("users")
          .findOne({ _id: studentId as unknown as ObjectId });
        const lineUserIds: string[] = (studentDoc?.lineUserIds as string[]) || [];

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

    const savedDoc = await reviewsCol.findOne({
      _id: existingReview?._id ?? new ObjectId(reviewId),
    });
    return NextResponse.json(
      { id: reviewId, ...savedDoc, _id: undefined },
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
