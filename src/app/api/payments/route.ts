import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { Payment } from "@/types";

export const dynamic = 'force-dynamic';

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

    let query: FirebaseFirestore.Query = adminDb.collection("payments");
    if (status) {
      query = query.where("status", "==", status);
    }
    if (studentId) {
      query = query.where("studentId", "==", studentId);
    }
    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();
    const payments: Payment[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Payment[];

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
      studentName,
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
      ...(studentName && { studentName }),
      ...(courseName && { courseName }),
    };

    const docRef = await adminDb.collection("payments").add(paymentData);

    return NextResponse.json(
      { id: docRef.id, ...paymentData },
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
