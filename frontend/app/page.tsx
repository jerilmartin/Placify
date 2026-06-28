import Link from "next/link";
import { ArrowRight, Brain, Users, Building2, GraduationCap, Zap, Target, BarChart3, Shield } from "lucide-react";

const features = [
  { icon: Brain, title: "AI Resume Parsing", desc: "Upload your resume and let Gemini AI extract and auto-fill your profile instantly.", color: "text-purple-400" },
  { icon: Target, title: "Semantic Job Matching", desc: "FAISS + Sentence Transformers match you to roles based on deep skill semantics.", color: "text-blue-400" },
  { icon: Zap, title: "AI Interview Coach", desc: "Practice with an AI interviewer that scores confidence, communication, and accuracy.", color: "text-amber-400" },
  { icon: BarChart3, title: "Placement Analytics", desc: "University dashboards with placement rate, avg package, and branch-wise breakdowns.", color: "text-emerald-400" },
  { icon: Shield, title: "ATS Score Engine", desc: "Get your resume's ATS score against any job description with improvement tips.", color: "text-pink-400" },
  { icon: Users, title: "Mentor Connect", desc: "Book 1:1 sessions with industry mentors for resume reviews and career guidance.", color: "text-cyan-400" },
];

const portals = [
  { icon: GraduationCap, label: "Student", desc: "Build profile, match jobs, practice interviews", href: "/login?role=student", color: "from-purple-600 to-blue-600" },
  { icon: Building2, label: "Recruiter", desc: "Post jobs, AI-sort candidates, schedule interviews", href: "/login?role=recruiter", color: "from-blue-600 to-cyan-600" },
  { icon: Shield, label: "University", desc: "Manage drives, eligibility engine, analytics", href: "/login?role=university", color: "from-emerald-600 to-teal-600" },
  { icon: Users, label: "Mentor", desc: "Guide students, review resumes, track progress", href: "/login?role=mentor", color: "from-amber-600 to-orange-600" },
];

const stats = [
  { value: "95%", label: "Match Accuracy" },
  { value: "3x", label: "Faster Shortlisting" },
  { value: "4 Portals", label: "Role-Based Access" },
  { value: "Gemini 2.5", label: "AI Engine" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">Placify</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#portals" className="hover:text-white transition-colors">Portals</a>
          <a href="#stats" className="hover:text-white transition-colors">Platform</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium mb-6">
            <Zap className="w-3 h-3" /> Powered by Gemini 2.5 + Sentence Transformers
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            <span className="gradient-text">AI-Powered</span> Campus
            <br />Placement Platform
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Placify unifies Students, Universities, Recruiters, and Mentors into one intelligent ecosystem.
            Automate resume parsing, job matching, eligibility checks, and AI interview coaching.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 font-semibold hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-purple-500/25"
            >
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-300 font-semibold hover:bg-white/5 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-12 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold gradient-text">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-slate-400 text-lg">6 AI-powered features that set Placify apart</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="glass p-6 card-hover animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Portals */}
      <section id="portals" className="py-24 px-6 bg-gradient-to-b from-transparent to-white/2">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">4 Role-Based Portals</h2>
            <p className="text-slate-400 text-lg">Every stakeholder in the placement ecosystem gets a dedicated experience</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {portals.map((p) => (
              <Link
                key={p.label}
                href={p.href}
                className="glass p-6 card-hover group text-center cursor-pointer border border-white/5 hover:border-white/15"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <p.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{p.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                <div className="mt-4 text-xs text-purple-400 group-hover:text-purple-300 flex items-center justify-center gap-1">
                  Enter portal <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Placements?</h2>
          <p className="text-slate-400 mb-8">Join Placify and experience AI-driven campus recruitment</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 font-bold text-lg hover:opacity-90 transition-all hover:scale-105 shadow-xl shadow-purple-500/30 animate-pulse-glow"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 text-center text-sm text-slate-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-purple-500" />
          <span className="gradient-text font-semibold">Placify</span>
        </div>
        <p>AI-Powered Campus Placement Management Platform · Built with Next.js 15 + FastAPI + Gemini AI</p>
      </footer>
    </div>
  );
}
