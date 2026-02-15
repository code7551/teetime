"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface SubPageHeaderProps {
  title: string;
}

export default function SubPageHeader({ title }: SubPageHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Link
        href="/miniapp"
        className="flex items-center justify-center w-8 h-8 -ml-1 rounded-full text-gray-400 hover:text-gray-600 active:bg-gray-100 transition-all shrink-0"
      >
        <ChevronLeft size={22} />
      </Link>
      <h2 className="text-lg font-semibold text-gray-900 truncate">{title}</h2>
    </div>
  );
}
