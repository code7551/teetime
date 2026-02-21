/**
 * Full seed script for TeeTime.
 *
 *   1. Connects to MongoDB Atlas
 *   2. Drops all existing collections (fresh start)
 *   3. Creates indexes for query performance
 *   4. Creates / resets Firebase Auth accounts (owner, 3 pros, 20 students)
 *   5. Seeds MongoDB documents: users, bookings (100), reviews (90),
 *      studentHours, auditLogs
 *
 * Run:  npx tsx scripts/seed.ts
 */

import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// ── Config ───────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = "teetime";

const OWNER_EMAIL = "code7551@gmail.com";
const OWNER_PASSWORD = "123456789";
const OWNER_DISPLAY_NAME = "Owner";

// ── Firebase Admin init ──────────────────────────────────────────────
function getAdminAuth() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "",
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "",
        privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(
          /\\n/g,
          "\n",
        ),
      }),
    });
  }
  return getAuth();
}

// ── Helpers ──────────────────────────────────────────────────────────
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(startDaysAgo: number, endDaysAgo: number): Date {
  const now = Date.now();
  const start = now - startDaysAgo * 86_400_000;
  const end = now - endDaysAgo * 86_400_000;
  return new Date(start + Math.random() * (end - start));
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

// ── Pro definitions ──────────────────────────────────────────────────
interface ProSeed {
  email: string;
  password: string;
  displayName: string;
  nickname: string;
  phone: string;
  proficiency: string;
  education: string;
  athleticBackground: string;
  commissionRate: number;
}

const PROS: ProSeed[] = [
  {
    email: "pakorn@teetime.golf",
    password: "123456",
    displayName: "Pakorn Niamsang",
    nickname: "โดม",
    phone: "",
    commissionRate: 0.3,
    proficiency: [
      "พัฒนาสวิงให้มีความแม่นยำและต่อเนื่อง",
      "การอ่านไลน์พัตต์และการควบคุมระยะใกล้–ไกล",
      "การเลือกใช้ไม้และกลยุทธ์ในสนาม",
      "การวางแผนการซ้อมระยะยาว (Practice Planning)",
      "Mental Game: การควบคุมสมาธิและอารมณ์ในการแข่งขัน",
      "การเสริมสร้างความฟิตและการป้องกันการบาดเจ็บ",
    ].join("\n"),
    education: "",
    athleticBackground: [
      "ตัวแทนนักกีฬากอล์ฟเข้าร่วม 7th Asean School Game 2015 ประเทศบรูไนดารุสซาลัม",
      "ตัวแทนนักกีฬากอล์ฟเข้าร่วม 19th Asean University Game 2018 ประเทศพม่า",
      "จบอันดับ 2 SINGHA-SAT TDT Khon Kaen 2024",
      "จบอันดับ 1 SINGHA-SAT TDT Khon Kaen 2024",
      "เงินรางวัลรวมอันดับ 1 TDT Order of Merit 2024",
      "จบอันดับ 2 SINGHA-SAT TDT Kanchanaburi 2025",
    ].join("\n"),
  },
  {
    email: "jirayu@teetime.golf",
    password: "123456",
    displayName: "Jirayu Jumroenwattana",
    nickname: "แบม",
    phone: "",
    commissionRate: 0.3,
    proficiency: [
      "เกมแอพโพรชที่แม่นยำและการสร้างจังหวะสวิง (tempo & rhythm) เพื่อเพิ่มระยะ",
      "เน้นการสร้างพื้นฐานของวงสวิงที่ถูกต้องเป็นลำดับแรก",
      "ปรับรูปแบบวงสวิงให้เหมาะกับสรีระของแต่ละคน",
      "สอนสนุกเข้าใจง่าย เหมาะกับเยาวชนและมือใหม่ที่เริ่มต้นจากศูนย์",
      "นำประสบการณ์จากการแข่งขันมาถ่ายทอดให้กับนักกอล์ฟเพื่อเรียนรู้และพัฒนา",
    ].join("\n"),
    education: "PGA Thailand Certified",
    athleticBackground: [
      "3rd runner-up (Top 4) - Faldo Series Thailand Championship 2015",
      "2nd runner-up (Top 3) - TGA-Singha at Evergreen Hills Golf 2017",
    ].join("\n"),
  },
  {
    email: "kunkrit@teetime.golf",
    password: "123456",
    displayName: "Kunkrit Piromeiam",
    nickname: "กฤศ",
    phone: "",
    commissionRate: 0.3,
    proficiency: [
      "สร้างวงสวิงสำหรับมือใหม่ที่ถูกต้องตามสรีระของผู้เรียนในแต่ละคน ทั้งเด็กและผู้ใหญ่",
      "สอนตามหลัก Golf Biomechanics",
      "มีเทคนิคในการปรับแก้ไขวงสวิงตามความต้องการของผู้เรียน",
      "มีความรู้ความเข้าใจในเรื่อง Short game เป็นอย่างดี",
    ].join("\n"),
    education:
      "Mahidol University\nBachelor's Degree in Sports Science\nFaculty of Sports Science",
    athleticBackground: [
      "Former Golf Athlete – Mahidol University Team",
      "คะแนนสะสมอันดับที่ 1 Thailand Golf Association (TGA) Central Ranking 2021-2022",
      "1st runner up TGA-SINGHA @Uniland Golf & Resort 26-27 Feb 2022",
      "1st runner up TGA-SINGHA @Uniland Golf & Resort 28-29 May 2022",
      "2 times Hole-in-one",
    ].join("\n"),
  },
];

// ── Student definitions ──────────────────────────────────────────────
const STUDENT_FIRST_NAMES = [
  "Somchai", "Nattapong", "Wichai", "Thanapon", "Kittisak",
  "Piyapong", "Surasak", "Anuchit", "Worawut", "Chanathip",
  "Siriporn", "Pimchanok", "Kanokwan", "Narumon", "Ploy",
  "Thanawan", "Jirapat", "Nattawut", "Apinya", "Warisa",
];

const STUDENT_LAST_NAMES = [
  "Saetang", "Phanomwan", "Kongkaew", "Srisuk", "Thongsuk",
  "Wongsawat", "Bunyarit", "Charoensuk", "Intaraprasit", "Rattanakul",
  "Sukhum", "Duangsawat", "Maneerat", "Chaiyo", "Petcharat",
  "Sirimongkol", "Visetsiri", "Lertpanich", "Khampha", "Tongprasert",
];

const STUDENT_NICKNAMES = [
  "ชัย", "ต้น", "เบส", "แม็ค", "โอ๊ค",
  "บอม", "กอล์ฟ", "ไนท์", "ปอ", "ฟิล์ม",
  "แพร", "มิ้นท์", "เฟิร์น", "แนน", "พลอย",
  "ฝ้าย", "จี", "นัท", "อิ๋ง", "วา",
];

const GENDERS: Array<"male" | "female"> = [
  "male", "male", "male", "male", "male",
  "male", "male", "male", "male", "male",
  "female", "female", "female", "female", "female",
  "female", "female", "male", "female", "female",
];

const LEARNING_GOALS = [
  "ต้องการพัฒนาวงสวิงให้มีความมั่นคงมากขึ้น",
  "อยากเริ่มเล่นกอล์ฟจากศูนย์ เรียนรู้พื้นฐานทั้งหมด",
  "ต้องการปรับปรุงเกมสั้นและการพัตต์",
  "อยากเตรียมตัวแข่งขันกอล์ฟสมัครเล่น",
  "ต้องการเพิ่มระยะไดรฟ์และความแม่นยำ",
  "เน้นเรื่อง course management และกลยุทธ์ในสนาม",
  "อยากแก้ปัญหาสไลซ์และฮุค",
  "เรียนเพื่อสุขภาพและความสนุก",
  "ต้องการพัฒนาทักษะเพื่อเล่นกับลูกค้า/เพื่อนร่วมงาน",
  "สนใจเรื่อง mental game และสมาธิในสนาม",
];

const REVIEW_COMMENTS = [
  "โค้ชสอนดีมาก อธิบายเข้าใจง่าย สวิงดีขึ้นเยอะเลยครับ",
  "เรียนสนุกมาก โค้ชใจเย็นและให้คำแนะนำที่เป็นประโยชน์",
  "ปรับวงสวิงได้ดีขึ้นมาก ขอบคุณโค้ชครับ",
  "บทเรียนวันนี้เน้นเรื่อง short game ได้ความรู้เยอะมาก",
  "โค้ชช่วยแก้ปัญหาสไลซ์ได้ ตอนนี้ตีตรงขึ้นเยอะ",
  "สอนละเอียดมาก เหมาะกับมือใหม่อย่างผม",
  "ได้เทคนิคการพัตต์ใหม่ๆ ลองแล้วได้ผลดี",
  "วันนี้ซ้อมเรื่อง approach shot โค้ชสอนดีครับ",
  "ระยะไดรฟ์ไกลขึ้นหลังจากปรับท่า ขอบคุณโค้ชมากครับ",
  "โค้ชมีประสบการณ์มาก สอนเรื่อง course management ได้ดี",
  "เรียนครั้งนี้เน้นเรื่อง bunker shot ได้ความมั่นใจมากขึ้น",
  "ปรับ grip ใหม่ตามที่โค้ชแนะนำ รู้สึกถนัดมือขึ้น",
  "โค้ชให้ดริลกลับไปฝึกที่บ้านด้วย ประทับใจมาก",
  "สวิงราบรื่นขึ้นมาก โค้ชจับจุดได้แม่น",
  "วันนี้ซ้อม pitching กับ chipping ได้ความรู้ใหม่หลายอย่าง",
  "เรียนเรื่อง alignment และ stance ช่วยให้ตีแม่นขึ้น",
  "โค้ชสอนเรื่อง tempo ทำให้สวิงสม่ำเสมอขึ้นมาก",
  "ชอบที่โค้ชใช้วิดีโอวิเคราะห์สวิง ทำให้เห็นจุดที่ต้องแก้ชัดเจน",
  "บทเรียนเรื่อง weight transfer ช่วยได้เยอะมาก",
  "ประทับใจการสอน โค้ชปรับให้เหมาะกับสรีระของเราโดยเฉพาะ",
];

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🔌 Connecting to MongoDB Atlas...");
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`   Connected to database: ${DB_NAME}\n`);

  // ── Step 1: Drop existing collections ──────────────────────────────
  console.log("🗑  Dropping existing collections...");
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.dropCollection(col.name);
    console.log(`   Dropped: ${col.name}`);
  }
  if (collections.length === 0) console.log("   (none found)");
  console.log();

  // ── Step 2: Create indexes ─────────────────────────────────────────
  console.log("📇 Creating indexes...");

  await db.collection("users").createIndex({ uid: 1 }, { unique: true });
  await db.collection("users").createIndex({ role: 1 });
  await db.collection("users").createIndex({ lineUserIds: 1 });
  await db.collection("users").createIndex({ role: 1, createdAt: -1 });
  console.log("   users: uid (unique), role, lineUserIds, role+createdAt");

  await db.collection("bookings").createIndex({ proId: 1, date: 1 });
  await db.collection("bookings").createIndex({ studentId: 1, status: 1 });
  await db.collection("bookings").createIndex({ date: 1 });
  await db.collection("bookings").createIndex({ createdAt: -1 });
  console.log("   bookings: proId+date, studentId+status, date, createdAt");

  await db.collection("studentHours").createIndex({ studentId: 1 }, { unique: true });
  console.log("   studentHours: studentId (unique)");

  await db.collection("serviceTokens").createIndex({ studentId: 1 }, { unique: true });
  console.log("   serviceTokens: studentId (unique)");

  await db.collection("payments").createIndex({ status: 1, createdAt: -1 });
  await db.collection("payments").createIndex({ studentId: 1 });
  console.log("   payments: status+createdAt, studentId");

  await db.collection("reviews").createIndex({ studentId: 1 });
  await db.collection("reviews").createIndex({ proId: 1 });
  await db.collection("reviews").createIndex({ bookingId: 1 });
  await db.collection("reviews").createIndex({ createdAt: -1 });
  console.log("   reviews: studentId, proId, bookingId, createdAt");

  await db.collection("courses").createIndex({ createdAt: -1 });
  console.log("   courses: createdAt");

  await db.collection("auditLogs").createIndex({ createdAt: -1 });
  await db.collection("auditLogs").createIndex({ studentId: 1 });
  console.log("   auditLogs: createdAt, studentId");
  console.log();

  // ── Step 3: Firebase Auth — owner ──────────────────────────────────
  console.log("🔑 Setting up Firebase Auth owner account...");
  const adminAuth = getAdminAuth();

  let ownerUid: string;
  try {
    const existing = await adminAuth.getUserByEmail(OWNER_EMAIL);
    ownerUid = existing.uid;
    await adminAuth.updateUser(ownerUid, {
      password: OWNER_PASSWORD,
      displayName: OWNER_DISPLAY_NAME,
    });
    console.log(`   Found existing account (${ownerUid}), password reset.`);
  } catch {
    const newUser = await adminAuth.createUser({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
      displayName: OWNER_DISPLAY_NAME,
    });
    ownerUid = newUser.uid;
    console.log(`   Created new account (${ownerUid}).`);
  }
  console.log(`   Email:    ${OWNER_EMAIL}`);
  console.log(`   Password: ${OWNER_PASSWORD}\n`);

  // ── Step 4: Seed owner document ────────────────────────────────────
  console.log("👤 Seeding owner user document...");
  await db.collection("users").insertOne({
    uid: ownerUid,
    email: OWNER_EMAIL,
    displayName: OWNER_DISPLAY_NAME,
    role: "owner",
    phone: "",
    createdAt: new Date().toISOString(),
  });
  console.log(`   Inserted owner { uid: "${ownerUid}" }\n`);

  // ── Step 5: Firebase Auth + MongoDB — pros ─────────────────────────
  console.log("🏌️ Seeding pro coach accounts...\n");
  const proUids: string[] = [];

  for (const pro of PROS) {
    let uid: string;
    try {
      const existing = await adminAuth.getUserByEmail(pro.email);
      uid = existing.uid;
      await adminAuth.updateUser(uid, {
        password: pro.password,
        displayName: pro.displayName,
      });
      console.log(`   ♻️  ${pro.displayName} (${pro.nickname}) — reset existing (${uid})`);
    } catch {
      const newUser = await adminAuth.createUser({
        email: pro.email,
        password: pro.password,
        displayName: pro.displayName,
      });
      uid = newUser.uid;
      console.log(`   ✨ ${pro.displayName} (${pro.nickname}) — created (${uid})`);
    }

    await db.collection("users").insertOne({
      uid,
      email: pro.email,
      displayName: pro.displayName,
      nickname: pro.nickname,
      role: "pro",
      phone: pro.phone,
      commissionRate: pro.commissionRate,
      proficiency: pro.proficiency,
      education: pro.education,
      athleticBackground: pro.athleticBackground,
      createdAt: new Date().toISOString(),
    });

    proUids.push(uid);
    console.log(`         Email:    ${pro.email}`);
    console.log(`         Password: ${pro.password}\n`);
  }

  // ── Step 6: Firebase Auth + MongoDB — 20 students ──────────────────
  console.log("🎓 Seeding 20 student accounts...\n");
  const studentUids: string[] = [];

  for (let i = 0; i < 20; i++) {
    const firstName = STUDENT_FIRST_NAMES[i];
    const lastName = STUDENT_LAST_NAMES[i];
    const displayName = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}@teetime.test`;
    const password = "123456";
    const nickname = STUDENT_NICKNAMES[i];
    const gender = GENDERS[i];
    const assignedProId = proUids[i % proUids.length];

    const birthYear = randomInt(1985, 2005);
    const birthMonth = randomInt(1, 12);
    const birthDay = randomInt(1, 28);
    const birthdate = `${birthYear}-${pad(birthMonth)}-${pad(birthDay)}`;

    let uid: string;
    try {
      const existing = await adminAuth.getUserByEmail(email);
      uid = existing.uid;
      await adminAuth.updateUser(uid, { password, displayName });
      console.log(`   ♻️  ${displayName} (${nickname}) — reset (${uid})`);
    } catch {
      const newUser = await adminAuth.createUser({ email, password, displayName });
      uid = newUser.uid;
      console.log(`   ✨ ${displayName} (${nickname}) — created (${uid})`);
    }

    await db.collection("users").insertOne({
      uid,
      email,
      displayName,
      firstName,
      lastName,
      nickname,
      role: "student",
      phone: `08${randomInt(10000000, 99999999)}`,
      gender,
      birthdate,
      proId: assignedProId,
      learningGoals: LEARNING_GOALS[i % LEARNING_GOALS.length],
      createdAt: randomDate(180, 30).toISOString(),
    });

    studentUids.push(uid);
  }
  console.log(`   Total students created: ${studentUids.length}\n`);

  // ── Step 7: 100 bookings ───────────────────────────────────────────
  console.log("📅 Seeding 100 bookings...");

  interface BookingDoc {
    _id: ObjectId;
    studentId: string;
    proId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: "scheduled" | "completed" | "cancelled";
    hourlyRate: number;
    createdAt: string;
  }

  const bookings: BookingDoc[] = [];
  const startHours = [8, 9, 10, 11, 13, 14, 15, 16, 17];

  for (let i = 0; i < 100; i++) {
    const studentId = studentUids[i % studentUids.length];
    const proId = proUids[i % proUids.length];
    const bookingDate = randomDate(120, -14); // some in the past, some in the future
    const startHour = randomPick(startHours);
    const duration = randomPick([1, 1, 1, 2]); // mostly 1hr, sometimes 2hr

    const isPast = bookingDate.getTime() < Date.now();
    let status: "scheduled" | "completed" | "cancelled";
    if (!isPast) {
      status = "scheduled";
    } else if (Math.random() < 0.12) {
      status = "cancelled";
    } else {
      status = "completed";
    }

    const createdAt = new Date(bookingDate.getTime() - randomInt(1, 14) * 86_400_000);

    bookings.push({
      _id: new ObjectId(),
      studentId,
      proId,
      date: toDateStr(bookingDate),
      startTime: `${pad(startHour)}:00`,
      endTime: `${pad(startHour + duration)}:00`,
      status,
      hourlyRate: 800,
      createdAt: createdAt.toISOString(),
    });
  }

  await db.collection("bookings").insertMany(bookings);
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const scheduledBookings = bookings.filter((b) => b.status === "scheduled");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");
  console.log(
    `   Inserted 100 bookings (${completedBookings.length} completed, ` +
    `${scheduledBookings.length} scheduled, ${cancelledBookings.length} cancelled)\n`,
  );

  // ── Step 8: 90 reviews (linked to completed bookings) ─────────────
  console.log("⭐ Seeding 90 reviews...");

  const reviewableBookings = [...completedBookings];
  // Shuffle so reviews aren't all sequential
  for (let i = reviewableBookings.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [reviewableBookings[i], reviewableBookings[j]] = [reviewableBookings[j], reviewableBookings[i]];
  }

  const reviewCount = Math.min(90, reviewableBookings.length);
  const reviewDocs = [];

  for (let i = 0; i < reviewCount; i++) {
    const booking = reviewableBookings[i];
    const reviewDate = new Date(
      new Date(booking.date).getTime() + randomInt(0, 3) * 86_400_000,
    );

    reviewDocs.push({
      bookingId: booking._id.toString(),
      studentId: booking.studentId,
      proId: booking.proId,
      comment: REVIEW_COMMENTS[i % REVIEW_COMMENTS.length],
      createdAt: reviewDate.toISOString(),
      updatedAt: reviewDate.toISOString(),
      date: booking.date,
    });
  }

  if (reviewDocs.length > 0) {
    await db.collection("reviews").insertMany(reviewDocs);
  }
  console.log(`   Inserted ${reviewDocs.length} reviews\n`);

  // ── Step 9: studentHours + auditLogs ───────────────────────────────
  console.log("⏱  Seeding studentHours & auditLogs...");

  const auditLogs = [];

  for (const studentId of studentUids) {
    const studentBookings = completedBookings.filter((b) => b.studentId === studentId);
    const totalUsed = studentBookings.reduce((sum, b) => {
      const start = parseInt(b.startTime.split(":")[0]);
      const end = parseInt(b.endTime.split(":")[0]);
      return sum + (end - start);
    }, 0);

    const totalPurchased = totalUsed + randomInt(2, 15);
    const remaining = totalPurchased - totalUsed;

    await db.collection("studentHours").insertOne({
      studentId,
      remainingHours: remaining,
      totalHoursPurchased: totalPurchased,
      totalHoursUsed: totalUsed,
    });

    for (const b of studentBookings) {
      const start = parseInt(b.startTime.split(":")[0]);
      const end = parseInt(b.endTime.split(":")[0]);
      const hours = end - start;
      auditLogs.push({
        action: "hours_deducted",
        studentId: b.studentId,
        proId: b.proId,
        hours,
        remainingHoursAfter: remaining,
        referenceType: "booking",
        referenceId: b._id.toString(),
        performedBy: "system",
        createdAt: b.createdAt,
      });
    }
  }

  if (auditLogs.length > 0) {
    await db.collection("auditLogs").insertMany(auditLogs);
  }
  console.log(`   ${studentUids.length} studentHours records`);
  console.log(`   ${auditLogs.length} auditLog entries\n`);

  // ── Done ───────────────────────────────────────────────────────────
  await client.close();
  console.log("✅ Seed complete! You can now run: npm run dev");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
