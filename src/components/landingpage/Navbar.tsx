"use client";

import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
	{ href: "#about", label: "เกี่ยวกับเรา" },
	{ href: "#pros", label: "ทีมโปร" },
	{ href: "#programs", label: "โปรแกรมเรียน" },
	{ href: "#why-us", label: "ทำไมต้องเรา" },
	{ href: "#contact", label: "ติดต่อ" },
];

export function Navbar() {
	const [scrolled, setScrolled] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener("scroll", onScroll);
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<motion.nav
			initial={{ y: -80 }}
			animate={{ y: 0 }}
			transition={{ duration: 0.5, ease: "easeOut" }}
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
				scrolled
					? "bg-white/80 backdrop-blur-xl shadow-lg shadow-green-900/5 border-b border-green-100"
					: "bg-transparent"
			}`}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16 sm:h-20">
					<Link href="/" className="flex items-center gap-2 sm:gap-3 group">
						<img
							src="/logo.png"
							alt="Teetime Logo"
							className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 transition-shadow object-cover bg-white"
						/>
						<span
							className={`font-bold text-lg sm:text-xl tracking-tight transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}
						>
							Teetime
							<span className="text-green-500"> Golf Center</span>
						</span>
					</Link>

					<div className="hidden lg:flex items-center gap-1">
						{navLinks.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									scrolled
										? "text-gray-600 hover:text-green-600 hover:bg-green-50"
										: "text-white/80 hover:text-white hover:bg-white/10"
								}`}
							>
								{link.label}
							</a>
						))}
					</div>

					<div className="hidden lg:flex items-center gap-3">
						<a href="#contact">
							<Button
								variant="flat"
								className={`font-medium ${
									scrolled
										? "bg-green-600 text-white hover:bg-green-700"
										: "bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm"
								}`}
							>
								สมัครเรียน
							</Button>
						</a>
					</div>

					<button
						type="button"
						onClick={() => setMobileOpen(!mobileOpen)}
						className={`lg:hidden p-2 rounded-lg transition-colors ${
							scrolled
								? "text-gray-600 hover:bg-gray-100"
								: "text-white hover:bg-white/10"
						}`}
					>
						{mobileOpen ? <X size={22} /> : <Menu size={22} />}
					</button>
				</div>
			</div>

			{mobileOpen && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					className="lg:hidden bg-white border-t border-gray-100 shadow-xl"
				>
					<div className="px-4 py-4 space-y-1">
						{navLinks.map((link) => (
							<a
								key={link.href}
								href={link.href}
								onClick={() => setMobileOpen(false)}
								className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 font-medium transition-colors"
							>
								{link.label}
							</a>
						))}
						<div className="pt-3 border-t border-gray-100">
							<Button
								as="a"
								href="#contact"
								color="success"
								className="w-full font-semibold"
								size="lg"
								onPress={() => setMobileOpen(false)}
							>
								สมัครเรียน
							</Button>
						</div>
					</div>
				</motion.div>
			)}
		</motion.nav>
	);
}
