"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";

type TourPage = "Dashboard" | "Jobs" | "Applications" | "Resume" | "Practice Interview" | "Career Guidance";
const pages: TourPage[] = ["Dashboard", "Jobs", "Applications", "Resume", "Practice Interview", "Career Guidance"];

const sampleJobs = [
  { role: "Software Engineer", company: "Northstar Labs", detail: "Bengaluru · Full-time", match: "91% match" },
  { role: "Data Analyst", company: "Harbor Analytics", detail: "Hybrid · Full-time", match: "84% match" },
  { role: "Product Design Intern", company: "Cedar Works", detail: "Remote · Internship", match: "79% match" },
];

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-border bg-card p-4 shadow-sharp"><div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>{children}</div>;
}

export function HomeProductTour() {
  const [active, setActive] = useState<TourPage>("Dashboard");
  const [selectedJob, setSelectedJob] = useState(0);

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative mx-auto mt-14 max-w-5xl" id="tour">
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span>Explore the student experience</span>
        <span className="rounded-full border border-border bg-card px-2.5 py-1">Interactive demo · Sample data</span>
      </div>
      <div className="rounded-xl border border-border bg-card p-2 shadow-elevated">
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <div className="flex h-9 items-center justify-between border-b border-border bg-muted/40 px-4">
            <div className="flex items-center gap-1.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-[#E5E0D8]" /><span className="h-2.5 w-2.5 rounded-full bg-[#E5E0D8]" /><span className="h-2.5 w-2.5 rounded-full bg-[#E5E0D8]" /></div>
            <span className="font-mono text-[11px] text-muted-foreground">placify / student preview</span>
            <span className="hidden text-[11px] font-medium text-primary sm:inline">Demo workspace</span>
          </div>
          <div className="grid min-h-[380px] md:grid-cols-[190px_1fr]">
            <nav aria-label="Product preview" className="flex gap-1 overflow-x-auto bg-[#0A192F] p-2 text-[#CBD5E1] md:flex-col md:border-r md:border-[#162740] md:p-3">
              <div className="hidden px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] md:mb-2 md:block">Placify</div>
              {pages.map((page) => <button key={page} type="button" aria-current={active === page ? "page" : undefined} onClick={() => setActive(page)} className={`shrink-0 rounded px-2.5 py-2 text-left text-[12px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white md:w-full ${active === page ? "bg-[#203451] text-white md:border-l-2 md:border-[#D4AF37]" : "hover:bg-[#162740] hover:text-white"}`}>{page}</button>)}
            </nav>
            <div className="min-w-0 bg-background p-4 sm:p-6" aria-live="polite">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><div className="text-[10px] font-semibold uppercase tracking-wider text-primary">Student workspace</div><h2 className="font-display text-xl font-semibold">{active}</h2></div><span className="text-[11px] text-muted-foreground">Illustrative preview</span></div>
              {active === "Dashboard" && <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[{ label: "Profile readiness", value: "82%" }, { label: "Applications", value: "6" }, { label: "Shortlisted", value: "2" }, { label: "Practice sessions", value: "3" }].map((metric) => <div key={metric.label} className="rounded-lg border border-border bg-card p-3 shadow-sharp"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{metric.label}</div><div className="mt-1 font-display text-2xl font-semibold">{metric.value}</div></div>)}</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr]"><Panel title="Application activity"><div className="flex h-24 items-end gap-2" aria-label="Sample application activity chart">{[28, 47, 36, 64, 53, 77, 68, 92].map((height, i) => <span key={i} className="flex-1 rounded-t bg-primary/85" style={{ height: `${height}%` }} />)}</div></Panel><Panel title="Next step"><p className="text-sm font-medium">Prepare for your interview</p><p className="mt-2 text-xs text-muted-foreground">Practice a role-specific question and review actionable feedback.</p><button type="button" onClick={() => setActive("Practice Interview")} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">See practice flow <ChevronRight className="h-3 w-3" /></button></Panel></div>
              </>}
              {active === "Jobs" && <div className="grid gap-3 sm:grid-cols-[1fr_1fr]"><div className="space-y-2">{sampleJobs.map((job, i) => <button type="button" key={job.company} onClick={() => setSelectedJob(i)} className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedJob === i ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}><div className="text-sm font-semibold">{job.role}</div><div className="mt-1 text-xs text-muted-foreground">{job.company} · {job.detail}</div></button>)}</div><Panel title="Role details"><p className="font-display text-lg font-semibold">{sampleJobs[selectedJob].role}</p><p className="mt-1 text-xs text-muted-foreground">{sampleJobs[selectedJob].company} · {sampleJobs[selectedJob].detail}</p><span className="mt-4 inline-block rounded border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-semibold text-primary">{sampleJobs[selectedJob].match}</span><p className="mt-3 text-xs text-muted-foreground">Compare your profile, review requirements, and apply in the full workspace.</p><Link href="/student/jobs" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Open jobs <ArrowRight className="h-3 w-3" /></Link></Panel></div>}
              {active === "Applications" && <Panel title="Your pipeline"><div className="space-y-2">{[{ name: "Northstar Labs · Software Engineer", status: "Interview" }, { name: "Harbor Analytics · Data Analyst", status: "Shortlisted" }, { name: "Cedar Works · Design Intern", status: "Submitted" }].map((row) => <div key={row.name} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 last:border-0"><span className="text-sm">{row.name}</span><span className="rounded bg-muted px-2 py-1 text-[11px] font-medium">{row.status}</span></div>)}</div><Link href="/student/applications" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Track your applications <ArrowRight className="h-3 w-3" /></Link></Panel>}
              {active === "Resume" && <div className="grid gap-3 sm:grid-cols-2"><Panel title="Resume readiness"><div className="font-display text-3xl font-semibold">78<span className="text-base text-muted-foreground">/100</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[78%] bg-primary" /></div><p className="mt-3 text-xs text-muted-foreground">Sample score for a demo resume, not a live assessment.</p></Panel><Panel title="Suggested improvements"><div className="space-y-2 text-xs">{["Quantify project outcomes", "Add relevant tools to skills", "Tailor summary to role"].map((tip) => <p key={tip} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />{tip}</p>)}</div><Link href="/student/resume" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Review your resume <ArrowRight className="h-3 w-3" /></Link></Panel></div>}
              {active === "Practice Interview" && <div className="grid gap-3 sm:grid-cols-[2fr_1fr]"><Panel title="Sample technical question"><p className="font-display text-base font-semibold">How would you design a rate limiter for a public API?</p><p className="mt-3 text-xs text-muted-foreground">Structure your response around requirements, algorithm choice, storage, and trade-offs. Receive feedback before moving to the next question.</p><Link href="/student/interview" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Start a practice session <ArrowRight className="h-3 w-3" /></Link></Panel><Panel title="What you will get"><div className="space-y-2 text-xs"><p>Role-specific questions</p><p>Question-by-question feedback</p><p>Session review and next steps</p></div></Panel></div>}
              {active === "Career Guidance" && <Panel title="Career planning"><p className="font-display text-base font-semibold">A practical next step, based on your profile</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Compare your skills against a target role, identify gaps, and build a focused preparation plan.</p><Link href="/student/career" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Explore guidance <ArrowRight className="h-3 w-3" /></Link></Panel>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
