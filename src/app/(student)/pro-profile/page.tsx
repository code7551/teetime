"use client";

import { useEffect, useState, useCallback } from "react";
import { Spinner } from "@heroui/react";
import {
  GraduationCap,
  Trophy,
  Target,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";

interface ProProfile {
  uid: string;
  displayName: string;
  nickname: string;
  avatarUrl: string;
  proficiency: string;
  education: string;
  athleticBackground: string;
}

const SWIPE_THRESHOLD = 50;

const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

export default function ProProfilePage() {
  const [pros, setPros] = useState<ProProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [[currentIndex, direction], setPage] = useState([0, 0]);

  useEffect(() => {
    const fetchPros = async () => {
      try {
        const res = await fetch("/api/pros");
        if (res.ok) {
          setPros(await res.json());
        }
      } catch (err) {
        console.error("Error fetching pros:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPros();
  }, []);

  const paginate = useCallback(
    (newDir: number) => {
      setPage(([prev]) => {
        const next = prev + newDir;
        if (next < 0 || next >= pros.length) return [prev, 0];
        return [next, newDir];
      });
    },
    [pros.length],
  );

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD && info.velocity.x < 0) {
      paginate(1);
    } else if (info.offset.x > SWIPE_THRESHOLD && info.velocity.x > 0) {
      paginate(-1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  if (pros.length === 0) {
    return (
      <div className="pb-6">
        <div className="text-center py-20">
          <p className="text-sm text-gray-400">ยังไม่มีโปรในระบบ</p>
        </div>
      </div>
    );
  }

  const pro = pros[currentIndex];

  const sections = [
    {
      icon: Target,
      title: "ความเชี่ยวชาญ",
      content: pro.proficiency,
      accent: "emerald",
    },
    {
      icon: GraduationCap,
      title: "การศึกษา",
      content: pro.education,
      accent: "blue",
    },
    {
      icon: Trophy,
      title: "ประวัติด้านกีฬา",
      content: pro.athleticBackground,
      accent: "amber",
    },
  ].filter((s) => s.content);

  const accentMap: Record<string, { color: string; bg: string; border: string; dot: string }> = {
    emerald: { color: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-200", dot: "bg-emerald-400" },
    blue: { color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-200", dot: "bg-blue-400" },
    amber: { color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200", dot: "bg-amber-400" },
  };

  return (
    <div className="pb-6">
      {/* Pagination dots + arrows */}
      {pros.length > 1 && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => paginate(-1)}
            disabled={currentIndex === 0}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 active:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-1.5">
            {pros.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPage([idx, idx > currentIndex ? 1 : -1])}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "w-6 h-2 bg-emerald-500"
                    : "w-2 h-2 bg-gray-300"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => paginate(1)}
            disabled={currentIndex === pros.length - 1}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 active:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Swipeable card area */}
      <div className="relative overflow-hidden" style={{ minHeight: 420 }}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="w-full"
          >
            {/* Pro Card */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
              {/* Hero */}
              <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 pt-8 pb-10 px-5 flex flex-col items-center text-center">
                <div className="absolute top-3 right-4 text-[11px] font-medium text-white/50 tracking-wide uppercase">
                  Certified Coach
                </div>

                {pro.avatarUrl ? (
                  <div className="w-24 h-24 rounded-full ring-4 ring-white/25 overflow-hidden shadow-lg">
                    <img
                      src={pro.avatarUrl}
                      alt={pro.displayName}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full ring-4 ring-white/25 bg-white/20 flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-white/80">
                      {pro.displayName.charAt(0)}
                    </span>
                  </div>
                )}

                <h2 className="text-xl font-bold text-white mt-4 tracking-wide">
                  {pro.displayName}
                </h2>
                {pro.nickname && (
                  <div className="mt-1.5 px-4 py-1 bg-white/15 rounded-full">
                    <span className="text-sm font-semibold text-white">
                      PRO {pro.nickname}
                    </span>
                  </div>
                )}
              </div>

              {/* Sections */}
              <div className="p-4 space-y-4">
                {sections.map((section) => {
                  const a = accentMap[section.accent];
                  return (
                    <div key={section.title}>
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-7 h-7 ${a.bg} rounded-lg flex items-center justify-center`}
                        >
                          <section.icon size={15} className={a.color} />
                        </div>
                        <h4 className={`text-sm font-bold ${a.color}`}>
                          {section.title}
                        </h4>
                      </div>
                      <div className={`ml-9 pl-3 border-l-2 ${a.border}`}>
                        {section.content.split("\n").map((line, i) => (
                          <div key={i} className="flex items-start gap-2 py-0.5">
                            <div
                              className={`w-1.5 h-1.5 ${a.dot} rounded-full mt-1.5 shrink-0`}
                            />
                            <p className="text-[13px] text-gray-600 leading-relaxed">
                              {line}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Swipe hint */}
            {pros.length > 1 && (
              <p className="text-center text-[11px] text-gray-300 mt-3 select-none">
                ← ปัดเพื่อดูโปรคนอื่น →
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

