"use client";

import { motion } from "framer-motion";
import { fadeUp } from "./utils";

const whyUsItems = [
	{
		title: "โปรผ่านการแข่งขันระดับประเทศ",
		description:
			"ทีมโปรทุกคนผ่านการแข่งขันในระดับ TGA, ASEAN Games และทัวร์นาเมนต์ระดับประเทศ ไม่ใช่แค่สอนเป็น แต่เคยทำจริง",
	},
	{
		title: "หลักสูตรเฉพาะบุคคล",
		description:
			"ทุกหลักสูตรถูกออกแบบให้เหมาะกับสรีระ ระดับฝีมือ และเป้าหมายของผู้เรียนแต่ละคน ไม่มีสูตรสำเร็จรูป",
	},
	{
		title: "รีวิวพร้อมวิดีโอหลังทุกคลาส",
		description:
			"หลังจบคลาส โปรจะส่งรีวิวพร้อมวิดีโอวิเคราะห์สวิงให้ นักเรียนดูย้อนหลังได้ทุกเมื่อผ่าน LINE",
	},
	{
		title: "ระบบติดตามความก้าวหน้า",
		description:
			"ดูชั่วโมงเรียน ประวัติการเรียน และรีวิวจากโปรได้ง่ายๆ ผ่านระบบออนไลน์ ติดตามพัฒนาการได้ตลอด",
	},
	{
		title: "ใช้หลัก Golf Biomechanics",
		description:
			"การสอนตามหลักชีวกลศาสตร์การเคลื่อนไหว ช่วยให้สวิงมีประสิทธิภาพสูงสุดและป้องกันการบาดเจ็บ",
	},
	{
		title: "เชื่อมต่อผ่าน LINE",
		description:
			"นักเรียนจัดการทุกอย่างผ่าน LINE Official Account ดูตาราง ชั่วโมง รีวิว และชำระเงินได้สะดวก",
	},
];

export function WhyUsSection() {
	return (
		<section id="why-us" className="py-24 sm:py-32 bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto">
					<span className="text-green-600 font-semibold text-sm tracking-wide uppercase">
						Why Teetime
					</span>
					<h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
						ทำไมต้อง Teetime Golf Center
					</h2>
					<p className="mt-4 text-gray-500 text-lg">
						สิ่งที่ทำให้เราแตกต่างจากสถาบันสอนกอล์ฟทั่วไป
					</p>
				</motion.div>

				<div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{whyUsItems.map((item, i) => (
						<motion.div key={item.title} {...fadeUp(i * 0.08)}>
							<div className="flex gap-4">
								<div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
									<span className="text-white text-sm font-bold">{i + 1}</span>
								</div>
								<div>
									<h3 className="font-bold text-gray-900">{item.title}</h3>
									<p className="mt-2 text-gray-500 text-sm leading-relaxed">
										{item.description}
									</p>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
