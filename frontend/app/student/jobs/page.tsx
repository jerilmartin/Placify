"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, CalendarDays, Trophy, Building2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Drive {
  id: string;
  title: string;
  company_name: string;
  role: string | null;
  location: string | null;
  package_lpa: number | null;
  drive_date: string | null;
  registration_deadline: string | null;
  status: string;
  eligibility: {
    min_cgpa?: number;
    max_backlogs?: number;
    eligible_branches?: string[];
  };
}

interface StudentProfile {
  id: string;
  cgpa: number | null;
  active_backlogs: number | null;
  course: string | null;
}

interface EligibilityResult {
  eligible: boolean;
  reason: string;
}

function checkEligibility(drive: Drive, profile: StudentProfile | null): EligibilityResult {
  if (!profile) return { eligible: false, reason: "Complete your profile first" };
  const { eligibility } = drive;
  if (!eligibility || Object.keys(eligibility).length === 0) return { eligible: true, reason: "" };

  if (eligibility.min_cgpa != null) {
    if (profile.cgpa == null) return { eligible: false, reason: `Min CGPA ${eligibility.min_cgpa} required — add your CGPA in profile` };
    if (profile.cgpa < eligibility.min_cgpa) return { eligible: false, reason: `Min CGPA ${eligibility.min_cgpa} required (yours: ${profile.cgpa})` };
  }
  if (eligibility.max_backlogs != null) {
    const backlogs = profile.active_backlogs ?? 0;
    if (backlogs > eligibility.max_backlogs) return { eligible: false, reason: `Max ${eligibility.max_backlogs} backlog(s) allowed (yours: ${backlogs})` };
  }
  if (eligibility.eligible_branches?.length) {
    const course = (profile.course || "").toLowerCase();
    const branchMatch = eligibility.eligible_branches.some((b) => course.includes(b.toLowerCase()));
    if (!branchMatch) return { eligible: false, reason: `Branch not eligible. Allowed: ${eligibility.eligible_branches.join(", ")}` };
  }
  return { eligible: true, reason: "" };
}

export default function JobsPage() {
  const { user } = useAuth();
  const [drives, setDrives] = useState<Drive[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [search, setSearch] = useState("");

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Load student profile
      const { data: sp } = await supabase.from("student_profiles").select("id, cgpa, active_backlogs, course").eq("user_id", user.id).maybeSingle();
      setProfile(sp);

      // Load all active/upcoming drives
      const { data: drivesData } = await supabase
        .from("placement_drives")
        .select("*")
        .in("status", ["upcoming", "active"])
        .order("created_at", { ascending: false });
      setDrives(drivesData || []);

      // Load already applied drives
      if (sp?.id) {
        const { data: apps } = await supabase.from("drive_applications").select("drive_id").eq("student_id", sp.id);
        setApplied(new Set(apps?.map((a) => a.drive_id) || []));
      }

      setLoading(false);
    };
    load();
  }, [user]);

  const applyToDrive = async (drive: Drive) => {
    if (!profile?.id) { showToast("error", "Complete your profile before applying"); return; }
    setApplying(drive.id);
    const { error } = await supabase.from("drive_applications").insert({
      drive_id: drive.id,
      student_id: profile.id,
      status: "registered",
    });
    setApplying(null);
    if (error) {
      showToast("error", error.message);
    } else {
      setApplied((prev) => new Set([...prev, drive.id]));
      showToast("success", `Applied to ${drive.company_name}!`);
    }
  };

  const filtered = drives.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.company_name.toLowerCase().includes(q) || (d.role || "").toLowerCase().includes(q) || (d.location || "").toLowerCase().includes(q);
  });

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-success/15 text-success border border-success/30" : "bg-destructive/15 text-destructive border border-destructive/30"}`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Placement Drives</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} open drive{filtered.length !== 1 ? "s" : ""} · eligibility checked against your profile
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-surface p-2">
        <div className="flex flex-1 items-center gap-2 px-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies, roles, locations…"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Eligibility hint */}
      {!profile && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-[13px] text-warning">
          <Info className="h-4 w-4 shrink-0" />
          Complete your student profile to see eligibility status for each drive.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border">
          <Building2 className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-[14px] text-muted-foreground">No placement drives found</p>
          {search && <Button size="sm" variant="outline" onClick={() => setSearch("")}>Clear search</Button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((drive, i) => {
            const { eligible, reason } = checkEligibility(drive, profile);
            const isApplied = applied.has(drive.id);

            return (
              <motion.article
                key={drive.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className={`rounded-xl border bg-surface p-5 transition-colors ${eligible ? "border-border hover:border-primary/30" : "border-border opacity-80"}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] font-medium">{drive.company_name}</h3>
                      {isApplied && <Badge className="bg-success/10 text-success text-[10.5px]">Applied</Badge>}
                      {!eligible && <Badge className="bg-muted text-muted-foreground text-[10.5px]">Ineligible</Badge>}
                    </div>
                    {drive.role && <p className="mt-0.5 text-[13px] text-muted-foreground">{drive.title} · {drive.role}</p>}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                      {drive.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{drive.location}</span>}
                      {drive.drive_date && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(drive.drive_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                      {drive.package_lpa && <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5" />₹{drive.package_lpa} LPA</span>}
                    </div>

                    {/* Eligibility criteria chips */}
                    {drive.eligibility && Object.keys(drive.eligibility).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {drive.eligibility.min_cgpa != null && (
                          <span className="rounded-md bg-elevated px-2 py-0.5 text-[11px] text-muted-foreground">Min CGPA: {drive.eligibility.min_cgpa}</span>
                        )}
                        {drive.eligibility.max_backlogs != null && (
                          <span className="rounded-md bg-elevated px-2 py-0.5 text-[11px] text-muted-foreground">Max Backlogs: {drive.eligibility.max_backlogs}</span>
                        )}
                        {drive.eligibility.eligible_branches?.map((b) => (
                          <span key={b} className="rounded-md bg-elevated px-2 py-0.5 text-[11px] text-muted-foreground">{b}</span>
                        ))}
                      </div>
                    )}

                    {/* Ineligibility reason */}
                    {!eligible && reason && (
                      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-destructive">
                        <Info className="h-3.5 w-3.5 shrink-0" /> {reason}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {isApplied ? (
                      <Button size="sm" variant="outline" disabled className="opacity-60">Applied ✓</Button>
                    ) : eligible ? (
                      <Button size="sm" onClick={() => applyToDrive(drive)} disabled={applying === drive.id}>
                        {applying === drive.id ? "Applying…" : "Apply Now"}
                      </Button>
                    ) : (
                      <Button size="sm" disabled className="opacity-40 cursor-not-allowed" title={reason}>
                        Not Eligible
                      </Button>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
