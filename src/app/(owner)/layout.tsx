"use client";

import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/layout/AuthGuard";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["owner"]}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar variant="owner" />
        <main className="flex-1 lg:ml-0 p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
