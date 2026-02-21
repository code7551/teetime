"use client";

import { useEffect, useState } from "react";
import {
	Navbar,
	HeroSection,
	AboutSection,
	ProsSection,
	ProgramsSection,
	PricingSection,
	WhyUsSection,
	TestimonialsSection,
	CTASection,
	Footer,
	type ProProfile,
} from "@/components/landingpage";
import type { Course } from "@/types";

export default function Home() {
	const [pros, setPros] = useState<ProProfile[]>([]);
	const [courses, setCourses] = useState<Course[]>([]);

	useEffect(() => {
		fetch("/api/pros")
			.then((res) => (res.ok ? res.json() : []))
			.then(setPros)
			.catch(() => {});

		fetch("/api/courses")
			.then((res) => (res.ok ? res.json() : []))
			.then(setCourses)
			.catch(() => {});
	}, []);

	return (
		<main className="overflow-hidden">
			<Navbar />
			<HeroSection />
			<AboutSection />
			<ProsSection pros={pros} />
			<ProgramsSection />
			<PricingSection courses={courses} />
			<WhyUsSection />
			<TestimonialsSection />
			<CTASection />
			<Footer />
		</main>
	);
}
