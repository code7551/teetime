"use client";

import { useMiniApp } from "@/hooks/useMiniApp";
import { useEffect, useState } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import { MessageSquare, User, X } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" color="success" />
        <p className="text-sm text-gray-400">กำลังโหลด...</p>
      </div>
    );
  }

  if (!isLinked || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <MessageSquare size={28} className="text-gray-300" />
        </div>
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
    <div className="space-y-4 pb-6">
      <SubPageHeader
        title="รีวิวจากโปรโค้ช"
        icon={<MessageSquare size={20} className="text-purple-500" />}
      />

      {reviews.length === 0 ? (
        <Card className="shadow-sm border-0">
          <CardBody className="text-center py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={28} className="text-gray-200" />
            </div>
            <p className="text-gray-400 text-sm">ยังไม่มีรีวิว</p>
            <p className="text-gray-300 text-xs mt-1">
              รีวิวจากโปรโค้ชจะแสดงที่นี่
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="shadow-sm border-0">
              <CardBody className="p-4">
                {/* Review header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <User size={16} className="text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    {review.proName && (
                      <p className="text-sm font-semibold text-gray-700 truncate">
                        โปรโค้ช {review.proName}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {format(new Date(review.createdAt), "d MMMM yyyy", {
                        locale: th,
                      })}
                    </p>
                  </div>
                </div>

                {/* Comment */}
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {review.comment}
                  </p>
                </div>

                {/* Video */}
                {review.videoUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden">
                    <video
                      controls
                      className="w-full bg-black rounded-xl"
                      preload="metadata"
                    >
                      <source src={review.videoUrl} />
                      เบราว์เซอร์ไม่รองรับวิดีโอ
                    </video>
                  </div>
                )}

                {/* Images */}
                {review.imageUrls && review.imageUrls.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {review.imageUrls.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightboxImage(url)}
                        className="aspect-square rounded-xl overflow-hidden border border-gray-100 hover:border-emerald-300 transition-colors cursor-pointer"
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

      {/* Lightbox overlay */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
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
