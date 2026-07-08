"use client";


import { activity } from "@/lib/mock";
import { CheckCircle2, AlertTriangle, Info, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";



const extra = [
  { id: "e1", title: "Google extended your offer deadline by 3 days", when: "Yesterday", kind: "info" as const },
  { id: "e2", title: "You crossed 90% ATS score — you're now visible to enterprise recruiters", when: "2d", kind: "success" as const },
  { id: "e3", title: "Weekly digest: 14 new matches, 2 shortlists, 1 offer", when: "3d", kind: "info" as const },
];

export default function NotificationsPage() {
  const all = [...activity, ...extra];
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">{all.length} updates · 3 unread</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="mr-1.5 h-3.5 w-3.5" /> Filter</Button>
          <Button size="sm" variant="ghost">Mark all read</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {["Today", "This week"].map((g, gi) => (
          <div key={g}>
            <div className="border-b border-border bg-elevated/40 px-5 py-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {g}
            </div>
            <ul className="divide-y divide-border">
              {(gi === 0 ? all.slice(0, 3) : all.slice(3)).map((a, i) => {
                const Icon = a.kind === "success" ? CheckCircle2 : a.kind === "warning" ? AlertTriangle : Info;
                const tint = a.kind === "success" ? "text-success bg-success/12"
                  : a.kind === "warning" ? "text-warning bg-warning/12"
                    : "text-info bg-info/12";
                return (
                  <li key={a.id} className={cn("flex items-start gap-3 px-5 py-4 transition-colors hover:bg-elevated/60", i === 0 && gi === 0 && "bg-primary/[0.04]")}>
                    <div className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-md", tint)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px]">{a.title}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{a.when} ago</div>
                    </div>
                    {i === 0 && gi === 0 && <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
