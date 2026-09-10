"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, CalendarDays, Trophy, Building2, Info, Sparkles, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { aiApi, resumesApi, jobsApi } from "@/lib/api";

interface Drive {
  id: string;
  title: string;
  company_name: string;
  role: string | null;
  location: string | null;
  package_lpa: number | null;
  drive_date: string | null;
  registration_deadline: string | null;
  status: string;
  already_applied?: boolean;
  eligibility: {
    min_cgpa?: number;
    max_backlogs?: number;
    eligible_branches?: string[];
  };
}

interface ResumeSummary { id: string; original_filename: string }
interface RankedJob {
  id?: string;
  job_id?: string;
  match_score: number;
  match_reason?: string;
  job?: { title?: string; company?: string };
}
interface ResumeMatchResult {
  match_percentage?: number;
  overall_match?: number;
  missing_skills?: string[];
  recommendations?: string[];
}

interface StudentProfile {
  id: string;
  cgpa: number | null;
  active_backlogs: number | null;
  course: string | null;
}

interface EligibilityResult {
  eligible: boolean;
  reason: string;
}

const BRANCH_ALIASES: Record<string, string[]> = {
  cs: ["cs", "cse", "computer science", "comp sci", "computer engineering", "software"],
  cse: ["cs", "cse", "computer science", "comp sci", "computer engineering", "software"],
  "computer science": ["cs", "cse", "computer science", "comp sci", "computer engineering", "software"],
  it: ["it", "information technology", "info tech"],
  "information technology": ["it", "information technology", "info tech"],
  ece: ["ece", "electronics", "ec", "telecommunication", "communication"],
  electronics: ["ece", "electronics", "ec", "telecommunication", "communication"],
  eee: ["eee", "electrical", "ee"],
  electrical: ["eee", "electrical", "ee"],
  mech: ["mech", "mechanical"],
  mechanical: ["mech", "mechanical"],
  civil: ["civil"],
  ai: ["ai", "ml", "artificial intelligence", "machine learning", "data science"],
  ml: ["ai", "ml", "artificial intelligence", "machine learning", "data science"],
  "data science": ["ai", "ml", "artificial intelligence", "machine learning", "data science"],
};

function matchesBranch(studentCourse: string, requiredBranch: string): boolean {
  const courseNorm = studentCourse.toLowerCase().trim();
  const branchNorm = requiredBranch.toLowerCase().trim();

  // Direct substring check
  if (courseNorm.includes(branchNorm) || branchNorm.includes(courseNorm)) return true;

  // Synonym check
  const aliases = BRANCH_ALIASES[branchNorm];
  if (aliases) {
    return aliases.some((alias) => courseNorm.includes(alias));
  }

  return false;
}

function checkEligibility(drive: Drive, profile: StudentProfile | null): EligibilityResult {
  if (!profile) return { eligible: false, reason: "Complete your profile first" };
  const { eligibility } = drive;
  if (!eligibility || Object.keys(eligibility).length === 0) return { eligible: true, reason: "" };

  if (eligibility.min_cgpa != null) {
    if (profile.cgpa == null) return { eligible: false, reason: `Min CGPA ${eligibility.min_cgpa} required — add your CGPA in profile` };
    if (profile.cgpa < eligibility.min_cgpa) return { eligible: false, reason: `Min CGPA ${eligibility.min_cgpa} required (yours: ${profile.cgpa})` };
  }
  if (eligibility.max_backlogs != null) {
    const backlogs = profile.active_backlogs ?? 0;
    if (backlogs > eligibility.max_backlogs) return { eligible: false, reason: `Max ${eligibility.max_backlogs} backlog(s) allowed (yours: ${backlogs})` };
  }
  if (eligibility.eligible_branches?.length) {
    const course = profile.course || "";
    const branchMatch = eligibility.eligible_branches.some((b) => matchesBranch(course, b));
    if (!branchMatch) return { eligible: false, reason: `Branch not eligible. Allowed: ${eligibility.eligible_branches.join(", ")}` };
  }
  return { eligible: true, reason: "" };
}

