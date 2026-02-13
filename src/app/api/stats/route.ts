import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await adminAuth.verifyIdToken(token);

    // Get total pros
    const prosSnapshot = await adminDb
      .collection("users")
      .where("role", "==", "pro")
      .get();
    const totalPros = prosSnapshot.size;

    // Get total students
    const studentsSnapshot = await adminDb
      .collection("users")
      .where("role", "==", "student")
      .get();
    const totalStudents = studentsSnapshot.size;

    // Get pending payments count
    const pendingPaymentsSnapshot = await adminDb
      .collection("payments")
      .where("status", "==", "pending")
      .get();
    const pendingPayments = pendingPaymentsSnapshot.size;

    // Get bookings this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const bookingsThisMonthSnapshot = await adminDb
      .collection("bookings")
      .where("date", ">=", startOfMonth)
      .where("date", "<=", endOfMonth)
      .get();
    const bookingsThisMonth = bookingsThisMonthSnapshot.size;

    return NextResponse.json({
      totalPros,
      totalStudents,
      pendingPayments,
      bookingsThisMonth,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
