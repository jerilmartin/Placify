"use client";

import { useEffect, useState } from "react";
import { jobsApi, applicationsApi } from "@/lib/api";
import { LayoutDashboard, Briefcase, Users, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Job } from "@/lib/types";
import { formatDate, formatPackage, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { isDemoMode, MOCK_JOBS } from "@/lib/mock-data";

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setJobs(MOCK_JOBS);
      setLoading(false);
      return;
    }
    jobsApi.list().then(r => setJobs(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeJobs = jobs.filter(j => j.status === "active");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><LayoutDashboard className="w-4 h-4" /> Dashboard</div>
        <h1 className="text-2xl font-bold text-white">Recruiter Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Manage jobs, review candidates, and track applications.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Active Jobs", value: activeJobs.length, icon: Briefcase, color: "bg-blue-500/20 text-blue-400" },
          { label: "Total Jobs", value: jobs.length, icon: TrendingUp, color: "bg-purple-500/20 text-purple-400" },
          { label: "Candidates", value: "—", icon: Users, color: "bg-emerald-500/20 text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="glass p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">{s.label}</span>
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", s.color)}>
                <s.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Link href="/recruiter/post-job" className="glass p-5 card-hover border border-white/5 hover:border-blue-500/30 text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-3"><Briefcase className="w-5 h-5 text-blue-400" /></div>
          <div className="font-medium text-white">Post a New Job</div>
          <div className="text-xs text-slate-500 mt-1">Create a job listing instantly</div>
        </Link>
        <Link href="/recruiter/candidates" className="glass p-5 card-hover border border-white/5 hover:border-purple-500/30 text-center">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3"><Users className="w-5 h-5 text-purple-400" /></div>
          <div className="font-medium text-white">Browse Candidates</div>
          <div className="text-xs text-slate-500 mt-1">AI-sorted candidate list</div>
        </Link>
      </div>

      {/* Jobs list */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>
      ) : (
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-3">Recent Job Postings</h2>
          <div className="space-y-2">
            {jobs.slice(0, 8).map(job => (
              <div key={job.id} className="glass p-4 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-medium text-white text-sm">{job.title}</div>
                  <div className="text-xs text-slate-500">{job.location} · {formatPackage(job.package_lpa)} · {formatDate(job.created_at)}</div>
                </div>
                <span className={cn("px-2.5 py-1 rounded-full text-xs capitalize", getStatusColor(job.status))}>{job.status}</span>
              </div>
            ))}
            {jobs.length === 0 && <div className="glass p-8 text-center text-slate-500 text-sm">No jobs posted yet. <Link href="/recruiter/post-job" className="text-blue-400 hover:text-blue-300">Post your first job →</Link></div>}
          </div>
        </div>
      )}
    </div>
  );
}
