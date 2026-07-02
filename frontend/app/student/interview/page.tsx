"use client";

import { useState } from "react";
import { interviewsApi } from "@/lib/api";
import { toast } from "sonner";
import { MessageSquare, Loader2, Send, CheckCircle, Star, ChevronRight } from "lucide-react";
import type { Interview, InterviewFeedback } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isDemoMode, MOCK_INTERVIEW_QUESTIONS, MOCK_INTERVIEW_FEEDBACK } from "@/lib/mock-data";

type Stage = "setup" | "active" | "complete";

const DIFFICULTIES = ["easy","medium","hard"] as const;
const TYPES = ["technical","behavioral","mixed","hr"] as const;

export default function InterviewPage() {
  const [stage, setStage] = useState<Stage>("setup");
  const [session, setSession] = useState<Interview | null>(null);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [answer, setAnswer] = useState("");
  const [qIndex, setQIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<Record<string, unknown> | null>(null);

  const [config, setConfig] = useState({
    interview_type: "mixed" as typeof TYPES[number],
    difficulty: "medium" as typeof DIFFICULTIES[number],
    target_role: "",
    num_questions: 5,
  });

  const startInterview = async () => {
    setLoading(true);
    if (isDemoMode()) {
      await new Promise(r => setTimeout(r, 1000));
      const questions = MOCK_INTERVIEW_QUESTIONS[config.interview_type] || MOCK_INTERVIEW_QUESTIONS.mixed;
      const demoSession: Interview = {
        id: `demo-interview-${Date.now()}`,
        student_id: "demo-uid-student",
        interview_type: config.interview_type,
        difficulty: config.difficulty,
        questions_asked: questions.slice(0, config.num_questions),
        current_question: questions[0],
        status: "active",
        responses: [],
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      setSession(demoSession);
      setStage("active");
      setQIndex(0);
      toast.success("Interview started! Good luck 🎯");
      setLoading(false);
      return;
    }
    try {
      const res = await interviewsApi.start(config);
      setSession(res.data);
      setStage("active");
      setQIndex(0);
      toast.success("Interview started! Good luck 🎯");
    } catch { toast.error("Failed to start interview"); }
    finally { setLoading(false); }
  };

  const submitAnswer = async () => {
    if (!session || !answer.trim()) return;
    setLoading(true);
    if (isDemoMode()) {
      await new Promise(r => setTimeout(r, 1200));
      const score = Math.floor(Math.random() * 3) + 7; // 7-9
      setEvalResult({ score, feedback: `Good answer! Score: ${score}/10. ${score >= 8 ? 'Well-structured response with relevant examples.' : 'Consider adding more specific examples and quantifying your impact.'}` });
      setAnswer("");
      const nextIdx = qIndex + 1;
      if (nextIdx >= session.questions_asked.length) {
        await new Promise(r => setTimeout(r, 800));
        setFeedback(MOCK_INTERVIEW_FEEDBACK);
        setStage("complete");
      } else {
        setQIndex(nextIdx);
        setSession(prev => prev ? { ...prev, current_question: prev.questions_asked[nextIdx] } : prev);
        setTimeout(() => setEvalResult(null), 2000);
      }
      setLoading(false);
      return;
    }
    try {
      const res = await interviewsApi.submitAnswer({
        interview_id: session.id,
        question: session.questions_asked[qIndex],
        answer,
        question_index: qIndex,
      });
      setEvalResult(res.data.evaluation);
      setAnswer("");
      if (res.data.is_complete) {
        const fbRes = await interviewsApi.complete(session.id);
        setFeedback(fbRes.data);
        setStage("complete");
      } else {
        setQIndex(res.data.question_index);
        setSession(prev => prev ? { ...prev, current_question: res.data.next_question } : prev);
        setEvalResult(null);
      }
    } catch { toast.error("Failed to submit answer"); }
    finally { setLoading(false); }
  };

  if (stage === "complete" && feedback) return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Interview Complete! 🎉</h1>
      </div>
      <div className="glass p-6 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Overall", val: feedback.overall_score },
            { label: "Confidence", val: feedback.confidence_score },
            { label: "Communication", val: feedback.communication_score },
            { label: "Technical", val: feedback.technical_accuracy_score },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold gradient-text">{s.val}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {feedback.strengths.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-xs font-medium text-emerald-300 mb-2">✅ Strengths</div>
              {feedback.strengths.map((s, i) => <div key={i} className="text-xs text-slate-400 mb-1">• {s}</div>)}
            </div>
          )}
          {feedback.improvements.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-xs font-medium text-amber-300 mb-2">💡 Improve</div>
              {feedback.improvements.map((s, i) => <div key={i} className="text-xs text-slate-400 mb-1">• {s}</div>)}
            </div>
          )}
        </div>
        {feedback.overall_recommendation && (
          <div className="mt-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
            {feedback.overall_recommendation}
          </div>
        )}
      </div>
      <button onClick={() => { setStage("setup"); setSession(null); setFeedback(null); setQIndex(0); }}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 font-semibold text-white hover:opacity-90 transition-all">
        Practice Again
      </button>
    </div>
  );

  if (stage === "active" && session) return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-white">AI Interview</h1>
          <span className="text-sm text-slate-500">Q{qIndex + 1} / {session.questions_asked.length}</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all"
            style={{ width: `${((qIndex) / session.questions_asked.length) * 100}%` }} />
        </div>
      </div>

      {/* Current question */}
      <div className="glass p-6 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Interviewer</div>
            <p className="text-white">{session.current_question}</p>
          </div>
        </div>
      </div>

      {/* Last eval */}
      {evalResult && (
        <div className="glass p-4 mb-4 border border-emerald-500/20 animate-fade-up">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-white">Score: {String(evalResult.score)}/10</span>
          </div>
          <p className="text-xs text-slate-400">{String(evalResult.feedback)}</p>
        </div>
      )}

      {/* Answer input */}
      <div className="glass p-4">
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Type your answer here…"
          rows={5}
          className="w-full bg-transparent text-white text-sm placeholder-slate-500 resize-none focus:outline-none"
        />
        <div className="flex justify-end mt-2">
          <button onClick={submitAnswer} disabled={loading || !answer.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium disabled:opacity-60 hover:opacity-90 transition-all">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Submit</>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><MessageSquare className="w-4 h-4" /> Interview</div>
        <h1 className="text-2xl font-bold text-white">AI Mock Interview</h1>
        <p className="text-slate-500 text-sm mt-1">Practice with Gemini AI. Get scored on confidence, communication, and accuracy.</p>
      </div>

      <div className="glass p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Target Role (optional)</label>
            <input value={config.target_role} onChange={e => setConfig(c => ({...c, target_role: e.target.value}))}
              placeholder="e.g. Data Analyst, Frontend Developer"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Interview Type</label>
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map(t => (
                <button key={t} onClick={() => setConfig(c => ({...c, interview_type: t}))}
                  className={cn("py-2 rounded-lg text-xs font-medium capitalize transition-all border",
                    config.interview_type === t ? "bg-purple-600 text-white border-transparent" : "border-white/10 text-slate-400 hover:text-white")}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setConfig(c => ({...c, difficulty: d}))}
                  className={cn("py-2 rounded-lg text-xs font-medium capitalize transition-all border",
                    config.difficulty === d
                      ? d === "easy" ? "bg-emerald-600 text-white border-transparent"
                        : d === "medium" ? "bg-amber-600 text-white border-transparent"
                        : "bg-red-600 text-white border-transparent"
                      : "border-white/10 text-slate-400 hover:text-white")}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Questions: {config.num_questions}</label>
            <input type="range" min={3} max={10} value={config.num_questions}
              onChange={e => setConfig(c => ({...c, num_questions: parseInt(e.target.value)}))}
              className="w-full accent-purple-600" />
          </div>

          <button onClick={startInterview} disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing…</> : <><MessageSquare className="w-4 h-4" /> Start Interview</>}
          </button>
        </div>
      </div>
    </div>
  );
}
