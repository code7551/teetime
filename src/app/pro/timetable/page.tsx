"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Chip,
  Button,
  Input,
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
} from "lucide-react";
import { format, parseISO, addDays, subDays, isToday } from "date-fns";
import { th } from "date-fns/locale/th";
import { useRouter } from "next/navigation";
import type { Booking, Review } from "@/types";

export default function ProTimetablePage() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [completingId, setCompletingId] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [bookingToComplete, setBookingToComplete] = useState<Booking | null>(
    null
  );

  const fetchData = useCallback(async () => {
    if (!user || !firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [bookingsRes, reviewsRes] = await Promise.all([
        fetch(`/api/bookings?proId=${user.uid}`, { headers }),
        fetch(`/api/reviews?proId=${user.uid}`, { headers }),
      ]);

      if (bookingsRes.ok) {
        const data: Booking[] = await bookingsRes.json();
        setBookings(data);
      }

      if (reviewsRes.ok) {
        const data: Review[] = await reviewsRes.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Error fetching timetable data:", error);
    } finally {
      setDataLoading(false);
    }
  }, [user, firebaseUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  const reviewedBookingIds = new Set(reviews.map((r) => r.bookingId));

  const filteredBookings = bookings
    .filter((b) => b.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const selectedDateObj = parseISO(selectedDate);
  const isSelectedToday = isToday(selectedDateObj);

  const statusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "primary";
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "scheduled":
        return "นัดหมาย";
      case "completed":
        return "เสร็จสิ้น";
      case "cancelled":
        return "ยกเลิก";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarDays className="text-green-600" size={28} />
          ตารางสอน
        </h1>
        <p className="text-gray-500 mt-1">จัดการตารางสอนและบันทึกผลการเรียน</p>
      </div>

      {/* Date Picker */}
      <Card className="border border-gray-100 shadow-sm">
        <CardBody className="p-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              isIconOnly
              variant="light"
              onPress={() =>
                setSelectedDate(format(subDays(selectedDateObj, 1), "yyyy-MM-dd"))
              }
            >
              <ChevronLeft size={20} />
            </Button>

            <div className="flex items-center gap-3 flex-1 justify-center">
              <Input
                type="date"
                variant="bordered"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-[200px]"
              />
              <div className="hidden sm:block text-center">
                <p className="font-medium text-gray-800">
                  {format(selectedDateObj, "EEEE", { locale: th })}
                </p>
                <p className="text-sm text-gray-500">
                  {format(selectedDateObj, "d MMMM yyyy", { locale: th })}
                </p>
              </div>
              {isSelectedToday && (
                <Chip size="sm" color="success" variant="flat">
                  วันนี้
                </Chip>
              )}
            </div>

            <Button
              isIconOnly
              variant="light"
              onPress={() =>
                setSelectedDate(format(addDays(selectedDateObj, 1), "yyyy-MM-dd"))
              }
            >
              <ChevronRight size={20} />
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <Card className="border border-gray-100 shadow-sm">
            <CardBody className="text-center py-12 text-gray-400">
              <CalendarDays size={40} className="mx-auto mb-2 opacity-50" />
              <p>ไม่มีนัดหมายในวันนี้</p>
            </CardBody>
          </Card>
        ) : (
          filteredBookings.map((booking) => {
            const hasReview = reviewedBookingIds.has(booking.id);

            return (
              <Card
                key={booking.id}
                className="border border-gray-100 shadow-sm"
              >
                <CardBody className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center bg-green-50 px-4 py-2 rounded-xl border border-green-100 min-w-[90px]">
                        <p className="text-sm font-bold text-green-600">
                          {booking.startTime}
                        </p>
                        <p className="text-xs text-gray-400">
                          {booking.endTime}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {booking.studentName || "นักเรียน"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.startTime} - {booking.endTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Chip
                        size="sm"
                        color={statusColor(booking.status)}
                        variant="flat"
                      >
                        {statusLabel(booking.status)}
                      </Chip>

                      {booking.status === "scheduled" && (
                        <Button
                          size="sm"
                          color="success"
                          variant="flat"
                          startContent={<CheckCircle size={16} />}
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
                          startContent={<FileEdit size={16} />}
                          onPress={() =>
                            router.push(`/pro/review/${booking.id}`)
                          }
                        >
                          เขียนรีวิว
                        </Button>
                      )}

                      {booking.status === "completed" && hasReview && (
                        <Chip size="sm" color="success" variant="flat">
                          รีวิวแล้ว
                        </Chip>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>

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
