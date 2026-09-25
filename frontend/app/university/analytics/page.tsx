"use client";

import { useEffect, useState } from "react";
import { Loader2, GraduationCap, Briefcase, TrendingUp, Users } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { universitiesApi } from "@/lib/api";

const COLORS = ["#800020", "#0A192F", "#D4AF37", "#475569", "#15803D"];

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
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await universitiesApi.getAnalytics();
        const students = (data.students || []) as { id: string; course?: string }[];
        const apps = (data.applications || []) as { student_id: string; status: string }[];
        const drives = (data.drives || []) as { package_lpa?: number; drive_date?: string }[];
        setPlatform({
          total_students: data.total_students || 0,
          active_jobs: data.active_drives || 0,
          total_applications: apps.length,
          total_offers: data.total_placed || 0,
          placement_rate: data.placement_rate || 0,
        });

        const placedSet = new Set(apps.filter((app) => ["selected", "offered", "accepted", "placed"].includes(app.status?.toLowerCase())).map((app) => app.student_id));
        if (students.length > 0) {
          const branchMap: Record<string, { total: number; placed: number }> = {};
          for (const s of students) {
            const branch = s.course || "Other";
            if (!branchMap[branch]) branchMap[branch] = { total: 0, placed: 0 };
            branchMap[branch].total++;
            if (placedSet.has(s.id)) branchMap[branch].placed++;
          }
          const stats = Object.entries(branchMap).map(([branch, v]) => ({
            branch: branch.length > 20 ? branch.slice(0, 18) + "…" : branch,
            placed: v.placed,
            total: v.total,
            rate: v.total > 0 ? Math.round((v.placed / v.total) * 100) : 0,
          }));
          setBranchStats(stats.sort((a, b) => b.total - a.total).slice(0, 8));
        }

        // Drive application status distribution for this university only
        if (apps.length > 0) {
          const countMap: Record<string, number> = {};
          for (const a of apps) {
            countMap[a.status] = (countMap[a.status] || 0) + 1;
          }
          setStatusDist(Object.entries(countMap).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
          })));
        }

        // Advertised package trend, not actual accepted-offer CTC.
        if (drives.length > 0) {
          const monthMap: Record<string, number[]> = {};
          for (const d of [...drives].sort((a, b) => (a.drive_date || "").localeCompare(b.drive_date || ""))) {
            if (!d.drive_date || !d.package_lpa) continue;
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
        setLoadError("Could not load verified university analytics. Please refresh or check the backend connection.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#800020]" />
      </div>
    );
  }
  if (loadError) {
    return <div className="mx-auto max-w-[1400px] px-4 py-8 text-sm text-destructive">{loadError}</div>;
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Placement Cell · Metrics</div>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground">Placement Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Verified counts from this university’s drives, applicants, and linked student profiles.</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Students", value: platform?.total_students ?? 0, icon: GraduationCap, color: "text-[#0A192F]" },
          { label: "Active Drives", value: platform?.active_jobs ?? 0, icon: Briefcase, color: "text-[#800020]" },
          { label: "Drive Applications", value: platform?.total_applications ?? 0, icon: Users, color: "text-foreground" },
          { label: "Selection Rate", value: `${platform?.placement_rate ?? 0}%`, icon: TrendingUp, color: "text-[#D4AF37]" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-sharp">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
            </div>
            <div className="mt-2 font-serif text-3xl font-bold tabular-nums text-foreground">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Branch-wise selection bar chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sharp">
          <h2 className="mb-4 font-serif text-base font-semibold text-foreground">Branch-wise Drive Selections</h2>
          {branchStats.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">No branch data yet</div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchStats} margin={{ left: -10 }}>
                  <CartesianGrid stroke="#E5E0D8" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="branch" stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E0D8", borderRadius: 8, color: "#1C1917", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                    formatter={(val, name) => [val, name === "placed" ? "Selected" : "Total"]}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#CBD5E1" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="placed" fill="#800020" radius={[4, 4, 0, 0]} name="Selected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Application Status Pie Chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sharp">
          <h2 className="mb-4 font-serif text-base font-semibold text-foreground">Application Status Distribution</h2>
          {statusDist.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">No application data yet</div>
          ) : (
            <div className="flex h-[280px] items-center gap-6">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie data={statusDist} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
                    {statusDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#FFFFFF" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E0D8", borderRadius: 8, color: "#1C1917", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="flex-1 space-y-2">
                {statusDist.map((item, i) => (
                  <li key={item.name} className="flex items-center gap-2 text-[12.5px]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="ml-auto font-semibold text-foreground tabular-nums">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* CTC Trend Line Chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sharp lg:col-span-2">
          <h2 className="mb-4 font-serif text-base font-semibold text-foreground">Average Advertised Package (LPA)</h2>
          {ctcTrend.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              No CTC trend data yet — drives with packages will appear here
            </div>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ctcTrend}>
                  <CartesianGrid stroke="#E5E0D8" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} unit=" LPA" />
                  <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E0D8", borderRadius: 8, color: "#1C1917", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }} />
                  <Line type="monotone" dataKey="avg_ctc" stroke="#800020" strokeWidth={2} dot={{ r: 4, fill: "#800020" }} name="Avg advertised package" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
