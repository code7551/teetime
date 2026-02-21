import { NextRequest, NextResponse } from "next/server";
import {
  issueServiceNotificationToken,
  isServiceMessageConfigured,
} from "@/lib/line-service-message";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/**
 * POST /api/service-token
 * Body: { liffAccessToken: string }
 *
 * Issues a LINE Mini App service notification token from a user's LIFF access token.
 * The resulting token is stored server-side and used to send service messages later.
 *
 * This endpoint is called by the Mini App client after login.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isServiceMessageConfigured()) {
      return NextResponse.json(
        { error: "Service messages not configured" },
        { status: 501 }
      );
    }

    const { liffAccessToken, studentId } = await request.json();

    if (!liffAccessToken) {
      return NextResponse.json(
        { error: "liffAccessToken is required" },
        { status: 400 }
      );
    }

    const tokenData = await issueServiceNotificationToken(liffAccessToken);

    // Store the service notification token in MongoDB for later use
    if (studentId) {
      const db = await getDb();
      await db.collection("serviceTokens").updateOne(
        { studentId },
        {
          $set: {
            notificationToken: tokenData.notificationToken,
            expiresIn: tokenData.expiresIn,
            remainingCount: tokenData.remainingCount,
            sessionId: tokenData.sessionId,
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error issuing service notification token:", error);
    return NextResponse.json(
      { error: "Failed to issue service notification token" },
      { status: 500 }
    );
  }
}
