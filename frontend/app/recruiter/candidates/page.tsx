"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, GraduationCap, Loader2, Percent, Search, Sparkles, UserRoundSearch } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScheduleInterviewDialog } from "@/components/schedule-interview-dialog";
import { applicationsApi, interviewAppointmentsApi, recruitersApi } from "@/lib/api";
import type { ApplicationStatus, CandidateApplication, InterviewAppointment } from "@/lib/types";

const PIPELINE: ApplicationStatus[] = [
  "submitted", "reviewed", "shortlisted", "interviewed", "offered", "accepted", "rejected",
];
const DRIVE_PIPELINE = ["registered", "eligible", "shortlisted", "interviewed", "selected", "rejected"] as const;
type CandidateStatus = ApplicationStatus | (typeof DRIVE_PIPELINE)[number];
type Candidate = Omit<CandidateApplication, "status"> & { status: CandidateStatus; source_type?: "drive" };
type CandidateSource = { id: string; title: string; company: string; status?: string; kind: "job" | "drive" };
type SearchStudent = { id: string; cgpa?: number | null; skills?: string[]; created_at?: string; full_name?: string; email?: string; university?: string };

export default function RecruiterCandidatesPage() {
  const [sources, setSources] = useState<CandidateSource[]>([]);
  const [sourceKey, setSourceKey] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [query, setQuery] = useState("");
  const [minCgpa, setMinCgpa] = useState("");
  const [minScore, setMinScore] = useState("");
  const [aiResults, setAiResults] = useState<Candidate[] | null>(null);
  const [aiSearching, setAiSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [scheduledIds, setScheduledIds] = useState<Set<string>>(new Set());
  const [scheduleCandidate, setScheduleCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    interviewAppointmentsApi.forRecruiter()
      .then(({ data }) => setScheduledIds(new Set((data as InterviewAppointment[]).filter((item) => item.status === "scheduled").map((item) => item.job_application_id || item.drive_application_id || ""))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    recruitersApi.getCandidateSources()
      .then(({ data }) => {
        const items: CandidateSource[] = [
          ...(data.jobs || []).map((job: Omit<CandidateSource, "kind">) => ({ ...job, kind: "job" as const })),
          ...(data.drives || []).map((drive: Omit<CandidateSource, "kind">) => ({ ...drive, kind: "drive" as const })),
        ];
        setSources(items);
        const requested = new URLSearchParams(window.location.search).get("job");
        const preferred = requested ? items.find((item) => item.kind === "job" && item.id === requested) : undefined;
        setSourceKey(preferred ? `job:${preferred.id}` : items[0] ? `${items[0].kind}:${items[0].id}` : "");
      })
      .catch(() => toast.error("Could not load hiring sources"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!sourceKey) return;
    const [kind, id] = sourceKey.split(":") as ["job" | "drive", string];
    recruitersApi.getCandidates(kind === "job" ? { job_id: id } : { drive_id: id })
      .then(({ data }) => setCandidates(data as Candidate[]))
      .catch(() => toast.error("Could not load applicants for this hiring source"))
      .finally(() => setLoading(false));
  }, [sourceKey]);


  const runAiSearch = async () => {
    if (!query.trim()) {
      setAiResults(null);
      return;
    }
    setAiSearching(true);
    try {
      const { data } = await recruitersApi.aiSearch(query);
      const studentsList = data.students || [];
      const mapped: Candidate[] = studentsList.map((student: SearchStudent) => {
        const existing = candidates.find((c) => c.student_profiles?.id === student.id);
        if (existing) return existing;
        return {
          id: student.id,
          status: "shortlisted" as const,
          source_type: "drive" as const,
          match_score: student.cgpa ? Math.min(100, Math.round(student.cgpa * 10)) : 80,
          match_reason: "Matches search criteria",
          student_profiles: student,
          skill_matches: student.skills || [],
          missing_skills: [],
          created_at: student.created_at || new Date().toISOString(),
        } as unknown as Candidate;
      });
      setAiResults(mapped);
      toast.success(`AI found ${mapped.length} matching candidate${mapped.length !== 1 ? "s" : ""}`);
    } catch {
      toast.error("AI search failed — ensure your recruiter profile is verified");
    } finally {
      setAiSearching(false);
    }
  };

  const updateCandidate = async (
    candidate: Candidate,
    status: CandidateStatus,
    extra: Record<string, unknown> = {},
  ) => {
    setUpdating(candidate.id);
    try {
      if (candidate.source_type === "drive") {
        await recruitersApi.updateDriveApplication(candidate.id, status);
      } else {
        await applicationsApi.updateStatus(candidate.id, { status: status as ApplicationStatus, ...extra });
      }
      setCandidates((items) => items.map((item) => item.id === candidate.id ? { ...item, status, ...extra } : item));
      toast.success(`Candidate moved to ${status}`);
    } catch {
      toast.error("Could not update candidate");
    } finally {
      setUpdating(null);
    }
  };

  // If AI search returned results, show those; otherwise fall back to client-side filter on job candidates
  const visible = (aiResults ?? candidates).filter((candidate) => {
    if (!query) return true;
    const student = candidate.student_profiles;
    const haystack = `${student?.full_name} ${student?.email} ${student?.university} ${(student?.skills || []).join(" ")}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) || aiResults !== null;
  }).filter((candidate) => {
    const cgpa = candidate.student_profiles?.cgpa ?? 0;
    const score = candidate.match_score ?? 0;
    return (!minCgpa || cgpa >= Number(minCgpa)) && (!minScore || score >= Number(minScore));
  });

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8">
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recruiter · Candidates</div>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground">Candidate Pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review direct-job applicants and applications to your approved campus drives.</p>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sharp">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[240px_1fr_120px_130px_auto] items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Hiring Source</label>
            <select
              value={sourceKey}
              onChange={(event) => { setSourceKey(event.target.value); setAiResults(null); setQuery(""); }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {sources.map((source) => (
                <option key={`${source.kind}:${source.id}`} value={`${source.kind}:${source.id}`}>
                  {source.kind === "drive" ? "Campus drive · " : "Direct job · "}{source.title} — {source.company}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#D4AF37]" />
              AI Natural Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => { setQuery(event.target.value); if (!event.target.value) setAiResults(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") runAiSearch(); }}
                placeholder="e.g. React devs with CGPA > 8.0"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <GraduationCap className="h-3 w-3 text-muted-foreground" />
              Min CGPA
            </label>
            <Input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={minCgpa}
              onChange={(event) => setMinCgpa(event.target.value)}
              placeholder="e.g. 7.5"
            />
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-muted-foreground flex items-center gap-1"
              title="Filters candidates by AI Resume-to-Job compatibility match score (0-100%)"
            >
              <Percent className="h-3 w-3 text-muted-foreground" />
              Min Match %
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={minScore}
              onChange={(event) => setMinScore(event.target.value)}
              placeholder="e.g. 70"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-transparent select-none hidden lg:block">Action</label>
            <Button
              onClick={runAiSearch}
              disabled={aiSearching || !query.trim()}
              size="default"
              className="gap-2 w-full lg:w-auto h-10"
            >
              {aiSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRoundSearch className="h-4 w-4" />}
              Smart search
            </Button>
          </div>
        </div>

        {(minCgpa || minScore) && (
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
            <span>Active score filters:</span>
            {minCgpa && <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-foreground font-medium">CGPA ≥ {minCgpa}</span>}
            {minScore && <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-foreground font-medium">AI Match ≥ {minScore}%</span>}
            <button
              type="button"
              onClick={() => { setMinCgpa(""); setMinScore(""); }}
              className="text-[#800020] font-medium hover:underline ml-1"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {aiResults !== null && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-4 py-3 text-sm text-foreground shadow-sharp">
          <UserRoundSearch className="h-4 w-4 text-[#800020]" />
          <span>Showing <strong>{aiResults.length}</strong> matching applicants for: <em>&ldquo;{query}&rdquo;</em></span>
          <button className="ml-auto text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => { setAiResults(null); setQuery(""); }}>
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#800020]" /></div>
      ) : sources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground shadow-sharp">Post a direct job or submit a campus-drive request before reviewing applicants.</div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-sharp">
          <UserRoundSearch className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No matching applicants for this job yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((candidate) => {
            const student = candidate.student_profiles;
            return (
              <article key={candidate.id} className="rounded-xl border border-border bg-card p-5 shadow-sharp hover:border-[#D4AF37]/40 transition-colors">
                <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-lg font-bold text-foreground">{student?.full_name || "Unnamed student"}</h2>
                      <span className="rounded-md border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-2.5 py-0.5 text-xs font-semibold text-[#8C6D23]">{candidate.match_score}% match</span>
                      <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs capitalize text-muted-foreground font-medium">{candidate.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{student?.course || "Course not provided"} · {student?.university || "University not provided"} · CGPA {student?.cgpa ?? "—"}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(student?.skills || []).map((skill) => (
                        <span key={skill} className={candidate.skill_matches?.some((match) => match.toLowerCase() === skill.toLowerCase()) ? "rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800" : "rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"}>{skill}</span>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-3 text-xs">
                      {student?.email && <a className="text-[#800020] font-medium hover:underline" href={`mailto:${student.email}`}>{student.email}</a>}
                      {student?.linkedin_url && <a className="text-[#800020] font-medium hover:underline" href={student.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>}
                      {student?.portfolio_url && <a className="text-[#800020] font-medium hover:underline" href={student.portfolio_url} target="_blank" rel="noreferrer">Portfolio</a>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">Pipeline stage</label>
                    <select
                      value={candidate.status}
                      disabled={updating === candidate.id}
                      onChange={(event) => updateCandidate(candidate, event.target.value as CandidateStatus)}
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm capitalize"
                    >
                      {(candidate.source_type === "drive" ? DRIVE_PIPELINE : PIPELINE).map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    {aiResults === null && !["rejected", "withdrawn", "accepted", "selected"].includes(candidate.status) && (
                      <Button type="button" variant="outline" size="sm" className="w-full gap-2" disabled={scheduledIds.has(candidate.id)} onClick={() => setScheduleCandidate(candidate)}>
                        <CalendarPlus className="h-3.5 w-3.5" />{scheduledIds.has(candidate.id) ? "Interview scheduled" : "Schedule interview"}
                      </Button>
                    )}
                    <Button className="w-full" size="sm" disabled={updating === candidate.id} onClick={() => updateCandidate(candidate, "shortlisted")}>Shortlist</Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {scheduleCandidate && (
        <ScheduleInterviewDialog
          candidateId={scheduleCandidate.id}
          candidateName={scheduleCandidate.student_profiles?.full_name || "Candidate"}
          roleTitle={sources.find((item) => `${item.kind}:${item.id}` === sourceKey)?.title || "Application"}
          applicationKind={scheduleCandidate.source_type === "drive" ? "drive" : "job"}
          onClose={() => setScheduleCandidate(null)}
          onCreated={(applicationId) => {
            setScheduledIds((current) => new Set([...current, applicationId]));
            setScheduleCandidate(null);
          }}
        />
      )}
    </div>
  );
}
