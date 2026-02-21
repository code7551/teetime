"use client";

import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
	{ href: "#about", label: "เกี่ยวกับเรา" },
	{ href: "#pros", label: "ทีมผู้สอน" },
	{ href: "#programs", label: "หลักสูตร" },
	{ href: "#pricing", label: "ราคา" },
	{ href: "#why-us", label: "จุดเด่น" },
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
					? "bg-white/80 backdrop-blur-xl shadow-lg shadow-black/3 border-b border-gray-100"
					: "bg-transparent"
			}`}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16 sm:h-20">
					<Link href="/" className="flex items-center gap-2 sm:gap-3 group">
						<img
							src="/logo.png"
							alt="Teetime Logo"
							className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-lg shadow-black/10 group-hover:shadow-black/20 transition-shadow object-cover bg-white"
						/>
						<span
							className={`font-bold text-lg sm:text-xl tracking-tight transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}
						>
							Teetime
							<span className={scrolled ? "text-[#800020]" : "text-amber-300"}>
								{" "}
								Golf Center
							</span>
						</span>
					</Link>

					<div className="hidden lg:flex items-center gap-1">
						{navLinks.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									scrolled
										? "text-gray-600 hover:text-[#800020] hover:bg-rose-50"
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
										? "bg-[#800020] text-white hover:bg-[#6B1528]"
										: "bg-white/12 text-white hover:bg-white/20 backdrop-blur-sm"
								}`}
							>
								นัดเรียนทดลอง
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
								className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-rose-50 hover:text-[#800020] font-medium transition-colors"
							>
								{link.label}
							</a>
						))}
						<div className="pt-3 border-t border-gray-100">
							<Button
								as="a"
								href="#contact"
								className="w-full font-semibold bg-[#800020] text-white hover:bg-[#6B1528]"
								size="lg"
								onPress={() => setMobileOpen(false)}
							>
								นัดเรียนทดลอง
							</Button>
						</div>
					</div>
				</motion.div>
			)}
		</motion.nav>
	);
}
