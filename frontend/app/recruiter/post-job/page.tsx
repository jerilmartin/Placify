"use client";

import { useEffect, useState } from "react";
import { jobsApi, recruitersApi } from "@/lib/api";
import { toast } from "sonner";
import { PlusCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { isDemoMode } from "@/lib/mock-data";

const JOB_TYPES = ["full_time","part_time","internship","contract"];
const EXP_LEVELS = ["entry","mid","senior"];

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [form, setForm] = useState({
    title: "", company: "", location: "", description: "",
    requirements: "", skills_required: [] as string[],
    job_type: "full_time", experience_level: "entry",
    salary_range: "", package_lpa: "", deadline: "",
    min_cgpa: "", no_of_openings: "",
  });

  useEffect(() => {
    recruitersApi.getProfile()
      .then(({ data }) => {
        setVerified(Boolean(data.verified));
        setForm((current) => ({ ...current, company: data.company_name || current.company }));
      })
      .catch(() => setVerified(false));
  }, []);

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills_required.includes(s)) {
      setForm(f => ({ ...f, skills_required: [...f.skills_required, s] }));
      setSkillInput("");
    }
  };

  const removeSkill = (s: string) => setForm(f => ({ ...f, skills_required: f.skills_required.filter(x => x !== s) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.company) { toast.error("Title and Company are required"); return; }
    if (!verified) { toast.error("Your recruiter profile must be verified before posting jobs"); return; }
    setLoading(true);
    if (isDemoMode()) {
      await new Promise(r => setTimeout(r, 1000));
      toast.success("Job posted successfully! 🎉");
      router.push("/recruiter/jobs");
      return;
    }
    try {
      await jobsApi.create({
        ...form,
        package_lpa: form.package_lpa ? parseFloat(form.package_lpa) : undefined,
        min_cgpa: form.min_cgpa ? parseFloat(form.min_cgpa) : undefined,
        no_of_openings: form.no_of_openings ? parseInt(form.no_of_openings) : undefined,
      });
      toast.success("Job posted successfully! 🎉");
      router.push("/recruiter/jobs");
    } catch { toast.error("Failed to post job"); }
    finally { setLoading(false); }
  };

  const field = (label: string, key: keyof typeof form, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-foreground">{label}</label>
      <input type={type} value={String(form[key])} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"><PlusCircle className="w-3.5 h-3.5 text-[#800020]" /> Post Job</div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Post a Job</h1>
        <p className="mt-1 text-sm text-muted-foreground">Publish a new role to campus talent networks and direct applicants.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-sharp space-y-5">
        {verified === false && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-sharp">
            Job publishing is locked until a university placement representative verifies your company.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("Job Title *", "title", "text", "e.g. Software Engineer")}
          {field("Company *", "company", "text", "e.g. TCS, Infosys")}
          {field("Location", "location", "text", "e.g. Bangalore, Remote")}
          {field("Package (LPA)", "package_lpa", "number", "e.g. 12")}
          {field("Min CGPA", "min_cgpa", "number", "e.g. 7.0")}
          {field("Openings", "no_of_openings", "number", "e.g. 10")}
          {field("Application Deadline", "deadline", "date")}
          {field("Salary Range", "salary_range", "text", "e.g. ₹6L - ₹12L")}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">Job Type</label>
            <select value={form.job_type} onChange={e => setForm(f => ({...f, job_type: e.target.value}))}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring capitalize">
              {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">Experience Level</label>
            <select value={form.experience_level} onChange={e => setForm(f => ({...f, experience_level: e.target.value}))}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring capitalize">
              {EXP_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-foreground">Job Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={4} placeholder="Describe the role and responsibilities…"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-foreground">Required Skills</label>
          <div className="flex gap-2">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="Add skill + Enter"
              className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <button type="button" onClick={addSkill} className="px-4 py-2 rounded-md border border-border bg-card hover:bg-muted text-foreground text-sm font-medium transition-colors">Add</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {form.skills_required.map(s => (
              <span key={s} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-foreground text-xs border border-border font-medium">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="hover:text-destructive transition-colors">×</button>
              </span>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading || verified !== true}
          className="w-full py-2.5 rounded-lg bg-[#800020] hover:bg-[#660019] text-white font-medium text-sm transition-all shadow-sharp disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</> : <><PlusCircle className="w-4 h-4" /> Post Job</>}
        </button>
      </form>
    </div>
  );
}
