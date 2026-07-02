import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Sparkles, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/app/interview")({
  component: InterviewPage,
});

function InterviewPage() {
  const [seconds, setSeconds] = useState(72);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [live]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">AI Interview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Technical · Software Engineer, Payments · Stripe</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-elevated px-2 py-1 font-mono text-[12px] tabular-nums text-foreground">
            {mm}:{ss}
          </span>
          <span className="flex items-center gap-1.5 rounded-md bg-destructive/12 px-2 py-1 text-[11px] font-medium text-destructive">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" /> LIVE
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Video + question */}
        <div className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-surface">
            <div className="aurora opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              {cam ? (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.20_235)] text-3xl font-semibold text-white">
                  AS
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Camera off</div>
              )}
            </div>
            {/* AI orb */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-2 backdrop-blur">
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.20_235)]">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
                <Sparkles className="relative h-3 w-3 text-white" />
              </span>
              <span className="text-[12px] text-foreground">Placify AI · Interviewer</span>
            </div>
            {/* Controls */}
            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-background/80 p-1.5 backdrop-blur">
                <Button
                  size="icon"
                  variant={mic ? "secondary" : "destructive"}
                  onClick={() => setMic((m) => !m)}
                  className="rounded-full"
                >
                  {mic ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant={cam ? "secondary" : "destructive"}
                  onClick={() => setCam((c) => !c)}
                  className="rounded-full"
                >
                  {cam ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => setLive(false)}
                  className="rounded-full"
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Question 3 of 8</div>
            <h2 className="mt-2 text-xl font-medium leading-snug">
              Design a rate limiter that supports 100k RPS with per-user, per-endpoint limits.
              Walk through the data structures and the trade-offs of your approach.
            </h2>
            <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-muted-foreground">
              <span className="rounded-md bg-elevated px-2 py-0.5">System design</span>
              <span className="rounded-md bg-elevated px-2 py-0.5">Distributed systems</span>
              <span className="rounded-md bg-elevated px-2 py-0.5">45 min avg.</span>
            </div>
          </div>

          {/* Transcript */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-[14px] font-medium">Live transcript</h3>
              <Button size="sm" variant="ghost"><Play className="mr-1.5 h-3.5 w-3.5" /> Replay</Button>
            </div>
            <div className="max-h-64 space-y-3 overflow-y-auto p-5 text-[13.5px]">
              <div><span className="mr-2 rounded bg-primary/12 px-1.5 py-0.5 text-[10px] font-medium text-primary">AI</span> Great — let's start with your approach at the highest level.</div>
              <div><span className="mr-2 rounded bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-foreground">You</span> I'd use a sliding window log with Redis, sharded by user ID for horizontal scale…</div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted-foreground"
              >
                <span className="mr-2 rounded bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-foreground">You</span>
                For the hot key problem, we could pre-warm caches and use…
                <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-primary align-middle" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right: live AI feedback */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-[14px] font-medium">Live AI feedback</h3>
            <div className="mt-4 space-y-4">
              {[
                { l: "Technical depth", v: 84 },
                { l: "Communication", v: 78 },
                { l: "Confidence", v: 71 },
                { l: "Structure", v: 86 },
              ].map((m) => (
                <div key={m.l}>
                  <div className="mb-1 flex justify-between text-[12.5px]">
                    <span>{m.l}</span>
                    <span className="tabular-nums text-muted-foreground">{m.v}</span>
                  </div>
                  <Progress value={m.v} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 via-surface to-surface p-5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
              <Sparkles className="h-3 w-3" /> Coaching tip
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed">
              You're leaning heavily on Redis. Interviewers at Stripe typically want to hear
              the eviction and consistency trade-offs — cover TTL vs. sliding window vs. token
              bucket in the next 60 seconds.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Session progress</div>
            <div className="mt-3 flex items-center gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className={
                    i < 2 ? "h-1.5 flex-1 rounded-full bg-success"
                    : i === 2 ? "h-1.5 flex-1 rounded-full bg-primary"
                    : "h-1.5 flex-1 rounded-full bg-elevated"
                  }
                />
              ))}
            </div>
            <div className="mt-2 text-[12px] text-muted-foreground">2 of 8 questions completed</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
