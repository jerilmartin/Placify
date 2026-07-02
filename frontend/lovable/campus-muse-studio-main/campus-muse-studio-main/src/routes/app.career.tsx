import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles, Paperclip, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/career")({
  component: CareerPage,
});

type Msg = { role: "user" | "ai"; text: string };

const seed: Msg[] = [
  { role: "ai", text: "Hi Aarav — I've read your latest resume and the 12 roles in your shortlist. What are we working on today?" },
];

const prompts = [
  "What salary should I ask Stripe for a Payments SWE role?",
  "Which 3 skills would raise my match on infra roles?",
  "Draft answers for the Rippling behavioral round.",
  "Compare TCS vs. Zerodha vs. Google offer letters.",
];

function CareerPage() {
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  const send = (t: string) => {
    if (!t.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMsgs((m) => [
        ...m,
        {
          role: "ai",
          text:
            "Based on your resume and current market data:\n\n• Payments SWE at Stripe (India, Grad) currently pays ₹45–58 LPA fixed + ~₹8L equity vested over 4 years.\n• With your Stripe internship signal and 8.7 CGPA, aim for the upper band — ₹52 LPA fixed.\n• Anchor the negotiation on: retention of your internship team, comparable offer from Rippling (₹46L), and a competing Zerodha founder-round in progress.\n\nWant me to draft the negotiation email?",
        },
      ]);
    }, 900);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-60px)] max-w-3xl flex-col px-4 py-6 md:px-6">
      <div className="mb-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
          <Sparkles className="h-3 w-3" /> Career AI · trained on your profile
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">How can I help?</h1>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              {m.role === "ai" ? (
                <div className="flex max-w-[85%] gap-3">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.20_235)]">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </span>
                  <div className="whitespace-pre-wrap rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 text-[14px] leading-relaxed">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-[14px] leading-relaxed text-primary-foreground">
                  {m.text}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {thinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.20_235)]">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </span>
            <div className="flex gap-1 rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-4">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggested prompts */}
      {msgs.length <= 1 && (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="rounded-lg border border-border bg-surface px-3.5 py-3 text-left text-[13px] transition-colors hover:border-primary/40 hover:bg-elevated"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="sticky bottom-0 mt-4 rounded-2xl border border-border bg-surface p-2 shadow-elevated"
      >
        <div className="flex items-end gap-2">
          <Button type="button" size="icon" variant="ghost" aria-label="Attach">
            <Paperclip className="h-4 w-4" />
          </Button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask about salary, roles, resume, interview prep…"
            rows={1}
            className="flex-1 resize-none bg-transparent px-1 py-2 text-[14px] outline-none placeholder:text-muted-foreground"
          />
          <Button type="button" size="icon" variant="ghost" aria-label="Voice">
            <Mic className="h-4 w-4" />
          </Button>
          <Button type="submit" size="icon" disabled={!input.trim()}>
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
