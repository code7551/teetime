"use client";

import { motion } from "framer-motion";
import {
	Trophy,
	Target,
	Users,
	Star,
	GraduationCap,
	Heart,
} from "lucide-react";
import { fadeUp } from "./utils";

const aboutFeatures = [
	{
		icon: Trophy,
		title: "ประสบการณ์ระดับแข่งขัน",
		desc: "ทีมโปรผ่านการชิงชัยในรายการ TGA Tour และ ASEAN Games",
	},
	{
		icon: Target,
		title: "หลักสูตรเฉพาะบุคคล",
		desc: "ออกแบบการสอนตามสรีระ ระดับฝีมือ และเป้าหมายของผู้เรียน",
	},
	{
		icon: GraduationCap,
		title: "PGA Thailand Certified",
		desc: "โปรทุกท่านได้รับการรับรองมาตรฐานวิชาชีพ",
	},
	{
		icon: Heart,
		title: "สภาพแวดล้อมที่เอื้อต่อการเรียนรู้",
		desc: "บรรยากาศเป็นมืออาชีพ เข้าถึงง่าย เหมาะกับผู้เรียนทุกวัย",
	},
];

export function AboutSection() {
	return (
		<section id="about" className="py-24 sm:py-32 bg-[#faf9f7]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
					<motion.div {...fadeUp()}>
						<span className="text-[#800020] font-semibold text-sm tracking-wide uppercase">
							About Us
						</span>
						<h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
							สถาบันพัฒนาทักษะกอล์ฟ
							<br />
							<span className="text-[#800020]">ที่ได้รับความไว้วางใจ</span>
						</h2>
						<p className="mt-6 text-gray-500 text-lg leading-relaxed">
							Teetime Golf Center
							ก่อตั้งขึ้นด้วยพันธกิจในการยกระดับมาตรฐานการเรียนการสอนกอล์ฟในประเทศไทย
							ทีมผู้สอนของเราประกอบด้วยโปรกอล์ฟที่มีประสบการณ์แข่งขันระดับชาติ
							และได้รับการรับรองจาก PGA Thailand ทุกท่าน
						</p>
						<p className="mt-4 text-gray-500 text-lg leading-relaxed">
							เราออกแบบหลักสูตรเฉพาะบุคคลโดยอ้างอิงหลัก Golf Biomechanics
							เพื่อให้ผู้เรียนทุกระดับ ตั้งแต่ผู้เริ่มต้นไปจนถึงนักกอล์ฟสมัครเล่นขั้นสูง
							สามารถพัฒนาได้อย่างเป็นระบบและยั่งยืน
						</p>

						<div className="mt-10 grid grid-cols-2 gap-6">
							{aboutFeatures.map((item) => (
								<div key={item.title} className="flex gap-3">
									<div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
										<item.icon className="text-[#800020]" size={20} />
									</div>
									<div>
										<h4 className="font-semibold text-gray-900 text-sm">
											{item.title}
										</h4>
										<p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
											{item.desc}
										</p>
									</div>
								</div>
							))}
						</div>
					</motion.div>

					<motion.div {...fadeUp(0.2)} className="relative">
						<div className="aspect-4/5 rounded-3xl bg-linear-to-br from-rose-50 to-[#faf5f0] overflow-hidden relative border border-rose-100/50">
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="text-center px-8">
									<div className="w-24 h-24 rounded-full bg-linear-to-br from-[#800020] to-[#6B1528] flex items-center justify-center mx-auto shadow-2xl shadow-[#800020]/20 mb-6">
										<span className="text-white text-4xl font-bold">T</span>
									</div>
									<h3 className="text-2xl font-bold text-[#4A0E1B]">
										Teetime Golf Center
									</h3>
									<p className="text-[#800020]/60 mt-2 font-medium">
										Excellence in Golf Instruction
									</p>
									<div className="mt-8 flex justify-center gap-4">
										{[...Array(5)].map((_, i) => (
											<Star
												// biome-ignore lint: decorative stars
												key={i}
												className="text-amber-400 fill-amber-400"
												size={20}
											/>
										))}
									</div>
								</div>
							</div>
						</div>
						<div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl shadow-black/6 p-5 border border-gray-100">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-xl bg-[#800020] flex items-center justify-center">
									<Users className="text-white" size={22} />
								</div>
								<div>
									<div className="text-2xl font-bold text-gray-900">100+</div>
									<div className="text-sm text-gray-400">นักเรียนที่ไว้วางใจ</div>
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
