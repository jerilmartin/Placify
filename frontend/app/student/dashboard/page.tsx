"use client";

import { useEffect, useState } from "react";
import { analyticsApi, aiApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { cn, formatPackage, getRiskColor, getStatusColor } from "@/lib/utils";
import type { StudentDashboardStats, PlacementRisk, ProfileStrength } from "@/lib/types";
import {
  LayoutDashboard, Briefcase, ClipboardList, TrendingUp,
  MessageSquare, ChevronRight, Zap, Target, Award, AlertTriangle
} from "lucide-react";
import { isDemoMode, MOCK_DASHBOARD_STATS, MOCK_PLACEMENT_RISK, MOCK_PROFILE_STRENGTH } from "@/lib/mock-data";
import Link from "next/link";

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="glass p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function ProfileStrengthCard({ data }: { data: ProfileStrength | null }) {
  if (!data) return null;
  return (
    <div className="glass p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" /> Profile Strength
        </h3>
        <span className={`text-sm font-bold ${data.overall_score >= 80 ? "text-emerald-400" : data.overall_score >= 50 ? "text-amber-400" : "text-red-400"}`}>
          {data.level}
        </span>
      </div>

      {/* Overall progress */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Overall</span>
          <span>{data.overall_score}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-700"
            style={{ width: `${data.overall_score}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2.5">
        {data.sections.map((s) => (
          <div key={s.section}>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{s.label}</span>
              <span>{s.score}/{s.max_score}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                style={{ width: `${s.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {data.next_milestone && data.next_milestone.points_needed > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="text-xs text-amber-300 font-medium">{data.next_milestone.label}</div>
          <div className="text-xs text-slate-400 mt-0.5">{data.next_milestone.tip}</div>
        </div>
      )}
    </div>
  );
}

function RiskCard({ data }: { data: PlacementRisk | null }) {
  if (!data) return null;
  const color = getRiskColor(data.risk_level);
  return (
    <div className="glass p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-purple-400" />
        <h3 className="font-semibold text-white">Placement Probability</h3>
      </div>
      <div className="flex items-center gap-4 mb-5">
        <div className="text-5xl font-extrabold gradient-text">{data.probability}%</div>
        <div>
          <div className={`text-sm font-bold ${color}`}>{data.risk_level} Risk</div>
          <div className="text-xs text-slate-500 mt-0.5">AI Prediction</div>
        </div>
      </div>
      {data.top_improvements.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Improve to boost
          </div>
          {data.top_improvements.map((tip, i) => (
            <div key={i} className="text-xs text-slate-400 flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>{tip}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const quickLinks = [
  { href: "/student/resume", label: "Upload Resume", desc: "Parse & auto-fill", icon: "📄", color: "hover:border-purple-500/40" },
  { href: "/student/jobs", label: "View Matches", desc: "AI-sorted jobs", icon: "🎯", color: "hover:border-blue-500/40" },
  { href: "/student/interview", label: "Mock Interview", desc: "Practice with AI", icon: "🤖", color: "hover:border-cyan-500/40" },
  { href: "/student/career", label: "Career Guidance", desc: "Ask AI mentor", icon: "💡", color: "hover:border-amber-500/40" },
];

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [risk, setRisk] = useState<PlacementRisk | null>(null);
  const [strength, setStrength] = useState<ProfileStrength | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setStats(MOCK_DASHBOARD_STATS);
      setRisk(MOCK_PLACEMENT_RISK);
      setStrength(MOCK_PROFILE_STRENGTH);
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const [statsRes, riskRes, strengthRes] = await Promise.allSettled([
          analyticsApi.studentOverview(),
          aiApi.placementRisk(),
          aiApi.profileStrength(),
        ]);
        if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
        if (riskRes.status === "fulfilled") setRisk(riskRes.value.data);
        if (strengthRes.status === "fulfilled") setStrength(strengthRes.value.data);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
    </div>
  );

  const appStats = stats?.applications;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </div>
        <h1 className="text-2xl font-bold text-white">
          Good day, <span className="gradient-text">{user?.full_name?.split(" ")[0] ?? "Student"}</span> 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here's your placement journey at a glance.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-up delay-100">
        <StatCard icon={ClipboardList} label="Applications" value={appStats?.total ?? 0} sub={`${appStats?.by_status?.shortlisted ?? 0} shortlisted`} color="bg-blue-500/20 text-blue-400" />
        <StatCard icon={Briefcase} label="Job Matches" value={stats?.job_matches.total ?? 0} sub={`Avg ${stats?.job_matches.avg_score ?? 0}% match`} color="bg-purple-500/20 text-purple-400" />
        <StatCard icon={MessageSquare} label="Interviews" value={stats?.interviews.completed ?? 0} sub={`${stats?.interviews.total ?? 0} total sessions`} color="bg-cyan-500/20 text-cyan-400" />
        <StatCard icon={TrendingUp} label="Profile" value={`${stats?.profile_completion ?? 0}%`} sub="completion" color="bg-emerald-500/20 text-emerald-400" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 animate-fade-up delay-200">
        {quickLinks.map((l) => (
          <Link key={l.href} href={l.href}
            className={cn("glass p-4 card-hover border border-white/5 transition-all", l.color)}>
            <div className="text-2xl mb-2">{l.icon}</div>
            <div className="font-medium text-sm text-white">{l.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{l.desc}</div>
            <ChevronRight className="w-3 h-3 text-slate-600 mt-2" />
          </Link>
        ))}
      </div>

      {/* Analytics row */}
      <div className="grid lg:grid-cols-2 gap-5 animate-fade-up delay-300">
        <ProfileStrengthCard data={strength} />
        <RiskCard data={risk} />
      </div>
    </div>
  );
}
