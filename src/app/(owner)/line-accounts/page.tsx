"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Button,
  Chip,
  Input,
} from "@heroui/react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  MessageCircle,
  Trash2,
  Search,
  Eye,
  Users,
  Unlink,
} from "lucide-react";

interface LineAccountEntry {
  lineUserId: string;
  studentId: string;
  studentName: string;
  studentNickname?: string;
  studentPhone: string;
  proId?: string;
  linkedCount: number;
}

interface ProUser {
  uid: string;
  displayName: string;
}

export default function LineAccountsPage() {
  return <LineAccountsContent />;
}

function LineAccountsContent() {
  const { firebaseUser } = useAuth();
  const [accounts, setAccounts] = useState<LineAccountEntry[]>([]);
  const [pros, setPros] = useState<ProUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();

      const [accountsRes, prosRes] = await Promise.all([
        fetch("/api/line-accounts", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/users?role=pro", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const accountsData = await accountsRes.json();
      const prosData = await prosRes.json();

      setAccounts(Array.isArray(accountsData) ? accountsData : []);
      setPros(Array.isArray(prosData) ? prosData : []);
    } catch (err) {
      console.error("Error fetching LINE accounts:", err);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRevoke = async (studentId: string, lineUserId: string) => {
    if (!confirm("ยืนยันถอดบัญชี LINE นี้ออก?")) return;
    if (!firebaseUser) return;

    setRevoking(lineUserId);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/users/${studentId}/line-accounts`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lineUserId }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Error revoking:", err);
    } finally {
      setRevoking(null);
    }
  };

  const getProName = (proId?: string) => {
    if (!proId) return "-";
    return pros.find((p) => p.uid === proId)?.displayName || proId;
  };

  const filtered = accounts.filter((acc) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      acc.studentName.toLowerCase().includes(q) ||
      (acc.studentNickname || "").toLowerCase().includes(q) ||
      acc.lineUserId.toLowerCase().includes(q) ||
      (acc.studentPhone || "").includes(q)
    );
  });

  // Group by student for summary
  const uniqueStudents = new Set(accounts.map((a) => a.studentId));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          จัดการบัญชี LINE
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          ดูรายการบัญชี LINE ที่เชื่อมต่อกับนักเรียน และถอดการเชื่อมต่อ
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border border-gray-100">
          <CardBody className="p-4 flex flex-row items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {accounts.length}
              </p>
              <p className="text-xs text-gray-500">บัญชี LINE ทั้งหมด</p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm border border-gray-100">
          <CardBody className="p-4 flex flex-row items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {uniqueStudents.size}
              </p>
              <p className="text-xs text-gray-500">
                นักเรียนที่เชื่อมต่อแล้ว
              </p>
            </div>
          </CardBody>
        </Card>
        <Card className="shadow-sm border border-gray-100">
          <CardBody className="p-4 flex flex-row items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Unlink size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {accounts.filter((a) => a.linkedCount > 1).length}
              </p>
              <p className="text-xs text-gray-500">บัญชีหลาย LINE</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-sm border border-gray-100">
        <CardHeader className="px-6 pt-5 pb-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
            <h3 className="font-semibold text-gray-800">
              รายการบัญชี LINE ({filtered.length})
            </h3>
            <Input
              placeholder="ค้นหาชื่อนักเรียน, LINE ID..."
              value={search}
              onValueChange={setSearch}
              variant="bordered"
              size="sm"
              className="w-full sm:max-w-xs"
              startContent={
                <Search size={16} className="text-gray-400" />
              }
              isClearable
              onClear={() => setSearch("")}
            />
          </div>
        </CardHeader>
        <CardBody className="px-6 pb-5">
          {filtered.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              {accounts.length === 0
                ? "ยังไม่มีบัญชี LINE ที่เชื่อมต่อ"
                : "ไม่พบผลลัพธ์"}
            </p>
          ) : (
            <Table aria-label="รายการบัญชี LINE" removeWrapper>
              <TableHeader>
                <TableColumn>นักเรียน</TableColumn>
                <TableColumn>LINE User ID</TableColumn>
                <TableColumn>โปรโค้ช</TableColumn>
                <TableColumn>สถานะ</TableColumn>
                <TableColumn align="center">จัดการ</TableColumn>
              </TableHeader>
              <TableBody>
                {filtered.map((acc) => (
                  <TableRow key={`${acc.studentId}-${acc.lineUserId}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-800">
                          {acc.studentName}
                        </p>
                        {acc.studentNickname && (
                          <p className="text-xs text-gray-400">
                            ({acc.studentNickname})
                          </p>
                        )}
                        {acc.studentPhone && (
                          <p className="text-xs text-gray-400">
                            {acc.studentPhone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {acc.lineUserId.slice(0, 12)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{getProName(acc.proId)}</span>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color="success">
                        เชื่อมต่อแล้ว
                      </Chip>
                      {acc.linkedCount > 1 && (
                        <Chip
                          size="sm"
                          variant="flat"
                          color="warning"
                          className="ml-1"
                        >
                          {acc.linkedCount} LINE
                        </Chip>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          as={Link}
                          href={`/students/${acc.studentId}`}
                          size="sm"
                          variant="flat"
                          color="primary"
                          isIconOnly
                          title="ดูโปรไฟล์"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          isIconOnly
                          isLoading={revoking === acc.lineUserId}
                          onPress={() =>
                            handleRevoke(acc.studentId, acc.lineUserId)
                          }
                          title="ถอดบัญชี LINE"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
