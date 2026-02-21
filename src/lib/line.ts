import { messagingApi } from "@line/bot-sdk";

const { MessagingApiClient } = messagingApi;

let client: messagingApi.MessagingApiClient | null = null;

export function getLineClient(): messagingApi.MessagingApiClient {
  if (!client) {
    client = new MessagingApiClient({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
    });
  }
  return client;
}

export async function getLineProfile(
  userId: string,
): Promise<{ displayName: string; pictureUrl?: string } | null> {
  try {
    const c = getLineClient();
    const profile = await c.getProfile(userId);
    return {
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
    };
  } catch {
    return null;
  }
}

export async function sendLineMessage(
  userId: string,
  messages: messagingApi.Message[],
): Promise<void> {
  const c = getLineClient();
  await c.pushMessage({
    to: userId,
    messages,
  });
}

/**
 * Send review notification to multiple LINE accounts linked to a student.
 */
export async function sendReviewNotificationToAll(
  lineUserIds: string[],
  proName: string,
  comment: string,
  date: string,
): Promise<void> {
  await Promise.allSettled(
    lineUserIds.map((id) => sendReviewNotification(id, proName, comment, date)),
  );
}

export async function sendReviewNotification(
  lineUserId: string,
  proName: string,
  comment: string,
  date: string,
): Promise<void> {
  await sendLineMessage(lineUserId, [
    {
      type: "flex",
      altText: `โปร ${proName} ได้เพิ่มรีวิวหลังเรียน`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "⛳ รีวิวหลังเรียน",
              weight: "bold",
              size: "lg",
              color: "#1DB446",
            },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `โปร: ${proName}`,
              size: "md",
              weight: "bold",
            },
            {
              type: "text",
              text: `วันที่: ${date}`,
              size: "sm",
              color: "#888888",
              margin: "sm",
            },
            {
              type: "separator",
              margin: "lg",
            },
            {
              type: "text",
              text: comment,
              size: "sm",
              wrap: true,
              margin: "lg",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "Teetime Golf Center",
              size: "xs",
              color: "#aaaaaa",
              align: "center",
            },
          ],
        },
      },
    },
  ]);
}

export async function sendLinkNotification(
  lineUserId: string,
  studentName: string,
): Promise<void> {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
  const liffUrl = `https://liff.line.me/${liffId}`;

  await sendLineMessage(lineUserId, [
    {
      type: "flex",
      altText: `${studentName} เชื่อมต่อ Member Area สำเร็จ`,
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#1DB446",
          paddingAll: "20px",
          contents: [
            {
              type: "text",
              text: "✅ เชื่อมต่อสำเร็จ",
              weight: "bold",
              size: "lg",
              color: "#FFFFFF",
            },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: studentName,
              weight: "bold",
              size: "xl",
              align: "center",
            },
            {
              type: "text",
              text: "ได้เชื่อมต่อกับ Member Area เรียบร้อยแล้ว",
              size: "sm",
              color: "#888888",
              align: "center",
              wrap: true,
              margin: "sm",
            },
            {
              type: "separator",
              margin: "lg",
            },
            {
              type: "text",
              text: "คุณสามารถดูตารางเรียน ชั่วโมงคงเหลือ และรีวิวหลังเรียนได้ที่ Member Area",
              size: "xs",
              color: "#aaaaaa",
              wrap: true,
              margin: "lg",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#1DB446",
              action: {
                type: "uri",
                label: "เข้าสู่ Member Area",
                uri: liffUrl,
              },
            },
            {
              type: "text",
              text: "Teetime Golf Center",
              size: "xs",
              color: "#aaaaaa",
              align: "center",
              margin: "md",
            },
          ],
        },
      },
    },
  ]);
}
