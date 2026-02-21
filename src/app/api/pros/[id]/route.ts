import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/** Public endpoint — returns only safe pro profile fields (no email/password). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const doc = await db.collection("users").findOne({ uid: id, role: "pro" });

    if (!doc) {
      return NextResponse.json({ error: "Pro not found" }, { status: 404 });
    }

    return NextResponse.json({
      uid: doc.uid,
      displayName: doc.displayName,
      nickname: doc.nickname || "",
      phone: doc.phone || "",
      avatarUrl: doc.avatarUrl || "",
      proficiency: doc.proficiency || "",
      education: doc.education || "",
      athleticBackground: doc.athleticBackground || "",
    });
  } catch (error) {
    console.error("Error fetching pro:", error);
    return NextResponse.json(
      { error: "Failed to fetch pro" },
      { status: 500 },
    );
  }
}
