"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Tabs,
  Tab,
  useDisclosure,
} from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import PaymentTable from "@/components/PaymentTable";
import PaymentReviewModal from "@/components/PaymentReviewModal";
import type { Payment } from "@/types";

export default function PaymentsPage() {
  const { firebaseUser } = useAuth();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const fetchPayments = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
      const data = await res.json();
      setPayments(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments =
    activeTab === "all"
      ? payments
      : payments.filter((p) => p.status === activeTab);

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
      fetchPayments();
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

  const tabCounts = {
    all: payments.length,
    pending: payments.filter((p) => p.status === "pending").length,
    approved: payments.filter((p) => p.status === "approved").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">การชำระเงิน</h1>
        <p className="text-gray-500 mt-1">ตรวจสอบและจัดการรายการชำระเงิน</p>
      </div>

      <Tabs
        aria-label="สถานะการชำระเงิน"
        color="success"
        variant="underlined"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        classNames={{
          tabList: "gap-6",
        }}
      >
        <Tab key="all" title={`ทั้งหมด (${tabCounts.all})`} />
        <Tab key="pending" title={`รอตรวจสอบ (${tabCounts.pending})`} />
        <Tab key="approved" title={`อนุมัติแล้ว (${tabCounts.approved})`} />
        <Tab key="rejected" title={`ปฏิเสธ (${tabCounts.rejected})`} />
      </Tabs>

      <Card className="shadow-sm">
        <CardBody className="p-0">
          <PaymentTable
            payments={filteredPayments}
            onViewPayment={handleViewPayment}
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
