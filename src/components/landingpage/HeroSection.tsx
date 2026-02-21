"use client";

import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { fadeUp } from "./utils";

export function HeroSection() {
	return (
		<section className="relative min-h-screen flex items-center overflow-hidden">
			<div className="absolute inset-0 bg-linear-to-br from-[#1C0A10] via-[#2D0F18] to-[#3D1525]" />
			<div className="absolute inset-0">
				<div className="absolute top-1/4 -left-20 w-96 h-96 bg-rose-400 rounded-full blur-3xl opacity-[0.07]" />
				<div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-pink-400 rounded-full blur-3xl opacity-[0.07]" />
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500 rounded-full blur-[120px] opacity-[0.05]" />
				<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjAuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
			</div>

			<div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
				<div className="max-w-3xl">
					<motion.div {...fadeUp(0)}>
						<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/8 backdrop-blur-sm border border-white/12 text-rose-200 text-sm font-medium mb-6 sm:mb-8">
							<span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
							PGA Certified Professionals
						</span>
					</motion.div>

					<motion.h1
						{...fadeUp(0.1)}
						className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight"
					>
						Elevate Your Game
						<br />
						<span className="text-transparent bg-clip-text bg-linear-to-r from-amber-200 to-amber-400">
							with Teetime
						</span>
					</motion.h1>

					<motion.p
						{...fadeUp(0.2)}
						className="mt-6 sm:mt-8 text-lg sm:text-xl text-rose-100/70 leading-relaxed max-w-2xl"
					>
						สถาบันพัฒนาทักษะกอล์ฟระดับพรีเมียม
						ด้วยทีมโปรที่ผ่านการแข่งขันระดับประเทศและได้รับการรับรองจาก PGA
						Thailand พร้อมหลักสูตรเฉพาะบุคคลที่ออกแบบตามเป้าหมายของคุณ
					</motion.p>

					<motion.div
						{...fadeUp(0.3)}
						className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4"
					>
						<a href="#contact">
							<Button
								size="lg"
								className="bg-amber-400 text-[#2D0F18] font-semibold px-8 h-14 text-base shadow-xl shadow-amber-400/20 hover:bg-amber-300 hover:shadow-2xl hover:shadow-amber-400/30 hover:scale-[1.02] transition-all w-full sm:w-auto"
								endContent={<ChevronRight size={18} />}
							>
								นัดเรียนทดลอง
							</Button>
						</a>
						<a href="#programs">
							<Button
								size="lg"
								variant="bordered"
								className="border-white/20 text-white font-medium px-8 h-14 text-base hover:bg-white/8 transition-all w-full sm:w-auto"
							>
								ดูหลักสูตรทั้งหมด
							</Button>
						</a>
					</motion.div>

					<motion.div
						{...fadeUp(0.4)}
						className="mt-14 sm:mt-20 flex items-center gap-10 sm:gap-14"
					>
						{[
							{ value: "100+", label: "นักเรียนที่ไว้วางใจ" },
							{ value: "1,000+", label: "ชั่วโมงการสอน" },
							{ value: "PGA", label: "Certified Pros" },
						].map((stat, i) => (
							<div key={stat.label} className="flex items-center gap-10 sm:gap-14">
								{i > 0 && (
									<div className="w-px h-10 bg-white/10 -ml-10 sm:-ml-14" />
								)}
								<div>
									<div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
										{stat.value}
									</div>
									<div className="text-xs sm:text-sm text-rose-200/40 mt-1 font-medium">
										{stat.label}
									</div>
								</div>
							</div>
						))}
					</motion.div>
				</div>
			</div>

			<div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#faf9f7] to-transparent" />
		</section>
	);
}
