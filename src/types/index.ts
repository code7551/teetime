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
  proId?: string;
  commissionRate?: number;
  createdAt: string;
  avatarUrl?: string;
  nickname?: string;
  gender?: Gender;
  age?: number;
  learningGoals?: string;
  courseId?: string; // Assigned course by owner
}

export interface Course {
  id: string;
  name: string;
  hours: number;
  price: number;
  description: string;
  isActive: boolean;
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
  studentName?: string;
  proName?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  studentId: string;
  proId: string;
  comment: string;
  videoUrl?: string;
  createdAt: string;
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
