"use client";

import { motion } from "framer-motion";
import { Check, Clock, Sparkles } from "lucide-react";
import { Button } from "@heroui/react";
import { fadeUp } from "./utils";
import type { Course } from "@/types";

const CARD_ACCENTS = [
	{
		border: "border-gray-200",
		badge: "bg-gray-100 text-gray-600",
		button: "bg-[#800020] text-white hover:bg-[#6B1528]",
		check: "text-[#800020]",
		highlight: false,
	},
	{
		border: "border-[#800020]/30 ring-1 ring-[#800020]/10",
		badge: "bg-[#800020] text-white",
		button:
			"bg-amber-400 text-[#2D0F18] hover:bg-amber-300 shadow-lg shadow-amber-400/20",
		check: "text-[#800020]",
		highlight: true,
	},
	{
		border: "border-gray-200",
		badge: "bg-gray-100 text-gray-600",
		button: "bg-[#800020] text-white hover:bg-[#6B1528]",
		check: "text-[#800020]",
		highlight: false,
	},
];

function formatPrice(price: number) {
	return price.toLocaleString("th-TH");
}

function getPricePerHour(price: number, hours: number) {
	if (hours === 0) return 0;
	return Math.round(price / hours);
}

export function PricingSection({ courses }: { courses: Course[] }) {
	if (courses.length === 0) return null;

	const sorted = [...courses].sort((a, b) => a.price - b.price);
	const highlightIndex = sorted.length >= 2 ? 1 : 0;

	return (
		<section id="pricing" className="py-24 sm:py-32 bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto">
					<span className="text-[#800020] font-semibold text-sm tracking-wide uppercase">
						Pricing
					</span>
					<h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
						แพ็กเกจเรียนกอล์ฟ
					</h2>
					<p className="mt-4 text-gray-500 text-lg">
						เลือกแพ็กเกจที่เหมาะกับเป้าหมายของคุณ
						ยิ่งเรียนมาก ยิ่งคุ้มค่า
					</p>
				</motion.div>

				<div
					className={`mt-16 sm:mt-20 grid grid-cols-1 gap-8 ${
						sorted.length >= 3
							? "lg:grid-cols-3"
							: sorted.length === 2
								? "lg:grid-cols-2 max-w-4xl mx-auto"
								: "max-w-lg mx-auto"
					}`}
				>
					{sorted.map((course, i) => {
						const accent =
							CARD_ACCENTS[
								i === highlightIndex
									? 1
									: i < highlightIndex
										? 0
										: 2
							];
						const isHighlight = i === highlightIndex;
						const pricePerHour = getPricePerHour(course.price, course.hours);
						const descLines = course.description
							? course.description.split("\n").filter(Boolean)
							: [];

						return (
							<motion.div
								key={course.id}
								{...fadeUp(i * 0.1)}
								className={`relative rounded-3xl border bg-white p-8 sm:p-10 transition-all duration-300 hover:shadow-xl hover:shadow-gray-100/80 ${accent.border} ${isHighlight ? "lg:-mt-4 lg:mb-4" : ""}`}
							>
								{isHighlight && (
									<div className="absolute -top-4 left-1/2 -translate-x-1/2">
										<span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#800020] text-white text-xs font-semibold shadow-lg shadow-[#800020]/20">
											<Sparkles size={12} />
											แนะนำ
										</span>
									</div>
								)}

								<div className="text-center">
									<h3 className="text-xl font-bold text-gray-900">
										{course.name}
									</h3>
									<div className="mt-1 flex items-center justify-center gap-2 text-sm text-gray-400">
										<Clock size={14} />
										<span>{course.hours} ชั่วโมง</span>
									</div>
								</div>

								<div className="mt-6 text-center">
									<div className="flex items-baseline justify-center gap-1">
										<span className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
											{formatPrice(course.price)}
										</span>
										<span className="text-lg text-gray-400 font-medium">
											บาท
										</span>
									</div>
									<p className="mt-2 text-sm text-gray-400">
										เฉลี่ย {formatPrice(pricePerHour)} บาท / ชั่วโมง
									</p>
								</div>

								<div className="mt-8 border-t border-gray-100 pt-8">
									{descLines.length > 0 ? (
										<ul className="space-y-3">
											{descLines.map((line) => (
												<li
													key={line}
													className="flex items-start gap-3 text-sm"
												>
													<Check
														className={`shrink-0 mt-0.5 ${accent.check}`}
														size={16}
													/>
													<span className="text-gray-600">{line}</span>
												</li>
											))}
										</ul>
									) : (
										<ul className="space-y-3">
											<li className="flex items-start gap-3 text-sm">
												<Check
													className={`shrink-0 mt-0.5 ${accent.check}`}
													size={16}
												/>
												<span className="text-gray-600">
													เรียนตัวต่อตัวกับโปรมืออาชีพ
												</span>
											</li>
											<li className="flex items-start gap-3 text-sm">
												<Check
													className={`shrink-0 mt-0.5 ${accent.check}`}
													size={16}
												/>
												<span className="text-gray-600">
													รีวิวพร้อมวิดีโอวิเคราะห์สวิงหลังเรียน
												</span>
											</li>
											<li className="flex items-start gap-3 text-sm">
												<Check
													className={`shrink-0 mt-0.5 ${accent.check}`}
													size={16}
												/>
												<span className="text-gray-600">
													ติดตามความก้าวหน้าผ่านระบบออนไลน์
												</span>
											</li>
										</ul>
									)}
								</div>

								<div className="mt-8">
									<a href="#contact">
										<Button
											size="lg"
											className={`w-full font-semibold h-12 text-base transition-all hover:scale-[1.02] ${accent.button}`}
										>
											สมัครเรียน
										</Button>
									</a>
								</div>
							</motion.div>
						);
					})}
				</div>

				<motion.p
					{...fadeUp(0.3)}
					className="mt-12 text-center text-sm text-gray-400"
				>
					ราคาดังกล่าวเป็นราคาต่อแพ็กเกจ สามารถแบ่งจ่ายได้ ·
					ติดต่อสอบถามรายละเอียดเพิ่มเติมได้ที่{" "}
					<a
						href="tel:0873565555"
						className="text-[#800020] font-medium hover:underline"
					>
						087 356 5555
					</a>
				</motion.p>
			</div>
		</section>
	);
}
