"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { recruitersApi } from "@/lib/api";
import type { CandidateApplication, Job } from "@/lib/types";

export default function RecruiterInterviewsPage() {
  const [interviews, setInterviews] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recruitersApi.getJobs()
      .then(async ({ data }) => {
        const jobs = data as Job[];
        const responses = await Promise.all(jobs.map((job) => recruitersApi.getCandidates({ job_id: job.id })));
        const scheduled = responses.flatMap((response) => response.data as CandidateApplication[])
          .filter((candidate) => candidate.next_step_date)
          .sort((a, b) => String(a.next_step_date).localeCompare(String(b.next_step_date)));
        setInterviews(scheduled);
      })
      .catch(() => toast.error("Could not load interview schedule"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-6"><div className="text-xs uppercase tracking-widest text-muted-foreground">Recruiter</div><h1 className="mt-1 text-2xl font-semibold">Interview schedule</h1><p className="mt-1 text-sm text-muted-foreground">Dates assigned from the candidate pipeline appear here.</p></div>
      {loading ? <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : interviews.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center"><CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">No interviews have been scheduled.</p></div>
      ) : <div className="space-y-3">
        {interviews.map((interview) => <article key={interview.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5">
          <div><h2 className="font-medium">{interview.student_profiles?.full_name || "Student"}</h2><p className="mt-1 text-xs text-muted-foreground">{interview.job?.title || "Role"} · {interview.student_profiles?.university || "University not provided"}</p></div>
          <div className="text-right"><div className="font-medium">{interview.next_step_date}</div><div className="text-xs text-muted-foreground">{interview.next_step || "Recruiter interview"}</div></div>
        </article>)}
      </div>}
    </div>
  );
}
