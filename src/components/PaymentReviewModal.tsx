"use client";

import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
} from "@heroui/react";
import { CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale/th";
import { statusConfig } from "@/components/PaymentTable";
import type { Payment } from "@/types";

interface PaymentReviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  actionLoading: boolean;
  onAction: (status: "approved" | "rejected") => void;
}

export default function PaymentReviewModal({
  isOpen,
  onOpenChange,
  payment,
  actionLoading,
  onAction,
}: PaymentReviewModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="text-gray-800">
              รายละเอียดการชำระเงิน
            </ModalHeader>
            <ModalBody>
              {payment && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">นักเรียน</p>
                      <p className="font-medium text-gray-800">
                        {payment.studentName ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">คอร์ส</p>
                      <p className="font-medium text-gray-800">
                        {payment.courseName ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">จำนวนเงิน</p>
                      <p className="font-medium text-gray-800">
                        ฿{payment.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">ชั่วโมงที่จะได้รับ</p>
                      <p className="font-medium text-gray-800">
                        {payment.hoursAdded} ชั่วโมง
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">สถานะ</p>
                      <Chip
                        size="sm"
                        color={
                          statusConfig[payment.status]?.color ?? "default"
                        }
                        variant="flat"
                      >
                        {statusConfig[payment.status]?.label ??
                          payment.status}
                      </Chip>
                    </div>
                    <div>
                      <p className="text-gray-500">วันที่ชำระ</p>
                      <p className="font-medium text-gray-800">
                        {format(
                          new Date(payment.createdAt),
                          "d MMM yyyy HH:mm",
                          { locale: th }
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Receipt Image */}
                  {payment.receiptImageUrl && (
                    <div>
                      <p className="text-gray-500 text-sm mb-2">
                        หลักฐานการชำระเงิน
                      </p>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <img
                          src={payment.receiptImageUrl}
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
              {payment?.status === "pending" ? (
                <>
                  <Button
                    variant="flat"
                    color="danger"
                    startContent={<XCircle size={18} />}
                    onPress={() => onAction("rejected")}
                    isLoading={actionLoading}
                  >
                    ปฏิเสธ
                  </Button>
                  <Button
                    color="success"
                    startContent={<CheckCircle size={18} />}
                    onPress={() => onAction("approved")}
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
  );
}
