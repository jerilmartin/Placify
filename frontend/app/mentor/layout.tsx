"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { LayoutDashboard, Calendar, LogOut, Zap, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/mentor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mentor/sessions",  label: "Sessions",  icon: Calendar },
];

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
    if (!isLoading && isAuthenticated && user?.role !== "mentor") router.replace("/login");
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (isLoading) return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mobile-menu-btn" aria-label="Toggle menu">
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      <div className={cn("sidebar-backdrop", sidebarOpen && "open")} onClick={() => setSidebarOpen(false)} />
      <aside className={cn("w-60 fixed top-0 left-0 bottom-0 glass border-r border-white/5 flex flex-col z-40 portal-sidebar", sidebarOpen && "open")}>
        <div className="p-5 border-b border-white/5">
          <Link href="/mentor/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white" /></div>
            <span className="font-bold gradient-text">Placify</span>
          </Link>
        </div>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-xs font-bold">{user?.full_name?.charAt(0) ?? "M"}</div>
            <div><div className="text-sm font-medium text-white">{user?.full_name ?? "Mentor"}</div><div className="text-xs text-slate-500">Mentor</div></div>
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
      <main className="flex-1 ml-60 min-h-screen portal-main">{children}</main>
    </div>
  );
}
