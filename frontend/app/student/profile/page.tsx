"use client";

import { useEffect, useState } from "react";
import { MapPin, Mail, Phone, Globe, Pencil, GraduationCap, Sparkles, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

interface ProfileData {
  id?: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  university: string;
  course: string;
  graduation_year: number | string;
  cgpa: number | string;
  active_backlogs: number | string;
  skills: string[];
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  profile_completion: number;
}

const EMPTY: ProfileData = {
  full_name: "", email: "", phone: "", location: "", bio: "",
  university: "", course: "", graduation_year: "", cgpa: "",
  active_backlogs: 0, skills: [], github_url: "", linkedin_url: "",
  portfolio_url: "", profile_completion: 0,
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) console.error(error);
      if (data) setProfile(data);
      setLoading(false);
    };
    load();
  }, [user]);

  const validate = (d: ProfileData) => {
    const e: Record<string, string> = {};
    if (!d.full_name.trim()) e.full_name = "Full name is required";
    const cgpa = parseFloat(String(d.cgpa));
    if (d.cgpa !== "" && (isNaN(cgpa) || cgpa < 0 || cgpa > 10)) e.cgpa = "CGPA must be between 0.0 and 10.0";
    const backlogs = parseInt(String(d.active_backlogs));
    if (d.active_backlogs !== "" && (isNaN(backlogs) || backlogs < 0)) e.active_backlogs = "Backlogs cannot be negative";
    return e;
  };

  const openEdit = () => { setDraft({ ...profile }); setErrors({}); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setErrors({}); };

  const saveProfile = async () => {
    const errs = validate(draft);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    const payload = {
      ...draft,
      user_id: user?.id,
      cgpa: draft.cgpa !== "" ? parseFloat(String(draft.cgpa)) : null,
      active_backlogs: draft.active_backlogs !== "" ? parseInt(String(draft.active_backlogs)) : 0,
      graduation_year: draft.graduation_year !== "" ? parseInt(String(draft.graduation_year)) : null,
      profile_completion: computeCompletion(draft),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("student_profiles").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      setToast({ type: "error", msg: "Failed to save. Please try again." });
    } else {
      setProfile({ ...draft, profile_completion: computeCompletion(draft) });
      setEditing(false);
      setToast({ type: "success", msg: "Profile saved successfully!" });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !draft.skills.includes(s)) setDraft((p) => ({ ...p, skills: [...p.skills, s] }));
    setSkillInput("");
  };
  const removeSkill = (s: string) => setDraft((p) => ({ ...p, skills: p.skills.filter((x) => x !== s) }));

  const f = editing ? draft : profile;
  const initials = f.full_name ? f.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-success/15 text-success border border-success/30" : "bg-destructive/15 text-destructive border border-destructive/30"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="relative h-28 bg-gradient-to-r from-primary/25 via-[oklch(0.55_0.20_235)/0.2] to-transparent">
          <div className="aurora opacity-60" />
        </div>
        <div className="flex flex-col gap-4 px-6 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-end gap-4">
            <div className="-mt-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-surface bg-gradient-to-br from-primary to-[oklch(0.55_0.20_235)] text-xl font-semibold text-white">
              {initials}
            </div>
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight">{f.full_name || "Your Name"}</h1>
              <p className="text-[13.5px] text-muted-foreground">
                {[f.course, f.university, f.cgpa ? `CGPA ${f.cgpa}` : ""].filter(Boolean).join(" · ") || "Complete your profile below"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                {f.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{f.location}</span>}
                {f.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{f.email}</span>}
                {f.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{f.phone}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {f.github_url && <Button variant="outline" size="sm" asChild><a href={f.github_url} target="_blank" rel="noreferrer"><Github className="mr-1.5 h-3.5 w-3.5" />GitHub</a></Button>}
            {f.linkedin_url && <Button variant="outline" size="sm" asChild><a href={f.linkedin_url} target="_blank" rel="noreferrer"><Linkedin className="mr-1.5 h-3.5 w-3.5" />LinkedIn</a></Button>}
            {f.portfolio_url && <Button variant="outline" size="sm" asChild><a href={f.portfolio_url} target="_blank" rel="noreferrer"><Globe className="mr-1.5 h-3.5 w-3.5" />Portfolio</a></Button>}
            {!editing
              ? <Button size="sm" onClick={openEdit}><Pencil className="mr-1.5 h-3.5 w-3.5" />Edit profile</Button>
              : <>
                <Button size="sm" variant="outline" onClick={cancelEdit}><X className="mr-1.5 h-3.5 w-3.5" />Cancel</Button>
                <Button size="sm" onClick={saveProfile} disabled={saving}><Save className="mr-1.5 h-3.5 w-3.5" />{saving ? "Saving…" : "Save"}</Button>
              </>
            }
          </div>
        </div>
      </div>

      {/* Profile completion bar */}
      <div className="mt-4 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-medium">Profile completion</span>
          <span className="text-muted-foreground">{profile.profile_completion ?? 0}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.55_0.20_235)] transition-all duration-500" style={{ width: `${profile.profile_completion ?? 0}%` }} />
        </div>
      </div>

      {editing ? (
        /* ── Edit Form ── */
        <div className="mt-4 space-y-4">
          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-[14px] font-medium">Personal Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input id="full_name" value={draft.full_name} onChange={(e) => setDraft((p) => ({ ...p, full_name: e.target.value }))} />
                {errors.full_name && <p className="text-[12px] text-destructive">{errors.full_name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={draft.phone} onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={draft.location} onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="portfolio_url">Portfolio URL</Label>
                <Input id="portfolio_url" value={draft.portfolio_url} onChange={(e) => setDraft((p) => ({ ...p, portfolio_url: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="github_url">GitHub URL</Label>
                <Input id="github_url" value={draft.github_url} onChange={(e) => setDraft((p) => ({ ...p, github_url: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input id="linkedin_url" value={draft.linkedin_url} onChange={(e) => setDraft((p) => ({ ...p, linkedin_url: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="bio">Bio</Label>
                <textarea id="bio" rows={3} value={draft.bio} onChange={(e) => setDraft((p) => ({ ...p, bio: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-[14px] font-medium">Academic Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="university">University</Label>
                <Input id="university" value={draft.university} onChange={(e) => setDraft((p) => ({ ...p, university: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="course">Course / Branch</Label>
                <Input id="course" value={draft.course} onChange={(e) => setDraft((p) => ({ ...p, course: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="graduation_year">Graduation Year</Label>
                <Input id="graduation_year" type="number" value={draft.graduation_year} onChange={(e) => setDraft((p) => ({ ...p, graduation_year: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cgpa">CGPA (0 – 10)</Label>
                <Input id="cgpa" type="number" step="0.01" min="0" max="10" value={draft.cgpa} onChange={(e) => setDraft((p) => ({ ...p, cgpa: e.target.value }))} />
                {errors.cgpa && <p className="text-[12px] text-destructive">{errors.cgpa}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="active_backlogs">Active Backlogs</Label>
                <Input id="active_backlogs" type="number" min="0" value={draft.active_backlogs} onChange={(e) => setDraft((p) => ({ ...p, active_backlogs: e.target.value }))} />
                {errors.active_backlogs && <p className="text-[12px] text-destructive">{errors.active_backlogs}</p>}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-[14px] font-medium">Skills</h2>
            <div className="flex gap-2 mb-3">
              <Input placeholder="e.g. Python, React…" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
              <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {draft.skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-md border border-border bg-elevated/60 px-2 py-0.5 text-[12px]">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* ── View Mode ── */
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <section className="rounded-xl border border-border bg-surface p-5">
              <h2 className="text-[14px] font-medium">About</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {profile.bio || "No bio added yet. Click Edit profile to add one."}
              </p>
            </section>
            <section className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-[14px] font-medium">Skills</h2>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills?.length > 0
                  ? profile.skills.map((s) => <span key={s} className="rounded-md border border-border bg-elevated/60 px-2 py-0.5 text-[12px]">{s}</span>)
                  : <p className="text-[13px] text-muted-foreground">No skills added yet.</p>}
              </div>
            </section>
          </div>
          <aside className="space-y-4">
            <section className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-[13px] font-medium">Academic Details</h3>
              <ul className="mt-3 space-y-2 text-[12.5px]">
                {[
                  ["University", profile.university],
                  ["Course", profile.course],
                  ["Graduation Year", profile.graduation_year],
                  ["CGPA", profile.cgpa],
                  ["Active Backlogs", profile.active_backlogs],
                ].map(([label, val]) => val != null && val !== "" && (
                  <li key={String(label)} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{String(val)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="h-4 w-4 text-primary" />
                <h3 className="text-[13px] font-medium">Contact</h3>
              </div>
              <ul className="space-y-2 text-[12.5px]">
                {profile.email && <li className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{profile.email}</li>}
                {profile.phone && <li className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{profile.phone}</li>}
                {profile.location && <li className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{profile.location}</li>}
              </ul>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function computeCompletion(p: ProfileData): number {
  const fields = [p.full_name, p.email, p.phone, p.location, p.bio, p.university, p.course, p.graduation_year, p.cgpa, p.github_url, p.linkedin_url];
  const filled = fields.filter((v) => v != null && String(v).trim() !== "").length;
  const hasSkills = p.skills?.length > 0 ? 1 : 0;
  return Math.round(((filled + hasSkills) / (fields.length + 1)) * 100);
}
