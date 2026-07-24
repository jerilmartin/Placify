"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, UserRoundSearch } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applicationsApi, recruitersApi } from "@/lib/api";
import type { ApplicationStatus, CandidateApplication, Job } from "@/lib/types";

const PIPELINE: ApplicationStatus[] = [
  "submitted", "reviewed", "shortlisted", "interviewed", "offered", "accepted", "rejected",
];

export default function RecruiterCandidatesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState("");
  const [candidates, setCandidates] = useState<CandidateApplication[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    recruitersApi.getJobs()
      .then(({ data }) => {
        const items = data as Job[];
        setJobs(items);
        const requested = new URLSearchParams(window.location.search).get("job");
        setJobId(requested && items.some((job) => job.id === requested) ? requested : items[0]?.id || "");
      })
      .catch(() => toast.error("Could not load recruiter jobs"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!jobId) return;
    recruitersApi.getCandidates(jobId)
      .then(({ data }) => setCandidates(data))
      .catch(() => toast.error("Could not load candidates for this job"))
      .finally(() => setLoading(false));
  }, [jobId]);

  const updateCandidate = async (
    candidate: CandidateApplication,
    status: ApplicationStatus,
    extra: Record<string, unknown> = {},
  ) => {
    setUpdating(candidate.id);
    try {
      await applicationsApi.updateStatus(candidate.id, { status, ...extra });
      setCandidates((items) => items.map((item) => item.id === candidate.id ? { ...item, status, ...extra } : item));
      toast.success(`Candidate moved to ${status}`);
    } catch {
      toast.error("Could not update candidate");
    } finally {
      setUpdating(null);
    }
  };

  const visible = candidates.filter((candidate) => {
    const student = candidate.student_profiles;
    const haystack = `${student?.full_name} ${student?.email} ${student?.university} ${(student?.skills || []).join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Recruiter · Candidates</div>
        <h1 className="mt-1 text-2xl font-semibold">Candidate pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">Applicants are isolated to jobs owned by your recruiter account.</p>
      </div>

      <div className="mb-5 grid gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-[280px_1fr]">
        <select value={jobId} onChange={(event) => setJobId(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
          {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, university, email, or skill" className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">Post a job before reviewing candidates.</div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <UserRoundSearch className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No matching applicants for this job yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((candidate) => {
            const student = candidate.student_profiles;
            return (
              <article key={candidate.id} className="rounded-xl border border-border bg-surface p-5">
                <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{student?.full_name || "Unnamed student"}</h2>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{candidate.match_score}% match</span>
                      <span className="rounded-full bg-elevated px-2 py-0.5 text-xs capitalize">{candidate.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{student?.course || "Course not provided"} · {student?.university || "University not provided"} · CGPA {student?.cgpa ?? "—"}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(student?.skills || []).map((skill) => (
                        <span key={skill} className={candidate.skill_matches?.some((match) => match.toLowerCase() === skill.toLowerCase()) ? "rounded bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300" : "rounded bg-elevated px-2 py-1 text-xs"}>{skill}</span>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-3 text-xs">
                      {student?.email && <a className="text-primary hover:underline" href={`mailto:${student.email}`}>{student.email}</a>}
                      {student?.linkedin_url && <a className="text-primary hover:underline" href={student.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>}
                      {student?.portfolio_url && <a className="text-primary hover:underline" href={student.portfolio_url} target="_blank" rel="noreferrer">Portfolio</a>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Pipeline stage</label>
                    <select
                      value={candidate.status}
                      disabled={updating === candidate.id}
                      onChange={(event) => updateCandidate(candidate, event.target.value as ApplicationStatus)}
                      className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm capitalize"
                    >
                      {PIPELINE.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <label className="block pt-1 text-xs text-muted-foreground">Interview / next-step date</label>
                    <Input
                      type="date"
                      value={candidate.next_step_date || ""}
                      onChange={(event) => updateCandidate(candidate, "interviewed", {
                        next_step: "Recruiter interview",
                        next_step_date: event.target.value,
                      })}
                    />
                    <Button className="w-full" size="sm" disabled={updating === candidate.id} onClick={() => updateCandidate(candidate, "shortlisted")}>Shortlist</Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
