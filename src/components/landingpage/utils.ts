export function fadeUp(delay = 0) {
	return {
		initial: { opacity: 0, y: 30 },
		whileInView: { opacity: 1, y: 0 },
		viewport: { once: true, margin: "-50px" },
		transition: { duration: 0.6, delay, ease: "easeOut" as const },
	};
}
