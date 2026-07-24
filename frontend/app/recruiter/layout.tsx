"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
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

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [sidebarInfo, setSidebarInfo] = useState<SidebarInfo | null>(null);
  const role: PortalRole = "recruiter";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
    if (!isLoading && isAuthenticated && user?.role !== "recruiter") {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("recruiter_profiles")
      .select("company_name, designation, contact_email, industry")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSidebarInfo({
            name: user.full_name || user.email,
            email: data.contact_email || user.email,
            institution: data.company_name || "TechCorp Solutions",
            line2: data.designation || "Talent Acquisition",
            line3: data.industry || "Technology",
          });
        } else {
          setSidebarInfo({
            name: user.full_name || user.email,
            email: user.email,
            institution: "TechCorp Solutions",
            line2: "Recruiter",
          });
        }
      });
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "recruiter") return null;

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
