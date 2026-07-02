"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Users, Building2, ShieldCheck, Sparkles, Video } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const portals = [
  { key: "student", label: "Student", icon: GraduationCap, email: "student@placify.com" },
  { key: "recruiter", label: "Recruiter", icon: Users, email: "recruiter@placify.com" },
  { key: "university", label: "Placement Officer", icon: Building2, email: "university@placify.com" },
  { key: "mentor", label: "Mentor", icon: Video, email: "mentor@placify.com" },
];

export default function Login() {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("student@placify.com");
  const [password, setPassword] = useState("demo1234");
  const router = useRouter();
  const { login, isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "student") router.replace("/student/dashboard");
      else if (user.role === "recruiter") router.replace("/recruiter/dashboard");
      else if (user.role === "university" || user.role === "placement_officer") router.replace("/university/dashboard");
      else if (user.role === "mentor") router.replace("/mentor/dashboard");
    }
  }, [isAuthenticated, user, router]);

  const handleRoleSelect = (key: string, defaultEmail: string) => {
    setRole(key);
    setEmail(defaultEmail);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err: any) {
      toast.error(err.message || "Failed to login");
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background text-foreground lg:grid-cols-[1.05fr_1fr]">
      {/* Form */}
      <div className="flex flex-col p-6 md:p-10">
        <Link href="/"><BrandLockup /></Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your Placify workspace.
            </p>

            <div className="mt-8 grid grid-cols-4 gap-1.5 rounded-lg border border-border bg-surface p-1">
              {portals.map((p) => {
                const Icon = p.icon;
                const active = role === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => handleRoleSelect(p.key, p.email)}
                    type="button"
                    className={`group flex flex-col items-center gap-1 rounded-md px-1.5 py-2 text-[11px] transition-colors ${
                      active ? "bg-elevated text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-label={p.label}
                    title={p.label}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? "text-primary" : ""}`} />
                    <span className="hidden truncate md:inline">{p.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@iitb.ac.in" 
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-[12px] text-muted-foreground hover:text-foreground">
                    Forgot?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : <>Continue <ArrowRight className="ml-1.5 h-4 w-4" /></>}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" type="button">SSO · Google</Button>
              <Button variant="outline" type="button">SSO · Microsoft</Button>
            </div>

            <p className="mt-6 text-center text-[12px] text-muted-foreground">
              Demo access: use the role tabs above to automatically fill the demo credentials for each portal.
            </p>
          </motion.div>
        </div>
        <div className="text-[12px] text-muted-foreground">© 2026 Placify</div>
      </div>

      {/* Right: brand panel */}
      <div className="relative hidden overflow-hidden border-l border-border bg-surface lg:block">
        <div className="aurora opacity-80" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Placement OS · v4.2
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              Every offer letter starts with a great match.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Placify runs India's most active placement cells — one workspace for
              students, recruiters, and campus leadership.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { k: "92%", l: "Placement rate" },
              { k: "₹34L", l: "Avg. package" },
              { k: "450+", l: "Recruiters" },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-border bg-background/40 p-4 backdrop-blur">
                <div className="text-2xl font-semibold tracking-tight">{s.k}</div>
                <div className="mt-1 text-[11.5px] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
