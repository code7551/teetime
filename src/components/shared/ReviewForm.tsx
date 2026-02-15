"use client";

import { useEffect, useState, useRef } from "react";
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
  ArrowLeft,
  CalendarDays,
  User,
  Clock,
  Video,
  ImageIcon,
  X,
  CheckCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale/th";
import { useRouter } from "next/navigation";
import type { Booking, Review } from "@/types";

// ─── Component ───────────────────────────────────────────────────────
interface ReviewFormProps {
  bookingId: string;
  /** URL to navigate back to (e.g. "/pro/timetable" or "/timetable") */
  backUrl: string;
}

export default function ReviewForm({ bookingId, backUrl }: ReviewFormProps) {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [studentName, setStudentName] = useState("");
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
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
          // Fetch student name
          try {
            const studentRes = await fetch(`/api/users/${data.studentId}`, { headers });
            if (studentRes.ok) {
              const studentData = await studentRes.json();
              setStudentName(studentData.nickname || studentData.displayName || "นักเรียน");
            }
          } catch {
            // ignore - name is optional
          }
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
            setExistingImageUrls(review.imageUrls || []);
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

      // Upload new images
      let allImageUrls = [...existingImageUrls];
      if (imageFiles.length > 0) {
        const imageUploadPromises = imageFiles.map(async (imgFile) => {
          const formData = new FormData();
          formData.append("file", imgFile);
          formData.append("folder", "review-images");
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            return data.url as string;
          }
          return null;
        });
        const uploadedUrls = await Promise.all(imageUploadPromises);
        const failedCount = uploadedUrls.filter((u) => !u).length;
        if (failedCount > 0) {
          setError(`อัปโหลดรูปภาพไม่สำเร็จ ${failedCount} ไฟล์`);
          setSubmitting(false);
          return;
        }
        allImageUrls = [...allImageUrls, ...(uploadedUrls as string[])];
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
          proId: booking.proId,
          comment: comment.trim(),
          videoUrl: videoUrl || "",
          imageUrls: allImageUrls,
          date: booking.date,
        }),
      });

      if (reviewRes.ok) {
        const savedReview = await reviewRes.json();
        setExistingReview(savedReview);
        setExistingVideoUrl(savedReview.videoUrl || "");
        setExistingImageUrls(savedReview.imageUrls || []);
        setVideoFile(null);
        setImageFiles([]);
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

  const handleMediaFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages: File[] = [];
    let newVideo: File | null = null;

    for (const file of files) {
      if (file.type.startsWith("video/")) {
        if (file.size > 100 * 1024 * 1024) {
          setError("ไฟล์วิดีโอต้องมีขนาดไม่เกิน 100MB");
          return;
        }
        newVideo = file;
      } else if (file.type.startsWith("image/")) {
        if (file.size > 10 * 1024 * 1024) {
          setError("ไฟล์รูปภาพแต่ละไฟล์ต้องมีขนาดไม่เกิน 10MB");
          return;
        }
        newImages.push(file);
      }
    }

    const totalImageCount = existingImageUrls.length + imageFiles.length + newImages.length;
    if (totalImageCount > 10) {
      setError("อัปโหลดรูปภาพได้สูงสุด 10 รูป");
      return;
    }

    if (newVideo) {
      setVideoFile(newVideo);
    }
    if (newImages.length > 0) {
      setImageFiles((prev) => [...prev, ...newImages]);
    }
    setError("");
    // Reset input so the same file can be re-selected
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
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
          onPress={() => router.push(backUrl)}
        >
          กลับ
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
        onPress={() => router.push(backUrl)}
      >
        กลับ
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
                  {studentName || "นักเรียน"}
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

          {/* Media Upload (images & video) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รูปภาพ / วิดีโอ (ไม่บังคับ)
            </label>

            {/* Media previews */}
            {(existingVideoUrl || videoFile || existingImageUrls.length > 0 || imageFiles.length > 0) && (
              <div className="space-y-3 mb-3">
                {/* Existing video */}
                {existingVideoUrl && !videoFile && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Video size={20} className="text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-800">
                        วิดีโอ
                      </p>
                      <p className="text-xs text-blue-500 truncate">
                        {existingVideoUrl}
                      </p>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => setExistingVideoUrl("")}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}

                {/* New video file */}
                {videoFile && (
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
                      onPress={() => setVideoFile(null)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}

                {/* Image grid */}
                {(existingImageUrls.length > 0 || imageFiles.length > 0) && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {/* Existing images */}
                    {existingImageUrls.map((url, idx) => (
                      <div key={`existing-${idx}`} className="relative group aspect-square">
                        <img
                          src={url}
                          alt={`รูปภาพ ${idx + 1}`}
                          className="w-full h-full object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {/* New image files */}
                    {imageFiles.map((file, idx) => (
                      <div key={`new-${idx}`} className="relative group aspect-square">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover rounded-lg border border-green-200"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 text-white text-[10px] text-center py-0.5 rounded-b-lg">
                          ใหม่
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add media button */}
            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              className="w-full p-5 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-green-400 hover:bg-green-50/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center gap-3 mb-1.5">
                <ImageIcon size={24} className="text-gray-400" />
                <Video size={24} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                คลิกเพื่อเพิ่มรูปภาพหรือวิดีโอ
              </p>
              <p className="text-xs text-gray-400 mt-1">
                รูปภาพ: JPG, PNG, WEBP (สูงสุด 10MB) | วิดีโอ: MP4, MOV (สูงสุด 100MB)
              </p>
            </button>

            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleMediaFilesChange}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="light" onPress={() => router.push(backUrl)}>
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
