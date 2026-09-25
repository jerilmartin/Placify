"use client";

import { useEffect, useState } from "react";
import { mentorsApi } from "@/lib/api";
import { LayoutDashboard, Calendar, Star, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn, getStatusColor } from "@/lib/utils";
import { isDemoMode, MOCK_MENTOR_SESSIONS } from "@/lib/mock-data";
// We use a general type here since MentorSessionResponse is not fully in types.ts
type Session = {
  id: string;
  topic: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  student_rating?: number;
  notes?: string;
};

export default function MentorDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setSessions(MOCK_MENTOR_SESSIONS as Session[]);
      setLoading(false);
      return;
    }
    mentorsApi.listSessions().then(r => setSessions(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const upcoming = sessions.filter(s => s.status === "scheduled");
  const completed = sessions.filter(s => s.status === "completed");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          <LayoutDashboard className="w-3.5 h-3.5 text-[#800020]" /> Dashboard
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Mentor Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage sessions, track student progress, and inspire the next generation.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Upcoming", value: upcoming.length, icon: Calendar, color: "text-[#800020] bg-[#800020]/10" },
          { label: "Completed", value: completed.length, icon: Star, color: "text-[#D4AF37] bg-[#D4AF37]/15" },
          { label: "Total Hours", value: `${Math.round(sessions.reduce((a, s) => a + s.duration_minutes, 0) / 60)}h`, icon: Clock, color: "text-[#0A192F] bg-[#0A192F]/10" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5 shadow-sharp">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{s.label}</span>
              <div className={cn("w-7 h-7 rounded-md flex items-center justify-center border border-border/50", s.color)}><s.icon className="w-3.5 h-3.5" /></div>
            </div>
            <div className="font-serif text-3xl font-bold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Sessions list */}
      <div className="rounded-xl border border-border bg-card shadow-sharp overflow-hidden">
        <div className="border-b border-border bg-muted/40 px-5 py-3">
          <h2 className="font-serif text-base font-semibold text-foreground">All Sessions</h2>
        </div>
        {sessions.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">No sessions booked yet. Students will book sessions with you once your profile is approved.</div>
        ) : (
          <div className="divide-y divide-border">
            {sessions.map(s => (
              <div key={s.id} className="p-4 flex items-start justify-between hover:bg-muted/30 transition-colors">
                <div>
                  <div className="font-medium text-foreground text-sm">{s.topic}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatDate(s.scheduled_at)} · {s.duration_minutes} min</div>
                  {s.notes && <div className="text-xs text-muted-foreground/80 mt-1 italic pl-2 border-l border-border">{s.notes}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {s.student_rating && (
                    <span className="flex items-center gap-1 text-xs text-[#D4AF37] font-semibold">
                      <Star className="w-3 h-3 fill-[#D4AF37]" />{s.student_rating}
                    </span>
                  )}
                  <span className={cn("px-2.5 py-1 rounded-md text-xs font-medium capitalize border", getStatusColor(s.status))}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
