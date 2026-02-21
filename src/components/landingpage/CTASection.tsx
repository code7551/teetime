"use client";

import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { fadeUp } from "./utils";
import { IconInstagram, IconFacebook } from "./icons";

export function CTASection() {
	return (
		<section id="contact" className="py-24 sm:py-32 bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div
					{...fadeUp()}
					className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#800020] via-[#6B1528] to-[#4A0E1B] px-8 sm:px-16 py-16 sm:py-24"
				>
					<div className="absolute top-0 left-0 w-72 h-72 bg-rose-400 rounded-full blur-[120px] opacity-15 -translate-x-1/2 -translate-y-1/2" />
					<div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-400 rounded-full blur-[120px] opacity-15 translate-x-1/2 translate-y-1/2" />
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-400 rounded-full blur-[200px] opacity-[0.04]" />

					<div className="relative z-10 text-center">
						<h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
							เริ่มต้นพัฒนาเกมกอล์ฟของคุณวันนี้
						</h2>
						<p className="mt-6 text-lg text-rose-100/70 max-w-xl mx-auto">
							ติดต่อเราเพื่อปรึกษาหลักสูตรที่เหมาะสมหรือนัดเรียนทดลอง
							ทีมโปรของเราพร้อมให้คำแนะนำ
						</p>

						<div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
							<a href="tel:0873565555">
								<Button
									size="lg"
									className="bg-amber-400 text-[#2D0F18] font-semibold px-10 h-14 text-base shadow-xl shadow-amber-400/20 hover:bg-amber-300 hover:shadow-2xl hover:shadow-amber-400/30 hover:scale-[1.02] transition-all w-full sm:w-auto"
									startContent={<Phone size={18} />}
								>
									087 356 5555
								</Button>
							</a>
						</div>

						<div className="mt-12 flex flex-col sm:flex-row justify-center gap-8 text-rose-100/60 text-sm">
							<a
								href="https://www.instagram.com/teetime.golfcenter"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 justify-center hover:text-white transition-colors"
							>
								<IconInstagram size={16} />
								<span>Instagram</span>
							</a>
							<a
								href="https://web.facebook.com/TharinphatGolf"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 justify-center hover:text-white transition-colors"
							>
								<IconFacebook size={16} />
								<span>Facebook</span>
							</a>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
