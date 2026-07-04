import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { applications, stages } from "@/lib/mock";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/applications")({
  component: ApplicationsPage,
});

function ApplicationsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {applications.length} tracked · updated 2m ago
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Export CSV</Button>
          <Button size="sm">New application</Button>
        </div>
      </div>

      {/* Stage summary */}
      <div className="mb-6 grid grid-cols-3 gap-2 md:grid-cols-6">
        {stages.map((s, i) => {
          const count = applications.filter((a) => a.stageIndex >= i && a.stageIndex <= i).length;
          return (
            <div key={s} className="rounded-lg border border-border bg-surface p-3">
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{s}</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Applications list */}
      <div className="space-y-3">
        {applications.map((a, ai) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: ai * 0.03 }}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[15px] font-medium">{a.role}</div>
                <div className="mt-0.5 text-[13px] text-muted-foreground">{a.company} · Applied {a.date}</div>
              </div>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium",
                  a.stage === "Offer"
                    ? "bg-success/12 text-success"
                    : a.stage === "Rejected"
                      ? "bg-destructive/12 text-destructive"
                      : "bg-primary/12 text-primary",
                )}
              >
                {a.stage}
              </span>
            </div>

            {/* Timeline */}
            <div className="mt-5 flex items-center">
              {stages.map((s, i) => {
                const done = i < a.stageIndex;
                const current = i === a.stageIndex;
                return (
                  <div key={s} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                          done
                            ? "border-success bg-success/15 text-success"
                            : current
                              ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_oklch(0.68_0.19_285/0.15)]"
                              : "border-border bg-surface text-muted-foreground",
                        )}
                      >
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : current ? <Clock className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
                      </div>
                      <div
                        className={cn(
                          "mt-1.5 text-[10.5px] uppercase tracking-wider",
                          done || current ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {s}
                      </div>
                    </div>
                    {i < stages.length - 1 && (
                      <div className={cn("mx-1 h-px flex-1", i < a.stageIndex ? "bg-success/50" : "bg-border")} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2 text-[12.5px]">
              <span className="text-muted-foreground">Recruiter note</span>
              <span className="text-foreground">{a.note}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
