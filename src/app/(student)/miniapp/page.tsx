"use client";

import { useMiniApp } from "@/hooks/useMiniApp";
import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Avatar,
  Button,
  Input,
  Progress,
} from "@heroui/react";
import {
  Clock,
  BookOpen,
  MessageSquare,
  CreditCard,
  ScanLine,
  CheckCircle,
  KeyRound,
  ChevronRight,
  Zap,
  CalendarClock,
  User,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { StudentHours, Course, Booking } from "@/types";

export default function MiniAppHomePage() {
  const {
    profile,
    student,
    loading: miniAppLoading,
    error: miniAppError,
    isLinked,
    activate,
  } = useMiniApp();
  const [hours, setHours] = useState<StudentHours | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [hoursLoading, setHoursLoading] = useState(false);

  // Activation state
  const [code, setCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState("");
  const [activateSuccess, setActivateSuccess] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    if (!student) return;

    const fetchData = async () => {
      setHoursLoading(true);
      try {
        const [hoursRes, coursesRes, bookingsRes] = await Promise.all([
          fetch(`/api/student-hours/${student.uid}`),
          student.courseId ? fetch("/api/courses?includeHidden=true") : Promise.resolve(null),
          fetch(`/api/bookings?studentId=${student.uid}`),
        ]);
        if (hoursRes.ok) {
          setHours(await hoursRes.json());
        }
        if (coursesRes && coursesRes.ok && student.courseId) {
          const allCourses: Course[] = await coursesRes.json();
          const found = allCourses.find(
            (c) => c.id === student.courseId
          );
          setCourse(found || null);
        }
        if (bookingsRes.ok) {
          const allBookings: Booking[] = await bookingsRes.json();
          const today = format(new Date(), "yyyy-MM-dd");
          const upcoming = allBookings
            .filter((b) => b.status === "scheduled" && b.date >= today)
            .sort((a, b) => {
              if (a.date !== b.date) return a.date.localeCompare(b.date);
              return a.startTime.localeCompare(b.startTime);
            })
            .slice(0, 3);
          setUpcomingBookings(upcoming);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setHoursLoading(false);
      }
    };

    fetchData();
  }, [student]);

  const handleActivate = async (activationCode: string) => {
    if (!activationCode.trim()) return;
    setActivating(true);
    setActivateError("");
    setActivateSuccess(false);

    const result = await activate(activationCode);
    if (result.success) {
      setActivateSuccess(true);
      setCode("");
    } else {
      setActivateError(result.error || "เกิดข้อผิดพลาด");
    }
    setActivating(false);
  };

  const handleScan = async () => {
    setActivateError("");
    try {
      const liffModule = (await import("@line/liff")).default;
      if (liffModule.isInClient()) {
        const result = await liffModule.scanCodeV2();
        if (result.value) {
          await handleActivate(result.value);
        }
      } else {
        setShowManualInput(true);
      }
    } catch (err) {
      console.error("Scan error:", err);
      setShowManualInput(true);
    }
  };

  // --- Loading ---
  if (miniAppLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" color="success" />
        <p className="text-sm text-gray-400">กำลังโหลด...</p>
      </div>
    );
  }

  // --- Error ---
  if (miniAppError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <Zap size={28} className="text-red-400" />
        </div>
        <p className="text-red-500 text-sm text-center">{miniAppError}</p>
      </div>
    );
  }

  // --- Not linked: Activation screen ---
  if (!isLinked || !student) {
    return (
      <div className="space-y-5 pb-8">
        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-500 via-green-500 to-teal-600 p-5 text-white shadow-lg">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute -right-2 bottom-0 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative flex items-center gap-4">
            <Avatar
              src={profile?.pictureUrl}
              name={profile?.displayName}
              size="lg"
              className="ring-2 ring-white/30 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-lg font-bold truncate">
                {profile?.displayName}
              </p>
              <p className="text-emerald-100 text-sm">
                สวัสดี! ยินดีต้อนรับ
              </p>
            </div>
          </div>
        </div>

        {/* Activation card */}
        <Card className="shadow-lg border-0">
          <CardBody className="p-6 space-y-5">
            <div className="text-center">
              <div className="inline-flex p-4 bg-emerald-50 rounded-2xl mb-4">
                <ScanLine size={36} className="text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">
                เปิดใช้งานบัญชี
              </h2>
              <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                สแกน QR Code ที่ได้รับจากสถาบัน
                <br />
                เพื่อเชื่อมต่อบัญชี LINE ของคุณ
              </p>
            </div>

            {activateSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2.5 animate-appearance-in">
                <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-700">
                  เชื่อมต่อสำเร็จ! กำลังโหลดข้อมูล...
                </p>
              </div>
            )}

            {activateError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
                <p className="text-sm text-red-600">{activateError}</p>
              </div>
            )}

            <Button
              color="success"
              className="w-full text-white font-semibold h-12 text-base"
              size="lg"
              isLoading={activating}
              onPress={handleScan}
              startContent={!activating && <ScanLine size={20} />}
              radius="lg"
            >
              สแกน QR Code
            </Button>

            {!showManualInput && (
              <button
                type="button"
                className="text-xs text-gray-400 underline underline-offset-2 w-full text-center py-1"
                onClick={() => setShowManualInput(true)}
              >
                กรอกรหัสด้วยตนเอง
              </button>
            )}

            {showManualInput && (
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  หรือวางรหัสเปิดใช้งานด้านล่าง
                </p>
                <Input
                  label="รหัสเปิดใช้งาน"
                  placeholder="วางรหัสที่ได้รับจากสถาบัน"
                  value={code}
                  onValueChange={setCode}
                  variant="bordered"
                  size="lg"
                  radius="lg"
                  classNames={{
                    input: "text-xs",
                    inputWrapper: "border-gray-200",
                  }}
                />
                <Button
                  color="success"
                  variant="flat"
                  className="w-full font-medium h-11"
                  size="md"
                  isLoading={activating}
                  isDisabled={!code.trim()}
                  onPress={() => handleActivate(code)}
                  startContent={!activating && <KeyRound size={16} />}
                  radius="lg"
                >
                  เปิดใช้งานด้วยรหัส
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    );
  }

  // --- Linked: Dashboard ---
  const remaining = hours?.remainingHours ?? 0;
  const totalPurchased = hours?.totalHoursPurchased ?? 0;
  const totalUsed = hours?.totalHoursUsed ?? 0;
  const progressValue =
    totalPurchased > 0 ? (totalUsed / totalPurchased) * 100 : 0;

  const navItems = [
    {
      href: "/history",
      icon: BookOpen,
      label: "ประวัติเรียน",
      color: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      href: "/reviews",
      icon: MessageSquare,
      label: "รีวิวจากโปร",
      color: "bg-purple-50",
      iconColor: "text-purple-500",
    },
    {
      href: "/hours",
      icon: Clock,
      label: "ชั่วโมงเรียน",
      color: "bg-emerald-50",
      iconColor: "text-emerald-500",
    },
    {
      href: "/payment",
      icon: CreditCard,
      label: "ชำระเงิน",
      color: "bg-orange-50",
      iconColor: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-4 pb-6">
      {/* Profile banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-500 via-green-500 to-teal-600 p-5 text-white shadow-lg">
        <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full" />
        <div className="absolute -right-2 bottom-0 w-20 h-20 bg-white/5 rounded-full" />
        <div className="relative flex items-center gap-4">
          <Avatar
            src={student.avatarUrl || profile?.pictureUrl}
            name={student.displayName}
            size="lg"
            className="ring-2 ring-white/30 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-lg font-bold truncate">
              {student.displayName}
            </p>
            {student.nickname && (
              <p className="text-emerald-100 text-sm">
                ({student.nickname})
              </p>
            )}
            {course && (
              <p className="text-emerald-200 text-xs mt-0.5 truncate">
                {course.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Hours summary card */}
      {hoursLoading ? (
        <Card className="shadow-md border-0">
          <CardBody className="flex items-center justify-center p-8">
            <Spinner size="sm" color="success" />
          </CardBody>
        </Card>
      ) : (
        <Card className="shadow-md border-0">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">
                ชั่วโมงคงเหลือ
              </p>
              <Link
                href="/hours"
                className="text-xs text-emerald-500 font-medium"
              >
                ดูทั้งหมด
              </Link>
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-4xl font-bold text-emerald-600 leading-none">
                {remaining}
              </span>
              <span className="text-sm text-gray-400 pb-0.5">ชั่วโมง</span>
            </div>
            <Progress
              value={progressValue}
              color="success"
              size="sm"
              className="mb-2"
              aria-label="ชั่วโมงที่ใช้ไป"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>ใช้ไป {totalUsed} ชม.</span>
              <span>ทั้งหมด {totalPurchased} ชม.</span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Upcoming timetable */}
      {upcomingBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-blue-500" />
              <p className="text-sm font-semibold text-gray-600">
                นัดหมายถัดไป
              </p>
            </div>
            <Link
              href="/history"
              className="text-xs text-emerald-500 font-medium"
            >
              ดูทั้งหมด
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingBookings.map((booking) => (
              <Card key={booking.id} className="shadow-sm border-0">
                <CardBody className="p-3.5">
                  <div className="flex items-center gap-3">
                    {/* Date badge */}
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-medium text-blue-400 uppercase leading-none">
                        {format(new Date(booking.date), "MMM", { locale: th })}
                      </span>
                      <span className="text-lg font-bold text-blue-600 leading-none mt-0.5">
                        {format(new Date(booking.date), "d")}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-700">
                        {format(new Date(booking.date), "EEEE", {
                          locale: th,
                        })}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} className="text-gray-400" />
                          {booking.startTime} - {booking.endTime}
                        </span>
                        {booking.proName && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <User size={12} className="text-gray-400" />
                            {booking.proName}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Navigation grid */}
      <div className="grid grid-cols-2 gap-3">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card
              isPressable
              className="shadow-sm border-0 hover:shadow-md active:scale-[0.97] transition-all h-full w-full"
            >
              <CardBody className="flex flex-col items-center gap-2.5 p-5 text-center">
                <div className={`p-3 ${item.color} rounded-xl`}>
                  <item.icon size={22} className={item.iconColor} />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {item.label}
                </p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
