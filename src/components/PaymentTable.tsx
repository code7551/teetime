"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
} from "@heroui/react";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale/th";
import type { Payment, PaymentStatus } from "@/types";

const statusConfig: Record<
  PaymentStatus,
  { label: string; color: "warning" | "success" | "danger" }
> = {
  pending: { label: "รอตรวจสอบ", color: "warning" },
  approved: { label: "อนุมัติแล้ว", color: "success" },
  rejected: { label: "ปฏิเสธ", color: "danger" },
};

export { statusConfig };

interface PaymentTableProps {
  payments: Payment[];
  /** Show the "จัดการ" action column with a view button */
  showActions?: boolean;
  /** Called when the view button is pressed */
  onViewPayment?: (payment: Payment) => void;
  /** Empty state message */
  emptyMessage?: string;
}

export default function PaymentTable({
  payments,
  showActions = false,
  onViewPayment,
  emptyMessage = "ไม่มีรายการชำระเงิน",
}: PaymentTableProps) {
  if (payments.length === 0) {
    return (
      <p className="text-gray-400 text-center py-12">{emptyMessage}</p>
    );
  }

  const columns = [
    { key: "studentName", label: "นักเรียน" },
    { key: "amount", label: "จำนวนเงิน" },
    { key: "courseName", label: "คอร์ส" },
    { key: "status", label: "สถานะ" },
    { key: "createdAt", label: "วันที่" },
    ...(showActions ? [{ key: "actions", label: "จัดการ" }] : []),
  ];

  return (
    <Table aria-label="รายการชำระเงิน" removeWrapper>
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.key}
            align={column.key === "actions" ? "center" : "start"}
          >
            {column.label}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={payments}>
        {(payment) => (
          <TableRow key={payment.id}>
            {(columnKey) => {
              switch (columnKey) {
                case "studentName":
                  return (
                    <TableCell className="font-medium">
                      {payment.studentName ?? "-"}
                    </TableCell>
                  );
                case "amount":
                  return (
                    <TableCell>
                      ฿{payment.amount.toLocaleString()}
                    </TableCell>
                  );
                case "courseName":
                  return (
                    <TableCell>{payment.courseName ?? "-"}</TableCell>
                  );
                case "status":
                  return (
                    <TableCell>
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
                    </TableCell>
                  );
                case "createdAt":
                  return (
                    <TableCell>
                      {format(new Date(payment.createdAt), "d MMM yyyy", {
                        locale: th,
                      })}
                    </TableCell>
                  );
                case "actions":
                  return (
                    <TableCell>
                      <div className="flex justify-center">
                        <Button
                          size="sm"
                          variant="flat"
                          color="success"
                          startContent={<Eye size={16} />}
                          onPress={() => onViewPayment?.(payment)}
                        >
                          ดูรายละเอียด
                        </Button>
                      </div>
                    </TableCell>
                  );
                default:
                  return <TableCell>-</TableCell>;
              }
            }}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
