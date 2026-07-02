"use client";

import { useState, useEffect } from "react";
import { resumesApi } from "@/lib/api";
import { toast } from "sonner";
import { Upload, FileText, Sparkles, CheckCircle, Loader2, BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import type { Resume } from "@/lib/types";
import { isDemoMode, MOCK_RESUMES, MOCK_ATS_RESULT, MOCK_IMPROVE_RESULT } from "@/lib/mock-data";

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [uploading, setUploading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [atsResult, setAtsResult] = useState<Record<string, unknown> | null>(null);
  const [improveResult, setImproveResult] = useState<Record<string, unknown> | null>(null);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (isDemoMode()) {
      setResumes(MOCK_RESUMES);
      setSelectedResume(MOCK_RESUMES[0]);
      return;
    }
    resumesApi.list().then(r => setResumes(r.data)).catch(() => {});
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    if (isDemoMode()) {
      await new Promise(r => setTimeout(r, 1200));
      toast.success("Resume uploaded and parsed!");
      const newResume = { ...MOCK_RESUMES[0], id: `demo-${Date.now()}`, original_filename: file.name } as Resume;
      setResumes(prev => [newResume, ...prev]);
      setSelectedResume(newResume);
      setUploading(false);
      return;
    }
    try {
      const res = await resumesApi.upload(file);
      toast.success("Resume uploaded and parsed!");
      const newResume = { id: res.data.resume_id, original_filename: file.name, status: "parsed", completion_percentage: 60, student_id: "", created_at: new Date().toISOString() } as Resume;
      setResumes(prev => [newResume, ...prev]);
      setSelectedResume(newResume);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleImprove = async () => {
    if (!selectedResume) return;
    setImproving(true);
    if (isDemoMode()) {
      await new Promise(r => setTimeout(r, 1500));
      setImproveResult(MOCK_IMPROVE_RESULT);
      toast.success("AI improvement suggestions ready!");
      setImproving(false);
      return;
    }
    try {
      const res = await resumesApi.improve(selectedResume.id);
      setImproveResult(res.data);
      toast.success("AI improvement suggestions ready!");
    } catch { toast.error("Failed to generate suggestions"); }
    finally { setImproving(false); }
  };

  const handleAtsScore = async () => {
    if (!selectedResume) return;
    if (isDemoMode()) {
      await new Promise(r => setTimeout(r, 1000));
      setAtsResult(MOCK_ATS_RESULT);
      return;
    }
    try {
      const res = await resumesApi.getAtsScore(selectedResume.id);
      setAtsResult(res.data);
    } catch { toast.error("Failed to calculate ATS score"); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><FileText className="w-4 h-4" /> Resume</div>
        <h1 className="text-2xl font-bold text-white">Resume Manager</h1>
        <p className="text-slate-500 text-sm mt-1">Upload, parse, and improve your resume with Gemini AI.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Zone */}
        <div>
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
            className={`glass p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
              drag ? "border-purple-500 bg-purple-500/10" : "border-white/10 hover:border-purple-500/40"
            }`}
          >
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" id="resume-upload"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
            <label htmlFor="resume-upload" className="cursor-pointer">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                {uploading ? <Loader2 className="w-6 h-6 text-purple-400 animate-spin" /> : <Upload className="w-6 h-6 text-purple-400" />}
              </div>
              <div className="font-medium text-white mb-1">{uploading ? "Parsing with AI…" : "Drop your resume here"}</div>
              <div className="text-xs text-slate-500">PDF, DOC, DOCX · Max 10MB</div>
              <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600/20 text-purple-300 text-sm border border-purple-500/20 hover:bg-purple-600/30 transition-colors">
                <Upload className="w-3.5 h-3.5" /> Browse file
              </div>
            </label>
          </div>

          {/* Resume list */}
          {resumes.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs font-medium text-slate-500 mb-2">Your resumes</div>
              {resumes.map(r => (
                <button key={r.id} onClick={() => setSelectedResume(r)}
                  className={`w-full glass p-3 rounded-xl flex items-center gap-3 text-left transition-all border ${
                    selectedResume?.id === r.id ? "border-purple-500/40 bg-purple-500/5" : "border-white/5 hover:border-white/15"
                  }`}>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">{r.original_filename}</div>
                    <div className="text-xs text-slate-500 capitalize">{r.status}</div>
                  </div>
                  {r.status === "parsed" && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions + Results */}
        <div className="space-y-4">
          {selectedResume && (
            <div className="glass p-5 rounded-2xl">
              <div className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> AI Actions
              </div>
              <div className="space-y-2">
                <button onClick={handleAtsScore}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 text-blue-300 text-sm font-medium transition-all">
                  <BarChart3 className="w-4 h-4" /> Calculate ATS Score
                </button>
                <button onClick={handleImprove} disabled={improving}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15 text-purple-300 text-sm font-medium transition-all disabled:opacity-60">
                  {improving ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                  AI Improve Resume
                </button>
              </div>
            </div>
          )}

          {/* ATS Result */}
          {atsResult && (
            <div className="glass p-5 rounded-2xl animate-fade-up">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">ATS Score</span>
                <span className="text-2xl font-bold gradient-text">{String(atsResult.ats_score ?? 0)}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500"
                  style={{ width: `${atsResult.ats_score as number}%` }} />
              </div>
              {Array.isArray(atsResult.issues) && atsResult.issues.length > 0 && (
                <div className="space-y-1.5">
                  {(atsResult.issues as string[]).map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <AlertCircle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />{issue}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Improve Result */}
          {improveResult && (
            <div className="glass p-5 rounded-2xl animate-fade-up">
              <div className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Improvement Suggestions
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl font-bold gradient-text">{String(improveResult.ats_score ?? 0)}</div>
                <div className="text-xs text-slate-500">ATS Score<br /><span className="font-bold text-white">{String(improveResult.overall_grade)}</span></div>
              </div>
              {Array.isArray(improveResult.issues) && (improveResult.issues as string[]).map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-400 mb-2">
                  <span className="text-purple-400">→</span>{issue}
                </div>
              ))}
              {Array.isArray(improveResult.keyword_suggestions) && (
                <div className="mt-3">
                  <div className="text-xs text-slate-500 mb-2">Add these keywords:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(improveResult.keyword_suggestions as string[]).map(k => (
                      <span key={k} className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/20">{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
