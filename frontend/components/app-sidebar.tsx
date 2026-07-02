import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  ListChecks,
  Bot,
  Sparkles,
  Bell,
  UserRound,
  Settings,
  ChevronsLeft,
  Search,
  Users,
  CalendarRange,
  BarChart3,
  Building2,
  GraduationCap,
  FileBarChart,
  ShieldCheck,
  CreditCard,
  Flag,
  ScrollText,
  KeyRound,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLockup, BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";

export type PortalRole = "student" | "recruiter" | "university" | "admin" | "mentor";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const NAV: Record<PortalRole, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { label: "Jobs", href: "/student/jobs", icon: Briefcase, badge: "42" },
    { label: "Applications", href: "/student/applications", icon: ListChecks, badge: "6" },
    { label: "Resume", href: "/student/resume", icon: FileText },
    { label: "AI Interview", href: "/student/interview", icon: Bot },
    { label: "Career AI", href: "/student/career", icon: Sparkles },
    { label: "Notifications", href: "/student/notifications", icon: Bell, badge: "3" },
    { label: "Profile", href: "/student/profile", icon: UserRound },
  ],
  recruiter: [
    { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
    { label: "Jobs", href: "/recruiter/jobs", icon: Briefcase },
    { label: "Candidates", href: "/recruiter/candidates", icon: Users },
  ],
  university: [
    { label: "Dashboard", href: "/university/dashboard", icon: LayoutDashboard },
    { label: "Placement Drives", href: "/university/drives", icon: CalendarRange },
    { label: "Students", href: "/university/students", icon: GraduationCap },
    { label: "Analytics", href: "/university/analytics", icon: BarChart3 },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Universities", href: "/admin/universities", icon: Building2 },
    { label: "Users", href: "/admin/users", icon: Users },
  ],
  mentor: [
    { label: "Dashboard", href: "/mentor/dashboard", icon: LayoutDashboard },
    { label: "Sessions", href: "/mentor/sessions", icon: Video },
  ],
};

const IDENTITY: Record<
  PortalRole,
  {
    eyebrow: string;
    initials: string;
    line1: string;
    line2: string;
    line3: string;
    accent: string;
  }
> = {
  student: {
    eyebrow: "Placement Season 2026",
    initials: "IB",
    line1: "IIT Bombay",
    line2: "Computer Science · B.Tech",
    line3: "Batch of 2026",
    accent: "from-primary/80 to-[oklch(0.55_0.20_235)]",
  },
  recruiter: {
    eyebrow: "Recruiter Workspace",
    initials: "ST",
    line1: "Stripe India",
    line2: "Engineering · Payments",
    line3: "12 open roles",
    accent: "from-[oklch(0.68_0.19_285)] to-[oklch(0.68_0.20_340)]",
  },
  university: {
    eyebrow: "Placement Cell",
    initials: "IB",
    line1: "IIT Bombay",
    line2: "Central Placement Office",
    line3: "Season 2026 · Live",
    accent: "from-[oklch(0.72_0.14_235)] to-[oklch(0.72_0.17_155)]",
  },
  admin: {
    eyebrow: "Placify Cloud",
    initials: "PC",
    line1: "Platform Admin",
    line2: "Tenants · Billing · Access",
    line3: "v4.2 · Production",
    accent: "from-[oklch(0.80_0.16_75)] to-[oklch(0.65_0.22_25)]",
  },
  mentor: {
    eyebrow: "Industry Mentor",
    initials: "AG",
    line1: "Alex Gupta",
    line2: "Senior SDE @ Google",
    line3: "Mentoring 8 students",
    accent: "from-[oklch(0.80_0.16_75)] to-[oklch(0.68_0.19_285)]",
  },
};

const ROLE_META: Record<PortalRole, { label: string; short: string }> = {
  student: { label: "Student", short: "AS" },
  recruiter: { label: "Recruiter", short: "PM" },
  university: { label: "Placement Officer", short: "RN" },
  admin: { label: "Platform Admin", short: "OP" },
  mentor: { label: "Mentor", short: "AG" },
};

export function AppSidebar({
  collapsed,
  onToggle,
  onOpenCommand,
  role,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onOpenCommand: () => void;
  role: PortalRole;
}) {
  const pathname = usePathname() || "";
  const identity = IDENTITY[role];
  const items = NAV[role];
  const meta = ROLE_META[role];

  return (
    <aside
      className={cn(
        "sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out lg:flex",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      <div className="flex h-[52px] items-center justify-between px-3">
        <Link href={`/${role}/dashboard`} className="flex items-center gap-2 px-1">
          {collapsed ? <BrandMark /> : <BrandLockup />}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Identity card */}
      {!collapsed ? (
        <div className="mx-3 mb-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-[12px] font-semibold text-white",
                identity.accent,
              )}
            >
              {identity.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-foreground">
                {identity.line1}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {identity.line2}
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-sidebar-border/70 pt-2">
            <span className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
              {identity.eyebrow}
            </span>
            <span className="text-[10.5px] font-medium text-foreground/80">
              {identity.line3}
            </span>
          </div>
        </div>
      ) : (
        <div className="mx-auto mb-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br text-[11px] font-semibold text-white",
              identity.accent,
            )}
          >
            {identity.initials}
          </div>
        </div>
      )}

      {/* Command trigger */}
      <button
        onClick={onOpenCommand}
        className={cn(
          "mx-3 mb-2 flex h-8 items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2.5 text-left text-[12.5px] text-muted-foreground transition-colors hover:bg-sidebar-accent",
          collapsed && "justify-center px-0",
        )}
      >
        <Search className="h-3.5 w-3.5" />
        {!collapsed && (
          <>
            <span className="flex-1">Search</span>
            <kbd className="ml-auto rounded border border-sidebar-border bg-background/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </>
        )}
      </button>

      {/* Nav */}
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== `/${role}/dashboard` && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-all",
                    active
                      ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent text-foreground shadow-[inset_0_0_0_1px_oklch(0.68_0.19_285/0.25)]"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_oklch(0.68_0.19_285/0.7)]" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                            active
                              ? "bg-primary/20 text-primary"
                              : "bg-sidebar-accent text-muted-foreground",
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer user card */}
      <div className={cn("border-t border-sidebar-border p-2.5", collapsed && "px-2")}>
        {collapsed ? (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.20_235)] text-[11px] font-semibold text-white">
            {meta.short}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-md px-1 py-0.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.20_235)] text-[11px] font-semibold text-white">
              {meta.short}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium text-foreground">
                {role === "student" ? "Aarav Sharma" : meta.label}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {role === "student" ? "aarav.s@iitb.ac.in" : `${meta.label} · Signed in`}
              </div>
            </div>
          </div>
        )}
      </div>

      {collapsed && (
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label="Expand sidebar"
            className="w-full text-muted-foreground"
          >
            <ChevronsLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      )}
    </aside>
  );
}
