"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2, AlertTriangle, Info, Filter, Loader2,
  Sparkles, Calendar, Briefcase, Trophy, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notificationsApi } from "@/lib/api";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  title: string;
  message?: string;
  type?: string;
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [marking, setMarking] = useState(false);

  const load = async (unreadOnly = false) => {
    setLoading(true);
    try {
      const res = await notificationsApi.list({ unread_only: unreadOnly });
      setNotifications(res.data || []);
    } catch {
      toast.error("Could not load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    notificationsApi.list({ unread_only: false })
      .then((res) => setNotifications(res.data || []))
      .catch(() => toast.error("Could not load notifications"))
      .finally(() => setLoading(false));

    if (!user?.id) return;
    const channel = supabase.channel(`notifications:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications((items) => [payload.new as Notification, ...items]);
        toast.info((payload.new as Notification).title);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markRead = async (notification: Notification) => {
    if (notification.read) return;
    try {
      await notificationsApi.markRead(notification.id);
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    } catch {
      toast.error("Could not mark notification as read");
    }
  };

  const handleFilter = (next: "all" | "unread") => {
    setFilter(next);
    load(next === "unread");
  };

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications((n) => n.map((item) => ({ ...item, read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Could not mark notifications as read");
    } finally {
      setMarking(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {notifications.length} updates · <span className="font-semibold text-[#800020]">{unreadCount} unread</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilter(filter === "unread" ? "all" : "unread")}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            {filter === "unread" ? "Show all" : "Unread only"}
          </Button>
          <Button size="sm" variant="outline" disabled={marking || unreadCount === 0} onClick={handleMarkAllRead}>
            {marking ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Mark all read
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#800020]" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground shadow-sharp">
          {filter === "unread" ? "No unread notifications." : "No notifications yet."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sharp">
          <ul className="divide-y divide-border">
            {notifications.map((n, i) => {
              let Icon = Info;
              let tint = "text-[#0A192F] bg-[#0A192F]/10";

              if (n.type === "offer_received" || n.type === "success") {
                Icon = Trophy;
                tint = "text-[#D4AF37] bg-[#D4AF37]/15";
              } else if (n.type === "interview_scheduled") {
                Icon = Calendar;
                tint = "text-[#800020] bg-[#800020]/10";
              } else if (n.type === "new_job" || n.type === "drive_registration") {
                Icon = Briefcase;
                tint = "text-[#0A192F] bg-[#0A192F]/10";
              } else if (n.title.toLowerCase().includes("shortlisted")) {
                Icon = Sparkles;
                tint = "text-emerald-700 bg-emerald-500/15";
              } else if (n.type === "warning") {
                Icon = AlertTriangle;
                tint = "text-amber-700 bg-amber-500/15";
              }

              const when = new Date(n.created_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "short",
              });

              const isDriveOrApp = n.type === "application_update" || n.type === "interview_scheduled" || n.type === "offer_received" || n.title.toLowerCase().includes("shortlist");

              return (
                <li
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/50",
                    !n.read && "bg-[#800020]/[0.03]"
                  )}
                >
                  <div className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg shrink-0 border border-border/50", tint)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium text-foreground">{n.title}</div>
                    {n.message && (
                      <div className="mt-0.5 text-[12.5px] text-muted-foreground">{n.message}</div>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{when}</span>
                      {isDriveOrApp && (
                        <Link
                          href="/student/applications"
                          className="inline-flex items-center gap-1 font-medium text-[#800020] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View application <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#800020]" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
