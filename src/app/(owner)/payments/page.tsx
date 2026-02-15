"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Tabs,
  Tab,
  useDisclosure,
} from "@heroui/react";
import { CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { th } from "date-fns/locale/th";
import toast from "react-hot-toast";
import PaymentTable, { statusConfig } from "@/components/PaymentTable";
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
            showActions
            onViewPayment={handleViewPayment}
          />
        </CardBody>
      </Card>

      {/* Payment Detail Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onModalClose) => (
            <>
              <ModalHeader className="text-gray-800">
                รายละเอียดการชำระเงิน
              </ModalHeader>
              <ModalBody>
                {selectedPayment && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">นักเรียน</p>
                        <p className="font-medium text-gray-800">
                          {selectedPayment.studentName ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">คอร์ส</p>
                        <p className="font-medium text-gray-800">
                          {selectedPayment.courseName ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">จำนวนเงิน</p>
                        <p className="font-medium text-gray-800">
                          ฿{selectedPayment.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">ชั่วโมงที่จะได้รับ</p>
                        <p className="font-medium text-gray-800">
                          {selectedPayment.hoursAdded} ชั่วโมง
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">สถานะ</p>
                        <Chip
                          size="sm"
                          color={
                            statusConfig[selectedPayment.status]?.color ??
                            "default"
                          }
                          variant="flat"
                        >
                          {statusConfig[selectedPayment.status]?.label ??
                            selectedPayment.status}
                        </Chip>
                      </div>
                      <div>
                        <p className="text-gray-500">วันที่ชำระ</p>
                        <p className="font-medium text-gray-800">
                          {format(
                            new Date(selectedPayment.createdAt),
                            "d MMM yyyy HH:mm",
                            { locale: th }
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Receipt Image */}
                    {selectedPayment.receiptImageUrl && (
                      <div>
                        <p className="text-gray-500 text-sm mb-2">
                          หลักฐานการชำระเงิน
                        </p>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <img
                            src={selectedPayment.receiptImageUrl}
                            alt="หลักฐานการชำระเงิน"
                            className="w-full max-h-[400px] object-contain bg-gray-50"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                {selectedPayment?.status === "pending" ? (
                  <>
                    <Button
                      variant="flat"
                      color="danger"
                      startContent={<XCircle size={18} />}
                      onPress={() => handleAction("rejected")}
                      isLoading={actionLoading}
                    >
                      ปฏิเสธ
                    </Button>
                    <Button
                      color="success"
                      startContent={<CheckCircle size={18} />}
                      onPress={() => handleAction("approved")}
                      isLoading={actionLoading}
                      className="text-white"
                    >
                      อนุมัติ
                    </Button>
                  </>
                ) : (
                  <Button variant="flat" onPress={onModalClose}>
                    ปิด
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
