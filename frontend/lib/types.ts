// All TypeScript types for the Placify platform

export type UserRole = "student" | "recruiter" | "university" | "mentor" | "admin" | "placement_officer";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  last_login?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ── Student ───────────────────────────────────────────────────────────────────
export interface Project {
  name: string;
  description: string;
  tech_stack: string[];
  github_url?: string;
  live_url?: string;
  duration?: string;
}

export interface WorkExperience {
  company: string;
  role: string;
  duration: string;
  description: string;
  skills_used: string[];
}

export interface StudentProfile {
  id: string;
  user_id: string;
  student_id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  university?: string;
  course?: string;
  graduation_year?: number;
  cgpa?: number;
  skills?: string[];
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  projects?: Project[];
  work_experience?: WorkExperience[];
  achievements?: string;
  profile_completion: number;
  placement_probability?: number;
  created_at: string;
  updated_at: string;
}

// ── Job ───────────────────────────────────────────────────────────────────────
export type JobType = "full_time" | "part_time" | "internship" | "contract";
export type JobStatus = "active" | "closed" | "draft";
export type ExperienceLevel = "entry" | "mid" | "senior";

export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  requirements?: string;
  skills_required: string[];
  job_type?: JobType;
  experience_level?: ExperienceLevel;
  salary_range?: string;
  package_lpa?: number;
  deadline?: string;
  min_cgpa?: number;
  eligible_branches?: string[];
  no_of_openings?: number;
  status: JobStatus;
  recruiter_id?: string;
  university_id?: string;
  placement_drive_id?: string;
  created_at: string;
  updated_at: string;
}

export interface JobMatch {
  id: string;
  job: Job;
  match_score: number;
  match_reason?: string;
  skill_matches: string[];
  missing_skills: string[];
  recommendation?: string;
  viewed: boolean;
  created_at: string;
}

// ── Application ───────────────────────────────────────────────────────────────
export type ApplicationStatus =
  | "submitted" | "reviewed" | "shortlisted"
  | "interviewed" | "offered" | "accepted"
  | "rejected" | "withdrawn";

export interface Application {
  id: string;
  student_id: string;
  job_id: string;
  cover_letter?: string;
  status: ApplicationStatus;
  next_step?: string;
  next_step_date?: string;
  applied_at: string;
  created_at: string;
  updated_at: string;
  jobs?: Partial<Job>;  // joined
}

// ── Interview ─────────────────────────────────────────────────────────────────
export type InterviewType = "technical" | "behavioral" | "mixed" | "hr";
export type InterviewDifficulty = "easy" | "medium" | "hard";
export type InterviewStatus = "active" | "completed" | "abandoned";

export interface InterviewFeedback {
  overall_score: number;
  confidence_score: number;
  communication_score: number;
  technical_accuracy_score: number;
  strengths: string[];
  improvements: string[];
  overall_recommendation: string;
}

export interface Interview {
  id: string;
  student_id: string;
  job_id?: string;
  interview_type: InterviewType;
  difficulty: InterviewDifficulty;
  status: InterviewStatus;
  current_question?: string;
  questions_asked: string[];
  responses: Record<string, unknown>[];
  feedback?: InterviewFeedback;
  started_at: string;
  completed_at?: string;
  created_at: string;
}

// ── Placement Drive ───────────────────────────────────────────────────────────
export type DriveStatus = "upcoming" | "active" | "completed" | "cancelled";

export interface EligibilityCriteria {
  min_cgpa?: number;
  eligible_branches?: string[];
  max_backlogs?: number;
  graduation_year?: number;
  other_criteria?: string;
}

export interface PlacementDrive {
  id: string;
  title: string;
  company_name: string;
  university_id: string;
  description?: string;
  eligibility: EligibilityCriteria;
  drive_date?: string;
  registration_deadline?: string;
  package_lpa?: number;
  role?: string;
  location?: string;
  status: DriveStatus;
  total_registered: number;
  total_selected: number;
  created_at: string;
  updated_at: string;
}

// ── Notifications ─────────────────────────────────────────────────────────────
export type NotificationType =
  | "new_job" | "application_update" | "interview_scheduled"
  | "resume_feedback" | "drive_registration" | "session_reminder"
  | "offer_received" | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// ── Profile Strength ──────────────────────────────────────────────────────────
export interface ProfileStrengthSection {
  section: string;
  label: string;
  score: number;
  max_score: number;
  percentage: number;
  tips: string[];
}

export interface ProfileStrength {
  overall_score: number;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  sections: ProfileStrengthSection[];
  next_milestone: {
    target: number;
    label: string;
    tip: string;
    points_needed: number;
  };
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface StudentDashboardStats {
  profile_completion: number;
  placement_probability?: number;
  applications: {
    total: number;
    by_status: Record<ApplicationStatus, number>;
  };
  job_matches: {
    total: number;
    avg_score: number;
  };
  interviews: {
    total: number;
    completed: number;
    avg_score: number;
  };
}

// ── Resume ────────────────────────────────────────────────────────────────────
export interface Resume {
  id: string;
  student_id: string;
  original_filename: string;
  parsed_text?: string;
  extracted_data?: {
    name?: string;
    email?: string;
    skills?: string[];
    education?: Record<string, unknown>[];
    experience?: Record<string, unknown>[];
    projects?: Record<string, unknown>[];
  };
  status: "pending" | "parsed" | "generated" | "error";
  completion_percentage: number;
  created_at: string;
}

// ── Placement Risk ────────────────────────────────────────────────────────────
export interface PlacementRisk {
  risk_level: "Low" | "Medium" | "High";
  probability: number;
  factors: {
    skills: number;
    cgpa: number;
    projects: number;
    experience: number;
    profile_completion: number;
  };
  top_improvements: string[];
  message: string;
}
