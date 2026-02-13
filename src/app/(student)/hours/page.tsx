"use client";

import { useMiniApp } from "@/hooks/useMiniApp";
import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Progress,
  Chip,
} from "@heroui/react";
import { Clock, TrendingUp, Minus, Plus } from "lucide-react";
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
          <Clock size={28} className="text-gray-300" />
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

  const totalPurchased = hours?.totalHoursPurchased ?? 0;
  const totalUsed = hours?.totalHoursUsed ?? 0;
  const remaining = hours?.remainingHours ?? 0;
  const progressValue =
    totalPurchased > 0 ? (totalUsed / totalPurchased) * 100 : 0;

  return (
    <div className="space-y-4 pb-6">
      <SubPageHeader
        title="ชั่วโมงเรียน"
        icon={<Clock size={20} className="text-emerald-500" />}
      />

      {/* Main hours display */}
      <Card className="shadow-md border-0 overflow-hidden">
        <CardBody className="p-0">
          <div className="bg-linear-to-br from-emerald-500 to-teal-600 p-6 text-center text-white">
            <p className="text-sm text-emerald-100 mb-1">ชั่วโมงคงเหลือ</p>
            <p className="text-6xl font-bold leading-none my-3">{remaining}</p>
            <p className="text-emerald-200 text-sm">ชั่วโมง</p>
          </div>
          <div className="p-5">
            <Progress
              value={progressValue}
              color="success"
              size="md"
              className="mb-3"
              aria-label="ชั่วโมงที่ใช้ไป"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>ใช้ไปแล้ว {totalUsed} ชม.</span>
              <span>ทั้งหมด {totalPurchased} ชม.</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <Card className="shadow-sm border-0">
          <CardBody className="text-center p-3.5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-emerald-600">{remaining}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">คงเหลือ</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm border-0">
          <CardBody className="text-center p-3.5">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Plus size={16} className="text-blue-500" />
            </div>
            <p className="text-xl font-bold text-blue-600">{totalPurchased}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">ซื้อทั้งหมด</p>
          </CardBody>
        </Card>
        <Card className="shadow-sm border-0">
          <CardBody className="text-center p-3.5">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Minus size={16} className="text-orange-500" />
            </div>
            <p className="text-xl font-bold text-orange-600">{totalUsed}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">ใช้ไปแล้ว</p>
          </CardBody>
        </Card>
      </div>

      {/* Payment history */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-600">
            ประวัติเติมชั่วโมง
          </h3>
        </div>

        {payments.length === 0 ? (
          <Card className="shadow-sm border-0">
            <CardBody className="text-center py-10">
              <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock size={24} className="text-gray-200" />
              </div>
              <p className="text-sm text-gray-300">ยังไม่มีประวัติ</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <Card key={p.id} className="shadow-sm border-0">
                <CardBody className="p-3.5">
                  <div className="flex justify-between items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                          <Plus size={14} />
                          {p.hoursAdded} ชั่วโมง
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(p.createdAt), "d MMM yyyy", {
                          locale: th,
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-medium text-gray-700">
                        ฿{p.amount.toLocaleString()}
                      </p>
                      <Chip
                        size="sm"
                        color="success"
                        variant="flat"
                        className="mt-0.5"
                      >
                        อนุมัติแล้ว
                      </Chip>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
