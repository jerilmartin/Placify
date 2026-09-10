"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const PACKAGE_BANDS = [
  { r: "< 5L", min: 0, max: 5 },
  { r: "5–10L", min: 5, max: 10 },
  { r: "10–20L", min: 10, max: 20 },
  { r: "20–35L", min: 20, max: 35 },
  { r: "35L+", min: 35, max: Infinity },
];

const SECTOR_COLORS = [
  "oklch(0.68 0.19 285)",
  "oklch(0.72 0.14 235)",
  "oklch(0.72 0.17 155)",
  "oklch(0.80 0.16 75)",
  "oklch(0.68 0.20 340)",
  "oklch(0.65 0.18 310)",
];

// Normalise branch/course strings to canonical labels
function normalizeBranch(course: string): string {
  const c = (course || "").toLowerCase();
  if (c.includes("computer") || c.includes("cse") || c.includes(" cs")) return "CSE";
  if (c.includes("information") || c.includes(" it")) return "IT";
  if (c.includes("electronics") || c.includes("ece") || c.includes("ec")) return "ECE";
  if (c.includes("electrical") || c.includes("eee")) return "EEE";
  if (c.includes("mechanical") || c.includes("mech")) return "Mech";
  if (c.includes("civil")) return "Civil";
  if (c.includes("ai") || c.includes("data science") || c.includes("machine")) return "AI/ML";
  return "Other";
}

