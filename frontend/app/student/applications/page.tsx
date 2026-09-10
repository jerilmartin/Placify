"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, Building2, MapPin, Trophy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const STAGES = ["Applied", "Screened", "Shortlisted", "Assessment", "Interview", "Offer"];

interface AppliedDrive {
  id: string;
  status: string;
  registered_at?: string;
  created_at?: string;
  next_step_date?: string | null;
  next_step?: string | null;
  placement_drives: {
    id: string;
    company_name: string;
    role: string | null;
    title: string;
    location: string | null;
    package_lpa: number | null;
    drive_date: string | null;
  } | null;
}

function getStageIndex(status: string): number {
  const s = (status || "").toLowerCase();
  if (s === "selected" || s === "offer") return 5;
  if (s === "interview" || s === "interviewed") return 4;
  if (s === "assessment") return 3;
  if (s === "shortlisted") return 2;
  if (s === "eligible" || s === "screened") return 1;
  return 0; // default "registered"
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<AppliedDrive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadApplications = async () => {
      // 1. Get student profile ID
      const { data: sp } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!sp?.id) {
        setLoading(false);
        return;
      }

      // 2. Fetch drive applications joined with placement_drives
      const { data: driveData } = await supabase
        .from("drive_applications")
        .select("id, status, registered_at, placement_drives(id, company_name, role, title, location, package_lpa, drive_date)")
        .eq("student_id", sp.id)
        .order("registered_at", { ascending: false });

      // 3. Fetch direct job applications joined with jobs
      const { data: jobData } = await supabase
        .from("applications")
        .select("id, status, created_at, jobs(id, company, title, location, salary_min, salary_max)")
        .eq("student_id", sp.id)
        .order("created_at", { ascending: false });

      const formattedJobApps: AppliedDrive[] = (jobData || []).map((ja: any) => ({
        id: ja.id,
        status: ja.status || "applied",
        registered_at: ja.created_at,
        created_at: ja.created_at,
        placement_drives: ja.jobs ? {
          id: ja.jobs.id,
          company_name: ja.jobs.company || "Company",
          role: ja.jobs.title || "Role",
          title: ja.jobs.title || "Role",
          location: ja.jobs.location || null,
          package_lpa: ja.jobs.salary_max
            ? Math.round((ja.jobs.salary_max / 100000) * 10) / 10
            : ja.jobs.salary_min ? Math.round((ja.jobs.salary_min / 100000) * 10) / 10 : null,
          drive_date: null,
        } : null,
      }));

      const merged = [...((driveData as unknown as AppliedDrive[]) || []), ...formattedJobApps];
      merged.sort((a, b) =>
        new Date(b.registered_at || b.created_at || 0).getTime() - new Date(a.registered_at || a.created_at || 0).getTime()
      );

      setApplications(merged);
      setLoading(false);
    };

    loadApplications();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {applications.length} drive application{applications.length !== 1 ? "s" : ""} tracked · updated live
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/student/jobs">
            Browse Placement Drives <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Stage Summary Cards */}
      <div className="mb-6 grid grid-cols-3 gap-2 md:grid-cols-6">
        {STAGES.map((s, i) => {
          const count = applications.filter((a) => getStageIndex(a.status) === i).length;
          return (
            <div key={s} className="rounded-lg border border-border bg-surface p-3">
              <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{s}</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="text-base font-medium">No Applications Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You haven't registered for any placement drives yet.
            </p>
          </div>
          <Button size="sm" asChild className="mt-2">
            <Link href="/student/jobs">Explore Placement Drives</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app, ai) => {
            const drive = app.placement_drives;
            const company = drive?.company_name || "Drive";
            const roleName = drive?.role || drive?.title || "Placement Drive";
            const stageIndex = getStageIndex(app.status);
            const rawDate = app.registered_at || app.created_at;
            const appliedDate = rawDate
              ? new Date(rawDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "Recently";

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: ai * 0.04 }}
                className="rounded-xl border border-border bg-surface p-5 hover:border-primary/30 transition-colors"
              >
                {/* Drive Title and Info */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[16px] font-medium">{company}</h3>
                      <Badge className={cn("text-[11px] capitalize",
                        app.status === "selected" ? "bg-success/15 text-success border-success/30" :
                        app.status === "rejected" ? "bg-destructive/15 text-destructive border-destructive/30" :
                        "bg-primary/15 text-primary border-primary/30"
                      )}>
                        {app.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[13.5px] text-muted-foreground">{roleName}</p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                      {drive?.location && (
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{drive.location}</span>
                      )}
                      {drive?.package_lpa && (
                        <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5" />₹{drive.package_lpa} LPA</span>
                      )}
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Applied on {appliedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Recruitment Pipeline Timeline */}
                <div className="mt-5 flex items-center">
                  {STAGES.map((s, i) => {
                    const done = i < stageIndex;
                    const current = i === stageIndex;
                    return (
                      <div key={s} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                              done
                                ? "border-success bg-success/15 text-success"
                                : current
                                  ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_oklch(0.68_0.19_285/0.15)]"
                                  : "border-border bg-surface text-muted-foreground",
                            )}
                          >
                            {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : current ? <Clock className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
                          </div>
                          <div
                            className={cn(
                              "mt-1.5 text-[10.5px] uppercase tracking-wider text-center",
                              done || current ? "font-medium text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {s}
                          </div>
                        </div>
                        {i < STAGES.length - 1 && (
                          <div className={cn("mx-1 h-px flex-1", i < stageIndex ? "bg-success/50" : "bg-border")} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Status note */}
                <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2 text-[12.5px]">
                  <span className="text-muted-foreground">Status Note</span>
                  <span className="text-foreground font-medium">
                    {drive?.drive_date
                      ? `Drive / interview scheduled for ${new Date(drive.drive_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                      : "Application registered for campus drive · Awaiting placement cell updates"}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
