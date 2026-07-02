"use client";

import { useEffect, useState } from "react";
import { studentsApi } from "@/lib/api";
import { User, GraduationCap, Link as LinkIcon, Briefcase, Award, Loader2, Sparkles, Save, Plus, Trash } from "lucide-react";
import type { StudentProfile, Project, WorkExperience } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isDemoMode, MOCK_STUDENT_PROFILE } from "@/lib/mock-data";

export default function StudentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "academic" | "links" | "skills">("personal");

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [graduationYear, setGraduationYear] = useState("2026");
  const [cgpa, setCgpa] = useState("8.5");
  const [achievements, setAchievements] = useState("");

  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const [skillsText, setSkillsText] = useState("");

  useEffect(() => {
    setLoading(true);
    if (isDemoMode()) {
      const d = MOCK_STUDENT_PROFILE;
      setFullName(d.full_name || "");
      setEmail(d.email || "");
      setPhone(d.phone || "");
      setLocation(d.location || "");
      setBio(d.bio || "");
      setUniversity(d.university || "");
      setCourse(d.course || "");
      setGraduationYear(String(d.graduation_year || "2026"));
      setCgpa(String(d.cgpa || "8.5"));
      setAchievements(d.achievements || "");
      setGithubUrl(d.github_url || "");
      setLinkedinUrl(d.linkedin_url || "");
      setPortfolioUrl(d.portfolio_url || "");
      setSkillsText(d.skills?.join(", ") || "");
      setLoading(false);
      return;
    }
    studentsApi.getProfile()
      .then(res => {
        const data: StudentProfile = res.data;
        if (data) {
          setFullName(data.full_name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setLocation(data.location || "");
          setBio(data.bio || "");
          setUniversity(data.university || "");
          setCourse(data.course || "");
          setGraduationYear(String(data.graduation_year || "2026"));
          setCgpa(String(data.cgpa || "8.5"));
          setAchievements(data.achievements || "");
          setGithubUrl(data.github_url || "");
          setLinkedinUrl(data.linkedin_url || "");
          setPortfolioUrl(data.portfolio_url || "");
          setSkillsText(data.skills?.join(", ") || "");
        }
      })
      .catch(() => {
        toast.info("Create a new profile details record by submitting the form");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const skills = skillsText
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      full_name: fullName,
      email,
      phone,
      location,
      bio,
      university,
      course,
      graduation_year: parseInt(graduationYear) || 2026,
      cgpa: parseFloat(cgpa) || 8.5,
      achievements,
      github_url: githubUrl,
      linkedin_url: linkedinUrl,
      portfolio_url: portfolioUrl,
      skills
    };

    if (isDemoMode()) {
      await new Promise(r => setTimeout(r, 600));
      toast.success("Profile saved successfully!");
      setSaving(false);
      return;
    }

    try {
      await studentsApi.updateProfile(payload);
      toast.success("Profile saved successfully!");
    } catch {
      try {
        await studentsApi.createProfile(payload);
        toast.success("Profile created successfully!");
      } catch {
        toast.error("Failed to commit profile updates");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><User className="w-4 h-4" /> Account</div>
        <h1 className="text-2xl font-bold text-white">Student Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your personal resume metrics, links, and tags for AI match algorithms.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>
      ) : (
        <div className="grid md:grid-cols-4 gap-6">
          {/* Tab Selector Buttons */}
          <div className="md:col-span-1 space-y-1">
            {[
              { id: "personal", label: "Personal Info", icon: User },
              { id: "academic", label: "Academic Info", icon: GraduationCap },
              { id: "links", label: "Career Links", icon: LinkIcon },
              { id: "skills", label: "Skills Tags", icon: Award },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all",
                  activeTab === tab.id
                    ? "bg-purple-600/20 text-purple-300 border-purple-500/20 shadow-sm"
                    : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10"
                )}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Content Area */}
          <div className="md:col-span-3">
            <form onSubmit={handleSaveProfile} className="glass p-6 rounded-2xl border border-white/5 space-y-6">
              {activeTab === "personal" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="font-semibold text-white text-sm">Personal Details</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Primary information displayed on candidate summaries.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500/50"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500/50"
                        placeholder="e.g. john@example.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500/50"
                        placeholder="e.g. +91 9876543210"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Location</label>
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500/50"
                        placeholder="e.g. Mumbai, India"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Short Biography</label>
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500/50 h-20 resize-none"
                      placeholder="Brief pitch about yourself..."
                    />
                  </div>
                </div>
              )}

              {activeTab === "academic" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="font-semibold text-white text-sm">Academic Profile</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Grades and cutoffs checks for placement eligibility engines.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">University Name</label>
                    <input
                      type="text"
                      value={university}
                      onChange={e => setUniversity(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500/50"
                      placeholder="e.g. IIT Bombay"
                    />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Course / Branch</label>
                      <input
                        type="text"
                        value={course}
                        onChange={e => setCourse(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500/50"
                        placeholder="e.g. CSE"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Graduation Year</label>
                      <input
                        type="number"
                        value={graduationYear}
                        onChange={e => setGraduationYear(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Current CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={cgpa}
                        onChange={e => setCgpa(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Key Academic Achievements</label>
                    <textarea
                      value={achievements}
                      onChange={e => setAchievements(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500/50 h-16 resize-none"
                      placeholder="e.g. Rank 1 in department hackathon, scholar awards..."
                    />
                  </div>
                </div>
              )}

              {activeTab === "links" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="font-semibold text-white text-sm">Professional Links</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Let recruiters see your work and portfolios.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">GitHub URL</label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={e => setGithubUrl(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500/50"
                        placeholder="https://github.com/username"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">LinkedIn Profile URL</label>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={e => setLinkedinUrl(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500/50"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Portfolio Website URL</label>
                      <input
                        type="url"
                        value={portfolioUrl}
                        onChange={e => setPortfolioUrl(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-purple-500/50"
                        placeholder="https://portfolio.com"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "skills" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="border-b border-white/5 pb-2">
                    <h3 className="font-semibold text-white text-sm">Technical Skills Tags</h3>
                    <p className="text-slate-500 text-xs mt-0.5">List key keywords comma-separated for AI semantic match filters.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">Skills (Comma-separated)</label>
                    <textarea
                      value={skillsText}
                      onChange={e => setSkillsText(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-purple-500/50 h-28 resize-none leading-relaxed"
                      placeholder="React, Next.js, Python, PyTorch, SQL, REST APIs, Git"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {skillsText.split(",").map(s => s.trim()).filter(s => s.length > 0).map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-semibold border border-purple-500/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-white/5">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-60 shadow-lg shadow-purple-500/10"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
