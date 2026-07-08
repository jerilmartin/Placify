"use client";


import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Bookmark, MapPin, Building2, Filter, ArrowUpRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { matchedJobs } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";



const allJobs = [
  ...matchedJobs,
  { id: "j6", company: "Juspay", role: "Payments SDK Engineer", location: "Bengaluru · Hybrid", package: "₹28 LPA", match: 85, logo: "J", tint: "oklch(0.72 0.14 235)" },
  { id: "j7", company: "PhonePe", role: "Software Engineer II", location: "Bengaluru · Onsite", package: "₹32 LPA", match: 84, logo: "P", tint: "oklch(0.68 0.20 340)" },
  { id: "j8", company: "Freshworks", role: "Full-Stack Engineer", location: "Chennai · Hybrid", package: "₹24 LPA", match: 78, logo: "F", tint: "oklch(0.80 0.16 75)" },
  { id: "j9", company: "Postman", role: "Frontend Engineer", location: "Remote, India", package: "₹30 LPA", match: 82, logo: "P", tint: "oklch(0.72 0.17 155)" },
];

export default function JobsPage() {
  const [salary, setSalary] = useState([30]);
  const [saved, setSaved] = useState<string[]>([]);
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {allJobs.length} openings · sorted by AI match
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Bookmark className="mr-1.5 h-3.5 w-3.5" /> Saved</Button>
          <Button size="sm"><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Improve matches</Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-2">
        <div className="flex flex-1 items-center gap-2 px-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles, companies, skills…"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <Button variant="outline" size="sm"><MapPin className="mr-1.5 h-3.5 w-3.5" /> Location</Button>
        <Button variant="outline" size="sm"><Building2 className="mr-1.5 h-3.5 w-3.5" /> Company</Button>
        <Button variant="outline" size="sm"><Filter className="mr-1.5 h-3.5 w-3.5" /> Role</Button>
        <Button variant="outline" size="sm"><SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" /> More</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="hidden lg:block">
          <div className="sticky top-[76px] space-y-5 rounded-xl border border-border bg-surface p-5">
            <div>
              <h4 className="mb-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Work mode</h4>
              <div className="space-y-2">
                {["Remote", "Hybrid", "Onsite"].map((m) => (
                  <label key={m} className="flex items-center gap-2 text-[13px]">
                    <Checkbox defaultChecked={m !== "Onsite"} /> {m}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Package (LPA)</h4>
                <span className="tabular-nums text-[12px] text-muted-foreground">₹{salary[0]}+</span>
              </div>
              <Slider value={salary} onValueChange={setSalary} min={5} max={100} step={5} />
            </div>
            <div>
              <h4 className="mb-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Experience</h4>
              <div className="space-y-2">
                {["Freshers", "1–2 years", "2–4 years"].map((e) => (
                  <label key={e} className="flex items-center gap-2 text-[13px]">
                    <Checkbox defaultChecked={e === "Freshers"} /> {e}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">AI match</h4>
              <div className="flex flex-wrap gap-1.5">
                {["80+", "85+", "90+", "95+"].map((v) => (
                  <Badge key={v} variant="outline" className="cursor-pointer hover:border-primary/60">
                    {v}%
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="space-y-3">
          {allJobs.map((j, i) => {
            const isSaved = saved.includes(j.id);
            return (
              <motion.article
                key={j.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: i * 0.02 }}
                className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-base font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${j.tint}, oklch(0.35 0.05 270))` }}
                  >
                    {j.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-medium">{j.role}</h3>
                      <span className="rounded-md bg-primary/12 px-1.5 py-0.5 text-[10.5px] font-medium text-primary">
                        {j.match}% match
                      </span>
                    </div>
                    <div className="mt-0.5 text-[13px] text-muted-foreground">
                      {j.company} · {j.location}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                      <span className="rounded-md bg-elevated px-1.5 py-0.5">{j.package}</span>
                      <span className="rounded-md bg-elevated px-1.5 py-0.5">Full-time</span>
                      <span className="rounded-md bg-elevated px-1.5 py-0.5">React · TypeScript · Postgres</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setSaved((prev) => (prev.includes(j.id) ? prev.filter((x) => x !== j.id) : [...prev, j.id]))
                      }
                      aria-label={isSaved ? "Unsave" : "Save"}
                    >
                      <Bookmark className={isSaved ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
                    </Button>
                    <Button size="sm">
                      Quick apply <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
