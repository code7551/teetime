"use client";

import { useMiniApp } from "@/hooks/useMiniApp";
import { useEffect, useState } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import { X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import SubPageHeader from "@/components/student/SubPageHeader";
import type { Review } from "@/types";

export default function ReviewsPage() {
  const { student, loading: miniAppLoading, isLinked } = useMiniApp();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (!student) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/reviews?studentId=${student.uid}`);
        if (res.ok) {
          setReviews(await res.json());
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

  return (
    <div className="pb-6">
      <SubPageHeader title="รีวิวจากโปรโค้ช" />

      {reviews.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm text-gray-400">ยังไม่มีรีวิว</p>
          <p className="text-xs text-gray-300 mt-1">
            รีวิวจากโปรโค้ชจะแสดงที่นี่
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="shadow-sm border-0 border-l-3 border-l-purple-300">
              <CardBody className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  {review.proName && (
                    <p className="text-sm font-semibold text-purple-700">
                      {review.proName}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {format(new Date(review.createdAt), "d MMM yyyy", {
                      locale: th,
                    })}
                  </p>
                </div>

                {/* Comment */}
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {review.comment}
                </p>

                {/* Video */}
                {review.videoUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden">
                    <video
                      controls
                      className="w-full bg-black rounded-xl"
                      preload="metadata"
                    >
                      <source src={review.videoUrl} />
                    </video>
                  </div>
                )}

                {/* Images */}
                {review.imageUrls && review.imageUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {review.imageUrls.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightboxImage(url)}
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
              </CardBody>
            </Card>
          ))}
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
