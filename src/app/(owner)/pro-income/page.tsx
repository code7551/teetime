"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Chip,
  Select,
  SelectItem,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Divider,
} from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import {
  DollarSign,
  Wallet,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  Users,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale/th";
import { getUserDisplayName } from "@/lib/utils";
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
  const [filterMonth, setFilterMonth] = useState(() => format(new Date(), "yyyy-MM"));

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

  // Lookup maps
  const proMap = new Map(pros.map((p) => [p.uid, p]));
  const studentMap = new Map(students.map((s) => [s.uid, s]));

  const calcHours = (b: Booking) => {
    const start = new Date(`1970-01-01T${b.startTime}`).getTime();
    const end = new Date(`1970-01-01T${b.endTime}`).getTime();
    return (end - start) / 3600000;
  };

  const getHourlyRate = (b: Booking): number => {
    return b.hourlyRate ?? 0;
  };

  const getProShare = (proId: string): number => {
    const pro = proMap.get(proId);
    const commissionRate = pro?.commissionRate ?? 0.3;
    return 1 - commissionRate;
  };

  const calcProIncome = (b: Booking) => {
    const hourlyRate = getHourlyRate(b);
    const hours = calcHours(b);
    return hourlyRate * hours * getProShare(b.proId);
  };

  // Generate month options (last 12 months)
  const monthOptions: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push({
      key: format(d, "yyyy-MM"),
      label: format(d, "MMMM yyyy", { locale: th }),
    });
  }

  // Summary calculations
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const totalIncome = completedBookings.reduce((acc, b) => acc + calcProIncome(b), 0);
  const paidBookings = completedBookings.filter((b) => b.paidStatus === "paid");
  const unpaidBookings = completedBookings.filter((b) => b.paidStatus !== "paid");
  const totalPaid = paidBookings.reduce((acc, b) => acc + calcProIncome(b), 0);
  const totalUnpaid = unpaidBookings.reduce((acc, b) => acc + calcProIncome(b), 0);

  const sortedBookings = [...completedBookings].sort((a, b) =>
    b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)
  );

  const togglePaidStatus = async (bookingId: string, currentStatus?: string) => {
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
      // Update local state
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
          รายได้โปรโค้ช
        </h1>
        <p className="text-gray-500 mt-1">
          จัดการการจ่ายเงินให้โปรโค้ชรายนัด
        </p>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <Select
              label="โปรโค้ช"
              placeholder="โปรโค้ชทั้งหมด"
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
                      ส่วนแบ่ง {((1 - (pro.commissionRate ?? 0.3)) * 100).toFixed(0)}%
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

            {unpaidBookings.length > 0 && (
              <Button
              className="py-6"
                color="success"
                variant="flat"
                isLoading={bulkUpdating}
                startContent={!bulkUpdating && <CheckCircle size={14} />}
                onPress={markAllAsPaid}
              >
                จ่ายทั้งหมด ({unpaidBookings.length})
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4 p-5">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Wallet className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">รายได้โปรทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-800">
                ฿{totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
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
              <p className="text-2xl font-bold text-green-600">
                ฿{totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-400">{paidBookings.length} นัด</p>
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
              <p className="text-2xl font-bold text-amber-600">
                ฿{totalUnpaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-400">{unpaidBookings.length} นัด</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card className="border border-gray-100 shadow-sm">
        <CardBody className="p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CalendarDays size={18} className="text-gray-500" />
            รายละเอียดรายนัด ({sortedBookings.length} นัด)
          </h2>

          <Divider className="mb-4" />

          {sortedBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <DollarSign size={40} className="mx-auto mb-2 opacity-50" />
              <p>ไม่มีรายการในเดือนนี้</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table
                aria-label="ตารางรายได้โปร"
                removeWrapper
                classNames={{
                  th: "bg-gray-50 text-gray-600 font-semibold",
                }}
              >
                <TableHeader>
                  <TableColumn>วันที่</TableColumn>
                  <TableColumn>โปรโค้ช</TableColumn>
                  <TableColumn>นักเรียน</TableColumn>
                  <TableColumn>รายละเอียด</TableColumn>
                  <TableColumn className="text-right">รายได้โปร</TableColumn>
                  <TableColumn className="text-center">สถานะ</TableColumn>
                  <TableColumn className="text-center">จัดการ</TableColumn>
                </TableHeader>
                <TableBody>
                  {sortedBookings.map((booking) => {
                    const hours = calcHours(booking);
                    const hourlyRate = getHourlyRate(booking);
                    const proShare = getProShare(booking.proId);
                    const income = calcProIncome(booking);
                    const pro = proMap.get(booking.proId);
                    const student = studentMap.get(booking.studentId);
                    const isPaid = booking.paidStatus === "paid";
                    const isUpdating = updatingIds.has(booking.id);

                    return (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <p className="text-gray-700">
                            {format(parseISO(booking.date), "d MMM yyyy", {
                              locale: th,
                            })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {booking.startTime} - {booking.endTime}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-gray-800">
                            {getUserDisplayName(pro, "โปร")}
                          </p>
                          <p className="text-xs text-gray-400">
                            ส่วนแบ่ง {(proShare * 100).toFixed(0)}%
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-gray-700">
                            {getUserDisplayName(student, "นักเรียน")}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-gray-600 text-sm">
                            {hours} ชม. x ฿
                            {hourlyRate.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                            /ชม. x {(proShare * 100).toFixed(0)}%
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-bold text-green-600">
                            ฿{income.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Chip
                            size="sm"
                            variant="flat"
                            color={isPaid ? "success" : "warning"}
                          >
                            {isPaid ? "จ่ายแล้ว" : "ยังไม่จ่าย"}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="flat"
                            color={isPaid ? "default" : "success"}
                            isLoading={isUpdating}
                            onPress={() =>
                              togglePaidStatus(booking.id, booking.paidStatus)
                            }
                          >
                            {isPaid ? "ยกเลิก" : "จ่ายแล้ว"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
