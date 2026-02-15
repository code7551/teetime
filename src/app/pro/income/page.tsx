"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, Spinner, Select, SelectItem } from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign } from "lucide-react";
import { format } from "date-fns";
import IncomeSummaryCards from "@/components/shared/IncomeSummaryCards";
import IncomeBookingsTable from "@/components/shared/IncomeBookingsTable";
import type { IncomeBookingRow } from "@/components/shared/IncomeBookingsTable";
import {
  calcBookingHours,
  getBookingHourlyRate,
  calcProIncome,
  generateMonthOptions,
} from "@/lib/income";
import type { AppUser, Booking } from "@/types";

export default function ProIncomePage() {
  const { user, firebaseUser, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(() =>
    format(new Date(), "yyyy-MM")
  );

  useEffect(() => {
    if (!user || !firebaseUser) return;

    const fetchData = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [bookingsRes, studentsRes] = await Promise.all([
          fetch(`/api/bookings?proId=${user.uid}&status=completed`, { headers }),
          fetch("/api/users?role=student", { headers }),
        ]);

        if (bookingsRes.ok) setBookings(await bookingsRes.json());
        if (studentsRes.ok) setStudents(await studentsRes.json());
      } catch (error) {
        console.error("Error fetching income data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user, firebaseUser]);

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  const proShare = 1 - (user?.commissionRate ?? 0.3);
  const studentMap = new Map(students.map((s) => [s.uid, s]));
  const monthOptions = generateMonthOptions();

  // Filter bookings by selected month
  const filteredBookings = bookings.filter((b) => {
    if (!filterMonth) return true;
    return b.date.startsWith(filterMonth);
  });

  // Build rows for table
  const rows: IncomeBookingRow[] = filteredBookings.map((b) => ({
    booking: b,
    hours: calcBookingHours(b),
    hourlyRate: getBookingHourlyRate(b),
    proShare,
    income: calcProIncome(b, proShare),
  }));

  const sortedRows = [...rows].sort(
    (a, b) =>
      b.booking.date.localeCompare(a.booking.date) ||
      b.booking.startTime.localeCompare(a.booking.startTime)
  );

  // Summary calculations
  const totalIncome = rows.reduce((acc, r) => acc + r.income, 0);
  const paidRows = rows.filter((r) => r.booking.paidStatus === "paid");
  const unpaidRows = rows.filter((r) => r.booking.paidStatus !== "paid");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign className="text-green-600" size={28} />
          รายได้
        </h1>
        <p className="text-gray-500 mt-1">
          ส่วนแบ่งรายได้ {(proShare * 100).toFixed(0)}%
        </p>
      </div>

      {/* Month Filter */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <Select
            label="เดือน"
            size="sm"
            className="max-w-xs"
            selectedKeys={filterMonth ? [filterMonth] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setFilterMonth(selected || "");
            }}
          >
            {monthOptions.map((m) => (
              <SelectItem key={m.key} textValue={m.label}>
                {m.label}
              </SelectItem>
            ))}
          </Select>
        </CardBody>
      </Card>

      <IncomeSummaryCards
        totalIncome={totalIncome}
        totalBookings={rows.length}
        totalPaid={paidRows.reduce((acc, r) => acc + r.income, 0)}
        paidCount={paidRows.length}
        totalUnpaid={unpaidRows.reduce((acc, r) => acc + r.income, 0)}
        unpaidCount={unpaidRows.length}
      />

      <IncomeBookingsTable rows={sortedRows} studentMap={studentMap} />
    </div>
  );
}
