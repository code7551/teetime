"use client";

import { ReactNode } from "react";
import { MiniAppProvider } from "@/hooks/useMiniApp";
import Image from "next/image";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <MiniAppProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Sticky header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-3 shadow-sm">
          <Image
            src="/logo.jpg"
            alt="TeeTime Golf Center"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <div className="leading-tight">
            <p className="text-sm font-bold text-gray-800">TeeTime</p>
            <p className="text-[10px] text-gray-400">Golf Center</p>
          </div>
        </header>
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-6">
          {children}
        </main>
      </div>
    </MiniAppProvider>
  );
}
