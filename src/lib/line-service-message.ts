/**
 * LINE Mini App Service Message API
 *
 * Service messages are a LINE Mini App-specific way to send notifications.
 * They require a "service notification token" obtained from a user's LIFF access token.
 *
 * Flow:
 * 1. Client (Mini App) gets liff.getAccessToken() and sends it to the server
 * 2. Server exchanges it for a service notification token via POST /message/v3/notifier/token
 * 3. Server sends service messages via POST /message/v3/notifier/send
 *
 * Note: Service messages use templates registered in the LINE Developers Console.
 * Only available for verified LINE Mini Apps.
 *
 * @see https://developers.line.biz/en/reference/line-mini-app/#service-messages
 */

interface ServiceNotificationTokenResponse {
  notificationToken: string;
  expiresIn: number;
  remainingCount: number;
  sessionId: string;
}

interface SendServiceMessageResponse {
  notificationToken: string;
  expiresIn: number;
  remainingCount: number;
  sessionId: string;
}

/**
 * Get a stateless channel access token for the LINE Mini App channel.
 * Stateless tokens are recommended for LINE Mini App.
 */
async function getStatelessChannelAccessToken(): Promise<string> {
  const channelId = process.env.LINE_MINI_APP_CHANNEL_ID;
  const channelSecret = process.env.LINE_MINI_APP_CHANNEL_SECRET;

  if (!channelId || !channelSecret) {
    throw new Error(
      "LINE_MINI_APP_CHANNEL_ID and LINE_MINI_APP_CHANNEL_SECRET are required"
    );
  }

  const res = await fetch(
    "https://api.line.me/oauth2/v3/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: channelId,
        client_secret: channelSecret,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get channel access token: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Issue a service notification token from a user's LIFF access token.
 * Each LIFF access token can only be used ONCE to issue a notification token.
 *
 * @param liffAccessToken - The user's LIFF access token from liff.getAccessToken()
 * @returns Service notification token data
 */
export async function issueServiceNotificationToken(
  liffAccessToken: string
): Promise<ServiceNotificationTokenResponse> {
  const channelAccessToken = await getStatelessChannelAccessToken();

  const res = await fetch(
    "https://api.line.me/message/v3/notifier/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({ liffAccessToken }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to issue service notification token: ${err}`);
  }

  return res.json();
}

/**
 * Send a service message to a user using their service notification token.
 *
 * @param notificationToken - Service notification token
 * @param templateName - Template name with BCP 47 language tag suffix (e.g., "review_notification_th")
 * @param params - Template variable key-value pairs
 * @returns Updated token data (renewed token for successive messages)
 */
export async function sendServiceMessage(
  notificationToken: string,
  templateName: string,
  params: Record<string, string>
): Promise<SendServiceMessageResponse> {
  const channelAccessToken = await getStatelessChannelAccessToken();

  const res = await fetch(
    "https://api.line.me/message/v3/notifier/send?target=service",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        templateName,
        params,
        notificationToken,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to send service message: ${err}`);
  }

  return res.json();
}

/**
 * Check if LINE Mini App Service Messages are configured.
 */
export function isServiceMessageConfigured(): boolean {
  return !!(
    process.env.LINE_MINI_APP_CHANNEL_ID &&
    process.env.LINE_MINI_APP_CHANNEL_SECRET
  );
}
