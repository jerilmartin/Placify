"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight, ArrowRight, Sparkles, Bot,
  Calendar, TrendingUp, CheckCircle2, Info, AlertTriangle, Plus,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, PolarAngleAxis, PolarGrid,
  Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const applicationTrend = [
  { d: "W1", applied: 1, interviews: 0 },
  { d: "W2", applied: 2, interviews: 1 },
  { d: "W3", applied: 4, interviews: 1 },
  { d: "W4", applied: 3, interviews: 2 },
  { d: "W5", applied: 6, interviews: 3 },
  { d: "W6", applied: 5, interviews: 2 },
  { d: "W7", applied: 8, interviews: 4 },
  { d: "W8", applied: 7, interviews: 5 },
];

const performanceRadar = [
  { axis: "Technical", A: 85 },
  { axis: "Communication", A: 90 },
  { axis: "Problem Solving", A: 80 },
  { axis: "System Design", A: 75 },
  { axis: "Behavioral", A: 88 },
  { axis: "Coding Speed", A: 82 },
];

interface StudentProfile {
  id: string;
  full_name: string;
  cgpa: number | null;
  active_backlogs: number | null;
  profile_completion: number;
  skills: string[] | null;
}

interface DriveApplication {
  id: string;
  status: string;
  placement_drives: {
    company_name: string;
    role: string | null;
    title: string;
    drive_date: string | null;
  } | null;
}

