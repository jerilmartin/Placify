"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar, type PortalRole } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { CommandMenu } from "@/components/command-menu";
import { supabase } from "@/lib/supabase";

interface SidebarInfo {
  name: string;
  email: string;
  line2?: string;
  line3?: string;
  institution?: string;
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [sidebarInfo, setSidebarInfo] = useState<SidebarInfo | null>(null);
  const role: PortalRole = "student";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
    if (!isLoading && isAuthenticated && user?.role !== "student") {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Fetch real profile data for the sidebar
  const refreshSidebarInfo = useCallback(() => {
    if (!user) return;
    supabase
      .from("student_profiles")
      .select("full_name, email, university, course, graduation_year")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSidebarInfo({
            name: data.full_name || user.full_name || user.email,
            email: data.email || user.email,
            institution: data.university || undefined,
            line2: data.course ? `${data.course}` : undefined,
            line3: data.graduation_year ? `Batch of ${data.graduation_year}` : undefined,
          });
        } else {
          // fallback to auth user data before profile is filled
          setSidebarInfo({
            name: user.full_name || user.email,
            email: user.email,
          });
        }
      });
  }, [user]);

  useEffect(() => {
    refreshSidebarInfo();
  }, [refreshSidebarInfo]);

  // Listen for profile updates triggered from any page (e.g. resume sync)
  useEffect(() => {
    const handler = () => refreshSidebarInfo();
    window.addEventListener("placify:profile-updated", handler);
    return () => window.removeEventListener("placify:profile-updated", handler);
  }, [refreshSidebarInfo]);

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
        userInfo={sidebarInfo ?? { name: user?.full_name || user?.email || "—", email: user?.email || "" }}
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
