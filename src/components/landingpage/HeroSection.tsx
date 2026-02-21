"use client";

import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { fadeUp } from "./utils";

export function HeroSection() {
	return (
		<section className="relative min-h-screen flex items-center overflow-hidden">
			<div className="absolute inset-0 bg-linear-to-br from-green-950 via-green-900 to-emerald-900" />
			<div className="absolute inset-0">
				<div className="absolute top-1/4 -left-20 w-96 h-96 bg-green-400 rounded-full blur-3xl opacity-15" />
				<div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-400 rounded-full blur-3xl opacity-15" />
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500 rounded-full blur-[120px] opacity-10" />
			</div>

			<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
				<div className="max-w-3xl">
					<motion.div {...fadeUp(0)}>
						<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-green-200 text-sm font-medium mb-6 sm:mb-8">
							<span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
							สถาบันสอนกอล์ฟโดยโปรมืออาชีพ
						</span>
					</motion.div>

					<motion.h1
						{...fadeUp(0.1)}
						className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight"
					>
						Teetime
						<br />
						<span className="text-transparent bg-clip-text bg-linear-to-r from-green-300 to-emerald-300">
							Golf Center
						</span>
					</motion.h1>

					<motion.p
						{...fadeUp(0.2)}
						className="mt-6 sm:mt-8 text-lg sm:text-xl text-green-100/80 leading-relaxed max-w-2xl"
					>
						สถาบันสอนกอล์ฟครบวงจร ด้วยทีมโปรกอล์ฟที่มีประสบการณ์ระดับประเทศ
						พร้อมหลักสูตรที่ปรับให้เหมาะกับผู้เรียนทุกระดับ
						ตั้งแต่มือใหม่ไปจนถึงนักกอล์ฟที่ต้องการพัฒนาฝีมือ
					</motion.p>

					<motion.div
						{...fadeUp(0.3)}
						className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4"
					>
						<a href="#contact">
							<Button
								size="lg"
								className="bg-white text-green-800 font-semibold px-8 h-14 text-base shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 hover:scale-[1.02] transition-all w-full sm:w-auto"
								endContent={<ChevronRight size={18} />}
							>
								สมัครเรียนกอล์ฟ
							</Button>
						</a>
						<a href="#pros">
							<Button
								size="lg"
								variant="bordered"
								className="border-white/30 text-white font-medium px-8 h-14 text-base hover:bg-white/10 transition-all w-full sm:w-auto"
							>
								พบทีมโปรของเรา
							</Button>
						</a>
					</motion.div>

					<motion.div
						{...fadeUp(0.4)}
						className="mt-12 sm:mt-16 grid grid-cols-3 gap-8 sm:gap-12 max-w-md"
					>
						{[
							{ value: "3", label: "โปรกอล์ฟมืออาชีพ" },
							{ value: "100+", label: "นักเรียน" },
							{ value: "1,000+", label: "ชั่วโมงสอน" },
						].map((stat) => (
							<div key={stat.label}>
								<div className="text-2xl sm:text-3xl font-bold text-white">
									{stat.value}
								</div>
								<div className="text-xs sm:text-sm text-green-200/60 mt-1">
									{stat.label}
								</div>
							</div>
						))}
					</motion.div>
				</div>
			</div>

			<div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#f9fafb] to-transparent" />
		</section>
	);
}