interface Drive {
  id: string;
  company_name: string;
  role: string | null;
  title: string;
  package_lpa: number | null;
  location: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [applications, setApplications] = useState<DriveApplication[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [trendData, setTrendData] = useState(applicationTrend);
  const [loading, setLoading] = useState(true);

  const firstName = profile?.full_name?.split(" ")[0] || user?.full_name?.split(" ")[0] || "there";

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // 1. Student profile
      const { data: sp } = await supabase
        .from("student_profiles")
        .select("id, full_name, cgpa, active_backlogs, profile_completion, skills")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(sp);

      // 2. Drive applications (with drive info joined)
      if (sp?.id) {
        const { data: apps } = await supabase
          .from("drive_applications")
          .select("id, status, placement_drives(company_name, role, title, drive_date)")
          .eq("student_id", sp.id)
          .order("registered_at", { ascending: false });
        setApplications((apps as unknown as DriveApplication[]) || []);
      }

      // 3. Recent available drives
      const { data: drivesData } = await supabase
        .from("placement_drives")
        .select("id, company_name, role, title, package_lpa, location")
        .in("status", ["active", "upcoming"])
        .order("created_at", { ascending: false })
        .limit(5);
      setDrives(drivesData || []);

      setLoading(false);
    };
    load();
  }, [user]);

  const kpis = [
    {
      label: "Profile Complete",
      value: String(profile?.profile_completion ?? 0),
      suffix: "%",
      delta: profile?.profile_completion === 100 ? "Complete!" : "Fill in profile",
      trend: (profile?.profile_completion ?? 0) >= 80 ? "up" : "flat",
      hint: "of required fields",
    },
    {
      label: "CGPA",
      value: profile?.cgpa != null ? String(profile.cgpa) : "—",
      suffix: "/10",
      delta: profile?.cgpa != null ? (profile.cgpa >= 7.5 ? "Good standing" : "Below 7.5") : "Add in profile",
      trend: (profile?.cgpa ?? 0) >= 7.5 ? "up" : "flat",
      hint: "academic score",
    },
    {
      label: "Applications",
      value: String(applications.length),
      suffix: "",
      delta: applications.filter((a) => a.status === "registered").length + " active",
      trend: "flat",
      hint: "to placement drives",
    },
    {
      label: "Skills",
      value: String(profile?.skills?.length ?? 0),
      suffix: "",
      delta: (profile?.skills?.length ?? 0) > 0 ? "Listed" : "Add skills",
      trend: (profile?.skills?.length ?? 0) > 0 ? "up" : "flat",
      hint: "on your profile",
    },
  ] as const;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

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
            Good morning, {firstName}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {applications.length > 0
              ? <>You have <span className="text-foreground">{applications.length} drive application{applications.length !== 1 ? "s" : ""}</span> tracked.</>
              : "Start by completing your profile and exploring placement drives."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/profile">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Update profile
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/student/jobs">
              <Bot className="mr-1.5 h-3.5 w-3.5" /> View drives
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
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{k.label}</div>
              <TrendingUp className={cn("h-3.5 w-3.5", k.trend === "up" ? "text-success" : "text-muted-foreground")} />
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">{k.value}</span>
              {k.suffix && <span className="text-sm text-muted-foreground">{k.suffix}</span>}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[12px]">
              <span className={cn("rounded-md px-1.5 py-0.5", k.trend === "up" ? "bg-success/12 text-success" : "bg-muted text-muted-foreground")}>
                {k.delta}
              </span>
              <span className="text-muted-foreground">{k.hint}</span>
            </div>
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
          </motion.div>
        ))}
      </div>

      {/* Profile completion banner if incomplete */}
      {(profile?.profile_completion ?? 0) < 60 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
          <Info className="h-4 w-4 text-warning shrink-0" />
          <p className="text-[13px] text-warning">
            Your profile is only <strong>{profile?.profile_completion ?? 0}%</strong> complete. Fill in your CGPA, skills, and course to unlock drive eligibility checks.
          </p>
          <Button size="sm" asChild className="ml-auto shrink-0">
            <Link href="/student/profile">Complete profile</Link>
          </Button>
        </div>
      )}

      {/* Visual Analytics Row */}
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
          <div className="mt-4 h-[220px]">
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
          <h3 className="text-[15px] font-medium">Interview readiness</h3>
          <p className="text-[12px] text-muted-foreground">Skill radar evaluation</p>
          <div className="mt-2 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={performanceRadar} outerRadius="70%">
                <PolarGrid stroke="oklch(1 0 0 / 0.08)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "oklch(0.68 0.02 270)", fontSize: 10 }} />
                <Radar dataKey="A" stroke="oklch(0.68 0.19 285)" fill="oklch(0.68 0.19 285)" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Applications list */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-[15px] font-medium">My Applications</h3>
              <p className="text-[12px] text-muted-foreground">Drives you have applied to</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/applications">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-5 py-10 text-center">
              <p className="text-[14px] text-muted-foreground">No applications yet.</p>
              <Button size="sm" asChild>
                <Link href="/student/jobs">Browse placement drives</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {applications.slice(0, 5).map((a) => (
                <li key={a.id} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-elevated/60">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                    {(a.placement_drives?.company_name?.[0] || "D").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium">{a.placement_drives?.company_name || "Drive"}</div>
                    <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
                      {a.placement_drives?.role || a.placement_drives?.title}
                    </div>
                  </div>
                  <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium",
                    a.status === "selected" ? "bg-success/10 text-success" :
                    a.status === "rejected" ? "bg-destructive/10 text-destructive" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Available drives */}
        <div className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-[15px] font-medium">Open Drives</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/jobs">All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          {drives.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 px-5 text-center">
              <p className="text-[13px] text-muted-foreground">No open drives right now.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {drives.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-elevated/60 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[12px] font-semibold text-primary">
                    {d.company_name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{d.company_name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{d.role || d.title}</div>
                  </div>
                  {d.package_lpa && (
                    <span className="shrink-0 text-[12px] font-medium text-foreground">₹{d.package_lpa}L</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Skills showcase */}
      {(profile?.skills?.length ?? 0) > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-5">
          <h3 className="text-[15px] font-medium mb-3">Your Skills</h3>
          <div className="flex flex-wrap gap-2">
            {profile!.skills!.map((s) => (
              <span key={s} className="rounded-md border border-border bg-elevated px-2.5 py-0.5 text-[12.5px] text-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI career suggestion card */}
      <div className="mt-4 relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/12 via-surface to-surface p-5">
        <div className="aurora opacity-40" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
            <Sparkles className="h-3 w-3" /> Career AI
          </div>
          <h3 className="mt-3 text-[16px] font-medium leading-snug">
            Complete your profile to get personalised career recommendations.
          </h3>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Add your CGPA, skills, and work experience to unlock AI-powered job matching and eligibility checks for placement drives.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link href="/student/profile">Update Profile <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/student/jobs">Browse Drives</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
