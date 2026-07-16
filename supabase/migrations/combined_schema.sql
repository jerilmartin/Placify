-- ============================================================
-- PLACIFY: Combined Schema (Supabase-Compatible)
-- Paste this into Supabase SQL Editor → Run
-- ============================================================

-- ── Student Profiles ─────────────────────────────────────────
CREATE TABLE student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  university TEXT,
  course TEXT,
  graduation_year INTEGER,
  cgpa DECIMAL(3,2),
  active_backlogs INTEGER DEFAULT 0,
  skills TEXT[],
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  projects JSONB,
  work_experience JSONB,
  achievements TEXT,
  profile_completion INTEGER DEFAULT 0,
  placement_probability DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── University Profiles ──────────────────────────────────────
CREATE TABLE university_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  placement_officer_name TEXT,
  accreditation TEXT,
  established_year INTEGER,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Recruiter Profiles ───────────────────────────────────────
CREATE TABLE recruiter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  designation TEXT,
  company_website TEXT,
  company_description TEXT,
  industry TEXT,
  company_size TEXT,
  headquarters TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Mentor Profiles ──────────────────────────────────────────
CREATE TABLE mentor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  designation TEXT,
  company TEXT,
  expertise_areas TEXT[],
  years_of_experience INTEGER,
  bio TEXT,
  linkedin_url TEXT,
  availability TEXT,
  rating DECIMAL(3,2),
  total_sessions INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Placement Drives (MUST come before Jobs) ─────────────────
CREATE TABLE placement_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  university_id UUID REFERENCES university_profiles(id) ON DELETE CASCADE,
  description TEXT,
  eligibility JSONB DEFAULT '{}',
  drive_date DATE,
  registration_deadline DATE,
  package_lpa DECIMAL(5,2),
  role TEXT,
  location TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','active','completed','cancelled')),
  total_registered INTEGER DEFAULT 0,
  total_selected INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Jobs ─────────────────────────────────────────────────────
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  description TEXT,
  requirements TEXT,
  skills_required TEXT[],
  job_type TEXT CHECK (job_type IN ('full_time','part_time','internship','contract')),
  experience_level TEXT CHECK (experience_level IN ('entry','mid','senior')),
  salary_range TEXT,
  package_lpa DECIMAL(5,2),
  min_cgpa DECIMAL(3,2),
  eligible_branches TEXT[],
  no_of_openings INTEGER,
  bond_details TEXT,
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','closed','draft')),
  recruiter_id UUID REFERENCES auth.users(id),
  university_id UUID REFERENCES university_profiles(id),
  placement_drive_id UUID REFERENCES placement_drives(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Resumes ──────────────────────────────────────────────────
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  original_filename TEXT,
  file_url TEXT,
  parsed_text TEXT,
  extracted_data JSONB,
  generated_content JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','parsed','generated','error')),
  template TEXT DEFAULT 'modern',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Applications ─────────────────────────────────────────────
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed','shortlisted','interviewed','offered','rejected')),
  next_step TEXT,
  next_step_date DATE,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, job_id)
);

-- ── Drive Applications ───────────────────────────────────────
CREATE TABLE drive_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered','eligible','shortlisted','interviewed','selected','rejected')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(drive_id, student_id)
);

-- ── Job Matches (AI) ─────────────────────────────────────────
CREATE TABLE job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  match_reason TEXT,
  skill_matches TEXT[],
  missing_skills TEXT[],
  recommendation TEXT,
  viewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, job_id)
);

-- ── Interviews (Mock) ────────────────────────────────────────
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  interview_type TEXT CHECK (interview_type IN ('technical','behavioral','mixed')),
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  questions_asked TEXT[],
  responses JSONB,
  feedback JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Mentor Sessions ──────────────────────────────────────────
