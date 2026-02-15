"use client";

import { useMiniApp } from "@/hooks/useMiniApp";
import { useEffect, useState } from "react";
import { Card, CardBody, Spinner } from "@heroui/react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import SubPageHeader from "@/components/student/SubPageHeader";
import type { StudentHours, Payment } from "@/types";

export default function HoursPage() {
  const { student, loading: miniAppLoading, isLinked } = useMiniApp();
  const [hours, setHours] = useState<StudentHours | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;

    const fetchData = async () => {
      try {
        const [hoursRes, paymentsRes] = await Promise.all([
          fetch(`/api/student-hours/${student.uid}`),
          fetch(`/api/payments?studentId=${student.uid}`),
        ]);

        if (hoursRes.ok) {
          setHours(await hoursRes.json());
        }
        if (paymentsRes.ok) {
          const data = await paymentsRes.json();
          setPayments(data.filter((p: Payment) => p.status === "approved"));
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

  const totalPurchased = hours?.totalHoursPurchased ?? 0;
  const totalUsed = hours?.totalHoursUsed ?? 0;
  const remaining = hours?.remainingHours ?? 0;

  return (
    <div className="pb-6">
      <SubPageHeader title="ชั่วโมงเรียน" />

      <div className="space-y-4">
        {/* Remaining hours */}
        <Card className="shadow-sm border-0 bg-emerald-50">
          <CardBody className="p-6 text-center">
            <p className="text-sm text-emerald-600/70">ชั่วโมงคงเหลือ</p>
            <p className="text-5xl font-bold text-emerald-700 mt-2 leading-none">
              {remaining}
            </p>
            <p className="text-sm text-emerald-500 mt-2">ชั่วโมง</p>
          </CardBody>
        </Card>

        {/* Stats */}
        <Card className="shadow-sm border-0 overflow-hidden">
          <CardBody className="p-0">
            <div className="flex">
              <div className="flex-1 text-center py-4 border-r border-gray-100">
                <p className="text-xl font-semibold text-blue-600">
                  {totalPurchased}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">ซื้อทั้งหมด</p>
              </div>
              <div className="flex-1 text-center py-4">
                <p className="text-xl font-semibold text-orange-500">
                  {totalUsed}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">ใช้ไปแล้ว</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Payment history */}
        {payments.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-3">
              ประวัติเติมชั่วโมง
            </p>
            <Card className="shadow-sm border-0 overflow-hidden">
              <CardBody className="p-0">
                {payments.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between px-4 py-3.5 ${
                      idx < payments.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-emerald-600">
                        +{p.hoursAdded} ชั่วโมง
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(p.createdAt), "d MMM yyyy", {
                          locale: th,
                        })}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-600 shrink-0">
                      ฿{p.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        )}

        {payments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-300">ยังไม่มีประวัติเติมชั่วโมง</p>
          </div>
        )}
      </div>
    </div>
  );
}
