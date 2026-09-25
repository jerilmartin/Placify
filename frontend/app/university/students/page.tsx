"use client";

import { useEffect, useState } from "react";
import { Download, Search, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { universitiesApi } from "@/lib/api";
import { toast } from "sonner";

interface Student {
  id: string;
  full_name: string | null;
  email: string | null;
  course: string | null;
  cgpa: number | null;
  active_backlogs: number | null;
  graduation_year: number | null;
  profile_completion: number | null;
  skills: string[] | null;
}

export default function UniversityStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("all");
  const [minCgpa, setMinCgpa] = useState("");
  const [backlogFilter, setBacklogFilter] = useState("all");

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const { data } = await universitiesApi.listStudents();
        setStudents(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Could not load the university student cohort");
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  const branches = Array.from(new Set(students.map((student) => student.course).filter(Boolean) as string[])).sort();
  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch = (
      !q ||
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.course || "").toLowerCase().includes(q)
    );
    const matchesBranch = branch === "all" || s.course === branch;
    const matchesCgpa = !minCgpa || (s.cgpa ?? 0) >= Number(minCgpa);
    const matchesBacklogs = backlogFilter === "all" ||
      (backlogFilter === "none" ? (s.active_backlogs ?? 0) === 0 : (s.active_backlogs ?? 0) > 0);
    return matchesSearch && matchesBranch && matchesCgpa && matchesBacklogs;
  });

  const exportCsv = () => {
    const rows = filtered.map((student) => [student.full_name, student.email, student.course, student.graduation_year, student.cgpa, student.active_backlogs, student.profile_completion]);
    const csv = [["Name", "Email", "Branch", "Graduation Year", "CGPA", "Active Backlogs", "Profile Completion"], ...rows]
      .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `student_cohort_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Student Cohort</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {students.length} student{students.length !== 1 ? "s" : ""} registered in placement database
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 grid gap-2 rounded-xl border border-border bg-card p-2.5 shadow-sharp md:grid-cols-[1fr_220px_140px_150px_auto]">
        <div className="flex flex-1 items-center gap-2 px-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student by name, email, course…"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 text-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select value={branch} onChange={(event) => setBranch(event.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
          <option value="all">All branches</option>
          {branches.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <Input type="number" min="0" max="10" step="0.1" value={minCgpa} onChange={(event) => setMinCgpa(event.target.value)} placeholder="Min CGPA" className="h-9" />
        <select value={backlogFilter} onChange={(event) => setBacklogFilter(event.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
          <option value="all">All backlogs</option><option value="none">No backlogs</option><option value="active">Has backlogs</option>
        </select>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={filtered.length === 0}><Download className="mr-1 h-3.5 w-3.5" />Export</Button>
      </div>

      {/* Roster Table */}
      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#800020] border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card shadow-sharp p-8 text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-serif text-lg font-bold text-foreground">No students found matching your query.</p>
          {search && <Button size="sm" variant="outline" onClick={() => setSearch("")}>Clear Search</Button>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sharp">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border font-semibold">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Student</th>
                  <th className="px-4 py-3.5 font-semibold">Course / Batch</th>
                  <th className="px-4 py-3.5 font-semibold">CGPA</th>
                  <th className="px-4 py-3.5 font-semibold">Backlogs</th>
                  <th className="px-4 py-3.5 font-semibold">Profile %</th>
                  <th className="px-4 py-3.5 font-semibold">Skills</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-serif font-semibold text-foreground">{s.full_name || "Unnamed Student"}</div>
                      <div className="text-[12px] text-muted-foreground">{s.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-foreground">{s.course || "—"}</div>
                      {s.graduation_year && (
                        <div className="text-[11.5px] text-muted-foreground">Batch of {s.graduation_year}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-bold tabular-nums text-foreground">
                      {s.cgpa != null ? s.cgpa.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge className={s.active_backlogs === 0 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"}>
                        {s.active_backlogs ?? 0} Backlogs
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 tabular-nums font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-[#800020] transition-all"
                            style={{ width: `${s.profile_completion ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{s.profile_completion ?? 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(s.skills || []).slice(0, 3).map((sk) => (
                          <span key={sk} className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground">
                            {sk}
                          </span>
                        ))}
                        {(s.skills?.length ?? 0) > 3 && (
                          <span className="text-[11px] text-muted-foreground">+{(s.skills?.length ?? 0) - 3} more</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
