"use client";

import { useMiniApp } from "@/hooks/useMiniApp";
import { useEffect, useState } from "react";
import { Card, CardBody, Spinner, Button, Chip } from "@heroui/react";
import { Upload, CheckCircle } from "lucide-react";
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
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!student) return;

    const fetchData = async () => {
      try {
        const [coursesRes, paymentsRes] = await Promise.all([
          fetch("/api/courses?includeHidden=true"),
          fetch(`/api/payments?studentId=${student.uid}`),
        ]);

        if (coursesRes.ok && student.courseId) {
          const allCourses: Course[] = await coursesRes.json();
          const found = allCourses.find((c) => c.id === student.courseId);
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

  const handleSubmit = async () => {
    if (!file || !assignedCourse || !student) return;

    setSubmitting(true);
    setSuccess(false);
    setSubmitError("");

    try {
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

      const paymentsRes = await fetch(
        `/api/payments?studentId=${student.uid}`
      );
      if (paymentsRes.ok) {
        setPayments(await paymentsRes.json());
      }
    } catch (err) {
      console.error("Payment error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig: Record<
    string,
    { label: string; color: "warning" | "success" | "danger" }
  > = {
    pending: { label: "รอตรวจสอบ", color: "warning" },
    approved: { label: "อนุมัติแล้ว", color: "success" },
    rejected: { label: "ปฏิเสธ", color: "danger" },
  };

  if (miniAppLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  if (!isLinked || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
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
    <div className="pb-6">
      <SubPageHeader title="ชำระเงิน" />

      <div className="space-y-4">
        {/* Alerts */}
        {success && (
          <div className="bg-emerald-50 rounded-xl p-3.5 flex items-center gap-2.5">
            <CheckCircle size={18} className="text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-700">
              ส่งหลักฐานสำเร็จ! กรุณารอการตรวจสอบ
            </p>
          </div>
        )}

        {submitError && (
          <div className="bg-red-50 rounded-xl p-3.5">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {/* Course info + form */}
        {assignedCourse ? (
          <Card className="shadow-sm border-0">
            <CardBody className="p-4 space-y-4">
              {/* Course details */}
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-xs text-emerald-600/70">คอร์สของคุณ</p>
                <p className="text-base font-semibold text-emerald-800 mt-0.5">
                  {assignedCourse.name}
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  {assignedCourse.hours} ชั่วโมง ·{" "}
                  ฿{assignedCourse.price.toLocaleString()}
                </p>
              </div>

              {/* Upload area */}
              <div>
                <p className="text-xs text-gray-400 mb-2">
                  สลิปการโอนเงิน
                </p>
                <label className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed border-gray-200 rounded-xl cursor-pointer active:bg-gray-50 transition-colors overflow-hidden">
                  {preview ? (
                    <img
                      src={preview}
                      alt="receipt preview"
                      className="max-h-48 w-auto object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center py-6">
                      <p className="text-sm text-gray-400">แตะเพื่ออัพโหลด</p>
                      <p className="text-xs text-gray-300 mt-1">
                        JPG, PNG
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
                className="w-full text-white font-medium h-11"
                isLoading={submitting}
                isDisabled={!file}
                onPress={handleSubmit}
                size="lg"
                radius="lg"
                startContent={!submitting && <Upload size={18} />}
              >
                ส่งหลักฐาน (฿{assignedCourse.price.toLocaleString()})
              </Button>
            </CardBody>
          </Card>
        ) : (
          <Card className="shadow-sm border-0 border-l-3 border-l-amber-400">
            <CardBody className="p-4">
              <p className="text-sm font-medium text-gray-800">
                ยังไม่มีคอร์สที่กำหนดให้
              </p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                กรุณาติดต่อสถาบันเพื่อกำหนดคอร์สเรียนก่อนชำระเงิน
              </p>
            </CardBody>
          </Card>
        )}

        {/* Payment history */}
        {payments.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-3">
              ประวัติการชำระเงิน
            </p>
            <Card className="shadow-sm border-0 overflow-hidden">
              <CardBody className="p-0">
                {payments.map((p, idx) => {
                  const config = statusConfig[p.status] || {
                    label: p.status,
                    color: "default" as const,
                  };
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-4 py-3.5 ${
                        idx < payments.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-emerald-700">
                          ฿{p.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.courseName && `${p.courseName} · `}
                          {format(new Date(p.createdAt), "d MMM yyyy", {
                            locale: th,
                          })}
                        </p>
                      </div>
                      <Chip
                        size="sm"
                        color={config.color}
                        variant="flat"
                        className="shrink-0"
                      >
                        {config.label}
                      </Chip>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
