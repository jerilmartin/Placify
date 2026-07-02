"use client";

import { useEffect, useState } from "react";
import { universitiesApi } from "@/lib/api";
import { LayoutDashboard, CalendarDays, Users, TrendingUp, Loader2, PlusCircle } from "lucide-react";
import Link from "next/link";
import { formatDate, formatPackage, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PlacementDrive } from "@/lib/types";
import { isDemoMode, MOCK_PLACEMENT_DRIVES, MOCK_UNIVERSITY_ANALYTICS } from "@/lib/mock-data";

export default function UniversityDashboard() {
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setDrives(MOCK_PLACEMENT_DRIVES);
      setAnalytics(MOCK_UNIVERSITY_ANALYTICS);
      setLoading(false);
      return;
    }
    Promise.allSettled([universitiesApi.listDrives(), universitiesApi.getAnalytics()])
      .then(([d, a]) => {
        if (d.status === "fulfilled") setDrives(d.value.data);
        if (a.status === "fulfilled") setAnalytics(a.value.data);
      }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><LayoutDashboard className="w-4 h-4" /> Dashboard</div>
        <h1 className="text-2xl font-bold text-white">University Placement Hub</h1>
        <p className="text-slate-500 text-sm mt-1">Manage placement drives, eligibility, and track placement analytics.</p>
      </div>

      {/* Analytics cards */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Drives", value: String(analytics.total_drives ?? 0), icon: CalendarDays, color: "bg-emerald-500/20 text-emerald-400" },
            { label: "Students Placed", value: String(analytics.total_placed ?? 0), icon: Users, color: "bg-blue-500/20 text-blue-400" },
            { label: "Placement Rate", value: `${String(analytics.placement_rate ?? 0)}%`, icon: TrendingUp, color: "bg-purple-500/20 text-purple-400" },
            { label: "Avg Package", value: `₹${String(analytics.average_package_lpa ?? 0)}L`, icon: TrendingUp, color: "bg-amber-500/20 text-amber-400" },
          ].map(s => (
            <div key={s.label} className="glass p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">{s.label}</span>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", s.color)}><s.icon className="w-3.5 h-3.5" /></div>
              </div>
              <div className="text-3xl font-bold text-white">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Drives */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-400">Placement Drives</h2>
        <Link href="/university/drives" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 text-xs border border-emerald-500/20 hover:bg-emerald-600/30 transition-all">
          <PlusCircle className="w-3 h-3" /> New Drive
        </Link>
      </div>

      {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div> : (
        <div className="space-y-2">
          {drives.map(d => (
            <div key={d.id} className="glass p-4 border border-white/5 flex items-center justify-between">
              <div>
                <div className="font-medium text-white text-sm">{d.title}</div>
                <div className="text-xs text-slate-500">
                  {d.company_name} · {formatPackage(d.package_lpa)} · {d.drive_date ? formatDate(d.drive_date) : "TBD"}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{d.total_registered} registered · {d.total_selected} selected</div>
              </div>
              <span className={cn("px-2.5 py-1 rounded-full text-xs capitalize", getStatusColor(d.status))}>{d.status}</span>
            </div>
          ))}
          {drives.length === 0 && <div className="glass p-8 text-center text-slate-500 text-sm">No drives yet. <Link href="/university/drives" className="text-emerald-400 hover:text-emerald-300">Create your first drive →</Link></div>}
        </div>
      )}
    </div>
  );
}
