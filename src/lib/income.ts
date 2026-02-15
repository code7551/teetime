import { format } from "date-fns";
import { th } from "date-fns/locale/th";
import type { Booking } from "@/types";

/** Calculate teaching hours from booking start/end times */
export function calcBookingHours(b: Booking): number {
  const start = new Date(`1970-01-01T${b.startTime}`).getTime();
  const end = new Date(`1970-01-01T${b.endTime}`).getTime();
  return (end - start) / 3600000;
}

/** Get hourly rate from booking */
export function getBookingHourlyRate(b: Booking): number {
  return b.hourlyRate ?? 0;
}

/** Calculate pro income for a single booking */
export function calcProIncome(b: Booking, proShare: number): number {
  return getBookingHourlyRate(b) * calcBookingHours(b) * proShare;
}

/** Generate last N month options for Select dropdown */
export function generateMonthOptions(count = 12): { key: string; label: string }[] {
  const options: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      key: format(d, "yyyy-MM"),
      label: format(d, "MMMM yyyy", { locale: th }),
    });
  }
  return options;
}
