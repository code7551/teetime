"use client";

import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "react-hot-toast";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <HeroUIProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-center" />
      </AuthProvider>
    </HeroUIProvider>
  );
}
