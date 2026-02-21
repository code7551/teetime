"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Select,
  SelectItem,
  Button,
} from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, CheckCircle, Users } from "lucide-react";
import { format } from "date-fns";
import { getUserDisplayName } from "@/lib/utils";
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
  const { firebaseUser } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pros, setPros] = useState<AppUser[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const [filterProId, setFilterProId] = useState("");
  const [filterMonth, setFilterMonth] = useState(() =>
    format(new Date(), "yyyy-MM")
  );

  const fetchData = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      setLoading(true);
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      params.set("status", "completed");
      if (filterProId) params.set("proId", filterProId);
      if (filterMonth) {
        const [year, month] = filterMonth.split("-");
        const startDate = `${year}-${month}-01`;
        const lastDay = new Date(Number(year), Number(month), 0).getDate();
        const endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
        params.set("startDate", startDate);
        params.set("endDate", endDate);
      }

      const [bookingsRes, prosRes, studentsRes] = await Promise.all([
        fetch(`/api/bookings?${params.toString()}`, { headers }),
        fetch("/api/users?role=pro", { headers }),
        fetch("/api/users?role=student", { headers }),
      ]);

      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (prosRes.ok) setPros(await prosRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
    } catch (error) {
      console.error("Error fetching pro income data:", error);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, filterProId, filterMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const proMap = new Map(pros.map((p) => [p.uid, p]));
  const studentMap = new Map(students.map((s) => [s.uid, s]));
  const monthOptions = generateMonthOptions();

  const getProShare = (proId: string): number => {
    const pro = proMap.get(proId);
    return 1 - (pro?.commissionRate ?? 0.3);
  };

  // Build rows
  const completedBookings = bookings.filter((b) => b.status === "completed");

  const rows: IncomeBookingRow[] = completedBookings.map((b) => {
    const proShare = getProShare(b.proId);
    return {
      booking: b,
      hours: calcBookingHours(b),
      hourlyRate: getBookingHourlyRate(b),
      proShare,
      income: calcProIncome(b, proShare),
    };
  });

  const sortedRows = [...rows].sort(
    (a, b) =>
      b.booking.date.localeCompare(a.booking.date) ||
      b.booking.startTime.localeCompare(a.booking.startTime)
  );

  // Summary
  const totalIncome = rows.reduce((acc, r) => acc + r.income, 0);
  const paidRows = rows.filter((r) => r.booking.paidStatus === "paid");
  const unpaidRows = rows.filter((r) => r.booking.paidStatus !== "paid");

  const togglePaidStatus = async (
    bookingId: string,
    currentStatus?: string
  ) => {
    if (!firebaseUser) return;
    const newStatus = currentStatus === "paid" ? "unpaid" : "paid";

    setUpdatingIds((prev) => new Set(prev).add(bookingId));
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/bookings/${bookingId}/paid`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paidStatus: newStatus }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, paidStatus: newStatus } : b
          )
        );
      }
    } catch (error) {
      console.error("Error toggling paid status:", error);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
    }
  };

  const markAllAsPaid = async () => {
    if (!firebaseUser) return;
    const unpaid = completedBookings.filter((b) => b.paidStatus !== "paid");
    if (unpaid.length === 0) return;

    setBulkUpdating(true);
    try {
      const token = await firebaseUser.getIdToken();
      await Promise.all(
        unpaid.map((b) =>
          fetch(`/api/bookings/${b.id}/paid`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ paidStatus: "paid" }),
          })
        )
      );
      setBookings((prev) =>
        prev.map((b) =>
          unpaid.some((u) => u.id === b.id)
            ? { ...b, paidStatus: "paid" as const }
            : b
        )
      );
    } catch (error) {
      console.error("Error marking all as paid:", error);
    } finally {
      setBulkUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign className="text-green-600" size={28} />
          รายได้โปร
        </h1>
        <p className="text-gray-500 mt-1">
          จัดการการจ่ายเงินให้โปรรายนัด
        </p>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <Select
              label="โปร"
              placeholder="โปรทั้งหมด"
              size="sm"
              className="max-w-xs"
              selectedKeys={filterProId ? [filterProId] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFilterProId(selected || "");
              }}
            >
              {pros.map((pro) => (
                <SelectItem key={pro.uid} textValue={getUserDisplayName(pro)}>
                  <div className="flex items-center gap-2">
                    <Users size={14} />
                    <span>{getUserDisplayName(pro)}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      ส่วนแบ่ง{" "}
                      {((1 - (pro.commissionRate ?? 0.3)) * 100).toFixed(0)}%
                    </span>
                  </div>
                </SelectItem>
              ))}
            </Select>

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

            {unpaidRows.length > 0 && (
              <Button
                className="py-6"
                color="success"
                variant="flat"
                isLoading={bulkUpdating}
                startContent={!bulkUpdating && <CheckCircle size={14} />}
                onPress={markAllAsPaid}
              >
                จ่ายทั้งหมด ({unpaidRows.length})
              </Button>
            )}
          </div>
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

      <IncomeBookingsTable
        rows={sortedRows}
        studentMap={studentMap}
        proMap={proMap}
        onTogglePaid={togglePaidStatus}
        updatingIds={updatingIds}
      />
    </div>
  );
}
