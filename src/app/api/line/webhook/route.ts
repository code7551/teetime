import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getLineProfile } from "@/lib/line";
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

    const db = await getDb();

    for (const event of events) {
      if (event.type === "follow") {
        const lineUserId = event.source?.userId;

        if (lineUserId) {
          const existingUser = await db
            .collection("users")
            .findOne({ lineUserIds: lineUserId });

          if (!existingUser) {
            const profile = await getLineProfile(lineUserId);

            await db.collection("linePendingLinks").updateOne(
              { lineUserId },
              {
                $set: {
                  displayName: profile?.displayName || "",
                  pictureUrl: profile?.pictureUrl || "",
                  eventType: "follow",
                  timestamp: new Date().toISOString(),
                },
                $setOnInsert: { lineUserId },
              },
              { upsert: true },
            );
          }
        }
      }

      if (event.type === "unfollow") {
        const lineUserId = event.source?.userId;
        if (lineUserId) {
          await db
            .collection("linePendingLinks")
            .deleteOne({ lineUserId });
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
