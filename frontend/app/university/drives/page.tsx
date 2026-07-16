"use client";

import { useEffect, useState } from "react";
import { Plus, X, CalendarDays, Building2, MapPin, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Drive {
  id: string;
  title: string;
  company_name: string;
  role: string;
  location: string;
  package_lpa: number | null;
  drive_date: string | null;
  registration_deadline: string | null;
  status: string;
  total_registered: number;
  total_selected: number;
  eligibility: {
    min_cgpa?: number;
    max_backlogs?: number;
    eligible_branches?: string[];
  };
}

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-primary/10 text-primary",
  active: "bg-success/10 text-success",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const EMPTY_FORM = {
  title: "", company_name: "", role: "", location: "",
  package_lpa: "", drive_date: "", registration_deadline: "",
  min_cgpa: "", max_backlogs: "", eligible_branches: "",
};

export default function DrivesPage() {
  const { user } = useAuth();
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const loadDrives = async () => {
    // Get university_profiles id for this user
    const { data: uniProfile } = await supabase
      .from("university_profiles")
      .select("id")
      .eq("user_id", user?.id)
      .maybeSingle();

    if (!uniProfile) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("placement_drives")
      .select("*")
      .eq("university_id", uniProfile.id)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    setDrives(data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) loadDrives(); }, [user]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Drive title is required";
    if (!form.company_name.trim()) e.company_name = "Company name is required";
    if (form.min_cgpa && (parseFloat(form.min_cgpa) < 0 || parseFloat(form.min_cgpa) > 10)) e.min_cgpa = "CGPA must be 0–10";
    if (form.max_backlogs && parseInt(form.max_backlogs) < 0) e.max_backlogs = "Cannot be negative";
    return e;
  };

  const createDrive = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);

    // Get or create university profile
    let uniId: string;
    const { data: existing } = await supabase.from("university_profiles").select("id").eq("user_id", user?.id).maybeSingle();
    if (existing) {
      uniId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabase.from("university_profiles").insert({
        user_id: user?.id,
        name: user?.full_name || "University",
      }).select("id").single();
      if (createErr) { showToast("error", "Failed to create university profile"); setSaving(false); return; }
      uniId = created.id;
    }

    const payload = {
      university_id: uniId,
      title: form.title,
      company_name: form.company_name,
      role: form.role || null,
      location: form.location || null,
      package_lpa: form.package_lpa ? parseFloat(form.package_lpa) : null,
      drive_date: form.drive_date || null,
      registration_deadline: form.registration_deadline || null,
      eligibility: {
        min_cgpa: form.min_cgpa ? parseFloat(form.min_cgpa) : undefined,
        max_backlogs: form.max_backlogs ? parseInt(form.max_backlogs) : undefined,
        eligible_branches: form.eligible_branches ? form.eligible_branches.split(",").map(b => b.trim()).filter(Boolean) : undefined,
      },
      status: "upcoming",
    };

    const { error } = await supabase.from("placement_drives").insert(payload);
    setSaving(false);
    if (error) {
      showToast("error", error.message);
    } else {
      showToast("success", "Drive created successfully!");
      setForm(EMPTY_FORM);
      setShowForm(false);
      setErrors({});
      loadDrives();
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-success/15 text-success border border-success/30" : "bg-destructive/15 text-destructive border border-destructive/30"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">Placement Drives</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {drives.length} drive{drives.length !== 1 ? "s" : ""} scheduled
          </p>
        </div>
        <Button size="sm" onClick={() => { setShowForm(true); setErrors({}); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Create drive
        </Button>
      </div>

      {/* Create Drive Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-medium">New Placement Drive</h2>
            <button type="button" onClick={() => { setShowForm(false); setErrors({}); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Drive Title *</Label>
              <Input id="title" placeholder="e.g. Campus Recruitment Drive 2026" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              {errors.title && <p className="text-[12px] text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input id="company_name" placeholder="e.g. Google" value={form.company_name} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} />
              {errors.company_name && <p className="text-[12px] text-destructive">{errors.company_name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Input id="role" placeholder="e.g. Software Engineer" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g. Bengaluru / Remote" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="package_lpa">Package (LPA)</Label>
              <Input id="package_lpa" type="number" placeholder="e.g. 18" value={form.package_lpa} onChange={(e) => setForm((p) => ({ ...p, package_lpa: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="drive_date">Drive Date</Label>
              <Input id="drive_date" type="date" value={form.drive_date} onChange={(e) => setForm((p) => ({ ...p, drive_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="registration_deadline">Registration Deadline</Label>
              <Input id="registration_deadline" type="date" value={form.registration_deadline} onChange={(e) => setForm((p) => ({ ...p, registration_deadline: e.target.value }))} />
            </div>

            {/* Eligibility */}
            <div className="sm:col-span-2">
              <p className="mb-3 text-[13px] font-medium text-muted-foreground uppercase tracking-wider">Eligibility Criteria</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="min_cgpa">Min CGPA</Label>
                  <Input id="min_cgpa" type="number" step="0.1" min="0" max="10" placeholder="e.g. 7.5" value={form.min_cgpa} onChange={(e) => setForm((p) => ({ ...p, min_cgpa: e.target.value }))} />
                  {errors.min_cgpa && <p className="text-[12px] text-destructive">{errors.min_cgpa}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max_backlogs">Max Backlogs</Label>
                  <Input id="max_backlogs" type="number" min="0" placeholder="e.g. 0" value={form.max_backlogs} onChange={(e) => setForm((p) => ({ ...p, max_backlogs: e.target.value }))} />
                  {errors.max_backlogs && <p className="text-[12px] text-destructive">{errors.max_backlogs}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="eligible_branches">Eligible Branches</Label>
                  <Input id="eligible_branches" placeholder="CS, IT, ECE (comma-separated)" value={form.eligible_branches} onChange={(e) => setForm((p) => ({ ...p, eligible_branches: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowForm(false); setErrors({}); }}>Cancel</Button>
            <Button onClick={createDrive} disabled={saving}>{saving ? "Creating…" : "Create Drive"}</Button>
          </div>
        </div>
      )}

      {/* Drives List */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : drives.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border">
          <Building2 className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-[14px] text-muted-foreground">No drives created yet</p>
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>Create your first drive</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {drives.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-surface p-5 hover:border-primary/30 transition-colors">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[15px] font-medium">{d.company_name}</h3>
                    <Badge className={`text-[10.5px] px-1.5 py-0 ${STATUS_COLORS[d.status] || ""}`}>{d.status}</Badge>
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{d.title}{d.role ? ` · ${d.role}` : ""}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                    {d.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{d.location}</span>}
                    {d.drive_date && <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(d.drive_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                    {d.package_lpa && <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5" />₹{d.package_lpa} LPA</span>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  <div className="flex gap-3 text-[12.5px]">
                    <span className="text-muted-foreground">Registered: <strong className="text-foreground">{d.total_registered}</strong></span>
                    <span className="text-muted-foreground">Selected: <strong className="text-foreground">{d.total_selected}</strong></span>
                  </div>
                  {d.eligibility && (
                    <div className="flex flex-wrap gap-1.5">
                      {d.eligibility.min_cgpa != null && (
                        <span className="rounded-md bg-elevated px-2 py-0.5 text-[11px] text-muted-foreground">Min CGPA: {d.eligibility.min_cgpa}</span>
                      )}
                      {d.eligibility.max_backlogs != null && (
                        <span className="rounded-md bg-elevated px-2 py-0.5 text-[11px] text-muted-foreground">Max Backlogs: {d.eligibility.max_backlogs}</span>
                      )}
                      {d.eligibility.eligible_branches?.map((b) => (
                        <span key={b} className="rounded-md bg-elevated px-2 py-0.5 text-[11px] text-muted-foreground">{b}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
