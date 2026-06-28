"use client";

import { useState, useEffect } from "react";
import { jobsApi, applicationsApi } from "@/lib/api";
import { toast } from "sonner";
import { Briefcase, MapPin, Clock, TrendingUp, CheckCircle, Loader2, Search, Filter } from "lucide-react";
import type { JobMatch, Job } from "@/lib/types";
import { cn, formatPackage, getMatchScoreColor } from "@/lib/utils";

function JobCard({ match, onApply }: { match: JobMatch; onApply: (jobId: string) => void }) {
  const job = match.job;
  return (
    <div className="glass p-5 card-hover border border-white/5 hover:border-white/10">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-white">{job.title}</h3>
          <p className="text-sm text-slate-400">{job.company}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={cn("text-2xl font-extrabold", getMatchScoreColor(match.match_score))}>
            {match.match_score}%
          </div>
          <div className="text-xs text-slate-500">match</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-400 mb-3">
        {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
        {job.package_lpa && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{formatPackage(job.package_lpa)}</span>}
        {job.job_type && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.job_type.replace("_", " ")}</span>}
      </div>

      {/* Match bar */}
      <div className="mb-3">
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${match.match_score}%`,
              background: match.match_score >= 80 ? "linear-gradient(to right, #10b981, #34d399)"
                : match.match_score >= 60 ? "linear-gradient(to right, #3b82f6, #60a5fa)"
                : "linear-gradient(to right, #f59e0b, #fbbf24)"
            }} />
        </div>
      </div>

      {/* Skills */}
      {match.skill_matches.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {match.skill_matches.slice(0, 4).map(s => (
            <span key={s} className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle className="w-2.5 h-2.5" />{s}
            </span>
          ))}
          {match.missing_skills.slice(0, 2).map(s => (
            <span key={s} className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs border border-red-500/15">
              -{s}
            </span>
          ))}
        </div>
      )}

      <button onClick={() => onApply(job.id)}
        className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium hover:opacity-90 transition-all">
        Apply Now
      </button>
    </div>
  );
}

export default function JobsPage() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"matches" | "all">("matches");
  const [search, setSearch] = useState("");
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mRes, jRes] = await Promise.allSettled([jobsApi.getMatches(), jobsApi.list()]);
        if (mRes.status === "fulfilled") setMatches(mRes.value.data);
        if (jRes.status === "fulfilled") setAllJobs(jRes.value.data);
      } catch {} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleApply = async (jobId: string) => {
    setApplying(jobId);
    try {
      await applicationsApi.apply(jobId);
      toast.success("Applied successfully! 🎉");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Application failed";
      toast.error(msg);
    } finally { setApplying(null); }
  };

  const filteredMatches = matches.filter(m =>
    !search || m.job.title.toLowerCase().includes(search.toLowerCase()) ||
    m.job.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><Briefcase className="w-4 h-4" /> Jobs</div>
        <h1 className="text-2xl font-bold text-white">Job Matches</h1>
        <p className="text-slate-500 text-sm mt-1">AI-powered job recommendations based on your profile.</p>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex rounded-lg border border-white/10 p-0.5">
          {(["matches", "all"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
                tab === t ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white")}>
              {t === "matches" ? "🎯 AI Matches" : "💼 All Jobs"}
            </button>
          ))}
        </div>
        <div className="flex-1 relative min-w-40">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…"
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 text-purple-400 animate-spin" /></div>
      ) : tab === "matches" ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMatches.length === 0
            ? <div className="col-span-3 text-center py-12 text-slate-500">No matches yet. Complete your profile to get personalized recommendations!</div>
            : filteredMatches.map(m => <JobCard key={m.id} match={m} onApply={handleApply} />)
          }
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {allJobs.filter(j => !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase()))
            .map(job => (
              <div key={job.id} className="glass p-5 card-hover border border-white/5">
                <h3 className="font-semibold text-white">{job.title}</h3>
                <p className="text-sm text-slate-400 mb-2">{job.company}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {job.skills_required.slice(0, 4).map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-xs border border-white/10">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-medium">{formatPackage(job.package_lpa)}</span>
                  <button onClick={() => handleApply(job.id)} disabled={applying === job.id}
                    className="px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 text-xs font-medium border border-purple-500/20 hover:bg-purple-600/30 transition-all disabled:opacity-60">
                    {applying === job.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Apply"}
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
