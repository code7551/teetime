"use client";

import { useEffect, useState } from "react";
import {
	Navbar,
	HeroSection,
	AboutSection,
	ProsSection,
	ProgramsSection,
	WhyUsSection,
	TestimonialsSection,
	CTASection,
	Footer,
	type ProProfile,
} from "@/components/landingpage";

export default function Home() {
	const [pros, setPros] = useState<ProProfile[]>([]);

	useEffect(() => {
		fetch("/api/pros")
			.then((res) => (res.ok ? res.json() : []))
			.then(setPros)
			.catch(() => {});
	}, []);

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
