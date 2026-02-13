"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface SubPageHeaderProps {
  title: string;
  icon?: ReactNode;
}

export default function SubPageHeader({ title, icon }: SubPageHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <Link
        href="/miniapp"
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95 transition-all shrink-0"
      >
        <ArrowLeft size={18} />
      </Link>
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <h2 className="text-lg font-bold text-gray-800 truncate">{title}</h2>
      </div>
    </div>
  );
}
