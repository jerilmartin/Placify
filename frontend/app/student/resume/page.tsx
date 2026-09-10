"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, Sparkles, Download, Share2, Check, AlertCircle, Loader2, UserCheck, MapPin, Briefcase, Code2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { jobsApi, resumesApi } from "@/lib/api";
import { toast } from "sonner";

export default function ResumePage() {
  const [loading, setLoading] = useState(false);
  const [activeResume, setActiveResume] = useState<any>(null);
  const [resumesList, setResumesList] = useState<any[]>([]);
  const [atsScore, setAtsScore] = useState<any>(null);
  const [improving, setImproving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<{ id: string; label: string }[]>([]);
  const [targetId, setTargetId] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [generatingCover, setGeneratingCover] = useState(false);
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
    }).catch((err) => console.warn("Failed to fetch resumes:", err));
    Promise.all([jobsApi.list(), jobsApi.listDrives()]).then(([jobs, drives]) => {
      const items = [
        ...(jobs.data || []).map((job: any) => ({ id: job.id, label: `${job.title} · ${job.company}` })),
        ...(drives.data || []).map((drive: any) => ({ id: drive.id, label: `${drive.role || drive.title} · ${drive.company_name}` })),
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
    try {
      const { data } = await resumesApi.generateCoverLetter(resumeId, targetId);
      setCoverLetter(data.cover_letter || "");
      toast.success("Cover letter generated");
    } catch {
      toast.error("Could not generate the cover letter");
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
      setAtsScore((prev: any) => ({
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
      toast.success("Gemini AI improvement suggestions loaded!");
    } catch {
      toast.error("Could not load AI improvements. Make sure backend and Gemini API are running.");
    } finally {
      setImproving(false);
    }
  };

  const handleSync = async () => {
    const resumeId = activeResume?.id || activeResume?.resume_id || "latest";
    const extractedData = activeResume?.extracted_data;
    if (!resumeId && !extractedData) { toast.error("Please upload a resume first"); return; }
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await resumesApi.syncToProfile(resumeId, extractedData);
      const data = res.data;
      setSyncResult(data);
      if (data.synced_fields && data.synced_fields.length > 0) {
        toast.success(`✅ ${data.message}`);
      } else {
        toast.info(data.message || "Profile already up to date.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to sync to profile. Make sure you have a student profile set up.");
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
      toast.success("Resume parsed! Click 'Sync to Profile' to update your profile.");

    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.response?.data?.detail || "Failed to process resume. Please ensure you are logged in.");
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
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Resume</h1>
          <p className="mt-1 text-sm text-muted-foreground">Parse with ML + Gemini AI, then sync directly to your profile.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" disabled={!activeResume}><Download className="mr-1.5 h-3.5 w-3.5" /> Download</Button>
          <Button variant="outline" size="sm" disabled={!activeResume}><Share2 className="mr-1.5 h-3.5 w-3.5" /> Share</Button>
          <Button variant="outline" size="sm" disabled={!activeResume || improving} onClick={handleImprove}>
            {improving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            {improving ? "Analyzing..." : "Improve with AI"}
          </Button>
          <Button size="sm" disabled={!activeResume || syncing} onClick={handleSync}
            className="bg-green-600 hover:bg-green-700 text-white">
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

      {/* Sync result banner */}
      {syncResult && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 rounded-lg border p-4 text-sm ${
            syncResult.synced_fields?.length > 0
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
              : "border-border bg-surface text-muted-foreground"
          }`}
        >
          <div className="font-medium">{syncResult.message}</div>
          {syncResult.synced_fields?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {syncResult.synced_fields.map((f: string) => (
                <span key={f} className="rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:text-green-400">
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
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface p-10 text-center transition-colors hover:border-primary/50 hover:bg-elevated"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
            </div>
            <div className="mt-3 text-[14px] font-medium">
              {loading ? "Parsing resume with ML + Gemini AI..." : "Drop a new version to reparse"}
            </div>
            <div className="mt-1 text-[12px] text-muted-foreground">PDF · DOCX · up to 10 MB</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleInputChange}
              disabled={loading}
            />
          </motion.label>

          <div className="rounded-xl border border-border bg-surface min-h-[300px]">
            {activeResume ? (
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
                          {extracted.education.map((edu: any, idx: number) => (
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
                          {extracted.experience.map((exp: any, idx: number) => (
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
                          {extracted.projects.map((proj: any, idx: number) => (
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
                  <div className="border-t border-border p-6 md:border-l md:border-t-0">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">ATS score</div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-4xl font-semibold tabular-nums">{atsScore?.overall_score || 0}</span>
                      <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                    <div className="mt-3 space-y-3">
                      {[
                        { l: "Keyword match", v: atsScore?.category_scores?.keyword_match || 0 },
                        { l: "Structure", v: atsScore?.category_scores?.formatting_structure || 0 },
                        { l: "Readability", v: atsScore?.category_scores?.readability || 0 },
                        { l: "Impact metrics", v: atsScore?.category_scores?.action_verbs_impact || 0 },
                      ].map((m) => (
                        <div key={m.l}>
                          <div className="mb-1 flex justify-between text-[12px]"><span>{m.l}</span><span className="tabular-nums text-muted-foreground">{m.v}</span></div>
                          <Progress value={m.v} className="h-1.5" />
                        </div>
                      ))}
                    </div>

                    {/* Sync CTA */}
                    <div className="mt-5 rounded-lg border border-green-500/20 bg-green-500/8 p-3 text-center">
                      <div className="text-[11px] font-medium text-green-700 dark:text-green-400 mb-2">
                        Push extracted data to your profile
                      </div>
                      <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white text-[12px]"
                        disabled={syncing} onClick={handleSync}>
                        {syncing ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <UserCheck className="mr-1.5 h-3 w-3" />}
                        {syncing ? "Syncing..." : "Sync to Profile"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-12 text-center text-muted-foreground opacity-60">
                <FileText className="mb-3 h-10 w-10" />
                <p>Upload a resume to instantly see ML + Gemini extracted details</p>
                <p className="mt-1 text-xs">Skills, Education, Experience, Projects and ATS Score will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: suggestions + versions */}
        <div className="space-y-4">
          {activeResume && (
            <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 via-surface to-surface p-5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                <Sparkles className="h-3 w-3" /> AI suggestions
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
              {atsScore?.specific_improvements?.length > 0 && (
                <div className="mt-5 space-y-3 border-t border-border pt-4">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Suggested rewrites</div>
                  {atsScore.specific_improvements.map((item: { section?: string; current?: string; suggestion?: string }, index: number) => (
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

          {activeResume && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-[14px] font-medium">Tailored cover letter</h3>
              <p className="mt-1 text-xs text-muted-foreground">Generated from this resume and the selected role.</p>
              <select value={targetId} onChange={(event) => setTargetId(event.target.value)} className="mt-3 h-9 w-full rounded-md border border-border bg-background px-2 text-xs">
                <option value="">Select a job or drive</option>
                {targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
              </select>
              <Button className="mt-3 w-full" size="sm" disabled={!targetId || generatingCover} onClick={handleGenerateCoverLetter}>
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
          )}

          <div className="rounded-xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-3">
              <h3 className="text-[14px] font-medium">Version history</h3>
            </div>
            <ul className="divide-y divide-border">
              {resumesList.length > 0 ? (
                resumesList.map((r: any) => (
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
                        {new Date(r.created_at).toLocaleDateString()}
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
