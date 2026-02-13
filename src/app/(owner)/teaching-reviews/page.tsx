"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Chip,
  Input,
  Select,
  SelectItem,
  Button,
  Divider,
} from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import {
  FileEdit,
  CalendarDays,
  User,
  GraduationCap,
  Video,
  Clock,
  Search,
  ExternalLink,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale/th";
import type { AppUser, Review } from "@/types";

export default function OwnerReviewsPage() {
  const { firebaseUser } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pros, setPros] = useState<AppUser[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProId, setFilterProId] = useState("");
  const [filterStudentId, setFilterStudentId] = useState("");
  const [searchText, setSearchText] = useState("");

  const fetchData = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Build reviews query
      const params = new URLSearchParams();
      if (filterProId) params.set("proId", filterProId);
      if (filterStudentId) params.set("studentId", filterStudentId);

      const [reviewsRes, prosRes, studentsRes] = await Promise.all([
        fetch(`/api/reviews?${params.toString()}`, { headers }),
        fetch("/api/users?role=pro", { headers }),
        fetch("/api/users?role=student", { headers }),
      ]);

      if (reviewsRes.ok) setReviews(await reviewsRes.json());
      if (prosRes.ok) setPros(await prosRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, filterProId, filterStudentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const proMap = new Map(pros.map((p) => [p.uid, p]));
  const studentMap = new Map(students.map((s) => [s.uid, s]));

  // Filter by search text
  const filteredReviews = reviews.filter((r) => {
    if (!searchText) return true;
    const lower = searchText.toLowerCase();
    const proName =
      r.proName || proMap.get(r.proId)?.displayName || "";
    const studentName =
      r.studentName || studentMap.get(r.studentId)?.displayName || "";
    return (
      proName.toLowerCase().includes(lower) ||
      studentName.toLowerCase().includes(lower) ||
      r.comment.toLowerCase().includes(lower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileEdit className="text-green-600" size={28} />
          รีวิวการสอน
        </h1>
        <p className="text-gray-500 mt-1">
          ดูรีวิวล่าสุดจากโปรโค้ช ({filteredReviews.length} รีวิว)
        </p>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <Input
              placeholder="ค้นหา..."
              size="sm"
              className="max-w-xs"
              startContent={<Search size={16} className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
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
            {(filterProId || filterStudentId || searchText) && (
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  setFilterProId("");
                  setFilterStudentId("");
                  setSearchText("");
                }}
              >
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Reviews list */}
      {filteredReviews.length === 0 ? (
        <Card className="shadow-sm">
          <CardBody className="text-center py-12 text-gray-400">
            <FileEdit size={40} className="mx-auto mb-2 opacity-50" />
            <p>ยังไม่มีรีวิว</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const pro = proMap.get(review.proId);
            const student = studentMap.get(review.studentId);
            const proName =
              review.proName || pro?.displayName || "โปร";
            const studentName =
              review.studentName || student?.displayName || "นักเรียน";

            return (
              <Card key={review.id} className="shadow-sm border border-gray-100">
                <CardBody className="p-5">
                  {/* Top row: pro, student, date */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <User size={15} className="text-green-600" />
                        <span className="text-sm font-semibold text-gray-800">
                          โปร {proName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <GraduationCap
                          size={15}
                          className="text-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {studentName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <CalendarDays size={13} />
                      {review.date
                        ? format(parseISO(review.date), "d MMM yyyy", {
                            locale: th,
                          })
                        : format(parseISO(review.createdAt), "d MMM yyyy", {
                            locale: th,
                          })}
                      <Clock size={13} />
                      {format(parseISO(review.createdAt), "HH:mm")}
                    </div>
                  </div>

                  <Divider className="mb-3" />

                  {/* Comment */}
                  <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Video badge */}
                  {review.videoUrl && (
                    <div className="mt-3">
                      <a
                        href={review.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        <Video size={14} />
                        ดูวิดีโอ
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {/* Updated indicator */}
                  {review.updatedAt && review.updatedAt !== review.createdAt && (
                    <p className="text-[11px] text-gray-400 mt-2">
                      แก้ไขล่าสุด:{" "}
                      {format(
                        parseISO(review.updatedAt),
                        "d MMM yyyy HH:mm",
                        { locale: th }
                      )}
                    </p>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
