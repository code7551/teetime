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
	try {
		const c = getLineClient();
		await c.pushMessage({
			to: userId,
			messages,
		});
	} catch (err) {
		console.error(`[LINE] pushMessage failed for userId=${userId}:`, err);
		throw err;
	}
}

export interface ReviewNotificationPayload {
	proName: string;
	studentName: string;
	comment: string;
	date: string;
	startTime?: string;
	endTime?: string;
	hasVideo: boolean;
	hasImages: boolean;
	imageCount: number;
	isUpdate: boolean;
}

/**
 * Send review notification to multiple LINE accounts linked to a student.
 */
export async function sendReviewNotificationToAll(
	lineUserIds: string[],
	payload: ReviewNotificationPayload,
): Promise<void> {
	await Promise.allSettled(
		lineUserIds.map((id) => sendReviewNotification(id, payload)),
	);
}

export async function sendReviewNotification(
	lineUserId: string,
	payload: ReviewNotificationPayload,
): Promise<void> {
	const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
	const reviewsUrl = `https://liff.line.me/${liffId}`;

	const {
		proName,
		studentName,
		comment,
		date,
		startTime,
		endTime,
		hasVideo,
		hasImages,
		imageCount,
		isUpdate,
	} = payload;

	const headerText = isUpdate ? "📝 รีวิวหลังเรียนอัปเดต" : "⛳ รีวิวหลังเรียน";

	const altText = isUpdate
		? `โปร ${proName} ได้แก้ไขรีวิวของ ${studentName}`
		: `โปร ${proName} ได้เพิ่มรีวิวของ ${studentName}`;

	const truncatedComment =
		comment.length > 200 ? comment.slice(0, 200) + "..." : comment;

	const timeText =
		startTime && endTime ? `${startTime} - ${endTime}` : undefined;

	const mediaTags: string[] = [];
	if (hasVideo) mediaTags.push("🎥 วิดีโอ");
	if (hasImages) mediaTags.push(`🖼️ ${imageCount} รูป`);

	const bodyContents: messagingApi.FlexComponent[] = [
		{
			type: "box",
			layout: "horizontal",
			contents: [
				{
					type: "text",
					text: "นักเรียน",
					size: "xs",
					color: "#aaaaaa",
					flex: 0,
				},
				{
					type: "text",
					text: studentName,
					size: "sm",
					weight: "bold",
					color: "#333333",
					align: "end",
				},
			],
		} as messagingApi.FlexBox,
		{
			type: "box",
			layout: "horizontal",
			margin: "sm",
			contents: [
				{
					type: "text",
					text: "โปร",
					size: "xs",
					color: "#aaaaaa",
					flex: 0,
				},
				{
					type: "text",
					text: proName,
					size: "sm",
					weight: "bold",
					color: "#333333",
					align: "end",
				},
			],
		} as messagingApi.FlexBox,
		{
			type: "box",
			layout: "horizontal",
			margin: "sm",
			contents: [
				{
					type: "text",
					text: "วันที่",
					size: "xs",
					color: "#aaaaaa",
					flex: 0,
				},
				{
					type: "text",
					text: timeText ? `${date}  ${timeText}` : date,
					size: "sm",
					color: "#555555",
					align: "end",
				},
			],
		} as messagingApi.FlexBox,
		{ type: "separator", margin: "lg" } as messagingApi.FlexSeparator,
		{
			type: "text",
			text: truncatedComment,
			size: "sm",
			wrap: true,
			margin: "lg",
			color: "#444444",
		} as messagingApi.FlexText,
	];

	if (mediaTags.length > 0) {
		bodyContents.push({
			type: "box",
			layout: "horizontal",
			margin: "lg",
			spacing: "md",
			contents: mediaTags.map(
				(tag) =>
					({
						type: "text",
						text: tag,
						size: "xs",
						color: "#1DB446",
						weight: "bold",
					}) as messagingApi.FlexText,
			),
		} as messagingApi.FlexBox);
	}

	await sendLineMessage(lineUserId, [
		{
			type: "flex",
			altText,
			contents: {
				type: "bubble",
				header: {
					type: "box",
					layout: "vertical",
					backgroundColor: "#1DB446",
					paddingAll: "16px",
					contents: [
						{
							type: "text",
							text: headerText,
							weight: "bold",
							size: "lg",
							color: "#FFFFFF",
						},
					],
				},
				body: {
					type: "box",
					layout: "vertical",
					spacing: "sm",
					contents: bodyContents,
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
								label: "ดูรีวิวทั้งหมด",
								uri: reviewsUrl,
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
