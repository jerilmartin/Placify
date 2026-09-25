"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, CheckCircle2, ChevronRight, RotateCcw, Send, BriefcaseBusiness } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { interviewsApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Phase = "setup" | "active" | "complete";

interface Evaluation {
  score: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
  evaluation_mode?: "ai" | "basic";
}

interface Summary {
  overall_score: number;
  strengths: string[];
  improvements: string[];
  overall_recommendation: string;
}

interface QA {
  question: string;
  answer: string;
  evaluation: Evaluation | null;
}

function normalizeEvaluation(value: Evaluation | null): Evaluation | null {
  if (!value) return null;
  return !value.evaluation_mode && value.score > 0 && value.score <= 10
    ? { ...value, score: value.score * 10 }
    : value;
}

interface Application {
  id: string;
  job_id?: string;
  drive_id?: string;
  status: string;
  jobs?: { title?: string; company?: string; location?: string };
  placement_drives?: { role?: string; company_name?: string; description?: string };
}

const INTERVIEW_TYPES = [
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "system_design", label: "System Design" },
  { value: "hr", label: "HR Round" },
];

const DIFFICULTIES = ["easy", "medium", "hard"];

export default function InterviewPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("setup");

  // Setup
  const [interviewType, setInterviewType] = useState("technical");
  const [difficulty, setDifficulty] = useState("medium");
  const [targetRole, setTargetRole] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  // Session
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<QA[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [waitingEval, setWaitingEval] = useState(false);
  const [starting, setStarting] = useState(false);

  // Summary
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [nextQuestion, setNextQuestion] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<Array<{ id: string; status: string; created_at?: string; interview_type?: string; difficulty?: string; feedback?: Summary; responses?: QA[]; questions_asked?: string[]; current_question?: string }>>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch BOTH direct job applications AND drive applications on mount
  useEffect(() => {
    if (!user) return;
    const loadApps = async () => {
      try {
        // 1. Get student profile id
        const { data: sp } = await supabase
          .from("student_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        const merged: Application[] = [];

        // 2. Direct job applications (applications table)
        const { data: jobApps } = await supabase
          .from("applications")
          .select("id, job_id, status, jobs(title, company, location)")
          .eq("student_id", sp?.id || "")
          .neq("status", "withdrawn")
          .order("created_at", { ascending: false });
        if (jobApps) merged.push(...(jobApps as unknown as Application[]));

        // 3. Placement drive applications
        if (sp?.id) {
          const { data: driveApps } = await supabase
            .from("drive_applications")
            .select("id, drive_id, status, placement_drives(role, company_name, description)")
            .eq("student_id", sp.id)
            .order("registered_at", { ascending: false });
          if (driveApps) merged.push(...(driveApps as unknown as Application[]));
        }

        setApplications(merged);
      } catch {
        // Non-fatal
      } finally {
        setLoadingApps(false);
      }
    };
    loadApps();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    interviewsApi.list().then((res) => setPastSessions(res.data || [])).catch(() => {});
  }, [user]);

  const scoredHistory = history.filter((qa) => qa.evaluation && qa.evaluation.evaluation_mode !== "basic");
  const overallScore = scoredHistory.length > 0
    ? Math.round(scoredHistory.reduce((s, q) => s + (q.evaluation?.score ?? 0), 0) / scoredHistory.length)
    : 0;

  const getAppLabel = (app: Application) => {
    const title = app.jobs?.title || app.placement_drives?.role || "Role";
    const company = app.jobs?.company || app.placement_drives?.company_name || "Company";
    return `${title} @ ${company}`;
  };

  const startSession = async () => {
    const effectiveRole = targetRole.trim();
    if (!effectiveRole && !selectedJobId) {
      toast.error("Select a job from your applications or enter a target role");
      return;
    }
    setStarting(true);
    try {
      const payload: Record<string, unknown> = {
        interview_type: interviewType,
        difficulty,
        target_role: effectiveRole || undefined,
        num_questions: numQuestions,
      };
      if (selectedJobId) payload.job_id = selectedJobId;

      const res = await interviewsApi.start(payload);
      const data = res.data;
      setSessionId(data.id);
      setQuestions(data.questions_asked || []);
      setCurrentQuestion(data.current_question || data.questions_asked?.[0] || "Tell me about yourself.");
      setCurrentIdx(0);
      setHistory([]);
      setEvaluation(null);
      setReviewing(false);
      setPhase("active");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "";
      toast.error(detail || "Could not start interview — make sure the backend is running.");
    } finally {
      setStarting(false);
    }
  };

  const submitAnswer = async () => {
    if (answer.trim().length < 10 || waitingEval || reviewing || !sessionId) return;
    setWaitingEval(true);
    const qa: QA = { question: currentQuestion, answer, evaluation: null };

    try {
      const res = await interviewsApi.submitAnswer({
        interview_id: sessionId,
        question: currentQuestion,
        answer: qa.answer,
        question_index: currentIdx,
      });
      const data = res.data;

      const evaluated = normalizeEvaluation(data.evaluation);
      setHistory((h) => [...h, { ...qa, evaluation: evaluated }]);
      setAnswer("");
      setEvaluation(evaluated);
      setNextQuestion(data.is_complete ? null : data.next_question);
      setReviewing(true);
    } catch {
      toast.error("Failed to submit answer. Please try again.");
    } finally {
      setWaitingEval(false);
    }
  };

  const continueSession = async () => {
    if (!nextQuestion) {
      await finishSession();
      return;
    }
    setCurrentQuestion(nextQuestion);
    setCurrentIdx((index) => index + 1);
    setEvaluation(null);
    setReviewing(false);
    setNextQuestion(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const finishSession = async () => {
    if (!sessionId || history.length === 0) return;
    setLoadingSummary(true);
    try {
      const res = await interviewsApi.complete(sessionId);
      setSummary(res.data);
      interviewsApi.list().then((list) => setPastSessions(list.data || [])).catch(() => {});
    } catch {
      toast.error("Could not save the session summary. Your answer feedback is still available; you can retry.");
    } finally {
      setLoadingSummary(false);
      setPhase("complete");
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [answer]);

  // ── SETUP SCREEN ──────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> AI Mock Assessment
          </div>
          <h1 className="font-display mt-3 text-3xl font-medium tracking-tight text-foreground">Practice Interview</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            AI generates role-specific assessment questions from your verified applications and evaluates each response against standard scoring rubrics.
          </p>
        </div>

        <div className="space-y-5 rounded-lg border border-border bg-card p-6 md:p-8 shadow-sharp">
          {/* Pick from your applications */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Target Application
            </label>
            {loadingApps ? (
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your registered applications…
              </div>
            ) : applications.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No applications found. Specify a target role below.</p>
            ) : (
              <div className="grid gap-2">
                {applications.slice(0, 6).map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      const newId = app.job_id || app.drive_id || null;
                      setSelectedJobId(selectedJobId === newId ? null : newId);
                      setTargetRole(""); // clear manual role when picking an application
                    }}
                    className={`flex items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-left text-[13px] transition-colors ${
                      selectedJobId === (app.job_id || app.drive_id)
                        ? "border-[#800020] bg-[#800020]/5 text-foreground ring-1 ring-[#800020]"
                        : "border-border bg-background hover:border-border/80"
                    }`}
                  >
                    <BriefcaseBusiness className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{getAppLabel(app)}</span>
                    <span className={`ml-auto shrink-0 text-[10.5px] capitalize font-semibold rounded px-2 py-0.5 ${
                      app.status === "accepted" ? "bg-success/15 text-success border border-success/30" :
                      app.status === "shortlisted" ? "border border-[#E8D9A8] bg-[#FCF9EE] text-[#785A00]" :
                      "bg-muted text-muted-foreground"
                    }`}>{app.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11.5px] uppercase tracking-wider text-muted-foreground">
            <div className="flex-1 border-t border-border" />
            or custom position
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Target Role (fallback) */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Role</label>
            <input
              value={targetRole}
              onChange={(e) => { setTargetRole(e.target.value); setSelectedJobId(null); }}
              placeholder="e.g. Software Engineer, Systems Architect, Financial Analyst"
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-primary transition-colors text-foreground"
            />
          </div>

          {/* Interview Type */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evaluation Track</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {INTERVIEW_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setInterviewType(t.value)}
                  className={`rounded-md border px-3 py-2.5 text-[12.5px] font-semibold transition-colors ${
                    interviewType === t.value
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rigor Level</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 rounded-md border px-3 py-2 text-[12.5px] font-semibold capitalize transition-colors ${
                    difficulty === d
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-border bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Number of questions */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Questions — <span className="text-primary font-bold">{numQuestions}</span>
            </label>
            <input
              type="range" min={3} max={10} value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>3</span><span>10</span></div>
          </div>

          <Button onClick={startSession} disabled={starting} className="w-full gap-2 bg-primary text-primary-foreground hover:bg-[#660019] shadow-xs" size="lg">
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {starting ? "Generating questions…" : "Start Interview Session"}
          </Button>
        </div>
        {pastSessions.length > 0 && <div className="mt-6 rounded-lg border border-border bg-card p-5"><h2 className="text-sm font-semibold">Previous practice sessions</h2><div className="mt-3 space-y-2">{pastSessions.slice(0, 5).map((session) => <div key={session.id} className="flex items-center justify-between gap-3 border-t border-border pt-2 text-xs"><span>{session.created_at ? new Date(session.created_at).toLocaleDateString() : "Practice session"} · {session.responses?.length || 0} answered · {session.status}</span>{session.status === "active" && session.current_question ? <button type="button" className="font-semibold text-primary hover:underline" onClick={() => { setSessionId(session.id); setQuestions(session.questions_asked || []); setHistory((session.responses || []).map((r) => ({ question: r.question, answer: r.answer, evaluation: normalizeEvaluation(r.evaluation) }))); setCurrentIdx(session.responses?.length || 0); setCurrentQuestion(session.current_question || ""); setEvaluation(null); setReviewing(false); setPhase("active"); }}>Resume</button> : session.feedback ? <button type="button" className="font-semibold text-primary hover:underline" onClick={() => { setHistory((session.responses || []).map((r) => ({ question: r.question, answer: r.answer, evaluation: normalizeEvaluation(r.evaluation) }))); setSummary(session.feedback || null); setNumQuestions(session.questions_asked?.length || session.responses?.length || 0); setInterviewType(session.interview_type || "technical"); setDifficulty(session.difficulty || "medium"); setPhase("complete"); }}>Review session</button> : null}</div>)}</div></div>}
      </div>
    );
  }

  // ── COMPLETE SCREEN ───────────────────────────────────────────
  if (phase === "complete") {
    const strengths: string[] = summary?.strengths ?? history.flatMap((q) => q.evaluation?.strengths ?? []).slice(0, 3);
    const improvements: string[] = summary?.improvements ?? history.flatMap((q) => q.evaluation?.improvements ?? []).slice(0, 3);

    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Interview Complete!</h1>
          <p className="mt-1 text-sm text-muted-foreground">{numQuestions} questions · {interviewType} · {difficulty}</p>
        </div>
        {summary?.overall_recommendation && <p className="mb-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">{summary.overall_recommendation}</p>}

        {/* Score */}
        <div className="mb-4 rounded-xl border border-border bg-surface p-6 text-center">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Overall Score</div>
          {scoredHistory.length > 0 ? <><div className="mt-2 text-6xl font-bold tabular-nums text-primary">{loadingSummary ? "—" : overallScore}<span className="text-2xl text-muted-foreground">/100</span></div><Progress value={overallScore} className="mt-4 h-2" /></> : <div className="mt-2 text-sm text-muted-foreground">Not scored — AI evaluation was unavailable for this session.</div>}
          {scoredHistory.length > 0 && scoredHistory.length < history.length && <p className="mt-2 text-xs text-muted-foreground">Based on {scoredHistory.length} AI-scored answers; basic checks were excluded.</p>}
        </div>
        {!summary && <Button onClick={finishSession} disabled={loadingSummary} variant="outline" className="mb-4 w-full">{loadingSummary ? "Saving summary…" : "Retry summary"}</Button>}

        <div className="grid gap-4 md:grid-cols-2">
          {strengths.length > 0 && (
            <div className="rounded-xl border border-success/30 bg-success/5 p-5">
              <div className="mb-3 text-[13px] font-semibold text-success">Strengths</div>
              <ul className="space-y-2">
                {strengths.slice(0, 4).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {improvements.length > 0 && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
              <div className="mb-3 text-[13px] font-semibold text-warning">Areas to Improve</div>
              <ul className="space-y-2">
                {improvements.slice(0, 4).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-warning" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Q&A Review */}
        <div className="mt-6 space-y-3">
          <h2 className="text-[14px] font-semibold">Answer Review</h2>
          {history.map((qa, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="text-[13.5px] font-medium">Q{i + 1}: {qa.question}</div>
                {qa.evaluation && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-semibold text-primary">
                    {qa.evaluation.evaluation_mode === "basic" ? "Not scored" : `${qa.evaluation.score}/100`}
                  </span>
                )}
              </div>
              <p className="mt-2 rounded-lg bg-elevated px-3 py-2 text-[13px] text-muted-foreground">{qa.answer}</p>
              {qa.evaluation?.feedback && (
                <p className="mt-2 text-[12.5px] text-muted-foreground italic">{qa.evaluation.feedback}</p>
              )}
              {qa.evaluation?.improvements && qa.evaluation.improvements.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {qa.evaluation.improvements.map((imp, j) => (
                    <span key={j} className="rounded-full bg-warning/10 px-2 py-0.5 text-[11px] text-warning">{imp}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <Button onClick={() => { setPhase("setup"); setSummary(null); setHistory([]); }} variant="outline" className="mt-6 w-full gap-2">
          <RotateCcw className="h-4 w-4" /> Start Another Session
        </Button>
      </div>
    );
  }

  // ── ACTIVE INTERVIEW ──────────────────────────────────────────
  const progress = questions.length > 0 ? (history.length / questions.length) * 100 : 0;
  const isLastQuestion = currentIdx >= (questions.length - 1);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">AI Mock Interview</h1>
          <p className="text-sm text-muted-foreground capitalize">{interviewType.replace("_", " ")} · {targetRole || "Applied Role"} · {difficulty}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-muted-foreground">
            Question {Math.min(currentIdx + 1, questions.length)} of {questions.length}
          </span>
          <Button size="sm" variant="ghost" onClick={finishSession} disabled={loadingSummary || waitingEval || history.length === 0}>
            {loadingSummary ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "End Session"}
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="mb-6 h-1.5" />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Left: Question + Answer */}
        <div className="space-y-4">
          {/* Current Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-border bg-card p-6 shadow-sharp"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A192F] text-[#D4AF37] border border-[#162740]">
                  <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#800020]">
                  AI Interviewer
                </span>
              </div>
              <p className="font-serif text-[17px] font-semibold leading-relaxed text-foreground">{currentQuestion}</p>
            </motion.div>
          </AnimatePresence>

          {/* Answer Box */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sharp">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Your Answer
            </label>
            {reviewing ? <div className="min-h-28 whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed">{history[history.length - 1]?.answer}</div> : <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) submitAnswer(); }}
              placeholder="Type your answer here… (Ctrl+Enter to submit)"
              disabled={waitingEval || reviewing}
              rows={5}
              className="w-full resize-none bg-background border border-input rounded-md p-3 text-[14px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground disabled:opacity-60 text-foreground"
            />}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{reviewing ? "Review your answer before continuing" : `${answer.length} characters`}</span>
              <Button onClick={reviewing ? continueSession : submitAnswer} disabled={(!reviewing && answer.trim().length < 10) || waitingEval || loadingSummary} className="gap-2">
                {waitingEval
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Evaluating…</>
                  : reviewing
                    ? <><ChevronRight className="h-4 w-4" /> {nextQuestion ? "Next Question" : "View Session Review"}</>
                  : isLastQuestion
                    ? <><CheckCircle2 className="h-4 w-4" /> Submit Final Answer</>
                    : <><Send className="h-4 w-4" /> Submit Answer</>
                }
              </Button>
            </div>
            {!reviewing && answer.trim().length > 0 && answer.trim().length < 10 && <p className="mt-2 text-xs text-muted-foreground">Add a little more detail before submitting (at least 10 characters).</p>}
          </div>
        </div>

        {/* Right: Live Feedback */}
        <aside className="space-y-4">
          {evaluation && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl border border-border bg-card p-5 shadow-sharp"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[14px] font-semibold">Answer feedback</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${evaluation.evaluation_mode === "basic" ? "bg-muted text-muted-foreground" : evaluation.score >= 70 ? "bg-success/15 text-success" : evaluation.score >= 50 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"}`}>
                  {evaluation.evaluation_mode === "basic" ? "Not scored" : `${evaluation.score}/100`}
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-foreground/80">{evaluation.feedback}</p>
              {evaluation.evaluation_mode === "basic" && <p className="mt-2 text-[11px] text-muted-foreground">Gemini could not score this answer. This is a simple writing checklist, not a performance rating.</p>}
              {evaluation.strengths?.length > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-success mb-1">Strengths</div>
                  <ul className="space-y-1">
                    {evaluation.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[12.5px]">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {evaluation.improvements?.length > 0 && (
                <div className="mt-3">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-warning mb-1">To Improve</div>
                  <ul className="space-y-1">
                    {evaluation.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[12.5px]">
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* Session Progress */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Session Progress</div>
            <div className="mt-3 flex items-center gap-1">
              {Array.from({ length: questions.length || numQuestions }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < history.length ? "bg-success"
                    : i === currentIdx ? "bg-primary"
                    : "bg-elevated"
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 text-[12px] text-muted-foreground">
              {history.length} of {questions.length || numQuestions} answered
            </div>
            {scoredHistory.length > 0 && (
              <div className="mt-3 text-[12px] text-muted-foreground">
                Avg score so far:{" "}
                <span className="font-semibold text-foreground">
                  {Math.round(scoredHistory.reduce((s, q) => s + (q.evaluation?.score ?? 0), 0) / scoredHistory.length)}/100
                </span>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-primary uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> Tip
            </div>
            <p className="text-[12.5px] leading-relaxed text-foreground/80">
              {interviewType === "technical"
                ? "Explain your thought process aloud. Interviewers care more about HOW you think than the final answer."
                : interviewType === "system_design"
                ? "Start with requirements clarification, then scale estimates, then your design. Don't jump straight to architecture."
                : interviewType === "behavioral"
                ? "Use the STAR format: Situation → Task → Action → Result. Be specific, not generic."
                : "Be authentic and concise. Show enthusiasm for the role. Ask questions at the end."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
