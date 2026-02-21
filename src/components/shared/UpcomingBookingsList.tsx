"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Chip,
  Button,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { Clock, CheckCircle, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale/th";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Booking } from "@/types";

interface UpcomingBookingsListProps {
  role: "owner" | "pro";
}

export default function UpcomingBookingsList({
  role,
}: UpcomingBookingsListProps) {
  const { user, firebaseUser } = useAuth();
  const isOwner = role === "owner";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [bookingToComplete, setBookingToComplete] = useState<Booking | null>(
    null,
  );
  const {
    isOpen: isCompleteOpen,
    onOpen: onCompleteOpen,
    onClose: onCompleteClose,
  } = useDisclosure();

  const fetchBookings = useCallback(async () => {
    if (!firebaseUser || !user) return;
    try {
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams({ status: "scheduled" });
      if (!isOwner) {
        params.set("proId", user.uid);
      }

      const res = await fetch(`/api/bookings?${params.toString()}`, {
        headers,
      });
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
      const data: Booking[] = await res.json();

      const sorted = data.sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
      );
      setBookings(sorted);
    } catch (err) {
      console.error("Error fetching upcoming bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, user, isOwner]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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
        setBookings((prev) => prev.filter((b) => b.id !== bookingToComplete.id));
        onCompleteClose();
        toast.success("ยืนยันเสร็จสิ้นเรียบร้อย");
      } else {
        const errData = await res.json();
        toast.error(errData.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error("Error completing booking:", err);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setCompletingId(null);
    }
  };

  const resolveStudentName = (booking: Booking) =>
    booking.studentName || "นักเรียน";

  const resolveProName = (booking: Booking) =>
    booking.proName || "โปร";

  if (loading) {
    return (
      <Card className="border border-gray-100 shadow-sm">
        <CardBody className="flex items-center justify-center py-10">
          <Spinner size="sm" color="success" />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-gray-100 shadow-sm">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-amber-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">
              นัดหมายที่กำลังจะมาถึง
            </h2>
            <Chip size="sm" variant="flat" color="warning">
              {bookings.length}
            </Chip>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle size={40} className="mx-auto mb-2 opacity-50" />
              <p>ไม่มีนัดหมายที่กำลังจะมาถึง</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-amber-50/50 rounded-xl border border-amber-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-white px-3 py-2 rounded-lg border border-amber-200 min-w-[80px]">
                      <p className="text-xs font-medium text-amber-600">
                        {format(parseISO(booking.date), "d MMM", {
                          locale: th,
                        })}
                      </p>
                      <p className="text-sm font-semibold text-gray-700">
                        {booking.startTime}
                      </p>
                      <p className="text-xs text-gray-400">{booking.endTime}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {resolveStudentName(booking)}
                      </p>
                      {isOwner && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <User size={12} />
                          โปร {resolveProName(booking)}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {format(parseISO(booking.date), "EEEE", {
                          locale: th,
                        })}{" "}
                        {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                  </div>
                  {!isOwner && (
                    <Button
                      size="sm"
                      color="warning"
                      variant="flat"
                      startContent={<CheckCircle size={14} />}
                      onPress={() => {
                        setBookingToComplete(booking);
                        onCompleteOpen();
                      }}
                    >
                      สอนเสร็จแล้ว
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Confirm Complete Modal (pro only) */}
      {!isOwner && (
        <Modal isOpen={isCompleteOpen} onClose={onCompleteClose}>
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
                      {resolveStudentName(bookingToComplete)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(
                        parseISO(bookingToComplete.date),
                        "d MMMM yyyy",
                        { locale: th },
                      )}{" "}
                      | {bookingToComplete.startTime} -{" "}
                      {bookingToComplete.endTime}
                    </p>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onCompleteClose}>
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
      )}
    </>
  );
}
