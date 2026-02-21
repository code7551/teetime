"use client";

import { useMiniApp } from "@/hooks/useMiniApp";
import { useEffect, useState } from "react";
import {
  Spinner,
  Avatar,
  Button,
  Input,
  Chip,
} from "@heroui/react";
import {
  ScanLine,
  CheckCircle,
  KeyRound,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { StudentHours, Course, Booking, Review } from "@/types";

const PER_PAGE = 20;

const STATUS: Record<
  string,
  { label: string; color: "success" | "warning" | "danger" | "default" }
> = {
  completed: { label: "เสร็จสิ้น", color: "success" },
  scheduled: { label: "นัดหมาย", color: "warning" },
  cancelled: { label: "ยกเลิก", color: "danger" },
};

export default function MiniAppHomePage() {
  const {
    profile,
    student,
    loading: miniAppLoading,
    error: miniAppError,
    isLinked,
    activate,
  } = useMiniApp();

  const [hours, setHours] = useState<StudentHours | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState("");
  const [activateSuccess, setActivateSuccess] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    if (!student) return;

    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [hoursRes, coursesRes, bookingsRes, reviewsRes] =
          await Promise.all([
            fetch(`/api/student-hours/${student.uid}`),
            student.courseId
              ? fetch("/api/courses?includeHidden=true")
              : Promise.resolve(null),
            fetch(`/api/bookings?studentId=${student.uid}`),
            fetch(`/api/reviews?studentId=${student.uid}`),
          ]);

        if (hoursRes.ok) setHours(await hoursRes.json());
        if (coursesRes?.ok && student.courseId) {
          const allCourses: Course[] = await coursesRes.json();
          setCourse(allCourses.find((c) => c.id === student.courseId) || null);
        }
        if (bookingsRes.ok) setBookings(await bookingsRes.json());
        if (reviewsRes.ok) setReviews(await reviewsRes.json());
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [student]);

  const handleActivate = async (activationCode: string) => {
    if (!activationCode.trim()) return;
    setActivating(true);
    setActivateError("");
    setActivateSuccess(false);

    const result = await activate(activationCode);
    if (result.success) {
      setActivateSuccess(true);
      setCode("");
    } else {
      setActivateError(result.error || "เกิดข้อผิดพลาด");
    }
    setActivating(false);
  };

  const handleScan = async () => {
    setActivateError("");
    try {
      const liffModule = (await import("@line/liff")).default;
      if (liffModule.isInClient()) {
        const result = await liffModule.scanCodeV2();
        if (result.value) {
          await handleActivate(result.value);
        }
      } else {
        setShowManualInput(true);
      }
    } catch (err) {
      console.error("Scan error:", err);
      setShowManualInput(true);
    }
  };

  const goToPage = (p: number) => {
    setPage(p);
    setExpandedId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Loading ---
  if (miniAppLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" color="success" />
        <p className="text-sm text-gray-400">กำลังโหลด...</p>
      </div>
    );
  }

  // --- Error ---
  if (miniAppError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-500 text-sm text-center">{miniAppError}</p>
      </div>
    );
  }

  // --- Not linked: Activation screen ---
  if (!isLinked || !student) {
    return (
      <div className="space-y-6 pb-8 pt-2">
        <div className="flex items-center gap-3.5">
          <Avatar
            src={profile?.pictureUrl}
            name={profile?.displayName}
            size="lg"
            className="shrink-0"
          />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-gray-900 truncate">
              {profile?.displayName}
            </p>
            <p className="text-sm text-gray-400">ยินดีต้อนรับ</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="text-center pt-4">
            <h2 className="text-lg font-semibold text-gray-900">
              เปิดใช้งานบัญชี
            </h2>
            <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
              สแกน QR Code ที่ได้รับจากสถาบัน
              <br />
              เพื่อเชื่อมต่อบัญชี LINE ของคุณ
            </p>
          </div>

          {activateSuccess && (
            <div className="bg-emerald-50 rounded-xl p-3.5 flex items-center gap-2.5">
              <CheckCircle size={18} className="text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700">
                เชื่อมต่อสำเร็จ! กำลังโหลดข้อมูล...
              </p>
            </div>
          )}

          {activateError && (
            <div className="bg-red-50 rounded-xl p-3.5">
              <p className="text-sm text-red-600">{activateError}</p>
            </div>
          )}

          <Button
            color="success"
            className="w-full text-white font-medium h-12 text-base"
            size="lg"
            isLoading={activating}
            onPress={handleScan}
            startContent={!activating && <ScanLine size={20} />}
            radius="lg"
          >
            สแกน QR Code
          </Button>

          {!showManualInput && (
            <button
              type="button"
              className="text-xs text-gray-400 underline underline-offset-2 w-full text-center py-1"
              onClick={() => setShowManualInput(true)}
            >
              กรอกรหัสด้วยตนเอง
            </button>
          )}

          {showManualInput && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                หรือวางรหัสเปิดใช้งานด้านล่าง
              </p>
              <Input
                label="รหัสเปิดใช้งาน"
                placeholder="วางรหัสที่ได้รับจากสถาบัน"
                value={code}
                onValueChange={setCode}
                variant="bordered"
                size="lg"
                radius="lg"
                classNames={{
                  input: "text-xs",
                  inputWrapper: "border-gray-200",
                }}
              />
              <Button
                color="success"
                variant="flat"
                className="w-full font-medium h-11"
                size="md"
                isLoading={activating}
                isDisabled={!code.trim()}
                onPress={() => handleActivate(code)}
                startContent={!activating && <KeyRound size={16} />}
                radius="lg"
              >
                เปิดใช้งานด้วยรหัส
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Linked: Dashboard ---
  const remaining = hours?.remainingHours ?? 0;
  const reviewByBookingId = new Map(reviews.map((r) => [r.bookingId, r]));

  const sorted = [...bookings].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime),
  );

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const pageItems = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="pb-6 -mx-4 -mt-4">
      {/* Profile bar */}
      <div className="bg-white px-4 py-3.5 flex items-center gap-3">
        <Avatar
          src={student.avatarUrl || profile?.pictureUrl}
          name={student.displayName}
          size="md"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-gray-900 truncate leading-tight">
            {student.nickname || student.displayName}
          </p>
          {course && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {course.name}
            </p>
          )}
        </div>
        {!dataLoading && (
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold text-emerald-600 leading-none">
              {remaining}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">ชม. คงเหลือ</p>
          </div>
        )}
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          ประวัติการเรียน
        </p>
        {sorted.length > 0 && (
          <p className="text-xs text-gray-300">{sorted.length} รายการ</p>
        )}
      </div>

      {/* List */}
      {dataLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="md" color="success" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 px-4">
          <BookOpen size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">ยังไม่มีประวัติการเรียน</p>
          <p className="text-xs text-gray-300 mt-1">
            ข้อมูลจะแสดงเมื่อมีการจองเรียน
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white">
            {pageItems.map((booking, idx) => {
              const s = STATUS[booking.status] || {
                label: booking.status,
                color: "default" as const,
              };
              const review = reviewByBookingId.get(booking.id);
              const hasReview = !!review;
              const isExpanded = expandedId === booking.id;

              return (
                <div key={booking.id}>
                  {idx > 0 && <div className="h-px bg-gray-100 mx-4" />}

                  <button
                    type="button"
                    disabled={!hasReview}
                    onClick={() =>
                      hasReview &&
                      setExpandedId(isExpanded ? null : booking.id)
                    }
                    className={`w-full text-left px-4 py-3 ${hasReview ? "active:bg-gray-50 transition-colors" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-[13px] font-medium text-gray-800">
                            {format(new Date(booking.date), "d MMM yy", {
                              locale: th,
                            })}
                          </p>
                          <span className="text-[11px] text-gray-300">
                            {format(new Date(booking.date), "EEEE", {
                              locale: th,
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {booking.startTime} – {booking.endTime}
                          {booking.proName && (
                            <span className="text-gray-300">
                              {" "}
                              · {booking.proName}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Chip size="sm" color={s.color} variant="flat">
                          {s.label}
                        </Chip>
                        {hasReview && (
                          <ChevronDown
                            size={14}
                            className={`text-gray-300 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded review */}
                  {hasReview && isExpanded && review && (
                    <div className="bg-gray-50 px-4 py-3 space-y-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-purple-600">
                          รีวิวจากโปร
                          {review.proName ? ` ${review.proName}` : ""}
                        </p>
                        <p className="text-[11px] text-gray-300">
                          {format(
                            new Date(review.createdAt),
                            "d MMM yyyy",
                            { locale: th },
                          )}
                        </p>
                      </div>
                      <p className="text-[13px] text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {review.comment}
                      </p>

                      {review.videoUrl && (
                        <div className="rounded-lg overflow-hidden">
                          <video
                            controls
                            className="w-full bg-black rounded-lg"
                            preload="metadata"
                          >
                            <source src={review.videoUrl} />
                          </video>
                        </div>
                      )}

                      {review.imageUrls && review.imageUrls.length > 0 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {review.imageUrls.map((url, i) => (
                            <button
                              key={url}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLightboxImage(url);
                              }}
                              className="w-16 h-16 rounded-lg overflow-hidden shrink-0"
                            >
                              <img
                                src={url}
                                alt={`รูปภาพ ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-0.5 pt-4 px-4">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => goToPage(page - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 disabled:opacity-20 active:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-colors ${
                    p === page
                      ? "bg-emerald-500 text-white"
                      : "text-gray-400 active:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => goToPage(page + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 disabled:opacity-20 active:bg-gray-100 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute inset-0 w-full h-full cursor-default"
            aria-label="ปิดภาพขยาย"
          />
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white/60 hover:text-white rounded-full p-2 transition-colors z-10"
          >
            <X size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImage}
            alt="ภาพขยาย"
            className="max-w-full max-h-[90vh] object-contain rounded-lg relative z-10 pointer-events-none"
          />
        </div>
      )}
    </div>
  );
}
