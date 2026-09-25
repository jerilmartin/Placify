"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, Building2, MapPin, Trophy, ArrowRight, CalendarClock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { interviewAppointmentsApi } from "@/lib/api";
import type { InterviewAppointment } from "@/lib/types";

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

interface JobApplicationRow {
  id: string;
  status: string;
  created_at: string;
  next_step?: string | null;
  next_step_date?: string | null;
  jobs: { id: string; company: string; title: string; location: string | null; package_lpa: number | null } | null;
}

function getStageIndex(status: string): number {
  const s = (status || "").toLowerCase();
  if (s === "selected" || s === "offered" || s === "accepted" || s === "offer") return 5;
  if (s === "interview" || s === "interviewed") return 4;
  if (s === "assessment") return 3;
  if (s === "shortlisted") return 2;
  if (s === "eligible" || s === "screened" || s === "reviewed") return 1;
  return 0; // default "registered"
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<AppliedDrive[]>([]);
  const [appointments, setAppointments] = useState<InterviewAppointment[]>([]);
  const [appointmentError, setAppointmentError] = useState("");
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
        .select("id, status, created_at, next_step, next_step_date, jobs(id, company, title, location, package_lpa)")
        .eq("student_id", sp.id)
        .order("created_at", { ascending: false });

      const formattedJobApps: AppliedDrive[] = ((jobData || []) as unknown as JobApplicationRow[]).map((ja) => ({
        id: ja.id,
        status: ja.status || "applied",
        registered_at: ja.created_at,
        created_at: ja.created_at,
        next_step: ja.next_step,
        next_step_date: ja.next_step_date,
        placement_drives: ja.jobs ? {
          id: ja.jobs.id,
          company_name: ja.jobs.company || "Company",
          role: ja.jobs.title || "Role",
          title: ja.jobs.title || "Role",
          location: ja.jobs.location || null,
          package_lpa: ja.jobs.package_lpa ?? null,
          drive_date: null,
        } : null,
      }));

      const merged = [...((driveData as unknown as AppliedDrive[]) || []), ...formattedJobApps];
      merged.sort((a, b) =>
        new Date(b.registered_at || b.created_at || 0).getTime() - new Date(a.registered_at || a.created_at || 0).getTime()
      );

      setApplications(merged);
      try {
        const { data } = await interviewAppointmentsApi.forStudent();
        setAppointments(data || []);
        setAppointmentError("");
      } catch (cause: unknown) {
        const response = cause as { response?: { data?: { detail?: string } } };
        setAppointmentError(response.response?.data?.detail || "Interview appointments could not be loaded.");
      }
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight md:text-[30px] text-foreground">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {applications.length} application{applications.length !== 1 ? "s" : ""} tracked · direct jobs and campus drives
          </p>
        </div>
        <Button size="sm" asChild className="bg-primary text-primary-foreground hover:bg-[#660019] shadow-xs">
          <Link href="/student/jobs">
            Browse Opportunities <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {appointmentError && <p role="alert" className="mb-5 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-foreground">{appointmentError}</p>}
      {appointments.some((appointment) => appointment.status === "scheduled") && <section className="mb-7" aria-label="Upcoming interviews"><h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold"><CalendarClock className="h-5 w-5 text-primary" />Upcoming interviews</h2><div className="grid gap-3 md:grid-cols-2">{appointments.filter((appointment) => appointment.status === "scheduled").map((appointment) => <article key={appointment.id} className="rounded-lg border border-primary/25 bg-card p-5 shadow-sharp"><div className="text-xs font-semibold uppercase tracking-wider text-primary">{appointment.round_name}</div><h3 className="mt-1 font-display text-lg font-semibold">{appointment.company_name} · {appointment.role_title}</h3><p className="mt-2 text-sm font-medium">{new Date(appointment.starts_at).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })} · {appointment.duration_minutes} min</p>{appointment.meeting_mode === "online" && appointment.meeting_url ? <a href={appointment.meeting_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Join interview <ExternalLink className="h-3.5 w-3.5" /></a> : <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{appointment.location}</p>}{appointment.notes && <p className="mt-3 text-xs text-muted-foreground">Preparation: {appointment.notes}</p>}</article>)}</div></section>}

      {/* Stage Summary Cards */}
      <div className="mb-6 grid grid-cols-3 gap-2 md:grid-cols-6">
        {STAGES.map((s, i) => {
          const count = applications.filter((a) => getStageIndex(a.status) === i).length;
          const isActive = count > 0 && i === 5;
          return (
            <div key={s} className="rounded-lg border border-border bg-card p-3.5 shadow-sharp">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s}</div>
              <div className={`mt-1 font-display text-xl font-semibold tabular-nums ${isActive ? "text-[#D4AF37]" : "text-foreground"}`}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card p-8 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">No Applications Registered</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              You have not registered for any active campus placement drives yet.
            </p>
          </div>
          <Button size="sm" asChild className="mt-2 bg-primary text-primary-foreground hover:bg-[#660019]">
            <Link href="/student/jobs">Explore Placement Drives</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3.5">
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
                className="rounded-lg border border-border bg-card p-5 shadow-sharp hover:border-primary/40 transition-colors"
              >
                {/* Drive Title and Info */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-[17px] font-semibold text-foreground">{company}</h3>
                      <Badge className={cn("text-[10.5px] capitalize",
                        app.status === "selected" ? "bg-success/15 text-success border-success/30" :
                        app.status === "rejected" ? "bg-destructive/15 text-destructive border-destructive/30" :
                        "border border-[#E8D9A8] bg-[#FCF9EE] text-[#785A00]"
                      )}>
                        {app.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">{roleName}</p>

                    <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                      {drive?.location && (
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{drive.location}</span>
                      )}
                      {drive?.package_lpa && (
                        <span className="flex items-center gap-1 font-semibold text-foreground"><Trophy className="h-3.5 w-3.5 text-[#D4AF37]" />₹{drive.package_lpa} LPA</span>
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
                                  ? "border-primary bg-primary text-primary-foreground ring-2 ring-[#D4AF37]/50"
                                  : "border-border bg-card text-muted-foreground",
                            )}
                          >
                            {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : current ? <Clock className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
                          </div>
                          <div
                            className={cn(
                              "mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-center",
                              done || current ? "text-foreground" : "text-muted-foreground",
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
                <div className="mt-4 flex items-center justify-between rounded border border-border bg-muted/30 px-3.5 py-2 text-[12px]">
                  <span className="font-semibold uppercase tracking-wider text-muted-foreground text-[10.5px]">Status Note</span>
                  <span className="text-foreground font-medium">
                    {appointments.find((appointment) => appointment.status === "scheduled" && (appointment.job_application_id === app.id || appointment.drive_application_id === app.id))
                      ? "Recruiter interview scheduled — see details above"
                      : app.next_step_date
                      ? `Next step: ${app.next_step || "Interview"} on ${new Date(`${app.next_step_date}T00:00:00`).toLocaleDateString("en-IN")}`
                      : drive?.drive_date
                      ? `Placement drive date: ${new Date(drive.drive_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                      : "Application submitted · Awaiting recruiter updates"}
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
