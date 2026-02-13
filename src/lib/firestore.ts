import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
  addDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  AppUser,
  Course,
  Payment,
  Booking,
  Review,
  StudentHours,
} from "@/types";

// ---- Users ----
export async function getUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as AppUser;
}

export async function getUsersByRole(role: string): Promise<AppUser[]> {
  const q = query(collection(db, "users"), where("role", "==", role));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as AppUser);
}

export async function createUser(user: AppUser): Promise<void> {
  await setDoc(doc(db, "users", user.uid), {
    email: user.email || null,
    displayName: user.displayName,
    role: user.role,
    phone: user.phone,
    lineUserIds: user.lineUserIds || [],
    proId: user.proId || null,
    commissionRate: user.commissionRate ?? null,
    createdAt: user.createdAt,
    avatarUrl: user.avatarUrl || null,
  });
}

export async function updateUser(
  uid: string,
  data: Partial<AppUser>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), data as Record<string, unknown>);
}

export async function deleteUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid));
}

// ---- Courses ----
export async function getCourses(): Promise<Course[]> {
  const snap = await getDocs(
    query(collection(db, "courses"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Course);
}

export async function createCourse(
  data: Omit<Course, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, "courses"), data);
  return ref.id;
}

// ---- Payments ----
export async function getPayments(
  ...constraints: QueryConstraint[]
): Promise<Payment[]> {
  const q = query(
    collection(db, "payments"),
    ...constraints,
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment);
}

export async function createPayment(
  data: Omit<Payment, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, "payments"), data);
  return ref.id;
}

export async function updatePayment(
  id: string,
  data: Partial<Payment>
): Promise<void> {
  await updateDoc(doc(db, "payments", id), data as Record<string, unknown>);
}

// ---- Bookings ----
export async function getBookings(
  ...constraints: QueryConstraint[]
): Promise<Booking[]> {
  const q = query(
    collection(db, "bookings"),
    ...constraints,
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
}

export async function createBooking(
  data: Omit<Booking, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, "bookings"), data);
  return ref.id;
}

export async function updateBooking(
  id: string,
  data: Partial<Booking>
): Promise<void> {
  await updateDoc(doc(db, "bookings", id), data as Record<string, unknown>);
}

// ---- Reviews ----
export async function getReviews(
  ...constraints: QueryConstraint[]
): Promise<Review[]> {
  const q = query(
    collection(db, "reviews"),
    ...constraints,
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
}

export async function createReview(
  data: Omit<Review, "id">
): Promise<string> {
  const ref = await addDoc(collection(db, "reviews"), data);
  return ref.id;
}

// ---- Student Hours ----
export async function getStudentHours(
  studentId: string
): Promise<StudentHours | null> {
  const snap = await getDoc(doc(db, "studentHours", studentId));
  if (!snap.exists()) return null;
  return { studentId: snap.id, ...snap.data() } as StudentHours;
}

export async function setStudentHours(data: StudentHours): Promise<void> {
  await setDoc(doc(db, "studentHours", data.studentId), {
    remainingHours: data.remainingHours,
    totalHoursPurchased: data.totalHoursPurchased,
    totalHoursUsed: data.totalHoursUsed,
  });
}
