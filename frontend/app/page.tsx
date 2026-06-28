import Link from "next/link";
import { ArrowRight, Brain, Users, Building2, GraduationCap, Zap, Target, BarChart3, Shield } from "lucide-react";
import styles from "./home.module.css";

const features = [
  { icon: Brain, title: "AI Resume Parsing", desc: "Instantly extract skills, experience, and education from any resume using Gemini 2.5 parsing models.", bg: "rgba(59,130,246,0.1)", color: "#60a5fa" },
  { icon: Target, title: "Semantic Job Matching", desc: "FAISS vector search + Sentence Transformers match candidates to roles based on deep skill semantics.", bg: "rgba(99,102,241,0.1)", color: "#818cf8" },
  { icon: Zap, title: "AI Interview Coach", desc: "Dynamic mock interviews with real-time scoring on confidence, clarity, and technical accuracy.", bg: "rgba(245,158,11,0.1)", color: "#fbbf24" },
  { icon: BarChart3, title: "Placement Analytics", desc: "Branch-wise placement rates, salary distributions, and pipeline velocity — all in one dashboard.", bg: "rgba(16,185,129,0.1)", color: "#34d399" },
  { icon: Shield, title: "ATS Score Analysis", desc: "Benchmark any resume against job descriptions with keyword gap analysis and fix recommendations.", bg: "rgba(239,68,68,0.1)", color: "#f87171" },
  { icon: Users, title: "Mentor Network", desc: "Book 1:1 sessions with verified industry mentors for resume reviews and career roadmap guidance.", bg: "rgba(6,182,212,0.1)", color: "#22d3ee" },
];

const portals = [
  { icon: GraduationCap, label: "Student Portal", desc: "Build your profile, browse active placement drives, and practice AI mock interviews.", href: "/login?role=student" },
  { icon: Building2, label: "Recruiter Portal", desc: "Post jobs, AI-sort applicants using semantic search, and coordinate your full hiring pipeline.", href: "/login?role=recruiter" },
  { icon: Shield, label: "University Portal", desc: "Schedule campus drives, configure eligibility rules, and track placement metrics.", href: "/login?role=university" },
  { icon: Users, label: "Mentor Portal", desc: "Review student profiles, manage advising sessions, and provide structured feedback.", href: "/login?role=mentor" },
];

const stats = [
  { value: "95%", label: "Match Accuracy" },
  { value: "3×", label: "Faster Shortlisting" },
  { value: "4 Portals", label: "Unified Platform" },
  { value: "Gemini 2.5", label: "Core AI Engine" },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* ── Navbar ── */}
      <nav className={styles.navbar}>
        <a href="/" className={styles.navbarBrand}>
          <div className={styles.navbarLogo}>
            <Zap size={16} color="#fff" />
          </div>
          <span className={styles.navbarName}>Placify</span>
        </a>

        <div className={styles.navbarLinks}>
          <a href="#features">Features</a>
          <a href="#portals">Portals</a>
          <a href="#stats">Platform</a>
        </div>

        <div className={styles.navbarActions}>
          <Link href="/login" className={styles.btnGhost}>Sign In</Link>
          <Link href="/register" className={styles.btnPrimary}>Get Started</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            Next-Gen Campus Placement Management
          </div>
          <h1>
            AI-Powered Campus<br />
            <span>Placement Platform</span>
          </h1>
          <p className={styles.heroSub}>
            Placify unifies Students, Universities, Recruiters, and Mentors into one 
            intelligent ecosystem. Automate resume parsing, job matching, eligibility 
            checks, and AI-driven interview coaching.
          </p>
          <div className={styles.heroActions}>
            <Link href="/register" className={styles.btnCta}>
              Start Free Trial <ArrowRight size={15} />
            </Link>
            <Link href="/login" className={styles.btnSecondary}>
              Access Portals
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div id="stats" className={styles.statsBar}>
        <div className={styles.statsInner}>
          {stats.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2>Everything You Need</h2>
            <p>Six AI-powered capabilities engineered to modernize campus recruitment end-to-end.</p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon} style={{ background: f.bg }}>
                  <f.icon size={18} color={f.color} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portals ── */}
      <section id="portals" className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <h2>Role-Based Portals</h2>
            <p>Every stakeholder in the placement ecosystem gets a dedicated, purpose-built workspace.</p>
          </div>
          <div className={styles.portalsGrid}>
            {portals.map((p) => (
              <Link key={p.label} href={p.href} className={styles.portalCard}>
                <div className={styles.portalIconWrap}>
                  <p.icon size={18} color="#94a3b8" />
                </div>
                <h3>{p.label}</h3>
                <p>{p.desc}</p>
                <div className={styles.portalLink}>
                  Launch Console <ArrowRight size={13} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} />
        <div className={styles.ctaInner}>
          <h2>Ready to Transform Placements?</h2>
          <p>Deploy Placify's unified recruitment suite for your institution today.</p>
          <Link href="/register" className={styles.btnCta}>
            Get Started Free <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span className={styles.footerBrand}>Placify</span>
        <p>Campus Placement Management Platform · Built with Next.js 15, FastAPI, and Gemini AI</p>
      </footer>
    </div>
  );
}
