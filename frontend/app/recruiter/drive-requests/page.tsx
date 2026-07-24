"use client";

import { useEffect, useState } from "react";
import { Building2, CalendarRange, Loader2, Send, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recruitersApi } from "@/lib/api";
import type { DriveRequest } from "@/lib/types";

interface UniversityOption {
  id: string;
  name: string;
  location?: string;
}

const EMPTY_FORM = {
  university_id: "",
  title: "",
  role: "",
  description: "",
  location: "",
  package_lpa: "",
  drive_date: "",
  registration_deadline: "",
  min_cgpa: "",
  max_backlogs: "0",
  eligible_branches: "",
  graduation_year: "",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  changes_requested: "bg-blue-500/15 text-blue-300",
  approved: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-red-500/15 text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

export default function RecruiterDriveRequestsPage() {
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [requests, setRequests] = useState<DriveRequest[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [universitiesResponse, requestsResponse] = await Promise.all([
        recruitersApi.listUniversities(),
        recruitersApi.listDriveRequests(),
      ]);
      setUniversities(universitiesResponse.data);
      setRequests(requestsResponse.data);
    } catch {
      toast.error("Could not load campus-drive requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      recruitersApi.listUniversities(),
      recruitersApi.listDriveRequests(),
    ])
      .then(([universitiesResponse, requestsResponse]) => {
        setUniversities(universitiesResponse.data);
        setRequests(requestsResponse.data);
      })
      .catch(() => toast.error("Could not load campus-drive requests"))
      .finally(() => setLoading(false));
  }, []);

  const payload = () => ({
    university_id: form.university_id,
    title: form.title.trim(),
    role: form.role.trim(),
    description: form.description.trim() || undefined,
    location: form.location.trim() || undefined,
    package_lpa: form.package_lpa ? Number(form.package_lpa) : undefined,
    drive_date: form.drive_date || undefined,
    registration_deadline: form.registration_deadline || undefined,
    eligibility: {
      min_cgpa: form.min_cgpa ? Number(form.min_cgpa) : undefined,
      max_backlogs: form.max_backlogs ? Number(form.max_backlogs) : 0,
      eligible_branches: form.eligible_branches.split(",").map((branch) => branch.trim()).filter(Boolean),
      graduation_year: form.graduation_year ? Number(form.graduation_year) : undefined,
    },
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.university_id || !form.title.trim() || !form.role.trim()) {
      toast.error("University, title, and role are required");
      return;
    }
    if (form.drive_date && form.registration_deadline && form.registration_deadline > form.drive_date) {
      toast.error("Registration deadline must be on or before the drive date");
      return;
    }
    setSaving(true);
    try {
      const requestPayload = payload();
      if (editingId) {
        const resubmitPayload: Record<string, unknown> = { ...requestPayload };
        delete resubmitPayload.university_id;
        await recruitersApi.resubmitDriveRequest(editingId, resubmitPayload);
        toast.success("Changes submitted for university review");
      } else {
        await recruitersApi.createDriveRequest(requestPayload);
        toast.success("Campus-drive request submitted");
      }
      setEditingId(null);
      setForm(EMPTY_FORM);
      await load();
    } catch {
      toast.error("Could not submit the campus-drive request");
    } finally {
      setSaving(false);
    }
  };

  const editRequest = (request: DriveRequest) => {
    setEditingId(request.id);
    setForm({
      university_id: request.university_id,
      title: request.title,
      role: request.role,
      description: request.description || "",
      location: request.location || "",
      package_lpa: request.package_lpa?.toString() || "",
      drive_date: request.drive_date || "",
      registration_deadline: request.registration_deadline || "",
      min_cgpa: request.eligibility?.min_cgpa?.toString() || "",
      max_backlogs: request.eligibility?.max_backlogs?.toString() || "0",
      eligible_branches: request.eligibility?.eligible_branches?.join(", ") || "",
      graduation_year: request.eligibility?.graduation_year?.toString() || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancel = async (request: DriveRequest) => {
    try {
      await recruitersApi.cancelDriveRequest(request.id);
      setRequests((items) => items.map((item) => item.id === request.id ? { ...item, status: "cancelled" } : item));
      toast.success("Drive request cancelled");
    } catch {
      toast.error("Could not cancel this request");
    }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Recruiter · Campus hiring</div>
        <h1 className="mt-1 text-2xl font-semibold">Drive requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">Propose a campus drive. Students see it only after the selected university approves it.</p>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2"><Send className="h-4 w-4 text-primary" /><h2 className="font-medium">{editingId ? "Revise and resubmit" : "New drive proposal"}</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5 text-xs text-muted-foreground">University *
            <select value={form.university_id} disabled={Boolean(editingId)} onChange={(event) => setForm((value) => ({ ...value, university_id: event.target.value }))} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground">
              <option value="">Select a verified university</option>
              {universities.map((university) => <option key={university.id} value={university.id}>{university.name}{university.location ? ` — ${university.location}` : ""}</option>)}
            </select>
          </label>
          <Field label="Drive title *" value={form.title} onChange={(value) => setForm((formValue) => ({ ...formValue, title: value }))} placeholder="Apple Campus Hiring 2026" />
          <Field label="Role *" value={form.role} onChange={(value) => setForm((formValue) => ({ ...formValue, role: value }))} placeholder="iOS Software Engineer" />
          <Field label="Location" value={form.location} onChange={(value) => setForm((formValue) => ({ ...formValue, location: value }))} placeholder="Bengaluru / Hybrid" />
          <Field label="Package (LPA)" type="number" value={form.package_lpa} onChange={(value) => setForm((formValue) => ({ ...formValue, package_lpa: value }))} />
          <Field label="Graduation year" type="number" value={form.graduation_year} onChange={(value) => setForm((formValue) => ({ ...formValue, graduation_year: value }))} />
          <Field label="Drive date" type="date" value={form.drive_date} onChange={(value) => setForm((formValue) => ({ ...formValue, drive_date: value }))} />
          <Field label="Registration deadline" type="date" value={form.registration_deadline} onChange={(value) => setForm((formValue) => ({ ...formValue, registration_deadline: value }))} />
          <Field label="Minimum CGPA" type="number" value={form.min_cgpa} onChange={(value) => setForm((formValue) => ({ ...formValue, min_cgpa: value }))} />
          <Field label="Maximum backlogs" type="number" value={form.max_backlogs} onChange={(value) => setForm((formValue) => ({ ...formValue, max_backlogs: value }))} />
          <label className="space-y-1.5 text-xs text-muted-foreground md:col-span-2">Eligible branches
            <Input value={form.eligible_branches} onChange={(event) => setForm((value) => ({ ...value, eligible_branches: event.target.value }))} placeholder="Computer Science, Information Technology, ECE" />
          </label>
          <label className="space-y-1.5 text-xs text-muted-foreground md:col-span-2">Job description
            <textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} rows={5} className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground" />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>Discard edits</Button>}
          <Button type="submit" disabled={saving || universities.length === 0}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{editingId ? "Resubmit" : "Send for approval"}</Button>
        </div>
      </form>

      <div className="mt-7 space-y-3">
        <h2 className="font-medium">Request history</h2>
        {requests.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No campus-drive requests submitted yet.</div> : requests.map((request) => (
          <article key={request.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{request.title}</h3><span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLE[request.status]}`}>{request.status.replace("_", " ")}</span></div>
                <p className="mt-1 text-sm text-muted-foreground">{request.role} · {request.university_profiles?.name || "University"}{request.package_lpa ? ` · ₹${request.package_lpa} LPA` : ""}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><CalendarRange className="h-3.5 w-3.5" />{request.drive_date || "Date to be decided"}</span><span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{request.company_name}</span></div>
                {request.review_notes && <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-100"><strong>Placement officer:</strong> {request.review_notes}</div>}
                {request.placement_drive_id && <p className="mt-3 text-xs text-emerald-400">Approved and published to eligible students.</p>}
              </div>
              <div className="flex gap-2">
                {request.status === "changes_requested" && <Button size="sm" onClick={() => editRequest(request)}>Edit & resubmit</Button>}
                {["pending", "changes_requested"].includes(request.status) && <Button size="sm" variant="ghost" onClick={() => cancel(request)}><XCircle className="mr-1 h-4 w-4" />Cancel</Button>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="space-y-1.5 text-xs text-muted-foreground">{label}<Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}
