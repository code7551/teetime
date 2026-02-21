import { Phone } from "lucide-react";
import { IconInstagram, IconFacebook } from "./icons";

const quickLinks = [
	{ label: "เกี่ยวกับเรา", href: "#about" },
	{ label: "ทีมโปร", href: "#pros" },
	{ label: "โปรแกรมเรียน", href: "#programs" },
	{ label: "ทำไมต้องเรา", href: "#why-us" },
	{ label: "ติดต่อ", href: "#contact" },
];

export function Footer() {
	return (
		<footer className="bg-gray-900 text-gray-400">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-10">
					<div className="md:col-span-2">
						<div className="flex items-center gap-3 mb-4">
							<div className="w-10 h-10 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
								<span className="text-white font-bold text-lg">T</span>
							</div>
							<span className="font-bold text-xl text-white tracking-tight">
								Teetime<span className="text-green-400"> Golf Center</span>
							</span>
						</div>
						<p className="text-gray-400 leading-relaxed max-w-sm">
							สถาบันสอนกอล์ฟครบวงจร ด้วยทีมโปรกอล์ฟระดับมืออาชีพ
							พร้อมพัฒนาวงสวิงและเกมกอล์ฟของคุณ ให้ถึงเป้าหมายที่ต้องการ
						</p>
					</div>
					<div>
						<h4 className="text-white font-semibold mb-4">ลิงก์ด่วน</h4>
						<ul className="space-y-3">
							{quickLinks.map((link) => (
								<li key={link.href}>
									<a
										href={link.href}
										className="hover:text-green-400 transition-colors"
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</div>
					<div>
						<h4 className="text-white font-semibold mb-4">ข้อมูลติดต่อ</h4>
						<ul className="space-y-3 text-sm">
							<li>
								<a
									href="tel:0873565555"
									className="flex items-center gap-2 hover:text-green-400 transition-colors"
								>
									<Phone size={14} className="shrink-0" />
									087 356 5555
								</a>
							</li>
							<li>
								<a
									href="https://www.instagram.com/teetime.golfcenter"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 hover:text-green-400 transition-colors"
								>
									<IconInstagram size={14} className="shrink-0" />
									teetime.golfcenter
								</a>
							</li>
							<li>
								<a
									href="https://web.facebook.com/TharinphatGolf"
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 hover:text-green-400 transition-colors"
								>
									<IconFacebook size={14} className="shrink-0" />
									TharinphatGolf
								</a>
							</li>
						</ul>
					</div>
				</div>
				<div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
					© {new Date().getFullYear()} Teetime Golf Center. All rights reserved.
				</div>
			</div>
		</footer>
	);
}
