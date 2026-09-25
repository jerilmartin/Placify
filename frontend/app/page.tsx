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
import { HomeProductTour } from "@/components/home-product-tour";

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Architectural subtle grid pattern */}
      <div className="pointer-events-none absolute inset-0 bg-dotted opacity-25" />

      {/* Navigation */}
      <header className="relative z-10 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <BrandLockup />
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-muted-foreground md:flex">
            <a href="#product" className="hover:text-foreground transition-colors">Product</a>
            <a href="#portals" className="hover:text-foreground transition-colors">Portals</a>
            <a href="#analytics" className="hover:text-foreground transition-colors">Analytics</a>
            <a href="#security" className="hover:text-foreground transition-colors">Governance</a>
          </nav>
          <div className="flex items-center gap-3">
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

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-[12px] font-medium text-muted-foreground shadow-xs">
            <span className="flex h-1.5 w-1.5 rounded-full bg-success" />
            Campus Placement & Recruitment Platform
          </div>

          <h1 className="font-display text-balance text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.15]">
            The <span className="text-primary italic">placement platform</span> for collegiate excellence.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground md:text-base">
            Structured candidate matching, mock interview assessments, ATS resume guidance, and university cohort analytics — unified in an architectural workspace.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild className="h-11 px-6 shadow-sm">
              <Link href="/student/dashboard">
                Enter workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-11 px-6">
              <Link href="/login">Explore portals</Link>
            </Button>
          </div>

          <div className="mt-4 text-[12px] text-muted-foreground">
            Multi-tenant cohort isolation · Role-based access control · Realtime pipeline
          </div>
        </motion.div>

        <HomeProductTour />
      </section>

      {/* Placement Lifecycle Workflow Strip */}
      <section className="relative z-10 border-y border-border bg-card/60 py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-4 text-center text-[10.5px] uppercase tracking-widest font-semibold text-muted-foreground">
            End-to-End Placement Lifecycle Architecture
          </div>
          <div className="grid grid-cols-2 items-center gap-4 opacity-85 sm:grid-cols-3 md:grid-cols-6 font-display font-medium text-xs text-foreground">
            {["Drive Proposals", "Eligibility Rules", "Cohort Applications", "ATS Evaluation", "Interview Rounds", "Placement Reports"].map((n) => (
              <div key={n} className="rounded border border-border/70 bg-background/50 px-3 py-2 text-center tracking-wide shadow-sharp">
                {n}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Architectural Features */}
      <section id="product" className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mb-12 max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">System Capabilities</div>
          <h2 className="font-display mt-2.5 text-3xl font-medium tracking-tight md:text-4xl">
            Everything your campus placement office needs.
          </h2>
          <p className="mt-3 text-sm md:text-base leading-relaxed text-muted-foreground">
            Structured coordination, real-time eligibility evaluation, and high-fidelity reporting — built for modern institutional scale.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Sparkles, t: "Deterministic Candidate Matching", d: "Ranks openings against verified coursework, CGPA constraints, and student preferences with zero hallucination." },
            { icon: Bot, t: "Mock Assessment Practice", d: "Structured interview sessions with clear rubric scoring across technical, system design, and communication fundamentals." },
            { icon: BarChart3, t: "Institutional Analytics", d: "Live cohort placement percentage, salary band distributions, and branch-wise placement tracking." },
            { icon: Zap, t: "Recruiter Search Directory", d: "Fast multi-attribute filtering by branch aliases (CS, IT, ECE), academic threshold, and project skillsets." },
            { icon: ShieldCheck, t: "Governance & Audit Logs", d: "Immutable audit trail of drive proposals, approvals, offer acceptances, and university data sovereignty." },
            { icon: Users, t: "Alumni Mentor Network", d: "Facilitate structured 1:1 resume critique and technical advice from verified alumni working in tier-1 organizations." },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.t}
                className="group rounded-lg border border-border bg-card p-6 shadow-sharp transition-all hover:border-primary/40"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded border border-border bg-muted/60 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="font-display text-[16px] font-semibold text-foreground">{f.t}</div>
                <div className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{f.d}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Portals Overview */}
      <section id="portals" className="relative z-10 border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">Integrated Ecosystem</div>
              <h2 className="font-display mt-2 text-3xl font-medium tracking-tight md:text-4xl">
                One workspace. Tailored for six distinct roles.
              </h2>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Explore Portals <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: GraduationCap, name: "Students", d: "Track applications, evaluate resume ATS readiness, practice technical interviews, and receive matched drive alerts." },
              { icon: Building2, name: "Recruiters", d: "Propose drives, configure branch eligibility, review candidate rosters, and schedule candidate rounds." },
              { icon: Users, name: "Placement Officers", d: "Authorize company drives, enforce academic cutoffs, manage schedule clashes, and export university reports." },
              { icon: ShieldCheck, name: "University Leadership", d: "Multi-department placement KPI tracking, median CTC progress, and recruiter engagement dashboards." },
              { icon: Sparkles, name: "Industry Mentors", d: "Schedule mentorship sessions, provide candid assessment reviews, and accelerate student preparation." },
              { icon: ShieldCheck, name: "Platform Admin", d: "Tenant provisioning, API credentials, and institutional access control configurations." },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.name} className="rounded-lg border border-border bg-card p-5 shadow-sharp">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-[#0A192F] text-[#F7F4EF]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="font-display text-[15px] font-semibold">{p.name}</div>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{p.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Structured Architectural Callout */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-xl border border-[#162740] bg-[#0A192F] p-10 md:p-14 text-white shadow-elevated">
          <div className="max-w-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#D4AF37]">Modern Placement Infrastructure</span>
            <h3 className="font-display mt-3 text-3xl font-medium tracking-tight md:text-4xl text-white">
              Elevate your university&apos;s placement outcomes.
            </h3>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-[#CBD5E1]">
              Rapid deployment with custom university roster import, flexible branch aliases, and verified student-recruiter workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="bg-[#800020] text-white hover:bg-[#660019]">
                <Link href="/student/dashboard">Enter Workspace <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-[#1E3A5F] bg-[#132743] text-white hover:bg-[#1E3A5F]">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-card py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center">
          <BrandLockup />
          <div className="text-[12px] text-muted-foreground">
            © 2026 Placify · Campus Placement & Career Management Platform.
          </div>
        </div>
      </footer>
    </div>
  );
}
