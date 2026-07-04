"use client";

import { motion } from "framer-motion";
import { UploadCloud, FileText, Sparkles, Download, Share2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";



const suggestions = [
  { level: "warn", t: "Quantify impact in the Stripe internship bullet — add throughput or dollar impact." },
  { level: "warn", t: "Missing a 'System Design' section — 4 target roles require it." },
  { level: "ok", t: "Great use of active verbs across your last 6 bullet points." },
  { level: "ok", t: "Keywords align well with 12/14 shortlisted roles." },
];

const versions = [
  { name: "aarav_resume_v4.pdf", when: "Today · 10:22", ats: 88, active: true },
  { name: "aarav_resume_v3.pdf", when: "Nov 1 · 18:11", ats: 77 },
  { name: "aarav_resume_v2.pdf", when: "Oct 25 · 09:04", ats: 71 },
];

export default function ResumePage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Resume</h1>
          <p className="mt-1 text-sm text-muted-foreground">Parse, score, and rewrite with AI.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="mr-1.5 h-3.5 w-3.5" /> Download</Button>
          <Button variant="outline" size="sm"><Share2 className="mr-1.5 h-3.5 w-3.5" /> Share</Button>
          <Button size="sm"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Improve with AI</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Preview + upload */}
        <div className="lg:col-span-2 space-y-4">
          <motion.label
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface p-10 text-center transition-colors hover:border-primary/50 hover:bg-elevated"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div className="mt-3 text-[14px] font-medium">Drop a new version to reparse</div>
            <div className="mt-1 text-[12px] text-muted-foreground">PDF · DOCX · up to 4 MB</div>
            <input type="file" className="hidden" />
          </motion.label>

          <div className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-[14px] font-medium">aarav_resume_v4.pdf</span>
                <span className="rounded-md bg-success/12 px-1.5 py-0.5 text-[10.5px] font-medium text-success">Active</span>
              </div>
              <div className="text-[12px] text-muted-foreground">Parsed 4s ago</div>
            </div>
            <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_240px]">
              {/* Fake preview */}
              <div className="p-6">
                <div className="rounded-lg border border-border bg-background p-6 shadow-inner">
                  <div className="mb-4">
                    <div className="text-lg font-semibold">Aarav Sharma</div>
                    <div className="text-[12px] text-muted-foreground">B.Tech CSE · IIT Bombay · aarav.s@iitb.ac.in</div>
                  </div>
                  {[
                    { h: "Experience", lines: ["Stripe · SWE Intern · Summer 2025", "Built payments retry pipeline handling 12M req/day…"] },
                    { h: "Projects", lines: ["Distributed cache · Go, Raft consensus", "AI job matcher · Python, embeddings, pgvector"] },
                    { h: "Education", lines: ["B.Tech CSE · CGPA 8.7 · 2022–2026"] },
                  ].map((s) => (
                    <div key={s.h} className="mb-4">
                      <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{s.h}</div>
                      <div className="mt-1.5 space-y-1">
                        {s.lines.map((l) => (
                          <div key={l} className="h-2 rounded skeleton" style={{ width: `${60 + Math.random() * 40}%` }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border p-6 md:border-l md:border-t-0">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">ATS score</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tabular-nums">88</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
                <div className="mt-3 space-y-3">
                  {[
                    { l: "Keyword match", v: 92 },
                    { l: "Structure", v: 84 },
                    { l: "Readability", v: 90 },
                    { l: "Impact metrics", v: 74 },
                  ].map((m) => (
                    <div key={m.l}>
                      <div className="mb-1 flex justify-between text-[12px]"><span>{m.l}</span><span className="tabular-nums text-muted-foreground">{m.v}</span></div>
                      <Progress value={m.v} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: suggestions + versions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 via-surface to-surface p-5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
              <Sparkles className="h-3 w-3" /> AI suggestions
            </div>
            <ul className="mt-4 space-y-3">
              {suggestions.map((s) => (
                <li key={s.t} className="flex items-start gap-2.5 text-[13px]">
                  {s.level === "warn" ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  ) : (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  )}
                  <span>{s.t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-3">
              <h3 className="text-[14px] font-medium">Version history</h3>
            </div>
            <ul className="divide-y divide-border">
              {versions.map((v) => (
                <li key={v.name} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-[13px]">{v.name}</div>
                    <div className="text-[11px] text-muted-foreground">{v.when}</div>
                  </div>
                  <span className={v.active ? "rounded-md bg-primary/12 px-1.5 py-0.5 text-[11px] text-primary" : "text-[12px] text-muted-foreground tabular-nums"}>
                    ATS {v.ats}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

