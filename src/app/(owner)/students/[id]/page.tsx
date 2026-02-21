"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
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
  Button,
  Snippet,
  Divider,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import {
  Phone,
  Clock,
  Users,
  RefreshCw,
  MessageCircle,
  Trash2,
  User,
  BookOpen,
  Target,
  Link,
} from "lucide-react";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { th } from "date-fns/locale/th";
import type { AppUser, Booking, Payment, StudentHours, Course } from "@/types";
import { calculateAge } from "@/lib/utils";

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { firebaseUser } = useAuth();
  const [student, setStudent] = useState<AppUser | null>(null);
  const [hours, setHours] = useState<StudentHours | null>(null);
  const [scheduledBookings, setScheduledBookings] = useState<Booking[]>([]);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [pros, setPros] = useState<AppUser[]>([]);
  const [lineDisplayNameMap, setLineDisplayNameMap] = useState<Record<string, string>>({});
  const [activationCode, setActivationCode] = useState("");
  const [generatingCode, setGeneratingCode] = useState(false);
  const [pendingLineAccounts, setPendingLineAccounts] = useState<
    { lineUserId: string; displayName: string; pictureUrl: string; email: string | null; source: string }[]
  >([]);
  const [selectedLineUserId, setSelectedLineUserId] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [linkMessage, setLinkMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!firebaseUser || !id) return;
    try {
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [
        studentRes,
        hoursRes,
        scheduledRes,
        completedRes,
        paymentsRes,
        prosRes,
        lineAccessesRes,
        pendingLineRes,
      ] = await Promise.all([
        fetch(`/api/users/${id}`, { headers }),
        fetch(`/api/student-hours/${id}`, { headers }),
        fetch(`/api/bookings?studentId=${id}&status=scheduled`, { headers }),
        fetch(`/api/bookings?studentId=${id}&status=completed`, { headers }),
        fetch(`/api/payments?studentId=${id}`, { headers }),
        fetch("/api/users?role=pro", { headers }),
        fetch("/api/line-accounts", { headers }),
        fetch("/api/pending-line-accounts", { headers }),
      ]);

      if (!studentRes.ok) throw new Error("ไม่พบข้อมูลนักเรียน");

      const studentData = await studentRes.json();
      const hoursData = hoursRes.ok ? await hoursRes.json() : null;
      const scheduledData = scheduledRes.ok ? await scheduledRes.json() : [];
      const completedData = completedRes.ok ? await completedRes.json() : [];
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : [];
      const prosData = prosRes.ok ? await prosRes.json() : [];

      // Build LINE display name map from lineAccesses
      if (lineAccessesRes.ok) {
        const lineAccesses: { lineUserId: string; displayName: string }[] =
          await lineAccessesRes.json();
        const nameMap: Record<string, string> = {};
        for (const access of lineAccesses) {
          if (access.displayName) {
            nameMap[access.lineUserId] = access.displayName;
          }
        }
        setLineDisplayNameMap(nameMap);
      }

      if (pendingLineRes.ok) {
        const pendingData = await pendingLineRes.json();
        setPendingLineAccounts(Array.isArray(pendingData) ? pendingData : []);
      }

      setStudent(studentData);
      setHours(hoursData);
      setScheduledBookings(scheduledData);
      setCompletedBookings(completedData);
      setPayments(paymentsData);
      setPros(prosData);

      // Fetch assigned course if any
      if (studentData.courseId) {
        try {
          const coursesRes = await fetch("/api/courses?includeHidden=true", { headers });
          if (coursesRes.ok) {
            const allCourses: Course[] = await coursesRes.json();
            const found = allCourses.find((c) => c.id === studentData.courseId);
            setCourse(found || null);
          }
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateActivationCode = async () => {
    if (!firebaseUser || !id) return;
    setGeneratingCode(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/users/${id}/activation-code`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActivationCode(data.activationCode);
      }
    } catch (err) {
      console.error("Error generating code:", err);
    } finally {
      setGeneratingCode(false);
    }
  };

  const linkLineAccount = async () => {
    if (!firebaseUser || !id || !selectedLineUserId) return;
    setLinking(true);
    setLinkMessage(null);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/users/${id}/line-accounts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lineUserId: selectedLineUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        setLinkMessage({ type: "success", text: data.message || "เชื่อมต่อสำเร็จ" });
        setSelectedLineUserId(null);
        fetchData();
      } else {
        setLinkMessage({ type: "error", text: data.error || "เกิดข้อผิดพลาด" });
      }
    } catch {
      setLinkMessage({ type: "error", text: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง" });
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-500">{error || "ไม่พบข้อมูล"}</p>
      </div>
    );
  }

  const proMap = new Map(pros.map((p) => [p.uid, p]));

  const resolveProName = (booking: Booking) =>
    proMap.get(booking.proId)?.displayName ?? "-";

  const bookingStatusMap: Record<
    string,
    { label: string; color: "success" | "warning" | "danger" }
  > = {
    scheduled: { label: "นัดหมายแล้ว", color: "warning" },
    completed: { label: "เสร็จสิ้น", color: "success" },
    cancelled: { label: "ยกเลิก", color: "danger" },
  };

  const paymentStatusMap: Record<
    string,
    { label: string; color: "success" | "warning" | "danger" }
  > = {
    pending: { label: "รอตรวจสอบ", color: "warning" },
    approved: { label: "อนุมัติแล้ว", color: "success" },
    rejected: { label: "ปฏิเสธ", color: "danger" },
  };

  const linkedCount = student.lineUserIds?.length ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">โปรไฟล์นักเรียน</h1>

      {/* Student Info Card */}
      <Card className="shadow-sm">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar
              name={student.displayName}
              src={student.avatarUrl}
              className="bg-green-100 text-green-700 w-20 h-20 text-2xl flex-shrink-0"
            />
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {student.displayName}
                </h2>
                {student.nickname && (
                  <p className="text-sm text-gray-500">
                    ชื่อเล่น: {student.nickname}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  {student.phone || "-"}
                </div>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  {student.gender === "male"
                    ? "ชาย"
                    : student.gender === "female"
                      ? "หญิง"
                      : student.gender === "other"
                        ? "อื่นๆ"
                        : "-"}
                  {student.birthdate
                    ? `, ${calculateAge(student.birthdate)} ปี`
                    : ""}
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-gray-400" />
                  คอร์ส: {course ? course.name : "-"}
                </div>
              </div>
              {student.learningGoals && (
                <div className="bg-gray-50 rounded-lg p-3 mt-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Target size={14} className="text-gray-400" />
                    ความต้องการของผู้เรียน
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {student.learningGoals}
                  </p>
                </div>
              )}
            </div>

            {/* Hours Card */}
            <Card className="bg-green-50 border border-green-200 min-w-[180px] flex-shrink-0">
              <CardBody className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock size={18} className="text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    ชั่วโมงคงเหลือ
                  </span>
                </div>
                <p className="text-3xl font-bold text-green-700">
                  {hours?.remainingHours ?? 0}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ซื้อแล้ว {hours?.totalHoursPurchased ?? 0} ชม. / ใช้แล้ว{" "}
                  {hours?.totalHoursUsed ?? 0} ชม.
                </p>
              </CardBody>
            </Card>
          </div>
        </CardBody>
      </Card>

      {/* Activation Code Card */}
      <Card className="shadow-sm border border-blue-100">
        <CardHeader className="pb-0 px-6 pt-5">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              <h3 className="font-semibold text-gray-800">
                รหัสเปิดใช้งาน (เชื่อมต่อ LINE)
              </h3>
            </div>
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<RefreshCw size={14} />}
              isLoading={generatingCode}
              onPress={generateActivationCode}
            >
              สร้างรหัส
            </Button>
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-5">
          <p className="text-xs text-gray-500 mb-3">
            ให้นักเรียนสแกน QR Code นี้ผ่าน LINE เพื่อเชื่อมต่อบัญชี
            (รองรับหลายบัญชี LINE)
          </p>

          {activationCode ? (
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <QRCodeDisplay value={activationCode} size={200} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">คัดลอกรหัส:</p>
                <Snippet
                  symbol=""
                  className="w-full"
                  size="sm"
                  variant="bordered"
                >
                  <div className="w-full overflow-x-auto break-all whitespace-pre-wrap">
                    {activationCode}
                  </div>
                </Snippet>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              กดปุ่ม &quot;สร้างรหัส&quot; เพื่อสร้าง QR Code
            </p>
          )}

          {/* Direct LINE Assignment */}
          <div className="mt-4">
            <Divider className="mb-3" />
            <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <Link size={14} className="text-blue-600" />
              เชื่อมต่อบัญชี LINE โดยตรง
            </p>
            <p className="text-xs text-gray-400 mb-3">
              เลือกบัญชี LINE จากรายชื่อด้านล่าง เพื่อเชื่อมต่อกับนักเรียนโดยตรง
              (ระบบจะส่งข้อความแจ้งเตือนไปยัง LINE อัตโนมัติ)
            </p>
            {pendingLineAccounts.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                ไม่มีบัญชี LINE ที่พร้อมเชื่อมต่อ (ผู้ใช้ต้องเปิด Mini App หรือ Add เพื่อน LINE OA ก่อน)
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <Autocomplete
                  label={`เลือกบัญชี LINE (${pendingLineAccounts.length} บัญชี)`}
                  size="sm"
                  variant="bordered"
                  className="flex-1"
                  selectedKey={selectedLineUserId}
                  onSelectionChange={(key) =>
                    setSelectedLineUserId(key as string | null)
                  }
                >
                  {pendingLineAccounts.map((acc) => (
                    <AutocompleteItem
                      key={acc.lineUserId}
                      textValue={acc.displayName || acc.lineUserId}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={acc.pictureUrl}
                          name={acc.displayName}
                          size="sm"
                          className="shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">
                              {acc.displayName || "ไม่ทราบชื่อ"}
                            </p>
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {acc.email || acc.lineUserId.slice(0, 16) + "..."}
                          </p>
                        </div>
                      </div>
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
                <Button
                  size="sm"
                  color="success"
                  variant="flat"
                  className="self-end sm:self-center"
                  isLoading={linking}
                  isDisabled={!selectedLineUserId}
                  startContent={!linking && <Link size={14} />}
                  onPress={linkLineAccount}
                >
                  เชื่อมต่อ
                </Button>
              </div>
            )}
            {linkMessage && (
              <p
                className={`text-xs mt-2 ${linkMessage.type === "success" ? "text-green-600" : "text-red-500"}`}
              >
                {linkMessage.text}
              </p>
            )}
          </div>

          {linkedCount > 0 && (
            <div className="mt-4">
              <Divider className="mb-3" />
              <p className="text-xs font-medium text-gray-700 mb-2">
                บัญชี LINE ที่เชื่อมต่อแล้ว ({linkedCount}):
              </p>
              <div className="space-y-2">
                {(student.lineUserIds || []).map((lineId) => {
                  const lineName =
                    lineDisplayNameMap[lineId] || lineId.slice(0, 8) + "...";
                  return (
                  <div
                    key={lineId}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle size={14} className="text-green-600" />
                      <span className="text-xs text-gray-700 font-medium">
                        {lineName}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      isIconOnly
                      onPress={async () => {
                        if (
                          !confirm(
                            "ยืนยันถอดบัญชี LINE นี้?"
                          )
                        )
                          return;
                        if (!firebaseUser) return;
                        try {
                          const token =
                            await firebaseUser.getIdToken();
                          await fetch(
                            `/api/users/${id}/line-accounts`,
                            {
                              method: "DELETE",
                              headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                lineUserId: lineId,
                              }),
                            }
                          );
                          fetchData();
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tabs */}
      <Tabs
        aria-label="นักเรียนแท็บ"
        color="success"
        variant="underlined"
        classNames={{
          tabList: "gap-6",
        }}
      >
        <Tab
          key="schedule"
          title={`ตารางเรียน (${scheduledBookings.length})`}
        >
          <Card className="shadow-sm mt-4">
            <CardBody className="p-0">
              {scheduledBookings.length === 0 ? (
                <p className="text-gray-400 text-center py-12">
                  ไม่มีตารางเรียนที่กำลังจะถึง
                </p>
              ) : (
                <Table aria-label="ตารางเรียน" removeWrapper>
                  <TableHeader>
                    <TableColumn>โปร</TableColumn>
                    <TableColumn>วันที่</TableColumn>
                    <TableColumn>เวลา</TableColumn>
                    <TableColumn>สถานะ</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {scheduledBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {resolveProName(booking)}
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

        <Tab
          key="history"
          title={`ประวัติการเรียน (${completedBookings.length})`}
        >
          <Card className="shadow-sm mt-4">
            <CardBody className="p-0">
              {completedBookings.length === 0 ? (
                <p className="text-gray-400 text-center py-12">
                  ยังไม่มีประวัติการเรียน
                </p>
              ) : (
                <Table aria-label="ประวัติการเรียน" removeWrapper>
                  <TableHeader>
                    <TableColumn>โปร</TableColumn>
                    <TableColumn>วันที่</TableColumn>
                    <TableColumn>เวลา</TableColumn>
                    <TableColumn>สถานะ</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {completedBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {resolveProName(booking)}
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

        <Tab key="payments" title={`การชำระเงิน (${payments.length})`}>
          <Card className="shadow-sm mt-4">
            <CardBody className="p-0">
              {payments.length === 0 ? (
                <p className="text-gray-400 text-center py-12">
                  ยังไม่มีประวัติการชำระเงิน
                </p>
              ) : (
                <Table aria-label="การชำระเงิน" removeWrapper>
                  <TableHeader>
                    <TableColumn>คอร์ส</TableColumn>
                    <TableColumn>จำนวนเงิน</TableColumn>
                    <TableColumn>ชั่วโมงที่ได้</TableColumn>
                    <TableColumn>สถานะ</TableColumn>
                    <TableColumn>วันที่</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.courseName ?? "-"}
                        </TableCell>
                        <TableCell>
                          ฿{payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>{payment.hoursAdded} ชม.</TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            color={
                              paymentStatusMap[payment.status]?.color ??
                              "default"
                            }
                            variant="flat"
                          >
                            {paymentStatusMap[payment.status]?.label ??
                              payment.status}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(payment.createdAt),
                            "d MMM yyyy",
                            {
                              locale: th,
                            }
                          )}
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
