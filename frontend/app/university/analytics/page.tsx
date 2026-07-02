"use client";

import { useEffect, useState } from "react";
import { universitiesApi } from "@/lib/api";
import { BarChart3, TrendingUp, Users, CalendarDays, Loader2, RefreshCw, Award, PieChart as PieIcon, LineChart as LineIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { isDemoMode, MOCK_UNIVERSITY_ANALYTICS } from "@/lib/mock-data";

// Dynamically import Recharts to avoid SSR hydration mismatches in Next.js
const BarChart = dynamic(() => import("recharts").then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(mod => mod.ResponsiveContainer), { ssr: false });
const AreaChart = dynamic(() => import("recharts").then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then(mod => mod.Area), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(mod => mod.Cell), { ssr: false });

export default function UniversityAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    if (isDemoMode()) {
      setAnalytics(MOCK_UNIVERSITY_ANALYTICS);
      setLoading(false);
      return;
    }
    try {
      const res = await universitiesApi.getAnalytics();
      setAnalytics(res.data || null);
    } catch {
      toast.error("Failed to load placement analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchAnalytics();
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#0a0a0f]" />;
  }

  // Fallback / standard dummy values if backend analytics endpoints are stubbed
  const stats = [
    { label: "Total Placement Drives", value: analytics?.total_drives ?? 12, icon: CalendarDays, color: "text-emerald-400 bg-emerald-500/10" },
    { label: "Total Students Placed", value: analytics?.total_placed ?? 142, icon: Users, color: "text-blue-400 bg-blue-500/10" },
    { label: "Placement Success Rate", value: `${analytics?.placement_rate ?? 84.5}%`, icon: TrendingUp, color: "text-purple-400 bg-purple-500/10" },
    { label: "Average Package (LPA)", value: `₹${analytics?.average_package_lpa ?? 8.2}L`, icon: Award, color: "text-amber-400 bg-amber-500/10" },
  ];

  // Dummy placement charts data if API lacks full breakdown
  const packageData = analytics?.packages_by_branch ?? [
    { name: "CSE", avg: 12.5, max: 45.0 },
    { name: "IT", avg: 10.2, max: 28.5 },
    { name: "ECE", avg: 8.4, max: 18.0 },
    { name: "EEE", avg: 7.2, max: 12.0 },
    { name: "ME", avg: 5.8, max: 9.5 },
    { name: "CE", avg: 5.2, max: 8.0 },
  ];

  const placementTimeline = analytics?.placements_timeline ?? [
    { month: "Jan", count: 12 },
    { month: "Feb", count: 24 },
    { month: "Mar", count: 48 },
    { month: "Apr", count: 76 },
    { month: "May", count: 110 },
    { month: "Jun", count: 142 },
  ];

  const sectorBreakdown = analytics?.sector_breakdown ?? [
    { name: "Product Dev", value: 45 },
    { name: "Consulting", value: 25 },
    { name: "FinTech", value: 20 },
    { name: "Core Eng", value: 10 },
  ];

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><BarChart3 className="w-4 h-4" /> Reporting</div>
          <h1 className="text-2xl font-bold text-white">Placement Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Review campus hiring trends, package statistics, and department breakdowns.</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/5 transition-all"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-slate-500 text-sm">Computing analytics metrics...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="glass p-5 flex flex-col justify-between border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{s.label}</span>
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", s.color)}>
                    <s.icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Package Trends by Branch (Bar Chart) */}
            <div className="lg:col-span-2 glass p-5 border border-white/5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-400" /> Package Distribution by Department
                </h3>
                <p className="text-xs text-slate-500 mb-4">Comparison of Average vs Highest packages (LPA) across engineering fields.</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={packageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f0f15", borderColor: "#2a2a35", borderRadius: "8px" }}
                      labelStyle={{ color: "#ffffff", fontSize: "11px", fontWeight: "bold" }}
                      itemStyle={{ fontSize: "11px" }}
                    />
                    <Bar dataKey="avg" name="Avg Package (LPA)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="max" name="Max Package (LPA)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Placed Sector Distribution (Pie Chart) */}
            <div className="glass p-5 border border-white/5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-indigo-400" /> Sector Demographics
                </h3>
                <p className="text-xs text-slate-500 mb-4">Breakdown of student hires mapped to industry profiles.</p>
              </div>
              <div className="h-48 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sectorBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f0f15", borderColor: "#2a2a35", borderRadius: "8px" }}
                      itemStyle={{ fontSize: "11px", color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                {sectorBreakdown.map((item: any, i: number) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate">{item.name}: <b>{item.value}%</b></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hiring Timeline Area Chart */}
          <div className="glass p-5 border border-white/5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">
                <LineIcon className="w-4 h-4 text-purple-400" /> Placement Progress Timeline
              </h3>
              <p className="text-xs text-slate-500 mb-4">Cumulative number of student placement offers accepted over the active drive season.</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={placementTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f0f15", borderColor: "#2a2a35", borderRadius: "8px" }}
                    labelStyle={{ color: "#ffffff", fontSize: "11px", fontWeight: "bold" }}
                    itemStyle={{ fontSize: "11px", color: "#8884d8" }}
                  />
                  <Area type="monotone" dataKey="count" name="Placed Students" stroke="#8884d8" strokeWidth={2} fillOpacity={1} fill="url(#colorPlacements)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
