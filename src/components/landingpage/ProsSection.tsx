"use client";

import { motion } from "framer-motion";
import { Trophy, CheckCircle } from "lucide-react";
import Image from "next/image";
import { fadeUp } from "./utils";

export interface ProProfile {
	uid: string;
	displayName: string;
	nickname: string;
	avatarUrl: string;
	proficiency: string;
	education: string;
	athleticBackground: string;
}

const CARD_GRADIENTS = [
	"from-green-500 to-emerald-600",
	"from-blue-500 to-indigo-600",
	"from-purple-500 to-pink-600",
];

const CHECK_COLORS = ["text-green-500", "text-blue-500", "text-purple-500"];

export function ProsSection({ pros }: { pros: ProProfile[] }) {
	if (pros.length === 0) return null;

	return (
		<section id="pros" className="py-24 sm:py-32 bg-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<motion.div {...fadeUp()} className="text-center max-w-2xl mx-auto">
					<span className="text-green-600 font-semibold text-sm tracking-wide uppercase">
						Our Pro Team
					</span>
					<h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
						ทีมโปรกอล์ฟของเรา
					</h2>
					<p className="mt-4 text-gray-500 text-lg">
						โปรกอล์ฟมืออาชีพที่ผ่านการแข่งขันระดับประเทศและนานาชาติ
						พร้อมถ่ายทอดประสบการณ์ให้กับคุณ
					</p>
				</motion.div>

				<div
					className={`mt-16 sm:mt-20 grid grid-cols-1 ${pros.length >= 3 ? "lg:grid-cols-3" : pros.length === 2 ? "lg:grid-cols-2 max-w-4xl mx-auto" : "max-w-lg mx-auto"} gap-8`}
				>
					{pros.map((pro, i) => {
						const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
						const checkColor = CHECK_COLORS[i % CHECK_COLORS.length];
						const proficiencyLines = pro.proficiency
							? pro.proficiency.split("\n").filter(Boolean)
							: [];
						const achievementLines = pro.athleticBackground
							? pro.athleticBackground.split("\n").filter(Boolean)
							: [];

						return (
							<motion.div key={pro.uid} {...fadeUp(i * 0.12)} className="group">
								<div className="h-full rounded-3xl bg-gray-50 border border-gray-100 group-hover:bg-white group-hover:shadow-2xl group-hover:shadow-gray-200/50 group-hover:border-gray-200 transition-all duration-500 overflow-hidden">
									<div
										className={`h-48 bg-linear-to-br ${gradient} relative flex items-center justify-center`}
									>
										{pro.avatarUrl ? (
											<div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/30 shadow-lg relative">
												<Image
													src={pro.avatarUrl}
													alt={pro.displayName}
													fill
													className="object-cover"
													unoptimized
												/>
											</div>
										) : (
											<div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
												<span className="text-white text-3xl font-bold">
													{pro.displayName.charAt(0)}
												</span>
											</div>
										)}
										{pro.education && (
											<div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium border border-white/20">
												{pro.education.includes("PGA")
													? "PGA Certified"
													: "Sports Science"}
											</div>
										)}
									</div>

									<div className="p-6 sm:p-8">
										<h3 className="text-xl font-bold text-gray-900">
											{pro.nickname ? `โปร${pro.nickname}` : pro.displayName}
										</h3>
										<p className="text-sm text-gray-400 font-medium">
											{pro.displayName}
										</p>
										{pro.education && (
											<p className="text-xs text-gray-400 mt-1">
												{pro.education}
											</p>
										)}

										{proficiencyLines.length > 0 && (
											<div className="mt-5">
												<h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
													ความเชี่ยวชาญ
												</h4>
												<ul className="space-y-2">
													{proficiencyLines.map((item) => (
														<li
															key={item}
															className="flex items-start gap-2 text-sm text-gray-500"
														>
															<CheckCircle
																className={`shrink-0 mt-0.5 ${checkColor}`}
																size={14}
															/>
															{item}
														</li>
													))}
												</ul>
											</div>
										)}

										{achievementLines.length > 0 && (
											<div className="mt-5">
												<h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
													ผลงาน
												</h4>
												<ul className="space-y-2">
													{achievementLines.map((item) => (
														<li
															key={item}
															className="flex items-start gap-2 text-sm text-gray-500"
														>
															<Trophy
																className="text-yellow-500 shrink-0 mt-0.5"
																size={14}
															/>
															{item}
														</li>
													))}
												</ul>
											</div>
										)}
									</div>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
