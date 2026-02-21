"use client";

import { motion } from "framer-motion";
import {
	Trophy,
	Target,
	GraduationCap,
	Zap,
	CheckCircle,
} from "lucide-react";
import { fadeUp } from "./utils";

const programs = [
	{
		title: "หลักสูตรพื้นฐาน",
		subtitle: "Foundation",
		description:
			"สร้างรากฐานที่แข็งแกร่งตั้งแต่เริ่มต้น ครอบคลุมทุกทักษะสำคัญ ตั้งแต่ Grip, Stance ไปจนถึงวงสวิงที่ถูกต้องตามหลัก Biomechanics",
		features: [
			"Grip, Stance และ Posture ตามหลักสากล",
			"พัฒนาวงสวิงพื้นฐานที่มั่นคง",
			"Short Game และ Putting เบื้องต้น",
			"กฎ มารยาท และ Etiquette บนสนาม",
		],
		icon: GraduationCap,
		color: "burgundy",
	},
	{
		title: "พัฒนาฝีมือ",
		subtitle: "Performance",
		description:
			"สำหรับผู้เรียนที่มีพื้นฐานและต้องการพัฒนาอย่างเป็นระบบ เน้นวิเคราะห์และปรับปรุงเทคนิค เพิ่มระยะ และยกระดับ Short Game",
		features: [
			"วิเคราะห์สวิงด้วยวิดีโอพร้อมรีวิว",
			"เทคนิคเพิ่มระยะไดรฟ์อย่างถูกหลัก",
			"Approach, Chipping และ Putting ขั้นสูง",
			"Course Management เบื้องต้น",
		],
		icon: Target,
		color: "navy",
	},
	{
		title: "เตรียมแข่งขัน",
		subtitle: "Competitive",
		description:
			"โปรแกรมเข้มข้นสำหรับนักกอล์ฟที่ตั้งเป้าแข่งขัน เน้น Mental Game กลยุทธ์ในสนาม และแผนฝึกซ้อมระยะยาว",
		features: [
			"Mental Game และการจัดการความกดดัน",
			"กลยุทธ์ Course Management ขั้นสูง",
			"วิเคราะห์สวิงเชิงลึกด้วยวิดีโอ",
			"แผนฝึกซ้อมรายเดือน (Periodization)",
		],
		icon: Trophy,
		color: "gold",
	},
	{
		title: "หลักสูตรเยาวชน",
		subtitle: "Junior Development",
		description:
			"พัฒนานักกอล์ฟรุ่นเยาว์ด้วยหลักสูตรที่ออกแบบตามช่วงวัย สร้างพื้นฐานที่ถูกต้อง ควบคู่กับการปลูกฝังวินัยและน้ำใจนักกีฬา",
		features: [
			"การสอนที่ปรับตามพัฒนาการร่างกาย",
			"สร้างพื้นฐานเทคนิคที่ถูกต้องตามวัย",
			"เตรียมพร้อมสู่รายการแข่งขันเยาวชน",
			"ดูแลใกล้ชิดโดยโปรที่เชี่ยวชาญ",
		],
		icon: Zap,
		color: "plum",
	},
];

const programColorMap: Record<
	string,
	{ bg: string; icon: string; badge: string; check: string; border: string }
> = {
	burgundy: {
		bg: "bg-rose-50",
		icon: "text-[#800020]",
		badge: "bg-rose-100 text-[#800020]",
		check: "text-[#800020]",
		border: "group-hover:border-rose-200",
	},
	navy: {
		bg: "bg-slate-50",
		icon: "text-slate-700",
		badge: "bg-slate-100 text-slate-700",
		check: "text-slate-600",
		border: "group-hover:border-slate-200",
	},
	gold: {
		bg: "bg-amber-50",
		icon: "text-amber-700",
		badge: "bg-amber-100 text-amber-800",
		check: "text-amber-600",
		border: "group-hover:border-amber-200",
	},
	plum: {
		bg: "bg-purple-50",
		icon: "text-purple-700",
		badge: "bg-purple-100 text-purple-700",
		check: "text-purple-600",
		border: "group-hover:border-purple-200",
	},
};

export function ProgramsSection() {
	return (
		<section id="programs" className="py-24 sm:py-32 bg-[#faf9f7]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto">
					<span className="text-[#800020] font-semibold text-sm tracking-wide uppercase">
						Programs
					</span>
					<h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
						หลักสูตรที่ออกแบบเพื่อทุกเป้าหมาย
					</h2>
					<p className="mt-4 text-gray-500 text-lg">
						ครอบคลุมตั้งแต่ผู้เริ่มต้นจนถึงนักกอล์ฟระดับแข่งขัน
						ทุกหลักสูตรได้รับการออกแบบอย่างเป็นระบบโดยทีมโปรมืออาชีพ
					</p>
				</motion.div>

				<div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-2 gap-6">
					{programs.map((program, i) => {
						const colors = programColorMap[program.color];
						return (
							<motion.div
								key={program.title}
								{...fadeUp(i * 0.08)}
								className={`group p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 ${colors.border} hover:shadow-xl hover:shadow-gray-100/80 transition-all duration-300`}
							>
								<div className="flex items-start gap-4 mb-5">
									<div
										className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}
									>
										<program.icon className={colors.icon} size={24} />
									</div>
									<div>
										<h3 className="text-lg font-bold text-gray-900">
											{program.title}
										</h3>
										<span
											className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}
										>
											{program.subtitle}
										</span>
									</div>
								</div>
								<p className="text-gray-500 leading-relaxed mb-5 text-sm">
									{program.description}
								</p>
								<ul className="space-y-2.5">
									{program.features.map((feature) => (
										<li
											key={feature}
											className="flex items-center gap-2.5 text-sm"
										>
											<CheckCircle
												className={`${colors.check} shrink-0`}
												size={15}
											/>
											<span className="text-gray-600">{feature}</span>
										</li>
									))}
								</ul>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
