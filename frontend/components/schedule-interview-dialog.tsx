"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { interviewAppointmentsApi } from "@/lib/api";

interface Props {
  candidateId: string;
  candidateName: string;
  roleTitle: string;
  applicationKind: "job" | "drive";
  onClose: () => void;
  onCreated: (applicationId: string) => void;
}

export function ScheduleInterviewDialog({ candidateId, candidateName, roleTitle, applicationKind, onClose, onCreated }: Props) {
  const [startsAt, setStartsAt] = useState("");
  const [roundName, setRoundName] = useState("Technical interview");
  const [duration, setDuration] = useState(45);
  const [mode, setMode] = useState<"online" | "in_person">("online");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime()) || start <= new Date()) {
      toast.error("Choose a future interview time");
      return;
    }
    setSaving(true);
    try {
      await interviewAppointmentsApi.create({
        application_kind: applicationKind,
        application_id: candidateId,
        starts_at: start.toISOString(),
        duration_minutes: duration,
        round_name: roundName.trim(),
        meeting_mode: mode,
        meeting_url: mode === "online" ? meetingUrl.trim() : null,
        location: mode === "in_person" ? location.trim() : null,
        notes: notes.trim() || null,
      });
      onCreated(candidateId);
      toast.success("Interview scheduled; the student can view it in Applications");
    } catch (error: unknown) {
      const response = error as { response?: { data?: { detail?: string } } };
      toast.error(response.response?.data?.detail || "Could not schedule interview. Check time and meeting details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="schedule-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="schedule-title" className="font-display text-xl font-semibold">Schedule interview</h2>
            <p className="mt-1 text-sm text-muted-foreground">{candidateName} · {roleTitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 space-y-4">
          <label className="block text-xs font-medium">Round name<Input className="mt-1.5" value={roundName} onChange={(event) => setRoundName(event.target.value)} maxLength={100} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium">Date and time<Input className="mt-1.5" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label>
            <label className="block text-xs font-medium">Duration (minutes)<Input className="mt-1.5" type="number" min={15} max={180} value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></label>
          </div>
          <p className="text-xs text-muted-foreground">Time is entered in your browser&apos;s local timezone and shown in the student&apos;s local timezone.</p>
          <label className="block text-xs font-medium">Meeting mode
            <select className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={mode} onChange={(event) => setMode(event.target.value as "online" | "in_person") }>
              <option value="online">Online</option><option value="in_person">In person</option>
            </select>
          </label>
          {mode === "online" ? (
            <label className="block text-xs font-medium">HTTPS meeting link
              <Input className="mt-1.5" type="url" placeholder="https://meet.google.com/..." value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} />
              <span className="mt-1 block font-normal text-muted-foreground">Create a Google Calendar/Meet invite first, then paste its link here.</span>
            </label>
          ) : (
            <label className="block text-xs font-medium">Venue / room<Input className="mt-1.5" placeholder="Building and room number" value={location} onChange={(event) => setLocation(event.target.value)} /></label>
          )}
          <label className="block text-xs font-medium">Student-facing preparation notes (optional)
            <textarea className="mt-1.5 w-full rounded-md border border-input bg-background p-2 text-sm" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="button" onClick={save} disabled={saving || !startsAt || roundName.trim().length < 2 || duration < 15 || duration > 180 || (mode === "online" ? !meetingUrl.trim() : !location.trim())}>{saving ? "Saving…" : "Confirm and notify student"}</Button>
        </div>
      </div>
    </div>
  );
}
