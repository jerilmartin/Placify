"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { LayoutDashboard, CalendarDays, BarChart3, Users, LogOut, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/university/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/university/drives",    label: "Drives",    icon: CalendarDays },
  { href: "/university/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/university/students",  label: "Students",  icon: Users },
];

export default function UniversityLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
    if (!isLoading && isAuthenticated && !["university","placement_officer"].includes(user?.role ?? "")) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <aside className="w-60 fixed top-0 left-0 bottom-0 glass border-r border-white/5 flex flex-col z-40">
        <div className="p-5 border-b border-white/5">
          <Link href="/university/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white" /></div>
            <span className="font-bold gradient-text">Placify</span>
          </Link>
        </div>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-xs font-bold text-white">{user?.full_name?.charAt(0) ?? "U"}</div>
            <div><div className="text-sm font-medium text-white truncate">{user?.full_name ?? "University"}</div><div className="text-xs text-slate-500">University Admin</div></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={cn("sidebar-link", pathname.startsWith(item.href) && "active")}>
              <item.icon className="w-4 h-4 flex-shrink-0" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={() => logout()} className="sidebar-link w-full text-left text-red-400 hover:bg-red-500/10"><LogOut className="w-4 h-4" /> Sign Out</button>
        </div>
      </aside>
      <main className="flex-1 ml-60 min-h-screen">{children}</main>
    </div>
  );
}
