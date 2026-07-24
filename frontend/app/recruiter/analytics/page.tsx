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
      <div className="mb-6"><div className="text-xs uppercase tracking-widest text-muted-foreground">Recruiter</div><h1 className="mt-1 text-2xl font-semibold">Hiring analytics</h1></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Total roles", data.metrics.total_jobs],
          ["Applicants", data.metrics.applications],
          ["Offers", data.metrics.offers],
          ["Hire conversion", `${conversion}%`],
        ].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-surface p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 text-3xl font-semibold">{value}</div></div>)}
      </div>
      <div className="mt-5 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium">Pipeline conversion</h2>
        <div className="mt-4 h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.funnel}>
              <CartesianGrid stroke="currentColor" className="text-border" vertical={false} />
              <XAxis dataKey="stage" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 10 }} />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[7, 7, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
