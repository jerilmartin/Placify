-- ============================================================
-- Migration 002: Extended Schema for Full Platform
-- Campus Placement Management Platform — Placify
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ── University Profiles ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS university_profiles (
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

-- ── Recruiter Profiles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recruiter_profiles (
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

-- ── Mentor Profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mentor_profiles (
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

-- ── Placement Drives ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS placement_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  university_id UUID REFERENCES university_profiles(id) ON DELETE CASCADE,
  description TEXT,
  eligibility JSONB DEFAULT '{}',       -- {min_cgpa, eligible_branches, max_backlogs, graduation_year}
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

-- ── Drive Applications ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drive_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered','eligible','shortlisted','interviewed','selected','rejected')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(drive_id, student_id)
);

-- ── Mentor Sessions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mentor_sessions (
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

-- ── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'new_job','application_update','interview_scheduled',
    'resume_feedback','drive_registration','session_reminder',
    'offer_received','system'
  )),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',    -- extra context (job_id, application_id, etc.)
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Career Guidance Sessions (AI chatbot history) ────────────────────────────
CREATE TABLE IF NOT EXISTS career_guidance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB DEFAULT '[]',  -- [{role: "user"/"assistant", content: "", timestamp: ""}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI Cover Letters ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Placement Predictions (ML model outputs) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS placement_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  probability DECIMAL(5,2),       -- 0.00 - 100.00
  risk_level TEXT CHECK (risk_level IN ('Low','Medium','High')),
  factors JSONB DEFAULT '{}',
  improvements JSONB DEFAULT '[]',
  model_version TEXT DEFAULT '1.0',
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add package_lpa column to jobs if not exists
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS package_lpa DECIMAL(5,2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS min_cgpa DECIMAL(3,2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS eligible_branches TEXT[];
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS no_of_openings INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS bond_details TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES university_profiles(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS placement_drive_id UUID REFERENCES placement_drives(id);

-- Add placement_probability to student_profiles
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS placement_probability DECIMAL(5,2);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_university_profiles_user_id ON university_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_user_id ON recruiter_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_user_id ON mentor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_placement_drives_university ON placement_drives(university_id);
CREATE INDEX IF NOT EXISTS idx_placement_drives_status ON placement_drives(status);
CREATE INDEX IF NOT EXISTS idx_drive_applications_drive ON drive_applications(drive_id);
CREATE INDEX IF NOT EXISTS idx_drive_applications_student ON drive_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_mentor ON mentor_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_student ON mentor_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_career_guidance_student ON career_guidance_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_placement_predictions_student ON placement_predictions(student_id);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE university_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_guidance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_predictions ENABLE ROW LEVEL SECURITY;

-- University policies
CREATE POLICY "Universities manage own profile" ON university_profiles
  USING (auth.uid() = user_id);

-- Recruiter policies
CREATE POLICY "Recruiters manage own profile" ON recruiter_profiles
  USING (auth.uid() = user_id);

-- Mentor policies
CREATE POLICY "Mentors manage own profile" ON mentor_profiles
  USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view verified mentors" ON mentor_profiles
  FOR SELECT USING (verified = TRUE);

-- Placement drives — public read, university-only write
CREATE POLICY "Anyone can view drives" ON placement_drives
  FOR SELECT USING (true);

-- Notifications — user sees own only
CREATE POLICY "Users see own notifications" ON notifications
  USING (auth.uid() = user_id);

-- Career guidance — student sees own sessions
CREATE POLICY "Students see own guidance sessions" ON career_guidance_sessions
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

-- Placement predictions — student sees own
CREATE POLICY "Students see own predictions" ON placement_predictions
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

-- Cover letters — student sees own
CREATE POLICY "Students manage own cover letters" ON cover_letters
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
