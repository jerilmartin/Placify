import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function formatPackage(lpa?: number): string {
  if (!lpa) return "Not disclosed";
  return `₹${lpa} LPA`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getMatchScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-blue-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

export function getRiskColor(level: "Low" | "Medium" | "High"): string {
  return { Low: "text-emerald-500", Medium: "text-amber-500", High: "text-red-500" }[level];
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    submitted: "bg-blue-500/20 text-blue-300",
    reviewed: "bg-purple-500/20 text-purple-300",
    shortlisted: "bg-amber-500/20 text-amber-300",
    interviewed: "bg-cyan-500/20 text-cyan-300",
    offered: "bg-emerald-500/20 text-emerald-300",
    accepted: "bg-green-500/20 text-green-300",
    rejected: "bg-red-500/20 text-red-300",
    withdrawn: "bg-slate-500/20 text-slate-300",
    active: "bg-emerald-500/20 text-emerald-300",
    upcoming: "bg-blue-500/20 text-blue-300",
    completed: "bg-slate-500/20 text-slate-300",
    cancelled: "bg-red-500/20 text-red-300",
  };
  return map[status] ?? "bg-slate-500/20 text-slate-300";
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}
