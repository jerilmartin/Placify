"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar, type PortalRole } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { CommandMenu } from "@/components/command-menu";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const role: PortalRole = "student";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
    if (!isLoading && isAuthenticated && user?.role !== "student") {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "student") return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar
        role={role}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        onOpenCommand={() => setCmdOpen(true)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenCommand={() => setCmdOpen(true)} />
        <main className="flex-1">
          {children}
        </main>
      </div>
      <CommandMenu role={role} open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
