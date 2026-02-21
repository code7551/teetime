"use client";

import { useMemo } from "react";
import {
	Card,
	CardBody,
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Chip,
	Button,
	Divider,
} from "@heroui/react";
import { CalendarDays, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale/th";
import { getUserDisplayName } from "@/lib/utils";
import type { AppUser, Booking } from "@/types";

export interface IncomeBookingRow {
	booking: Booking;
	hours: number;
	hourlyRate: number;
	proShare: number;
	income: number;
}

interface IncomeBookingsTableProps {
	rows: IncomeBookingRow[];
	studentMap: Map<string, AppUser>;
	/** If provided, shows a "โปร" column */
	proMap?: Map<string, AppUser>;
	/** If provided, shows a "จัดการ" column with toggle paid button */
	onTogglePaid?: (bookingId: string, currentStatus?: string) => void;
	/** Set of booking IDs currently being updated */
	updatingIds?: Set<string>;
}

const fmt = (n: number) =>
	n.toLocaleString(undefined, { maximumFractionDigits: 0 });

type ColDef = { key: string; label: string; className?: string };

export default function IncomeBookingsTable({
	rows,
	studentMap,
	proMap,
	onTogglePaid,
	updatingIds,
}: IncomeBookingsTableProps) {
	const showProColumn = !!proMap;
	const showActions = !!onTogglePaid;

	const columns = useMemo<ColDef[]>(() => {
		const cols: ColDef[] = [{ key: "date", label: "วันที่" }];
		if (showProColumn) cols.push({ key: "pro", label: "โปร" });
		cols.push({ key: "student", label: "นักเรียน" });
		if (showProColumn)
			cols.push({ key: "detail", label: "รายละเอียด" });
		cols.push({
				key: "income",
				label: showProColumn ? "รายได้โปร" : "จำนวนเงิน",
				className: "text-right",
			},
			{ key: "status", label: "สถานะ", className: "text-center" },
		);
		if (showActions)
			cols.push({ key: "action", label: "จัดการ", className: "text-center" });
		return cols;
	}, [showProColumn, showActions]);

	const renderCell = (
		row: IncomeBookingRow,
		columnKey: string,
	): React.ReactNode => {
		const { booking, hours, hourlyRate, proShare, income } = row;
		const isPaid = booking.paidStatus === "paid";

		switch (columnKey) {
			case "date":
				return (
					<>
						<p className="text-gray-700">
							{format(parseISO(booking.date), "d MMM yyyy", { locale: th })}
						</p>
						<p className="text-xs text-gray-400">
							{booking.startTime} - {booking.endTime}
						</p>
					</>
				);
			case "pro": {
				const pro = proMap?.get(booking.proId);
				return (
					<>
						<p className="font-medium text-gray-800">
							{getUserDisplayName(pro, "โปร")}
						</p>
						<p className="text-xs text-gray-400">
							ส่วนแบ่ง {(proShare * 100).toFixed(0)}%
						</p>
					</>
				);
			}
			case "student": {
				const student = studentMap.get(booking.studentId);
				return (
					<p className="font-medium text-gray-800">
						{getUserDisplayName(student, "นักเรียน")}
					</p>
				);
			}
			case "detail":
				return (
					<p className="text-gray-600 text-sm">
						{hours} ชม. × ฿{fmt(hourlyRate)}/ชม. × {(proShare * 100).toFixed(0)}
						%
					</p>
				);
			case "income":
				return (
					<p className="font-bold text-green-600 text-right">฿{fmt(income)}</p>
				);
			case "status":
				return (
					<div className="text-center">
						<Chip
							size="sm"
							variant="flat"
							color={isPaid ? "success" : "warning"}
						>
							{isPaid ? "จ่ายแล้ว" : "ยังไม่จ่าย"}
						</Chip>
					</div>
				);
			case "action": {
				const isUpdating = updatingIds?.has(booking.id) ?? false;
				return (
					<div className="text-center">
						<Button
							size="sm"
							variant="flat"
							color={isPaid ? "default" : "success"}
							isLoading={isUpdating}
							onPress={() => onTogglePaid!(booking.id, booking.paidStatus)}
						>
							{isPaid ? "ยกเลิก" : "จ่ายแล้ว"}
						</Button>
					</div>
				);
			}
			default:
				return null;
		}
	};

	return (
		<Card className="border border-gray-100 shadow-sm">
			<CardBody className="p-5">
				<h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
					<CalendarDays size={18} className="text-gray-500" />
					รายละเอียดรายนัด ({rows.length} นัด)
				</h2>

				<Divider className="mb-4" />

				{rows.length === 0 ? (
					<div className="text-center py-8 text-gray-400">
						<DollarSign size={40} className="mx-auto mb-2 opacity-50" />
						<p>ไม่มีรายการในเดือนนี้</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<Table
							aria-label="ตารางรายได้"
							removeWrapper
							classNames={{
								th: "bg-gray-50 text-gray-600 font-semibold",
							}}
						>
							<TableHeader columns={columns}>
								{(col) => (
									<TableColumn key={col.key} className={col.className}>
										{col.label}
									</TableColumn>
								)}
							</TableHeader>
							<TableBody items={rows}>
								{(row) => (
									<TableRow
										key={row.booking.id}
										className="hover:bg-gray-50 transition-colors"
									>
										{columns.map((col) => (
											<TableCell key={col.key}>
												{renderCell(row, col.key)}
											</TableCell>
										))}
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				)}
			</CardBody>
		</Card>
	);
}
