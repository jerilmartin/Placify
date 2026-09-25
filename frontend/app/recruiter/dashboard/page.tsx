"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, Loader2, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { recruitersApi } from "@/lib/api";
import type { RecruiterOverview } from "@/lib/types";

export default function RecruiterDashboard() {
  const [overview, setOverview] = useState<RecruiterOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recruitersApi.getOverview()
      .then(({ data }) => setOverview(data))
      .catch(() => toast.error("Could not load the recruiter workspace"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!overview) {
    return <div className="p-8 text-sm text-muted-foreground">Recruiter data is unavailable.</div>;
  }

  const metrics = [
    { label: "Open roles", value: overview.metrics.open_jobs, icon: BriefcaseBusiness },
    { label: "Applications", value: overview.metrics.applications, icon: Users },
    { label: "Shortlisted", value: overview.metrics.shortlisted, icon: CheckCircle2 },
    { label: "Offers", value: overview.metrics.offers, icon: ArrowUpRight },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
            Recruiter · {overview.profile.company_name}
            <span className={overview.profile.verified ? "rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800" : "rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800"}>
              {overview.profile.verified ? "Verified" : "Pending verification"}
            </span>
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground">Talent Workspace</h1>
        </div>
        <Button asChild disabled={!overview.profile.verified}><Link href="/recruiter/post-job">Post a job</Link></Button>
      </div>

      {!overview.profile.verified && (
        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-sharp">
          A university placement representative must verify this recruiter profile before new jobs can be published.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sharp">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              {label}<Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 font-serif text-3xl font-bold tabular-nums text-foreground">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.5fr]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sharp">
          <h2 className="font-serif text-base font-semibold text-foreground">Hiring funnel</h2>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.funnel} margin={{ left: -22 }}>
                <CartesianGrid stroke="#E5E0D8" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" fontSize={11} stroke="#64748B" tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke="#64748B" tickLine={false} axisLine={false} width={38} />
                <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E0D8", borderRadius: 8, color: "#1C1917", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }} />
                <Bar dataKey="count" fill="#800020" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sharp overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-4">
            <h2 className="font-serif text-base font-semibold text-foreground">Recent applications</h2>
            <Button asChild size="sm" variant="ghost"><Link href="/recruiter/candidates">View pipeline</Link></Button>
          </div>
          <div className="divide-y divide-border">
            {overview.recent_applications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Applications to your jobs will appear here.</div>
            ) : overview.recent_applications.map((application) => (
              <div key={application.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div>
                  <div className="font-medium text-foreground text-[13.5px]">{application.student_profiles?.full_name || "Student"}</div>
                  <div className="text-xs text-muted-foreground">{application.student_profiles?.university || "University not specified"}</div>
                </div>
                <span className="rounded-md border border-border bg-muted/60 px-2.5 py-1 text-xs capitalize text-foreground font-medium">{application.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
