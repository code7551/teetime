import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/** Public endpoint — returns all pro coaches with safe profile fields only. */
export async function GET() {
  try {
    const db = await getDb();
    const docs = await db
      .collection("users")
      .find({ role: "pro" })
      .sort({ createdAt: -1 })
      .toArray();

    const pros = docs.map((doc) => ({
      uid: doc.uid,
      displayName: doc.displayName,
      nickname: doc.nickname || "",
      avatarUrl: doc.avatarUrl || "",
      proficiency: doc.proficiency || "",
      education: doc.education || "",
      athleticBackground: doc.athleticBackground || "",
    }));

    return NextResponse.json(pros);
  } catch (error) {
    console.error("Error fetching pros:", error);
    return NextResponse.json(
      { error: "Failed to fetch pros" },
      { status: 500 },
    );
  }
}
