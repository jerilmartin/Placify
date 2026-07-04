import { Bell, HelpCircle, Search, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
};

export function Topbar({ onOpenCommand }: { onOpenCommand: () => void }) {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);
  const [isDark, setIsDark] = useState(true);

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
                <span
                  className={cn(
                    "capitalize",
                    isLast ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
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
        <kbd className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setIsDark((v) => !v)}
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Help">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications" asChild>
          <Link href="/student/notifications" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
