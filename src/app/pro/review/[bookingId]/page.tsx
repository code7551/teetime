"use client";

import { use } from "react";
import ReviewForm from "@/components/shared/ReviewForm";

export default function ProReviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  return <ReviewForm bookingId={bookingId} backUrl="/pro/timetable" />;
}
