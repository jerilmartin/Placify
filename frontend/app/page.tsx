"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Bot,
  BarChart3,
  ShieldCheck,
  Zap,
  Users,
  Building2,
  GraduationCap,
} from "lucide-react";
import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";



export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px]">
        <div className="aurora" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-dotted opacity-30" />

      {/* Nav */}
      <header className="relative z-10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <BrandLockup />
          <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground md:flex">
            <a href="#product" className="hover:text-foreground">Product</a>
            <a href="#portals" className="hover:text-foreground">Portals</a>
            <a href="#analytics" className="hover:text-foreground">Analytics</a>
            <a href="#security" className="hover:text-foreground">Security</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/student/dashboard">
                Open workspace
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-[12px] text-muted-foreground backdrop-blur">
            <span className="flex h-1.5 w-1.5 rounded-full bg-success" />
            Trusted by 40+ campuses · 220,000 students placed
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.02em] md:text-6xl">
            The <span className="text-gradient">placement OS</span> for modern universities.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground md:text-base">
            AI-matched jobs, mock interviews, ATS scoring, and executive analytics —
            unified in one workspace for students, recruiters, and placement officers.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild className="shadow-[0_8px_32px_-8px_oklch(0.55_0.22_285/0.55)]">
              <Link href="/student/dashboard">
                Enter workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Book a demo</Link>
            </Button>
          </div>
          <div className="mt-4 text-[12px] text-muted-foreground">
            SSO, SOC 2 · Trained on your placement history, never leaves your tenant.
          </div>
        </motion.div>

        {/* Product screenshot mock */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="relative rounded-2xl border border-border bg-surface/60 p-2 shadow-elevated backdrop-blur">
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              {/* Fake app chrome */}
              <div className="flex h-8 items-center gap-1.5 border-b border-border px-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.65_0.22_25)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.80_0.16_75)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.72_0.17_155)]" />
                <span className="ml-3 text-[11px] text-muted-foreground">placify.app / dashboard</span>
              </div>
              <div className="grid grid-cols-[180px_1fr] min-h-[380px]">
                <div className="border-r border-border bg-sidebar p-3">
                  {["Dashboard", "Jobs", "Applications", "Resume", "AI Interview", "Career AI"].map((l, i) => (
                    <div
                      key={l}
                      className={`mb-1 rounded-md px-2 py-1.5 text-[12px] ${i === 0 ? "bg-sidebar-accent text-foreground" : "text-muted-foreground"}`}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { l: "AI Match", v: "92" },
                      { l: "ATS Score", v: "88" },
                      { l: "Applications", v: "24" },
                      { l: "Interviews", v: "07" },
                    ].map((k) => (
                      <div key={k.l} className="rounded-lg border border-border bg-surface p-3">
                        <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{k.l}</div>
                        <div className="mt-1.5 text-2xl font-semibold tracking-tight">{k.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="col-span-2 h-40 rounded-lg border border-border bg-gradient-to-br from-primary/15 to-transparent p-3">
                      <div className="text-[11px] text-muted-foreground">Application activity · 8 weeks</div>
                      <div className="mt-3 flex h-24 items-end gap-1.5">
                        {[30, 55, 42, 70, 60, 82, 74, 95].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="h-40 rounded-lg border border-border bg-surface p-3">
                      <div className="text-[11px] text-muted-foreground">Matched jobs</div>
                      {["Stripe · 96%", "Rippling · 93%", "Zerodha · 91%"].map((r) => (
                        <div key={r} className="mt-2.5 flex items-center justify-between text-[12px]">
                          <span className="text-foreground">{r.split(" · ")[0]}</span>
                          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">{r.split(" · ")[1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Logos strip */}
      <section className="relative z-10 border-y border-border bg-surface/40 py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-4 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
            Recruiting partners on Placify
          </div>
          <div className="grid grid-cols-3 items-center gap-6 opacity-70 md:grid-cols-6">
            {["stripe", "google", "razorpay", "zerodha", "linear", "notion"].map((n) => (
              <div key={n} className="text-center text-sm font-medium tracking-wide text-muted-foreground">
                {n}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="product" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 max-w-2xl">
          <div className="text-[11px] uppercase tracking-widest text-primary">Product</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
            Everything your placement cell wishes it had.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Six portals, one design language, zero spreadsheets. Purpose-built for
            campuses running high-volume, high-stakes placement seasons.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: Sparkles, t: "AI job matching", d: "Rank openings against every student's resume, CGPA, and preferences — in real time." },
            { icon: Bot, t: "Mock interviews", d: "Voice-driven AI interviews with feedback on communication, technical depth, and confidence." },
            { icon: BarChart3, t: "Executive analytics", d: "Placement %, package distribution, sector breakdown — filtered by branch and batch." },
            { icon: Zap, t: "Recruiter search", d: "Natural language: 'React engineers with CGPA > 8 open to Bengaluru' — ranked instantly." },
            { icon: ShieldCheck, t: "Compliance-ready", d: "SOC 2, SSO, role-based access, audit trails. Your tenant, your keys, your policy." },
            { icon: Users, t: "Mentor network", d: "Alumni and industry mentors book, review resumes, and track student growth." },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.t}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="group rounded-xl border border-border bg-surface/40 p-5 backdrop-blur-sm hover:border-primary/30 hover:bg-surface"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-[15px] font-medium text-foreground">{f.t}</div>
                <div className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{f.d}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Portals */}
      <section id="portals" className="relative z-10 border-t border-border bg-surface/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-primary">Portals</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
                One workspace. Six roles.
              </h2>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/dashboard">Explore <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              { icon: GraduationCap, name: "Students", d: "Applications, ATS resume, AI interviews, career coach." },
              { icon: Building2, name: "Recruiters", d: "Post jobs, rank candidates, natural-language search." },
              { icon: Users, name: "Placement Officers", d: "Drives, eligibility, cross-branch analytics, exports." },
              { icon: ShieldCheck, name: "University Admin", d: "Multi-campus rollups, package distribution, KPIs." },
              { icon: Sparkles, name: "Mentors", d: "Sessions, notes, resume reviews, ratings." },
              { icon: ShieldCheck, name: "Super Admin", d: "Tenants, billing, feature flags, audit, health." },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.name} className="rounded-xl border border-border bg-background/40 p-5 backdrop-blur">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-[15px] font-medium">{p.name}</div>
                  </div>
                  <p className="mt-3 text-[13.5px] text-muted-foreground">{p.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-surface to-background p-10 md:p-14">
          <div className="aurora opacity-60" />
          <div className="relative">
            <h3 className="max-w-xl text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              Run your next placement season on Placify.
            </h3>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Onboarding in 14 days. Import your ERP roster, connect SSO, and start
              matching students to openings from day one.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/student/dashboard">Open workspace <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Talk to sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 md:flex-row md:items-center">
          <BrandLockup />
          <div className="text-[12px] text-muted-foreground">
            © 2026 Placify Systems, Inc. · SOC 2 Type II · Made in Bengaluru.
          </div>
        </div>
      </footer>
    </div>
  );
}
