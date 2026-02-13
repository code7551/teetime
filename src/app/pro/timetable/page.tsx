"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Chip,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import {
  CalendarDays,
  CheckCircle,
  FileEdit,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
} from "lucide-react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { th } from "date-fns/locale/th";
import { useRouter } from "next/navigation";
import type { Booking, BookingStatus, Review } from "@/types";

const bookingStatusConfig: Record<
  BookingStatus,
  { label: string; color: "warning" | "success" | "danger" }
> = {
  scheduled: { label: "นัดหมาย", color: "warning" },
  completed: { label: "เสร็จสิ้น", color: "success" },
  cancelled: { label: "ยกเลิก", color: "danger" },
};

const DAY_LABELS = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

export default function ProTimetablePage() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [bookingToComplete, setBookingToComplete] = useState<Booking | null>(
    null
  );

  const reviewsLoadedRef = useRef(false);

  // Calendar grid computation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const calStartStr = useMemo(
    () => format(calendarStart, "yyyy-MM-dd"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentMonth.getMonth(), currentMonth.getFullYear()]
  );
  const calEndStr = useMemo(
    () => format(calendarEnd, "yyyy-MM-dd"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentMonth.getMonth(), currentMonth.getFullYear()]
  );

  const fetchBookings = useCallback(async () => {
    if (!user || !firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const params = new URLSearchParams();
      params.set("proId", user.uid);
      params.set("startDate", calStartStr);
      params.set("endDate", calEndStr);

      const res = await fetch(`/api/bookings?${params.toString()}`, {
        headers,
      });
      if (res.ok) {
        setBookings(await res.json());
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  }, [user, firebaseUser, calStartStr, calEndStr]);

  const fetchReviews = useCallback(async () => {
    if (!user || !firebaseUser || reviewsLoadedRef.current) return;
    try {
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`/api/reviews?proId=${user.uid}`, { headers });
      if (res.ok) {
        setReviews(await res.json());
        reviewsLoadedRef.current = true;
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }, [user, firebaseUser]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    const load = async () => {
      setDataLoading(true);
      await fetchBookings();
      setDataLoading(false);
    };
    load();
  }, [fetchBookings]);

  const bookingsByDay = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    calendarDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      map[key] = bookings
        .filter((b) => b.date === key)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, calStartStr]);

  const reviewedBookingIds = useMemo(
    () => new Set(reviews.map((r) => r.bookingId)),
    [reviews]
  );

  const handleCompleteBooking = async () => {
    if (!bookingToComplete || !firebaseUser) return;

    try {
      setCompletingId(bookingToComplete.id);
      const token = await firebaseUser.getIdToken();

      const res = await fetch(`/api/bookings/${bookingToComplete.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingToComplete.id
              ? { ...b, status: "completed" }
              : b
          )
        );
        onClose();
      }
    } catch (error) {
      console.error("Error completing booking:", error);
    } finally {
      setCompletingId(null);
    }
  };

  const today = new Date();
  const selectedDayBookings = selectedDay
    ? bookingsByDay[selectedDay] || []
    : [];

  if (loading || dataLoading) {
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
          <CalendarDays className="text-green-600" size={28} />
          ตารางสอน
        </h1>
        <p className="text-gray-500 mt-1">
          จัดการตารางสอนและบันทึกผลการเรียน
        </p>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="flat"
          size="sm"
          isIconOnly
          onPress={() => {
            setCurrentMonth(subMonths(currentMonth, 1));
            setSelectedDay(null);
          }}
        >
          <ChevronLeft size={18} />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-700">
            {format(currentMonth, "MMMM yyyy", { locale: th })}
          </h2>
          <button
            type="button"
            className="text-xs text-green-600 hover:underline mt-0.5"
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDay(format(new Date(), "yyyy-MM-dd"));
            }}
          >
            วันนี้
          </button>
        </div>
        <Button
          variant="flat"
          size="sm"
          isIconOnly
          onPress={() => {
            setCurrentMonth(addMonths(currentMonth, 1));
            setSelectedDay(null);
          }}
        >
          <ChevronRight size={18} />
        </Button>
      </div>

      {/* Monthly Calendar */}
      <Card className="shadow-sm overflow-hidden">
        <CardBody className="p-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-center py-2.5 text-xs font-semibold text-gray-500 uppercase"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayBookings = bookingsByDay[key] || [];
              const isToday = isSameDay(day, today);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDay === key;
              const hasBookings = dayBookings.length > 0;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(isSelected ? null : key)}
                  className={`relative min-h-[72px] md:min-h-[90px] p-1.5 border-b border-r border-gray-50 text-left transition-colors hover:bg-gray-50 ${
                    isSelected
                      ? "bg-green-50 ring-1 ring-inset ring-green-300"
                      : ""
                  } ${!isCurrentMonth ? "opacity-40" : ""}`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                      isToday
                        ? "bg-green-500 text-white"
                        : isSelected
                          ? "text-green-700 font-bold"
                          : "text-gray-700"
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {hasBookings && (
                    <div className="mt-0.5 space-y-0.5">
                      {dayBookings.slice(0, 2).map((booking) => (
                        <div
                          key={booking.id}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
                            booking.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : booking.status === "cancelled"
                                ? "bg-red-100 text-red-600"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {booking.startTime}{" "}
                          {booking.studentName?.split(" ")[0] ?? ""}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <p className="text-[10px] text-gray-400 px-1">
                          +{dayBookings.length - 2} อื่นๆ
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Selected day detail panel */}
      {selectedDay && (
        <Card className="shadow-sm border-l-4 border-green-400">
          <CardBody className="p-4">
            <h3 className="text-md font-semibold text-gray-800 mb-3">
              {format(
                new Date(selectedDay + "T00:00:00"),
                "d MMMM yyyy (EEEE)",
                { locale: th }
              )}
            </h3>

            {selectedDayBookings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                ไม่มีนัดหมายในวันนี้
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDayBookings.map((booking) => {
                  const hasReview = reviewedBookingIds.has(booking.id);

                  return (
                    <div
                      key={booking.id}
                      className={`p-3 rounded-lg text-sm ${
                        booking.status === "completed"
                          ? "bg-green-50 border border-green-100"
                          : booking.status === "cancelled"
                            ? "bg-red-50 border border-red-100"
                            : "bg-amber-50 border border-amber-100"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-500" />
                            <span className="font-medium text-gray-700">
                              {booking.startTime} - {booking.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-500" />
                            <span className="text-gray-700">
                              {booking.studentName ?? "นักเรียน"}
                            </span>
                          </div>
                        </div>
                        <Chip
                          size="sm"
                          color={
                            bookingStatusConfig[booking.status]?.color ??
                            "default"
                          }
                          variant="flat"
                        >
                          {bookingStatusConfig[booking.status]?.label ??
                            booking.status}
                        </Chip>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                        {booking.status === "scheduled" && (
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            startContent={<CheckCircle size={14} />}
                            onPress={() => {
                              setBookingToComplete(booking);
                              onOpen();
                            }}
                          >
                            เสร็จสิ้น
                          </Button>
                        )}

                        {booking.status === "completed" && !hasReview && (
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
                        )}

                        {booking.status === "completed" && hasReview && (
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
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Confirm Complete Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            ยืนยันการสอนเสร็จสิ้น
          </ModalHeader>
          <ModalBody>
            {bookingToComplete && (
              <div className="space-y-2">
                <p className="text-gray-600">
                  คุณต้องการยืนยันว่าการสอนนี้เสร็จสิ้นแล้วหรือไม่?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">
                    {bookingToComplete.studentName || "นักเรียน"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(parseISO(bookingToComplete.date), "d MMMM yyyy", {
                      locale: th,
                    })}{" "}
                    | {bookingToComplete.startTime} -{" "}
                    {bookingToComplete.endTime}
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              ยกเลิก
            </Button>
            <Button
              color="success"
              className="text-white"
              isLoading={!!completingId}
              onPress={handleCompleteBooking}
            >
              ยืนยัน
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
