"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, Sparkles, Download, Share2, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { resumesApi } from "@/lib/api";

export default function ResumePage() {
  const [loading, setLoading] = useState(false);
  const [activeResume, setActiveResume] = useState<any>(null);
  const [resumesList, setResumesList] = useState<any[]>([]);
  const [atsScore, setAtsScore] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
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
      
      // If we don't have an active resume but history exists, load the latest
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
    fetchResumes();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await resumesApi.upload(file);
      const data = res.data;
      setActiveResume(data);
      
      if (data.ats_score) {
        setAtsScore(data.ats_score);
      } else if (data.resume_id) {
        await fetchAtsScore(data.resume_id);
      }

      // Start fetching list in the background
      fetchResumes().catch(err => console.warn(err));

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
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const extracted = activeResume?.extracted_data || {};
  const filename = activeResume?.filename || activeResume?.original_filename;
  const parsedTime = activeResume?.created_at ? new Date(activeResume.created_at).toLocaleString() : "Just now";

  // Dynamic AI Suggestions based on real ATS issues and tips
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

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Resume</h1>
          <p className="mt-1 text-sm text-muted-foreground">Parse, score, and rewrite with local ML.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!activeResume}><Download className="mr-1.5 h-3.5 w-3.5" /> Download</Button>
          <Button variant="outline" size="sm" disabled={!activeResume}><Share2 className="mr-1.5 h-3.5 w-3.5" /> Share</Button>
          <Button size="sm" disabled={!activeResume}><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Improve with AI</Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
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
              {loading ? "Parsing resume with ML model..." : "Drop a new version to reparse"}
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
                  <div className="p-6">
                    <div className="rounded-lg border border-border bg-background p-6 shadow-inner">
                      <div className="mb-4">
                        <div className="text-lg font-semibold">{extracted.name || "N/A"}</div>
                        <div className="text-[12px] text-muted-foreground">
                          {[extracted.email, extracted.phone, extracted.location].filter(Boolean).join(" · ") || "No contact info parsed"}
                        </div>
                        {(extracted.linkedin || extracted.github) && (
                          <div className="mt-1 flex gap-3 text-[12px] text-primary">
                            {extracted.linkedin && <a href={extracted.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
                            {extracted.github && <a href={extracted.github} target="_blank" rel="noreferrer">GitHub</a>}
                          </div>
                        )}
                      </div>

                      {/* Skills Section */}
                      {extracted.skills && extracted.skills.length > 0 && (
                        <div className="mb-4">
                          <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Extracted Skills (ML)</div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {extracted.skills.map((skill: string) => (
                              <span key={skill} className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience Section */}
                      {extracted.experience && extracted.experience.length > 0 && (
                        <div className="mb-4">
                          <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Experience</div>
                          <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                            {extracted.experience.map((exp: any, idx: number) => (
                              <div key={idx} className="font-medium text-foreground">{exp.title || exp.raw || JSON.stringify(exp)}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education Section */}
                      {extracted.education && extracted.education.length > 0 && (
                        <div className="mb-4">
                          <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Education</div>
                          <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                            {extracted.education.map((edu: any, idx: number) => (
                              <div key={idx} className="font-medium text-foreground">
                                {edu.degree || edu.institution || "Bachelor's Degree"} {edu.year ? `(${edu.year})` : ""}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-12 text-center text-muted-foreground opacity-60">
                <FileText className="mb-3 h-10 w-10" />
                <p>Upload a resume to instantly see ML extracted details</p>
                <p className="mt-1 text-xs">Skills, Entities, and ATS Score will appear here</p>
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

