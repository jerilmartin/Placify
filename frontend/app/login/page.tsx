"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Users, Building2, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

import type { UserRole } from "@/lib/types";

const portals: { key: UserRole; label: string; description: string; icon: typeof GraduationCap }[] = [
  { key: "student", label: "Student", description: "Applications and placement preparation", icon: GraduationCap },
  { key: "recruiter", label: "Recruiter", description: "Hiring drives and candidate shortlisting", icon: Users },
  { key: "university", label: "Placement Cell", description: "Campus drives and institutional operations", icon: Building2 },
];

const ROLE_ROUTES: Record<string, string> = {
  student: "/student/dashboard",
  recruiter: "/recruiter/dashboard",
  university: "/university/dashboard",
  placement_officer: "/university/dashboard",
  admin: "/admin/dashboard",
  mentor: "/mentor/dashboard",
};

export default function Login() {
  const [role, setRole] = useState<UserRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const signedInUser = await login(email, password, role);
      router.push(ROLE_ROUTES[signedInUser.role] ?? "/student/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background text-foreground lg:grid-cols-[1.05fr_1fr]">
      {/* Form Panel */}
      <div className="flex flex-col p-6 md:p-12">
        <Link href="/"><BrandLockup /></Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your Placify institutional workspace.
            </p>

            <div className="mt-7 grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/60 p-1" role="tablist" aria-label="Choose your portal">
              {portals.map((p) => {
                const Icon = p.icon;
                const active = role === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setRole(p.key)}
                    className={`group flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-card text-foreground shadow-xs border-b-2 border-[#D4AF37]"
                        : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                    }`}
                    role="tab"
                    aria-selected={active}
                    aria-label={p.label}
                    title={p.label}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {portals.find((portal) => portal.key === role)?.description}
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-card border-border"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                  <a href="#" className="text-[12px] text-muted-foreground hover:text-foreground">
                    Forgot?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-card border-border"
                />
              </div>

              {error && (
                <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-[12.5px] font-medium text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-10 mt-2 bg-primary text-primary-foreground hover:bg-[#660019]" disabled={loading}>
                {loading ? "Signing in…" : <>Continue to {portals.find((portal) => portal.key === role)?.label} <ArrowRight className="ml-1.5 h-4 w-4" /></>}
              </Button>
            </form>

            <p className="mt-6 text-center text-[12px] text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
        <div className="text-[12px] text-muted-foreground">© 2026 Placify Institutional Platform</div>
      </div>

      {/* Right: Deep Navy Brand Panel */}
      <div className="relative hidden overflow-hidden border-l border-[#162740] bg-[#0A192F] text-white lg:block">
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#162740] bg-[#132743] px-3.5 py-1 text-[11px] font-medium text-[#D4AF37]">
              <LockKeyhole className="h-3.5 w-3.5 text-[#D4AF37]" /> Verified Placement Network
            </div>
            <h2 className="font-display mt-8 text-3xl font-medium tracking-tight md:text-4xl text-white">
              Every offer letter starts with a structured match.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#CBD5E1]">
              A singular, high-integrity platform connecting students, recruiters, and placement directors with verified academic criteria.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { k: "01", l: "Verified Roster", d: "Academic transcript sync" },
              { k: "02", l: "Fast Review", d: "Real-time eligibility" },
              { k: "03", l: "Direct Connect", d: "Frictionless rounds" },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-[#162740] bg-[#132743]/50 p-4">
                <div className="font-display text-xl font-semibold text-[#D4AF37]">{s.k}</div>
                <div className="mt-1 text-[12px] font-medium text-white">{s.l}</div>
                <div className="mt-0.5 text-[10.5px] text-[#94A3B8]">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
