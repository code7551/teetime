import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await adminAuth.verifyIdToken(token);

    const db = await getDb();

    // Run all count queries in parallel
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const [totalPros, totalStudents, pendingPayments, bookingsThisMonth] =
      await Promise.all([
        db.collection("users").countDocuments({ role: "pro" }),
        db.collection("users").countDocuments({ role: "student" }),
        db.collection("payments").countDocuments({ status: "pending" }),
        db.collection("bookings").countDocuments({
          date: { $gte: startOfMonth, $lte: endOfMonth },
        }),
      ]);

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
