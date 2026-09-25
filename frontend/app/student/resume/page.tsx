"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, Sparkles, Check, AlertCircle, Loader2, UserCheck, MapPin, Briefcase, Code2, GraduationCap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { jobsApi, resumesApi, studentsApi } from "@/lib/api";
import { toast } from "sonner";

interface EducationEntry { degree?: string; institution?: string; year?: string | number; cgpa?: string | number }
interface ExperienceEntry { role?: string; company?: string; duration?: string; description?: string; skills_used?: string[] }
interface ProjectEntry { name?: string; description?: string; github_url?: string; tech_stack?: string[] }
interface ExtractedResumeData extends Record<string, unknown> {
  _ai_parsed?: boolean;
  name?: string; email?: string; phone?: string; location?: string; bio?: string;
  linkedin?: string; github?: string; skills?: string[]; achievements?: string[];
  education?: EducationEntry[]; experience?: ExperienceEntry[]; projects?: ProjectEntry[];
}
interface ResumeRecord {
  id?: string; resume_id?: string; filename?: string; original_filename?: string;
  created_at?: string; extracted_data?: ExtractedResumeData;
}
interface AtsScore {
  overall_score?: number; issues?: string[]; tips?: string[];
  specific_improvements?: { section?: string; current?: string; suggestion?: string }[];
  category_scores?: { keyword_match?: number; formatting_structure?: number; readability?: number; action_verbs_impact?: number };
}
interface SyncResult { message: string; synced_fields?: string[]; profile_completion?: number }
interface JobTargetSource { id: string; title: string; company: string }
interface DriveTargetSource { id: string; title: string; role?: string; company_name: string }
interface ApiError { response?: { data?: { detail?: string } }; code?: string; message?: string }

