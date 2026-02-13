import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function verifySignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET || "";
  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-line-signature") || "";

    // Verify LINE signature
    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    const body = JSON.parse(rawBody);
    const events = body.events || [];

    for (const event of events) {
      // Handle follow event -- log for reference
      if (event.type === "follow") {
        const lineUserId = event.source?.userId;

        if (lineUserId) {
          // Check if this LINE account is already linked to a student
          const usersSnapshot = await adminDb
            .collection("users")
            .where("lineUserIds", "array-contains", lineUserId)
            .get();

          if (usersSnapshot.empty) {
            // Store the follow event for tracking
            await adminDb.collection("linePendingLinks").add({
              lineUserId,
              eventType: "follow",
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Error processing LINE webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
