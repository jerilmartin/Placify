"use client";


import { Activity, CreditCard, Database, Key, ShieldCheck, Users } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Button } from "@/components/ui/button";



const usage = [
  { d: "Mon", v: 420 }, { d: "Tue", v: 480 }, { d: "Wed", v: 510 },
  { d: "Thu", v: 620 }, { d: "Fri", v: 720 }, { d: "Sat", v: 380 }, { d: "Sun", v: 210 },
];

const tenants = [
  { name: "IIT Bombay", plan: "Enterprise", seats: "12,400", mrr: "₹8.4L", status: "Healthy" },
  { name: "BITS Pilani", plan: "Enterprise", seats: "9,800", mrr: "₹6.2L", status: "Healthy" },
  { name: "NIT Trichy", plan: "Scale", seats: "6,100", mrr: "₹3.8L", status: "Attention" },
  { name: "IIIT Hyderabad", plan: "Scale", seats: "4,400", mrr: "₹2.9L", status: "Healthy" },
  { name: "VIT Vellore", plan: "Enterprise", seats: "18,600", mrr: "₹11.1L", status: "Healthy" },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Super Admin · placify.systems</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-[28px]">Platform control</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Audit log</Button>
          <Button size="sm">Add tenant</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Users, l: "Tenants", v: "42", d: "+3 this month" },
          { icon: Database, l: "Storage", v: "1.8 TB", d: "62% of quota" },
          { icon: Activity, l: "AI credits", v: "482k", d: "Rolls Nov 15" },
          { icon: CreditCard, l: "MRR", v: "₹1.14 Cr", d: "+9.4% MoM" },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.l} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.l}</div>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{k.v}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{k.d}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-medium">API usage · last 7 days</h3>
              <p className="text-[12px] text-muted-foreground">All tenants, requests in thousands</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-md bg-success/12 px-2 py-1 text-[11px] font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> All systems normal
            </span>
          </div>
          <div className="mt-3 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usage} margin={{ left: -10, right: 8 }}>
                <defs>
                  <linearGradient id="ug" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.68 0.19 285)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.68 0.19 285)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" stroke="oklch(0.68 0.02 270)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.19 0.017 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="oklch(0.68 0.19 285)" strokeWidth={2} fill="url(#ug)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-[14px] font-medium">Feature flags</h3>
          <ul className="mt-3 space-y-3 text-[13px]">
            {[
              { n: "AI Interview v3", s: "Beta · 4 tenants" },
              { n: "Compare offer letters", s: "On" },
              { n: "Recruiter LLM search", s: "On" },
              { n: "Mentor availability calendar", s: "Off" },
            ].map((f) => (
              <li key={f.n} className="flex items-center justify-between">
                <span>{f.n}</span>
                <span className="rounded-md bg-elevated px-1.5 py-0.5 text-[11px] text-muted-foreground">{f.s}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-elevated/40 p-3 text-[12px]">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span className="text-muted-foreground">SOC 2 Type II · valid until Feb 2027</span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-[14px] font-medium">Tenants</h3>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <Key className="h-3.5 w-3.5" /> API keys managed per tenant
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead className="bg-elevated/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left">Tenant</th>
                <th className="px-3 py-2.5 text-left">Plan</th>
                <th className="px-3 py-2.5 text-left">Seats</th>
                <th className="px-3 py-2.5 text-left">MRR</th>
                <th className="px-3 py-2.5 text-left">Status</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants.map((t) => (
                <tr key={t.name} className="hover:bg-elevated/60">
                  <td className="px-5 py-3 font-medium">{t.name}</td>
                  <td className="px-3 py-3"><span className="rounded bg-elevated px-1.5 py-0.5 text-[11px]">{t.plan}</span></td>
                  <td className="px-3 py-3 tabular-nums text-muted-foreground">{t.seats}</td>
                  <td className="px-3 py-3 tabular-nums">{t.mrr}</td>
                  <td className="px-3 py-3">
                    <span className={t.status === "Healthy" ? "rounded-md bg-success/12 px-1.5 py-0.5 text-[11px] text-success" : "rounded-md bg-warning/12 px-1.5 py-0.5 text-[11px] text-warning"}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right"><Button variant="ghost" size="sm">Manage</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
