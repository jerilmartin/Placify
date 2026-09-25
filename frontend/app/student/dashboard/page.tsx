"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, Bot,
  TrendingUp, CheckCircle2, Info,
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
import { aiApi, interviewAppointmentsApi } from "@/lib/api";
import type { InterviewAppointment } from "@/lib/types";

// Default empty trend (8 weeks of zeroes) — overwritten with real data on load
const EMPTY_TREND = Array.from({ length: 8 }, (_, i) => ({ d: `W${i + 1}`, applied: 0, interviews: 0 }));

// Default radar — overwritten if interview history exists
const DEFAULT_RADAR = [
  { axis: "Technical", A: 0 },
  { axis: "Communication", A: 0 },
  { axis: "Problem Solving", A: 0 },
  { axis: "System Design", A: 0 },
  { axis: "Behavioral", A: 0 },
  { axis: "Coding Speed", A: 0 },
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
  registered_at?: string;
  created_at?: string;
  placement_drives: {
    company_name: string;
    role: string | null;
    title: string;
    drive_date: string | null;
  } | null;
}

interface PlacementRisk {
  risk_level?: string;
  probability?: number;
  placement_probability?: number;
  factors?: Record<string, number>;
  top_improvements?: string[];
  tips?: string[];
}

interface StrengthSection {
  section?: string;
  label?: string;
  score: number;
  max_score: number;
  percentage: number;
}

interface ProfileStrength {
  level?: string;
  overall_score?: number;
  sections?: StrengthSection[] | Record<string, number>;
}

interface PracticeInterview {
  interview_type?: string;
  responses?: Array<{ evaluation?: { score?: number } }>;
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
  const [appointments, setAppointments] = useState<InterviewAppointment[]>([]);
  const [trendData, setTrendData] = useState(EMPTY_TREND);
  const [radarData, setRadarData] = useState(DEFAULT_RADAR);
  const [loading, setLoading] = useState(true);
  const [placementRisk, setPlacementRisk] = useState<PlacementRisk | null>(null);
  const [profileStrength, setProfileStrength] = useState<ProfileStrength | null>(null);

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
          .select("id, status, registered_at, placement_drives(company_name, role, title, drive_date)")
          .eq("student_id", sp.id)
          .order("registered_at", { ascending: false });
        const realApps = (apps as unknown as DriveApplication[]) || [];
        setApplications(realApps);
        const scheduledAppointments: InterviewAppointment[] = await interviewAppointmentsApi.forStudent()
          .then(({ data }) => data || [])
          .catch(() => []);
        setAppointments(scheduledAppointments);

        // Compute application trend (last 8 weeks from real timestamps)
        if (realApps.length > 0 || scheduledAppointments.length > 0) {
          const now = new Date();
          const weekTrend = Array.from({ length: 8 }, (_, i) => ({
            d: `W${8 - i}`,
            weekStart: new Date(now.getTime() - (7 - i) * 7 * 24 * 60 * 60 * 1000),
            weekEnd: new Date(now.getTime() - (6 - i) * 7 * 24 * 60 * 60 * 1000),
          }));
          const trendArr = weekTrend.map((w) => ({
            d: w.d,
            applied: realApps.filter((a) => {
              const t = new Date(a.registered_at || a.created_at || 0);
              return t >= w.weekStart && t < w.weekEnd;
            }).length,
            interviews: scheduledAppointments.filter((appointment) => {
              const time = new Date(appointment.starts_at);
              return appointment.status !== "cancelled" && time >= w.weekStart && time < w.weekEnd;
            }).length,
          }));
          setTrendData(trendArr);
        }

