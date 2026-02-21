"use client";

import type { ReactNode } from "react";
import { MiniAppProvider, useMiniApp } from "@/hooks/useMiniApp";
import Image from "next/image";
import Link from "next/link";
import { Wallet } from "lucide-react";

function StudentHeader() {
  const { isLinked } = useMiniApp();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-2.5 flex items-center gap-3 shadow-sm">
      <Link href="/miniapp" className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="TeeTime Golf Center"
          width={36}
          height={36}
          className="rounded-lg"
        />
        <div className="leading-tight">
          <p className="text-sm font-bold text-gray-800">TeeTime</p>
          <p className="text-[10px] text-gray-400">Golf Center</p>
        </div>
      </Link>
      <div className="flex-1" />
      {isLinked && (
        <Link
          href="/payment"
          className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-medium active:bg-emerald-100 transition-colors"
        >
          <Wallet size={14} />
          ชำระเงิน
        </Link>
      )}
    </header>
  );
}

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <MiniAppProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <StudentHeader />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-6">
          {children}
        </main>
      </div>
    </MiniAppProvider>
  );
}
