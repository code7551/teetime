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
		title: "โปรระดับแข่งขัน",
		desc: "ทีมโปรผ่านการแข่งในระดับ TGA, ASEAN Games",
	},
	{
		icon: Target,
		title: "หลักสูตรเฉพาะบุคคล",
		desc: "ปรับการสอนให้เหมาะกับสรีระและเป้าหมายของคุณ",
	},
	{
		icon: GraduationCap,
		title: "PGA Certified",
		desc: "โปรผ่านการรับรองจาก PGA Thailand",
	},
	{
		icon: Heart,
		title: "สอนสนุก เข้าใจง่าย",
		desc: "บรรยากาศเป็นกันเอง เหมาะทุกวัย",
	},
];

export function AboutSection() {
	return (
		<section id="about" className="py-24 sm:py-32 bg-[#f9fafb]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
					<motion.div {...fadeUp()}>
						<span className="text-green-600 font-semibold text-sm tracking-wide uppercase">
							About Us
						</span>
						<h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
							ยกระดับเกมกอล์ฟของคุณ
							<br />
							<span className="text-green-600">กับโปรระดับมืออาชีพ</span>
						</h2>
						<p className="mt-6 text-gray-500 text-lg leading-relaxed">
							Teetime Golf Center คือสถาบันสอนกอล์ฟที่ก่อตั้งขึ้นด้วยความตั้งใจ
							ที่จะพัฒนาวงการกอล์ฟไทย ด้วยทีมโปรกอล์ฟที่ผ่านการแข่งขันระดับประเทศ
							และมีใบรับรองจาก PGA Thailand
						</p>
						<p className="mt-4 text-gray-500 text-lg leading-relaxed">
							เราเชื่อว่าทุกคนสามารถเล่นกอล์ฟได้ดี เมื่อมีครูที่เข้าใจและหลักสูตรที่เหมาะสม
							ไม่ว่าคุณจะเป็นมือใหม่ที่เพิ่งเริ่มต้น หรือนักกอล์ฟที่ต้องการยกระดับฝีมือ
						</p>

						<div className="mt-10 grid grid-cols-2 gap-6">
							{aboutFeatures.map((item) => (
								<div key={item.title} className="flex gap-3">
									<div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
										<item.icon className="text-green-600" size={20} />
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
						<div className="aspect-4/5 rounded-3xl bg-linear-to-br from-green-100 to-emerald-50 overflow-hidden relative">
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="text-center px-8">
									<div className="w-24 h-24 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30 mb-6">
										<span className="text-white text-4xl font-bold">T</span>
									</div>
									<h3 className="text-2xl font-bold text-green-800">
										Teetime Golf Center
									</h3>
									<p className="text-green-600/70 mt-2">
										Where Champions Are Made
									</p>
									<div className="mt-8 flex justify-center gap-4">
										{[...Array(5)].map((_, i) => (
											<Star
												// biome-ignore lint: decorative stars
												key={i}
												className="text-yellow-400 fill-yellow-400"
												size={20}
											/>
										))}
									</div>
								</div>
							</div>
						</div>
						<div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-5 border border-gray-100">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
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
