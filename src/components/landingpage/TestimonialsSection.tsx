"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { fadeUp } from "./utils";

const testimonials = [
	{
		text: "โค้ชสอนดีมาก อธิบายเข้าใจง่าย สวิงดีขึ้นเยอะเลยครับ",
		name: "คุณชัย",
		detail: "เรียนมา 3 เดือน",
	},
	{
		text: "ปรับวงสวิงได้ดีขึ้นมาก ชอบที่โค้ชใช้วิดีโอวิเคราะห์สวิง ทำให้เห็นจุดที่ต้องแก้ชัดเจน",
		name: "คุณมิ้นท์",
		detail: "เรียนมา 6 เดือน",
	},
	{
		text: "ประทับใจการสอน โค้ชปรับให้เหมาะกับสรีระของเราโดยเฉพาะ ระยะไดรฟ์ไกลขึ้นหลังจากปรับท่า",
		name: "คุณต้น",
		detail: "เรียนมา 1 ปี",
	},
];

export function TestimonialsSection() {
	return (
		<section className="py-24 sm:py-32 bg-[#f9fafb]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto">
					<span className="text-green-600 font-semibold text-sm tracking-wide uppercase">
						Testimonials
					</span>
					<h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
						เสียงจากนักเรียนของเรา
					</h2>
				</motion.div>

				<div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
					{testimonials.map((t, i) => (
						<motion.div
							key={t.name}
							{...fadeUp(i * 0.1)}
							className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
						>
							<div className="flex gap-1 mb-4">
								{[...Array(5)].map((_, j) => (
									<Star
										// biome-ignore lint: decorative stars
										key={j}
										className="text-yellow-400 fill-yellow-400"
										size={16}
									/>
								))}
							</div>
							<p className="text-gray-600 leading-relaxed mb-6">
								&ldquo;{t.text}&rdquo;
							</p>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-linear-to-br from-green-400 to-emerald-500 flex items-center justify-center">
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
