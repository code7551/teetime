"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  Spinner,
  Chip,
  Input,
  Select,
  SelectItem,
  Button,
} from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import {
  ScrollText,
  Search,
  PlusCircle,
  MinusCircle,
  CalendarDays,
  GraduationCap,
  User,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale/th";
import { getUserDisplayName } from "@/lib/utils";
import type { AppUser, AuditLog } from "@/types";

export default function AuditLogsPage() {
  const { firebaseUser } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pros, setPros] = useState<AppUser[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterProId, setFilterProId] = useState("");
  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const fetchData = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      setLoading(true);
      const token = await firebaseUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Build audit logs query
      const params = new URLSearchParams();
      if (filterProId) params.set("proId", filterProId);
      if (filterStudentId) params.set("studentId", filterStudentId);
      if (filterAction) params.set("action", filterAction);
      if (filterStartDate) params.set("startDate", filterStartDate);
      if (filterEndDate) params.set("endDate", filterEndDate);

      const [logsRes, prosRes, studentsRes] = await Promise.all([
        fetch(`/api/audit-logs?${params.toString()}`, { headers }),
        fetch("/api/users?role=pro", { headers }),
        fetch("/api/users?role=student", { headers }),
      ]);

      if (logsRes.ok) setLogs(await logsRes.json());
      if (prosRes.ok) setPros(await prosRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, filterProId, filterStudentId, filterAction, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const proMap = new Map(pros.map((p) => [p.uid, p]));
  const studentMap = new Map(students.map((s) => [s.uid, s]));

  const clearFilters = () => {
    setFilterProId("");
    setFilterStudentId("");
    setFilterAction("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  const hasFilters =
    filterProId || filterStudentId || filterAction || filterStartDate || filterEndDate;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ScrollText className="text-green-600" size={28} />
          บันทึกชั่วโมง
        </h1>
        <p className="text-gray-500 mt-1">
          ประวัติการเพิ่ม/ตัดชั่วโมงเรียนทั้งหมด ({logs.length} รายการ)
        </p>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardBody className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
              <Select
                label="ประเภท"
                placeholder="ทั้งหมด"
                size="sm"
                className="max-w-[180px]"
                selectedKeys={filterAction ? [filterAction] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFilterAction(selected || "");
                }}
              >
                <SelectItem key="hours_added" textValue="เพิ่มชั่วโมง">
                  เพิ่มชั่วโมง
                </SelectItem>
                <SelectItem key="hours_deducted" textValue="ตัดชั่วโมง">
                  ตัดชั่วโมง
                </SelectItem>
              </Select>

              <Select
                label="โปร"
                placeholder="ทั้งหมด"
                size="sm"
                className="max-w-xs"
                selectedKeys={filterProId ? [filterProId] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFilterProId(selected || "");
                }}
              >
                {pros.map((pro) => (
                  <SelectItem key={pro.uid} textValue={getUserDisplayName(pro)}>
                    {getUserDisplayName(pro)}
                  </SelectItem>
                ))}
              </Select>

              <Select
                label="นักเรียน"
                placeholder="ทั้งหมด"
                size="sm"
                className="max-w-xs"
                selectedKeys={filterStudentId ? [filterStudentId] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setFilterStudentId(selected || "");
                }}
              >
                {students.map((s) => (
                  <SelectItem key={s.uid} textValue={getUserDisplayName(s)}>
                    {getUserDisplayName(s)}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <Input
                type="date"
                label="ตั้งแต่วันที่"
                size="sm"
                className="max-w-[180px]"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
              <Input
                type="date"
                label="ถึงวันที่"
                size="sm"
                className="max-w-[180px]"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
              {hasFilters && (
                <Button size="sm" variant="flat" onPress={clearFilters}>
                  ล้างตัวกรอง
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Logs List */}
      {logs.length === 0 ? (
        <Card className="shadow-sm">
          <CardBody className="text-center py-12 text-gray-400">
            <ScrollText size={40} className="mx-auto mb-2 opacity-50" />
            <p>ยังไม่มีบันทึก</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isAdded = log.action === "hours_added";
            const studentName =
              log.studentName || getUserDisplayName(studentMap.get(log.studentId), "นักเรียน");
            const proName =
              log.proName || (log.proId ? getUserDisplayName(proMap.get(log.proId)) : "");

            return (
              <Card key={log.id} className="shadow-sm border border-gray-100">
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isAdded ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {isAdded ? (
                        <PlusCircle size={20} className="text-green-600" />
                      ) : (
                        <MinusCircle size={20} className="text-red-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={isAdded ? "success" : "danger"}
                        >
                          {isAdded ? "เพิ่มชั่วโมง" : "ตัดชั่วโมง"}
                        </Chip>
                        <span
                          className={`text-sm font-bold ${
                            isAdded ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {isAdded ? "+" : ""}
                          {log.hours} ชม.
                        </span>
                        <span className="text-xs text-gray-400">
                          คงเหลือ {log.remainingHoursAfter} ชม.
                        </span>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap text-sm text-gray-600 mb-1">
                        <span className="flex items-center gap-1">
                          <GraduationCap size={14} className="text-blue-500" />
                          {studentName}
                        </span>
                        {proName && (
                          <span className="flex items-center gap-1">
                            <User size={14} className="text-green-600" />
                            โปร {proName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} />
                          {format(parseISO(log.createdAt), "d MMM yyyy", {
                            locale: th,
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {format(parseISO(log.createdAt), "HH:mm")}
                        </span>
                        {log.note && (
                          <span className="text-gray-500">{log.note}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
