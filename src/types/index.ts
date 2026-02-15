export type UserRole = "owner" | "pro" | "student";

export type Gender = "male" | "female" | "other";

export interface AppUser {
  uid: string;
  email?: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phone: string;
  lineUserIds?: string[];
  lineDisplayNames?: Record<string, string>;
  proId?: string;
  commissionRate?: number;
  createdAt: string;
  avatarUrl?: string;
  nickname?: string;
  gender?: Gender;
  birthdate?: string; // ISO date string (YYYY-MM-DD)
  learningGoals?: string;
  courseId?: string; // Assigned course by owner
}

export interface Course {
  id: string;
  name: string;
  hours: number;
  price: number;
  description: string;
  createdAt: string;
}

export type PaymentStatus = "pending" | "approved" | "rejected";

export interface Payment {
  id: string;
  studentId: string;
  courseId: string;
  amount: number;
  receiptImageUrl: string;
  status: PaymentStatus;
  hoursAdded: number;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  /** Resolved dynamically from users collection (not stored in DB) */
  studentName?: string;
  courseName?: string;
}

export type BookingStatus = "scheduled" | "completed" | "cancelled";

export interface Booking {
  id: string;
  studentId: string;
  proId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
  hourlyRate?: number;
  /** Resolved dynamically from users collection (not stored in DB) */
  studentName?: string;
  /** Resolved dynamically from users collection (not stored in DB) */
  proName?: string;
  paidStatus?: "unpaid" | "paid";
  paidAt?: string;
  paidBy?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  studentId: string;
  proId: string;
  comment: string;
  videoUrl?: string;
  imageUrls?: string[];
  createdAt: string;
  updatedAt?: string;
  studentName?: string;
  proName?: string;
  date?: string;
}

export interface StudentHours {
  studentId: string;
  remainingHours: number;
  totalHoursPurchased: number;
  totalHoursUsed: number;
}

export type AuditAction = "hours_added" | "hours_deducted";

export interface AuditLog {
  id: string;
  action: AuditAction;
  studentId: string;
  studentName?: string;
  proId?: string;
  proName?: string;
  hours: number;
  remainingHoursAfter: number;
  referenceType: "payment" | "booking";
  referenceId: string;
  performedBy: string;
  note?: string;
  createdAt: string;
}
