"use client";

import { useMiniApp } from "@/hooks/useMiniApp";
import { useEffect, useState } from "react";
import { Card, CardBody, Spinner, Chip } from "@heroui/react";
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

  const statusMap: Record<
    string,
    {
      label: string;
      color: "success" | "warning" | "danger" | "default";
      border: string;
    }
  > = {
    completed: { label: "เสร็จสิ้น", color: "success", border: "border-l-emerald-400" },
    scheduled: { label: "นัดหมาย", color: "warning", border: "border-l-amber-400" },
    cancelled: { label: "ยกเลิก", color: "danger", border: "border-l-red-300" },
  };

  const sorted = [...bookings].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)
  );

  return (
    <div className="pb-6">
      <SubPageHeader title="ประวัติการเรียน" />

      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm text-gray-400">ยังไม่มีประวัติการเรียน</p>
          <p className="text-xs text-gray-300 mt-1">
            ข้อมูลจะแสดงเมื่อมีการจองเรียน
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((booking) => {
            const status = statusMap[booking.status] || {
              label: booking.status,
              color: "default" as const,
              border: "border-l-gray-300",
            };
            return (
              <Card
                key={booking.id}
                className={`shadow-sm border-0 border-l-3 ${status.border}`}
              >
                <CardBody className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {format(new Date(booking.date), "d MMMM yyyy", {
                          locale: th,
                        })}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {booking.startTime} – {booking.endTime}
                        {booking.proName && ` · โปร ${booking.proName}`}
                      </p>
                    </div>
                    <Chip
                      size="sm"
                      color={status.color}
                      variant="flat"
                      className="shrink-0"
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
