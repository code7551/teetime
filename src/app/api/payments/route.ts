import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";
import type { Payment } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const studentId = searchParams.get("studentId");

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
    if (status) filter.status = status;
    if (studentId) filter.studentId = studentId;

    const docs = await db
      .collection("payments")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const payments: Payment[] = docs.map((doc) => ({
      id: doc._id.toString(),
      ...doc,
      _id: undefined,
    })) as unknown as Payment[];

    // Resolve studentName dynamically from users collection
    const studentIds = [...new Set(payments.map((p) => p.studentId).filter(Boolean))];
    if (studentIds.length > 0) {
      const userDocs = await db
        .collection("users")
        .find({ uid: { $in: studentIds } })
        .project({ uid: 1, displayName: 1, nickname: 1 })
        .toArray();
      const userMap = new Map(
        userDocs.map((u) => [u.uid, u.nickname || u.displayName || ""])
      );
      for (const payment of payments) {
        const resolved = userMap.get(payment.studentId);
        if (resolved) payment.studentName = resolved;
      }
    }

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Allow unauthenticated POST for student payment submissions via LINE Mini App
    const token = request.headers
      .get("Authorization")
      ?.replace("Bearer ", "");
    if (token) {
      await adminAuth.verifyIdToken(token);
    }

    const body = await request.json();
    const {
      studentId,
      courseId,
      amount,
      receiptImageUrl,
      hoursAdded,
      courseName,
    } = body;

    if (!studentId || !courseId || !amount || !receiptImageUrl || !hoursAdded) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const paymentData: Omit<Payment, "id"> = {
      studentId,
      courseId,
      amount,
      receiptImageUrl,
      hoursAdded,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...(courseName && { courseName }),
    };

    const db = await getDb();
    const result = await db.collection("payments").insertOne(paymentData);

    return NextResponse.json(
      { id: result.insertedId.toString(), ...paymentData },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
