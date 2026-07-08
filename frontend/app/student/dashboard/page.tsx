"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Bot,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Info,
  AlertTriangle,
  Plus,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  student,
  kpis,
  matchedJobs,
  applications,
  upcomingInterviews,
  activity,
  skillGaps,
  applicationTrend,
  performanceRadar,
} from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";



export default function Dashboard() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
      >
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-[28px]">
            Good morning, {student.name.split(" ")[0]}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You have <span className="text-foreground">3 interviews</span> this week and
            <span className="text-foreground"> 5 new AI matches</span> since yesterday.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/resume">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Improve resume
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/student/interview">
              <Bot className="mr-1.5 h-3.5 w-3.5" /> Start mock interview
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
            className="group relative overflow-hidden rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/30"
          >
            <div className="flex items-start justify-between">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {k.label}
              </div>
              <TrendingUp className={cn("h-3.5 w-3.5", k.trend === "up" ? "text-success" : "text-muted-foreground")} />
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">{k.value}</span>
              {k.suffix && <span className="text-sm text-muted-foreground">{k.suffix}</span>}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[12px]">
              <span className={cn(
                "rounded-md px-1.5 py-0.5",
                k.trend === "up" ? "bg-success/12 text-success" : "bg-muted text-muted-foreground",
              )}>
                {k.delta}
              </span>
              <span className="text-muted-foreground">{k.hint}</span>
            </div>
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
          </motion.div>
        ))}
      </div>

      {/* Main grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Chart card */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-medium">Application activity</h3>
              <p className="text-[12px] text-muted-foreground">Applications sent vs. interviews scheduled · last 8 weeks</p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Applied</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[oklch(0.72_0.14_235)]" /> Interviews</span>
            </div>
          </div>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={applicationTrend} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.68 0.19 285)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.68 0.19 285)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.14 235)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.72 0.14 235)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="d" stroke="oklch(0.68 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.68 0.02 270)" fontSize={11} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.19 0.017 270)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="applied" stroke="oklch(0.68 0.19 285)" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="interviews" stroke="oklch(0.72 0.14 235)" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-[15px] font-medium">Interview performance</h3>
          <p className="text-[12px] text-muted-foreground">Aggregate across 12 mock sessions</p>
          <div className="mt-2 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={performanceRadar} outerRadius="72%">
                <PolarGrid stroke="oklch(1 0 0 / 0.08)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "oklch(0.68 0.02 270)", fontSize: 10 }} />
                <Radar dataKey="A" stroke="oklch(0.68 0.19 285)" fill="oklch(0.68 0.19 285)" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-[12px] text-muted-foreground">Overall band</span>
            <span className="text-lg font-semibold tabular-nums">A2 · Strong</span>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Matched jobs */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-[15px] font-medium">Top AI matches</h3>
              <p className="text-[12px] text-muted-foreground">Ranked by your resume, skills, and preferences</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/jobs">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {matchedJobs.map((j) => (
              <li key={j.id} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-elevated/60">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${j.tint}, oklch(0.35 0.05 270))` }}
                >
                  {j.logo}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium">{j.role}</span>
                    <span className="rounded bg-primary/12 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {j.match}% match
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {j.company} · {j.location}
                  </div>
                </div>
                <div className="hidden text-right md:block">
                  <div className="text-[13px] font-medium tabular-nums">{j.package}</div>
                  <div className="text-[11px] text-muted-foreground">CTC</div>
                </div>
                <Button size="sm" variant="outline" className="opacity-70 group-hover:opacity-100">
                  Apply <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming interviews */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-[15px] font-medium">Upcoming interviews</h3>
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <ul className="divide-y divide-border">
              {upcomingInterviews.map((i) => (
                <li key={i.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-elevated text-center">
                    <span className="text-[9px] uppercase leading-none text-muted-foreground">
                      {i.when.split(",")[0]}
                    </span>
                    <span className="text-[13px] font-semibold leading-tight">
                      {i.when.split("· ")[0].split(" ").slice(-1)[0]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{i.company}</div>
                    <div className="truncate text-[12px] text-muted-foreground">{i.role}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{i.when} · {i.mode}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Skills to improve */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-medium">Skills to improve</h3>
              <Button variant="ghost" size="sm">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[12px] text-muted-foreground">AI-picked based on your target roles</p>
            <ul className="mt-3 space-y-3">
              {skillGaps.map((s) => (
                <li key={s.skill}>
                  <div className="mb-1 flex items-center justify-between text-[12.5px]">
                    <span className="text-foreground">{s.skill}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.level} <span className="text-muted-foreground/60">/ {s.target}</span>
                    </span>
                  </div>
                  <Progress value={(s.level / s.target) * 100} className="h-1.5" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Row 3: activity + AI suggestion */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-[15px] font-medium">Recent activity</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/notifications">View all</Link>
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {activity.map((a) => {
              const Icon = a.kind === "success" ? CheckCircle2 : a.kind === "warning" ? AlertTriangle : Info;
              const tint =
                a.kind === "success" ? "text-success bg-success/12"
                : a.kind === "warning" ? "text-warning bg-warning/12"
                : "text-info bg-info/12";
              return (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <div className={cn("mt-0.5 flex h-7 w-7 items-center justify-center rounded-md", tint)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px]">{a.title}</div>
                    <div className="text-[11px] text-muted-foreground">{a.when} ago</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/12 via-surface to-surface p-5">
          <div className="aurora opacity-40" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
              <Sparkles className="h-3 w-3" /> Career AI
            </div>
            <h3 className="mt-3 text-[16px] font-medium leading-snug">
              Add 1 project on payments infra to unlock 4 higher-tier matches.
            </h3>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Companies like Stripe, Razorpay and Juspay weight payments experience
              heavily. A single well-documented project could raise your match to 96%.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link href="/student/career">Ask Career AI <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
              <Button size="sm" variant="outline">Dismiss</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
