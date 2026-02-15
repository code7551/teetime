"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Input,
  Select,
  SelectItem,
  Button,
  Divider,
} from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import {
  FileEdit,
  CalendarDays,
  User,
  GraduationCap,
  Clock,
  Search,
  CheckCircle,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale/th";
import { useRouter } from "next/navigation";
import { getUserDisplayName } from "@/lib/utils";
import type { AppUser, Booking, Review } from "@/types";

// ─── Component ───────────────────────────────────────────────────────
interface ReviewsListViewProps {
  role: "owner" | "pro";
}

export default function ReviewsListView({ role }: ReviewsListViewProps) {
  const { user, firebaseUser } = useAuth();
  const router = useRouter();
  const isOwner = role === "owner";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [pros, setPros] = useState<AppUser[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProId, setFilterProId] = useState("");
  const [filterStudentId, setFilterStudentId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!firebaseUser || !user) return;
    try {
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Build reviews query
      const params = new URLSearchParams();
      if (isOwner) {
        if (filterProId) params.set("proId", filterProId);
      } else {
        // Pro always filters by own uid
        params.set("proId", user.uid);
      }
      if (filterStudentId) params.set("studentId", filterStudentId);

      const fetches: Promise<Response>[] = [
        fetch(`/api/reviews?${params.toString()}`, { headers }),
      ];

      if (isOwner) {
        fetches.push(
          fetch("/api/users?role=pro", { headers }),
          fetch("/api/users?role=student", { headers })
        );
      } else {
        // Pro: fetch completed bookings + students
        const bookingParams = new URLSearchParams();
        bookingParams.set("proId", user.uid);
        bookingParams.set("status", "completed");
        fetches.push(
          fetch(`/api/bookings?${bookingParams.toString()}`, { headers }),
          fetch("/api/users?role=student", { headers })
        );
      }

      const responses = await Promise.all(fetches);
      const [reviewsRes, ...extraResponses] = responses;

      if (reviewsRes.ok) setReviews(await reviewsRes.json());

      if (isOwner) {
        const [prosRes, studentsRes] = extraResponses;
        if (prosRes.ok) setPros(await prosRes.json());
        if (studentsRes.ok) setStudents(await studentsRes.json());
      } else {
        const [bookingsRes, studentsRes] = extraResponses;
        if (bookingsRes.ok) setCompletedBookings(await bookingsRes.json());
        if (studentsRes.ok) {
          const allStudents: AppUser[] = await studentsRes.json();
          setStudents(allStudents.filter((s) => s.proId === user.uid));
        }
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, user, filterProId, filterStudentId, isOwner]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const proMap = new Map(pros.map((p) => [p.uid, p]));
  const studentMap = new Map(students.map((s) => [s.uid, s]));

  // Filter by search text
  const filteredReviews = reviews.filter((r) => {
    if (!searchText) return true;
    const lower = searchText.toLowerCase();
    const proName = r.proName || getUserDisplayName(proMap.get(r.proId));
    const studentName =
      r.studentName || getUserDisplayName(studentMap.get(r.studentId));
    return (
      proName.toLowerCase().includes(lower) ||
      studentName.toLowerCase().includes(lower) ||
      r.comment.toLowerCase().includes(lower)
    );
  });

  // For pro: build a map of bookingId -> review, and split bookings into reviewed / needs-review
  const reviewByBookingId = new Map(reviews.map((r) => [r.bookingId, r]));

  // Completed bookings sorted by date desc
  const sortedCompletedBookings = [...completedBookings].sort(
    (a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)
  );

  // Apply student filter to completed bookings for pro
  const filteredCompletedBookings = sortedCompletedBookings.filter((b) => {
    if (filterStudentId && b.studentId !== filterStudentId) return false;
    if (!searchText) return true;
    const lower = searchText.toLowerCase();
    const student = studentMap.get(b.studentId);
    const name = getUserDisplayName(student);
    return name.toLowerCase().includes(lower);
  });

  const needsReviewBookings = filteredCompletedBookings.filter(
    (b) => !reviewByBookingId.has(b.id)
  );
  const reviewedBookings = filteredCompletedBookings.filter((b) =>
    reviewByBookingId.has(b.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileEdit className="text-green-600" size={28} />
          รีวิวการสอน
        </h1>
        <p className="text-gray-500 mt-1">
          {isOwner
            ? `ดูรีวิวล่าสุดจากโปรโค้ช (${filteredReviews.length} รีวิว)`
            : `รีวิวการสอนของคุณ (${filteredReviews.length} รีวิว)`}
        </p>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <Input
              
              placeholder="ค้นหา..."
              size="lg"
              className="max-w-xs"
              startContent={<Search size={16} className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {isOwner && (
              <Select
                label="กรองตามโปรโค้ช"
                placeholder="โปรโค้ชทั้งหมด"
                size="sm"
                className="max-w-xs"
                selectedKeys={filterProId ? [filterProId] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFilterProId(selected || "");
                }}
              >
                {pros.map((pro) => (
                  <SelectItem key={pro.uid} textValue={pro.displayName}>
                    {pro.displayName}
                  </SelectItem>
                ))}
              </Select>
            )}
            <Select
              label="กรองตามนักเรียน"
              placeholder={
                isOwner
                  ? "นักเรียนทั้งหมด"
                  : "นักเรียนทั้งหมด (ที่ดูแล)"
              }
              size="sm"
              className="max-w-xs"
              selectedKeys={filterStudentId ? [filterStudentId] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFilterStudentId(selected || "");
              }}
            >
              {students.map((s) => (
                <SelectItem key={s.uid} textValue={s.displayName}>
                  {s.displayName}
                </SelectItem>
              ))}
            </Select>
            {(filterProId || filterStudentId || searchText) && (
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  setFilterProId("");
                  setFilterStudentId("");
                  setSearchText("");
                }}
              >
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Pro: Needs Review section */}
      {!isOwner && needsReviewBookings.length > 0 && (
        <>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileEdit size={20} className="text-amber-500" />
              รอเขียนรีวิว ({needsReviewBookings.length})
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              การสอนที่เสร็จสิ้นแล้วแต่ยังไม่ได้เขียนรีวิว
            </p>
          </div>
          <div className="space-y-3">
            {needsReviewBookings.map((booking) => (
              <Card
                key={booking.id}
                className="shadow-sm border border-amber-100 bg-amber-50/30"
              >
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={15} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-800">
                          {getUserDisplayName(studentMap.get(booking.studentId), "นักเรียน")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={13} />
                          {format(parseISO(booking.date), "d MMM yyyy", {
                            locale: th,
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          {booking.startTime} - {booking.endTime}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      color="warning"
                      variant="flat"
                      startContent={<FileEdit size={14} />}
                      onPress={() =>
                        router.push(`/pro/review/${booking.id}`)
                      }
                    >
                      เขียนรีวิว
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Pro: Reviewed bookings section */}
      {!isOwner && (
        <>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              รีวิวแล้ว ({reviewedBookings.length})
            </h2>
          </div>
          {reviewedBookings.length === 0 ? (
            <Card className="shadow-sm">
              <CardBody className="text-center py-12 text-gray-400">
                <FileEdit size={40} className="mx-auto mb-2 opacity-50" />
                <p>ยังไม่มีรีวิว</p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviewedBookings.map((booking) => {
                const review = reviewByBookingId.get(booking.id)!;
                const studentName =
                  review.studentName ||
                  getUserDisplayName(studentMap.get(review.studentId), "นักเรียน");

                return (
                  <Card
                    key={booking.id}
                    className="shadow-sm border border-gray-100"
                  >
                    <CardBody className="p-5">
                      {/* Top row */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap
                            size={15}
                            className="text-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {studentName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <CalendarDays size={13} />
                          {review.date
                            ? format(parseISO(review.date), "d MMM yyyy", {
                                locale: th,
                              })
                            : format(
                                parseISO(review.createdAt),
                                "d MMM yyyy",
                                { locale: th }
                              )}
                          <Clock size={13} />
                          {booking.startTime} - {booking.endTime}
                        </div>
                      </div>

                      <Divider className="mb-3" />

                      {/* Comment */}
                      <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                        {review.comment}
                      </p>

                      {/* Media: embedded video + images */}
                      {(review.videoUrl || (review.imageUrls && review.imageUrls.length > 0)) && (
                        <div className="mt-3 space-y-3">
                          {review.videoUrl && (
                            <div className="rounded-lg overflow-hidden border border-gray-200 bg-black">
                              <video
                                src={review.videoUrl}
                                controls
                                preload="metadata"
                                className="w-full max-h-[360px]"
                              >
                                <track kind="captions" />
                              </video>
                            </div>
                          )}
                          {review.imageUrls && review.imageUrls.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {review.imageUrls.map((url, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setLightboxImage(url)}
                                  className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-green-400 transition-colors cursor-pointer"
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

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          {review.updatedAt &&
                            review.updatedAt !== review.createdAt && (
                              <p className="text-[11px] text-gray-400">
                                แก้ไขล่าสุด:{" "}
                                {format(
                                  parseISO(review.updatedAt),
                                  "d MMM yyyy HH:mm",
                                  { locale: th }
                                )}
                              </p>
                            )}
                        </div>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          startContent={<FileEdit size={14} />}
                          onPress={() =>
                            router.push(`/pro/review/${booking.id}`)
                          }
                        >
                          แก้ไขรีวิว
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Owner: Reviews list */}
      {isOwner && (
        <>
          {filteredReviews.length === 0 ? (
            <Card className="shadow-sm">
              <CardBody className="text-center py-12 text-gray-400">
                <FileEdit size={40} className="mx-auto mb-2 opacity-50" />
                <p>ยังไม่มีรีวิว</p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => {
                const pro = proMap.get(review.proId);
                const student = studentMap.get(review.studentId);
                const proName =
                  review.proName || getUserDisplayName(pro, "โปร");
                const studentName =
                  review.studentName ||
                  getUserDisplayName(student, "นักเรียน");

                return (
                  <Card
                    key={review.id}
                    className="shadow-sm border border-gray-100"
                  >
                    <CardBody className="p-5">
                      {/* Top row: pro, student, date */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <User size={15} className="text-green-600" />
                            <span className="text-sm font-semibold text-gray-800">
                              โปร {proName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <GraduationCap
                              size={15}
                              className="text-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {studentName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <CalendarDays size={13} />
                          {review.date
                            ? format(parseISO(review.date), "d MMM yyyy", {
                                locale: th,
                              })
                            : format(
                                parseISO(review.createdAt),
                                "d MMM yyyy",
                                { locale: th }
                              )}
                          <Clock size={13} />
                          {format(parseISO(review.createdAt), "HH:mm")}
                        </div>
                      </div>

                      <Divider className="mb-3" />

                      {/* Comment */}
                      <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                        {review.comment}
                      </p>

                      {/* Media: embedded video + images */}
                      {(review.videoUrl || (review.imageUrls && review.imageUrls.length > 0)) && (
                        <div className="mt-3 space-y-3">
                          {review.videoUrl && (
                            <div className="rounded-lg overflow-hidden border border-gray-200 bg-black">
                              <video
                                src={review.videoUrl}
                                controls
                                preload="metadata"
                                className="w-full max-h-[360px]"
                              >
                                <track kind="captions" />
                              </video>
                            </div>
                          )}
                          {review.imageUrls && review.imageUrls.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {review.imageUrls.map((url, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setLightboxImage(url)}
                                  className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-green-400 transition-colors cursor-pointer"
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

                      {/* Updated indicator */}
                      {review.updatedAt &&
                        review.updatedAt !== review.createdAt && (
                          <p className="text-[11px] text-gray-400 mt-2">
                            แก้ไขล่าสุด:{" "}
                            {format(
                              parseISO(review.updatedAt),
                              "d MMM yyyy HH:mm",
                              { locale: th }
                            )}
                          </p>
                        )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </>
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
