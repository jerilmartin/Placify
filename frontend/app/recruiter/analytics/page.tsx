"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { recruitersApi } from "@/lib/api";
import type { RecruiterOverview } from "@/lib/types";

export default function RecruiterAnalyticsPage() {
  const [data, setData] = useState<RecruiterOverview | null>(null);
  useEffect(() => {
    recruitersApi.getOverview().then((response) => setData(response.data)).catch(() => toast.error("Could not load hiring analytics"));
  }, []);

  if (!data) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  const conversion = data.metrics.applications ? Math.round(data.metrics.accepted / data.metrics.applications * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recruiter · Performance</div>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground">Hiring Analytics</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Total roles", data.metrics.total_jobs],
          ["Applicants", data.metrics.applications],
          ["Offers", data.metrics.offers],
          ["Hire conversion", `${conversion}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sharp">
            <div className="text-xs uppercase tracking-wider font-medium text-muted-foreground">{label}</div>
            <div className="mt-2 font-serif text-3xl font-bold text-foreground tabular-nums">{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-border bg-card p-5 shadow-sharp">
        <h2 className="font-serif text-base font-semibold text-foreground">Pipeline conversion</h2>
        <div className="mt-4 h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.funnel}>
              <CartesianGrid stroke="#E5E0D8" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="stage" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E0D8", borderRadius: 8, color: "#1C1917", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }} />
              <Bar dataKey="count" fill="#800020" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
