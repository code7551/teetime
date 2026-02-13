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

export async function sendLineMessage(
  userId: string,
  messages: messagingApi.Message[]
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
  date: string
): Promise<void> {
  await Promise.allSettled(
    lineUserIds.map((id) =>
      sendReviewNotification(id, proName, comment, date)
    )
  );
}

export async function sendReviewNotification(
  lineUserId: string,
  proName: string,
  comment: string,
  date: string
): Promise<void> {
  await sendLineMessage(lineUserId, [
    {
      type: "flex",
      altText: `โปรโค้ช ${proName} ได้เพิ่มรีวิวหลังเรียน`,
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
              text: `โปรโค้ช: ${proName}`,
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
