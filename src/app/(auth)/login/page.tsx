"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button, Input } from "@heroui/react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-[-120px] left-[-120px] w-[360px] h-[360px] rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] rounded-full bg-teal-200/30 blur-3xl" />
      <div className="absolute top-1/2 left-1/3 w-[200px] h-[200px] rounded-full bg-green-100/20 blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white/60 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col items-center pt-10 pb-2 px-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
              className="relative mb-4"
            >
              <div className="w-[88px] h-[88px] rounded-2xl bg-gradient-to-br from-emerald-100 to-green-50 p-1 shadow-md ring-1 ring-emerald-200/50">
                <Image
                  src="/logo.jpg"
                  alt="Teetime Golf Center"
                  width={88}
                  height={88}
                  className="rounded-[14px] object-cover w-full h-full"
                  priority
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="text-center"
            >
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                Teetime Golf Center
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                เข้าสู่ระบบจัดการสำหรับผู้ดูแล
              </p>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="px-10 pt-4 pb-1">
            <div className="h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="px-8 pb-10 pt-5"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="อีเมล"
                type="email"
                variant="bordered"
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
                {...register("email")}
                size="lg"
                autoFocus
                autoComplete="username"
                startContent={
                  <Mail className="w-4 h-4 text-gray-400 pointer-events-none flex-shrink-0" />
                }
                classNames={{
                  inputWrapper:
                    "border-gray-200 hover:border-emerald-300 focus-within:!border-emerald-500 bg-gray-50/50 transition-colors",
                  label: "text-gray-500",
                }}
              />

              <Input
                label="รหัสผ่าน"
                type="password"
                variant="bordered"
                isInvalid={!!errors.password}
                errorMessage={errors.password?.message}
                {...register("password")}
                size="lg"
                autoComplete="current-password"
                startContent={
                  <Lock className="w-4 h-4 text-gray-400 pointer-events-none flex-shrink-0" />
                }
                classNames={{
                  inputWrapper:
                    "border-gray-200 hover:border-emerald-300 focus-within:!border-emerald-500 bg-gray-50/50 transition-colors",
                  label: "text-gray-500",
                }}
              />

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-2.5"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold text-base shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 hover:from-emerald-700 hover:to-green-700 transition-all active:scale-[0.98]"
                isLoading={isSubmitting}
                size="lg"
                radius="lg"
                startContent={
                  !isSubmitting && <LogIn className="w-4.5 h-4.5" />
                }
              >
                เข้าสู่ระบบ
              </Button>
            </form>

            <p className="text-center text-gray-300 text-xs mt-8">
              © {new Date().getFullYear()} Teetime Golf Center
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
