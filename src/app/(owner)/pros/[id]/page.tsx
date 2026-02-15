"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardBody,
  Spinner,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Avatar,
} from "@heroui/react";
import {
  User,
  Mail,
  Phone,
  Percent,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { th } from "date-fns/locale/th";
import { getUserDisplayName } from "@/lib/utils";
import type { AppUser, Booking } from "@/types";

export default function ProProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { firebaseUser } = useAuth();
  const [pro, setPro] = useState<AppUser | null>(null);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!firebaseUser || !id) return;
    try {
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [proRes, studentsRes, bookingsRes] = await Promise.all([
        fetch(`/api/users/${id}`, { headers }),
        fetch(`/api/users?role=student&proId=${id}`, { headers }),
        fetch(`/api/bookings?proId=${id}&status=completed`, { headers }),
      ]);

      if (!proRes.ok) throw new Error("ไม่พบข้อมูลโปรโค้ช");

      const proData = await proRes.json();
      const studentsData = studentsRes.ok ? await studentsRes.json() : [];
      const bookingsData = bookingsRes.ok ? await bookingsRes.json() : [];

      setPro(proData);
      setStudents(studentsData);
      setBookings(bookingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  if (error || !pro) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-500">{error || "ไม่พบข้อมูล"}</p>
      </div>
    );
  }

  const bookingStatusMap: Record<string, { label: string; color: "success" | "warning" | "danger" }> = {
    scheduled: { label: "นัดหมายแล้ว", color: "warning" },
    completed: { label: "เสร็จสิ้น", color: "success" },
    cancelled: { label: "ยกเลิก", color: "danger" },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">โปรไฟล์โปรโค้ช</h1>

      {/* Pro Info Card */}
      <Card className="shadow-sm">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar
              name={pro.displayName}
              src={pro.avatarUrl}
              size="lg"
              className="bg-green-100 text-green-700"
            />
            <div className="flex-1 space-y-3">
              <h2 className="text-xl font-semibold text-gray-800">
                {pro.displayName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  {pro.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  {pro.phone || "-"}
                </div>
                <div className="flex items-center gap-2">
                  <Percent size={16} className="text-gray-400" />
                  ค่าคอมมิชชัน {((pro.commissionRate ?? 0) * 100).toFixed(0)}%
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-gray-400" />
                  สร้างเมื่อ{" "}
                  {format(new Date(pro.createdAt), "d MMM yyyy", {
                    locale: th,
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <Tabs
        aria-label="โปรโค้ชแท็บ"
        color="success"
        variant="underlined"
        classNames={{
          tabList: "gap-6",
        }}
      >
        {/* Tab: Students */}
        <Tab key="students" title={`นักเรียน (${students.length})`}>
          <Card className="shadow-sm mt-4">
            <CardBody className="p-0">
              {students.length === 0 ? (
                <p className="text-gray-400 text-center py-12">
                  ยังไม่มีนักเรียนในการดูแล
                </p>
              ) : (
                <Table aria-label="รายชื่อนักเรียน" removeWrapper>
                  <TableHeader>
                    <TableColumn>ชื่อ</TableColumn>
                    <TableColumn>เบอร์โทร</TableColumn>
                    <TableColumn>วันที่สร้าง</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.uid}>
                        <TableCell className="font-medium">
                          {getUserDisplayName(student)}
                        </TableCell>
                        <TableCell>{student.phone || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(student.createdAt), "d MMM yyyy", {
                            locale: th,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>

        {/* Tab: Teaching History */}
        <Tab key="history" title={`ประวัติการสอน (${bookings.length})`}>
          <Card className="shadow-sm mt-4">
            <CardBody className="p-0">
              {bookings.length === 0 ? (
                <p className="text-gray-400 text-center py-12">
                  ยังไม่มีประวัติการสอน
                </p>
              ) : (
                <Table aria-label="ประวัติการสอน" removeWrapper>
                  <TableHeader>
                    <TableColumn>นักเรียน</TableColumn>
                    <TableColumn>วันที่</TableColumn>
                    <TableColumn>เวลา</TableColumn>
                    <TableColumn>สถานะ</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {getUserDisplayName(students.find((s) => s.uid === booking.studentId), "-")}
                        </TableCell>
                        <TableCell>
                          {format(new Date(booking.date), "d MMM yyyy", {
                            locale: th,
                          })}
                        </TableCell>
                        <TableCell>
                          {booking.startTime} - {booking.endTime}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            color={
                              bookingStatusMap[booking.status]?.color ??
                              "default"
                            }
                            variant="flat"
                          >
                            {bookingStatusMap[booking.status]?.label ??
                              booking.status}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>

      </Tabs>
    </div>
  );
}
