"use client";

import { useEffect, useState } from "react";
import { universitiesApi } from "@/lib/api";
import Link from "next/link";
import { CalendarDays, Calendar, Users, Briefcase, Plus, Loader2, Sparkles, X, Check, Eye } from "lucide-react";
import type { PlacementDrive, EligibilityCriteria } from "@/lib/types";
import { formatDate, formatPackage, getStatusColor } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isDemoMode, MOCK_PLACEMENT_DRIVES } from "@/lib/mock-data";

export default function UniversityDrivesPage() {
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [driveDate, setDriveDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [packageLpa, setPackageLpa] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"upcoming" | "active">("upcoming");
  
  // Eligibility State
  const [minCgpa, setMinCgpa] = useState("6.0");
  const [maxBacklogs, setMaxBacklogs] = useState("0");
  const [graduationYear, setGraduationYear] = useState("2026");
  const [branches, setBranches] = useState<string[]>(["CSE", "ECE", "IT"]);

  const fetchDrives = async () => {
    setLoading(true);
    if (isDemoMode()) {
      setDrives(MOCK_PLACEMENT_DRIVES);
      setLoading(false);
      return;
    }
    try {
      const res = await universitiesApi.listDrives();
      setDrives(res.data || []);
    } catch {
      toast.error("Failed to load drives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const toggleBranch = (branch: string) => {
    setBranches(prev => 
      prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch]
    );
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !companyName) {
      toast.error("Please fill in the title and company name");
      return;
    }

    const eligibility: EligibilityCriteria = {
      min_cgpa: parseFloat(minCgpa) || undefined,
      max_backlogs: parseInt(maxBacklogs) || 0,
      graduation_year: parseInt(graduationYear) || undefined,
      eligible_branches: branches
    };

    const driveData = {
      title,
      company_name: companyName,
      description,
      drive_date: driveDate || undefined,
      registration_deadline: deadline || undefined,
      package_lpa: parseFloat(packageLpa) || undefined,
      role,
      location,
      status,
      eligibility
    };

    try {
      await universitiesApi.createDrive(driveData);
      toast.success("Placement drive created successfully!");
      setShowCreateForm(false);
      
      // Reset form
      setTitle("");
      setCompanyName("");
      setDescription("");
      setDriveDate("");
      setDeadline("");
      setPackageLpa("");
      setRole("");
      setLocation("");
      
      fetchDrives();
    } catch {
      toast.error("Failed to create drive");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1"><CalendarDays className="w-4 h-4" /> Portals</div>
          <h1 className="text-2xl font-bold text-white">Placement Drives</h1>
          <p className="text-slate-500 text-sm mt-1">Schedule campus placements, set cutoff metrics, and track applicants.</p>
        </div>
        <button
          onClick={() => setShowCreateForm(prev => !prev)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20"
        >
          {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreateForm ? "Close Form" : "Create Drive"}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateDrive} className="glass p-6 rounded-2xl mb-8 border border-white/10 animate-fade-down space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Create Placement Drive
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Define core details and eligibility criteria for matching candidates.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Drive Title *</label>
              <input
                type="text"
                placeholder="e.g. TCS Ninja Drive 2026"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Company Name *</label>
              <input
                type="text"
                placeholder="e.g. Tata Consultancy Services"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Role / Designation</label>
              <input
                type="text"
                placeholder="e.g. Assistant System Engineer"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Package (LPA)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 7.5"
                value={packageLpa}
                onChange={e => setPackageLpa(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Drive Date</label>
              <input
                type="date"
                value={driveDate}
                onChange={e => setDriveDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Registration Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Job Location</label>
              <input
                type="text"
                placeholder="e.g. Bangalore, Hyderabad"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Initial Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as "upcoming" | "active")}
                className="w-full bg-[#0d0d12] border border-white/10 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Description</label>
            <textarea
              placeholder="Provide system overview, job description or details about the rounds"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 h-20 resize-none"
            />
          </div>

          {/* Eligibility Engine Card */}
          <div className="bg-emerald-500/5 border border-emerald-500/15 p-4 rounded-xl space-y-4">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Cutoff Eligibility Engine</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-medium uppercase">Min CGPA Cutoff</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={minCgpa}
                  onChange={e => setMinCgpa(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-medium uppercase">Max Active Backlogs</label>
                <input
                  type="number"
                  min="0"
                  value={maxBacklogs}
                  onChange={e => setMaxBacklogs(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-medium uppercase">Graduation Year</label>
                <input
                  type="number"
                  value={graduationYear}
                  onChange={e => setGraduationYear(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-medium uppercase block">Eligible Engineering Branches</label>
              <div className="flex flex-wrap gap-2">
                {["CSE", "ECE", "EEE", "IT", "ME", "CE"].map(branch => (
                  <button
                    type="button"
                    key={branch}
                    onClick={() => toggleBranch(branch)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold border transition-all",
                      branches.includes(branch)
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/35 shadow-sm"
                        : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10"
                    )}
                  >
                    {branch}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-xs hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20"
            >
              Submit Drive
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-slate-500 text-sm">Loading placement drives...</span>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {drives.map((drive) => (
            <div key={drive.id} className="glass p-5 border border-white/5 flex flex-col justify-between card-hover relative overflow-hidden">
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold", getStatusColor(drive.status))}>
                      {drive.status}
                    </span>
                    <h3 className="font-semibold text-white mt-1.5 text-lg">{drive.title}</h3>
                    <p className="text-xs text-slate-400">{drive.company_name}</p>
                  </div>
                  {drive.package_lpa && (
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Package</span>
                      <span className="font-bold text-white text-sm">{formatPackage(drive.package_lpa)}</span>
                    </div>
                  )}
                </div>

                {drive.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 my-2">{drive.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 my-4 text-xs text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>Drive: <b className="text-white">{drive.drive_date ? formatDate(drive.drive_date) : "TBD"}</b></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>Registrations: <b className="text-white">{drive.total_registered}</b></span>
                  </div>
                </div>

                {/* Eligibility Criteria Tags */}
                <div className="border-t border-white/5 pt-3 mb-2">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1.5">Eligibility Cutoffs</div>
                  <div className="flex flex-wrap gap-1.5">
                    {drive.eligibility?.min_cgpa && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] border border-emerald-500/20">
                        CGPA ≥ {drive.eligibility.min_cgpa}
                      </span>
                    )}
                    {drive.eligibility?.max_backlogs !== undefined && (
                      <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-300 text-[10px] border border-orange-500/20">
                        Backlogs ≤ {drive.eligibility.max_backlogs}
                      </span>
                    )}
                    {drive.eligibility?.eligible_branches && drive.eligibility.eligible_branches.length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] border border-blue-500/20">
                        Branches: {drive.eligibility.eligible_branches.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-white/5 mt-auto">
                <Link
                  href={`/university/students?drive_id=${drive.id}`}
                  className="flex-1 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-center text-xs text-emerald-300 font-semibold border border-emerald-500/20 transition-all flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View Eligible Students
                </Link>
              </div>
            </div>
          ))}

          {drives.length === 0 && (
            <div className="col-span-2 glass p-12 text-center text-slate-500 text-sm">
              No placement drives scheduled yet. Click the "Create Drive" button above to launch your first campus placement session.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