CREATE TABLE mentor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT,
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  mentor_feedback TEXT,
  student_feedback TEXT,
  student_rating INTEGER CHECK (student_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notifications ────────────────────────────────────────────
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'new_job','application_update','interview_scheduled',
    'resume_feedback','drive_registration','session_reminder',
    'offer_received','system'
  )),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Career Guidance (AI Chat) ────────────────────────────────
CREATE TABLE career_guidance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Cover Letters (AI) ───────────────────────────────────────
CREATE TABLE cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Placement Predictions (ML) ───────────────────────────────
CREATE TABLE placement_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  probability DECIMAL(5,2),
  risk_level TEXT CHECK (risk_level IN ('Low','Medium','High')),
  factors JSONB DEFAULT '{}',
  improvements JSONB DEFAULT '[]',
  model_version TEXT DEFAULT '1.0',
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Documents ────────────────────────────────────────────────
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('10th_marksheet','12th_marksheet','resume','certificate','other')),
  description TEXT,
  original_filename TEXT,
  file_url TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending_verification','verified','rejected','active')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════
CREATE INDEX idx_student_profiles_user ON student_profiles(user_id);
CREATE INDEX idx_university_profiles_user ON university_profiles(user_id);
CREATE INDEX idx_recruiter_profiles_user ON recruiter_profiles(user_id);
CREATE INDEX idx_mentor_profiles_user ON mentor_profiles(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_deadline ON jobs(deadline);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_drives_university ON placement_drives(university_id);
CREATE INDEX idx_drives_status ON placement_drives(status);
CREATE INDEX idx_drive_apps_drive ON drive_applications(drive_id);
CREATE INDEX idx_drive_apps_student ON drive_applications(student_id);
CREATE INDEX idx_matches_student ON job_matches(student_id);
CREATE INDEX idx_matches_score ON job_matches(match_score DESC);
CREATE INDEX idx_interviews_student ON interviews(student_id);
CREATE INDEX idx_sessions_mentor ON mentor_sessions(mentor_id);
CREATE INDEX idx_sessions_student ON mentor_sessions(student_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read);
CREATE INDEX idx_resumes_student ON resumes(student_id);
CREATE INDEX idx_documents_student ON documents(student_id);
CREATE INDEX idx_predictions_student ON placement_predictions(student_id);
CREATE INDEX idx_guidance_student ON career_guidance_sessions(student_id);

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_guidance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ══════════════════════════════════════════════════════════════

-- Profiles: users manage their own
CREATE POLICY "Own student profile" ON student_profiles USING (user_id = auth.uid());
CREATE POLICY "Own university profile" ON university_profiles USING (user_id = auth.uid());
CREATE POLICY "Own recruiter profile" ON recruiter_profiles USING (user_id = auth.uid());
CREATE POLICY "Own mentor profile" ON mentor_profiles USING (user_id = auth.uid());
CREATE POLICY "View verified mentors" ON mentor_profiles FOR SELECT USING (verified = true);

-- Jobs: everyone reads active, recruiters manage own
CREATE POLICY "View active jobs" ON jobs FOR SELECT USING (status = 'active');
CREATE POLICY "Recruiters manage jobs" ON jobs USING (recruiter_id = auth.uid());

-- Drives: public read
CREATE POLICY "View all drives" ON placement_drives FOR SELECT USING (true);

-- Student-scoped tables
CREATE POLICY "Own resumes" ON resumes
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own applications" ON applications
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own drive apps" ON drive_applications
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own matches" ON job_matches
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own interviews" ON interviews
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own guidance" ON career_guidance_sessions
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own predictions" ON placement_predictions
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own cover letters" ON cover_letters
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Own documents" ON documents
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

-- Notifications: user sees own
CREATE POLICY "Own notifications" ON notifications USING (user_id = auth.uid());

-- Mentor sessions: both parties can see
CREATE POLICY "Mentor sees sessions" ON mentor_sessions
  USING (mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Student sees sessions" ON mentor_sessions
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
