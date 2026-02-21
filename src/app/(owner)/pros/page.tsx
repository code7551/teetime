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
  Textarea,
  Avatar,
  useDisclosure,
} from "@heroui/react";
import { Plus, Pencil, KeyRound, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { th } from "date-fns/locale/th";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import type { AppUser } from "@/types";

const createProSchema = z.object({
  displayName: z.string().min(1, "กรุณากรอกชื่อ"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  phone: z.string().min(9, "กรุณากรอกเบอร์โทรศัพท์"),
  nickname: z.string().optional(),
  proficiency: z.string().optional(),
  education: z.string().optional(),
  athleticBackground: z.string().optional(),
  commissionRate: z
    .number()
    .min(0, "ค่าคอมมิชชันต้องไม่ต่ำกว่า 0")
    .max(1, "ค่าคอมมิชชันต้องไม่เกิน 1"),
});

type CreateProForm = z.infer<typeof createProSchema>;

const editProSchema = z.object({
  displayName: z.string().min(1, "กรุณากรอกชื่อ"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  phone: z.string().min(9, "กรุณากรอกเบอร์โทรศัพท์"),
  nickname: z.string().optional(),
  proficiency: z.string().optional(),
  education: z.string().optional(),
  athleticBackground: z.string().optional(),
  commissionRate: z
    .number()
    .min(0, "ค่าคอมมิชชันต้องไม่ต่ำกว่า 0")
    .max(1, "ค่าคอมมิชชันต้องไม่เกิน 1"),
});

type EditProForm = z.infer<typeof editProSchema>;

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ProsPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onOpenChange: onEditOpenChange,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isResetOpen,
    onOpen: onResetOpen,
    onOpenChange: onResetOpenChange,
    onClose: onResetClose,
  } = useDisclosure();
  const [pros, setPros] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingPro, setEditingPro] = useState<AppUser | null>(null);
  const [resetPro, setResetPro] = useState<AppUser | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProForm>({
    resolver: zodResolver(createProSchema),
    defaultValues: {
      commissionRate: 0.3,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditProForm>({
    resolver: zodResolver(editProSchema),
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    reset: resetResetForm,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const fetchPros = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/users?role=pro", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
      const data = await res.json();
      setPros(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchPros();
  }, [fetchPros]);

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

  const onSubmit = async (formData: CreateProForm) => {
    if (!firebaseUser) return;
    setSubmitting(true);
    try {
      const token = await firebaseUser.getIdToken();
      const avatarUrl = await uploadPhoto();

      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          role: "pro",
          ...(avatarUrl && { avatarUrl }),
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "ไม่สามารถสร้างบัญชีได้");
      }
      reset();
      setPhotoFile(null);
      setPhotoPreview("");
      onClose();
      fetchPros();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (pro: AppUser) => {
    setEditingPro(pro);
    setPhotoFile(null);
    setPhotoPreview(pro.avatarUrl || "");
    resetEdit({
      displayName: pro.displayName,
      email: pro.email || "",
      phone: pro.phone || "",
      nickname: pro.nickname || "",
      proficiency: pro.proficiency || "",
      education: pro.education || "",
      athleticBackground: pro.athleticBackground || "",
      commissionRate: pro.commissionRate ?? 0.3,
    });
    onEditOpen();
  };

  const onEditSubmit = async (formData: EditProForm) => {
    if (!firebaseUser || !editingPro) return;
    setSubmitting(true);
    try {
      const token = await firebaseUser.getIdToken();
      const avatarUrl = await uploadPhoto();

      const res = await fetch(`/api/users/${editingPro.uid}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          ...(avatarUrl && { avatarUrl }),
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "ไม่สามารถแก้ไขข้อมูลได้");
      }
      onEditClose();
      setEditingPro(null);
      setPhotoFile(null);
      setPhotoPreview("");
      fetchPros();
      toast.success("แก้ไขข้อมูลโปรสำเร็จ");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReset = (pro: AppUser) => {
    setResetPro(pro);
    resetResetForm();
    onResetOpen();
  };

  const onResetPasswordSubmit = async (formData: ResetPasswordForm) => {
    if (!firebaseUser || !resetPro) return;
    setSubmitting(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/users/${resetPro.uid}/reset-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "ไม่สามารถรีเซ็ตรหัสผ่านได้");
      }
      onResetClose();
      setResetPro(null);
      toast.success("รีเซ็ตรหัสผ่านสำเร็จ");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
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
          <h1 className="text-2xl font-bold text-gray-800">โปร</h1>
          <p className="text-gray-500 mt-1">จัดการรายชื่อโปรทั้งหมด</p>
        </div>
        <Button
          color="success"
          startContent={<Plus size={18} />}
          onPress={() => {
            setPhotoFile(null);
            setPhotoPreview("");
            reset();
            onOpen();
          }}
          className="text-white"
        >
          เพิ่มโปร
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardBody className="p-0">
          {pros.length === 0 ? (
            <p className="text-gray-400 text-center py-12">
              ยังไม่มีโปรในระบบ
            </p>
          ) : (
            <Table aria-label="รายชื่อโปร" removeWrapper>
              <TableHeader>
                <TableColumn>โปร</TableColumn>
                <TableColumn>อีเมล</TableColumn>
                <TableColumn>เบอร์โทร</TableColumn>
                <TableColumn>ส่วนแบ่งเจ้าของ</TableColumn>
                <TableColumn>วันที่สร้าง</TableColumn>
                <TableColumn align="center">จัดการ</TableColumn>
              </TableHeader>
              <TableBody>
                {pros.map((pro) => (
                  <TableRow
                    key={pro.uid}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`/pros/${pro.uid}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={pro.avatarUrl}
                          name={pro.displayName}
                          size="sm"
                          className="bg-green-100 text-green-700 flex-shrink-0"
                        />
                        <div>
                          <p className="font-medium">{pro.displayName}</p>
                          {pro.nickname && (
                            <p className="text-xs text-gray-400">
                              ({pro.nickname})
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{pro.email}</TableCell>
                    <TableCell>{pro.phone || "-"}</TableCell>
                    <TableCell>
                      {((pro.commissionRate ?? 0) * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell>
                      {format(new Date(pro.createdAt), "d MMM yyyy", {
                        locale: th,
                      })}
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          isIconOnly
                          title="แก้ไข"
                          onPress={() => handleOpenEdit(pro)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="warning"
                          isIconOnly
                          title="รีเซ็ตรหัสผ่าน"
                          onPress={() => handleOpenReset(pro)}
                        >
                          <KeyRound size={16} />
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

      {/* Create Pro Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onModalClose) => (
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalHeader className="text-gray-800">
                เพิ่มโปรใหม่
              </ModalHeader>
              <ModalBody className="gap-4">
                {/* Photo upload */}
                <div className="flex flex-col items-center gap-3">
                  <label className="cursor-pointer group relative">
                    {photoPreview ? (
                      <Avatar src={photoPreview} className="w-24 h-24" />
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

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="ชื่อ-นามสกุล"
                    placeholder="กรอกชื่อ-นามสกุล"
                    {...register("displayName")}
                    isInvalid={!!errors.displayName}
                    errorMessage={errors.displayName?.message}
                  />
                  <Input
                    label="ชื่อเล่น"
                    placeholder="กรอกชื่อเล่น (ไม่บังคับ)"
                    {...register("nickname")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="อีเมล"
                    type="email"
                    placeholder="กรอกอีเมล"
                    {...register("email")}
                    isInvalid={!!errors.email}
                    errorMessage={errors.email?.message}
                  />
                  <Input
                    label="รหัสผ่าน"
                    type="password"
                    placeholder="กรอกรหัสผ่าน"
                    {...register("password")}
                    isInvalid={!!errors.password}
                    errorMessage={errors.password?.message}
                  />
                </div>

                <Input
                  label="เบอร์โทรศัพท์"
                  placeholder="กรอกเบอร์โทรศัพท์"
                  {...register("phone")}
                  isInvalid={!!errors.phone}
                  errorMessage={errors.phone?.message}
                />

                <Textarea
                  label="ความเชี่ยวชาญ"
                  placeholder="เช่น สอนวงสวิง, พัตติ้ง, เกมสั้น ..."
                  {...register("proficiency")}
                  minRows={5}
                />

                <Textarea
                  label="การศึกษา"
                  placeholder="เช่น ปริญญาตรี วิทยาศาสตร์การกีฬา ..."
                  {...register("education")}
                  minRows={5}
                />

                <Textarea
                  label="ประวัติด้านกีฬา"
                  placeholder="เช่น นักกอล์ฟทีมชาติ, แชมป์รายการ ..."
                  {...register("athleticBackground")}
                  minRows={5}
                />

                <Input
                  label="ส่วนแบ่งเจ้าของ (0-1)"
                  description="เช่น 0.3 = เจ้าของ 30%, โปร 70%"
                  type="number"
                  step="0.01"
                  placeholder="เช่น 0.3"
                  {...register("commissionRate", { valueAsNumber: true })}
                  isInvalid={!!errors.commissionRate}
                  errorMessage={errors.commissionRate?.message}
                />
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
                  สร้างบัญชี
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Pro Modal */}
      <Modal isOpen={isEditOpen} onOpenChange={onEditOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onModalClose) => (
            <form onSubmit={handleEditSubmit(onEditSubmit)}>
              <ModalHeader className="text-gray-800">
                แก้ไขข้อมูลโปร
                {editingPro && (
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    ({editingPro.displayName})
                  </span>
                )}
              </ModalHeader>
              <ModalBody className="gap-4">
                {/* Photo upload */}
                <div className="flex flex-col items-center gap-3">
                  <label className="cursor-pointer group relative">
                    {photoPreview ? (
                      <Avatar src={photoPreview} className="w-24 h-24" />
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

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="ชื่อ-นามสกุล"
                    placeholder="กรอกชื่อ-นามสกุล"
                    {...registerEdit("displayName")}
                    isInvalid={!!editErrors.displayName}
                    errorMessage={editErrors.displayName?.message}
                  />
                  <Input
                    label="ชื่อเล่น"
                    placeholder="กรอกชื่อเล่น (ไม่บังคับ)"
                    {...registerEdit("nickname")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="อีเมล"
                    type="email"
                    placeholder="กรอกอีเมล"
                    {...registerEdit("email")}
                    isInvalid={!!editErrors.email}
                    errorMessage={editErrors.email?.message}
                  />
                  <Input
                    label="เบอร์โทรศัพท์"
                    placeholder="กรอกเบอร์โทรศัพท์"
                    {...registerEdit("phone")}
                    isInvalid={!!editErrors.phone}
                    errorMessage={editErrors.phone?.message}
                  />
                </div>

                <Textarea
                  label="ความเชี่ยวชาญ"
                  placeholder="เช่น สอนวงสวิง, พัตติ้ง, เกมสั้น ..."
                  {...registerEdit("proficiency")}
                  minRows={5}
                />

                <Textarea
                  label="การศึกษา"
                  placeholder="เช่น ปริญญาตรี วิทยาศาสตร์การกีฬา ..."
                  {...registerEdit("education")}
                  minRows={5}
                />

                <Textarea
                  label="ประวัติด้านกีฬา"
                  placeholder="เช่น นักกอล์ฟทีมชาติ, แชมป์รายการ ..."
                  {...registerEdit("athleticBackground")}
                  minRows={5}
                />

                <Input
                  label="ส่วนแบ่งเจ้าของ (0-1)"
                  description="เช่น 0.3 = เจ้าของ 30%, โปร 70%"
                  type="number"
                  step="0.01"
                  placeholder="เช่น 0.3"
                  {...registerEdit("commissionRate", { valueAsNumber: true })}
                  isInvalid={!!editErrors.commissionRate}
                  errorMessage={editErrors.commissionRate?.message}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onModalClose}>
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  isLoading={submitting}
                >
                  บันทึก
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={isResetOpen} onOpenChange={onResetOpenChange}>
        <ModalContent>
          {(onModalClose) => (
            <form onSubmit={handleResetSubmit(onResetPasswordSubmit)}>
              <ModalHeader className="text-gray-800">
                รีเซ็ตรหัสผ่าน
                {resetPro && (
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    ({resetPro.displayName})
                  </span>
                )}
              </ModalHeader>
              <ModalBody className="gap-4">
                <p className="text-sm text-gray-500">
                  กำหนดรหัสผ่านใหม่ให้โปร {resetPro?.displayName}
                </p>
                <Input
                  label="รหัสผ่านใหม่"
                  type="password"
                  placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  {...registerReset("newPassword")}
                  isInvalid={!!resetErrors.newPassword}
                  errorMessage={resetErrors.newPassword?.message}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onModalClose}>
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  color="warning"
                  isLoading={submitting}
                >
                  รีเซ็ตรหัสผ่าน
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
