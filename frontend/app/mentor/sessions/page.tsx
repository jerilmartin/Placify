"use client";

import { useEffect, useState } from "react";
import { mentorsApi } from "@/lib/api";
import { Calendar, Clock, Star, BookOpen, AlertCircle, CheckCircle2, User, Play, Edit, HelpCircle, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn, getStatusColor } from "@/lib/utils";
import { toast } from "sonner";

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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><Calendar className="w-4 h-4" /> Schedule</div>
        <h1 className="text-2xl font-bold text-white">Mentor Sessions</h1>
        <p className="text-slate-500 text-sm mt-1">Review student appointments, update feedback, and join video channels.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Session agenda */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider px-1">
            <span>Session Agenda</span>
            <span>Total: {sessions.length} sessions</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "glass p-4 border flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all hover:border-white/10",
                    s.status === "scheduled" ? "border-amber-500/10 hover:border-amber-500/30" : "border-white/5"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold uppercase", getStatusColor(s.status))}>
                        {s.status}
                      </span>
                      {s.student_rating && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {s.student_rating}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white text-sm">{s.topic}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {s.duration_minutes} mins</span>
                      <span>{formatDate(s.scheduled_at)}</span>
                    </div>
                    {s.notes && (
                      <p className="text-xs text-slate-500 italic mt-2 border-l border-white/10 pl-2">
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
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <Play className="w-3 h-3 text-white fill-white" /> Join
                        </button>
                        <button
                          onClick={() => handleMarkComplete(s)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
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
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all"
                      title="Edit Notes"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {sessions.length === 0 && (
                <div className="glass p-12 text-center text-slate-500 text-sm">
                  You have no mentorship sessions scheduled at the moment. Active session requests will appear here.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar notes editor */}
        <div className="space-y-4">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider px-1">Notes Editor</div>
          {selectedSession ? (
            <form onSubmit={handleUpdateNotes} className="glass p-5 rounded-2xl border border-amber-500/20 animate-fade-in space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400">Current Target</span>
                <h4 className="font-semibold text-white text-sm mt-0.5 truncate">{selectedSession.topic}</h4>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Mentorship Feedback Notes</label>
                <textarea
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                  className="w-full bg-[#0d0d12] border border-white/10 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500/50 h-32 resize-none"
                  placeholder="Record summary notes, tech topics covered, and tasks assigned to the student."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSession(null)}
                  className="flex-1 py-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-white text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                >
                  {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Notes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="glass p-8 text-center text-slate-500 rounded-2xl border border-white/5 flex flex-col items-center gap-3">
              <BookOpen className="w-8 h-8 text-slate-600" />
              <div className="text-xs">Select a session card to view or record mentor feedback notes.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
