"use client";

import { useEffect, useState } from "react";
import { Loader2, Download, FileText, Building2, GraduationCap, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { universitiesApi } from "@/lib/api";
import { isDriveRegistrationClosed } from "@/lib/drive-status";
import { cn } from "@/lib/utils";

interface DriveReport {
  id: string;
  company_name: string;
  role: string | null;
  title: string;
  package_lpa: number | null;
  drive_date: string | null;
  registration_deadline?: string | null;
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
  const [loadError, setLoadError] = useState("");
  const [uniqueCounts, setUniqueCounts] = useState({ registered: 0, selected: 0 });
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await universitiesApi.getAnalytics();
        setDrives(((data.drives || []) as DriveReport[]).sort((a, b) => (b.drive_date || "").localeCompare(a.drive_date || "")));
        setUniqueCounts({ registered: data.total_registered || 0, selected: data.total_placed || 0 });
      } catch (error) {
        console.error("Failed to load placement report:", error);
        setLoadError("Could not load verified placement data. Please refresh or check the backend connection.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = drives.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.company_name?.toLowerCase().includes(q) || (d.role || d.title || "").toLowerCase().includes(q);
  });

  const totalPlaced = uniqueCounts.selected;
  const totalRegistered = uniqueCounts.registered;
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
      isDriveRegistrationClosed(d) ? "Applications closed" : d.status,
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
  if (loadError) {
    return <div className="mx-auto max-w-[1400px] px-4 py-8 text-sm text-destructive">{loadError}</div>;
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Placement Cell · Records</div>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground">Placement Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">All drives · counts verified from saved applications</p>
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
          { label: "Companies Visited", value: companies, icon: Building2, color: "text-[#0A192F]" },
          { label: "Students Registered", value: totalRegistered, icon: GraduationCap, color: "text-[#800020]" },
          { label: "Drive Selections", value: totalPlaced, icon: Trophy, color: "text-[#D4AF37]" },
          { label: "Avg Advertised Package", value: avgCTC ? `₹${avgCTC} LPA` : "—", icon: TrendingUp, color: "text-foreground" },
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

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by company or role…"
          className="w-full max-w-sm rounded-md border border-input bg-card px-3 py-2 text-[14px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-sharp transition-colors placeholder:text-muted-foreground"
        />
      </div>

      {/* Drives Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sharp">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3.5">
          <h2 className="font-serif text-base font-semibold text-foreground">Drive-wise Report</h2>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            {filtered.length} drives
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-sm text-muted-foreground p-8">
            <Building2 className="mb-3 h-8 w-8 opacity-40 text-muted-foreground" />
            {drives.length === 0 ? "No drives found. Approve some drive requests first." : "No drives match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  {["Company", "Role", "Date", "Package", "Registered", "Selected", "Rate", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((d) => {
                  const rate = d.total_registered > 0
                    ? Math.round((d.total_selected / d.total_registered) * 100)
                    : 0;
                  return (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 font-serif font-semibold text-foreground">{d.company_name}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{d.role || d.title}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {d.drive_date ? new Date(d.drive_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        {d.package_lpa ? <span className="font-semibold text-[#D4AF37]">₹{d.package_lpa} LPA</span> : "—"}
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-muted-foreground">{d.total_registered}</td>
                      <td className="px-4 py-3.5 tabular-nums font-semibold text-foreground">{d.total_selected}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-[#800020]" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="tabular-nums text-muted-foreground text-xs">{rate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize",
                          isDriveRegistrationClosed(d) ? "bg-muted text-muted-foreground border-border"
                          : d.status === "completed" ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : d.status === "active" ? "bg-[#0A192F]/10 text-[#0A192F] border-[#0A192F]/20"
                          : d.status === "upcoming" ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-muted text-muted-foreground border-border"
                        )}>
                          {isDriveRegistrationClosed(d) ? "Applications closed" : d.status}
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
        <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sharp">
          <h2 className="mb-4 font-serif text-base font-semibold text-foreground">All-time Summary</h2>
          <div className="grid gap-2 text-[13px] md:grid-cols-2">
            <div className="flex justify-between rounded-lg border border-border bg-muted/30 px-4 py-2.5">
              <span className="text-muted-foreground">Total Drives</span>
              <span className="font-semibold text-foreground">{drives.length}</span>
            </div>
            <div className="flex justify-between rounded-lg border border-border bg-muted/30 px-4 py-2.5">
              <span className="text-muted-foreground">Completion Rate (drives)</span>
              <span className="font-semibold text-foreground">{Math.round(drives.filter(d => d.status === "completed").length / drives.length * 100)}%</span>
            </div>
            <div className="flex justify-between rounded-lg border border-border bg-muted/30 px-4 py-2.5">
              <span className="text-muted-foreground">Highest Package</span>
              <span className="font-semibold text-[#D4AF37]">
                {drives.some(d => d.package_lpa) ? `₹${Math.max(...drives.map(d => d.package_lpa || 0))} LPA` : "—"}
              </span>
            </div>
            <div className="flex justify-between rounded-lg border border-border bg-muted/30 px-4 py-2.5">
              <span className="text-muted-foreground">Overall Selection Rate</span>
              <span className="font-semibold text-foreground">
                {totalRegistered > 0 ? `${Math.round(totalPlaced / totalRegistered * 100)}%` : "—"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
