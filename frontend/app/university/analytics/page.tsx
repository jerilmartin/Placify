"use client";

import { useEffect, useState } from "react";
import { Loader2, GraduationCap, Briefcase, TrendingUp, Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { analyticsApi } from "@/lib/api";

const COLORS = ["#7c3aed", "#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

interface PlatformStats {
  total_students: number;
  active_jobs: number;
  total_applications: number;
  total_offers: number;
  placement_rate: number;
}

interface BranchStat {
  branch: string;
  placed: number;
  total: number;
  rate: number;
}

export default function UniversityAnalyticsPage() {
  const { user } = useAuth();
  const [platform, setPlatform] = useState<PlatformStats | null>(null);
  const [branchStats, setBranchStats] = useState<BranchStat[]>([]);
  const [ctcTrend, setCtcTrend] = useState<{ month: string; avg_ctc: number }[]>([]);
  const [statusDist, setStatusDist] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Platform-wide stats from backend
        const { data } = await analyticsApi.platformOverview();
        setPlatform(data);

        // Branch-wise placement from Supabase
        const { data: students } = await supabase
          .from("student_profiles")
          .select("course, placement_status");

        if (students) {
          const branchMap: Record<string, { total: number; placed: number }> = {};
          for (const s of students) {
            const branch = s.course || "Other";
            if (!branchMap[branch]) branchMap[branch] = { total: 0, placed: 0 };
            branchMap[branch].total++;
            if (s.placement_status === "placed") branchMap[branch].placed++;
          }
          const stats = Object.entries(branchMap).map(([branch, v]) => ({
            branch: branch.length > 20 ? branch.slice(0, 18) + "…" : branch,
            placed: v.placed,
            total: v.total,
            rate: v.total > 0 ? Math.round((v.placed / v.total) * 100) : 0,
          }));
          setBranchStats(stats.sort((a, b) => b.total - a.total).slice(0, 8));
        }

        // Drive application status distribution
        const { data: apps } = await supabase
          .from("drive_applications")
          .select("status");
        if (apps) {
          const countMap: Record<string, number> = {};
          for (const a of apps) {
            countMap[a.status] = (countMap[a.status] || 0) + 1;
          }
          setStatusDist(Object.entries(countMap).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
          })));
        }

        // CTC trend (from drives with package data per month)
        const { data: drives } = await supabase
          .from("placement_drives")
          .select("package_lpa, drive_date")
          .not("package_lpa", "is", null)
          .order("drive_date", { ascending: true });
        if (drives) {
          const monthMap: Record<string, number[]> = {};
          for (const d of drives) {
            if (!d.drive_date) continue;
            const m = new Date(d.drive_date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
            if (!monthMap[m]) monthMap[m] = [];
            monthMap[m].push(d.package_lpa);
          }
          setCtcTrend(
            Object.entries(monthMap).map(([month, vals]) => ({
              month,
              avg_ctc: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10,
            })).slice(-8)
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Placement Cell</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Placement Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real-time data across all active placement drives and student cohorts.</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Students", value: platform?.total_students ?? 0, icon: GraduationCap, color: "text-primary" },
          { label: "Active Drives", value: platform?.active_jobs ?? 0, icon: Briefcase, color: "text-success" },
          { label: "Applications", value: platform?.total_applications ?? 0, icon: Users, color: "text-info" },
          { label: "Placement Rate", value: `${platform?.placement_rate ?? 0}%`, icon: TrendingUp, color: "text-warning" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-[12px] text-muted-foreground">{label}</span>
            </div>
            <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Branch-wise Placement Bar Chart */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-[14px] font-semibold">Branch-wise Placement</h2>
          {branchStats.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">No branch data yet</div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchStats} margin={{ left: -10 }}>
                  <CartesianGrid stroke="currentColor" className="text-border" vertical={false} />
                  <XAxis dataKey="branch" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 10 }}
                    formatter={(val, name) => [val, name === "placed" ? "Placed" : "Total"]}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="var(--color-elevated)" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="placed" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Placed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Application Status Pie Chart */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-[14px] font-semibold">Application Status Distribution</h2>
          {statusDist.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">No application data yet</div>
          ) : (
            <div className="flex h-[280px] items-center gap-6">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie data={statusDist} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
                    {statusDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="flex-1 space-y-2">
                {statusDist.map((item, i) => (
                  <li key={item.name} className="flex items-center gap-2 text-[12.5px]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="ml-auto font-semibold">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* CTC Trend Line Chart */}
        <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-[14px] font-semibold">Average CTC Trend (LPA)</h2>
          {ctcTrend.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              No CTC trend data yet — drives with packages will appear here
            </div>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ctcTrend}>
                  <CartesianGrid stroke="currentColor" className="text-border" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} unit=" LPA" />
                  <Tooltip contentStyle={{ background: "var(--color-background)", border: "1px solid var(--color-border)", borderRadius: 10 }} />
                  <Line type="monotone" dataKey="avg_ctc" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} name="Avg CTC" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
