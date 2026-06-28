"use client";

import { useEffect, useState } from "react";
import { studentsApi } from "@/lib/api";
import { Users, Search, GraduationCap, Award, Filter, FileText, CheckCircle2, AlertTriangle, HelpCircle, Loader2 } from "lucide-react";
import type { StudentProfile } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function UniversityStudentsPage() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filters
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // placed, unplaced, all
  const [cgpaFilter, setCgpaFilter] = useState("all"); // >=8.0, >=7.0, all

  useEffect(() => {
    setLoading(true);
    studentsApi.list()
      .then(res => {
        setStudents(res.data || []);
      })
      .catch(() => {
        toast.error("Failed to load students roster");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter Logic
  const filteredStudents = students.filter(s => {
    // Search query match
    const matchesSearch = 
      (s.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (s.student_id?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (s.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ?? false);
    
    // Course filter match
    const matchesCourse = courseFilter === "all" || s.course === courseFilter;
    
    // Status match
    const isPlaced = (s.placement_probability ?? 0) >= 0.85; // hypothetical threshold for demo
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "placed" && isPlaced) || 
      (statusFilter === "unplaced" && !isPlaced);
    
    // CGPA match
    const cgpa = s.cgpa ?? 0;
    const matchesCgpa =
      cgpaFilter === "all" ||
      (cgpaFilter === "8" && cgpa >= 8.0) ||
      (cgpaFilter === "7" && cgpa >= 7.0) ||
      (cgpaFilter === "6" && cgpa >= 6.0);

    return matchesSearch && matchesCourse && matchesStatus && matchesCgpa;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><Users className="w-4 h-4" /> Registrar</div>
        <h1 className="text-2xl font-bold text-white">Student Roster</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor placement eligibility, browse courses, and access resumes.</p>
      </div>

      {/* Filters & Search */}
      <div className="glass p-5 rounded-2xl mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search students by name, ID, or skills (e.g. 'React', '2026')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" /> Filters:
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Branch Filter */}
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all" className="bg-[#0f0f15]">All Branches</option>
              <option value="CSE" className="bg-[#0f0f15]">CSE</option>
              <option value="ECE" className="bg-[#0f0f15]">ECE</option>
              <option value="EEE" className="bg-[#0f0f15]">EEE</option>
              <option value="IT" className="bg-[#0f0f15]">IT</option>
            </select>

            {/* CGPA Filter */}
            <select
              value={cgpaFilter}
              onChange={(e) => setCgpaFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all" className="bg-[#0f0f15]">All Grades</option>
              <option value="8" className="bg-[#0f0f15]">CGPA ≥ 8.0</option>
              <option value="7" className="bg-[#0f0f15]">CGPA ≥ 7.0</option>
              <option value="6" className="bg-[#0f0f15]">CGPA ≥ 6.0</option>
            </select>

            {/* Placement Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all" className="bg-[#0f0f15]">All Statuses</option>
              <option value="placed" className="bg-[#0f0f15]">Placed</option>
              <option value="unplaced" className="bg-[#0f0f15]">Unplaced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-slate-500 text-sm">Loading student directory...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 px-1">
            Found {filteredStudents.length} students matching criteria
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((s) => {
              const isPlaced = (s.placement_probability ?? 0) >= 0.85;

              return (
                <div key={s.id} className="glass p-5 border border-white/5 flex flex-col justify-between card-hover relative overflow-hidden group">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                          {s.full_name?.charAt(0) ?? "S"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors text-sm truncate max-w-[150px]">
                            {s.full_name || "Student"}
                          </h3>
                          <p className="text-[10px] text-slate-500">{s.student_id || "ID: N/A"}</p>
                        </div>
                      </div>

                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider",
                        isPlaced ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/25" : "bg-orange-500/10 text-orange-400 border border-orange-500/15"
                      )}>
                        {isPlaced ? "Placed" : "Unplaced"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-3.5 text-xs text-slate-400 bg-white/5 p-2.5 rounded-lg border border-white/5">
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="truncate">{s.course || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        <span>CGPA: <b>{s.cgpa || "N/A"}</b></span>
                      </div>
                    </div>

                    {s.skills && s.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {s.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[9px] font-medium border border-emerald-500/20"
                          >
                            {skill}
                          </span>
                        ))}
                        {s.skills.length > 3 && (
                          <span className="text-[9px] text-slate-500 self-center">+{s.skills.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-white/5 mt-auto">
                    {s.portfolio_url || s.github_url ? (
                      <a
                        href={s.portfolio_url || s.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-center text-xs text-white font-medium border border-white/5 transition-colors flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3 h-3 text-slate-400" /> Resume Profile
                      </a>
                    ) : (
                      <button
                        onClick={() => toast.info("Candidate details profile has not added any custom links.")}
                        className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-center text-xs text-slate-400 font-medium border border-white/5 transition-colors flex items-center justify-center gap-1"
                      >
                        <HelpCircle className="w-3 h-3" /> No Links
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredStudents.length === 0 && (
            <div className="glass p-12 text-center text-slate-500 text-sm">
              No students fit the current search queries or filters. Try adjusting your fields.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
