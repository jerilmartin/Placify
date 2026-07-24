"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const packageDist = [
  { r: "5–10L", n: 142 },
  { r: "10–20L", n: 268 },
  { r: "20–35L", n: 185 },
  { r: "35–60L", n: 54 },
  { r: "60L+", n: 12 },
];

const sectors = [
  { name: "SaaS", v: 34, c: "oklch(0.68 0.19 285)" },
  { name: "Finance", v: 22, c: "oklch(0.72 0.14 235)" },
  { name: "Product", v: 18, c: "oklch(0.72 0.17 155)" },
  { name: "Consulting", v: 14, c: "oklch(0.80 0.16 75)" },
  { name: "Core", v: 12, c: "oklch(0.68 0.20 340)" },
];

const branches = [
  { b: "CSE", placed: 94, avg: 18.5 },
  { b: "ECE", placed: 88, avg: 14.2 },
  { b: "IT", placed: 91, avg: 16.0 },
  { b: "EEE", placed: 82, avg: 11.5 },
  { b: "Mech", placed: 75, avg: 9.2 },
];

export default function UniversityPage() {
  const { user } = useAuth();
  const [uniName, setUniName] = useState("Your University");
  const [stats, setStats] = useState({ totalDrives: 0, activeDrives: 0, totalRegistered: 0, totalSelected: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: up } = await supabase
        .from("university_profiles")
        .select("id, name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (up?.name) setUniName(up.name);
      if (up?.id) {
        const { data: drives } = await supabase
          .from("placement_drives")
          .select("status, total_registered, total_selected")
          .eq("university_id", up.id);
        if (drives) {
          setStats({
            totalDrives: drives.length,
            activeDrives: drives.filter(d => d.status === "active" || d.status === "upcoming").length,
            totalRegistered: drives.reduce((s, d) => s + (d.total_registered || 0), 0),
            totalSelected: drives.reduce((s, d) => s + (d.total_selected || 0), 0),
          });
        }
      }
    };
    load();
  }, [user]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Placement Cell · {uniName}</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-[28px]">Season 2025–26</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Export report</Button>
          <Button size="sm" asChild><Link href="/university/drives">New drive</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Total Drives", v: String(stats.totalDrives), d: `${stats.activeDrives} active/upcoming` },
          { l: "Registered", v: String(stats.totalRegistered), d: "across all drives" },
          { l: "Selected", v: String(stats.totalSelected), d: "students placed" },
          { l: "Placement %", v: stats.totalRegistered > 0 ? `${Math.round((stats.totalSelected / stats.totalRegistered) * 100)}%` : "—", d: "of registered" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-border bg-surface p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.l}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{k.v}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{k.d}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5">
          <h3 className="text-[14px] font-medium">Package distribution</h3>
          <p className="text-[12px] text-muted-foreground">Offers by CTC band</p>
          <div className="mt-3 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={packageDist} margin={{ left: -18 }}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="r" stroke="oklch(0.68 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.68 0.02 270)" fontSize={11} tickLine={false} axisLine={false} width={38} />
                <Tooltip contentStyle={{ background: "oklch(0.19 0.017 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="n" fill="oklch(0.68 0.19 285)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-[14px] font-medium">Sector breakdown</h3>
          <div className="mt-3 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sectors} dataKey="v" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {sectors.map((s) => <Cell key={s.name} fill={s.c} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.19 0.017 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5 text-[12px]">
            {sectors.map((s) => (
              <li key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: s.c }} /> {s.name}</span>
                <span className="tabular-nums text-muted-foreground">{s.v}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-[14px] font-medium">Branch comparison</h3>
          <div className="text-[12px] text-muted-foreground">Batch of 2026</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead className="bg-elevated/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left">Branch</th>
                <th className="px-3 py-2.5 text-left">Placed %</th>
                <th className="px-3 py-2.5 text-left">Avg. package</th>
                <th className="px-3 py-2.5 text-left">Progress</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {branches.map((b) => (
                <tr key={b.b} className="hover:bg-elevated/60">
                  <td className="px-5 py-3 font-medium">{b.b}</td>
                  <td className="px-3 py-3 tabular-nums">{b.placed}%</td>
                  <td className="px-3 py-3 tabular-nums">₹{b.avg}L</td>
                  <td className="px-3 py-3">
                    <div className="h-1.5 w-40 overflow-hidden rounded-full bg-elevated">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.55_0.20_235)]" style={{ width: `${b.placed}%` }} />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="sm">Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
