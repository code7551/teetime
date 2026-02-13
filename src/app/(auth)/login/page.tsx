"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button, Input, Card, CardBody, CardHeader } from "@heroui/react";

const loginSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "owner") router.replace("/dashboard");
      else if (user.role === "pro") router.replace("/pro/dashboard");
    }
  }, [user, loading, router]);

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsSubmitting(true);
      setError("");
      await signIn(data.email, data.password);
    } catch {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="flex flex-col items-center pt-8 pb-2">
          <div className="text-5xl mb-3">⛳</div>
          <h1 className="text-2xl font-bold text-green-700">
            Teetime Golf Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">เข้าสู่ระบบจัดการ</p>
        </CardHeader>
        <CardBody className="px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="อีเมล"
              type="email"
              variant="bordered"
              isInvalid={!!errors.email}
              errorMessage={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="รหัสผ่าน"
              type="password"
              variant="bordered"
              isInvalid={!!errors.password}
              errorMessage={errors.password?.message}
              {...register("password")}
            />
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            <Button
              type="submit"
              color="success"
              className="w-full text-white font-medium"
              isLoading={isSubmitting}
              size="lg"
            >
              เข้าสู่ระบบ
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
