"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, Loader2, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { jobsApi, recruitersApi } from "@/lib/api";
import type { Job } from "@/lib/types";

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState<string | null>(null);

  const load = () => recruitersApi.getJobs()
    .then(({ data }) => setJobs(data))
    .catch(() => toast.error("Could not load your jobs"))
    .finally(() => setLoading(false));

  useEffect(() => { void load(); }, []);

  const changeStatus = async (job: Job, status: Job["status"]) => {
    setChanging(job.id);
    try {
      await jobsApi.update(job.id, { status });
      setJobs((items) => items.map((item) => item.id === job.id ? { ...item, status } : item));
      toast.success(status === "closed" ? "Job closed" : "Job published");
    } catch {
      toast.error("Could not update this job");
    } finally {
      setChanging(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recruiter · Jobs</div>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground">Open Roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">Publish direct-hiring roles and review each applicant pipeline.</p>
        </div>
        <Button asChild><Link href="/recruiter/post-job">Post a job</Link></Button>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#800020]" /></div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-sharp">
          <BriefcaseBusiness className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-serif text-lg font-bold text-foreground">No jobs yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Once your company is verified, publish your first role.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-xl border border-border bg-card p-5 shadow-sharp hover:border-[#D4AF37]/40 transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-lg font-bold text-foreground">{job.title}</h2>
                    <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] capitalize text-foreground font-medium">{job.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location || "Location flexible"}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{job.no_of_openings || 1} opening(s)</span>
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{job.deadline || "No deadline"}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(job.skills_required || []).map((skill) => <span key={skill} className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground font-medium">{skill}</span>)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline"><Link href={`/recruiter/candidates?job=${job.id}`}>Candidates</Link></Button>
                  {job.status === "active" ? (
                    <Button size="sm" variant="ghost" disabled={changing === job.id} onClick={() => changeStatus(job, "closed")}>Close</Button>
                  ) : (
                    <Button size="sm" variant="ghost" disabled={changing === job.id} onClick={() => changeStatus(job, "active")}>Publish</Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
