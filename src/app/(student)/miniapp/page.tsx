"use client";

import { useMiniApp } from "@/hooks/useMiniApp";
import { useEffect, useState } from "react";
import { Card, CardBody, Spinner, Avatar, Button, Input } from "@heroui/react";
import { ScanLine, CheckCircle, KeyRound, ChevronRight } from "lucide-react";
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
          student.courseId
            ? fetch("/api/courses?includeHidden=true")
            : Promise.resolve(null),
          fetch(`/api/bookings?studentId=${student.uid}`),
        ]);
        if (hoursRes.ok) {
          setHours(await hoursRes.json());
        }
        if (coursesRes && coursesRes.ok && student.courseId) {
          const allCourses: Course[] = await coursesRes.json();
          const found = allCourses.find((c) => c.id === student.courseId);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-500 text-sm text-center">{miniAppError}</p>
      </div>
    );
  }

  // --- Not linked: Activation screen ---
  if (!isLinked || !student) {
    return (
      <div className="space-y-6 pb-8 pt-2">
        {/* Greeting */}
        <div className="flex items-center gap-3.5">
          <Avatar
            src={profile?.pictureUrl}
            name={profile?.displayName}
            size="lg"
            className="shrink-0"
          />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-gray-900 truncate">
              {profile?.displayName}
            </p>
            <p className="text-sm text-gray-400">ยินดีต้อนรับ</p>
          </div>
        </div>

        {/* Activation card */}
        <div className="space-y-5">
          <div className="text-center pt-4">
            <h2 className="text-lg font-semibold text-gray-900">
              เปิดใช้งานบัญชี
            </h2>
            <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
              สแกน QR Code ที่ได้รับจากสถาบัน
              <br />
              เพื่อเชื่อมต่อบัญชี LINE ของคุณ
            </p>
          </div>

          {activateSuccess && (
            <div className="bg-emerald-50 rounded-xl p-3.5 flex items-center gap-2.5">
              <CheckCircle
                size={18}
                className="text-emerald-500 shrink-0"
              />
              <p className="text-sm text-emerald-700">
                เชื่อมต่อสำเร็จ! กำลังโหลดข้อมูล...
              </p>
            </div>
          )}

          {activateError && (
            <div className="bg-red-50 rounded-xl p-3.5">
              <p className="text-sm text-red-600">{activateError}</p>
            </div>
          )}

          <Button
            color="success"
            className="w-full text-white font-medium h-12 text-base"
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
        </div>
      </div>
    );
  }

  // --- Linked: Dashboard ---
  const remaining = hours?.remainingHours ?? 0;

  const menuItems = [
    { href: "/hours", label: "ชั่วโมงเรียน", sub: "ดูยอดคงเหลือ", dot: "bg-emerald-400" },
    { href: "/history", label: "ประวัติเรียน", sub: "ดูนัดหมายทั้งหมด", dot: "bg-blue-400" },
    { href: "/reviews", label: "รีวิวจากโปร", sub: "ผลการเรียนและคอมเมนต์", dot: "bg-purple-400" },
    { href: "/payment", label: "ชำระเงิน", sub: "เติมชั่วโมงเรียน", dot: "bg-orange-400" },
  ];

  return (
    <div className="space-y-6 pb-6 pt-2">
      {/* Profile & hours hero */}
      <Card className="shadow-sm border-0 overflow-hidden">
        <CardBody className="p-0">
          <div className="flex items-center gap-3.5 p-4">
            <Avatar
              src={student.avatarUrl || profile?.pictureUrl}
              name={student.displayName}
              size="lg"
              className="shrink-0 ring-2 ring-emerald-100"
            />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-gray-900 truncate">
                {student.nickname || student.displayName}
              </p>
              {course && (
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {course.name}
                </p>
              )}
            </div>
          </div>
          {!hoursLoading && (
            <Link href="/hours" className="block">
              <div className="bg-emerald-50 px-4 py-3.5 flex items-center justify-between active:bg-emerald-100 transition-colors">
                <div>
                  <p className="text-xs text-emerald-600/70">ชั่วโมงคงเหลือ</p>
                  <p className="text-2xl font-bold text-emerald-700 leading-tight mt-0.5">
                    {remaining}{" "}
                    <span className="text-sm font-normal text-emerald-500">
                      ชั่วโมง
                    </span>
                  </p>
                </div>
                <ChevronRight size={18} className="text-emerald-400" />
              </div>
            </Link>
          )}
        </CardBody>
      </Card>

      {/* Upcoming bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">นัดหมายถัดไป</p>
            <Link
              href="/history"
              className="text-xs text-gray-400"
            >
              ดูทั้งหมด
            </Link>
          </div>
          <Card className="shadow-sm border-0 overflow-hidden">
            <CardBody className="p-0">
              {upcomingBookings.map((booking, idx) => (
                <Link key={booking.id} href="/history" className="block">
                  <div
                    className={`flex items-center gap-3.5 px-4 py-3.5 active:bg-gray-50 transition-colors ${
                      idx < upcomingBookings.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    {/* Date badge */}
                    <div className="w-11 h-11 bg-blue-50 rounded-xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-medium text-blue-400 uppercase leading-none">
                        {format(new Date(booking.date), "MMM", { locale: th })}
                      </span>
                      <span className="text-base font-semibold text-blue-600 leading-none mt-0.5">
                        {format(new Date(booking.date), "d")}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {format(new Date(booking.date), "EEEE", { locale: th })}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {booking.startTime} – {booking.endTime}
                        {booking.proName && ` · ${booking.proName}`}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-gray-300 shrink-0"
                    />
                  </div>
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Menu */}
      <div>
        <Card className="shadow-sm border-0 overflow-hidden">
          <CardBody className="p-0">
            {menuItems.map((item, idx) => (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={`flex items-center gap-3.5 px-4 py-3.5 active:bg-gray-50 transition-colors ${
                    idx < menuItems.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <div className={`w-2.5 h-2.5 ${item.dot} rounded-full shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-gray-300 shrink-0"
                  />
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
