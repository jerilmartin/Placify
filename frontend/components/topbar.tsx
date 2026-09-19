import { Bell, HelpCircle, Search, Sun, Moon, LogOut, ChevronLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const crumbLabels: Record<string, string> = {
  app: "Placify",
  jobs: "Jobs",
  applications: "Applications",
  resume: "Resume",
  interview: "AI Interview",
  career: "Career AI",
  notifications: "Notifications",
  recruiter: "Recruiter",
  university: "University",
  admin: "Super Admin",
  settings: "Settings",
  drives: "Placement Drives",
  students: "Students",
  analytics: "Analytics",
  profile: "Profile",
  dashboard: "Dashboard",
};

export function Topbar({ onOpenCommand }: { onOpenCommand: () => void }) {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);
  const [isDark, setIsDark] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    notificationsApi.unreadCount()
      .then((res) => setUnreadCount(res.data?.unread_count || 0))
      .catch(() => {});

    const channel = supabase.channel(`topbar-notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const notif = payload.new as any;
            setUnreadCount((c) => c + 1);
            toast.info(notif.title, { description: notif.message });
          } else if (payload.eventType === "UPDATE") {
            notificationsApi.unreadCount()
              .then((res) => setUnreadCount(res.data?.unread_count || 0))
              .catch(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, [isDark]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowLogout(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = user?.full_name
    ? user.full_name.trim().split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-md lg:px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-[13px]">
        {segments.length === 0 ? (
          <span className="font-medium text-foreground">Placify</span>
        ) : (
          segments.map((seg, i) => {
            const isLast = i === segments.length - 1;
            const label = crumbLabels[seg] ?? seg.replace(/-/g, " ");
            return (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground/50">/</span>}
                <span className={cn("capitalize", isLast ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
              </span>
            );
          })
        )}
      </nav>

      {/* Center search */}
      <button
        onClick={onOpenCommand}
        className="mx-auto hidden max-w-md flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-elevated md:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search jobs, students, drives…</span>
        <kbd className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        {/* Theme toggle */}
        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setIsDark((v) => !v)}>
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        {/* Help */}
        <Button variant="ghost" size="icon" aria-label="Help">
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" aria-label="Notifications" asChild>
          <Link href={`/${segments[0] || "student"}/notifications`} className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </Button>

        {/* User avatar + logout dropdown */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            onClick={() => setShowLogout((v) => !v)}
            aria-label="User menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.20_235)] text-[11px] font-semibold text-white ring-2 ring-transparent transition-all hover:ring-primary/40"
          >
            {initials}
          </button>

          {showLogout && (
            <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-border bg-surface shadow-2xl shadow-black/30 overflow-hidden">
              {/* User info */}
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-[13px] font-medium text-foreground">{user?.full_name || "—"}</p>
                <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
                <span className="mt-1 inline-block rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium capitalize text-primary">
                  {user?.role}
                </span>
              </div>

              {/* Actions */}
              <div className="p-1">
                <Link
                  href={`/${segments[0]}/profile`}
                  onClick={() => setShowLogout(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-foreground hover:bg-elevated transition-colors"
                >
                  <span className="h-4 w-4 text-muted-foreground">👤</span>
                  View Profile
                </Link>
                <button
                  onClick={() => {
                    setShowLogout(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
