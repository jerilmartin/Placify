"use client";


import { useState } from "react";
import { Bell, Lock, Palette, Globe, Smartphone, CreditCard, User, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";



const sections = [
  { key: "profile", icon: User, label: "Profile" },
  { key: "security", icon: Lock, label: "Security" },
  { key: "notifications", icon: Bell, label: "Notifications" },
  { key: "appearance", icon: Palette, label: "Appearance" },
  { key: "language", icon: Globe, label: "Language" },
  { key: "devices", icon: Smartphone, label: "Devices & sessions" },
  { key: "api", icon: KeyRound, label: "API" },
  { key: "billing", icon: CreditCard, label: "Billing" },
];

export default function SettingsPage() {
  const [active, setActive] = useState("profile");

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your student profile preferences, security, and notification triggers.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors",
                  isActive ? "border-l-2 border-[#D4AF37] bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-[#D4AF37]" : "text-muted-foreground")} />
                {s.label}
              </button>
            );
          })}
        </nav>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sharp">
          {active === "profile" && (
            <div className="max-w-lg space-y-5">
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">Profile Information</h2>
                <p className="text-[13px] text-muted-foreground">How you appear across Placify.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0A192F] text-lg font-serif font-bold text-[#D4AF37] border border-[#162740] shadow-sharp">
                  AS
                </div>
                <Button variant="outline" size="sm">Change avatar</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>First name</Label><Input defaultValue="Aarav" /></div>
                <div className="space-y-1.5"><Label>Last name</Label><Input defaultValue="Sharma" /></div>
              </div>
              <div className="space-y-1.5"><Label>Email</Label><Input defaultValue="aarav.s@iitb.ac.in" /></div>
              <div className="space-y-1.5"><Label>Handle</Label><Input defaultValue="aarav.sharma" /></div>
              <Button>Save changes</Button>
            </div>
          )}
          {active === "notifications" && (
            <div className="max-w-lg space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Notifications</h2>
                <p className="text-[13px] text-muted-foreground">Choose what you want to hear about.</p>
              </div>
              {[
                { l: "New AI matches", d: "When a role above 90% match appears", on: true },
                { l: "Application updates", d: "Recruiter actions and stage changes", on: true },
                { l: "Interview reminders", d: "24h and 1h before your slot", on: true },
                { l: "Weekly digest", d: "Placement summary every Friday", on: false },
              ].map((n) => (
                <div key={n.l} className="flex items-center justify-between border-b border-border pb-4 last:border-none">
                  <div>
                    <div className="text-[14px]">{n.l}</div>
                    <div className="text-[12px] text-muted-foreground">{n.d}</div>
                  </div>
                  <Switch defaultChecked={n.on} />
                </div>
              ))}
            </div>
          )}
          {active !== "profile" && active !== "notifications" && (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-elevated text-muted-foreground">
                <Palette className="h-4 w-4" />
              </div>
              <h3 className="text-[15px] font-medium capitalize">{active} settings</h3>
              <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">
                This section is styled and wired but doesn't have live data in the demo.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
