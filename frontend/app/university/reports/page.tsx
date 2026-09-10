"use client";

import { useEffect, useState } from "react";
import { Loader2, Download, FileText, Building2, GraduationCap, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface DriveReport {
  id: string;
  company_name: string;
  role: string | null;
  title: string;
  package_lpa: number | null;
  drive_date: string | null;
  status: string;
  total_registered: number;
  total_selected: number;
  location: string | null;
  eligibility: {
    eligible_branches?: string[];
    min_cgpa?: number;
  } | null;
}

export default function UniversityReportsPage() {
  const [drives, setDrives] = useState<DriveReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("placement_drives")
        .select("id, company_name, role, title, package_lpa, drive_date, status, total_registered, total_selected, location, eligibility")
        .order("drive_date", { ascending: false });
      if (error) console.error(error);
      setDrives(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = drives.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.company_name?.toLowerCase().includes(q) || (d.role || d.title || "").toLowerCase().includes(q);
  });

  const totalPlaced = drives.reduce((s, d) => s + (d.total_selected || 0), 0);
  const totalRegistered = drives.reduce((s, d) => s + (d.total_registered || 0), 0);
  const avgCTC = drives.filter(d => d.package_lpa).length > 0
    ? Math.round(drives.reduce((s, d) => s + (d.package_lpa || 0), 0) / drives.filter(d => d.package_lpa).length * 10) / 10
    : 0;
  const companies = new Set(drives.map(d => d.company_name)).size;

  const exportCSV = () => {
    const headers = ["Company", "Role", "Package (LPA)", "Drive Date", "Registered", "Selected", "Status"];
    const rows = filtered.map((d) => [
      d.company_name,
      d.role || d.title,
      d.package_lpa ?? "",
      d.drive_date ?? "",
      d.total_registered,
      d.total_selected,
      d.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map(String).map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `placement_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    document.title = `Placify Placement Report ${new Date().toISOString().slice(0, 10)}`;
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Placement Cell</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Placement Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Season-wide drive summary · NAAC & NIRF ready</p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button onClick={exportPdf} size="sm" className="gap-2">
            <FileText className="h-3.5 w-3.5" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Companies Visited", value: companies, icon: Building2, color: "text-primary" },
          { label: "Students Registered", value: totalRegistered, icon: GraduationCap, color: "text-info" },
          { label: "Students Placed", value: totalPlaced, icon: Trophy, color: "text-success" },
          { label: "Avg Package", value: avgCTC ? `₹${avgCTC} LPA` : "—", icon: TrendingUp, color: "text-warning" },
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

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by company or role…"
          className="w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-[14px] outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Drives Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-[14px] font-semibold">Drive-wise Report</h2>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            {filtered.length} drives
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-sm text-muted-foreground">
            <Building2 className="mb-3 h-8 w-8 opacity-40" />
            {drives.length === 0 ? "No drives found. Approve some drive requests first." : "No drives match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-elevated/50">
                  {["Company", "Role", "Date", "Package", "Registered", "Selected", "Rate", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((d) => {
                  const rate = d.total_registered > 0
                    ? Math.round((d.total_selected / d.total_registered) * 100)
                    : 0;
                  return (
                    <tr key={d.id} className="hover:bg-elevated/40 transition-colors">
                      <td className="px-4 py-3 font-medium">{d.company_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.role || d.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {d.drive_date ? new Date(d.drive_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {d.package_lpa ? <span className="font-semibold text-success">₹{d.package_lpa} LPA</span> : "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{d.total_registered}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold">{d.total_selected}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-elevated">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="tabular-nums text-muted-foreground">{rate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                          d.status === "completed" ? "bg-success/12 text-success"
                          : d.status === "active" ? "bg-primary/12 text-primary"
                          : d.status === "upcoming" ? "bg-info/12 text-info"
                          : "bg-muted text-muted-foreground"
                        )}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Season Summary */}
      {drives.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-[14px] font-semibold">Season Summary</h2>
          <div className="grid gap-2 text-[13px] md:grid-cols-2">
            <div className="flex justify-between rounded-lg bg-elevated/50 px-4 py-2">
              <span className="text-muted-foreground">Total Drives</span>
              <span className="font-semibold">{drives.length}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-elevated/50 px-4 py-2">
              <span className="text-muted-foreground">Completion Rate (drives)</span>
              <span className="font-semibold">{Math.round(drives.filter(d => d.status === "completed").length / drives.length * 100)}%</span>
            </div>
            <div className="flex justify-between rounded-lg bg-elevated/50 px-4 py-2">
              <span className="text-muted-foreground">Highest Package</span>
              <span className="font-semibold text-success">
                {drives.some(d => d.package_lpa) ? `₹${Math.max(...drives.map(d => d.package_lpa || 0))} LPA` : "—"}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-elevated/50 px-4 py-2">
              <span className="text-muted-foreground">Overall Selection Rate</span>
              <span className="font-semibold">
                {totalRegistered > 0 ? `${Math.round(totalPlaced / totalRegistered * 100)}%` : "—"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
