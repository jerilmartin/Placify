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
  { key: "student", label: "Student", description: "Applications and career preparation", icon: GraduationCap },
  { key: "recruiter", label: "Recruiter", description: "Hiring and candidate management", icon: Users },
  { key: "university", label: "Placement team", description: "Campus drives and placement operations", icon: Building2 },
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

            <div className="mt-8 grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/30 p-1" role="tablist" aria-label="Choose your portal">
              {portals.map((p) => {
                const Icon = p.icon;
                const active = role === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setRole(p.key)}
                    className={`group flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-xs font-medium transition-colors ${
                      active ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                    }`}
                    role="tab"
                    aria-selected={active}
                    aria-label={p.label}
                    title={p.label}
                  >
                    <Icon className="h-4 w-4" />
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : <>Continue to {portals.find((portal) => portal.key === role)?.label} <ArrowRight className="ml-1.5 h-4 w-4" /></>}
              </Button>
            </form>

            <p className="mt-6 text-center text-[12px] text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
        <div className="text-[12px] text-muted-foreground">© 2026 Placify</div>
      </div>

      {/* Right: brand panel */}
      <div className="relative hidden overflow-hidden border-l border-border bg-surface lg:block">
        <div className="relative flex h-full flex-col justify-between p-10">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur">
              <LockKeyhole className="h-3.5 w-3.5" /> Secure placement workspace
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
              Every offer letter starts with a great match.
            </h2>
            <p className="mt-3 text-muted-foreground">
              One focused workspace for students, recruiters, and campus placement teams.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { k: "01", l: "Student readiness" },
              { k: "02", l: "Campus operations" },
              { k: "03", l: "Recruiter workflow" },
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
