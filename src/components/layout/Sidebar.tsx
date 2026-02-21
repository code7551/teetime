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
	FileEdit,
	ScrollText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

interface NavItem {
	label: string;
	href: string;
	icon: React.ReactNode;
}

interface NavGroup {
	title: string;
	items: NavItem[];
}

const ownerNav: NavGroup[] = [
	{
		title: "",
		items: [
			{
				label: "แดชบอร์ด",
				href: "/dashboard",
				icon: <LayoutDashboard size={20} />,
			},
			{
				label: "ตารางสอน",
				href: "/timetable",
				icon: <CalendarDays size={20} />,
			},
		],
	},
	{
		title: "บุคลากร",
		items: [
			{ label: "รายชื่อโปร", href: "/pros", icon: <Users size={20} /> },
			{
				label: "นักเรียน",
				href: "/students",
				icon: <GraduationCap size={20} />,
			},
		],
	},
	{
		title: "การเรียน",
		items: [
			{
				label: "คอร์สเรียน",
				href: "/courses",
				icon: <ClipboardCheck size={20} />,
			},
			{
				label: "รีวิวการสอน",
				href: "/teaching-reviews",
				icon: <FileEdit size={20} />,
			},
		],
	},
	{
		title: "การเงิน",
		items: [
			{
				label: "รายได้โปร",
				href: "/pro-income",
				icon: <DollarSign size={20} />,
			},
			{
				label: "การชำระเงิน",
				href: "/payments",
				icon: <CreditCard size={20} />,
			},
		],
	},
	{
		title: "ระบบ",
		items: [
			{
				label: "บันทึกชั่วโมง",
				href: "/audit-logs",
				icon: <ScrollText size={20} />,
			},
			{
				label: "บัญชี LINE",
				href: "/line-accounts",
				icon: <MessageCircle size={20} />,
			},
		],
	},
];

const proNav: NavGroup[] = [
	{
		title: "",
		items: [
			{
				label: "แดชบอร์ด",
				href: "/pro/dashboard",
				icon: <LayoutDashboard size={20} />,
			},
			{
				label: "ตารางสอน",
				href: "/pro/timetable",
				icon: <CalendarDays size={20} />,
			},
		],
	},
	{
		title: "การสอน",
		items: [
			{
				label: "นักเรียน",
				href: "/pro/students",
				icon: <GraduationCap size={20} />,
			},
			{
				label: "รีวิวการสอน",
				href: "/pro/reviews",
				icon: <FileEdit size={20} />,
			},
		],
	},
	{
		title: "การเงิน",
		items: [
			{
				label: "รายได้",
				href: "/pro/income",
				icon: <DollarSign size={20} />,
			},
		],
	},
];

export default function Sidebar({ variant }: { variant: "owner" | "pro" }) {
	const pathname = usePathname();
	const { signOut, user } = useAuth();
	const [isOpen, setIsOpen] = useState(false);
	const groups = variant === "owner" ? ownerNav : proNav;

	return (
		<>
			{/* Mobile hamburger */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
				type="button"
			>
				{isOpen ? <X size={20} /> : <Menu size={20} />}
			</button>

			{/* Mobile overlay */}
			{isOpen && (
				<button
					type="button"
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
				<div className="p-5 border-b border-gray-200">
					<Link href="/dashboard" className="flex items-center gap-3">
						<Image
							src="/logo.png"
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

				<nav className="flex-1 overflow-y-auto p-4 space-y-4">
					{groups.map((group) => (
						<div key={group.title}>
							<p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
								{group.title}
							</p>
							<div className="space-y-0.5">
								{group.items.map((item) => {
									const isActive = pathname === item.href;
									return (
										<Link
											key={item.href}
											href={item.href}
											onClick={() => setIsOpen(false)}
											className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
							</div>
						</div>
					))}
				</nav>

				<div className="p-4 border-t border-gray-200">
					<button
						type="button"
						onClick={signOut}
						className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
					>
						<LogOut size={20} />
						ออกจากระบบ
					</button>
				</div>
			</aside>
		</>
	);
}
