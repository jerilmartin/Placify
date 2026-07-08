import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Mail, Phone, Globe, Pencil, GraduationCap, Award, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

const skills = ["TypeScript", "React", "Next.js", "Node", "Postgres", "System Design", "ML", "PyTorch"];
const experience = [
  { role: "SDE Intern", org: "Razorpay", period: "May 2025 – Jul 2025", note: "Built merchant risk-scoring dashboard used by 40+ ops analysts." },
  { role: "Research Assistant", org: "IIT Bombay · CSE", period: "Aug 2024 – Apr 2025", note: "Retrieval-augmented tutoring system for undergraduate algorithms." },
];
const achievements = [
  { l: "Smart India Hackathon '25", d: "National winner · Fintech track" },
  { l: "ACM ICPC Regionals", d: "Rank 12 · Amritapuri" },
  { l: "Dean's List 2024", d: "Top 5% of the batch" },
];

function ProfilePage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="relative h-28 bg-gradient-to-r from-primary/25 via-[oklch(0.55_0.20_235)/0.2] to-transparent">
          <div className="aurora opacity-60" />
        </div>
        <div className="flex flex-col gap-4 px-6 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            <div className="-mt-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-surface bg-gradient-to-br from-primary to-[oklch(0.55_0.20_235)] text-xl font-semibold text-white">
              AS
            </div>
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight">Aarav Sharma</h1>
              <p className="text-[13.5px] text-muted-foreground">
                Final year · Computer Science, IIT Bombay · CGPA 9.1
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Mumbai, IN</span>
                <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> aarav.s@iitb.ac.in</span>
                <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> +91 98••• •••32</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Github className="mr-1.5 h-3.5 w-3.5" /> GitHub</Button>
            <Button variant="outline" size="sm"><Linkedin className="mr-1.5 h-3.5 w-3.5" /> LinkedIn</Button>
            <Button variant="outline" size="sm"><Globe className="mr-1.5 h-3.5 w-3.5" /> Portfolio</Button>
            <Button size="sm"><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit profile</Button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-[14px] font-medium">About</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
              Systems-minded engineer drawn to the seam where product meets infrastructure.
              Currently exploring inference-time optimization for retrieval systems and
              building tools that make placement workflows kinder for everyone involved.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <h2 className="text-[14px] font-medium">Experience</h2>
            </div>
            <ul className="divide-y divide-border">
              {experience.map((e) => (
                <li key={e.role} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="text-[13.5px] font-medium">{e.role} · <span className="text-muted-foreground font-normal">{e.org}</span></div>
                    <div className="shrink-0 text-[11.5px] text-muted-foreground">{e.period}</div>
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">{e.note}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-[14px] font-medium">Skills</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span key={s} className="rounded-md border border-border bg-elevated/60 px-2 py-0.5 text-[12px]">{s}</span>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-[13px] font-medium">Placement readiness</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">92</span>
              <span className="text-[12px] text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated">
              <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-primary to-[oklch(0.55_0.20_235)]" />
            </div>
            <ul className="mt-4 space-y-1.5 text-[12.5px] text-muted-foreground">
              <li className="flex justify-between"><span>Resume ATS</span><span className="text-foreground">94</span></li>
              <li className="flex justify-between"><span>Mock interviews</span><span className="text-foreground">8</span></li>
              <li className="flex justify-between"><span>Applications sent</span><span className="text-foreground">14</span></li>
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <h3 className="text-[13px] font-medium">Achievements</h3>
            </div>
            <ul className="space-y-3">
              {achievements.map((a) => (
                <li key={a.l}>
                  <div className="text-[13px] font-medium">{a.l}</div>
                  <div className="text-[11.5px] text-muted-foreground">{a.d}</div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
