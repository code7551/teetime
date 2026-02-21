"use client";

import { motion } from "framer-motion";
import {
	Trophy,
	UserCheck,
	Video,
	BarChart3,
	Activity,
	MessageCircle,
} from "lucide-react";
import { fadeUp } from "./utils";

const whyUsItems = [
	{
		icon: Trophy,
		title: "โปรที่ผ่านสนามแข่งจริง",
		description:
			"ทีมผู้สอนทุกท่านมีประสบการณ์จริงในรายการระดับ TGA Tour, ASEAN Games และทัวร์นาเมนต์ระดับชาติ ไม่ใช่เพียงผู้สอน แต่คือนักกอล์ฟที่พิสูจน์ฝีมือแล้ว",
	},
	{
		icon: UserCheck,
		title: "ไม่มีสูตรสำเร็จรูป",
		description:
			"หลักสูตรทุกรายการถูกออกแบบเฉพาะบุคคล โดยพิจารณาจากสรีระ ระดับทักษะ และเป้าหมายของผู้เรียน เพื่อผลลัพธ์ที่วัดผลได้จริง",
	},
	{
		icon: Video,
		title: "รีวิวพร้อมวิดีโอวิเคราะห์",
		description:
			"หลังจบทุกคลาส โปรจะจัดทำรีวิวพร้อมวิดีโอวิเคราะห์สวิงส่งให้ผู้เรียน สามารถทบทวนได้ทุกเมื่อผ่าน LINE",
	},
	{
		icon: BarChart3,
		title: "ระบบติดตามพัฒนาการ",
		description:
			"ผู้เรียนสามารถตรวจสอบชั่วโมงเรียน ประวัติการฝึก และรีวิวจากโปรได้ผ่านระบบดิจิทัล ติดตามความก้าวหน้าอย่างโปร่งใส",
	},
	{
		icon: Activity,
		title: "อ้างอิงหลัก Golf Biomechanics",
		description:
			"การสอนอ้างอิงหลักชีวกลศาสตร์การเคลื่อนไหว ช่วยเพิ่มประสิทธิภาพวงสวิง ลดความเสี่ยงต่อการบาดเจ็บ",
	},
	{
		icon: MessageCircle,
		title: "จัดการทุกอย่างผ่าน LINE",
		description:
			"ตรวจสอบตาราง ชั่วโมงคงเหลือ รีวิว และชำระเงินได้สะดวกผ่าน LINE Official Account ทุกที่ทุกเวลา",
	},
];

export function WhyUsSection() {
	return (
		<section id="why-us" className="py-24 sm:py-32 bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto">
					<span className="text-[#800020] font-semibold text-sm tracking-wide uppercase">
						Why Teetime
					</span>
					<h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
						ความแตกต่างที่สร้างผลลัพธ์
					</h2>
					<p className="mt-4 text-gray-500 text-lg">
						มาตรฐานการสอนที่ผสมผสานประสบการณ์จริงในสนามแข่ง
						เทคโนโลยีสมัยใหม่ และหลักสูตรที่วัดผลได้
					</p>
				</motion.div>

				<div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{whyUsItems.map((item, i) => (
						<motion.div
							key={item.title}
							{...fadeUp(i * 0.08)}
							className="group p-6 rounded-2xl border border-gray-100 hover:border-rose-100 bg-white hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300"
						>
							<div className="w-10 h-10 rounded-xl bg-rose-50 group-hover:bg-[#800020] flex items-center justify-center mb-4 transition-colors duration-300">
								<item.icon
									className="text-[#800020] group-hover:text-white transition-colors duration-300"
									size={20}
								/>
							</div>
							<h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
							<p className="text-gray-500 text-sm leading-relaxed">
								{item.description}
							</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
