import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Users,
  Video,
  BarChart3,
  Building2,
  CalendarRange,
  GraduationCap,
  FileBarChart,
  CreditCard,
  Flag,
  ScrollText,
  KeyRound,
} from "lucide-react";
import type { PortalRole } from "@/components/app-sidebar";

type Item = { icon: React.ComponentType<{ className?: string }>; label: string; to: string };

const ITEMS: Record<PortalRole, Item[]> = {
  student: [
    { icon: LayoutDashboard, label: "Dashboard", to: "/app" },
    { icon: Briefcase, label: "Jobs", to: "/app/jobs" },
    { icon: ListChecks, label: "Applications", to: "/app/applications" },
    { icon: FileText, label: "Resume", to: "/app/resume" },
    { icon: Bot, label: "AI Interview", to: "/app/interview" },
    { icon: Sparkles, label: "Career AI", to: "/app/career" },
    { icon: Bell, label: "Notifications", to: "/app/notifications" },
    { icon: UserRound, label: "Profile", to: "/app/profile" },
    { icon: Settings, label: "Settings", to: "/app/settings" },
  ],
  recruiter: [
    { icon: LayoutDashboard, label: "Dashboard", to: "/app/recruiter" },
    { icon: Briefcase, label: "Jobs", to: "/app/recruiter/jobs" },
    { icon: Users, label: "Candidates", to: "/app/recruiter/candidates" },
    { icon: Video, label: "Interviews", to: "/app/recruiter/interviews" },
    { icon: BarChart3, label: "Analytics", to: "/app/recruiter/analytics" },
    { icon: Building2, label: "Company Profile", to: "/app/recruiter/company" },
    { icon: Settings, label: "Settings", to: "/app/recruiter/settings" },
  ],
  university: [
    { icon: LayoutDashboard, label: "Dashboard", to: "/app/university" },
    { icon: CalendarRange, label: "Placement Drives", to: "/app/university/drives" },
    { icon: GraduationCap, label: "Students", to: "/app/university/students" },
    { icon: Users, label: "Recruiters", to: "/app/university/recruiters" },
    { icon: BarChart3, label: "Analytics", to: "/app/university/analytics" },
    { icon: FileBarChart, label: "Reports", to: "/app/university/reports" },
    { icon: Settings, label: "Settings", to: "/app/university/settings" },
  ],
  admin: [
    { icon: LayoutDashboard, label: "Dashboard", to: "/app/admin" },
    { icon: Building2, label: "Universities", to: "/app/admin/universities" },
    { icon: Users, label: "Users", to: "/app/admin/users" },
    { icon: CreditCard, label: "Billing", to: "/app/admin/billing" },
    { icon: Flag, label: "Feature Flags", to: "/app/admin/flags" },
    { icon: ScrollText, label: "Audit Logs", to: "/app/admin/audit" },
    { icon: KeyRound, label: "API Keys", to: "/app/admin/keys" },
    { icon: Settings, label: "Settings", to: "/app/admin/settings" },
  ],
};

export function CommandMenu({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: PortalRole;
}) {
  const navigate = useNavigate();
  const items = ITEMS[role];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search or jump to…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.to}
                onSelect={() => {
                  onOpenChange(false);
                  navigate({ to: item.to });
                }}
              >
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
