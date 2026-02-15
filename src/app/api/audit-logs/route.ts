import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getDb } from "@/lib/mongodb";
import type { AuditLog } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers
      .get("Authorization")
      ?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await adminAuth.verifyIdToken(token);

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const proId = searchParams.get("proId");
    const action = searchParams.get("action");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const db = await getDb();
    const filter: Record<string, unknown> = {};

    if (studentId) filter.studentId = studentId;
    if (proId) filter.proId = proId;
    if (action) filter.action = action;

    if (startDate || endDate) {
      filter.createdAt = {
        ...(startDate && { $gte: startDate }),
        ...(endDate && { $lte: endDate + "T23:59:59.999Z" }),
      };
    }

    const docs = await db
      .collection("auditLogs")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const logs: AuditLog[] = docs.map((doc) => ({
      id: doc._id.toString(),
      ...doc,
      _id: undefined,
    })) as unknown as AuditLog[];

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
