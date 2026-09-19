"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, CalendarRange, Check, ChevronDown, Loader2, Plus, Search, Send, XCircle, X } from "lucide-react";
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

export interface BranchDefinition {
  name: string;
  aliases: string[];
}

const BRANCH_CATALOG: BranchDefinition[] = [
  // Computer Science & IT
  { name: "Computer Science & Engineering", aliases: ["cs", "cse", "computer science", "comp sci", "computer engineering", "software", "software engineering"] },
  { name: "Information Technology", aliases: ["it", "information technology", "info tech"] },
  { name: "Artificial Intelligence & Machine Learning", aliases: ["ai", "aiml", "ml", "artificial intelligence", "machine learning"] },
  { name: "Data Science & Analytics", aliases: ["ds", "data science", "csds", "analytics", "big data"] },
  { name: "Cyber Security & Information Assurance", aliases: ["cyber", "cybersecurity", "security", "infosec"] },
  { name: "Cloud Computing & DevOps", aliases: ["cloud", "devops"] },
  { name: "Internet of Things (IoT)", aliases: ["iot", "internet of things"] },

  // Circuit Branches
  { name: "Electronics & Communication Engineering", aliases: ["ece", "electronics", "ec", "telecom", "communication"] },
  { name: "Electrical & Electronics Engineering", aliases: ["eee", "electrical", "ee"] },
  { name: "Instrumentation & Control Engineering", aliases: ["ice", "instrumentation"] },

  // Core Engineering
  { name: "Mechanical Engineering", aliases: ["mech", "mechanical", "me"] },
  { name: "Civil Engineering", aliases: ["civil", "ce"] },
  { name: "Chemical Engineering", aliases: ["chem", "chemical", "ch"] },
  { name: "Aerospace & Aeronautical Engineering", aliases: ["aero", "aerospace", "aeronautical"] },
  { name: "Automobile Engineering", aliases: ["auto", "automobile"] },
  { name: "Biotechnology & Biomedical Engineering", aliases: ["biotech", "biomedical", "bio"] },
  { name: "Robotics & Automation", aliases: ["robotics", "automation", "mechatronics"] },
  { name: "Industrial & Production Engineering", aliases: ["industrial", "production", "pie"] },

  // Computer Applications & Pure Sciences
  { name: "Bachelor of Computer Applications (BCA)", aliases: ["bca"] },
  { name: "Master of Computer Applications (MCA)", aliases: ["mca"] },
  { name: "B.Sc Computer Science / IT", aliases: ["bsc cs", "bsc it", "bsc"] },
  { name: "M.Sc Computer Science / IT / Data Science", aliases: ["msc cs", "msc it", "msc"] },

  // Business & Management
  { name: "MBA / Management", aliases: ["mba", "management", "pgdm"] },
  { name: "BBA (Business Administration)", aliases: ["bba"] },
  { name: "B.Com / M.Com (Finance & Commerce)", aliases: ["bcom", "mcom", "commerce", "finance"] },

  // Umbrella
  { name: "All Engineering Branches", aliases: ["all engineering", "engineering", "btech", "be"] },
  { name: "All Branches (Any Degree)", aliases: ["all", "any", "all branches", "open"] },
];

