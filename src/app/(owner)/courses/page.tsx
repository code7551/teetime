"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Chip,
  useDisclosure,
} from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  BookOpen,
  Clock,
  Banknote,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { th } from "date-fns/locale/th";
import toast from "react-hot-toast";
import type { Course } from "@/types";

const courseSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อคอร์ส"),
  hours: z
    .number({ error: "กรุณากรอกจำนวนชั่วโมง" })
    .min(1, "อย่างน้อย 1 ชั่วโมง"),
  price: z
    .number({ error: "กรุณากรอกราคา" })
    .min(0, "ราคาต้องไม่ติดลบ"),
  description: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

export default function CoursesPage() {
  return <CoursesContent />;
}

function CoursesContent() {
  const { firebaseUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      hours: 0,
      price: 0,
      description: "",
    },
  });

  const fetchCourses = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/courses?includeHidden=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCourses(await res.json());
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const activeCourses = courses.filter((c) => c.isActive !== false);
  const archivedCourses = courses.filter((c) => c.isActive === false);

  const openCreate = () => {
    setEditingCourse(null);
    reset({
      name: "",
      hours: 0,
      price: 0,
      description: "",
    });
    onOpen();
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    reset({
      name: course.name,
      hours: course.hours,
      price: course.price,
      description: course.description || "",
    });
    onOpen();
  };

  const onSubmit = async (data: CourseFormData) => {
    if (!firebaseUser) return;
    const token = await firebaseUser.getIdToken();

    try {
      if (editingCourse) {
        await fetch(`/api/courses/${editingCourse.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      } else {
        await fetch("/api/courses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      }

      fetchCourses();
      onOpenChange();
    } catch (err) {
      console.error("Error saving course:", err);
    }
  };

  const handleArchive = async (course: Course) => {
    if (!firebaseUser) return;
    const token = await firebaseUser.getIdToken();
    try {
      await fetch(`/api/courses/${course.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`จัดเก็บคอร์ส "${course.name}" แล้ว`);
      fetchCourses();
    } catch (err) {
      console.error("Error archiving course:", err);
    }
  };

  const handleUnarchive = async (course: Course) => {
    if (!firebaseUser) return;
    const token = await firebaseUser.getIdToken();
    try {
      await fetch(`/api/courses/${course.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: true }),
      });
      toast.success(`นำคอร์ส "${course.name}" กลับมาแล้ว`);
      fetchCourses();
    } catch (err) {
      console.error("Error unarchiving course:", err);
    }
  };

  // Stats (active only)
  const totalRevenuePotential = activeCourses.reduce(
    (s, c) => s + c.price,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            จัดการคอร์สเรียน
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            เพิ่ม แก้ไข และจัดการคอร์สเรียนทั้งหมด
          </p>
        </div>
        <Button
          color="success"
          className="text-white"
          startContent={<Plus size={18} />}
          onPress={openCreate}
        >
          เพิ่มคอร์สใหม่
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm border border-gray-100">
          <CardBody className="p-4 flex flex-row items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {activeCourses.length}
              </p>
              <p className="text-xs text-gray-500">คอร์สที่ใช้งาน</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm border border-gray-100">
          <CardBody className="p-4 flex flex-row items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Banknote size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                ฿{totalRevenuePotential.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">ราคารวมคอร์ส</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Active Courses Table */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader className="px-6 pt-5 pb-0">
          <h3 className="font-semibold text-gray-800">
            คอร์สที่ใช้งาน ({activeCourses.length})
          </h3>
        </CardHeader>
        <CardBody className="px-6 pb-5">
          {activeCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">ยังไม่มีคอร์สเรียน</p>
              <Button
                color="success"
                variant="flat"
                className="mt-3"
                startContent={<Plus size={16} />}
                onPress={openCreate}
              >
                เพิ่มคอร์สแรก
              </Button>
            </div>
          ) : (
            <Table aria-label="รายการคอร์ส" removeWrapper>
              <TableHeader>
                <TableColumn>ชื่อคอร์ส</TableColumn>
                <TableColumn>ชั่วโมง</TableColumn>
                <TableColumn>ราคา</TableColumn>
                <TableColumn>ราคา/ชม.</TableColumn>
                <TableColumn>วันที่สร้าง</TableColumn>
                <TableColumn align="center">จัดการ</TableColumn>
              </TableHeader>
              <TableBody>
                {activeCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-800">
                          {course.name}
                        </p>
                        {course.description && (
                          <p className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-sm">{course.hours} ชม.</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        ฿{course.price.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-green-600">
                        ฿
                        {course.hours > 0
                          ? Math.round(
                              course.price / course.hours
                            ).toLocaleString()
                          : 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {format(new Date(course.createdAt), "d MMM yyyy", {
                          locale: th,
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          isIconOnly
                          onPress={() => openEdit(course)}
                          title="แก้ไข"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="warning"
                          isIconOnly
                          onPress={() => handleArchive(course)}
                          title="จัดเก็บ"
                        >
                          <Archive size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Archived Courses */}
      {archivedCourses.length > 0 && (
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="px-6 pt-5 pb-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-500">
                คอร์สที่จัดเก็บ
              </h3>
              <Chip size="sm" variant="flat" color="default">
                {archivedCourses.length}
              </Chip>
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-5">
            <Table aria-label="คอร์สที่จัดเก็บ" removeWrapper>
              <TableHeader>
                <TableColumn>ชื่อคอร์ส</TableColumn>
                <TableColumn>ชั่วโมง</TableColumn>
                <TableColumn>ราคา</TableColumn>
                <TableColumn>ราคา/ชม.</TableColumn>
                <TableColumn align="center">จัดการ</TableColumn>
              </TableHeader>
              <TableBody>
                {archivedCourses.map((course) => (
                  <TableRow key={course.id} className="opacity-60">
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-600">
                          {course.name}
                        </p>
                        {course.description && (
                          <p className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-sm">{course.hours} ชม.</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        ฿{course.price.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-gray-500">
                        ฿
                        {course.hours > 0
                          ? Math.round(
                              course.price / course.hours
                            ).toLocaleString()
                          : 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="flat"
                          color="success"
                          startContent={<ArchiveRestore size={14} />}
                          onPress={() => handleUnarchive(course)}
                        >
                          นำกลับ
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(onModalClose) => (
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalHeader className="text-gray-800">
                {editingCourse ? "แก้ไขคอร์ส" : "เพิ่มคอร์สใหม่"}
              </ModalHeader>
              <ModalBody className="gap-4">
                <Input
                  label="ชื่อคอร์ส"
                  placeholder="เช่น คอร์ส 10 ชั่วโมง"
                  {...register("name")}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="จำนวนชั่วโมง"
                    placeholder="10"
                    type="number"
                    {...register("hours", { valueAsNumber: true })}
                    isInvalid={!!errors.hours}
                    errorMessage={errors.hours?.message}
                    endContent={
                      <span className="text-xs text-gray-400">ชม.</span>
                    }
                  />
                  <Input
                    label="ราคา (บาท)"
                    placeholder="5000"
                    type="number"
                    {...register("price", { valueAsNumber: true })}
                    isInvalid={!!errors.price}
                    errorMessage={errors.price?.message}
                    startContent={
                      <span className="text-xs text-gray-400">฿</span>
                    }
                  />
                </div>
                <Textarea
                  label="รายละเอียด (ไม่บังคับ)"
                  placeholder="อธิบายรายละเอียดของคอร์ส..."
                  {...register("description")}
                  minRows={2}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onModalClose}>
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  color="success"
                  className="text-white"
                  isLoading={isSubmitting}
                >
                  {editingCourse ? "บันทึก" : "สร้างคอร์ส"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
