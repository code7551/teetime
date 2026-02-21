"use client";

import { useMiniApp } from "@/hooks/useMiniApp";
import { useEffect, useState } from "react";
import { Card, CardBody, Spinner, Chip } from "@heroui/react";
import { ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import SubPageHeader from "@/components/student/SubPageHeader";
import type { Booking, Review } from "@/types";

export default function HistoryPage() {
  const { student, loading: miniAppLoading, isLinked } = useMiniApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (!student) return;

    const fetchData = async () => {
      try {
        const [bookingsRes, reviewsRes] = await Promise.all([
          fetch(`/api/bookings?studentId=${student.uid}`),
          fetch(`/api/reviews?studentId=${student.uid}`),
        ]);
        if (bookingsRes.ok) {
          setBookings(await bookingsRes.json());
        }
        if (reviewsRes.ok) {
          setReviews(await reviewsRes.json());
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [student]);

  if (miniAppLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  if (!isLinked || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-gray-400 text-sm">
          กรุณา
          <Link href="/miniapp" className="text-emerald-500 font-medium mx-1">
            เชื่อมต่อบัญชี
          </Link>
          ก่อน
        </p>
      </div>
    );
  }

  const reviewByBookingId = new Map(reviews.map((r) => [r.bookingId, r]));

  const statusMap: Record<
    string,
    {
      label: string;
      color: "success" | "warning" | "danger" | "default";
      border: string;
    }
  > = {
    completed: { label: "เสร็จสิ้น", color: "success", border: "border-l-emerald-400" },
    scheduled: { label: "นัดหมาย", color: "warning", border: "border-l-amber-400" },
    cancelled: { label: "ยกเลิก", color: "danger", border: "border-l-red-300" },
  };

  const sorted = [...bookings].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)
  );

  return (
    <div className="pb-6">
      <SubPageHeader title="ประวัติการเรียน" />

      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm text-gray-400">ยังไม่มีประวัติการเรียน</p>
          <p className="text-xs text-gray-300 mt-1">
            ข้อมูลจะแสดงเมื่อมีการจองเรียน
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((booking) => {
            const status = statusMap[booking.status] || {
              label: booking.status,
              color: "default" as const,
              border: "border-l-gray-300",
            };
            const review = reviewByBookingId.get(booking.id);
            const hasReview = !!review;
            const isExpanded = expandedId === booking.id;

            return (
              <Card
                key={booking.id}
                className={`shadow-sm border-0 border-l-3 ${status.border}`}
              >
                <CardBody className="p-0">
                  <button
                    type="button"
                    disabled={!hasReview}
                    onClick={() =>
                      hasReview &&
                      setExpandedId(isExpanded ? null : booking.id)
                    }
                    className={`w-full text-left px-4 py-3 ${hasReview ? "active:bg-gray-50 transition-colors" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {format(new Date(booking.date), "d MMMM yyyy", {
                            locale: th,
                          })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {booking.startTime} – {booking.endTime}
                          {booking.proName && ` · โปร ${booking.proName}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Chip
                          size="sm"
                          color={status.color}
                          variant="flat"
                        >
                          {status.label}
                        </Chip>
                        {hasReview && (
                          <ChevronDown
                            size={16}
                            className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded review */}
                  {hasReview && isExpanded && review && (
                    <div className="border-t border-gray-100 bg-purple-50/40 px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-purple-600">
                          รีวิวจากโปร{review.proName ? ` ${review.proName}` : ""}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {format(new Date(review.createdAt), "d MMM yyyy", {
                            locale: th,
                          })}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {review.comment}
                      </p>

                      {review.videoUrl && (
                        <div className="rounded-xl overflow-hidden">
                          <video
                            controls
                            className="w-full bg-black rounded-xl"
                            preload="metadata"
                          >
                            <source src={review.videoUrl} />
                          </video>
                        </div>
                      )}

                      {review.imageUrls && review.imageUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-1.5">
                          {review.imageUrls.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxImage(url);
                              }}
                              className="aspect-square rounded-lg overflow-hidden"
                            >
                              <img
                                src={url}
                                alt={`รูปภาพ ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white/60 hover:text-white rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
          <img
            src={lightboxImage}
            alt="ภาพขยาย"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
