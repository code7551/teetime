"use client";

import { useEffect, useState } from "react";
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
  Users,
  CalendarDays,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale/th";
import toast from "react-hot-toast";
import { getUserDisplayName } from "@/lib/utils";
import type { AppUser, Booking } from "@/types";

export default function ProDashboardPage() {
  const { user, firebaseUser, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [bookingToComplete, setBookingToComplete] = useState<Booking | null>(
    null
  );
  const {
    isOpen: isCompleteOpen,
    onOpen: onCompleteOpen,
    onClose: onCompleteClose,
  } = useDisclosure();

  const fetchData = async () => {
    if (!user || !firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [bookingsRes, studentsRes] = await Promise.all([
        fetch(`/api/bookings?proId=${user.uid}`, { headers }),
        fetch(`/api/users?role=student`, { headers }),
      ]);

      if (bookingsRes.ok) {
        const bookingsData: Booking[] = await bookingsRes.json();
        setBookings(bookingsData);
      }

      if (studentsRes.ok) {
        const studentsData: AppUser[] = await studentsRes.json();
        setStudents(studentsData.filter((s) => s.proId === user.uid));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !firebaseUser) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, firebaseUser]);

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
            b.id === bookingToComplete.id ? { ...b, status: "completed" } : b
          )
        );
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

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyBookings = bookings.filter((b) => {
    const d = parseISO(b.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const completedThisMonth = monthlyBookings.filter(
    (b) => b.status === "completed"
  );

  const monthlyIncome = completedThisMonth.reduce((acc, b) => {
    const hours =
      (new Date(`1970-01-01T${b.endTime}`).getTime() -
        new Date(`1970-01-01T${b.startTime}`).getTime()) /
      3600000;
    const rate = b.hourlyRate ?? 0;
    const proShare = 1 - (user?.commissionRate ?? 0.3);
    return acc + hours * rate * proShare;
  }, 0);

  // Pending bookings: scheduled, sorted by date ascending
  const pendingBookings = bookings
    .filter((b) => b.status === "scheduled")
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
    );

  const studentMap = new Map(students.map((s) => [s.uid, s]));

  const resolveStudentName = (booking: Booking) =>
    getUserDisplayName(studentMap.get(booking.studentId)) ||
    booking.studentName ||
    "นักเรียน";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          สวัสดี, {getUserDisplayName(user, user?.displayName || "")} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {format(now, "วันEEEEที่ d MMMM yyyy", { locale: th })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4 p-5">
            <div className="p-3 bg-green-100 rounded-xl">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">จำนวนนักเรียน</p>
              <p className="text-2xl font-bold text-gray-800">
                {students.length}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4 p-5">
            <div className="p-3 bg-blue-100 rounded-xl">
              <CalendarDays className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">การสอนเดือนนี้</p>
              <p className="text-2xl font-bold text-gray-800">
                {completedThisMonth.length}{" "}
                <span className="text-sm font-normal text-gray-400">
                  / {monthlyBookings.length} นัด
                </span>
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4 p-5">
            <div className="p-3 bg-amber-100 rounded-xl">
              <DollarSign className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">รายได้เดือนนี้</p>
              <p className="text-2xl font-bold text-gray-800">
                ฿
                {monthlyIncome.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Pending Bookings (not yet confirmed) */}
      <Card className="border border-gray-100 shadow-sm">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-amber-500" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">
              นัดหมายรอยืนยัน
            </h2>
            <Chip size="sm" variant="flat" color="warning">
              {pendingBookings.length}
            </Chip>
          </div>

          {pendingBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle
                size={40}
                className="mx-auto mb-2 opacity-50"
              />
              <p>ไม่มีนัดหมายรอยืนยัน</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBookings.map((booking) => (
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
                      <p className="text-xs text-gray-400">
                        {booking.endTime}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {resolveStudentName(booking)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(parseISO(booking.date), "EEEE", {
                          locale: th,
                        })}{" "}
                        {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    color="success"
                    variant="flat"
                    startContent={<CheckCircle size={14} />}
                    onPress={() => {
                      setBookingToComplete(booking);
                      onCompleteOpen();
                    }}
                  >
                    ยืนยัน
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Confirm Complete Modal */}
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
                      { locale: th }
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
    </div>
  );
}
