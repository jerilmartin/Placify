"use client";

import { useEffect, useState } from "react";
import { recruitersApi, studentsApi, jobsApi } from "@/lib/api";
import { Users, Search, Brain, Loader2, Award, Briefcase, Filter, ArrowUpRight, GraduationCap, MapPin, Globe } from "lucide-react";
import type { StudentProfile, Job } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isDemoMode, MOCK_STUDENT_PROFILES, MOCK_JOBS } from "@/lib/mock-data";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<StudentProfile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setCandidates(MOCK_STUDENT_PROFILES);
      setJobs(MOCK_JOBS);
      setLoading(false);
      return;
    }
    Promise.all([
      studentsApi.list().catch(() => ({ data: [] })),
      jobsApi.list().catch(() => ({ data: [] }))
    ]).then(([studentsRes, jobsRes]) => {
      setCandidates(studentsRes.data || []);
      setJobs(jobsRes.data || []);
    }).catch(() => {
      toast.error("Failed to load initial candidate list");
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      if (isDemoMode()) { setCandidates(MOCK_STUDENT_PROFILES); return; }
      setLoading(true);
      studentsApi.list()
        .then(res => setCandidates(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }

    setIsAiSearching(true);
    if (isDemoMode()) {
      await new Promise(r => setTimeout(r, 1200));
      const lower = searchQuery.toLowerCase();
      const filtered = MOCK_STUDENT_PROFILES.filter(c =>
        c.full_name?.toLowerCase().includes(lower) ||
        c.skills?.some(s => s.toLowerCase().includes(lower)) ||
        c.course?.toLowerCase().includes(lower)
      );
      setCandidates(filtered.length > 0 ? filtered : MOCK_STUDENT_PROFILES);
      toast.success("AI search completed");
      setIsAiSearching(false);
      return;
    }

    try {
      const res = await recruitersApi.aiSearch(searchQuery);
      if (Array.isArray(res.data)) {
        setCandidates(res.data);
      } else if (res.data?.candidates) {
        setCandidates(res.data.candidates);
      } else {
        toast.info("AI returned empty results for this query");
      }
      toast.success("AI search completed");
    } catch {
      toast.error("AI Semantic search failed. Falling back to text matching.");
      const lower = searchQuery.toLowerCase();
      studentsApi.list().then(res => {
        const filtered = (res.data as StudentProfile[]).filter(c =>
          c.full_name?.toLowerCase().includes(lower) ||
          c.skills?.some(s => s.toLowerCase().includes(lower)) ||
          c.course?.toLowerCase().includes(lower)
        );
        setCandidates(filtered);
      });
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleJobFilter = async (jobId: string) => {
    setSelectedJobId(jobId);
    if (!jobId) {
      setLoading(true);
      studentsApi.list().then(res => setCandidates(res.data)).finally(() => setLoading(false));
      return;
    }
    setLoading(true);
    try {
      const res = await recruitersApi.getCandidates(jobId);
      setCandidates(res.data || []);
    } catch {
      toast.error("Failed to fetch candidates for this job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><Users className="w-4 h-4" /> Recruitment</div>
        <h1 className="text-2xl font-bold text-white">Candidate Browser</h1>
        <p className="text-slate-500 text-sm mt-1">Browse, filter, and use AI to match candidates with your job descriptions.</p>
      </div>

      {/* Semantic Search & Filters */}
      <div className="glass p-5 rounded-2xl mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="AI Semantic Search (e.g. 'Looking for a Python Developer who knows FastAPI and has a CGPA > 8.5')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isAiSearching}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-sm hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {isAiSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI Searching...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                AI Search
              </>
            )}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" /> Filter by Job Match:
          </div>
          <select
            value={selectedJobId}
            onChange={(e) => handleJobFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500/50"
          >
            <option value="" className="bg-[#0f0f15]">All Candidates</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id} className="bg-[#0f0f15]">
                {job.title} ({job.company})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidates List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <span className="text-slate-500 text-sm">Retrieving talent pool...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing {candidates.length} candidate profiles</span>
            <span>Sorted by suitability</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {candidates.map((profile) => (
              <div key={profile.id} className="glass p-5 border border-white/5 flex flex-col justify-between card-hover relative overflow-hidden group">
                {profile.placement_probability !== undefined && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-bl from-emerald-500/20 to-transparent border-l border-b border-emerald-500/20 rounded-bl-xl text-emerald-400 text-xs font-bold">
                    Score: {Math.round(profile.placement_probability * 100)}%
                  </div>
                )}
                
                <div>
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-300">
                      {profile.full_name?.charAt(0) ?? "C"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors text-base flex items-center gap-1.5">
                        {profile.full_name || "Anonymous Candidate"}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                        {profile.course || "N/A"} · {profile.university || "University"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-4 text-xs text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-yellow-500" />
                      <span>CGPA: <b className="text-white">{profile.cgpa || "N/A"}</b></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                      <span>YOP: <b className="text-white">{profile.graduation_year || "N/A"}</b></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span className="truncate">{profile.location || "Remote"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Completion: <b className="text-white">{profile.profile_completion}%</b></span>
                    </div>
                  </div>

                  {profile.skills && profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {profile.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-[10px] font-medium border border-purple-500/20"
                        >
                          {skill}
                        </span>
                      ))}
                      {profile.skills.length > 4 && (
                        <span className="text-[10px] text-slate-500 self-center">+{profile.skills.length - 4} more</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/5 mt-auto">
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-center text-xs text-white font-medium transition-colors border border-white/5"
                  >
                    Contact
                  </a>
                  <button
                    onClick={() => toast.info(`Resume parsing data: ${profile.bio || "No summary provided."}`)}
                    className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/20 transition-all"
                  >
                    Details <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {candidates.length === 0 && (
            <div className="glass p-12 text-center text-slate-500 text-sm">
              No candidates found matching the criteria. Try clearing the AI search query or selecting a different filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
