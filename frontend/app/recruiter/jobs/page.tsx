"use client";

import { useEffect, useState } from "react";
import { jobsApi, applicationsApi } from "@/lib/api";
import { Briefcase, Calendar, MapPin, DollarSign, Users, Award, Trash2, XCircle, Plus, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Job } from "@/lib/types";
import { formatDate, formatPackage, getStatusColor } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isDemoMode, MOCK_JOBS } from "@/lib/mock-data";

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});

  const fetchJobs = async () => {
    setLoading(true);
    if (isDemoMode()) {
      setJobs(MOCK_JOBS);
      const counts: Record<string, number> = {};
      MOCK_JOBS.forEach((j, i) => { counts[j.id] = [45, 12, 28, 67, 8, 15, 22, 34][i] || 0; });
      setApplicantCounts(counts);
      setLoading(false);
      return;
    }
    try {
      const res = await jobsApi.list();
      const jobsList = res.data || [];
      setJobs(jobsList);
      const counts: Record<string, number> = {};
      await Promise.all(
        jobsList.map(async (job: Job) => {
          try {
            const appRes = await applicationsApi.forJob(job.id);
            counts[job.id] = Array.isArray(appRes.data) ? appRes.data.length : 0;
          } catch {
            counts[job.id] = 0;
          }
        })
      );
      setApplicantCounts(counts);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCloseJob = async (jobId: string) => {
    try {
      await jobsApi.update(jobId, { status: "closed" });
      toast.success("Job closed successfully");
      fetchJobs();
    } catch {
      toast.error("Failed to close job");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job listing? This action cannot be undone.")) return;
    try {
      await jobsApi.delete(jobId);
      toast.success("Job listing deleted");
      fetchJobs();
    } catch {
      toast.error("Failed to delete job");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><Briefcase className="w-4 h-4" /> Management</div>
          <h1 className="text-2xl font-bold text-white">My Job Postings</h1>
          <p className="text-slate-500 text-sm mt-1">Create, manage, and close your active placement drive job posts.</p>
        </div>
        <Link
          href="/recruiter/post-job"
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium text-sm hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Post a Job
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <span className="text-slate-500 text-sm">Loading your postings...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="glass p-5 border border-white/5 flex flex-col justify-between card-hover relative overflow-hidden">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold", getStatusColor(job.status))}>
                        {job.status}
                      </span>
                      <h3 className="font-semibold text-white mt-1.5 text-lg truncate">{job.title}</h3>
                      <p className="text-xs text-slate-400">{job.company}</p>
                    </div>
                    {job.package_lpa && (
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Package</span>
                        <span className="font-bold text-white text-sm">{formatPackage(job.package_lpa)}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-4 text-xs text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span className="truncate">{job.location || "Remote"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{job.job_type ? job.job_type.replace("_", " ") : "Full Time"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>Applicants: <b className="text-white">{applicantCounts[job.id] ?? 0}</b></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>Deadline: <b className="text-white">{job.deadline ? formatDate(job.deadline) : "Open"}</b></span>
                    </div>
                  </div>

                  {job.skills_required && job.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.skills_required.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 text-[10px] font-medium border border-blue-500/20"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/5 mt-auto">
                  <Link
                    href={`/recruiter/candidates?job_id=${job.id}`}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 text-center text-xs text-blue-300 font-semibold border border-blue-500/20 transition-all flex items-center justify-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" /> View Matches
                  </Link>

                  {job.status === "active" && (
                    <button
                      onClick={() => handleCloseJob(job.id)}
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all"
                      title="Close Job Posting"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                    title="Delete Job Posting"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {jobs.length === 0 && (
            <div className="glass p-12 text-center text-slate-500 text-sm">
              You haven't posted any jobs yet.{" "}
              <Link href="/recruiter/post-job" className="text-blue-400 hover:text-blue-300 font-medium">
                Post your first job listing now →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
