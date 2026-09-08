"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, CheckCircle2, ChevronRight, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { interviewsApi } from "@/lib/api";
import { toast } from "sonner";

type Phase = "setup" | "active" | "complete";

interface Evaluation {
  score: number;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

interface QA {
  question: string;
  answer: string;
  evaluation: Evaluation | null;
}

const INTERVIEW_TYPES = [
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "system_design", label: "System Design" },
  { value: "hr", label: "HR Round" },
];

const DIFFICULTIES = ["easy", "medium", "hard"];

export default function InterviewPage() {
  const [phase, setPhase] = useState<Phase>("setup");

  // Setup
  const [interviewType, setInterviewType] = useState("technical");
  const [difficulty, setDifficulty] = useState("medium");
  const [targetRole, setTargetRole] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);

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
  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const overallScore = summary?.overall_score
    ?? (history.length > 0
      ? Math.round(history.reduce((s, q) => s + (q.evaluation?.score ?? 0), 0) / history.length)
      : 0);

  const startSession = async () => {
    if (!targetRole.trim()) { toast.error("Please enter a target role"); return; }
    setStarting(true);
    try {
      const res = await interviewsApi.start({
        interview_type: interviewType,
        difficulty,
        target_role: targetRole,
        num_questions: numQuestions,
      });
      const data = res.data;
      setSessionId(data.id);
      setQuestions(data.questions_asked || []);
      setCurrentQuestion(data.current_question || data.questions_asked?.[0] || "Tell me about yourself.");
      setCurrentIdx(0);
      setHistory([]);
      setPhase("active");
    } catch {
      toast.error("Could not start interview — make sure backend is running.");
    } finally {
      setStarting(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || waitingEval || !sessionId) return;
    setWaitingEval(true);
    const qa: QA = { question: currentQuestion, answer, evaluation: null };
    setHistory((h) => [...h, qa]);
    setAnswer("");

    try {
      const res = await interviewsApi.submitAnswer({
        interview_id: sessionId,
        question: currentQuestion,
        answer: qa.answer,
        question_index: currentIdx,
      });
      const data = res.data;

      // Patch the evaluation back into the last history item
      setHistory((h) => h.map((item, i) => i === h.length - 1 ? { ...item, evaluation: data.evaluation } : item));
      setEvaluation(data.evaluation);

      if (data.is_complete) {
        await finishSession();
      } else {
        setCurrentQuestion(data.next_question);
        setCurrentIdx(data.question_index);
      }
    } catch {
      toast.error("Failed to submit answer. Please try again.");
    } finally {
      setWaitingEval(false);
    }
  };

  const finishSession = async () => {
    if (!sessionId) return;
    setLoadingSummary(true);
    try {
      const res = await interviewsApi.complete(sessionId);
      setSummary(res.data);
    } catch {
      // Summary may fail gracefully; show what we have
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
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] text-primary">
            <Sparkles className="h-3 w-3" /> AI Mock Interview · Powered by Gemini
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Practice Interview</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gemini generates real questions based on your role and profile, then evaluates every answer.
          </p>
        </div>

        <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
          {/* Target Role */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Target Role</label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Software Engineer, Data Analyst, Product Manager"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Interview Type */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Interview Type</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {INTERVIEW_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setInterviewType(t.value)}
                  className={`rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    interviewType === t.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-medium capitalize transition-colors ${
                    difficulty === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Number of questions */}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium">
              Questions — <span className="text-primary font-semibold">{numQuestions}</span>
            </label>
            <input
              type="range" min={3} max={10} value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>3</span><span>10</span></div>
          </div>

          <Button onClick={startSession} disabled={starting} className="w-full gap-2" size="lg">
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {starting ? "Generating questions with Gemini…" : "Start Interview Session"}
          </Button>
        </div>
      </div>
    );
  }

  // ── COMPLETE SCREEN ───────────────────────────────────────────
  if (phase === "complete") {
    const strengths: string[] = summary?.key_strengths ?? history.flatMap((q) => q.evaluation?.strengths ?? []).slice(0, 3);
    const improvements: string[] = summary?.areas_for_improvement ?? history.flatMap((q) => q.evaluation?.improvements ?? []).slice(0, 3);

    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Interview Complete!</h1>
          <p className="mt-1 text-sm text-muted-foreground">{numQuestions} questions · {interviewType} · {difficulty}</p>
        </div>

        {/* Score */}
        <div className="mb-4 rounded-xl border border-border bg-surface p-6 text-center">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Overall Score</div>
          <div className="mt-2 text-6xl font-bold tabular-nums text-primary">{loadingSummary ? "—" : overallScore}<span className="text-2xl text-muted-foreground">/100</span></div>
          <Progress value={overallScore} className="mt-4 h-2" />
        </div>

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
                    {qa.evaluation.score}/100
                  </span>
                )}
              </div>
              <p className="mt-2 rounded-lg bg-elevated px-3 py-2 text-[13px] text-muted-foreground">{qa.answer}</p>
              {qa.evaluation?.feedback && (
                <p className="mt-2 text-[12.5px] text-muted-foreground italic">{qa.evaluation.feedback}</p>
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
  const progress = questions.length > 0 ? ((currentIdx) / questions.length) * 100 : 0;
  const isLastQuestion = currentIdx >= (questions.length - 1);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">AI Mock Interview</h1>
          <p className="text-sm text-muted-foreground capitalize">{interviewType.replace("_", " ")} · {targetRole} · {difficulty}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-muted-foreground">
            Question {Math.min(currentIdx + 1, questions.length)} of {questions.length}
          </span>
          <Button size="sm" variant="ghost" onClick={finishSession} disabled={loadingSummary}>
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
              className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/8 via-surface to-surface p-6"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-primary">
                  Gemini AI · Interviewer
                </span>
              </div>
              <p className="text-[16px] font-medium leading-relaxed">{currentQuestion}</p>
            </motion.div>
          </AnimatePresence>

          {/* Answer Box */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <label className="mb-2 block text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Your Answer
            </label>
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) submitAnswer(); }}
              placeholder="Type your answer here… (Ctrl+Enter to submit)"
              disabled={waitingEval}
              rows={5}
              className="w-full resize-none bg-transparent text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{answer.length} characters</span>
              <Button onClick={submitAnswer} disabled={!answer.trim() || waitingEval} className="gap-2">
                {waitingEval
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Evaluating…</>
                  : isLastQuestion
                    ? <><CheckCircle2 className="h-4 w-4" /> Submit Final Answer</>
                    : <><Send className="h-4 w-4" /> Submit Answer</>
                }
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Live Feedback */}
        <aside className="space-y-4">
          {evaluation && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[14px] font-semibold">Last Answer Feedback</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${evaluation.score >= 70 ? "bg-success/15 text-success" : evaluation.score >= 50 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"}`}>
                  {evaluation.score}/100
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-foreground/80">{evaluation.feedback}</p>
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
                    i < currentIdx ? "bg-success"
                    : i === currentIdx ? "bg-primary"
                    : "bg-elevated"
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 text-[12px] text-muted-foreground">
              {currentIdx} of {questions.length || numQuestions} answered
            </div>
            {history.length > 0 && (
              <div className="mt-3 text-[12px] text-muted-foreground">
                Avg score so far:{" "}
                <span className="font-semibold text-foreground">
                  {Math.round(history.reduce((s, q) => s + (q.evaluation?.score ?? 0), 0) / history.length)}/100
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
