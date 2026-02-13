"use client";

import { useEffect, useState, useRef, use } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Button,
  Textarea,
  Divider,
  Chip,
} from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import {
  FileEdit,
  Upload,
  ArrowLeft,
  CalendarDays,
  User,
  Clock,
  Video,
  X,
  CheckCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale/th";
import { useRouter } from "next/navigation";
import type { Booking, Review } from "@/types";

export default function ProReviewPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || !firebaseUser) return;

    const fetchData = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch booking and existing review in parallel
        const [bookingRes, reviewRes] = await Promise.all([
          fetch(`/api/bookings/${bookingId}`, { headers }),
          fetch(`/api/reviews?bookingId=${bookingId}`, { headers }),
        ]);

        if (bookingRes.ok) {
          const data: Booking = await bookingRes.json();
          setBooking(data);
        } else {
          setError("ไม่พบข้อมูลการจอง");
        }

        if (reviewRes.ok) {
          const reviews: Review[] = await reviewRes.json();
          if (reviews.length > 0) {
            const review = reviews[0];
            setExistingReview(review);
            setComment(review.comment || "");
            setExistingVideoUrl(review.videoUrl || "");
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user, firebaseUser, bookingId]);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError("กรุณากรอกความคิดเห็น");
      return;
    }

    if (!firebaseUser || !booking || !user) return;

    try {
      setSubmitting(true);
      setError("");
      setSaved(false);
      const token = await firebaseUser.getIdToken();

      let videoUrl = existingVideoUrl;

      // Upload video if a new file is provided
      if (videoFile) {
        const formData = new FormData();
        formData.append("file", videoFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          videoUrl = uploadData.url;
        } else {
          setError("อัปโหลดวิดีโอไม่สำเร็จ");
          setSubmitting(false);
          return;
        }
      }

      // Submit review (POST handles both create and update)
      const reviewRes = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: booking.id,
          studentId: booking.studentId,
          proId: user.uid,
          comment: comment.trim(),
          videoUrl: videoUrl || "",
          studentName: booking.studentName,
          proName: booking.proName || user.displayName,
          date: booking.date,
        }),
      });

      if (reviewRes.ok) {
        const savedReview = await reviewRes.json();
        setExistingReview(savedReview);
        setExistingVideoUrl(savedReview.videoUrl || "");
        setVideoFile(null);
        setSaved(true);
        // Auto-hide success after 3s
        setTimeout(() => setSaved(false), 3000);
      } else {
        const errData = await reviewRes.json();
        setError(errData.error || "บันทึกรีวิวไม่สำเร็จ");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setError("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit to 100MB
      if (file.size > 100 * 1024 * 1024) {
        setError("ไฟล์วิดีโอต้องมีขนาดไม่เกิน 100MB");
        return;
      }
      setVideoFile(file);
      setError("");
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-4">
        <Button
          variant="light"
          startContent={<ArrowLeft size={18} />}
          onPress={() => router.push("/pro/timetable")}
        >
          กลับไปตารางสอน
        </Button>
        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="text-center py-12 text-gray-400">
            <p>{error || "ไม่พบข้อมูลการจอง"}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const isEditing = !!existingReview;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back Button */}
      <Button
        variant="light"
        startContent={<ArrowLeft size={18} />}
        onPress={() => router.push("/pro/timetable")}
      >
        กลับไปตารางสอน
      </Button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileEdit className="text-green-600" size={28} />
            {isEditing ? "แก้ไขรีวิวการสอน" : "เขียนรีวิวการสอน"}
          </h1>
          <p className="text-gray-500 mt-1">
            บันทึกผลการเรียนและคำแนะนำให้นักเรียน
          </p>
        </div>
        {isEditing && (
          <Chip color="primary" variant="flat" size="sm">
            แก้ไข
          </Chip>
        )}
      </div>

      {/* Booking Info */}
      <Card className="border border-green-100 shadow-sm bg-green-50/30">
        <CardHeader className="pb-0 pt-5 px-5">
          <h3 className="font-semibold text-gray-700">ข้อมูลการสอน</h3>
        </CardHeader>
        <CardBody className="px-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <User size={16} className="text-green-600" />
              <div>
                <p className="text-xs text-gray-400">นักเรียน</p>
                <p className="font-medium text-gray-800">
                  {booking.studentName || "นักเรียน"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-green-600" />
              <div>
                <p className="text-xs text-gray-400">วันที่</p>
                <p className="font-medium text-gray-800">
                  {format(parseISO(booking.date), "d MMMM yyyy", {
                    locale: th,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-green-600" />
              <div>
                <p className="text-xs text-gray-400">เวลา</p>
                <p className="font-medium text-gray-800">
                  {booking.startTime} - {booking.endTime}
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Success Message */}
      {saved && (
        <Card className="bg-green-50 border border-green-200">
          <CardBody className="p-3 flex flex-row items-center gap-2">
            <CheckCircle size={18} className="text-green-600" />
            <p className="text-green-700 text-sm font-medium">
              บันทึกรีวิวสำเร็จ!
            </p>
          </CardBody>
        </Card>
      )}

      {/* Review Form */}
      <Card className="border border-gray-100 shadow-sm">
        <CardBody className="p-6 space-y-5">
          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ความคิดเห็น / บันทึกการสอน *
            </label>
            <Textarea
              placeholder="บันทึกผลการเรียน คำแนะนำ หรือสิ่งที่ต้องปรับปรุง..."
              variant="bordered"
              minRows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              classNames={{
                inputWrapper: "border-gray-200 focus-within:border-green-500",
              }}
            />
          </div>

          <Divider />

          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วิดีโอการสอน (ไม่บังคับ)
            </label>

            {/* Show existing video URL */}
            {existingVideoUrl && !videoFile && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                <Video size={20} className="text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-800">
                    มีวิดีโออยู่แล้ว
                  </p>
                  <p className="text-xs text-blue-500 truncate">
                    {existingVideoUrl}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  onPress={() => fileInputRef.current?.click()}
                >
                  เปลี่ยน
                </Button>
              </div>
            )}

            {videoFile ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Video size={20} className="text-green-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {videoFile.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={() => {
                    setVideoFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X size={16} />
                </Button>
              </div>
            ) : !existingVideoUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-green-400 hover:bg-green-50/30 transition-colors cursor-pointer"
              >
                <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">
                  คลิกเพื่ออัปโหลดวิดีโอ
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  รองรับ MP4, MOV (สูงสุด 100MB)
                </p>
              </button>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="light"
              onPress={() => router.push("/pro/timetable")}
            >
              กลับ
            </Button>
            <Button
              color="success"
              className="text-white font-medium"
              isLoading={submitting}
              onPress={handleSubmit}
              startContent={!submitting && <FileEdit size={18} />}
            >
              {isEditing ? "บันทึกการแก้ไข" : "ส่งรีวิว"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
