"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { fadeUp } from "./utils";

const testimonials = [
	{
		text: "โปรอธิบายเป็นระบบ เข้าใจง่าย พื้นฐานสวิงแน่นขึ้นมากภายใน 3 เดือนแรก เหมาะมากสำหรับคนที่เพิ่งเริ่มเล่นกอล์ฟ",
		name: "คุณชัย",
		detail: "นักเรียนหลักสูตร Foundation",
	},
	{
		text: "ชอบที่โปรใช้วิดีโอวิเคราะห์สวิงหลังจบคลาส ทำให้เห็นจุดที่ต้องปรับปรุงชัดเจน วงสวิงมั่นคงขึ้นมากและ Handicap ลดลงจริง",
		name: "คุณมิ้นท์",
		detail: "นักเรียนหลักสูตร Performance",
	},
	{
		text: "โปรออกแบบการสอนให้เข้ากับสรีระของเราโดยเฉพาะ ระยะไดรฟ์เพิ่มขึ้นอย่างเห็นได้ชัดหลังปรับเทคนิค ประทับใจในความใส่ใจของทีมโปร",
		name: "คุณต้น",
		detail: "นักเรียนหลักสูตร Competitive",
	},
];

export function TestimonialsSection() {
	return (
		<section className="py-24 sm:py-32 bg-[#faf9f7]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto">
					<span className="text-[#800020] font-semibold text-sm tracking-wide uppercase">
						Testimonials
					</span>
					<h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
						ผลลัพธ์จากผู้เรียนของเรา
					</h2>
					<p className="mt-4 text-gray-500 text-lg">
						ความไว้วางใจจากนักเรียนกว่า 100 คน
						ที่เลือกพัฒนาทักษะกอล์ฟกับ Teetime
					</p>
				</motion.div>

				<div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
					{testimonials.map((t, i) => (
						<motion.div
							key={t.name}
							{...fadeUp(i * 0.1)}
							className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300"
						>
							<Quote
								className="absolute top-6 right-6 text-rose-100"
								size={32}
								fill="currentColor"
							/>
							<div className="flex gap-1 mb-5">
								{[...Array(5)].map((_, j) => (
									<Star
										// biome-ignore lint: decorative stars
										key={j}
										className="text-amber-400 fill-amber-400"
										size={16}
									/>
								))}
							</div>
							<p className="text-gray-600 leading-relaxed mb-6 relative">
								&ldquo;{t.text}&rdquo;
							</p>
							<div className="flex items-center gap-3 pt-4 border-t border-gray-50">
								<div className="w-10 h-10 rounded-full bg-linear-to-br from-[#800020] to-[#6B1528] flex items-center justify-center">
									<span className="text-white text-sm font-bold">
										{t.name.charAt(3)}
									</span>
								</div>
								<div>
									<div className="font-semibold text-gray-900 text-sm">
										{t.name}
									</div>
									<div className="text-gray-400 text-xs">{t.detail}</div>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
