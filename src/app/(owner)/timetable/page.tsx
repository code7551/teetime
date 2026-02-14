"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Chip,
  useDisclosure,
  Tooltip,
} from "@heroui/react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  GraduationCap,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { th } from "date-fns/locale/th";
import type { AppUser, Booking, BookingStatus } from "@/types";
import { findUserByUid } from "@/lib/utils";

const createBookingSchema = z.object({
  studentId: z.string().min(1, "กรุณาเลือกนักเรียน"),
  proId: z.string().min(1, "กรุณาเลือกโปรโค้ช"),
  date: z.string().min(1, "กรุณาเลือกวันที่"),
  startTime: z.string().min(1, "กรุณาเลือกเวลาเริ่ม"),
});

type CreateBookingForm = z.infer<typeof createBookingSchema>;

const bookingStatusConfig: Record<
  BookingStatus,
  { label: string; color: "warning" | "success" | "danger" }
> = {
  scheduled: { label: "นัดหมาย", color: "warning" },
  completed: { label: "เสร็จสิ้น", color: "success" },
  cancelled: { label: "ยกเลิก", color: "danger" },
};

const DAY_LABELS = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

export default function TimetablePage() {
  const { firebaseUser } = useAuth();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pros, setPros] = useState<AppUser[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterProId, setFilterProId] = useState("");
  const [filterStudentId, setFilterStudentId] = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const usersLoadedRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateBookingForm>({
    resolver: zodResolver(createBookingSchema),
  });

  // Compute calendar grid dates for the month (6-week grid)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Stable string keys for memo/effect deps
  const calStartStr = useMemo(
    () => format(calendarStart, "yyyy-MM-dd"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentMonth.getMonth(), currentMonth.getFullYear()]
  );
  const calEndStr = useMemo(
    () => format(calendarEnd, "yyyy-MM-dd"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentMonth.getMonth(), currentMonth.getFullYear()]
  );

  const fetchBookings = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      params.set("startDate", calStartStr);
      params.set("endDate", calEndStr);
      if (filterProId) params.set("proId", filterProId);
      if (filterStudentId) params.set("studentId", filterStudentId);

      const res = await fetch(`/api/bookings?${params.toString()}`, {
        headers,
      });
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
      setBookings(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }, [firebaseUser, calStartStr, calEndStr, filterProId, filterStudentId]);

  const fetchUsers = useCallback(async () => {
    if (!firebaseUser || usersLoadedRef.current) return;
    try {
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [prosRes, studentsRes] = await Promise.all([
        fetch("/api/users?role=pro", { headers }),
        fetch("/api/users?role=student", { headers }),
      ]);
      setPros(prosRes.ok ? await prosRes.json() : []);
      setStudents(studentsRes.ok ? await studentsRes.json() : []);
      usersLoadedRef.current = true;
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchBookings();
      setLoading(false);
    };
    load();
  }, [fetchBookings]);

  const bookingsByDay = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    calendarDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      map[key] = bookings.filter((b) => b.date === key);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, calStartStr]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!firebaseUser) return;
    if (!confirm("ยืนยันยกเลิกการจองนี้?")) return;
    setCancellingId(bookingId);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "ไม่สามารถยกเลิกการจองได้");
      }
      await fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setCancellingId(null);
    }
  };

  const handleAddBooking = (dateStr?: string) => {
    reset();
    if (dateStr) {
      setValue("date", dateStr);
    }
    onOpen();
  };

  const onSubmit = async (formData: CreateBookingForm) => {
    if (!firebaseUser) return;
    setSubmitting(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "ไม่สามารถสร้างการจองได้");
      }
      reset();
      onClose();
      fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date();
  const selectedDayBookings = selectedDay ? bookingsByDay[selectedDay] || [] : [];


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ตารางเรียน</h1>
          <p className="text-gray-500 mt-1">จัดการตารางการเรียนการสอน</p>
        </div>
        <Button
          color="success"
          startContent={<Plus size={18} />}
          onPress={() => handleAddBooking()}
          className="text-white"
        >
          เพิ่มการจอง
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border border-red-200">
          <CardBody>
            <p className="text-red-600 text-sm">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <Select
              label="กรองตามโปรโค้ช"
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
                <SelectItem key={pro.uid} textValue={pro.displayName}>
                  {pro.displayName}
                </SelectItem>
              ))}
            </Select>
            <Select
              label="กรองตามนักเรียน"
              placeholder="นักเรียนทั้งหมด"
              size="sm"
              className="max-w-xs"
              selectedKeys={filterStudentId ? [filterStudentId] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFilterStudentId(selected || "");
              }}
            >
              {students.map((s) => (
                <SelectItem key={s.uid} textValue={s.displayName}>
                  {s.displayName}
                </SelectItem>
              ))}
            </Select>
            {(filterProId || filterStudentId) && (
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  setFilterProId("");
                  setFilterStudentId("");
                }}
              >
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="flat"
          size="sm"
          isIconOnly
          onPress={() => {
            setCurrentMonth(subMonths(currentMonth, 1));
            setSelectedDay(null);
          }}
        >
          <ChevronLeft size={18} />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-700">
            {format(currentMonth, "MMMM yyyy", { locale: th })}
          </h2>
          <button
            type="button"
            className="text-xs text-green-600 hover:underline mt-0.5"
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDay(format(new Date(), "yyyy-MM-dd"));
            }}
          >
            วันนี้
          </button>
        </div>
        <Button
          variant="flat"
          size="sm"
          isIconOnly
          onPress={() => {
            setCurrentMonth(addMonths(currentMonth, 1));
            setSelectedDay(null);
          }}
        >
          <ChevronRight size={18} />
        </Button>
      </div>

      {/* Monthly Calendar */}
      <Card className="shadow-sm overflow-hidden">
        <CardBody className="p-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-center py-2.5 text-xs font-semibold text-gray-500 uppercase"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayBookings = bookingsByDay[key] || [];
              const isToday = isSameDay(day, today);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDay === key;
              const hasBookings = dayBookings.length > 0;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(isSelected ? null : key)}
                  className={`relative min-h-[72px] md:min-h-[90px] p-1.5 border-b border-r border-gray-50 text-left transition-colors hover:bg-gray-50 ${
                    isSelected ? "bg-green-50 ring-1 ring-inset ring-green-300" : ""
                  } ${!isCurrentMonth ? "opacity-40" : ""}`}
                >
                  {/* Date number */}
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                      isToday
                        ? "bg-green-500 text-white"
                        : isSelected
                          ? "text-green-700 font-bold"
                          : "text-gray-700"
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Booking dots / previews */}
                  {hasBookings && (
                    <div className="mt-0.5 space-y-0.5">
                      {dayBookings.slice(0, 2).map((booking) => (
                        <div
                          key={booking.id}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
                            booking.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : booking.status === "cancelled"
                                ? "bg-red-100 text-red-600"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {booking.startTime} {booking.studentName?.split(" ")[0] ?? ""}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <p className="text-[10px] text-gray-400 px-1">
                          +{dayBookings.length - 2} อื่นๆ
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Selected day detail panel */}
      {selectedDay && (
        <Card className="shadow-sm border-l-4 border-green-400">
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-gray-800">
                {format(new Date(selectedDay + "T00:00:00"), "d MMMM yyyy (EEEE)", {
                  locale: th,
                })}
              </h3>
              <Button
                size="sm"
                color="success"
                variant="flat"
                startContent={<Plus size={14} />}
                onPress={() => handleAddBooking(selectedDay)}
              >
                เพิ่ม
              </Button>
            </div>

            {selectedDayBookings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                ไม่มีการจองในวันนี้
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`p-3 rounded-lg text-sm flex items-start gap-3 ${
                      booking.status === "completed"
                        ? "bg-green-50 border border-green-100"
                        : booking.status === "cancelled"
                          ? "bg-red-50 border border-red-100"
                          : "bg-amber-50 border border-amber-100"
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-500" />
                        <span className="font-medium text-gray-700">
                          {booking.startTime} - {booking.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap size={14} className="text-gray-500" />
                        <span className="text-gray-700">
                          {findUserByUid({ userDatas: students, uid: booking.studentId })?.displayName ?? "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-500" />
                        <span className="text-gray-600">
                          โปร {findUserByUid({ userDatas: pros, uid: booking.proId })?.displayName ?? "-"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Chip
                        size="sm"
                        color={
                          bookingStatusConfig[booking.status]?.color ?? "default"
                        }
                        variant="flat"
                      >
                        {bookingStatusConfig[booking.status]?.label ??
                          booking.status}
                      </Chip>
                      {booking.status === "scheduled" && (
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          startContent={<XCircle size={14} />}
                          isLoading={cancellingId === booking.id}
                          onPress={() => handleCancelBooking(booking.id)}
                        >
                          ยกเลิก
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Create Booking Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(onModalClose) => (
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalHeader className="text-gray-800">
                เพิ่มการจองใหม่
              </ModalHeader>
              <ModalBody className="gap-4">
                <Select
                  label="นักเรียน"
                  placeholder="เลือกนักเรียน"
                  {...register("studentId")}
                  isInvalid={!!errors.studentId}
                  errorMessage={errors.studentId?.message}
                >
                  {students.map((s) => (
                    <SelectItem key={s.uid} textValue={s.displayName}>
                      {s.displayName}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="โปรโค้ช"
                  placeholder="เลือกโปรโค้ช"
                  {...register("proId")}
                  isInvalid={!!errors.proId}
                  errorMessage={errors.proId?.message}
                >
                  {pros.map((pro) => (
                    <SelectItem key={pro.uid} textValue={pro.displayName}>
                      {pro.displayName}
                    </SelectItem>
                  ))}
                </Select>
                <Input
                  label="วันที่"
                  type="date"
                  {...register("date")}
                  isInvalid={!!errors.date}
                  errorMessage={errors.date?.message}
                />
                <div>
                  <Input
                    label="เวลาเริ่ม"
                    type="time"
                    {...register("startTime")}
                    isInvalid={!!errors.startTime}
                    errorMessage={errors.startTime?.message}
                  />
                  <p className="text-xs text-gray-400 mt-1">* การจองแต่ละครั้ง = 1 ชั่วโมง (เวลาสิ้นสุดจะคำนวณอัตโนมัติ)</p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onModalClose}>
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  color="success"
                  isLoading={submitting}
                  className="text-white"
                >
                  สร้างการจอง
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
