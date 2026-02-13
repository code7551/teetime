"use client";

import { useMiniApp } from "@/hooks/useMiniApp";
import { useEffect, useState } from "react";
import { Card, CardBody, Spinner, Chip } from "@heroui/react";
import { Calendar, Clock, User, BookOpen } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import SubPageHeader from "@/components/student/SubPageHeader";
import type { Booking } from "@/types";

export default function HistoryPage() {
  const { student, loading: miniAppLoading, isLinked } = useMiniApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/bookings?studentId=${student.uid}`);
        if (res.ok) {
          setBookings(await res.json());
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
          <BookOpen size={28} className="text-gray-300" />
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

  const statusMap: Record<
    string,
    { label: string; color: "success" | "warning" | "danger" | "default" }
  > = {
    completed: { label: "เสร็จสิ้น", color: "success" },
    scheduled: { label: "นัดหมาย", color: "warning" },
    cancelled: { label: "ยกเลิก", color: "danger" },
  };

  return (
    <div className="space-y-4 pb-6">
      <SubPageHeader
        title="ประวัติการเรียน"
        icon={<BookOpen size={20} className="text-blue-500" />}
      />

      {bookings.length === 0 ? (
        <Card className="shadow-sm border-0">
          <CardBody className="text-center py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="text-gray-200" />
            </div>
            <p className="text-gray-400 text-sm">ยังไม่มีประวัติการเรียน</p>
            <p className="text-gray-300 text-xs mt-1">
              ข้อมูลจะแสดงเมื่อมีการจองเรียน
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {bookings.map((booking) => {
            const status = statusMap[booking.status] || {
              label: booking.status,
              color: "default" as const,
            };
            return (
              <Card key={booking.id} className="shadow-sm border-0">
                <CardBody className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                          <Calendar size={14} className="text-blue-500" />
                        </div>
                        <span className="font-medium">
                          {format(new Date(booking.date), "d MMMM yyyy", {
                            locale: th,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                          <Clock size={14} className="text-gray-400" />
                        </div>
                        <span>
                          {booking.startTime} - {booking.endTime}
                        </span>
                      </div>
                      {booking.proName && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                            <User size={14} className="text-emerald-500" />
                          </div>
                          <span>โปรโค้ช {booking.proName}</span>
                        </div>
                      )}
                    </div>
                    <Chip
                      size="sm"
                      color={status.color}
                      variant="flat"
                      className="shrink-0 ml-2"
                    >
                      {status.label}
                    </Chip>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
