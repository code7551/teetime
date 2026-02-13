"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CreditCard,
  CalendarDays,
  LogOut,
  DollarSign,
  ClipboardCheck,
  Menu,
  X,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const ownerNav: NavItem[] = [
  {
    label: "แดชบอร์ด",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  { label: "โปรโค้ช", href: "/pros", icon: <Users size={20} /> },
  {
    label: "นักเรียน",
    href: "/students",
    icon: <GraduationCap size={20} />,
  },
  {
    label: "คอร์สเรียน",
    href: "/courses",
    icon: <ClipboardCheck size={20} />,
  },
  {
    label: "การชำระเงิน",
    href: "/payments",
    icon: <CreditCard size={20} />,
  },
  {
    label: "ตารางเรียน",
    href: "/timetable",
    icon: <CalendarDays size={20} />,
  },
  {
    label: "บัญชี LINE",
    href: "/line-accounts",
    icon: <MessageCircle size={20} />,
  },
];

const proNav: NavItem[] = [
  {
    label: "แดชบอร์ด",
    href: "/pro/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "นักเรียน",
    href: "/pro/students",
    icon: <GraduationCap size={20} />,
  },
  {
    label: "ตารางเรียน",
    href: "/pro/timetable",
    icon: <CalendarDays size={20} />,
  },
  {
    label: "รายได้",
    href: "/pro/income",
    icon: <DollarSign size={20} />,
  },
];

export default function Sidebar({ variant }: { variant: "owner" | "pro" }) {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const items = variant === "owner" ? ownerNav : proNav;

  const NavContent = () => (
    <>
      <div className="p-5 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="TeeTime Golf Center"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div className="leading-tight">
            <h1 className="text-base font-bold text-gray-800">TeeTime</h1>
            <p className="text-[10px] text-gray-400">Golf Center</p>
          </div>
        </Link>
      </div>

      <div className="p-4 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-800 truncate">
          {user?.displayName}
        </p>
        <p className="text-xs text-gray-500 capitalize">
          {variant === "owner" ? "เจ้าของ" : "โปรโค้ช"}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-green-100 text-green-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut size={20} />
          ออกจากระบบ
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col h-screen transition-transform lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}
