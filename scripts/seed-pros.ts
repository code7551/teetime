/**
 * Seed script for Pro Coach accounts.
 *
 * What it does:
 *   1. Connects to MongoDB Atlas
 *   2. Creates Firebase Auth accounts for each pro (or resets if they exist)
 *   3. Upserts the pro user documents in MongoDB
 *
 * Run:  npx tsx scripts/seed-pros.ts
 */

import "dotenv/config";
import { MongoClient } from "mongodb";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = "teetime";

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

async function main() {
  console.log("🔌 Connecting to MongoDB Atlas...");
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`   Connected to database: ${DB_NAME}\n`);

  const adminAuth = getAdminAuth();
  const usersCol = db.collection("users");

  console.log("🏌️ Seeding pro coach accounts...\n");

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

    await usersCol.updateOne(
      { uid },
      {
        $set: {
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
        },
      },
      { upsert: true },
    );

    console.log(`         Email:    ${pro.email}`);
    console.log(`         Password: ${pro.password}\n`);
  }

  await client.close();
  console.log("✅ Pro seed complete!");
}

main().catch((err) => {
  console.error("❌ Pro seed failed:", err);
  process.exit(1);
});
