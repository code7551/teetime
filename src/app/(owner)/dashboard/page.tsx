"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { Users, GraduationCap, CreditCard, CalendarDays } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import PaymentTable from "@/components/PaymentTable";
import PaymentReviewModal from "@/components/PaymentReviewModal";
import UpcomingBookingsList from "@/components/shared/UpcomingBookingsList";
import type { Payment } from "@/types";

interface DashboardStats {
  totalPros: number;
  totalStudents: number;
  pendingPayments: number;
  bookingsThisMonth: number;
}

export default function OwnerDashboardPage() {
  const { firebaseUser } = useAuth();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, paymentsRes] = await Promise.all([
        fetch("/api/stats", { headers }),
        fetch("/api/payments?status=pending", { headers }),
      ]);

      if (!statsRes.ok || !paymentsRes.ok) {
        throw new Error("ไม่สามารถโหลดข้อมูลได้");
      }

      const statsData = await statsRes.json();
      const paymentsData = await paymentsRes.json();

      setStats(statsData);
      setPendingPayments(paymentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    onOpen();
  };

  const handleAction = async (status: "approved" | "rejected") => {
    if (!firebaseUser || !selectedPayment) return;
    setActionLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const body: Record<string, unknown> = { status };
      if (status === "approved") {
        body.hoursAdded = selectedPayment.hoursAdded;
      }
      const res = await fetch(`/api/payments/${selectedPayment.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "เกิดข้อผิดพลาด");
      }
      onClose();
      setSelectedPayment(null);
      toast.success(status === "approved" ? "อนุมัติเรียบร้อย" : "ปฏิเสธเรียบร้อย");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "จำนวนโปร",
      value: stats?.totalPros ?? 0,
      icon: <Users size={28} className="text-green-600" />,
      bg: "bg-green-50",
      border: "border-green-200",
    },
    {
      title: "จำนวนนักเรียน",
      value: stats?.totalStudents ?? 0,
      icon: <GraduationCap size={28} className="text-emerald-600" />,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      title: "รอตรวจสอบการชำระเงิน",
      value: stats?.pendingPayments ?? 0,
      icon: <CreditCard size={28} className="text-amber-600" />,
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      title: "การจองเดือนนี้",
      value: stats?.bookingsThisMonth ?? 0,
      icon: <CalendarDays size={28} className="text-teal-600" />,
      bg: "bg-teal-50",
      border: "border-teal-200",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">แดชบอร์ด</h1>
        <p className="text-gray-500 mt-1">ภาพรวมระบบ Teetime Golf Center</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className={`${card.bg} border ${card.border} shadow-sm`}
          >
            <CardBody className="flex flex-row items-center gap-4 p-5">
              <div className="p-3 rounded-xl bg-white shadow-sm">
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {card.value.toLocaleString()}
                </p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Upcoming Bookings */}
      <UpcomingBookingsList role="owner" />

      {/* Pending Payments Table */}
      <Card className="shadow-sm">
        <CardBody className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            รายการรอตรวจสอบการชำระเงิน
          </h2>
          <PaymentTable
            payments={pendingPayments}
            onViewPayment={handleViewPayment}
            emptyMessage="ไม่มีรายการรอตรวจสอบ"
          />
        </CardBody>
      </Card>

      <PaymentReviewModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        payment={selectedPayment}
        actionLoading={actionLoading}
        onAction={handleAction}
      />
    </div>
  );
}
