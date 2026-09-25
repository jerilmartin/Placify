"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, GraduationCap, Building2, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@/lib/types";

const roles = [
  { value: "student" as UserRole, label: "Student", icon: GraduationCap, desc: "Applications & interview readiness" },
  { value: "recruiter" as UserRole, label: "Recruiter", icon: Building2, desc: "Campus drives & hiring talent" },
  { value: "university" as UserRole, label: "University", icon: Shield, desc: "Manage placement operations" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "", email: "", password: "", confirm_password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: selectedRole,
      });
      toast.success("Account created! Welcome to Placify 🎉");
      const roleRoutes: Record<UserRole, string> = {
        student: "/student/dashboard", recruiter: "/recruiter/dashboard",
        university: "/university/dashboard", mentor: "/mentor/dashboard",
        admin: "/student/dashboard", placement_officer: "/university/dashboard",
      };
      router.push(roleRoutes[selectedRole]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "";
      if (errMsg === "CHECK_EMAIL") {
        toast.success("Account created! Please check your email to confirm your account, then sign in.");
        router.push("/login");
        return;
      }
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || errMsg || "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative">
      <div className="w-full max-w-lg relative py-8">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-3">
            <BrandLockup />
          </Link>
          <h1 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-foreground mt-2">
            Create institutional account
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
            Step {step} of 2 · {step === 1 ? "Role Selection" : "Account Credentials"}
          </p>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-elevated">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Select your institutional portal
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {roles.map((r) => {
                const isSelected = selectedRole === r.value;
                const Icon = r.icon;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-[#800020] bg-[#800020]/5 ring-1 ring-[#800020]"
                        : "border-border bg-background/50 hover:border-border/80 hover:bg-muted/40"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded flex items-center justify-center mb-2.5 ${
                      isSelected ? "bg-[#800020] text-white" : "bg-[#0A192F] text-white"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="font-display font-semibold text-sm text-foreground">{r.label}</div>
                    <div className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug">{r.desc}</div>
                  </button>
                );
              })}
            </div>
            <Button
              onClick={() => setStep(2)}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-[#660019]"
            >
              Continue as {roles.find(r => r.value === selectedRole)?.label} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
            </div>
          </div>
        )}

        {/* Step 2: Minimal account details */}
        {step === 2 && (
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-elevated">
            <button
              onClick={() => setStep(1)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to role selection
            </button>
            <p className="text-xs text-muted-foreground mb-5">
              Enter your basic credentials. University verification and profile details are completed post-login.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(f => ({...f, full_name: e.target.value}))}
                  required
                  placeholder="Prof. John Doe / Jane Smith"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  required
                  placeholder="you@university.ac.in"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  required
                  placeholder="Min 8 characters"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
                <Input
                  type="password"
                  value={form.confirm_password}
                  onChange={e => setForm(f => ({...f, confirm_password: e.target.value}))}
                  required
                  placeholder="••••••••"
                  className="bg-background border-border"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-[#660019] mt-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating account…</> : "Create Account"}
              </Button>
            </form>

            <div className="mt-5 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
