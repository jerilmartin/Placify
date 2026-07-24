"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileClock, Loader2, MessageSquareWarning, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { universitiesApi } from "@/lib/api";
import type { DriveRequest, DriveRequestStatus } from "@/lib/types";

const FILTERS: Array<{ label: string; value: "" | DriveRequestStatus }> = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Changes requested", value: "changes_requested" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  changes_requested: "bg-blue-500/15 text-blue-300",
  approved: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-red-500/15 text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

type ReviewAction = "approve" | "reject" | "request_changes";

export default function UniversityDriveRequestsPage() {
  const [requests, setRequests] = useState<DriveRequest[]>([]);
  const [filter, setFilter] = useState<"" | DriveRequestStatus>("");
  const [selected, setSelected] = useState<DriveRequest | null>(null);
  const [action, setAction] = useState<ReviewAction>("approve");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  const load = async (nextFilter = filter) => {
    setLoading(true);
    try {
      const { data } = await universitiesApi.listDriveRequests(nextFilter || undefined);
      setRequests(data);
    } catch {
      toast.error("Could not load drive requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    universitiesApi.listDriveRequests()
      .then(({ data }) => setRequests(data))
      .catch(() => toast.error("Could not load drive requests"))
      .finally(() => setLoading(false));
  }, []);

  const changeFilter = (value: "" | DriveRequestStatus) => {
    setFilter(value);
    void load(value);
  };

  const openReview = (request: DriveRequest, nextAction: ReviewAction) => {
    setSelected(request);
    setAction(nextAction);
    setNotes("");
  };

  const submitReview = async () => {
    if (!selected) return;
    if (action !== "approve" && !notes.trim()) {
      toast.error("Add a reason or the changes required");
      return;
    }
    setReviewing(true);
    try {
      const { data } = await universitiesApi.reviewDriveRequest(selected.id, action, notes.trim() || undefined);
      setRequests((items) => {
        if (filter && data.status !== filter) {
          return items.filter((item) => item.id !== selected.id);
        }
        return items.map((item) => item.id === selected.id ? data : item);
      });
      setSelected(null);
      toast.success(action === "approve" ? "Drive approved and published to students" : action === "reject" ? "Drive request rejected" : "Changes sent to recruiter");
    } catch {
      toast.error("Could not complete this review");
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Placement Cell · Approvals</div>
        <h1 className="mt-1 text-2xl font-semibold">Campus-drive requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review recruiter proposals. Approval publishes an upcoming drive without re-entering its details.</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((item) => <Button key={item.label} size="sm" variant={filter === item.value ? "default" : "outline"} onClick={() => changeFilter(item.value)}>{item.label}</Button>)}
      </div>

      {selected && (
        <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-5">
          <h2 className="font-medium">{action === "approve" ? "Approve and publish drive?" : action === "reject" ? "Reject this request?" : "Request corrections"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{selected.company_name} · {selected.title}</p>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder={action === "approve" ? "Optional approval note" : "Explain the reason or exact changes required"} className="mt-3 w-full rounded-md border border-border bg-background p-3 text-sm text-foreground" />
          <div className="mt-3 flex justify-end gap-2"><Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button><Button variant={action === "reject" ? "destructive" : "default"} disabled={reviewing} onClick={submitReview}>{reviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{action === "approve" ? "Approve & publish" : action === "reject" ? "Reject request" : "Send changes"}</Button></div>
        </div>
      )}

      {loading ? <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center"><FileClock className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">No drive requests in this view.</p></div>
      ) : <div className="space-y-4">
        {requests.map((request) => (
          <article key={request.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{request.title}</h2><span className={`rounded-full px-2 py-0.5 text-xs capitalize ${STATUS_STYLE[request.status]}`}>{request.status.replace("_", " ")}</span></div>
                <p className="mt-1 text-sm text-muted-foreground">{request.company_name} · {request.role}</p>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                  <Info label="Package" value={request.package_lpa ? `₹${request.package_lpa} LPA` : "Not specified"} />
                  <Info label="Drive date" value={request.drive_date || "Not specified"} />
                  <Info label="Deadline" value={request.registration_deadline || "Not specified"} />
                  <Info label="Location" value={request.location || "Not specified"} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {request.eligibility?.min_cgpa != null && <Chip text={`CGPA ≥ ${request.eligibility.min_cgpa}`} />}
                  {request.eligibility?.max_backlogs != null && <Chip text={`Backlogs ≤ ${request.eligibility.max_backlogs}`} />}
                  {request.eligibility?.graduation_year && <Chip text={`Class of ${request.eligibility.graduation_year}`} />}
                  {request.eligibility?.eligible_branches?.map((branch) => <Chip key={branch} text={branch} />)}
                </div>
                {request.description && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{request.description}</p>}
                {request.review_notes && <div className="mt-3 rounded-lg bg-elevated p-3 text-sm"><strong>Review note:</strong> {request.review_notes}</div>}
                {request.placement_drive_id && <p className="mt-3 text-xs text-emerald-400">Placement drive created and visible to eligible students.</p>}
              </div>
              {request.status === "pending" && <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => openReview(request, "approve")}><CheckCircle2 className="mr-1.5 h-4 w-4" />Approve</Button>
                <Button size="sm" variant="outline" onClick={() => openReview(request, "request_changes")}><MessageSquareWarning className="mr-1.5 h-4 w-4" />Changes</Button>
                <Button size="sm" variant="ghost" onClick={() => openReview(request, "reject")}><XCircle className="mr-1.5 h-4 w-4" />Reject</Button>
              </div>}
            </div>
          </article>
        ))}
      </div>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="uppercase tracking-wide">{label}</div><div className="mt-0.5 text-sm text-foreground">{value}</div></div>;
}

function Chip({ text }: { text: string }) {
  return <span className="rounded bg-elevated px-2 py-1 text-xs text-muted-foreground">{text}</span>;
}
