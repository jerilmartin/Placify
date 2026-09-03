"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles, Paperclip, Mic } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { aiApi } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Msg = { role: "user" | "ai"; text: string };

const prompts = [
  "What salary should I ask Stripe for a Payments SWE role?",
  "Which 3 skills would raise my match on infra roles?",
  "Draft answers for the Rippling behavioral round.",
  "Compare TCS vs. Zerodha vs. Google offer letters.",
];

function FormattedInline({ text }: { text: string }) {
  // Regex to match **bold**, `code`, and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={index} className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">{part.slice(1, -1)}</code>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={index} className="italic text-foreground/90">{part.slice(1, -1)}</em>;
        }
        return part;
      })}
    </>
  );
}

function FormattedMessage({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-4">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="list-disc text-[14px] leading-relaxed text-foreground/90">
              <FormattedInline text={item} />
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2 space-y-1.5 pl-4">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="list-decimal text-[14px] leading-relaxed text-foreground/90">
              <FormattedInline text={item} />
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed === "---" || trimmed === "***") {
      flushList();
      elements.push(<hr key={`hr-${idx}`} className="my-3 border-border/80" />);
      return;
    }

    if (trimmed.startsWith("#### ")) {
      flushList();
      elements.push(
        <h4 key={`h4-${idx}`} className="mt-3 mb-1 text-[14.5px] font-semibold text-foreground">
          <FormattedInline text={trimmed.slice(5)} />
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${idx}`} className="mt-3.5 mb-1.5 text-[15px] font-semibold text-foreground">
          <FormattedInline text={trimmed.slice(4)} />
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${idx}`} className="mt-4 mb-2 text-[16px] font-bold text-foreground">
          <FormattedInline text={trimmed.slice(3)} />
        </h2>
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={`h1-${idx}`} className="mt-4 mb-2 text-[18px] font-bold text-foreground">
          <FormattedInline text={trimmed.slice(2)} />
        </h1>
      );
      return;
    }

    if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const content = trimmed.replace(/^(\*|-|•)\s+/, "");
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [content] };
      } else {
        currentList.items.push(content);
      }
      return;
    }

    const matchNumbered = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (matchNumbered) {
      const content = matchNumbered[2];
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [content] };
      } else {
        currentList.items.push(content);
      }
      return;
    }

    flushList();
    elements.push(
      <p key={`p-${idx}`} className="my-1.5 text-[14px] leading-relaxed text-foreground/90">
        <FormattedInline text={trimmed} />
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

export default function CareerPage() {
  const { user } = useAuth();
  const firstName = user?.full_name ? user.full_name.split(" ")[0] : "there";
  
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Array<{ role: string; content: string }>>([]);

  useEffect(() => {
    if (msgs.length === 0) {
      setMsgs([
        {
          role: "ai",
          text: `Hi ${firstName} — I've read your latest profile and resume. What are we working on today?`,
        },
      ]);
    }
  }, [firstName, msgs.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  const send = async (t: string) => {
    if (!t.trim() || thinking) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setThinking(true);
    const history = historyRef.current;
    try {
      const res = await aiApi.careerGuidance(t, history);
      const aiText: string = res.data?.response ?? "I'm unable to respond right now. Please try again.";
      setMsgs((m) => [...m, { role: "ai", text: aiText }]);
      historyRef.current = [
        ...history,
        { role: "user", content: t },
        { role: "assistant", content: aiText },
      ];
    } catch {
      toast.error("Career AI is unavailable. Please check that the backend is running.");
      setMsgs((m) => [...m, { role: "ai", text: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setThinking(false);
    }
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
                <div className="flex max-w-[88%] gap-3">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.20_235)] shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </span>
                  <div className="rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 shadow-sm">
                    <FormattedMessage text={m.text} />
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
