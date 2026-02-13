import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { uploadToR2 } from "@/lib/r2";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Allow unauthenticated uploads for student LINE Mini App (receipt images)
    const token = request.headers
      .get("Authorization")
      ?.replace("Bearer ", "");
    if (token) {
      await adminAuth.verifyIdToken(token);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate unique key
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString("hex");
    const extension = file.name.split(".").pop() || "bin";
    const key = `${folder}/${timestamp}-${randomStr}.${extension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const url = await uploadToR2(key, buffer, file.type);

    return NextResponse.json({ url, key }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
