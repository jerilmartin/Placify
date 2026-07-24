"use client";

import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { universitiesApi } from "@/lib/api";
import type { RecruiterProfile } from "@/lib/types";

export default function UniversityRecruitersPage() {
  const [recruiters, setRecruiters] = useState<RecruiterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    universitiesApi.listRecruiters()
      .then(({ data }) => setRecruiters(data))
      .catch(() => toast.error("Could not load recruiter profiles"))
      .finally(() => setLoading(false));
  }, []);

  const verify = async (recruiter: RecruiterProfile, verified: boolean) => {
    setUpdating(recruiter.id);
    try {
      await universitiesApi.setRecruiterVerification(recruiter.id, verified);
      setRecruiters((items) => items.map((item) => item.id === recruiter.id ? { ...item, verified } : item));
      toast.success(verified ? "Recruiter approved" : "Recruiter verification revoked");
    } catch {
      toast.error("Could not update recruiter verification");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Placement Cell</div>
        <h1 className="mt-1 text-2xl font-semibold">Recruiter onboarding</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review visiting companies before they can publish roles and access applicant pipelines.</p>
      </div>
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : recruiters.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">No recruiter profiles are awaiting review.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recruiters.map((recruiter) => (
            <article key={recruiter.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary"><Building2 className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{recruiter.company_name}</h2>
                    {recruiter.verified && <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400"><CheckCircle2 className="h-3 w-3" />Verified</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{recruiter.industry || "Industry not supplied"} · {recruiter.headquarters || "Location not supplied"}</p>
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{recruiter.company_description || "No company description supplied."}</p>
                  <div className="mt-4 flex gap-2">
                    {recruiter.verified ? (
                      <Button size="sm" variant="outline" disabled={updating === recruiter.id} onClick={() => verify(recruiter, false)}><ShieldX className="mr-2 h-4 w-4" />Revoke</Button>
                    ) : (
                      <Button size="sm" disabled={updating === recruiter.id} onClick={() => verify(recruiter, true)}><ShieldCheck className="mr-2 h-4 w-4" />Approve recruiter</Button>
                    )}
                    {recruiter.company_website && <Button asChild size="sm" variant="ghost"><a href={recruiter.company_website} target="_blank" rel="noreferrer">Website</a></Button>}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
