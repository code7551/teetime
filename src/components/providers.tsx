"use client";

import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "@/hooks/useAuth";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <HeroUIProvider>
      <AuthProvider>{children}</AuthProvider>
    </HeroUIProvider>
  );
}
