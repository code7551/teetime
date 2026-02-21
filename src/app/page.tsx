"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner, Button } from "@heroui/react";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Clock,
  Trophy,
  Target,
  Users,
  Star,
  ChevronRight,
  Menu,
  X,
  GraduationCap,
  Zap,
  Heart,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.6, delay, ease: "easeOut" as const },
  };
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#about", label: "เกี่ยวกับเรา" },
    { href: "#pros", label: "ทีมโปร" },
    { href: "#programs", label: "โปรแกรมเรียน" },
    { href: "#why-us", label: "ทำไมต้องเรา" },
    { href: "#contact", label: "ติดต่อ" },
  ];

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-green-900/5 border-b border-green-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 transition-shadow">
              <span className="text-white font-bold text-base sm:text-lg">
                T
              </span>
            </div>
            <span
              className={`font-bold text-lg sm:text-xl tracking-tight transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}
            >
              Teetime
              <span className="text-green-500"> Golf Center</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scrolled
                    ? "text-gray-600 hover:text-green-600 hover:bg-green-50"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="flat"
                className={`font-medium ${
                  scrolled
                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                    : "bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm"
                }`}
              >
                สำหรับสมาชิก
              </Button>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              scrolled
                ? "text-gray-600 hover:bg-gray-100"
                : "text-white hover:bg-white/10"
            }`}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="lg:hidden bg-white border-t border-gray-100 shadow-xl"
        >
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <Link href="/login" className="block">
                <Button
                  color="success"
                  className="w-full font-semibold"
                  size="lg"
                >
                  สำหรับสมาชิก
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-green-950 via-green-900 to-emerald-900" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-green-400 rounded-full blur-3xl opacity-15" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-400 rounded-full blur-3xl opacity-15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500 rounded-full blur-[120px] opacity-10" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
        <div className="max-w-3xl">
          <motion.div {...fadeUp(0)}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-green-200 text-sm font-medium mb-6 sm:mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              สถาบันสอนกอล์ฟโดยโปรมืออาชีพ
            </span>
          </motion.div>

          <motion.h1
            {...fadeUp(0.1)}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight"
          >
            Teetime
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-green-300 to-emerald-300">
              Golf Center
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="mt-6 sm:mt-8 text-lg sm:text-xl text-green-100/80 leading-relaxed max-w-2xl"
          >
            สถาบันสอนกอล์ฟครบวงจร ด้วยทีมโปรกอล์ฟที่มีประสบการณ์ระดับประเทศ
            พร้อมหลักสูตรที่ปรับให้เหมาะกับผู้เรียนทุกระดับ
            ตั้งแต่มือใหม่ไปจนถึงนักกอล์ฟที่ต้องการพัฒนาฝีมือ
          </motion.p>

          <motion.div
            {...fadeUp(0.3)}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4"
          >
            <a href="#contact">
              <Button
                size="lg"
                className="bg-white text-green-800 font-semibold px-8 h-14 text-base shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 hover:scale-[1.02] transition-all w-full sm:w-auto"
                endContent={<ChevronRight size={18} />}
              >
                สมัครเรียนกอล์ฟ
              </Button>
            </a>
            <a href="#pros">
              <Button
                size="lg"
                variant="bordered"
                className="border-white/30 text-white font-medium px-8 h-14 text-base hover:bg-white/10 transition-all w-full sm:w-auto"
              >
                พบทีมโปรของเรา
              </Button>
            </a>
          </motion.div>

          <motion.div
            {...fadeUp(0.4)}
            className="mt-12 sm:mt-16 grid grid-cols-3 gap-8 sm:gap-12 max-w-md"
          >
            {[
              { value: "3", label: "โปรกอล์ฟมืออาชีพ" },
              { value: "100+", label: "นักเรียน" },
              { value: "1,000+", label: "ชั่วโมงสอน" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-green-200/60 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-[#f9fafb] to-transparent" />
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="py-24 sm:py-32 bg-[#f9fafb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeUp()}>
            <span className="text-green-600 font-semibold text-sm tracking-wide uppercase">
              About Us
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              ยกระดับเกมกอล์ฟของคุณ
              <br />
              <span className="text-green-600">กับโปรระดับมืออาชีพ</span>
            </h2>
            <p className="mt-6 text-gray-500 text-lg leading-relaxed">
              Teetime Golf Center คือสถาบันสอนกอล์ฟที่ก่อตั้งขึ้นด้วยความตั้งใจ
              ที่จะพัฒนาวงการกอล์ฟไทย ด้วยทีมโปรกอล์ฟที่ผ่านการแข่งขันระดับประเทศ
              และมีใบรับรองจาก PGA Thailand
            </p>
            <p className="mt-4 text-gray-500 text-lg leading-relaxed">
              เราเชื่อว่าทุกคนสามารถเล่นกอล์ฟได้ดี เมื่อมีครูที่เข้าใจและหลักสูตรที่เหมาะสม
              ไม่ว่าคุณจะเป็นมือใหม่ที่เพิ่งเริ่มต้น หรือนักกอล์ฟที่ต้องการยกระดับฝีมือ
            </p>

            <div className="mt-10 grid grid-cols-2 gap-6">
              {[
                {
                  icon: Trophy,
                  title: "โปรระดับแข่งขัน",
                  desc: "ทีมโปรผ่านการแข่งในระดับ TGA, ASEAN Games",
                },
                {
                  icon: Target,
                  title: "หลักสูตรเฉพาะบุคคล",
                  desc: "ปรับการสอนให้เหมาะกับสรีระและเป้าหมายของคุณ",
                },
                {
                  icon: GraduationCap,
                  title: "PGA Certified",
                  desc: "โปรผ่านการรับรองจาก PGA Thailand",
                },
                {
                  icon: Heart,
                  title: "สอนสนุก เข้าใจง่าย",
                  desc: "บรรยากาศเป็นกันเอง เหมาะทุกวัย",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <item.icon className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {item.title}
                    </h4>
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.2)} className="relative">
            <div className="aspect-4/5 rounded-3xl bg-linear-to-br from-green-100 to-emerald-50 overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-8">
                  <div className="w-24 h-24 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30 mb-6">
                    <span className="text-white text-4xl font-bold">T</span>
                  </div>
                  <h3 className="text-2xl font-bold text-green-800">
                    Teetime Golf Center
                  </h3>
                  <p className="text-green-600/70 mt-2">
                    Where Champions Are Made
                  </p>
                  <div className="mt-8 flex justify-center gap-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        // biome-ignore lint: decorative stars
                        key={i}
                        className="text-yellow-400 fill-yellow-400"
                        size={20}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-5 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <Users className="text-white" size={22} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">100+</div>
                  <div className="text-sm text-gray-400">นักเรียนที่ไว้วางใจ</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

interface ProProfile {
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

function ProsSection({ pros }: { pros: ProProfile[] }) {
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

        <div className={`mt-16 sm:mt-20 grid grid-cols-1 ${pros.length >= 3 ? "lg:grid-cols-3" : pros.length === 2 ? "lg:grid-cols-2 max-w-4xl mx-auto" : "max-w-lg mx-auto"} gap-8`}>
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
              <motion.div
                key={pro.uid}
                {...fadeUp(i * 0.12)}
                className="group"
              >
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

function ProgramsSection() {
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
            ไม่ว่าคุณจะเป็นมือใหม่หรือนักกอล์ฟระดับแข่งขัน
            เรามีหลักสูตรที่ตอบโจทย์ทุกเป้าหมาย
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

function WhyUsSection() {
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
                  <span className="text-white text-sm font-bold">
                    {i + 1}
                  </span>
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

function TestimonialsSection() {
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

function CTASection() {
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
              ติดต่อเราเพื่อสอบถามรายละเอียดหลักสูตรและนัดเรียนทดลอง
              ทีมโปรของเราพร้อมดูแลคุณ
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <a href="tel:0000000000">
                <Button
                  size="lg"
                  className="bg-white text-green-800 font-semibold px-10 h-14 text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all w-full sm:w-auto"
                  startContent={<Phone size={18} />}
                >
                  โทรสอบถาม
                </Button>
              </a>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-8 text-green-100/70 text-sm">
              <div className="flex items-center gap-2 justify-center">
                <Clock size={16} />
                <span>เปิดทุกวัน 08:00 - 20:00</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <MapPin size={16} />
                <span>Teetime Golf Center</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
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
              {[
                { label: "เกี่ยวกับเรา", href: "#about" },
                { label: "ทีมโปร", href: "#pros" },
                { label: "โปรแกรมเรียน", href: "#programs" },
                { label: "ทำไมต้องเรา", href: "#why-us" },
                { label: "ติดต่อ", href: "#contact" },
              ].map((link) => (
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
              <li className="flex items-center gap-2">
                <Clock size={14} className="shrink-0" />
                เปิดทุกวัน 08:00 - 20:00
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} className="shrink-0" />
                Teetime Golf Center
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Teetime Golf Center. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pros, setPros] = useState<ProProfile[]>([]);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "owner") {
        router.replace("/dashboard");
      } else if (user.role === "pro") {
        router.replace("/pro/dashboard");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetch("/api/pros")
      .then((res) => (res.ok ? res.json() : []))
      .then(setPros)
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  return (
    <main className="overflow-hidden">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ProsSection pros={pros} />
      <ProgramsSection />
      <WhyUsSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
