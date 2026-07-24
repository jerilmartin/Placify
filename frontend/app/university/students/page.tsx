"use client";

import { useEffect, useState } from "react";
import { Search, GraduationCap, Mail, Phone, BookOpen, Award, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

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

  useEffect(() => {
    const loadStudents = async () => {
      const { data, error } = await supabase
        .from("student_profiles")
        .select("id, full_name, email, course, cgpa, active_backlogs, graduation_year, profile_completion, skills")
        .order("created_at", { ascending: false });

      if (error) console.error("Error loading students:", error);
      setStudents(data || []);
      setLoading(false);
    };

    loadStudents();
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.course || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Student Cohort</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {students.length} student{students.length !== 1 ? "s" : ""} registered in placement system
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-surface p-2">
        <div className="flex flex-1 items-center gap-2 px-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student by name, email, course…"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Roster Table */}
      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-[14px] text-muted-foreground">No students found matching your query.</p>
          {search && <Button size="sm" variant="outline" onClick={() => setSearch("")}>Clear Search</Button>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-elevated/50 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Course / Batch</th>
                  <th className="px-4 py-3 font-medium">CGPA</th>
                  <th className="px-4 py-3 font-medium">Backlogs</th>
                  <th className="px-4 py-3 font-medium">Profile %</th>
                  <th className="px-4 py-3 font-medium">Skills</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-elevated/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-foreground">{s.full_name || "Unnamed Student"}</div>
                      <div className="text-[12px] text-muted-foreground">{s.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium">{s.course || "—"}</div>
                      {s.graduation_year && (
                        <div className="text-[11.5px] text-muted-foreground">Batch of {s.graduation_year}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold tabular-nums">
                      {s.cgpa != null ? s.cgpa.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge className={s.active_backlogs === 0 ? "bg-success/15 text-success border-success/30" : "bg-warning/15 text-warning border-warning/30"}>
                        {s.active_backlogs ?? 0} Backlogs
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 tabular-nums font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${s.profile_completion ?? 0}%` }}
                          />
                        </div>
                        <span>{s.profile_completion ?? 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(s.skills || []).slice(0, 3).map((sk) => (
                          <span key={sk} className="rounded border border-border bg-elevated px-1.5 py-0.5 text-[11px]">
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
