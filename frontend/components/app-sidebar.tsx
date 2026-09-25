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
  student: "bg-[#800020] text-white border border-[#A0153E]/30",
  recruiter: "bg-[#132743] border border-[#D4AF37]/60 text-[#D4AF37]",
  university: "bg-[#162740] border border-[#CBD5E1]/30 text-white",
  admin: "bg-[#800020] text-white border border-[#D4AF37]/50",
  mentor: "bg-[#132743] border border-[#D4AF37]/40 text-[#D4AF37]",
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
        "sticky top-0 z-40 hidden h-screen shrink-0 flex-col border-r border-[#162740] bg-[#0A192F] text-[#CBD5E1] transition-[width] duration-300 ease-out lg:flex",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      <div className="flex h-[56px] items-center justify-between border-b border-[#162740] px-3">
        <Link href={`/${role}/dashboard`} className={cn("flex items-center gap-2 px-1", collapsed && "mx-auto")}>
          {collapsed ? <BrandMark className="border-[#1E3A5F] bg-[#0A192F]" /> : <BrandLockup isDarkSidebar />}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="rounded-md p-1.5 text-[#94A3B8] transition-all hover:bg-[#132743] hover:text-white"
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
          className="mx-auto my-2 flex h-7 w-7 items-center justify-center rounded-md text-[#94A3B8] transition-all hover:bg-[#132743] hover:text-white"
        >
          <ChevronsLeft className="h-4 w-4 rotate-180" />
        </button>
      )}

      {!collapsed ? (
        <div className="mx-3 my-3 rounded-lg border border-[#162740] bg-[#132743]/50 p-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[12px] font-semibold",
                accent,
              )}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-white">{line1}</div>
              <div className="truncate text-[11px] text-[#94A3B8]">{line2}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-[#162740] pt-2">
            <span className="text-[10px] uppercase tracking-[0.14em] text-[#94A3B8]">{eyebrow}</span>
            <span className="text-[10.5px] font-medium text-[#D4AF37]">{line3}</span>
          </div>
        </div>
      ) : (
        <div className="mx-auto my-2">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-md text-[11px] font-semibold", accent)}>
            {initials}
          </div>
        </div>
      )}

      <button
        onClick={onOpenCommand}
        className={cn(
          "mx-3 mb-3 flex h-8 items-center gap-2 rounded-md border border-[#162740] bg-[#132743]/30 px-2.5 text-left text-[12.5px] text-[#94A3B8] transition-colors hover:bg-[#132743] hover:text-white",
          collapsed && "justify-center px-0",
        )}
      >
        <Search className="h-3.5 w-3.5" />
        {!collapsed && (
          <>
            <span className="flex-1">Search</span>
            <kbd className="ml-auto rounded border border-[#162740] bg-[#0A192F] px-1.5 py-0.5 font-mono text-[10px] text-[#94A3B8]">⌘K</kbd>
          </>
        )}
      </button>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== `/${role}/dashboard` && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-all",
                    active
                      ? "border-l-2 border-[#D4AF37] bg-[#132743] text-white"
                      : "text-[#CBD5E1] hover:bg-[#132743]/60 hover:text-white",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-[#D4AF37]" : "text-[#94A3B8] group-hover:text-white")} />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={cn("border-t border-[#162740] p-2.5", collapsed && "px-2")}>
        {collapsed ? (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#132743] border border-[#D4AF37]/40 text-[11px] font-semibold text-[#D4AF37]">
            {initials}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-md px-1 py-0.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#132743] border border-[#D4AF37]/40 text-[11px] font-semibold text-[#D4AF37]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium text-white">{displayName}</div>
              <div className="truncate text-[11px] text-[#94A3B8]">{displayEmail}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
