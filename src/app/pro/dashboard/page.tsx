"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, Spinner, Chip } from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import { Users, CalendarDays, DollarSign, Clock } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { th } from "date-fns/locale/th";
import type { AppUser, Booking } from "@/types";

export default function ProDashboardPage() {
  const { user, firebaseUser, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user || !firebaseUser) return;

    const fetchData = async () => {
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

    fetchData();
  }, [user, firebaseUser]);

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
    const rate = user?.commissionRate ?? 400;
    return acc + hours * rate;
  }, 0);

  const todayBookings = bookings
    .filter((b) => {
      try {
        return isToday(parseISO(b.date));
      } catch {
        return false;
      }
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

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
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          สวัสดี, {user?.displayName} 👋
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
                ฿{monthlyIncome.toLocaleString()}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="border border-gray-100 shadow-sm">
        <CardBody className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-green-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">
              ตารางสอนวันนี้
            </h2>
          </div>

          {todayBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CalendarDays size={40} className="mx-auto mb-2 opacity-50" />
              <p>ไม่มีนัดหมายวันนี้</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-white px-3 py-2 rounded-lg border border-gray-200 min-w-[80px]">
                      <p className="text-sm font-semibold text-green-600">
                        {booking.startTime}
                      </p>
                      <p className="text-xs text-gray-400">
                        {booking.endTime}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {booking.studentName || "นักเรียน"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                  </div>
                  <Chip
                    size="sm"
                    color={statusColor(booking.status)}
                    variant="flat"
                  >
                    {statusLabel(booking.status)}
                  </Chip>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
