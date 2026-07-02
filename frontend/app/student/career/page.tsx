"use client";

import { useState, useRef, useEffect } from "react";
import { aiApi } from "@/lib/api";
import { BookOpen, Send, Loader2, Bot, User } from "lucide-react";
import { isDemoMode, MOCK_CAREER_RESPONSES } from "@/lib/mock-data";

interface Message { role: "user" | "assistant"; content: string; }

export default function CareerGuidancePage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "👋 Hi! I'm your AI Career Mentor powered by Gemini. Ask me anything about career growth, skills to learn, job preparation, salary negotiation, or interview tips. I'll give you personalized advice based on your profile!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    const query = input;
    setInput("");
    setLoading(true);

    if (isDemoMode()) {
      await new Promise(r => setTimeout(r, 800 + Math.random() * 800));
      const lower = query.toLowerCase();
      let response = MOCK_CAREER_RESPONSES.default;
      if (lower.includes("skill") || lower.includes("learn") || lower.includes("technology") || lower.includes("data science")) response = MOCK_CAREER_RESPONSES.skills;
      else if (lower.includes("salary") || lower.includes("package") || lower.includes("ctc") || lower.includes("negotiate")) response = MOCK_CAREER_RESPONSES.salary;
      else if (lower.includes("interview") || lower.includes("crack") || lower.includes("prepare") || lower.includes("tips")) response = MOCK_CAREER_RESPONSES.interview;
      else if (lower.includes("resume") || lower.includes("cv") || lower.includes("ats")) response = MOCK_CAREER_RESPONSES.resume;
      else if (lower.includes("placement") || lower.includes("campus") || lower.includes("chance") || lower.includes("probability")) response = MOCK_CAREER_RESPONSES.placement;
      else if (lower.includes("faang") || lower.includes("google") || lower.includes("amazon") || lower.includes("meta") || lower.includes("microsoft")) response = MOCK_CAREER_RESPONSES.faang;
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setLoading(false);
      return;
    }

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await aiApi.careerGuidance(query, history);
      setMessages(prev => [...prev, { role: "assistant", content: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please check if the backend is running with a Gemini API key configured." }]);
    } finally { setLoading(false); }
  };

  const suggestions = [
    "What skills should I learn for Data Science?",
    "How do I negotiate my first salary?",
    "Tips to crack FAANG interviews?",
    "How to stand out in campus placements?",
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col h-[calc(100vh-0px)]">
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><BookOpen className="w-4 h-4" /> Career</div>
        <h1 className="text-2xl font-bold text-white">AI Career Guidance</h1>
        <p className="text-slate-500 text-sm mt-1">Powered by Gemini 2.5 — your personal career mentor.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""} animate-fade-up`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === "assistant" ? "bg-gradient-to-br from-purple-600 to-blue-600" : "bg-white/10"
            }`}>
              {msg.role === "assistant" ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "assistant"
                ? "glass border border-white/10 text-slate-200"
                : "bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white rounded-tr-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="glass border border-white/10 p-3.5 rounded-2xl flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="text-sm text-slate-400">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
          {suggestions.map(s => (
            <button key={s} onClick={() => setInput(s)}
              className="px-3 py-1.5 rounded-full text-xs border border-purple-500/30 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="glass flex items-end gap-3 p-3 rounded-2xl flex-shrink-0">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask me anything about your career…"
          rows={2}
          className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 resize-none focus:outline-none"
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40 flex-shrink-0">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
