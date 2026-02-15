"use client";

import { Card, CardBody } from "@heroui/react";
import { Wallet, CheckCircle, AlertCircle } from "lucide-react";

interface IncomeSummaryCardsProps {
  totalIncome: number;
  totalBookings: number;
  totalPaid: number;
  paidCount: number;
  totalUnpaid: number;
  unpaidCount: number;
}

const fmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function IncomeSummaryCards({
  totalIncome,
  totalBookings,
  totalPaid,
  paidCount,
  totalUnpaid,
  unpaidCount,
}: IncomeSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="border border-gray-100 shadow-sm">
        <CardBody className="flex flex-row items-center gap-4 p-5">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Wallet className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">รายได้ทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-800">฿{fmt(totalIncome)}</p>
            <p className="text-xs text-gray-400">{totalBookings} นัด</p>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-green-100 shadow-sm">
        <CardBody className="flex flex-row items-center gap-4 p-5">
          <div className="p-3 bg-green-100 rounded-xl">
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">จ่ายแล้ว</p>
            <p className="text-2xl font-bold text-green-600">฿{fmt(totalPaid)}</p>
            <p className="text-xs text-gray-400">{paidCount} นัด</p>
          </div>
        </CardBody>
      </Card>

      <Card className="border border-amber-100 shadow-sm">
        <CardBody className="flex flex-row items-center gap-4 p-5">
          <div className="p-3 bg-amber-100 rounded-xl">
            <AlertCircle className="text-amber-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">ยังไม่จ่าย</p>
            <p className="text-2xl font-bold text-amber-600">฿{fmt(totalUnpaid)}</p>
            <p className="text-xs text-gray-400">{unpaidCount} นัด</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