export default function JobsPage() {
  const { user } = useAuth();
  const [drives, setDrives] = useState<Drive[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [search, setSearch] = useState("");

  // Resume-to-role analysis state
  const [matchDrive, setMatchDrive] = useState<Drive | null>(null);
  const [matchResult, setMatchResult] = useState<ResumeMatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [resumesList, setResumesList] = useState<ResumeSummary[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [rankedJobs, setRankedJobs] = useState<RankedJob[]>([]);
  const [ranking, setRanking] = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Load student profile (own row, always visible)
      const { data: sp } = await supabase
        .from("student_profiles")
        .select("id, cgpa, active_backlogs, course")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(sp);

      // Load drives via backend API — service-role bypasses RLS student-university match issue
      try {
        const drivesRes = await jobsApi.listDrives();
        const drivesData: Drive[] = drivesRes.data || [];
        setDrives(drivesData);
        // Backend annotates each drive with already_applied flag
        setApplied(new Set(drivesData.filter((drive) => drive.already_applied).map((drive) => drive.id)));
      } catch (err) {
        console.error("Failed to load placement drives:", err);
      }

      setLoading(false);

      // Load student's uploaded resumes for match analysis
      resumesApi.list().then(r => {
        setResumesList(r.data || []);
        if (r.data?.length > 0) setSelectedResumeId(r.data[0].id);
      }).catch(() => {});
    };
    load();
  }, [user]);


  const openMatchModal = (drive: Drive) => {
    setMatchDrive(drive);
    setMatchResult(null);
  };

  const findBestMatches = async () => {
    setRanking(true);
    try {
      const { data } = await jobsApi.getMatches();
      setRankedJobs(data || []);
      if (!data?.length) showToast("error", "No suitable direct-hiring jobs are available yet");
    } catch {
      showToast("error", "Could not calculate job matches");
    } finally {
      setRanking(false);
    }
  };

  const runMatch = async () => {
    if (!selectedResumeId || !matchDrive) {
      showToast("error", "Upload a resume first to analyze your fit");
      return;
    }
    setMatchLoading(true);
    try {
      const res = await aiApi.resumeVsJob(selectedResumeId, matchDrive.id);
      setMatchResult(res.data);
    } catch {
      showToast("error", "Resume analysis failed — ensure the backend is running");
    } finally {
      setMatchLoading(false);
    }
  };

  const applyToDrive = async (drive: Drive) => {
    if (!profile?.id) { showToast("error", "Complete your profile first to apply"); return; }
    setApplying(drive.id);
    const { error } = await supabase.from("drive_applications").insert({
      drive_id: drive.id,
      student_id: profile.id,
      status: "registered",
    });
    setApplying(null);
    if (error) {
      showToast("error", error.message || "Failed to apply");
    } else {
      setApplied((prev) => new Set([...prev, drive.id]));
      showToast("success", `Applied to ${drive.company_name}!`);
    }
  };

  const filtered = drives.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.company_name.toLowerCase().includes(q) || (d.role || "").toLowerCase().includes(q) || (d.location || "").toLowerCase().includes(q);
  });

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-success/15 text-success border border-success/30" : "bg-destructive/15 text-destructive border border-destructive/30"}`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Placement Drives</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} open drive{filtered.length !== 1 ? "s" : ""} · eligibility checked against your profile
          </p>
        </div>
        <Button onClick={findBestMatches} disabled={ranking} className="gap-2">
          {ranking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Find best matches
        </Button>
      </div>

      {rankedJobs.length > 0 && (
        <div className="mb-6 rounded-xl border border-primary/25 bg-primary/5 p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Ranked direct-hiring opportunities</div>
          <div className="grid gap-2 md:grid-cols-2">
            {rankedJobs.slice(0, 6).map((match) => (
              <div key={match.job_id || match.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-3"><div><div className="font-medium">{match.job?.title || "Open role"}</div><div className="text-xs text-muted-foreground">{match.job?.company}</div></div><Badge>{match.match_score}%</Badge></div>
                <p className="mt-2 text-xs text-muted-foreground">{match.match_reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-surface p-2">
        <div className="flex flex-1 items-center gap-2 px-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies, roles, locations…"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Eligibility hint */}
      {!profile && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-[13px] text-warning">
          <Info className="h-4 w-4 shrink-0" />
          Complete your student profile to see eligibility status for each drive.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border">
          <Building2 className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-[14px] text-muted-foreground">No placement drives found</p>
          {search && <Button size="sm" variant="outline" onClick={() => setSearch("")}>Clear search</Button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((drive, i) => {
            const { eligible, reason } = checkEligibility(drive, profile);
            const isApplied = applied.has(drive.id);

            return (
              <motion.article
                key={drive.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className={`rounded-xl border bg-surface p-5 transition-colors ${eligible ? "border-border hover:border-primary/30" : "border-border opacity-80"}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] font-medium">{drive.company_name}</h3>
                      {isApplied && <Badge className="bg-success/10 text-success text-[10.5px]">Applied</Badge>}
                      {!eligible && <Badge className="bg-muted text-muted-foreground text-[10.5px]">Ineligible</Badge>}
                    </div>
                    {drive.role && <p className="mt-0.5 text-[13px] text-muted-foreground">{drive.title} · {drive.role}</p>}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                      {drive.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{drive.location}</span>}
                      {drive.drive_date && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(drive.drive_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                      {drive.package_lpa && <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5" />₹{drive.package_lpa} LPA</span>}
                    </div>

                    {/* Eligibility criteria chips */}
                    {drive.eligibility && Object.keys(drive.eligibility).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {drive.eligibility.min_cgpa != null && (
                          <span className="rounded-md bg-elevated px-2 py-0.5 text-[11px] text-muted-foreground">Min CGPA: {drive.eligibility.min_cgpa}</span>
                        )}
                        {drive.eligibility.max_backlogs != null && (
                          <span className="rounded-md bg-elevated px-2 py-0.5 text-[11px] text-muted-foreground">Max Backlogs: {drive.eligibility.max_backlogs}</span>
                        )}
                        {drive.eligibility.eligible_branches?.map((b) => (
                          <span key={b} className="rounded-md bg-elevated px-2 py-0.5 text-[11px] text-muted-foreground">{b}</span>
                        ))}
                      </div>
                    )}

                    {/* Ineligibility reason */}
                    {!eligible && reason && (
                      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-destructive">
                        <Info className="h-3.5 w-3.5 shrink-0" /> {reason}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => openMatchModal(drive)}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Resume match
                    </Button>
                    {isApplied ? (
                      <Button size="sm" variant="outline" disabled className="opacity-60">Applied ✓</Button>
                    ) : eligible ? (
                      <Button size="sm" onClick={() => applyToDrive(drive)} disabled={applying === drive.id}>
                        {applying === drive.id ? "Applying…" : "Apply Now"}
                      </Button>
                    ) : (
                      <Button size="sm" disabled className="opacity-40 cursor-not-allowed" title={reason}>Not Eligible</Button>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* AI Match Modal */}
      <AnimatePresence>
        {matchDrive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) { setMatchDrive(null); setMatchResult(null); } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-primary">
                    <Sparkles className="h-3 w-3" /> Resume-to-role analysis
                  </div>
                  <h2 className="mt-1 text-[17px] font-semibold">{matchDrive.company_name} · {matchDrive.role || matchDrive.title}</h2>
                </div>
                <button onClick={() => { setMatchDrive(null); setMatchResult(null); }} className="rounded-full p-1.5 hover:bg-elevated">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {resumesList.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-8 text-center">
                  <p className="text-[13px] text-muted-foreground">Upload a resume on the Resume page first.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Select Resume</label>
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[13px]"
                    >
                      {resumesList.map((r) => (
                        <option key={r.id} value={r.id}>{r.original_filename}</option>
                      ))}
                    </select>
                  </div>

                  {!matchResult ? (
                    <Button onClick={runMatch} disabled={matchLoading} className="w-full gap-2">
                      {matchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {matchLoading ? "Analyzing with Gemini…" : "Analyze My Fit"}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Match Score</div>
                        <div className="mt-1 text-5xl font-bold text-primary">{matchResult.match_percentage ?? matchResult.overall_match ?? 0}<span className="text-xl">%</span></div>
                        <Progress value={matchResult.match_percentage ?? matchResult.overall_match ?? 0} className="mt-2 h-2" />
                      </div>

                      {(matchResult.missing_skills?.length ?? 0) > 0 && (
                        <div>
                          <div className="mb-2 text-[12px] font-semibold text-destructive">Missing Skills</div>
                          <div className="flex flex-wrap gap-1.5">
                            {matchResult.missing_skills?.map((s) => (
                              <span key={s} className="rounded bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {(matchResult.recommendations?.length ?? 0) > 0 && (
                        <div>
                          <div className="mb-2 text-[12px] font-semibold text-success">Recommendations</div>
                          <ul className="space-y-1.5">
                            {matchResult.recommendations?.slice(0, 4).map((r, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[12.5px]">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />{r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setMatchResult(null)} className="flex-1">Re-analyze</Button>
                        {!applied.has(matchDrive.id) && checkEligibility(matchDrive, profile).eligible && (
                          <Button size="sm" className="flex-1" onClick={() => { applyToDrive(matchDrive); setMatchDrive(null); }}>Apply Now</Button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
