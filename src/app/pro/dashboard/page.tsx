"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardBody,
	Spinner,
} from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import {
	Users,
	CalendarDays,
	DollarSign,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale/th";
import { getUserDisplayName } from "@/lib/utils";
import UpcomingBookingsList from "@/components/shared/UpcomingBookingsList";
import type { AppUser, Booking } from "@/types";

export default function ProDashboardPage() {
	const { user, firebaseUser, loading } = useAuth();
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [students, setStudents] = useState<AppUser[]>([]);
	const [dataLoading, setDataLoading] = useState(true);

	const fetchData = async () => {
		if (!user || !firebaseUser) return;
		try {
			const token = await firebaseUser.getIdToken();
			const headers = { Authorization: `Bearer ${token}` };

			const [bookingsRes, studentsRes] = await Promise.all([
				fetch(`/api/bookings?proId=${user.uid}`, { headers }),
				fetch(`/api/users?role=student`, { headers }),
			]);

			if (bookingsRes.ok) {
				const bookingsData: Booking[] = await bookingsRes.json();
				setBookings(bookingsData);
			}

			if (studentsRes.ok) {
				const studentsData: AppUser[] = await studentsRes.json();
				setStudents(studentsData.filter((s) => s.proId === user.uid));
			}
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
		} finally {
			setDataLoading(false);
		}
	};

	useEffect(() => {
		if (!user || !firebaseUser) return;
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, firebaseUser]);

	if (loading || dataLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<Spinner size="lg" color="success" />
			</div>
		);
	}

	const now = new Date();
	const currentMonth = now.getMonth();
	const currentYear = now.getFullYear();

	const monthlyBookings = bookings.filter((b) => {
		const d = parseISO(b.date);
		return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
	});

	const completedThisMonth = monthlyBookings.filter(
		(b) => b.status === "completed",
	);

	const monthlyIncome = completedThisMonth.reduce((acc, b) => {
		const hours =
			(new Date(`1970-01-01T${b.endTime}`).getTime() -
				new Date(`1970-01-01T${b.startTime}`).getTime()) /
			3600000;
		const rate = b.hourlyRate ?? 0;
		const proShare = 1 - (user?.commissionRate ?? 0.3);
		return acc + hours * rate * proShare;
	}, 0);

	return (
		<div className="space-y-6">
			{/* Welcome */}
			<div>
				<h1 className="text-2xl font-bold text-gray-800">
					สวัสดี, โปร{getUserDisplayName(user, user?.displayName || "")} 👋
				</h1>
				<p className="text-gray-500 mt-1">
					{format(now, "วันEEEEที่ d MMMM yyyy", { locale: th })}
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<Card className="border border-gray-100 shadow-sm">
					<CardBody className="flex flex-row items-center gap-4 p-5">
						<div className="p-3 bg-green-100 rounded-xl">
							<Users className="text-green-600" size={24} />
						</div>
						<div>
							<p className="text-sm text-gray-500">จำนวนนักเรียน</p>
							<p className="text-2xl font-bold text-gray-800">
								{students.length}
							</p>
						</div>
					</CardBody>
				</Card>

				<Card className="border border-gray-100 shadow-sm">
					<CardBody className="flex flex-row items-center gap-4 p-5">
						<div className="p-3 bg-blue-100 rounded-xl">
							<CalendarDays className="text-blue-600" size={24} />
						</div>
						<div>
							<p className="text-sm text-gray-500">การสอนเดือนนี้</p>
							<p className="text-2xl font-bold text-gray-800">
								{completedThisMonth.length}{" "}
								<span className="text-sm font-normal text-gray-400">
									/ {monthlyBookings.length} นัด
								</span>
							</p>
						</div>
					</CardBody>
				</Card>

				<Card className="border border-gray-100 shadow-sm">
					<CardBody className="flex flex-row items-center gap-4 p-5">
						<div className="p-3 bg-amber-100 rounded-xl">
							<DollarSign className="text-amber-600" size={24} />
						</div>
						<div>
							<p className="text-sm text-gray-500">รายได้เดือนนี้</p>
							<p className="text-2xl font-bold text-gray-800">
								฿
								{monthlyIncome.toLocaleString(undefined, {
									maximumFractionDigits: 0,
								})}
							</p>
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Upcoming Bookings */}
			<UpcomingBookingsList role="pro" />
		</div>
	);
}
