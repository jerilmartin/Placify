"use client";

import { useEffect, useState } from "react";
import { notificationsApi } from "@/lib/api";
import { Bell, Briefcase, FileText, Calendar, Sparkles, Users, Clock, Award, Info, Trash2, CheckSquare, Loader2 } from "lucide-react";
import type { Notification, NotificationType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "new_job":
      return { icon: Briefcase, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
    case "application_update":
      return { icon: FileText, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
    case "interview_scheduled":
      return { icon: Calendar, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    case "resume_feedback":
      return { icon: Sparkles, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    case "drive_registration":
      return { icon: Users, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" };
    case "session_reminder":
      return { icon: Clock, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" };
    case "offer_received":
      return { icon: Award, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
    default:
      return { icon: Info, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" };
  }
};

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.list({ unread_only: unreadOnly });
      setNotifications(res.data || []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [unreadOnly]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      toast.success("Notification marked as read");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><Bell className="w-4 h-4" /> Account</div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">Stay updated with placement results, interviews, and mentor session bookings.</p>
        </div>
        
        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-xs hover:bg-white/10 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setUnreadOnly(false)}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all",
            !unreadOnly 
              ? "bg-purple-600/20 text-purple-300 border-purple-500/20" 
              : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10"
          )}
        >
          All
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all",
            unreadOnly 
              ? "bg-purple-600/20 text-purple-300 border-purple-500/20" 
              : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10"
          )}
        >
          Unread Only
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const style = getNotificationIcon(n.type);
            const Icon = style.icon;

            return (
              <div
                key={n.id}
                className={cn(
                  "glass p-4 border flex items-start justify-between gap-4 transition-all",
                  !n.read ? "border-purple-500/25 bg-purple-500/[0.02]" : "border-white/5"
                )}
              >
                <div className="flex gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0", style.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{n.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-slate-500 block mt-1.5">{formatDate(n.created_at)}</span>
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="px-2.5 py-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 text-[10px] font-semibold transition-all"
                  >
                    Read
                  </button>
                )}
              </div>
            );
          })}

          {notifications.length === 0 && (
            <div className="glass p-12 text-center text-slate-500 text-sm">
              You are all caught up! No notifications to display.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
