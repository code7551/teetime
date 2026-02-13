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
  useDisclosure,
} from "@heroui/react";
import { Plus, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { th } from "date-fns/locale/th";
import Link from "next/link";
import type { AppUser } from "@/types";

const createProSchema = z.object({
  displayName: z.string().min(1, "กรุณากรอกชื่อ"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  phone: z.string().min(9, "กรุณากรอกเบอร์โทรศัพท์"),
  commissionRate: z
    .number()
    .min(0, "ค่าคอมมิชชันต้องไม่ต่ำกว่า 0")
    .max(1, "ค่าคอมมิชชันต้องไม่เกิน 1"),
});

type CreateProForm = z.infer<typeof createProSchema>;

export default function ProsPage() {
  const { firebaseUser } = useAuth();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [pros, setPros] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchPros();
  }, [fetchPros]);

  const onSubmit = async (formData: CreateProForm) => {
    if (!firebaseUser) return;
    setSubmitting(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, role: "pro" }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "ไม่สามารถสร้างบัญชีได้");
      }
      reset();
      onClose();
      fetchPros();
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
          <h1 className="text-2xl font-bold text-gray-800">โปรโค้ช</h1>
          <p className="text-gray-500 mt-1">จัดการรายชื่อโปรโค้ชทั้งหมด</p>
        </div>
        <Button
          color="success"
          startContent={<Plus size={18} />}
          onPress={onOpen}
          className="text-white"
        >
          เพิ่มโปรโค้ช
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
          {pros.length === 0 ? (
            <p className="text-gray-400 text-center py-12">
              ยังไม่มีโปรโค้ชในระบบ
            </p>
          ) : (
            <Table aria-label="รายชื่อโปรโค้ช" removeWrapper>
              <TableHeader>
                <TableColumn>ชื่อ</TableColumn>
                <TableColumn>อีเมล</TableColumn>
                <TableColumn>เบอร์โทร</TableColumn>
                <TableColumn>ส่วนแบ่งเจ้าของ</TableColumn>
                <TableColumn>วันที่สร้าง</TableColumn>
                <TableColumn align="center">จัดการ</TableColumn>
              </TableHeader>
              <TableBody>
                {pros.map((pro) => (
                  <TableRow key={pro.uid}>
                    <TableCell className="font-medium">
                      {pro.displayName}
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
                      <Button
                        as={Link}
                        href={`/pros/${pro.uid}`}
                        size="sm"
                        variant="flat"
                        color="success"
                        startContent={<Eye size={16} />}
                      >
                        ดูโปรไฟล์
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Create Pro Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          {(onModalClose) => (
            <form onSubmit={handleSubmit(onSubmit)}>
              <ModalHeader className="text-gray-800">
                เพิ่มโปรโค้ชใหม่
              </ModalHeader>
              <ModalBody className="gap-4">
                <Input
                  label="ชื่อ-นามสกุล"
                  placeholder="กรอกชื่อ-นามสกุล"
                  {...register("displayName")}
                  isInvalid={!!errors.displayName}
                  errorMessage={errors.displayName?.message}
                />
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
                <Input
                  label="เบอร์โทรศัพท์"
                  placeholder="กรอกเบอร์โทรศัพท์"
                  {...register("phone")}
                  isInvalid={!!errors.phone}
                  errorMessage={errors.phone?.message}
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
    </div>
  );
}