const QUICK_BRANCH_PICKS = [
  { label: "CS / CSE", value: "Computer Science & Engineering" },
  { label: "IT", value: "Information Technology" },
  { label: "AI / ML", value: "Artificial Intelligence & Machine Learning" },
  { label: "ECE", value: "Electronics & Communication Engineering" },
  { label: "EEE", value: "Electrical & Electronics Engineering" },
  { label: "Mechanical", value: "Mechanical Engineering" },
  { label: "Civil", value: "Civil Engineering" },
  { label: "MCA / BCA", value: "Master of Computer Applications (MCA)" },
  { label: "All Engineering", value: "All Engineering Branches" },
  { label: "All Branches", value: "All Branches (Any Degree)" },
];

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
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [branchSearch, setBranchSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
    load();
  }, []);

  // Close branch dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBranches = useMemo(() => {
    const q = branchSearch.trim().toLowerCase();
    if (!q) return BRANCH_CATALOG;
    return BRANCH_CATALOG.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.aliases.some((a) => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))
    );
  }, [branchSearch]);

  const selectBranch = (branchName: string) => {
    if (!selectedBranches.includes(branchName)) {
      setSelectedBranches((prev) => [...prev, branchName]);
    }
    setBranchSearch("");
    setIsDropdownOpen(false);
  };

  const removeBranch = (branchName: string) => {
    setSelectedBranches((prev) => prev.filter((b) => b !== branchName));
  };

  const toggleBranch = (branchName: string) => {
    if (selectedBranches.includes(branchName)) {
      removeBranch(branchName);
    } else {
      setSelectedBranches((prev) => [...prev, branchName]);
    }
  };

  const addCustomBranch = () => {
    const trimmed = branchSearch.trim();
    if (trimmed && !selectedBranches.includes(trimmed)) {
      setSelectedBranches((prev) => [...prev, trimmed]);
      setBranchSearch("");
      setIsDropdownOpen(false);
    }
  };

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
      eligible_branches: selectedBranches,
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
      setSelectedBranches([]);
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
      graduation_year: request.eligibility?.graduation_year?.toString() || "",
    });
    setSelectedBranches(request.eligibility?.eligible_branches || []);
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

          {/* Eligible branches — Searchable Autocomplete Combobox */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Eligible branches / courses
              </label>
              {selectedBranches.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedBranches([])}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear all ({selectedBranches.length})
                </button>
              )}
            </div>

            {/* Quick-Pick Pill Shortcuts */}
            <div className="flex flex-wrap items-center gap-1.5 pb-1">
              <span className="text-[11px] text-muted-foreground mr-1">Popular:</span>
              {QUICK_BRANCH_PICKS.map((pick) => {
                const isSelected = selectedBranches.includes(pick.value);
                return (
                  <button
                    key={pick.label}
                    type="button"
                    onClick={() => toggleBranch(pick.value)}
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                      isSelected
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {pick.label}
                  </button>
                );
              })}
            </div>

            {/* Combobox Search Input & Dropdown */}
            <div ref={dropdownRef} className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={branchSearch}
                  onChange={(e) => {
                    setBranchSearch(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (filteredBranches.length > 0) {
                        selectBranch(filteredBranches[0].name);
                      } else if (branchSearch.trim()) {
                        addCustomBranch();
                      }
                    } else if (e.key === "Escape") {
                      setIsDropdownOpen(false);
                    }
                  }}
                  placeholder="Search branches or aliases (e.g. 'CS', 'IT', 'ECE', 'AI', 'Mechanical', or custom)..."
                  className="h-10 pl-9 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle branch directory"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-popover shadow-xl p-1 text-sm">
                  {filteredBranches.length > 0 ? (
                    filteredBranches.map((branch) => {
                      const isSelected = selectedBranches.includes(branch.name);
                      return (
                        <div
                          key={branch.name}
                          onClick={() => selectBranch(branch.name)}
                          className={`flex items-center justify-between cursor-pointer rounded-md px-3 py-2 text-xs transition-colors ${
                            isSelected
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          <div>
                            <div className="font-medium text-foreground">{branch.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              Aliases: {branch.aliases.slice(0, 4).join(", ")}
                            </div>
                          </div>
                          {isSelected ? (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      No standard branch found for "{branchSearch}".
                    </div>
                  )}

                  {/* Add Custom Branch Entry */}
                  {branchSearch.trim() &&
                    !filteredBranches.some(
                      (b) => b.name.toLowerCase() === branchSearch.trim().toLowerCase()
                    ) && (
                      <div
                        onClick={addCustomBranch}
                        className="mt-1 flex items-center gap-2 border-t border-border/60 p-2 text-xs font-medium text-primary hover:bg-primary/10 cursor-pointer rounded"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add custom branch: "{branchSearch.trim()}"</span>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Selected Branch Badges */}
            {selectedBranches.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                <span className="text-xs text-muted-foreground self-center mr-1">Selected:</span>
                {selectedBranches.map((branch) => (
                  <span
                    key={branch}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {branch}
                    <button
                      type="button"
                      onClick={() => removeBranch(branch)}
                      className="rounded-full hover:bg-primary/20 p-0.5 hover:text-destructive transition-colors"
                      title={`Remove ${branch}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <label className="space-y-1.5 text-xs text-muted-foreground md:col-span-2">Job description
            <textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} rows={5} className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground" />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setSelectedBranches([]); }}>Discard edits</Button>}
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
                {request.eligibility?.eligible_branches && request.eligibility.eligible_branches.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {request.eligibility.eligible_branches.map((b: string) => (
                      <span key={b} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{b}</span>
                    ))}
                  </div>
                )}
                {request.review_notes && <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-100"><strong>Placement officer:</strong> {request.review_notes}</div>}
                {request.placement_drive_id && <p className="mt-3 text-xs text-emerald-400">Approved and published to eligible students.</p>}
              </div>
              <div className="flex gap-2">
                {request.status === "changes_requested" && <Button size="sm" onClick={() => editRequest(request)}>Edit &amp; resubmit</Button>}
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
