"use client";

import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/layout/AuthGuard";

export default function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["pro"]}>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar variant="pro" />
        <main className="flex-1 lg:ml-0 p-4 lg:p-8 pt-16 lg:pt-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
