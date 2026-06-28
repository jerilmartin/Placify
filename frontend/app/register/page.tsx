"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Zap, Loader2, GraduationCap, Building2, Shield, Users } from "lucide-react";
import type { UserRole } from "@/lib/types";

const roles = [
  { value: "student" as UserRole, label: "Student", icon: GraduationCap, desc: "Find jobs & practice interviews", color: "from-purple-600 to-blue-600" },
  { value: "recruiter" as UserRole, label: "Recruiter", icon: Building2, desc: "Post jobs & hire talent", color: "from-blue-600 to-cyan-600" },
  { value: "university" as UserRole, label: "University", icon: Shield, desc: "Manage placement drives", color: "from-emerald-600 to-teal-600" },
  { value: "mentor" as UserRole, label: "Mentor", icon: Users, desc: "Guide and inspire students", color: "from-amber-600 to-orange-600" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "", email: "", password: "", confirm_password: "",
    university: "", student_id: "", course: "", graduation_year: "",
    company_name: "",
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
        university: form.university || undefined,
        student_id: form.student_id || undefined,
        course: form.course || undefined,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year) : undefined,
      });
      toast.success("Account created! Welcome to Placify 🎉");
      const roleRoutes: Record<UserRole, string> = {
        student: "/student/dashboard", recruiter: "/recruiter/dashboard",
        university: "/university/dashboard", mentor: "/mentor/dashboard",
        admin: "/student/dashboard", placement_officer: "/university/dashboard",
      };
      router.push(roleRoutes[selectedRole]);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-1/3 w-96 h-96 rounded-full bg-purple-600/8 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-emerald-600/8 blur-3xl" />

      <div className="w-full max-w-lg relative">
        <div className="text-center mb-8 animate-fade-up">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Placify</span>
          </Link>
          <h1 className="text-xl font-semibold mt-6 text-white">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Step {step} of 2</p>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="glass p-8 animate-fade-up delay-100">
            <h2 className="text-sm font-medium text-slate-400 mb-4">I am a…</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedRole(r.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedRole === r.value
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-white/5 bg-white/3 hover:border-white/15"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center mb-2`}>
                    <r.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="font-medium text-sm text-white">{r.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 font-semibold text-white hover:opacity-90 transition-all"
            >
              Continue as {roles.find(r => r.value === selectedRole)?.label}
            </button>
          </div>
        )}

        {/* Step 2: Account Details */}
        {step === 2 && (
          <div className="glass p-8 animate-fade-up">
            <button onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-slate-300 mb-4 flex items-center gap-1">
              ← Back
            </button>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                  <input type="text" value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} required
                    placeholder="John Doe" className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required
                    placeholder="you@example.com" className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required
                    placeholder="Min 8 chars" className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm Password</label>
                  <input type="password" value={form.confirm_password} onChange={e => setForm(f => ({...f, confirm_password: e.target.value}))} required
                    placeholder="••••••••" className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
                </div>
                {selectedRole === "student" && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">University</label>
                      <input type="text" value={form.university} onChange={e => setForm(f => ({...f, university: e.target.value}))}
                        placeholder="Your university" className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Student ID</label>
                      <input type="text" value={form.student_id} onChange={e => setForm(f => ({...f, student_id: e.target.value}))}
                        placeholder="CS20B001" className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Course</label>
                      <input type="text" value={form.course} onChange={e => setForm(f => ({...f, course: e.target.value}))}
                        placeholder="B.Tech CSE" className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Graduation Year</label>
                      <input type="number" value={form.graduation_year} onChange={e => setForm(f => ({...f, graduation_year: e.target.value}))}
                        placeholder="2026" min="2024" max="2030" className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500/50" />
                    </div>
                  </>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : "Create Account"}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">Sign in</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