export default function UniversityDashboardPage() {
  const { user } = useAuth();
  const [uniName, setUniName] = useState("Your University");
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalDrives: 0, activeDrives: 0,
    totalRegistered: 0, totalSelected: 0,
    totalStudents: 0,
  });

  // Chart data (all computed from DB)
  const [packageDist, setPackageDist] = useState<{ r: string; n: number }[]>([]);
  const [sectorData, setSectorData] = useState<{ name: string; v: number; c: string }[]>([]);
  const [branchData, setBranchData] = useState<{ b: string; students: number; selected: number; avgPkg: number }[]>([]);
  const [recentDrives, setRecentDrives] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // 1. University profile
      const { data: up } = await supabase
        .from("university_profiles")
        .select("id, name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (up?.name) setUniName(up.name);
      if (!up?.id) { setLoading(false); return; }

      // 2. All drives for this university
      const { data: drives } = await supabase
        .from("placement_drives")
        .select("id, status, company_name, package_lpa, drive_date, total_registered, total_selected")
        .eq("university_id", up.id)
        .order("created_at", { ascending: false });

      const drivesArr = drives || [];
      const drivesIds = drivesArr.map((d: any) => d.id);

      // 3. Drive applications for this university's drives (with student info)
      let allApps: any[] = [];
      if (drivesIds.length > 0) {
        const { data: apps } = await supabase
          .from("drive_applications")
          .select("drive_id, status, student_id, student_profiles(course, cgpa)")
          .in("drive_id", drivesIds);
        allApps = apps || [];
      }

      // 4. All students in this university (by name match)
      const { data: students } = await supabase
        .from("student_profiles")
        .select("id, course, cgpa")
        .eq("university_id", up.id);
      const studentsArr = students || [];

      // ── Compute stats ──────────────────────────────────────────
      const totalRegistered = new Set(allApps.map((application: any) => application.student_id)).size;
      const totalSelected = new Set(allApps.filter((application: any) =>
        ["selected", "offered", "accepted", "placed"].includes((application.status || "").toLowerCase())
      ).map((application: any) => application.student_id)).size;

      setStats({
        totalDrives: drivesArr.length,
        activeDrives: drivesArr.filter((d: any) => ["active", "upcoming"].includes(d.status)).length,
        totalRegistered,
        totalSelected,
        totalStudents: studentsArr.length,
      });

      // ── Package distribution from drives ────────────────────────
      const pkgBands = PACKAGE_BANDS.map(band => ({
        r: band.r,
        n: drivesArr.filter((d: any) => {
          const p = d.package_lpa || 0;
          return p >= band.min && p < band.max;
        }).length,
      }));
      setPackageDist(pkgBands);

      // ── Sector breakdown from company names ─────────────────────
      // Infer sector from company name heuristic
      const sectorMap: Record<string, number> = {};
      drivesArr.forEach((d: any) => {
        const co = (d.company_name || "").toLowerCase();
        let sector = "Other";
        if (["google", "microsoft", "amazon", "meta", "apple", "netflix", "uber"].some(k => co.includes(k))) sector = "Big Tech";
        else if (["infosys", "tcs", "wipro", "cognizant", "accenture", "hcl"].some(k => co.includes(k))) sector = "IT Services";
        else if (["goldman", "jpmorgan", "morgan", "deloitte", "kpmg", "ey", "bank"].some(k => co.includes(k))) sector = "Finance";
        else if (["razorpay", "paytm", "stripe", "phonepe", "cred"].some(k => co.includes(k))) sector = "FinTech";
        else if (["swiggy", "zomato", "ola", "byju", "meesho", "flipkart"].some(k => co.includes(k))) sector = "StartUp";
        else sector = "Product";
        sectorMap[sector] = (sectorMap[sector] || 0) + 1;
      });
      const total = Object.values(sectorMap).reduce((a, b) => a + b, 1);
      const sectors = Object.entries(sectorMap).map(([name, count], i) => ({
        name,
        v: Math.round((count / total) * 100),
        c: SECTOR_COLORS[i % SECTOR_COLORS.length],
      })).sort((a, b) => b.v - a.v).slice(0, 6);
      setSectorData(sectors.length > 0 ? sectors : [{ name: "No data yet", v: 100, c: SECTOR_COLORS[0] }]);

      // ── Branch breakdown from student profiles ──────────────────
      const branchMap: Record<string, { students: number; selectedIds: Set<string>; packages: Map<string, number> }> = {};
      studentsArr.forEach((s: any) => {
        const b = normalizeBranch(s.course);
        if (!branchMap[b]) branchMap[b] = { students: 0, selectedIds: new Set(), packages: new Map() };
        branchMap[b].students += 1;
      });
      // Cross-ref with applications
      allApps.forEach((a: any) => {
        const sp = a.student_profiles;
        if (!sp) return;
        const b = normalizeBranch(sp.course);
        if (!branchMap[b]) branchMap[b] = { students: 0, selectedIds: new Set(), packages: new Map() };
        if (["selected", "offered", "accepted", "placed"].includes((a.status || "").toLowerCase())) {
          branchMap[b].selectedIds.add(a.student_id);
          const drive = drivesArr.find((d: any) => d.id === a.drive_id);
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
      setRecentDrives(drivesArr.slice(0, 5));
      setLoading(false);
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
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-[28px]">
            Placement Dashboard — AY 2025–26
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
          { l: "Total Drives", v: String(stats.totalDrives), d: `${stats.activeDrives} active/upcoming` },
          { l: "Registered Students", v: String(stats.totalRegistered), d: "across all drives" },
          { l: "Selected / Placed", v: String(stats.totalSelected), d: "students confirmed" },
          { l: "Placement Rate", v: placePct > 0 ? `${placePct}%` : "—", d: "of registered students" },
          { l: "Total Students", v: String(stats.totalStudents), d: "in student database" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border bg-surface p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.l}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{k.v}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{k.d}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Package distribution chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5">
          <h3 className="text-[14px] font-medium">Package distribution</h3>
          <p className="text-[12px] text-muted-foreground">Number of drives by CTC band</p>
          <div className="mt-3 h-[240px]">
            {packageDist.some(b => b.n > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={packageDist} margin={{ left: -18 }}>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                  <XAxis dataKey="r" stroke="oklch(0.68 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.68 0.02 270)" fontSize={11} tickLine={false} axisLine={false} width={38} />
                  <Tooltip contentStyle={{ background: "oklch(0.19 0.017 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="n" fill="oklch(0.68 0.19 285)" radius={[6, 6, 0, 0]} name="Drives" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
                No drive data yet — <Link href="/university/drives" className="ml-1 text-primary hover:underline">create a drive</Link>
              </div>
            )}
          </div>
        </div>

        {/* Sector breakdown */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-[14px] font-medium">Sector breakdown</h3>
          <p className="text-[12px] text-muted-foreground">By recruiting company type</p>
          <div className="mt-3 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sectorData} dataKey="v" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                  {sectorData.map((s) => <Cell key={s.name} fill={s.c} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.19 0.017 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1 text-[12px]">
            {sectorData.map((s) => (
              <li key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.c }} /> {s.name}
                </span>
                <span className="tabular-nums text-muted-foreground">{s.v}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Branch breakdown table */}
      <div className="mt-4 rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-[14px] font-medium">Branch-wise placement</h3>
          <div className="text-[12px] text-muted-foreground">From registered student profiles</div>
        </div>
        <div className="overflow-x-auto">
          {branchData.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px] text-muted-foreground">
              No student profiles found linked to {uniName}. Students need to add their university name in their profile to appear here.
            </div>
          ) : (
            <table className="min-w-full text-[13px]">
              <thead className="bg-elevated/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 text-left">Branch</th>
                  <th className="px-3 py-2.5 text-left">Students</th>
                  <th className="px-3 py-2.5 text-left">Selected</th>
                  <th className="px-3 py-2.5 text-left">Placement %</th>
                  <th className="px-3 py-2.5 text-left">Avg. Package</th>
                  <th className="px-3 py-2.5 text-left">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {branchData.map((b) => {
                  const pct = b.students > 0 ? Math.round((b.selected / b.students) * 100) : 0;
                  return (
                    <tr key={b.b} className="hover:bg-elevated/60">
                      <td className="px-5 py-3 font-medium">{b.b}</td>
                      <td className="px-3 py-3 tabular-nums">{b.students}</td>
                      <td className="px-3 py-3 tabular-nums">{b.selected}</td>
                      <td className="px-3 py-3 tabular-nums">{pct}%</td>
                      <td className="px-3 py-3 tabular-nums">{b.avgPkg > 0 ? `₹${b.avgPkg}L` : "—"}</td>
                      <td className="px-3 py-3">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-elevated">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.55_0.20_235)]"
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
        <div className="mt-4 rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-[14px] font-medium">Recent drives</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/university/drives">View all →</Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {recentDrives.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-[13px] font-medium">{d.company_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {d.total_registered || 0} registered · {d.total_selected || 0} selected
                    {d.package_lpa ? ` · ₹${d.package_lpa}L` : ""}
                  </div>
                </div>
                <span className={`text-[11px] capitalize rounded-full px-2.5 py-0.5 font-medium ${
                  d.status === "active" ? "bg-success/15 text-success" :
                  d.status === "upcoming" ? "bg-primary/15 text-primary" :
                  "bg-muted text-muted-foreground"
                }`}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
