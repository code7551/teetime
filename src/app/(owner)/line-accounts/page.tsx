"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Input,
  type SortDescriptor,
} from "@heroui/react";
import { useAuth } from "@/hooks/useAuth";
import { Search } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface LineAccess {
  id: string;
  lineUserId: string;
  displayName: string;
  email: string | null;
  accessedAt: string;
  createdAt: string;
}

export default function LineAccountsPage() {
  return <LineAccountsContent />;
}

function LineAccountsContent() {
  const { firebaseUser } = useAuth();
  const [accesses, setAccesses] = useState<LineAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "createdAt",
    direction: "descending",
  });

  const fetchData = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/line-accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAccesses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching LINE accesses:", err);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAndSorted = useMemo(() => {
    let items = accesses;

    // Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (acc) =>
          acc.displayName.toLowerCase().includes(q) ||
          (acc.email || "").toLowerCase().includes(q) ||
          acc.lineUserId.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortDescriptor.column) {
      const col = sortDescriptor.column as keyof LineAccess;
      items = [...items].sort((a, b) => {
        const aVal = a[col] ?? "";
        const bVal = b[col] ?? "";
        let cmp = 0;
        if (col === "accessedAt" || col === "createdAt") {
          cmp = new Date(aVal).getTime() - new Date(bVal).getTime();
        } else {
          cmp = String(aVal).localeCompare(String(bVal));
        }
        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      });
    }

    return items;
  }, [accesses, search, sortDescriptor]);

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
        <h1 className="text-2xl font-bold text-gray-800">บัญชี LINE</h1>
        <p className="text-sm text-gray-500 mt-1">
          ผู้ใช้ที่เข้าถึง Mini App ใน 24 ชั่วโมงล่าสุด ({accesses.length}{" "}
          บัญชี)
        </p>
      </div>

      {/* Table */}
      <Table
        aria-label="รายการบัญชี LINE"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        classNames={{
          wrapper: "shadow-sm border border-gray-100 rounded-xl",
        }}
        topContent={
          <Input
            placeholder="ค้นหาชื่อ, อีเมล, LINE ID..."
            value={search}
            onValueChange={setSearch}
            className="w-full"
            startContent={<Search size={16} className="text-gray-400" />}
            isClearable
            onClear={() => setSearch("")}
          />
        }
      >
        <TableHeader>
          <TableColumn key="displayName" allowsSorting>
            ชื่อ LINE
          </TableColumn>
          <TableColumn key="email" allowsSorting>
            อีเมล
          </TableColumn>
          <TableColumn key="lineUserId" allowsSorting>
            LINE User ID
          </TableColumn>
          <TableColumn key="createdAt" allowsSorting>
            วันที่สร้าง
          </TableColumn>
          <TableColumn key="accessedAt" allowsSorting>
            เข้าถึงล่าสุด
          </TableColumn>
        </TableHeader>
        <TableBody
          items={filteredAndSorted}
          emptyContent="ยังไม่มีบัญชี LINE ใน 24 ชม. ที่ผ่านมา"
        >
          {(acc) => (
            <TableRow key={acc.id}>
              <TableCell>
                <p className="font-medium text-gray-800">
                  {acc.displayName || "-"}
                </p>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">
                  {acc.email || "-"}
                </span>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {acc.lineUserId.slice(0, 12)}...
                </code>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm text-gray-700">
                    {format(new Date(acc.createdAt), "d MMM yyyy HH:mm", {
                      locale: th,
                    })}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm text-gray-700">
                    {format(new Date(acc.accessedAt), "d MMM yyyy HH:mm", {
                      locale: th,
                    })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(acc.accessedAt), {
                      addSuffix: true,
                      locale: th,
                    })}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
