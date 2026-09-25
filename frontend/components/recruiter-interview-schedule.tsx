"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, ExternalLink, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { interviewAppointmentsApi } from "@/lib/api";
import type { InterviewAppointment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function localInputValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function RecruiterInterviewSchedule() {
  const [interviews, setInterviews] = useState<InterviewAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<InterviewAppointment | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editRound, setEditRound] = useState("");
  const [editDuration, setEditDuration] = useState(45);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await interviewAppointmentsApi.forRecruiter();
      setInterviews(data || []);
      setError("");
    } catch (cause: unknown) {
      const response = cause as { response?: { data?: { detail?: string } } };
      setError(response.response?.data?.detail || "Could not load interview schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    interviewAppointmentsApi.forRecruiter()
      .then(({ data }) => { setInterviews(data || []); setError(""); })
      .catch((cause: unknown) => {
        const response = cause as { response?: { data?: { detail?: string } } };
        setError(response.response?.data?.detail || "Could not load interview schedule");
      })
      .finally(() => setLoading(false));
  }, []);

  const openEditor = (appointment: InterviewAppointment) => {
    setEditing(appointment);
    setEditDate(localInputValue(appointment.starts_at));
    setEditLink(appointment.meeting_url || "");
    setEditLocation(appointment.location || "");
    setEditRound(appointment.round_name);
    setEditDuration(appointment.duration_minutes);
    setEditNotes(appointment.notes || "");
  };

  const update = async (appointment: InterviewAppointment, changes: Record<string, unknown>) => {
    setSaving(true);
    try {
      await interviewAppointmentsApi.update(appointment.id, changes);
      toast.success(changes.status === "cancelled" ? "Interview cancelled" : changes.status === "completed" ? "Interview completed" : "Interview updated");
      setEditing(null);
      await load();
    } catch (cause: unknown) {
      const response = cause as { response?: { data?: { detail?: string } } };
      toast.error(response.response?.data?.detail || "Could not update interview");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = () => {
    if (!editing) return;
    const startsAt = new Date(editDate);
    if (Number.isNaN(startsAt.getTime()) || startsAt <= new Date()) {
      toast.error("Choose a future interview time");
      return;
    }
    void update(editing, {
      starts_at: startsAt.toISOString(),
      meeting_url: editing.meeting_mode === "online" ? editLink.trim() : null,
      location: editing.meeting_mode === "in_person" ? editLocation.trim() : null,
      round_name: editRound.trim(),
      duration_minutes: editDuration,
      notes: editNotes.trim() || null,
    });
  };

  const upcoming = interviews.filter((item) => item.status === "scheduled");
  const history = interviews.filter((item) => item.status !== "scheduled");

  return <div className="mx-auto max-w-5xl p-6 md:p-8">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recruiter · Schedule</div><h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground">Interview Schedule</h1><p className="mt-1 text-sm text-muted-foreground">Scheduled interviews for direct jobs and approved campus drives.</p></div><Button asChild><Link href="/recruiter/candidates">Schedule from pipeline</Link></Button></div>
    {loading ? <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : error ? <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{error}</div> : <>
      {upcoming.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-sharp"><CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">No upcoming interviews. Select an applicant in Candidate Pipeline to schedule one.</p><Button asChild variant="outline" className="mt-4"><Link href="/recruiter/candidates">Open candidate pipeline</Link></Button></div> : <div className="space-y-3">{upcoming.map((item) => <article key={item.id} className="rounded-xl border border-border bg-card p-5 shadow-sharp"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-serif text-lg font-semibold">{item.student_profiles?.full_name || "Student"}</h2><p className="mt-1 text-sm text-muted-foreground">{item.company_name} · {item.role_title} · {item.round_name}</p><p className="mt-2 text-sm font-medium">{new Date(item.starts_at).toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })} · {item.duration_minutes} min</p>{item.meeting_mode === "online" && item.meeting_url ? <a className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline" href={item.meeting_url} target="_blank" rel="noopener noreferrer">Open meeting link <ExternalLink className="h-3.5 w-3.5" /></a> : <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{item.location}</p>}{item.notes && <p className="mt-2 text-xs text-muted-foreground">{item.notes}</p>}</div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => openEditor(item)}>Reschedule / edit</Button><Button size="sm" variant="outline" disabled={saving} onClick={() => { if (window.confirm("Mark this interview completed?")) void update(item, { status: "completed" }); }}>Mark completed</Button><Button size="sm" variant="ghost" disabled={saving} onClick={() => { if (window.confirm("Cancel this interview and notify the student?")) void update(item, { status: "cancelled" }); }}>Cancel</Button></div></div></article>)}</div>}
      {history.length > 0 && <section className="mt-8"><h2 className="mb-3 font-display text-lg font-semibold">Past and cancelled</h2><div className="space-y-2">{history.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-4 text-sm"><span>{item.student_profiles?.full_name || "Student"} · {item.role_title} · {new Date(item.starts_at).toLocaleDateString()}</span><span className="capitalize text-muted-foreground">{item.status}</span></div>)}</div></section>}
    </>}
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div role="dialog" aria-modal="true" aria-labelledby="reschedule-title" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-2xl"><h2 id="reschedule-title" className="font-display text-xl font-semibold">Edit interview details</h2><p className="mt-1 text-sm text-muted-foreground">{editing.student_profiles?.full_name} · {editing.role_title}</p><div className="mt-5 space-y-4"><label className="block text-xs font-medium">Round name<Input className="mt-1.5" value={editRound} onChange={(event) => setEditRound(event.target.value)} maxLength={100} /></label><div className="grid grid-cols-2 gap-3"><label className="block text-xs font-medium">Date and time<Input className="mt-1.5" type="datetime-local" value={editDate} onChange={(event) => setEditDate(event.target.value)} /></label><label className="block text-xs font-medium">Duration (minutes)<Input className="mt-1.5" type="number" min={15} max={180} value={editDuration} onChange={(event) => setEditDuration(Number(event.target.value))} /></label></div>{editing.meeting_mode === "online" ? <label className="block text-xs font-medium">HTTPS meeting link<Input className="mt-1.5" type="url" value={editLink} onChange={(event) => setEditLink(event.target.value)} /></label> : <label className="block text-xs font-medium">Venue / room<Input className="mt-1.5" value={editLocation} onChange={(event) => setEditLocation(event.target.value)} /></label>}<label className="block text-xs font-medium">Student-facing preparation notes<textarea className="mt-1.5 w-full rounded-md border border-input bg-background p-2 text-sm" rows={3} maxLength={2000} value={editNotes} onChange={(event) => setEditNotes(event.target.value)} /></label></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" disabled={saving} onClick={() => setEditing(null)}>Close</Button><Button disabled={saving || !editDate || !editRound.trim() || (editing.meeting_mode === "online" ? !editLink.trim() : !editLocation.trim())} onClick={saveEdit}>{saving ? "Saving…" : "Save and notify"}</Button></div></div></div>}
  </div>;
}
