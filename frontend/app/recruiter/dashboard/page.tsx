
import { Search, Sparkles, ArrowUpRight, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";



const funnel = [
  { stage: "Applied", n: 1284 },
  { stage: "Screened", n: 612 },
  { stage: "Assessed", n: 214 },
  { stage: "Interview", n: 88 },
  { stage: "Offer", n: 24 },
];

const candidates = [
  { name: "Priya Menon", cgpa: 9.1, uni: "IIT Delhi", role: "Frontend Engineer", match: 96, tags: ["React", "TypeScript", "Design systems"] },
  { name: "Rohan Iyer", cgpa: 8.6, uni: "NIT Trichy", role: "Backend Engineer", match: 93, tags: ["Go", "Postgres", "Kafka"] },
  { name: "Ananya Rao", cgpa: 8.9, uni: "BITS Pilani", role: "Full-Stack Engineer", match: 91, tags: ["Next.js", "Node", "AWS"] },
  { name: "Kabir Khan", cgpa: 8.4, uni: "IIT Bombay", role: "ML Engineer", match: 89, tags: ["PyTorch", "LLMs", "Ranking"] },
  { name: "Sara Verma", cgpa: 9.3, uni: "IIIT Hyderabad", role: "Frontend Engineer", match: 88, tags: ["Vue", "GraphQL"] },
];

export default function RecruiterPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Recruiter · Stripe India</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-[28px]">Talent workspace</h1>
        </div>
        <Button size="sm">Post a job</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Open roles", v: "12" },
          { l: "Applications", v: "1,284" },
          { l: "Shortlisted", v: "214" },
          { l: "Offers extended", v: "24" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border bg-surface p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.l}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">{k.v}</span>
              <span className="flex items-center gap-1 text-[11px] text-success"><TrendingUp className="h-3 w-3" /> +12%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Natural language search */}
      <div className="mt-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-surface p-5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
          <Sparkles className="h-3 w-3" /> Natural language search
        </div>
        <div className="mt-3 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background/60 px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              defaultValue="Find React developers with CGPA above 8 open to Bengaluru"
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <Button>Search</Button>
        </div>
      </div>

      {/* Funnel + candidates */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-[14px] font-medium">Hiring funnel · Q4</h3>
          <div className="mt-3 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ left: -18 }}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="stage" stroke="oklch(0.68 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.68 0.02 270)" fontSize={11} tickLine={false} axisLine={false} width={38} />
                <Tooltip contentStyle={{ background: "oklch(0.19 0.017 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="n" fill="oklch(0.68 0.19 285)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-[14px] font-medium">Ranked candidates</h3>
            <div className="text-[12px] text-muted-foreground">Payments SWE · India</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead className="bg-elevated/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 text-left">Candidate</th>
                  <th className="px-3 py-2.5 text-left">University</th>
                  <th className="px-3 py-2.5 text-left">CGPA</th>
                  <th className="px-3 py-2.5 text-left">Match</th>
                  <th className="px-3 py-2.5 text-left">Signals</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {candidates.map((c) => (
                  <tr key={c.name} className="hover:bg-elevated/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.20_235)] text-[11px] font-semibold text-white">
                          {c.name.split(" ").map((s) => s[0]).join("")}
                        </div>
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground">{c.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{c.uni}</td>
                    <td className="px-3 py-3 tabular-nums">{c.cgpa}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-md bg-primary/12 px-1.5 py-0.5 text-[11px] font-medium text-primary">{c.match}%</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.slice(0, 2).map((t) => (
                          <span key={t} className="rounded bg-elevated px-1.5 py-0.5 text-[10.5px]">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" size="sm">View <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
