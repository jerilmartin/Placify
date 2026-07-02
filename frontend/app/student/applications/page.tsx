"use client";

import { useState, useEffect } from "react";
import { applicationsApi } from "@/lib/api";
import { ClipboardList, Loader2 } from "lucide-react";
import type { Application } from "@/lib/types";
import { getStatusColor, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { isDemoMode, MOCK_APPLICATIONS } from "@/lib/mock-data";

const STATUS_ORDER = ["submitted","reviewed","shortlisted","interviewed","offered","accepted","rejected","withdrawn"];

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (isDemoMode()) {
      setApps(MOCK_APPLICATIONS);
      setLoading(false);
      return;
    }
    applicationsApi.myApplications()
      .then(r => setApps(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCounts = apps.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><ClipboardList className="w-4 h-4" /> Applications</div>
        <h1 className="text-2xl font-bold text-white">My Applications</h1>
        <p className="text-slate-500 text-sm mt-1">Track every application from submission to offer.</p>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilter("all")}
          className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
            filter === "all" ? "bg-purple-600 text-white border-transparent" : "border-white/10 text-slate-400 hover:text-white")}>
          All ({apps.length})
        </button>
        {STATUS_ORDER.filter(s => statCounts[s]).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all border capitalize",
              filter === s ? "bg-purple-600 text-white border-transparent" : "border-white/10 text-slate-400 hover:text-white")}>
            {s} ({statCounts[s]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-purple-400 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass p-12 text-center text-slate-500">
          <ClipboardList className="w-8 h-8 mx-auto mb-3 text-slate-600" />
          <p>No applications yet. Start applying to jobs!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <div key={app.id} className="glass p-4 border border-white/5 hover:border-white/10 card-hover">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{(app.jobs as { title?: string })?.title ?? "Position"}</h3>
                  <p className="text-sm text-slate-400">{(app.jobs as { company?: string })?.company ?? "Company"}</p>
                  <p className="text-xs text-slate-600 mt-1">Applied {formatDate(app.applied_at)}</p>
                </div>
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium capitalize", getStatusColor(app.status))}>
                  {app.status}
                </span>
              </div>
              {app.next_step && (
                <div className="mt-3 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                  📅 Next: {app.next_step} {app.next_step_date && `· ${formatDate(app.next_step_date)}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