        // Fetch interview scores for radar
        const { data: interviews } = await supabase
          .from("interviews")
          .select("interview_type, responses, feedback")
          .eq("student_id", sp.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(10);

        if (interviews && interviews.length > 0) {
          // Average scores per interview type from response evaluations
          const typeScores: Record<string, number[]> = {
            technical: [], behavioral: [], system_design: [], hr: []
          };
          (interviews as PracticeInterview[]).forEach((iv) => {
            const responses = iv.responses || [];
            const scores = responses.map((r) => r?.evaluation?.score || 0).filter(Boolean);
            if (scores.length > 0) {
              const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
              const type = iv.interview_type || "technical";
              if (typeScores[type]) typeScores[type].push(avg);
            }
          });
          const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
          const techScore = avg(typeScores["technical"]);
          const behScore = avg(typeScores["behavioral"]);
          const sysScore = avg(typeScores["system_design"]);
          const hrScore = avg(typeScores["hr"]);
          // Only update radar if we have actual data
          if (techScore + behScore + sysScore + hrScore > 0) {
            setRadarData([
              { axis: "Technical", A: techScore || 0 },
              { axis: "Communication", A: hrScore || behScore || 0 },
              { axis: "Problem Solving", A: techScore || 0 },
              { axis: "System Design", A: sysScore || 0 },
              { axis: "Behavioral", A: behScore || 0 },
              { axis: "Coding Speed", A: techScore || 0 },
            ]);
          }
        }
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

      // Fetch AI-powered insights in background (don't block main load)
      aiApi.placementRisk().then(r => setPlacementRisk(r.data)).catch(() => {});
      aiApi.profileStrength().then(r => setProfileStrength(r.data)).catch(() => {});
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
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="mt-1 font-display text-2xl font-medium tracking-tight md:text-[30px] text-foreground">
            Good morning, {firstName}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {applications.length > 0
              ? <>You have <span className="font-semibold text-foreground">{applications.length} drive application{applications.length !== 1 ? "s" : ""}</span> tracked.</>
              : "Start by completing your profile and exploring placement drives."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/profile">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" /> Update profile
            </Link>
          </Button>
          <Button size="sm" asChild className="bg-primary text-primary-foreground hover:bg-[#660019]">
            <Link href="/student/jobs">
              <Bot className="mr-1.5 h-3.5 w-3.5" /> View drives
            </Link>
          </Button>
        </div>
      </motion.div>

      {appointments.some((appointment) => appointment.status === "scheduled" && new Date(appointment.starts_at) >= new Date()) && <div className="mb-6 rounded-lg border border-primary/25 bg-card p-4 shadow-sharp"><div className="text-xs font-semibold uppercase tracking-wider text-primary">Next recruiter interview</div>{appointments.filter((appointment) => appointment.status === "scheduled" && new Date(appointment.starts_at) >= new Date()).sort((a, b) => a.starts_at.localeCompare(b.starts_at)).slice(0, 1).map((appointment) => <div key={appointment.id} className="mt-1 flex flex-wrap items-center justify-between gap-3"><p className="text-sm"><span className="font-semibold">{appointment.company_name} · {appointment.role_title}</span> — {new Date(appointment.starts_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p><Link href="/student/applications" className="text-sm font-semibold text-primary hover:underline">View details →</Link></div>)}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
            className="group rounded-lg border border-border bg-card p-4 shadow-sharp transition-colors hover:border-border/90"
          >
            <div className="flex items-start justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{k.label}</div>
              <TrendingUp className={cn("h-3.5 w-3.5", k.trend === "up" ? "text-success" : "text-muted-foreground")} />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="font-display text-3xl font-semibold tracking-tight tabular-nums text-foreground">{k.value}</span>
              {k.suffix && <span className="text-sm font-medium text-muted-foreground">{k.suffix}</span>}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11.5px]">
              <span className={cn(
                "rounded px-1.5 py-0.5 font-medium",
                k.trend === "up" ? "border border-[#E8D9A8] bg-[#FCF9EE] text-[#785A00]" : "bg-muted text-muted-foreground"
              )}>
                {k.delta}
              </span>
              <span className="text-muted-foreground truncate">{k.hint}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Profile completion banner if incomplete */}
      {(profile?.profile_completion ?? 0) < 60 && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
          <Info className="h-4 w-4 text-warning shrink-0" />
          <p className="text-[13px] text-foreground">
            Your profile is only <strong>{profile?.profile_completion ?? 0}%</strong> complete. Fill in your CGPA, skills, and course to unlock drive eligibility checks.
          </p>
          <Button size="sm" asChild className="ml-auto shrink-0 bg-primary text-primary-foreground hover:bg-[#660019]">
            <Link href="/student/profile">Complete profile</Link>
          </Button>
        </div>
      )}

      {/* Visual Analytics Row */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Chart card */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5 shadow-sharp">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-[16px] font-semibold text-foreground">Application Activity</h3>
              <p className="text-[12px] text-muted-foreground">Applications sent vs. interviews scheduled · last 8 weeks</p>
            </div>
            <div className="flex items-center gap-3 text-[11.5px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#800020]" /> Applied</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#0A192F]" /> Interviews</span>
            </div>
          </div>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#800020" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#800020" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0A192F" stopOpacity={0.20} />
                    <stop offset="100%" stopColor="#0A192F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E5E0D8" vertical={false} />
                <XAxis dataKey="d" stroke="#78716C" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#78716C" fontSize={11} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #E5E0D8",
                    borderRadius: 6,
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(10,25,47,0.06)",
                    color: "#1C1917",
                  }}
                />
                <Area type="monotone" dataKey="applied" stroke="#800020" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="interviews" stroke="#0A192F" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sharp">
          <h3 className="font-display text-[16px] font-semibold text-foreground">Interview Readiness</h3>
          <p className="text-[12px] text-muted-foreground">Based on completed mock assessment scores</p>
          {radarData.every(d => d.A === 0) ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center gap-2">
              <p className="text-[13px] text-muted-foreground">No interview data yet.</p>
              <Link href="/student/interview" className="text-[12px] font-semibold text-primary hover:underline">Start a mock interview →</Link>
            </div>
          ) : (
            <div className="mt-2 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="#E5E0D8" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: "#78716C", fontSize: 10 }} />
                  <Radar dataKey="A" stroke="#800020" fill="#D4AF37" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
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

      {/* Placement outlook + profile strength */}
      {(placementRisk || profileStrength) && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Placement Risk */}
          {placementRisk && (
            <div className={`rounded-xl border p-5 ${
              placementRisk.risk_level === 'Low' ? 'border-success/30 bg-success/5'
              : placementRisk.risk_level === 'Medium' ? 'border-warning/30 bg-warning/5'
              : 'border-destructive/30 bg-destructive/5'
            }`}>
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wider font-medium opacity-70">Placement outlook</div>
                <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                  placementRisk.risk_level === 'Low' ? 'bg-success/15 text-success'
                  : placementRisk.risk_level === 'Medium' ? 'bg-warning/15 text-warning'
                  : 'bg-destructive/15 text-destructive'
                }`}>{placementRisk.risk_level} Risk</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold tabular-nums">
                  {placementRisk.probability ?? placementRisk.placement_probability ?? '—'}
                </span>
                <span className="text-muted-foreground">% placement probability</span>
              </div>
              <Progress value={placementRisk.probability ?? placementRisk.placement_probability ?? 0} className="mt-3 h-1.5" />
              {placementRisk.factors && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                  {Object.entries(placementRisk.factors as Record<string, number>).map(([label, value]) => (
                    <div key={label} className="rounded-md border border-border/60 bg-background/50 px-2 py-1.5">
                      <span className="capitalize text-muted-foreground">{label.replaceAll("_", " ")}</span>
                      <span className="float-right font-medium">{Number(value).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              )}
              {((placementRisk.top_improvements?.length ?? 0) > 0 || (placementRisk.tips?.length ?? 0) > 0) && (
                <ul className="mt-4 space-y-1.5">
                  {(placementRisk.top_improvements || placementRisk.tips || []).slice(0, 3).map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-[12.5px]">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Profile Strength */}
          {profileStrength && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Profile strength</div>
                <div className="flex items-center gap-2">
                  {profileStrength.level && (
                    <span className="text-[11px] font-medium text-muted-foreground">{profileStrength.level}</span>
                  )}
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-semibold text-primary">
                    {profileStrength.overall_score ?? 0}/100
                  </span>
                </div>
              </div>
              <Progress value={profileStrength.overall_score ?? 0} className="mt-3 h-1.5" />
              <div className="mt-4 space-y-2.5">
                {Array.isArray(profileStrength.sections) ? (
                  profileStrength.sections.map((sec: StrengthSection) => (
                    <div key={sec.section || sec.label}>
                      <div className="mb-1 flex justify-between text-[12px]">
                        <span className="text-muted-foreground">{sec.label || sec.section}</span>
                        <span className="tabular-nums font-medium text-foreground">
                          {sec.score}/{sec.max_score} ({sec.percentage}%)
                        </span>
                      </div>
                      <Progress value={sec.percentage ?? 0} className="h-1" />
                    </div>
                  ))
                ) : profileStrength.sections && typeof profileStrength.sections === 'object' ? (
                  Object.entries(profileStrength.sections as Record<string, number>).map(([k, v]) => (
                    <div key={k}>
                      <div className="mb-1 flex justify-between text-[12px]">
                        <span className="capitalize text-muted-foreground">{k.replace(/_/g, ' ')}</span>
                        <span className="tabular-nums font-medium">{typeof v === 'number' ? v : JSON.stringify(v)}</span>
                      </div>
                      <Progress value={typeof v === 'number' ? v : 0} className="h-1" />
                    </div>
                  ))
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Career Guidance card */}
      <div className="mt-4 rounded-lg border border-border bg-card p-6 shadow-sharp">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> Career Advisory
          </span>
        </div>
        <h3 className="font-display mt-3 text-[17px] font-semibold leading-snug text-foreground">
          Complete your profile to unlock verified job matching.
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground max-w-2xl">
          Add your verified CGPA, skills, and projects to automatically evaluate eligibility for active placement drives.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button size="sm" asChild className="bg-primary text-primary-foreground hover:bg-[#660019]">
            <Link href="/student/profile">Update Profile <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/student/jobs">Browse Placement Drives</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
