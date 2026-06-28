"use client";

import { useEffect, useState } from "react";
import { mentorsApi } from "@/lib/api";
import { LayoutDashboard, Calendar, Star, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn, getStatusColor } from "@/lib/utils";
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
    mentorsApi.listSessions().then(r => setSessions(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const upcoming = sessions.filter(s => s.status === "scheduled");
  const completed = sessions.filter(s => s.status === "completed");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><LayoutDashboard className="w-4 h-4" /> Dashboard</div>
        <h1 className="text-2xl font-bold text-white">Mentor Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Manage sessions, track student progress, and inspire the next generation.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Upcoming", value: upcoming.length, icon: Calendar, color: "bg-amber-500/20 text-amber-400" },
          { label: "Completed", value: completed.length, icon: Star, color: "bg-emerald-500/20 text-emerald-400" },
          { label: "Total Hours", value: `${Math.round(sessions.reduce((a, s) => a + s.duration_minutes, 0) / 60)}h`, icon: Clock, color: "bg-purple-500/20 text-purple-400" },
        ].map(s => (
          <div key={s.label} className="glass p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">{s.label}</span>
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", s.color)}><s.icon className="w-3.5 h-3.5" /></div>
            </div>
            <div className="text-3xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Sessions list */}
      <h2 className="text-sm font-medium text-slate-400 mb-3">All Sessions</h2>
      {sessions.length === 0 ? (
        <div className="glass p-10 text-center text-slate-500 text-sm">No sessions booked yet. Students will book sessions with you once your profile is approved.</div>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => (
            <div key={s.id} className="glass p-4 border border-white/5 flex items-start justify-between">
              <div>
                <div className="font-medium text-white text-sm">{s.topic}</div>
                <div className="text-xs text-slate-500 mt-0.5">{formatDate(s.scheduled_at)} · {s.duration_minutes} min</div>
                {s.notes && <div className="text-xs text-slate-600 mt-1">{s.notes}</div>}
              </div>
              <div className="flex items-center gap-2">
                {s.student_rating && (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" />{s.student_rating}
                  </span>
                )}
                <span className={cn("px-2.5 py-1 rounded-full text-xs capitalize", getStatusColor(s.status))}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