export default function ResumePage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeResume, setActiveResume] = useState<ResumeRecord | null>(null);
  const [resumesList, setResumesList] = useState<ResumeRecord[]>([]);
  const [atsScore, setAtsScore] = useState<AtsScore | null>(null);
  const [improving, setImproving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<{ id: string; label: string }[]>([]);
  const [targetId, setTargetId] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [generatingCover, setGeneratingCover] = useState(false);
  const [profileHasResumeData, setProfileHasResumeData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAtsScore = async (resumeId: string) => {
    try {
      const atsRes = await resumesApi.getAtsScore(resumeId);
      setAtsScore(atsRes.data);
    } catch (err) {
      console.warn("Failed to fetch ATS score:", err);
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await resumesApi.list();
      setResumesList(res.data || []);
      
      if (res.data && res.data.length > 0 && !activeResume) {
        const latest = res.data[0];
        setActiveResume(latest);
        if (latest.id) {
          await fetchAtsScore(latest.id);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch resumes:", err);
    }
  };

  useEffect(() => {
    resumesApi.list().then(async (res) => {
      const items = res.data || [];
      setResumesList(items);
      if (items.length > 0) {
        const latest = items[0];
        setActiveResume(latest);
        if (latest.id) await fetchAtsScore(latest.id);
      }
    }).catch((err) => console.warn("Failed to fetch resumes:", err))
      .finally(() => setInitialLoading(false));
    studentsApi.getProfile().then(({ data }) => {
      setProfileHasResumeData(Boolean(
        data?.profile_completion > 20 || data?.skills?.length || data?.projects?.length || data?.work_experience?.length
      ));
    }).catch(() => setProfileHasResumeData(false));
    Promise.allSettled([jobsApi.list(), jobsApi.listDrives()]).then(([jobs, drives]) => {
      const items = [
        ...((jobs.status === "fulfilled" ? jobs.value.data || [] : []) as JobTargetSource[]).map((job) => ({ id: job.id, label: `${job.title} · ${job.company}` })),
        ...((drives.status === "fulfilled" ? drives.value.data || [] : []) as DriveTargetSource[]).map((drive) => ({ id: drive.id, label: `${drive.role || drive.title} · ${drive.company_name}` })),
      ];

      setTargets(items);
      setTargetId(items[0]?.id || "");
    }).catch(() => setTargets([]));
  }, []);

  const handleGenerateCoverLetter = async () => {
    const resumeId = activeResume?.id || activeResume?.resume_id;
    if (!resumeId || !targetId) {
      toast.error("Select a resume and target role first");
      return;
    }
    setGeneratingCover(true);
    setCoverLetter("");
    try {
      const { data } = await resumesApi.generateCoverLetter(resumeId, targetId);
      setCoverLetter(data.cover_letter || "");
      toast.success("Cover letter generated");
    } catch (err: unknown) {
      toast.error((err as ApiError).response?.data?.detail || "Could not generate the cover letter. Please try again.");
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleImprove = async () => {
    const resumeId = activeResume?.id || activeResume?.resume_id;
    if (!resumeId) { toast.error("Please upload a resume first"); return; }
    setImproving(true);
    try {
      const res = await resumesApi.improve(resumeId);
      const data = res.data;
      setAtsScore((prev) => ({
        ...prev,
        overall_score: data.ats_score ?? prev?.overall_score ?? 0,
        issues: data.issues ?? [],
        tips: data.keyword_suggestions ?? [],
        specific_improvements: data.specific_improvements ?? [],
        category_scores: data.section_scores
          ? {
              keyword_match: data.section_scores.skills ?? prev?.category_scores?.keyword_match ?? 0,
              formatting_structure: data.section_scores.summary ?? prev?.category_scores?.formatting_structure ?? 0,
              readability: data.section_scores.education ?? prev?.category_scores?.readability ?? 0,
              action_verbs_impact: data.section_scores.experience ?? prev?.category_scores?.action_verbs_impact ?? 0,
            }
          : prev?.category_scores,
      }));
      toast.success("Resume recommendations updated");
    } catch (err: unknown) {
      toast.error((err as ApiError).response?.data?.detail || "Could not update resume recommendations. Check that the backend is running.");
    } finally {
      setImproving(false);
    }
  };

  const handleSync = async () => {
    const resumeId = activeResume?.id || activeResume?.resume_id;
    if (!resumeId) {
      toast.error("Please upload a resume first");
      return;
    }
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await resumesApi.syncToProfile(resumeId);
      const data = res.data;
      setSyncResult(data);
      if (data.synced_fields && data.synced_fields.length > 0) {
        toast.success(`✅ ${data.message}`);
        // Notify layout to refresh sidebar profile card
        window.dispatchEvent(new CustomEvent("placify:profile-updated"));
      } else {
        toast.info(data.message || "Profile already up to date.");
      }
    } catch (err: unknown) {
      toast.error((err as ApiError).response?.data?.detail || "Failed to sync this resume to your profile.");
    } finally {
      setSyncing(false);
    }
  };


  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSyncResult(null);
    try {
      const res = await resumesApi.upload(file);
      const data = res.data;
      setActiveResume(data);
      
      if (data.ats_score) {
        setAtsScore(data.ats_score);
      } else if (data.resume_id) {
        await fetchAtsScore(data.resume_id);
      }

      fetchResumes().catch(err => console.warn(err));
      toast.success("Resume saved. Review the details, then sync any updates to your profile.");

    } catch (err: unknown) {
      console.error("Upload error:", err);
      const apiErr = err as ApiError;
      const isTimeout =
        apiErr?.code === "ECONNABORTED" ||
        apiErr?.message?.toLowerCase().includes("timeout");

      if (isTimeout) {
        setError(
          "Resume processing took longer than expected. The server might still be finalizing the AI parse — please refresh the page in a few moments to see the results."
        );
      } else {
        setError(
          apiErr.response?.data?.detail ||
          "Failed to process resume. Please ensure you are logged in and your backend is running."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const extracted = activeResume?.extracted_data || {};
  const filename = activeResume?.filename || activeResume?.original_filename;
  const parsedTime = activeResume?.created_at ? new Date(activeResume.created_at).toLocaleString() : "Just now";

  const aiSuggestions = [
    ...(atsScore?.issues || []).map((i: string) => ({ level: "warn", t: i })),
    ...(atsScore?.tips || []).map((t: string) => ({ level: "ok", t: t }))
  ];
  
  const displaySuggestions = aiSuggestions.length > 0 ? aiSuggestions : [
    { level: "warn", t: "Quantify impact in project bullets — add performance or scale impact." },
    { level: "warn", t: "Verify all technical skills are listed clearly in your skills section." },
    { level: "ok", t: "Great format and section structure parsed by AI model." },
    { level: "ok", t: "Contact information and profiles successfully extracted." },
  ];

  const fieldLabel: Record<string, string> = {
    full_name: "Full Name", phone: "Phone", location: "Location", bio: "Bio",
    github_url: "GitHub URL", linkedin_url: "LinkedIn URL", skills: "Skills",
    course: "Course / Degree", cgpa: "CGPA", graduation_year: "Graduation Year",
    university: "University", work_experience: "Work Experience", projects: "Projects",
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight md:text-[30px] text-foreground">Resume</h1>
          <p className="mt-1 text-sm text-muted-foreground">Keep one verified resume, review extracted skill parameters, and synchronize credentials with your profile.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" disabled={!activeResume || improving} onClick={handleImprove}>
            {improving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />}
            {improving ? "Analyzing..." : "Review Resume"}
          </Button>
          <Button size="sm" disabled={!activeResume || syncing} onClick={handleSync} className="bg-primary text-primary-foreground hover:bg-[#660019] shadow-xs">
            {syncing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <UserCheck className="mr-1.5 h-3.5 w-3.5" />}
            {syncing ? "Syncing..." : "Sync to Profile"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeResume?.extracted_data?._ai_parsed === false && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>AI extraction was unavailable for this upload. Only basic resume details may have been detected. Review the fields below before syncing, or re-upload when Gemini is available.</span>
        </div>
      )}

      {!initialLoading && !activeResume && profileHasResumeData && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <div>
            <div className="font-medium">Your profile has details, but no saved resume</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Profile fields can come from signup or manual edits. Upload a resume to extract details and enable cover letters.
            </p>
          </div>
        </div>
      )}

      {/* Sync result banner */}
      {syncResult && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 rounded-lg border p-4 text-sm ${
            (syncResult.synced_fields?.length ?? 0) > 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sharp"
              : "border-border bg-card text-muted-foreground shadow-sharp"
          }`}
        >
          <div className="font-medium">{syncResult.message}</div>
          {(syncResult.synced_fields?.length ?? 0) > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {syncResult.synced_fields?.map((f) => (
                <span key={f} className="rounded-full border border-emerald-300 bg-emerald-100/60 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                  ✓ {fieldLabel[f] || f}
                </span>
              ))}
            </div>
          )}
          {syncResult.profile_completion !== undefined && (
            <div className="mt-2 text-[12px]">
              Profile completion: <strong>{syncResult.profile_completion}%</strong>
            </div>
          )}
        </motion.div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Preview + upload */}
        <div className="lg:col-span-2 space-y-4">
          <motion.label
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/30 shadow-sharp"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : activeResume ? <RefreshCw className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
            </div>
            <div className="mt-3 font-display text-[16px] font-semibold text-foreground">
              {loading ? "Extracting & analyzing with AI..." : activeResume ? "Upload a newer resume version" : "Upload your current resume"}
            </div>
            <div className="mt-1 text-[12px] text-muted-foreground">
              {loading ? "Parsing sections, skills, and experience with Gemini AI (takes ~30–45s)" : "PDF · DOCX · up to 10 MB"}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleInputChange}
              disabled={loading}
            />
          </motion.label>

          <div className="rounded-lg border border-border bg-card min-h-[300px] shadow-sharp">
            {initialLoading ? (
              <div className="flex min-h-[300px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : activeResume ? (
              <>
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[14px] font-medium">{filename}</span>
                    <span className="rounded-md bg-success/12 px-1.5 py-0.5 text-[10.5px] font-medium text-success">
                      Parsed
                    </span>
                  </div>
                  <div className="text-[12px] text-muted-foreground">{parsedTime}</div>
                </div>
                
                <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_240px]">
                  {/* Parsed details preview */}
                  <div className="p-6 space-y-5">
                    {/* Header */}
                    <div className="rounded-lg border border-border bg-background p-5 shadow-inner">
                      <div className="text-lg font-semibold">{extracted.name || "N/A"}</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">
                        {[extracted.email, extracted.phone].filter(Boolean).join(" · ") || "No contact info parsed"}
                      </div>
                      {extracted.location && (
                        <div className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />{extracted.location}
                        </div>
                      )}
                      {extracted.bio && (
                        <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">{extracted.bio}</p>
                      )}
                      {(extracted.linkedin || extracted.github) && (
                        <div className="mt-2 flex gap-3 text-[12px] text-primary">
                          {extracted.linkedin && <a href={extracted.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
                          {extracted.github && <a href={extracted.github} target="_blank" rel="noreferrer">GitHub ↗</a>}
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {extracted.skills && extracted.skills.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                          <Code2 className="h-3 w-3" /> Extracted Skills
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {extracted.skills.map((skill: string) => (
                            <span key={skill} className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {extracted.education && extracted.education.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                          <GraduationCap className="h-3 w-3" /> Education
                        </div>
                        <div className="space-y-2">
                          {extracted.education.map((edu, idx) => (
                            <div key={idx} className="rounded-lg border border-border bg-background p-3 text-[12px]">
                              <div className="font-semibold text-foreground">{edu.degree || "Degree"}</div>
                              {edu.institution && <div className="text-muted-foreground">{edu.institution}</div>}
                              <div className="mt-1 flex gap-3 text-muted-foreground">
                                {edu.year && <span>Graduating {edu.year}</span>}
                                {edu.cgpa && <span>CGPA: {edu.cgpa}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {extracted.experience && extracted.experience.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                          <Briefcase className="h-3 w-3" /> Experience
                        </div>
                        <div className="space-y-2">
                          {extracted.experience.map((exp, idx) => (
                            <div key={idx} className="rounded-lg border border-border bg-background p-3 text-[12px]">
                              <div className="font-semibold text-foreground">{exp.role} {exp.company ? `@ ${exp.company}` : ""}</div>
                              {exp.duration && <div className="text-muted-foreground text-[11px]">{exp.duration}</div>}
                              {exp.description && <p className="mt-1 text-muted-foreground leading-relaxed">{exp.description}</p>}
                              {exp.skills_used && exp.skills_used.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {exp.skills_used.map((s: string) => (
                                    <span key={s} className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground border border-border">{s}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {extracted.projects && extracted.projects.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
                          <Code2 className="h-3 w-3" /> Projects
                        </div>
                        <div className="space-y-2">
                          {extracted.projects.map((proj, idx) => (
                            <div key={idx} className="rounded-lg border border-border bg-background p-3 text-[12px]">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-foreground">{proj.name}</div>
                                {proj.github_url && (
                                  <a href={proj.github_url} target="_blank" rel="noreferrer" className="text-[11px] text-primary">GitHub ↗</a>
                                )}
                              </div>
                              {proj.description && <p className="mt-1 text-muted-foreground leading-relaxed">{proj.description}</p>}
                              {proj.tech_stack && proj.tech_stack.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {proj.tech_stack.map((t: string) => (
                                    <span key={t} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Achievements */}
                    {extracted.achievements && extracted.achievements.length > 0 && (
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">Achievements</div>
                        <ul className="space-y-1 text-[12px] text-muted-foreground">
                          {extracted.achievements.map((a: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5"><Check className="h-3 w-3 mt-0.5 text-success shrink-0" />{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* ATS Score Column */}
                  <div className="border-t border-border p-6 md:border-l md:border-t-0 bg-muted/20">
                    <div className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">ATS Readiness Score</div>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="font-display text-4xl font-semibold tabular-nums text-[#D4AF37]">{atsScore?.overall_score || 0}</span>
                      <span className="text-sm font-medium text-muted-foreground">/100</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {[
                        { l: "Keyword match", v: atsScore?.category_scores?.keyword_match || 0 },
                        { l: "Structure", v: atsScore?.category_scores?.formatting_structure || 0 },
                        { l: "Readability", v: atsScore?.category_scores?.readability || 0 },
                        { l: "Impact metrics", v: atsScore?.category_scores?.action_verbs_impact || 0 },
                      ].map((m) => (
                        <div key={m.l}>
                          <div className="mb-1 flex justify-between text-[11.5px]"><span className="font-medium text-foreground">{m.l}</span><span className="tabular-nums font-semibold text-muted-foreground">{m.v}</span></div>
                          <Progress value={m.v} className="h-1.5" />
                        </div>
                      ))}
                    </div>

                    {/* Sync CTA */}
                    <div className="mt-6 rounded-lg border border-border bg-card p-3.5 text-center shadow-sharp">
                      <div className="text-[11.5px] font-semibold text-foreground mb-1">
                        Synchronize to Profile
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-3">
                        Push extracted education, projects & skills into your profile.
                      </p>
                      <Button size="sm" className="w-full bg-primary hover:bg-[#660019] text-primary-foreground text-[12px] font-medium shadow-xs"
                        disabled={!activeResume || syncing} onClick={handleSync}>
                        {syncing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <UserCheck className="mr-1.5 h-3.5 w-3.5" />}
                        {syncing ? "Syncing..." : "Sync Credentials"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-12 text-center text-muted-foreground opacity-60">
                <FileText className="mb-3 h-10 w-10" />
                <p>No saved resume yet</p>
                <p className="mt-1 max-w-md text-xs">Upload your current file to enable resume review, version history, and tailored cover letters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: suggestions + versions */}
        <div className="space-y-4">
          {activeResume && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" /> Resume recommendations
              </div>
              <ul className="mt-4 space-y-3">
                {displaySuggestions.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-[13px]">
                    {s.level === "warn" ? (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    ) : (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    )}
                    <span>{s.t}</span>
                  </li>
                ))}
              </ul>
              {(atsScore?.specific_improvements?.length ?? 0) > 0 && (
                <div className="mt-5 space-y-3 border-t border-border pt-4">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Suggested rewrites</div>
                  {atsScore?.specific_improvements?.map((item, index) => (
                    <div key={`${item.section}-${index}`} className="rounded-lg border border-border bg-background p-3 text-xs">
                      <div className="font-semibold text-primary">{item.section || "Resume section"}</div>
                      {item.current && <div className="mt-2 text-muted-foreground line-through decoration-destructive/60">{item.current}</div>}
                      {item.suggestion && <div className="mt-2 border-l-2 border-success pl-2 text-foreground">{item.suggestion}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-[14px] font-medium">Tailored cover letter</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeResume ? "Create a draft from your saved resume and the selected role." : "Upload a resume to enable tailored cover letters."}
              </p>
              <select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="mt-3 h-9 w-full rounded-md border border-border bg-background px-2 text-xs">
                <option value="">Select a job or drive</option>
                {targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
              </select>
              <Button className="mt-3 w-full" size="sm" disabled={!activeResume || !targetId || generatingCover} onClick={handleGenerateCoverLetter}>
                {generatingCover ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
                {generatingCover ? "Generating…" : "Generate cover letter"}
              </Button>
              {coverLetter && (
                <div className="mt-3">
                  <textarea value={coverLetter} onChange={(event) => setCoverLetter(event.target.value)} rows={12} className="w-full resize-y rounded-md border border-border bg-background p-3 text-xs leading-relaxed" />
                  <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => navigator.clipboard.writeText(coverLetter).then(() => toast.success("Copied to clipboard"))}>Copy cover letter</Button>
                </div>
              )}
            </div>

          <div className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-3">
              <h3 className="text-[14px] font-medium">Version history</h3>
            </div>
            <ul className="divide-y divide-border">
              {resumesList.length > 0 ? (
                resumesList.map((r) => (
                  <li 
                    key={r.id} 
                    className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-elevated transition-colors"
                    onClick={async () => {
                      setActiveResume(r);
                      setAtsScore(null);
                      setSyncResult(null);
                      if (r.id) await fetchAtsScore(r.id);
                    }}
                  >
                    <div>
                      <div className={`text-[13px] ${activeResume?.id === r.id ? 'font-semibold text-primary' : ''}`}>
                        {r.original_filename}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : "Saved resume"}
                      </div>
                    </div>
                    {activeResume?.id === r.id && (
                      <span className="rounded-md bg-primary/12 px-1.5 py-0.5 text-[11px] text-primary">
                        Active
                      </span>
                    )}
                  </li>
                ))
              ) : (
                <li className="px-5 py-4 text-center text-xs text-muted-foreground">
                  No previous resumes uploaded yet.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
