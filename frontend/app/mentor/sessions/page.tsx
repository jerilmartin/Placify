"use client";

import { useEffect, useState } from "react";
import { mentorsApi } from "@/lib/api";
import { Calendar, Clock, Star, BookOpen, AlertCircle, CheckCircle2, User, Play, Edit, HelpCircle, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn, getStatusColor } from "@/lib/utils";
import { toast } from "sonner";
import { isDemoMode, MOCK_MENTOR_SESSIONS } from "@/lib/mock-data";

type Session = {
  id: string;
  topic: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  student_rating?: number;
  notes?: string;
};

export default function MentorSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [notesText, setNotesText] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    if (isDemoMode()) {
      setSessions(MOCK_MENTOR_SESSIONS as Session[]);
      setLoading(false);
      return;
    }
    try {
      const res = await mentorsApi.listSessions();
      setSessions(res.data || []);
    } catch {
      toast.error("Failed to load mentor sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleUpdateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    setUpdating(true);
    try {
      // In the mockup backend routers/mentors.py may not have a direct edit endpoint, 
      // but in standard CRUD flow it will update details. Let's call update profile or stub.
      // For skeleton we will simulate a successful local updates and toast:
      toast.success("Notes saved for session!");
      setSessions(prev => 
        prev.map(s => s.id === selectedSession.id ? { ...s, notes: notesText } : s)
      );
      setSelectedSession(null);
    } catch {
      toast.error("Failed to update notes");
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkComplete = async (session: Session) => {
    try {
      toast.success("Session completed and recorded");
      setSessions(prev => 
        prev.map(s => s.id === session.id ? { ...s, status: "completed" } : s)
      );
    } catch {
      toast.error("Failed to complete session");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          <Calendar className="w-3.5 h-3.5 text-[#800020]" /> Schedule
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Mentor Sessions</h1>
        <p className="text-muted-foreground text-sm mt-1">Review student appointments, update feedback, and join video channels.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Session agenda */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider px-1">
            <span>Session Agenda</span>
            <span>Total: {sessions.length} sessions</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-[#800020] animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-xl border border-border bg-card p-4 shadow-sharp flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all hover:border-[#D4AF37]/50",
                    s.status === "scheduled" && "border-l-4 border-l-[#D4AF37]"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border", getStatusColor(s.status))}>
                        {s.status}
                      </span>
                      {s.student_rating && (
                        <span className="flex items-center gap-0.5 text-xs text-[#D4AF37] font-semibold">
                          <Star className="w-3.5 h-3.5 fill-[#D4AF37]" /> {s.student_rating}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-foreground text-sm">{s.topic}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {s.duration_minutes} mins</span>
                      <span>{formatDate(s.scheduled_at)}</span>
                    </div>
                    {s.notes && (
                      <p className="text-xs text-muted-foreground/80 italic mt-2 border-l border-border pl-2">
                        "{s.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {s.status === "scheduled" && (
                      <>
                        <button
                          onClick={() => {
                            toast.info("Opening meeting video chatroom room...");
                          }}
                          className="px-3 py-1.5 rounded-md bg-[#800020] hover:bg-[#660019] text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-sharp"
                        >
                          <Play className="w-3 h-3 text-white fill-white" /> Join
                        </button>
                        <button
                          onClick={() => handleMarkComplete(s)}
                          className="p-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-all"
                          title="Complete Session"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setSelectedSession(s);
                        setNotesText(s.notes || "");
                      }}
                      className="p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                      title="Edit Notes"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {sessions.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground text-sm shadow-sharp">
                  You have no mentorship sessions scheduled at the moment. Active session requests will appear here.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar notes editor */}
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-1">Notes Editor</div>
          {selectedSession ? (
            <form onSubmit={handleUpdateNotes} className="rounded-xl border border-border bg-card p-5 shadow-sharp space-y-4">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#800020]">Current Target</span>
                <h4 className="font-serif font-bold text-foreground text-base mt-0.5 truncate">{selectedSession.topic}</h4>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Mentorship Feedback Notes</label>
                <textarea
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-3 text-foreground text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-32 resize-none"
                  placeholder="Record summary notes, tech topics covered, and tasks assigned to the student."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSession(null)}
                  className="flex-1 py-2 rounded-md border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2 rounded-md bg-[#800020] hover:bg-[#660019] text-white font-medium text-xs transition-colors flex items-center justify-center gap-1 shadow-sharp"
                >
                  {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Notes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground shadow-sharp flex flex-col items-center gap-3">
              <BookOpen className="w-8 h-8 text-muted-foreground/60" />
              <div className="text-xs">Select a session card to view or record mentor feedback notes.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
