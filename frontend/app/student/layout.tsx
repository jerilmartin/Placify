"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import {
  LayoutDashboard, FileText, Briefcase, ClipboardList,
  MessageSquare, BookOpen, LogOut, Zap, Bell, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navItems = [
  { href: "/student/dashboard", label: "Dashboard",       icon: LayoutDashboard },
  { href: "/student/resume",    label: "Resume",          icon: FileText },
  { href: "/student/jobs",      label: "Job Matches",     icon: Briefcase },
  { href: "/student/applications", label: "Applications", icon: ClipboardList },
  { href: "/student/interview", label: "AI Interview",    icon: MessageSquare },
  { href: "/student/career",    label: "Career Guidance", icon: BookOpen },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
    if (!isLoading && isAuthenticated && user?.role !== "student") {
      toast.error("Access denied");
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar */}
      <aside className="w-60 fixed top-0 left-0 bottom-0 glass border-r border-white/5 flex flex-col z-40">
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <Link href="/student/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold gradient-text">Placify</span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.full_name?.charAt(0) ?? "S"}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.full_name || "Student"}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "sidebar-link",
                pathname.startsWith(item.href) && "active"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <Link href="/student/notifications" className="sidebar-link">
            <Bell className="w-4 h-4" /> Notifications
          </Link>
          <Link href="/student/profile" className="sidebar-link">
            <User className="w-4 h-4" /> Profile
          </Link>
          <button
            onClick={() => logout()}
            className="sidebar-link w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
