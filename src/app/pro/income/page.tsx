"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  Divider,
} from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, TrendingUp, CalendarDays, Wallet } from "lucide-react";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale/th";
import type { AppUser, Booking, Course } from "@/types";

export default function ProIncomePage() {
  const { user, firebaseUser, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("current");

  useEffect(() => {
    if (!user || !firebaseUser) return;

    const fetchData = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [bookingsRes, studentsRes, coursesRes] = await Promise.all([
          fetch(`/api/bookings?proId=${user.uid}`, { headers }),
          fetch("/api/users?role=student", { headers }),
          fetch("/api/courses"),
        ]);

        if (bookingsRes.ok) {
          setBookings(await bookingsRes.json());
        }
        if (studentsRes.ok) {
          setStudents(await studentsRes.json());
        }
        if (coursesRes.ok) {
          setCourses(await coursesRes.json());
        }
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

  // commissionRate = owner's percentage cut (e.g., 0.3 = 30% to owner, 70% to pro)
  const commissionRate = user?.commissionRate ?? 0.3;
  const proShare = 1 - commissionRate;
  const completedBookings = bookings.filter((b) => b.status === "completed");

  // Build lookup maps
  const studentMap = new Map(students.map((s) => [s.uid, s]));
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const calcHours = (b: Booking) => {
    const start = new Date(`1970-01-01T${b.startTime}`).getTime();
    const end = new Date(`1970-01-01T${b.endTime}`).getTime();
    return (end - start) / 3600000;
  };

  const getHourlyRate = (b: Booking): number => {
    const student = studentMap.get(b.studentId);
    if (student?.courseId) {
      const course = courseMap.get(student.courseId);
      if (course && course.hours > 0) {
        return course.price / course.hours;
      }
    }
    return 0;
  };

  const calcProIncome = (b: Booking) => {
    const hourlyRate = getHourlyRate(b);
    const hours = calcHours(b);
    return hourlyRate * hours * proShare;
  };

  // Group by month
  const monthlyData: Record<
    string,
    { label: string; bookings: Booking[]; total: number }
  > = {};

  completedBookings.forEach((b) => {
    const d = parseISO(b.date);
    const key = format(d, "yyyy-MM");
    const label = format(d, "MMMM yyyy", { locale: th });

    if (!monthlyData[key]) {
      monthlyData[key] = { label, bookings: [], total: 0 };
    }
    monthlyData[key].bookings.push(b);
    monthlyData[key].total += calcProIncome(b);
  });

  const sortedMonths = Object.keys(monthlyData).sort().reverse();

  const now = new Date();
  const currentMonthKey = format(now, "yyyy-MM");
  const currentMonthData = monthlyData[currentMonthKey];

  const totalIncome = completedBookings.reduce(
    (acc, b) => acc + calcProIncome(b),
    0
  );
  const currentMonthIncome = currentMonthData?.total ?? 0;
  const currentMonthLessons = currentMonthData?.bookings.length ?? 0;

  const displayBookings =
    selectedTab === "current"
      ? currentMonthData?.bookings ?? []
      : completedBookings;

  const sortedDisplayBookings = [...displayBookings].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign className="text-green-600" size={28} />
          รายได้
        </h1>
        <p className="text-gray-500 mt-1">
          ส่วนแบ่งโปร: {(proShare * 100).toFixed(0)}% ·
          ส่วนแบ่งเจ้าของ: {(commissionRate * 100).toFixed(0)}%
        </p>
      </div>

      {/* Income Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4 p-5">
            <div className="p-3 bg-green-100 rounded-xl">
              <Wallet className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">รายได้เดือนนี้</p>
              <p className="text-2xl font-bold text-green-600">
                ฿{currentMonthIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4 p-5">
            <div className="p-3 bg-blue-100 rounded-xl">
              <CalendarDays className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">สอนเดือนนี้</p>
              <p className="text-2xl font-bold text-gray-800">
                {currentMonthLessons}{" "}
                <span className="text-sm font-normal text-gray-400">นัด</span>
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="flex flex-row items-center gap-4 p-5">
            <div className="p-3 bg-amber-100 rounded-xl">
              <TrendingUp className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">รายได้ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-800">
                ฿{totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      {sortedMonths.length > 1 && (
        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="p-5">
            <h2 className="font-semibold text-gray-800 mb-3">
              สรุปรายเดือน
            </h2>
            <div className="space-y-2">
              {sortedMonths.map((key) => {
                const data = monthlyData[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-700">{data.label}</p>
                      <p className="text-sm text-gray-400">
                        {data.bookings.length} นัด
                      </p>
                    </div>
                    <p className="font-bold text-green-600">
                      ฿{data.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tabs & Detail Table */}
      <Card className="border border-gray-100 shadow-sm">
        <CardBody className="p-5">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            color="success"
            variant="underlined"
            classNames={{
              tabList: "mb-4",
            }}
          >
            <Tab key="current" title="เดือนนี้" />
            <Tab key="all" title="ทั้งหมด" />
          </Tabs>

          <Divider className="mb-4" />

          {sortedDisplayBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <DollarSign size={40} className="mx-auto mb-2 opacity-50" />
              <p>ยังไม่มีรายได้</p>
            </div>
          ) : (
            <Table
              aria-label="ตารางรายได้"
              removeWrapper
              classNames={{
                th: "bg-gray-50 text-gray-600 font-semibold",
              }}
            >
              <TableHeader>
                <TableColumn>วันที่</TableColumn>
                <TableColumn>นักเรียน</TableColumn>
                <TableColumn>รายละเอียด</TableColumn>
                <TableColumn className="text-right">จำนวนเงิน</TableColumn>
              </TableHeader>
              <TableBody>
                {sortedDisplayBookings.map((booking) => {
                  const hours = calcHours(booking);
                  const hourlyRate = getHourlyRate(booking);
                  const income = calcProIncome(booking);
                  const student = studentMap.get(booking.studentId);
                  const courseName = student?.courseId
                    ? courseMap.get(student.courseId)?.name
                    : undefined;

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
                          {booking.studentName || student?.displayName || "นักเรียน"}
                        </p>
                        {courseName && (
                          <p className="text-xs text-gray-400">{courseName}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-gray-600">
                          {hours} ชม. × ฿{hourlyRate.toLocaleString(undefined, { maximumFractionDigits: 0 })}/ชม.
                          × {(proShare * 100).toFixed(0)}%
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-bold text-green-600">
                          ฿{income.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
