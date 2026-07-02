"use client";

import { useState } from "react";
import { jobsApi } from "@/lib/api";
import { toast } from "sonner";
import { PlusCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { isDemoMode } from "@/lib/mock-data";

const JOB_TYPES = ["full_time","part_time","internship","contract"];
const EXP_LEVELS = ["entry","mid","senior"];

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [form, setForm] = useState({
    title: "", company: "", location: "", description: "",
    requirements: "", skills_required: [] as string[],
    job_type: "full_time", experience_level: "entry",
    salary_range: "", package_lpa: "", deadline: "",
    min_cgpa: "", no_of_openings: "",
  });

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
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <input type={type} value={String(form[key])} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50" />
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><PlusCircle className="w-4 h-4" /> Post Job</div>
        <h1 className="text-2xl font-bold text-white">Post a Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="glass p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {field("Job Title *", "title", "text", "e.g. Software Engineer")}
          {field("Company *", "company", "text", "e.g. TCS, Infosys")}
          {field("Location", "location", "text", "e.g. Bangalore, Remote")}
          {field("Package (LPA)", "package_lpa", "number", "e.g. 12")}
          {field("Min CGPA", "min_cgpa", "number", "e.g. 7.0")}
          {field("Openings", "no_of_openings", "number", "e.g. 10")}
          {field("Application Deadline", "deadline", "date")}
          {field("Salary Range", "salary_range", "text", "e.g. ₹6L - ₹12L")}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Job Type</label>
            <select value={form.job_type} onChange={e => setForm(f => ({...f, job_type: e.target.value}))}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50">
              {JOB_TYPES.map(t => <option key={t} value={t} className="bg-[#13131a]">{t.replace("_"," ")}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Experience Level</label>
            <select value={form.experience_level} onChange={e => setForm(f => ({...f, experience_level: e.target.value}))}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50">
              {EXP_LEVELS.map(t => <option key={t} value={t} className="bg-[#13131a]">{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Job Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={4} placeholder="Describe the role and responsibilities…"
            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none" />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Required Skills</label>
          <div className="flex gap-2 mb-2">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())} placeholder="Add skill + Enter"
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50" />
            <button type="button" onClick={addSkill} className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-300 text-sm border border-blue-500/20 hover:bg-blue-600/30">Add</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {form.skills_required.map(s => (
              <span key={s} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/20">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-400 transition-colors">×</button>
              </span>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</> : <><PlusCircle className="w-4 h-4" /> Post Job</>}
        </button>
      </form>
    </div>
  );
}
