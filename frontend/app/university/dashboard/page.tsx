"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { universitiesApi } from "@/lib/api";
import { isDriveRegistrationClosed } from "@/lib/drive-status";
import { useAuth } from "@/contexts/AuthContext";

const PACKAGE_BANDS = [
  { r: "< 5L", min: 0, max: 5 },
  { r: "5–10L", min: 5, max: 10 },
  { r: "10–20L", min: 10, max: 20 },
  { r: "20–35L", min: 20, max: 35 },
  { r: "35L+", min: 35, max: Infinity },
];

const SECTOR_COLORS = [
  "#800020",
  "#0A192F",
  "#D4AF37",
  "#475569",
  "#15803D",
  "#8C6D23",
];

interface DashboardDrive {
  id: string;
  status: string;
  company_name: string;
  package_lpa: number | null;
  drive_date?: string | null;
  registration_deadline?: string | null;
  total_registered: number;
  total_selected: number;
  created_at?: string;
}

interface DashboardApplication {
  drive_id: string;
  student_id: string;
  status: string;
}

interface DashboardStudent {
  id: string;
  course?: string | null;
}

// Normalise branch/course strings to canonical labels
function normalizeBranch(course?: string | null): string {
  const c = (course || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (/\b(artificial intelligence|machine learning|data science|ai|ml)\b/.test(c)) return "AI/ML";
  if (/\b(computer science|computer engineering|cse|cs)\b/.test(c)) return "CSE";
  if (/\b(information technology|it)\b/.test(c)) return "IT";
  if (/\b(electronics|ece|telecommunication)\b/.test(c)) return "ECE";
  if (/\b(electrical|eee)\b/.test(c)) return "EEE";
  if (/\b(mechanical|mech)\b/.test(c)) return "Mech";
  if (/\bcivil\b/.test(c)) return "Civil";
  return "Other";
}

export default function UniversityDashboardPage() {
  const { user } = useAuth();
  const [uniName, setUniName] = useState("Your University");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Stats
  const [stats, setStats] = useState({
    totalDrives: 0, activeDrives: 0,
    totalRegistered: 0, totalApplications: 0, totalSelected: 0,
    totalStudents: 0,
  });

  // Chart data (all computed from DB)
  const [packageDist, setPackageDist] = useState<{ r: string; n: number }[]>([]);
  const [sectorData, setSectorData] = useState<{ name: string; v: number; c: string }[]>([]);
  const [branchData, setBranchData] = useState<{ b: string; students: number; selected: number; avgPkg: number }[]>([]);
  const [recentDrives, setRecentDrives] = useState<DashboardDrive[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
      const { data } = await universitiesApi.getAnalytics();
      setUniName(data.university_name || "Your University");
       const drivesArr = (data.drives || []) as DashboardDrive[];
       const allApps = (data.applications || []) as DashboardApplication[];
       const studentsArr = (data.students || []) as DashboardStudent[];

      // ── Compute stats ──────────────────────────────────────────
       const totalRegistered = new Set(allApps.map((application) => application.student_id)).size;
       const totalSelected = new Set(allApps.filter((application) =>
        ["selected", "offered", "accepted", "placed"].includes((application.status || "").toLowerCase())
       ).map((application) => application.student_id)).size;

      setStats({
        totalDrives: drivesArr.length,
        activeDrives: data.active_drives || 0,
        totalRegistered,
        totalApplications: allApps.length,
        totalSelected,
        totalStudents: studentsArr.length,
      });

      // ── Package distribution from drives ────────────────────────
      const pkgBands = PACKAGE_BANDS.map(band => ({
        r: band.r,
        n: drivesArr.filter((d) => {
          const p = Number(d.package_lpa);
          return p > 0 && p >= band.min && p < band.max;
        }).length,
      }));
      setPackageDist(pkgBands);

      // ── Recruiting companies (actual drive data, no inferred sectors) ──
      const companyMap: Record<string, number> = {};
      drivesArr.forEach((d) => {
        const company = (d.company_name || "Unknown recruiter").trim();
        companyMap[company] = (companyMap[company] || 0) + 1;
      });
      const companies = Object.entries(companyMap).sort((a, b) => b[1] - a[1]);
      const shownCompanies = companies.slice(0, 5);
      if (companies.length > 5) shownCompanies.push(["Other companies", companies.slice(5).reduce((sum, [, count]) => sum + count, 0)]);
      const sectors = shownCompanies.map(([name, count], i) => ({
        name,
        v: count,
        c: SECTOR_COLORS[i % SECTOR_COLORS.length],
      }));
      setSectorData(sectors);

      // ── Branch breakdown from student profiles ──────────────────
      const branchMap: Record<string, { students: number; selectedIds: Set<string>; packages: Map<string, number> }> = {};
      const studentsById = new Map(studentsArr.map((student) => [student.id, student]));
      studentsArr.forEach((s) => {
        const b = normalizeBranch(s.course);
        if (!branchMap[b]) branchMap[b] = { students: 0, selectedIds: new Set(), packages: new Map() };
        branchMap[b].students += 1;
      });
      // Cross-ref with applications
      allApps.forEach((a) => {
        const sp = studentsById.get(a.student_id);
        if (!sp) return;
        const b = normalizeBranch(sp.course);
        if (!branchMap[b]) branchMap[b] = { students: 0, selectedIds: new Set(), packages: new Map() };
        if (["selected", "offered", "accepted", "placed"].includes((a.status || "").toLowerCase())) {
          branchMap[b].selectedIds.add(a.student_id);
          const drive = drivesArr.find((d) => d.id === a.drive_id);
          if (drive?.package_lpa) branchMap[b].packages.set(a.student_id, drive.package_lpa);
        }
      });
      const branchRows = Object.entries(branchMap)
        .filter(([, v]) => v.students > 0)
        .map(([b, v]) => ({
          b,
          students: v.students,
          selected: v.selectedIds.size,
          avgPkg: v.packages.size > 0
            ? Math.round((Array.from(v.packages.values()).reduce((sum, pkg) => sum + pkg, 0) / v.packages.size) * 10) / 10
            : 0,
        }))
        .sort((a, b) => b.students - a.students);
      setBranchData(branchRows);

      // ── Recent drives ───────────────────────────────────────────
      setRecentDrives([...drivesArr].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")).slice(0, 5));
      } catch (error) {
        console.error("Failed to load university analytics:", error);
        setLoadError("Could not load verified placement counts. Please refresh or check the backend connection.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return <div className="mx-auto max-w-[1400px] px-4 py-8 text-sm text-destructive">{loadError}</div>;
  }

  const placePct = stats.totalRegistered > 0
    ? Math.round((stats.totalSelected / stats.totalRegistered) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Placement Cell · {uniName}
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground">
            Placement Dashboard · All drives
          </h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" asChild>
            <Link href="/university/drives">New drive</Link>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { l: "Total Drives", v: String(stats.totalDrives), d: `${stats.activeDrives} active/upcoming`, highlight: false },
          { l: "Registered Students", v: String(stats.totalRegistered), d: `${stats.totalApplications} applications across all drives`, highlight: false },
          { l: "Drive Selections", v: String(stats.totalSelected), d: "unique students with selection status", highlight: false },
          { l: "Selection Rate", v: stats.totalRegistered > 0 ? `${placePct}%` : "—", d: "of drive applicants", highlight: true },
          { l: "Total Students", v: String(stats.totalStudents), d: "linked to this university", highlight: false },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border bg-card p-4 shadow-sharp">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{k.l}</div>
            <div className={cn("mt-2 text-2xl font-bold tracking-tight tabular-nums font-serif", k.highlight ? "text-[#D4AF37]" : "text-foreground")}>{k.v}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{k.d}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Package distribution chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-sharp">
          <h3 className="font-serif text-base font-semibold text-foreground">Package distribution</h3>
          <p className="text-[12px] text-muted-foreground">Number of drives by CTC band</p>
          <div className="mt-3 h-[240px]">
            {packageDist.some(b => b.n > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={packageDist} margin={{ left: -18 }}>
                  <CartesianGrid stroke="#E5E0D8" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="r" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} width={38} />
                  <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E0D8", borderRadius: 8, color: "#1C1917", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }} />
                  <Bar dataKey="n" fill="#800020" radius={[4, 4, 0, 0]} name="Drives" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
                No drive data yet — <Link href="/university/drives" className="ml-1 text-[#800020] hover:underline font-medium">create a drive</Link>
              </div>
            )}
          </div>
        </div>

        {/* Recruiting companies */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sharp">
          <h3 className="font-serif text-base font-semibold text-foreground">Recruiting companies</h3>
          <p className="text-[12px] text-muted-foreground">Drives by company</p>
          <div className="mt-3 h-[200px]">
            {sectorData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sectorData} dataKey="v" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                  {sectorData.map((s) => <Cell key={s.name} fill={s.c} stroke="#FFFFFF" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E0D8", borderRadius: 8, color: "#1C1917", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }} />
              </PieChart>
            </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No drives yet</div>}
          </div>
          <ul className="mt-2 space-y-1 text-[12px]">
            {sectorData.map((s) => (
              <li key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-foreground">
                  <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: s.c }} /> {s.name}
                </span>
                <span className="tabular-nums font-medium text-foreground">{s.v} {s.v === 1 ? "drive" : "drives"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Branch breakdown table */}
      <div className="mt-4 rounded-xl border border-border bg-card shadow-sharp overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
          <h3 className="font-serif text-base font-semibold text-foreground">Branch-wise drive selections</h3>
          <div className="text-[12px] text-muted-foreground">From linked student profiles and drive applications</div>
        </div>
        <div className="overflow-x-auto">
          {branchData.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px] text-muted-foreground">
              No student profiles found linked to {uniName}. Students need to add their university name in their profile to appear here.
            </div>
          ) : (
            <table className="min-w-full text-[13px]">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-5 py-3 text-left">Branch</th>
                  <th className="px-3 py-3 text-left">Students</th>
                  <th className="px-3 py-3 text-left">Selected</th>
                  <th className="px-3 py-3 text-left">Selection %</th>
                  <th className="px-3 py-3 text-left">Avg. Advertised CTC</th>
                  <th className="px-3 py-3 text-left">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {branchData.map((b) => {
                  const pct = b.students > 0 ? Math.round((b.selected / b.students) * 100) : 0;
                  return (
                    <tr key={b.b} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{b.b}</td>
                      <td className="px-3 py-3 tabular-nums text-muted-foreground">{b.students}</td>
                      <td className="px-3 py-3 tabular-nums text-muted-foreground">{b.selected}</td>
                      <td className="px-3 py-3 tabular-nums font-semibold text-[#D4AF37]">{pct}%</td>
                      <td className="px-3 py-3 tabular-nums font-medium text-foreground">{b.avgPkg > 0 ? `₹${b.avgPkg}L` : "—"}</td>
                      <td className="px-3 py-3">
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-[#800020] transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent drives */}
      {recentDrives.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card shadow-sharp overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
            <h3 className="font-serif text-base font-semibold text-foreground">Recent drives</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/university/drives">View all →</Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {recentDrives.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div>
                  <div className="text-[13.5px] font-medium text-foreground">{d.company_name}</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {d.total_registered || 0} registered · {d.total_selected || 0} selected
                    {d.package_lpa ? ` · ₹${d.package_lpa}L` : ""}
                  </div>
                </div>
                <span className={`text-[11px] capitalize rounded-md px-2.5 py-1 font-medium border ${
                  isDriveRegistrationClosed(d) ? "bg-muted text-muted-foreground border-border" :
                  d.status === "active" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                  d.status === "upcoming" ? "bg-[#0A192F]/10 text-[#0A192F] border-[#0A192F]/20" :
                  "bg-muted text-muted-foreground border-border"
                }`}>{isDriveRegistrationClosed(d) ? "Applications closed" : d.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
