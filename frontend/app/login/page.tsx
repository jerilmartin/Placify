"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import type { UserRole } from "@/lib/types";

export default function LoginPage() {
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const roleRoutes: Record<UserRole, string> = {
        student: "/student/dashboard",
        recruiter: "/recruiter/dashboard",
        university: "/university/dashboard",
        mentor: "/mentor/dashboard",
        admin: "/student/dashboard",
        placement_officer: "/university/dashboard",
      };
      router.replace(roleRoutes[user.role] || "/student/dashboard");
    }
  }, [isAuthenticated, user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-purple-600/8 blur-3xl" />
      <div className="absolute bottom-0 right-1/3 w-80 h-80 rounded-full bg-blue-600/8 blur-3xl" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-up">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Placify</span>
          </Link>
          <h1 className="text-xl font-semibold mt-6 text-white">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your portal</p>
        </div>

        {/* Card */}
        <div className="glass p-8 animate-fade-up delay-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign In"}
            </button>
          </form>

          {/* Demo Quick Access */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center mb-3">Quick Demo Access</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Student", email: "student@placify.com", gradient: "from-purple-600 to-violet-600", icon: "🎓" },
                { label: "Recruiter", email: "recruiter@placify.com", gradient: "from-blue-600 to-cyan-600", icon: "💼" },
                { label: "University", email: "university@placify.com", gradient: "from-emerald-600 to-teal-600", icon: "🏛️" },
                { label: "Mentor", email: "mentor@placify.com", gradient: "from-amber-600 to-orange-600", icon: "🧑‍🏫" },
              ].map(demo => (
                <button
                  key={demo.label}
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await login(demo.email, "demo123");
                      toast.success(`Welcome, Demo ${demo.label}!`);
                    } catch {
                      toast.error("Demo login failed");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gradient-to-r ${demo.gradient} text-white text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg`}
                >
                  <span>{demo.icon}</span> {demo.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
