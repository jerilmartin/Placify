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
  ChevronsLeft,
  Search,
  Users,
  CalendarRange,
  BarChart3,
  Building2,
  GraduationCap,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLockup, BrandMark } from "@/components/brand";

export type PortalRole = "student" | "recruiter" | "university" | "admin" | "mentor";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: Record<PortalRole, NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { label: "Jobs", href: "/student/jobs", icon: Briefcase },
    { label: "Applications", href: "/student/applications", icon: ListChecks },
    { label: "Resume", href: "/student/resume", icon: FileText },
    { label: "AI Interview", href: "/student/interview", icon: Bot },
    { label: "Career AI", href: "/student/career", icon: Sparkles },
    { label: "Notifications", href: "/student/notifications", icon: Bell },
    { label: "Profile", href: "/student/profile", icon: UserRound },
  ],
  recruiter: [
    { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
    { label: "Jobs", href: "/recruiter/jobs", icon: Briefcase },
    { label: "Drive Requests", href: "/recruiter/drive-requests", icon: CalendarRange },
    { label: "Candidates", href: "/recruiter/candidates", icon: Users },
    { label: "Interviews", href: "/recruiter/interviews", icon: CalendarRange },
    { label: "Analytics", href: "/recruiter/analytics", icon: BarChart3 },
    { label: "Company Profile", href: "/recruiter/company", icon: Building2 },
  ],
  university: [
    { label: "Dashboard", href: "/university/dashboard", icon: LayoutDashboard },
    { label: "Placement Drives", href: "/university/drives", icon: CalendarRange },
    { label: "Drive Approvals", href: "/university/drive-requests", icon: ListChecks },
    { label: "Students", href: "/university/students", icon: GraduationCap },
    { label: "Recruiters", href: "/university/recruiters", icon: Building2 },
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

const ROLE_ACCENT: Record<PortalRole, string> = {
  student: "from-primary/80 to-[oklch(0.55_0.20_235)]",
  recruiter: "from-[oklch(0.68_0.19_285)] to-[oklch(0.68_0.20_340)]",
  university: "from-[oklch(0.72_0.14_235)] to-[oklch(0.72_0.17_155)]",
  admin: "from-[oklch(0.80_0.16_75)] to-[oklch(0.65_0.22_25)]",
  mentor: "from-[oklch(0.80_0.16_75)] to-[oklch(0.68_0.19_285)]",
};

const ROLE_EYEBROW: Record<PortalRole, string> = {
  student: "Placement Season 2026",
  recruiter: "Recruiter Workspace",
  university: "Placement Cell",
  admin: "Placify Cloud",
  mentor: "Industry Mentor",
};

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppSidebar({
  collapsed,
  onToggle,
  onOpenCommand,
  role,
  userInfo,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onOpenCommand: () => void;
  role: PortalRole;
  userInfo?: {
    name: string;
    email: string;
    line2?: string;
    line3?: string;
    institution?: string;
  };
}) {
  const pathname = usePathname() || "";
  const items = NAV[role];
  const accent = ROLE_ACCENT[role];
  const eyebrow = ROLE_EYEBROW[role];

  const displayName = userInfo?.name || "—";
  const displayEmail = userInfo?.email || "";
  const initials = getInitials(displayName);
  const line1 = userInfo?.institution || displayName;
  const line2 = userInfo?.line2 || (role.charAt(0).toUpperCase() + role.slice(1));
  const line3 = userInfo?.line3 || "";

  return (
    <aside
      className={cn(
        "sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out lg:flex",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      <div className="flex h-[52px] items-center justify-between px-3">
        <Link href={`/${role}/dashboard`} className={cn("flex items-center gap-2 px-1", collapsed && "mx-auto")}>
          {collapsed ? <BrandMark /> : <BrandLockup />}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="rounded-md p-1.5 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-foreground"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expand button shown only when collapsed */}
      {collapsed && (
        <button
          onClick={onToggle}
          aria-label="Expand sidebar"
          className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-foreground"
        >
          <ChevronsLeft className="h-4 w-4 rotate-180" />
        </button>
      )}

      {!collapsed ? (
        <div className="mx-3 mb-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-[12px] font-semibold text-white",
                accent,
              )}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-foreground">{line1}</div>
              <div className="truncate text-[11px] text-muted-foreground">{line2}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-sidebar-border/70 pt-2">
            <span className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</span>
            <span className="text-[10.5px] font-medium text-foreground/80">{line3}</span>
          </div>
        </div>
      ) : (
        <div className="mx-auto mb-2">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br text-[11px] font-semibold text-white", accent)}>
            {initials}
          </div>
        </div>
      )}

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
            <kbd className="ml-auto rounded border border-sidebar-border bg-background/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
          </>
        )}
      </button>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== `/${role}/dashboard` && pathname.startsWith(item.href));
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
                  {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_oklch(0.68_0.19_285/0.7)]" />}
                  <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={cn("border-t border-sidebar-border p-2.5", collapsed && "px-2")}>
        {collapsed ? (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.20_235)] text-[11px] font-semibold text-white">
            {initials}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-md px-1 py-0.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.20_235)] text-[11px] font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium text-foreground">{displayName}</div>
              <div className="truncate text-[11px] text-muted-foreground">{displayEmail}</div>
            </div>
          </div>
        )}
      </div>


    </aside>
  );
}
