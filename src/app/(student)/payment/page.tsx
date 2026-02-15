"use client";

import { useMiniApp } from "@/hooks/useMiniApp";
import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Button,
  Chip,
} from "@heroui/react";
import {
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  CreditCard,
  ImagePlus,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import SubPageHeader from "@/components/student/SubPageHeader";
import type { Course, Payment } from "@/types";

export default function PaymentPage() {
  const { student, loading: miniAppLoading, isLinked } = useMiniApp();
  const [assignedCourse, setAssignedCourse] = useState<Course | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;

    const fetchData = async () => {
      try {
        const [coursesRes, paymentsRes] = await Promise.all([
          fetch("/api/courses"),
          fetch(`/api/payments?studentId=${student.uid}`),
        ]);

        if (coursesRes.ok && student.courseId) {
          const allCourses: Course[] = await coursesRes.json();
          const found = allCourses.find(
            (c) => c.id === student.courseId
          );
          setAssignedCourse(found || null);
        }
        if (paymentsRes.ok) {
          setPayments(await paymentsRes.json());
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [student]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async () => {
    if (!file || !assignedCourse || !student) return;

    setSubmitting(true);
    setSuccess(false);
    setSubmitError("");

    try {
      // Step 1: Upload receipt image
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "receipts");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadErr = await uploadRes.json().catch(() => ({}));
        throw new Error(
          uploadErr.error || "ไม่สามารถอัพโหลดรูปภาพได้ กรุณาลองใหม่"
        );
      }

      const uploadData = await uploadRes.json();
      if (!uploadData.url) {
        throw new Error("ไม่สามารถอัพโหลดรูปภาพได้ กรุณาลองใหม่");
      }

      // Step 2: Create payment record
      const paymentRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.uid,
          courseId: assignedCourse.id,
          amount: assignedCourse.price,
          receiptImageUrl: uploadData.url,
          hoursAdded: assignedCourse.hours,
          courseName: assignedCourse.name,
        }),
      });

      if (!paymentRes.ok) {
        const paymentErr = await paymentRes.json().catch(() => ({}));
        throw new Error(
          paymentErr.error || "ไม่สามารถบันทึกข้อมูลการชำระเงินได้"
        );
      }

      setSuccess(true);
      setFile(null);
      setPreview("");

      // Refresh payment list
      const paymentsRes = await fetch(
        `/api/payments?studentId=${student.uid}`
      );
      if (paymentsRes.ok) {
        setPayments(await paymentsRes.json());
      }
    } catch (err) {
      console.error("Payment error:", err);
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig: Record<
    string,
    {
      label: string;
      color: "warning" | "success" | "danger";
      icon: React.ReactNode;
    }
  > = {
    pending: {
      label: "รอตรวจสอบ",
      color: "warning",
      icon: <Clock size={14} />,
    },
    approved: {
      label: "อนุมัติแล้ว",
      color: "success",
      icon: <CheckCircle size={14} />,
    },
    rejected: {
      label: "ปฏิเสธ",
      color: "danger",
      icon: <XCircle size={14} />,
    },
  };

  if (miniAppLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" color="success" />
        <p className="text-sm text-gray-400">กำลังโหลด...</p>
      </div>
    );
  }

  if (!isLinked || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <CreditCard size={28} className="text-gray-300" />
        </div>
        <p className="text-gray-400 text-sm">
          กรุณา
          <Link href="/miniapp" className="text-emerald-500 font-medium mx-1">
            เชื่อมต่อบัญชี
          </Link>
          ก่อน
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <SubPageHeader
        title="ชำระเงินต่อคอร์ส"
        icon={<CreditCard size={20} className="text-orange-500" />}
      />

      {/* Payment form card */}
      <Card className="shadow-md border-0 overflow-visible">
        <CardBody className="p-5 space-y-4">
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2.5 animate-appearance-in">
              <CheckCircle
                size={18}
                className="text-emerald-500 shrink-0"
              />
              <p className="text-sm text-emerald-700">
                ส่งหลักฐานสำเร็จ! กรุณารอการตรวจสอบ
              </p>
            </div>
          )}

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-2.5">
              <AlertCircle
                size={18}
                className="text-red-500 shrink-0"
              />
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          {/* Course info */}
          {assignedCourse ? (
            <div className="rounded-xl bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4">
              <p className="text-xs font-medium text-emerald-600 mb-1">
                คอร์สของคุณ
              </p>
              <p className="text-base font-bold text-gray-800">
                {assignedCourse.name}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-100/60 px-2 py-1 rounded-lg">
                  <Clock size={12} />
                  {assignedCourse.hours} ชม.
                </span>
                <span className="text-sm font-semibold text-emerald-700">
                  ฿{assignedCourse.price.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-4 flex items-start gap-3">
              <AlertCircle
                size={20}
                className="text-orange-400 shrink-0 mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  ยังไม่มีคอร์สที่กำหนดให้
                </p>
                <p className="text-xs text-orange-500 mt-1 leading-relaxed">
                  กรุณาติดต่อสถาบันเพื่อกำหนดคอร์สเรียนให้คุณก่อนชำระเงิน
                </p>
              </div>
            </div>
          )}

          {assignedCourse && (
            <>
              {/* Upload area */}
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  อัพโหลดสลิปการโอนเงิน
                </p>
                <label className="flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors overflow-hidden">
                  {preview ? (
                    <img
                      src={preview}
                      alt="receipt preview"
                      className="max-h-48 w-auto rounded-lg object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-300 py-6">
                      <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mb-3">
                        <ImagePlus size={24} className="text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-400 font-medium">
                        แตะเพื่ออัพโหลดสลิป
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        รองรับ JPG, PNG
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <Button
                color="success"
                className="w-full text-white font-semibold h-12 text-base"
                isLoading={submitting}
                isDisabled={!file}
                onPress={handleSubmit}
                size="lg"
                radius="lg"
                startContent={!submitting && <Upload size={18} />}
              >
                ส่งหลักฐาน (฿{assignedCourse.price.toLocaleString()})
              </Button>
            </>
          )}
        </CardBody>
      </Card>

      {/* Payment history */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Receipt size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-600">
            ประวัติการชำระเงิน
          </h3>
        </div>

        {payments.length === 0 ? (
          <Card className="shadow-sm border-0">
            <CardBody className="text-center py-10">
              <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Receipt size={24} className="text-gray-200" />
              </div>
              <p className="text-sm text-gray-300">ยังไม่มีประวัติ</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => {
              const config = statusConfig[p.status] || {
                label: p.status,
                color: "default" as const,
                icon: null,
              };
              return (
                <Card key={p.id} className="shadow-sm border-0">
                  <CardBody className="p-3.5">
                    <div className="flex justify-between items-center">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-700">
                          ฿{p.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {p.courseName && <span>{p.courseName} · </span>}
                          {format(new Date(p.createdAt), "d MMM yyyy", {
                            locale: th,
                          })}
                        </p>
                      </div>
                      <Chip
                        size="sm"
                        color={config.color}
                        variant="flat"
                        startContent={config.icon}
                      >
                        {config.label}
                      </Chip>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
