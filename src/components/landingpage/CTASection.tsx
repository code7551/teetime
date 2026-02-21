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
					className="relative overflow-hidden rounded-3xl bg-linear-to-br from-green-600 via-green-700 to-emerald-800 px-8 sm:px-16 py-16 sm:py-24"
				>
					<div className="absolute top-0 left-0 w-72 h-72 bg-green-400 rounded-full blur-[120px] opacity-20 -translate-x-1/2 -translate-y-1/2" />
					<div className="absolute bottom-0 right-0 w-72 h-72 bg-emerald-400 rounded-full blur-[120px] opacity-20 translate-x-1/2 translate-y-1/2" />

					<div className="relative z-10 text-center">
						<h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
							พร้อมเริ่มต้นเล่นกอล์ฟ?
						</h2>
						<p className="mt-6 text-lg text-green-100/80 max-w-xl mx-auto">
							ติดต่อเราเพื่อสอบถามรายละเอียดหลักสูตรและนัดเรียนทดลอง ทีมโปรของเราพร้อมดูแลคุณ
						</p>

						<div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
							<a href="tel:0873565555">
								<Button
									size="lg"
									className="bg-white text-green-800 font-semibold px-10 h-14 text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all w-full sm:w-auto"
									startContent={<Phone size={18} />}
								>
									087 356 5555
								</Button>
							</a>
						</div>

						<div className="mt-12 flex flex-col sm:flex-row justify-center gap-8 text-green-100/70 text-sm">
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
