"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Textarea,
  useDisclosure,
  Chip,
  Snippet,
  Avatar,
} from "@heroui/react";
import { Plus, Eye, Upload, Pencil } from "lucide-react";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { th } from "date-fns/locale/th";
import Link from "next/link";
import type { AppUser, Course } from "@/types";

const studentSchema = z.object({
  firstName: z.string().min(1, "กรุณากรอกชื่อ"),
  lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
  nickname: z.string().optional(),
  phone: z.string().min(9, "กรุณากรอกเบอร์โทรศัพท์"),
  gender: z.string().min(1, "กรุณาเลือกเพศ"),
  birthdate: z.string().min(1, "กรุณากรอกวันเกิด"),
  learningGoals: z.string().optional(),
  proId: z.string().min(1, "กรุณาเลือกโปรโค้ช"),
  courseId: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

export default function StudentsPage() {
  const { firebaseUser } = useAuth();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const {
    isOpen: isCodeOpen,
    onOpen: onCodeOpen,
    onOpenChange: onCodeOpenChange,
  } = useDisclosure();
  const [students, setStudents] = useState<AppUser[]>([]);
  const [pros, setPros] = useState<AppUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [createdStudentName, setCreatedStudentName] = useState("");
  const [editingStudent, setEditingStudent] = useState<AppUser | null>(null);

  // Photo upload
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  const fetchData = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [studentsRes, prosRes, coursesRes] = await Promise.all([
        fetch("/api/users?role=student", { headers }),
        fetch("/api/users?role=pro", { headers }),
        fetch("/api/courses", { headers }),
      ]);

      if (!studentsRes.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");

      const studentsData = await studentsRes.json();
      const prosData = prosRes.ok ? await prosRes.json() : [];
      const coursesData = coursesRes.ok ? await coursesRes.json() : [];

      setStudents(studentsData);
      setPros(prosData);
      setCourses(coursesData.filter((c: Course) => c.isActive));
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getProName = (proId?: string) => {
    if (!proId) return "-";
    const pro = pros.find((p) => p.uid === proId);
    return pro?.displayName ?? "-";
  };

  const getCourseName = (courseId?: string) => {
    if (!courseId) return "-";
    const course = courses.find((c) => c.id === courseId);
    return course?.name ?? "-";
  };

  const openCreate = () => {
    setEditingStudent(null);
    setPhotoFile(null);
    setPhotoPreview("");
    reset({
      firstName: "",
      lastName: "",
      nickname: "",
      phone: "",
      gender: "",
      birthdate: "",
      learningGoals: "",
      proId: "",
      courseId: "",
    });
    onOpen();
  };

  const openEdit = (student: AppUser) => {
    setEditingStudent(student);
    setPhotoFile(null);
    setPhotoPreview(student.avatarUrl || "");
    reset({
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      nickname: student.nickname || "",
      phone: student.phone || "",
      gender: student.gender || "",
      birthdate: student.birthdate || "",
      learningGoals: student.learningGoals || "",
      proId: student.proId || "",
      courseId: student.courseId || "",
    });
    onOpen();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPhotoFile(f);
      setPhotoPreview(URL.createObjectURL(f));
    }
  };

  const uploadPhoto = async (): Promise<string | undefined> => {
    if (!photoFile) return undefined;
    const formData = new FormData();
    formData.append("file", photoFile);
    formData.append("folder", "avatars");

    const token = await firebaseUser!.getIdToken();
    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (uploadRes.ok) {
      const { url } = await uploadRes.json();
      return url;
    }
    return undefined;
  };

  const onSubmit = async (formData: StudentFormData) => {
    if (!firebaseUser) return;
    setSubmitting(true);
    setError("");
    try {
      const token = await firebaseUser.getIdToken();
      const avatarUrl = await uploadPhoto();

      const payload = {
        ...formData,
        displayName: `${formData.firstName} ${formData.lastName}`,
        role: "student",
        ...(avatarUrl && { avatarUrl }),
      };

      if (editingStudent) {
        // Update existing student
        const res = await fetch(`/api/users/${editingStudent.uid}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "ไม่สามารถแก้ไขข้อมูลได้");
        }
        onClose();
        fetchData();
      } else {
        // Create new student
        const res = await fetch("/api/users", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "ไม่สามารถสร้างบัญชีได้");
        }
        const data = await res.json();
        setActivationCode(data.activationCode || "");
        setCreatedStudentName(`${formData.firstName} ${formData.lastName}`);
        onClose();
        onCodeOpen();
        fetchData();
      }

      reset();
      setPhotoFile(null);
      setPhotoPreview("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-800">นักเรียน</h1>
          <p className="text-gray-500 mt-1">จัดการรายชื่อนักเรียนทั้งหมด</p>
        </div>
        <Button
          color="success"
          startContent={<Plus size={18} />}
          onPress={openCreate}
          className="text-white"
        >
          เพิ่มนักเรียน
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border border-red-200">
          <CardBody>
            <p className="text-red-600 text-sm">{error}</p>
          </CardBody>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardBody className="p-0">
          {students.length === 0 ? (
            <p className="text-gray-400 text-center py-12">
              ยังไม่มีนักเรียนในระบบ
            </p>
          ) : (
            <Table aria-label="รายชื่อนักเรียน" removeWrapper>
              <TableHeader>
                <TableColumn>นักเรียน</TableColumn>
                <TableColumn>เบอร์โทร</TableColumn>
                <TableColumn>โปรโค้ช</TableColumn>
                <TableColumn>คอร์ส</TableColumn>
                <TableColumn>LINE</TableColumn>
                <TableColumn align="center">จัดการ</TableColumn>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={student.avatarUrl}
                          name={student.displayName}
                          size="sm"
                          className="bg-green-100 text-green-700 flex-shrink-0"
                        />
                        <div>
                          <p className="font-medium">{student.displayName}</p>
                          {student.nickname && (
                            <p className="text-xs text-gray-400">
                              ({student.nickname})
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.phone || "-"}</TableCell>
                    <TableCell>
                      <span className="text-sm">{getProName(student.proId)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{getCourseName(student.courseId)}</span>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          (student.lineUserIds?.length ?? 0) > 0
                            ? "success"
                            : "default"
                        }
                      >
                        {student.lineUserIds?.length ?? 0}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          isIconOnly
                          onPress={() => openEdit(student)}
                          title="แก้ไข"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          as={Link}
                          href={`/students/${student.uid}`}
                          size="sm"
                          variant="flat"
                          color="success"
                          isIconOnly
                          title="ดูโปรไฟล์"
                        >
                          <Eye size={16} />
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

      {/* Create/Edit Student Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onModalClose) => (
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalHeader className="text-gray-800">
                {editingStudent ? "แก้ไขข้อมูลนักเรียน" : "เพิ่มนักเรียนใหม่"}
              </ModalHeader>
              <ModalBody className="gap-4">
                {/* Photo upload */}
                <div className="flex flex-col items-center gap-3">
                  <label className="cursor-pointer group relative">
                    {photoPreview ? (
                      <Avatar
                        src={photoPreview}
                        className="w-24 h-24"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex flex-col items-center justify-center text-gray-400 group-hover:bg-gray-200 transition-colors">
                        <Upload size={24} />
                        <span className="text-[10px] mt-1">อัพโหลดรูป</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                  <p className="text-xs text-gray-400">
                    รูปถ่ายประจำตัว (ไม่บังคับ)
                  </p>
                </div>

                {/* Name fields */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="ชื่อ"
                    placeholder="กรอกชื่อ"
                    {...register("firstName")}
                    isInvalid={!!errors.firstName}
                    errorMessage={errors.firstName?.message}
                  />
                  <Input
                    label="นามสกุล"
                    placeholder="กรอกนามสกุล"
                    {...register("lastName")}
                    isInvalid={!!errors.lastName}
                    errorMessage={errors.lastName?.message}
                  />
                </div>

                <Input
                  label="ชื่อเล่น"
                  placeholder="กรอกชื่อเล่น (ไม่บังคับ)"
                  {...register("nickname")}
                />

                <Input
                  label="เบอร์โทรศัพท์"
                  placeholder="กรอกเบอร์โทรศัพท์"
                  {...register("phone")}
                  isInvalid={!!errors.phone}
                  errorMessage={errors.phone?.message}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="เพศ"
                    placeholder="เลือกเพศ"
                    {...register("gender")}
                    isInvalid={!!errors.gender}
                    errorMessage={errors.gender?.message}
                    defaultSelectedKeys={editingStudent?.gender ? [editingStudent.gender] : []}
                  >
                    <SelectItem key="male" textValue="ชาย">ชาย</SelectItem>
                    <SelectItem key="female" textValue="หญิง">หญิง</SelectItem>
                    <SelectItem key="other" textValue="อื่นๆ">อื่นๆ</SelectItem>
                  </Select>
                  <Input
                    label="วันเกิด"
                    placeholder="วัน/เดือน/ปี"
                    type="date"
                    {...register("birthdate")}
                    isInvalid={!!errors.birthdate}
                    errorMessage={errors.birthdate?.message}
                  />
                </div>

                <Select
                  label="โปรโค้ช"
                  placeholder="เลือกโปรโค้ช"
                  {...register("proId")}
                  isInvalid={!!errors.proId}
                  errorMessage={errors.proId?.message}
                  defaultSelectedKeys={editingStudent?.proId ? [editingStudent.proId] : []}
                >
                  {pros.map((pro) => (
                    <SelectItem key={pro.uid} textValue={pro.displayName}>
                      {pro.displayName}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="คอร์สเรียน"
                  placeholder="เลือกคอร์ส (ไม่บังคับ)"
                  {...register("courseId")}
                  defaultSelectedKeys={editingStudent?.courseId ? [editingStudent.courseId] : []}
                >
                  {courses.map((course) => (
                    <SelectItem
                      key={course.id}
                      textValue={`${course.name} (${course.hours} ชม. - ฿${course.price.toLocaleString()})`}
                    >
                      <div>
                        <p className="font-medium">{course.name}</p>
                        <p className="text-xs text-gray-500">
                          {course.hours} ชั่วโมง - ฿{course.price.toLocaleString()}
                        </p>
                      </div>
                    </SelectItem>
                  ))}
                </Select>

                <Textarea
                  label="ความต้องการของผู้เรียน"
                  placeholder="เช่น อยากปรับวงสวิง, เรียนรู้การพัตต์ ..."
                  {...register("learningGoals")}
                  minRows={2}
                />

                {!editingStudent && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-600">
                      หลังสร้างบัญชี ระบบจะสร้าง QR Code
                      สำหรับเชื่อมต่อกับ LINE ของนักเรียน
                    </p>
                  </div>
                )}
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
                  {editingStudent ? "บันทึก" : "สร้างนักเรียน"}
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Activation Code Modal */}
      <Modal isOpen={isCodeOpen} onOpenChange={onCodeOpenChange} size="lg">
        <ModalContent>
          {(onModalClose) => (
            <>
              <ModalHeader className="text-gray-800">
                รหัสเปิดใช้งานสำหรับ {createdStudentName}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-700 mb-2">
                      ให้นักเรียนสแกน QR Code นี้ผ่าน LINE
                      เพื่อเชื่อมต่อบัญชี
                    </p>
                    <p className="text-xs text-green-600">
                      รองรับการเชื่อมต่อหลายบัญชี LINE
                    </p>
                  </div>

                  {activationCode && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <QRCodeDisplay value={activationCode} size={240} />
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      หรือคัดลอกรหัส:
                    </p>
                    <Snippet
                      symbol=""
                      className="w-full"
                      size="sm"
                      variant="bordered"
                    >
                      {activationCode}
                    </Snippet>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="success" onPress={onModalClose} className="text-white">
                  เสร็จสิ้น
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
