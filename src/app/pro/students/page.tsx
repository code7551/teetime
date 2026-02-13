"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Chip,
  Avatar,
} from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, Search, Phone } from "lucide-react";
import type { AppUser, StudentHours } from "@/types";

export default function ProStudentsPage() {
  const { user, firebaseUser, loading } = useAuth();
  const [students, setStudents] = useState<AppUser[]>([]);
  const [hoursMap, setHoursMap] = useState<Record<string, StudentHours>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || !firebaseUser) return;

    const fetchData = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const studentsRes = await fetch(`/api/users?role=student`, { headers });
        if (studentsRes.ok) {
          const studentsData: AppUser[] = await studentsRes.json();
          const myStudents = studentsData.filter((s) => s.proId === user.uid);
          setStudents(myStudents);

          // Fetch hours for each student
          const hoursEntries = await Promise.all(
            myStudents.map(async (s) => {
              try {
                const hoursRes = await fetch(
                  `/api/student-hours/${s.uid}`,
                  { headers }
                );
                if (hoursRes.ok) {
                  const data: StudentHours = await hoursRes.json();
                  return [s.uid, data] as const;
                }
              } catch {
                // ignore
              }
              return [
                s.uid,
                {
                  studentId: s.uid,
                  remainingHours: 0,
                  totalHoursPurchased: 0,
                  totalHoursUsed: 0,
                },
              ] as const;
            })
          );

          const map: Record<string, StudentHours> = {};
          for (const [uid, data] of hoursEntries) {
            map[uid] = data;
          }
          setHoursMap(map);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user, firebaseUser]);

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  const filtered = students.filter((s) =>
    s.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap className="text-green-600" size={28} />
            นักเรียนของฉัน
          </h1>
          <p className="text-gray-500 mt-1">
            นักเรียนทั้งหมด {students.length} คน
          </p>
        </div>
        <Input
          placeholder="ค้นหานักเรียน..."
          startContent={<Search size={18} className="text-gray-400" />}
          variant="bordered"
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="border border-gray-100 shadow-sm">
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <GraduationCap size={40} className="mx-auto mb-2 opacity-50" />
              <p>
                {search ? "ไม่พบนักเรียนที่ค้นหา" : "ยังไม่มีนักเรียน"}
              </p>
            </div>
          ) : (
            <Table
              aria-label="ตารางนักเรียน"
              removeWrapper
              classNames={{
                th: "bg-gray-50 text-gray-600 font-semibold",
              }}
            >
              <TableHeader>
                <TableColumn>ชื่อ</TableColumn>
                <TableColumn>เบอร์โทร</TableColumn>
                <TableColumn>ชั่วโมงคงเหลือ</TableColumn>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => {
                  const hours = hoursMap[student.uid];
                  return (
                    <TableRow key={student.uid}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={student.avatarUrl}
                            name={student.displayName}
                            size="sm"
                            className="bg-green-100 text-green-700"
                          />
                          <div>
                            <p className="font-medium text-gray-800">
                              {student.displayName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone size={14} />
                          <span>{student.phone || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            hours && hours.remainingHours > 0
                              ? "success"
                              : "danger"
                          }
                        >
                          {hours ? `${hours.remainingHours} ชม.` : "0 ชม."}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
