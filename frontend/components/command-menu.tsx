import { useEffect } from "react";
import { useRouter } from "next/navigation";
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

type Item = { icon: React.ComponentType<{ className?: string }>; label: string; href: string };

const ITEMS: Record<PortalRole, Item[]> = {
  student: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/student/dashboard" },
    { icon: Briefcase, label: "Jobs", href: "/student/jobs" },
    { icon: ListChecks, label: "Applications", href: "/student/applications" },
    { icon: FileText, label: "Resume", href: "/student/resume" },
    { icon: Bot, label: "AI Interview", href: "/student/interview" },
    { icon: Sparkles, label: "Career AI", href: "/student/career" },
    { icon: Bell, label: "Notifications", href: "/student/notifications" },
    { icon: UserRound, label: "Profile", href: "/student/profile" },
  ],
  recruiter: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/recruiter/dashboard" },
    { icon: Briefcase, label: "Jobs", href: "/recruiter/jobs" },
    { icon: Users, label: "Candidates", href: "/recruiter/candidates" },
  ],
  university: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/university/dashboard" },
    { icon: CalendarRange, label: "Placement Drives", href: "/university/drives" },
    { icon: GraduationCap, label: "Students", href: "/university/students" },
    { icon: BarChart3, label: "Analytics", href: "/university/analytics" },
  ],
  admin: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: Building2, label: "Universities", href: "/admin/universities" },
    { icon: Users, label: "Users", href: "/admin/users" },
  ],
  mentor: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/mentor/dashboard" },
    { icon: Video, label: "Sessions", href: "/mentor/sessions" },
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
  const router = useRouter();
  const items = ITEMS[role] || [];

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
                key={item.href}
                onSelect={() => {
                  onOpenChange(false);
                  router.push(item.href);
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
