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
		title: "กอล์ฟเริ่มต้น",
		subtitle: "Beginner",
		description:
			"เรียนรู้พื้นฐานกอล์ฟทั้งหมดจากศูนย์ ตั้งแต่การจับไม้ การยืน ไปจนถึงวงสวิงที่ถูกต้อง เหมาะสำหรับผู้ที่ไม่เคยเล่นกอล์ฟมาก่อน",
		features: [
			"สร้าง Grip, Stance, Posture ที่ถูกต้อง",
			"พื้นฐานวงสวิงที่มั่นคง",
			"เรียนรู้ Short Game เบื้องต้น",
			"มารยาทและกฎกอล์ฟเบื้องต้น",
		],
		icon: GraduationCap,
		color: "green",
	},
	{
		title: "พัฒนาฝีมือ",
		subtitle: "Intermediate",
		description:
			"สำหรับผู้ที่มีพื้นฐานแล้วและต้องการพัฒนาให้ดียิ่งขึ้น เน้นการปรับแก้วงสวิง เพิ่มระยะ และพัฒนา Short Game",
		features: [
			"วิเคราะห์และปรับแก้วงสวิง",
			"เพิ่มระยะไดรฟ์อย่างถูกวิธี",
			"พัฒนา Approach & Putting",
			"Course Management เบื้องต้น",
		],
		icon: Target,
		color: "blue",
	},
	{
		title: "เตรียมแข่งขัน",
		subtitle: "Advanced",
		description:
			"โปรแกรมสำหรับนักกอล์ฟที่ต้องการเตรียมตัวแข่งขัน เน้น Mental Game, กลยุทธ์ในสนาม และการฝึกซ้อมอย่างมีแบบแผน",
		features: [
			"Mental Game & สมาธิในการแข่ง",
			"กลยุทธ์และ Course Management ขั้นสูง",
			"วิเคราะห์สวิงด้วยวิดีโอ",
			"แผนฝึกซ้อมระยะยาว (Practice Planning)",
		],
		icon: Trophy,
		color: "purple",
	},
	{
		title: "กอล์ฟเยาวชน",
		subtitle: "Junior",
		description:
			"หลักสูตรพิเศษสำหรับเยาวชน สอนสนุก เข้าใจง่าย สร้างพื้นฐานที่แข็งแกร่งพร้อมปลูกฝังความรักในกีฬากอล์ฟ",
		features: [
			"สอนสนุกแบบเด็กๆ ชอบ",
			"พื้นฐานที่ถูกต้องตามวัย",
			"เตรียมพร้อมสู่การแข่งขันเยาวชน",
			"ดูแลใกล้ชิดโดยโปรที่มีประสบการณ์",
		],
		icon: Zap,
		color: "orange",
	},
];

const programColorMap: Record<
	string,
	{ bg: string; icon: string; badge: string; check: string }
> = {
	green: {
		bg: "bg-green-50",
		icon: "text-green-600",
		badge: "bg-green-100 text-green-700",
		check: "text-green-500",
	},
	blue: {
		bg: "bg-blue-50",
		icon: "text-blue-600",
		badge: "bg-blue-100 text-blue-700",
		check: "text-blue-500",
	},
	purple: {
		bg: "bg-purple-50",
		icon: "text-purple-600",
		badge: "bg-purple-100 text-purple-700",
		check: "text-purple-500",
	},
	orange: {
		bg: "bg-orange-50",
		icon: "text-orange-600",
		badge: "bg-orange-100 text-orange-700",
		check: "text-orange-500",
	},
};

export function ProgramsSection() {
	return (
		<section id="programs" className="py-24 sm:py-32 bg-[#f9fafb]">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto">
					<span className="text-green-600 font-semibold text-sm tracking-wide uppercase">
						Programs
					</span>
					<h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
						โปรแกรมเรียนที่เหมาะกับคุณ
					</h2>
					<p className="mt-4 text-gray-500 text-lg">
						ไม่ว่าคุณจะเป็นมือใหม่หรือนักกอล์ฟระดับแข่งขัน เรามีหลักสูตรที่ตอบโจทย์ทุกเป้าหมาย
					</p>
				</motion.div>

				<div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-2 gap-6">
					{programs.map((program, i) => {
						const colors = programColorMap[program.color];
						return (
							<motion.div
								key={program.title}
								{...fadeUp(i * 0.08)}
								className="group p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl hover:shadow-gray-100 transition-all duration-300"
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
