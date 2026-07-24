"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recruitersApi } from "@/lib/api";
import type { RecruiterProfile } from "@/lib/types";

type ProfileForm = Pick<RecruiterProfile,
  "company_name" | "designation" | "company_website" | "company_description" |
  "industry" | "company_size" | "headquarters" | "contact_email" | "contact_phone"
>;

const EMPTY: ProfileForm = {
  company_name: "", designation: "", company_website: "", company_description: "",
  industry: "", company_size: "", headquarters: "", contact_email: "", contact_phone: "",
};

export default function RecruiterCompanyPage() {
  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    recruitersApi.getProfile()
      .then(({ data }) => {
        setVerified(Boolean(data.verified));
        setForm(Object.fromEntries(Object.keys(EMPTY).map((key) => [key, data[key] || ""])) as ProfileForm);
      })
      .catch(() => toast.error("Could not load company profile"))
      .finally(() => setLoading(false));
  }, []);

  const update = (key: keyof ProfileForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await recruitersApi.updateProfile(form);
      setForm(Object.fromEntries(Object.keys(EMPTY).map((key) => [key, data[key] || ""])) as ProfileForm);
      toast.success("Company profile updated");
    } catch {
      toast.error("Could not update company profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          Recruiter · Company
          <span className={verified ? "text-emerald-400" : "text-amber-400"}>{verified ? "Verified" : "Pending verification"}</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold">Company profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">This information identifies your company to placement teams and students.</p>
      </div>
      <form onSubmit={save} className="space-y-5 rounded-xl border border-border bg-surface p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {([
            ["company_name", "Company name"],
            ["designation", "Your designation"],
            ["industry", "Industry"],
            ["company_size", "Company size"],
            ["headquarters", "Headquarters"],
            ["company_website", "Company website"],
            ["contact_email", "Contact email"],
            ["contact_phone", "Contact phone"],
          ] as Array<[keyof ProfileForm, string]>).map(([key, label]) => (
            <label key={key} className="space-y-1.5 text-xs text-muted-foreground">
              {label}
              <Input value={form[key] || ""} onChange={(event) => update(key, event.target.value)} required={key === "company_name"} />
            </label>
          ))}
        </div>
        <label className="block space-y-1.5 text-xs text-muted-foreground">
          Company description
          <textarea value={form.company_description || ""} onChange={(event) => update("company_description", event.target.value)} rows={5} className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground" />
        </label>
        <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save profile</Button></div>
      </form>
    </div>
  );
}
