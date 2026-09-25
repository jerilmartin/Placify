-- ============================================================
-- PLACIFY: Combined Schema (Supabase-Compatible)
-- Paste this into Supabase SQL Editor → Run
-- ============================================================

-- ── Student Profiles ─────────────────────────────────────────
CREATE TABLE student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  university TEXT,
  course TEXT,
  graduation_year INTEGER,
  cgpa DECIMAL(4,2) CHECK (cgpa IS NULL OR cgpa BETWEEN 0 AND 10),
  active_backlogs INTEGER DEFAULT 0 CHECK (active_backlogs >= 0),
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
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

ALTER TABLE student_profiles
  ADD COLUMN university_id UUID REFERENCES university_profiles(id) ON DELETE SET NULL;

-- ── Recruiter Profiles ───────────────────────────────────────
CREATE TABLE recruiter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- ── Recruiter Campus Drive Requests ──────────────────────────
CREATE TABLE drive_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES university_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  eligibility JSONB NOT NULL DEFAULT '{}',
  drive_date DATE,
  registration_deadline DATE,
  package_lpa DECIMAL(7,2),
  location TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','changes_requested','approved','rejected','cancelled')),
  review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  placement_drive_id UUID UNIQUE REFERENCES placement_drives(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (registration_deadline IS NULL OR drive_date IS NULL OR registration_deadline <= drive_date)
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
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed','shortlisted','interviewed','offered','accepted','rejected','withdrawn')),
  next_step TEXT,
  next_step_date DATE,
  recruiter_notes TEXT,
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

-- ── Recruiter Interview Appointments ─────────────────────────
CREATE TABLE interview_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  job_application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  drive_application_id UUID REFERENCES drive_applications(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  round_name TEXT NOT NULL DEFAULT 'Recruiter interview',
  starts_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45 CHECK (duration_minutes BETWEEN 15 AND 180),
  meeting_mode TEXT NOT NULL DEFAULT 'online' CHECK (meeting_mode IN ('online', 'in_person')),
  meeting_url TEXT,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_interview_application CHECK ((job_application_id IS NULL) <> (drive_application_id IS NULL)),
  CONSTRAINT interview_venue_required CHECK (
    (meeting_mode = 'online' AND meeting_url IS NOT NULL AND meeting_url ~ '^https://')
    OR (meeting_mode = 'in_person' AND location IS NOT NULL AND length(trim(location)) > 0)
  )
);

CREATE INDEX idx_interview_appointments_recruiter_start ON interview_appointments(recruiter_id, starts_at);
CREATE INDEX idx_interview_appointments_student_start ON interview_appointments(student_id, starts_at);
CREATE UNIQUE INDEX idx_one_scheduled_job_interview ON interview_appointments(job_application_id)
  WHERE job_application_id IS NOT NULL AND status = 'scheduled';
CREATE UNIQUE INDEX idx_one_scheduled_drive_interview ON interview_appointments(drive_application_id)
  WHERE drive_application_id IS NOT NULL AND status = 'scheduled';

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
CREATE INDEX idx_student_profiles_university ON student_profiles(university_id);
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
CREATE INDEX idx_drive_requests_recruiter ON drive_requests(recruiter_id, created_at DESC);
CREATE INDEX idx_drive_requests_university_status ON drive_requests(university_id, status, created_at DESC);
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
ALTER TABLE drive_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_guidance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ══════════════════════════════════════════════════════════════

-- Profiles: users manage their own (SELECT, INSERT, UPDATE)
CREATE POLICY "Own student profile" ON student_profiles FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Own university profile" ON university_profiles FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Public university profile view" ON university_profiles FOR SELECT USING (true);

CREATE POLICY "Own recruiter profile" ON recruiter_profiles FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "View verified recruiter profiles" ON recruiter_profiles FOR SELECT USING (verified = true);

CREATE POLICY "Own mentor profile" ON mentor_profiles FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "View verified mentors" ON mentor_profiles FOR SELECT USING (verified = true);

-- Verification changes go through backend service-role endpoints only.
REVOKE UPDATE ON recruiter_profiles FROM authenticated;
REVOKE UPDATE ON university_profiles FROM authenticated;

-- Jobs: everyone reads active, recruiters manage their own
CREATE POLICY "View active jobs" ON jobs FOR SELECT USING (status = 'active');
CREATE POLICY "Recruiters manage jobs" ON jobs FOR ALL
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

-- Drives: students see their university's drives; universities manage their own.
CREATE OR REPLACE FUNCTION student_belongs_to_university(p_university_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM student_profiles AS student
    WHERE student.user_id = auth.uid()
      AND student.university_id = p_university_id
  );
$function$;
REVOKE ALL ON FUNCTION student_belongs_to_university(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION student_belongs_to_university(UUID) TO authenticated, service_role;

CREATE POLICY "Students view university drives" ON placement_drives FOR SELECT
  USING (student_belongs_to_university(university_id));
CREATE POLICY "University manages drives" ON placement_drives FOR ALL
  USING (university_id IN (SELECT id FROM university_profiles WHERE user_id = auth.uid()))
  WITH CHECK (university_id IN (SELECT id FROM university_profiles WHERE user_id = auth.uid()));

CREATE POLICY "University views own students" ON student_profiles FOR SELECT
  USING (university_id IN (SELECT id FROM university_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Recruiter views own drive requests" ON drive_requests FOR SELECT
  USING (recruiter_id IN (SELECT id FROM recruiter_profiles WHERE user_id = auth.uid()));
CREATE POLICY "University views received drive requests" ON drive_requests FOR SELECT
  USING (university_id IN (SELECT id FROM university_profiles WHERE user_id = auth.uid()));
REVOKE INSERT, UPDATE, DELETE ON drive_requests FROM anon, authenticated;
GRANT SELECT ON drive_requests TO authenticated;

-- Students own their applications; recruiters may manage applications to owned jobs.
CREATE POLICY "Own applications" ON applications FOR ALL
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Recruiters manage job applications" ON applications FOR ALL
  USING (job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()))
  WITH CHECK (job_id IN (SELECT id FROM jobs WHERE recruiter_id = auth.uid()));

CREATE POLICY "Own drive apps" ON drive_applications FOR ALL
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "University views own drive applications" ON drive_applications FOR SELECT
  USING (drive_id IN (
    SELECT drive.id FROM placement_drives AS drive
    JOIN university_profiles AS university ON university.id = drive.university_id
    WHERE university.user_id = auth.uid()
  ));

CREATE POLICY "Own matches" ON job_matches FOR ALL
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Own interviews" ON interviews FOR ALL
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Students view own interview appointments" ON interview_appointments FOR SELECT
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Recruiters view own interview appointments" ON interview_appointments FOR SELECT
  USING (recruiter_id = auth.uid());
REVOKE INSERT, UPDATE, DELETE ON interview_appointments FROM anon, authenticated;
GRANT SELECT ON interview_appointments TO authenticated;

CREATE POLICY "Own guidance" ON career_guidance_sessions FOR ALL
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Own predictions" ON placement_predictions FOR ALL
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Own cover letters" ON cover_letters FOR ALL
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Own documents" ON documents FOR ALL
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

-- Notifications: user sees own
CREATE POLICY "Own notifications" ON notifications FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Mentor sessions: both parties can see
CREATE POLICY "Mentor sees sessions" ON mentor_sessions FOR ALL
  USING (mentor_id IN (SELECT id FROM mentor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Student sees sessions" ON mentor_sessions FOR ALL
  USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

-- Atomic university review: an approval and its placement drive are committed
-- together, so students never see a partially approved request.
CREATE OR REPLACE FUNCTION review_drive_request(
  p_request_id UUID,
  p_reviewer_user_id UUID,
  p_action TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_request drive_requests%ROWTYPE;
  v_drive_id UUID;
BEGIN
  SELECT * INTO v_request
  FROM drive_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Drive request not found'; END IF;
  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending drive requests can be reviewed';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM university_profiles
    WHERE id = v_request.university_id
      AND user_id = p_reviewer_user_id
      AND verified = TRUE
  ) THEN
    RAISE EXCEPTION 'Reviewer is not authorized for this university';
  END IF;

  IF p_action = 'approve' THEN
    INSERT INTO placement_drives (
      university_id, title, company_name, description, eligibility,
      drive_date, registration_deadline, package_lpa, role, location, status
    ) VALUES (
      v_request.university_id, v_request.title, v_request.company_name,
      v_request.description, v_request.eligibility, v_request.drive_date,
      v_request.registration_deadline, v_request.package_lpa,
      v_request.role, v_request.location, 'upcoming'
    ) RETURNING id INTO v_drive_id;

    UPDATE drive_requests SET
      status = 'approved', review_notes = NULLIF(BTRIM(p_notes), ''),
      reviewed_by = p_reviewer_user_id, reviewed_at = NOW(),
      placement_drive_id = v_drive_id, updated_at = NOW()
    WHERE id = p_request_id;
  ELSIF p_action IN ('reject', 'request_changes') THEN
    IF NULLIF(BTRIM(p_notes), '') IS NULL THEN
      RAISE EXCEPTION 'Review notes are required';
    END IF;
    UPDATE drive_requests SET
      status = CASE WHEN p_action = 'reject' THEN 'rejected' ELSE 'changes_requested' END,
      review_notes = BTRIM(p_notes), reviewed_by = p_reviewer_user_id,
      reviewed_at = NOW(), updated_at = NOW()
    WHERE id = p_request_id;
  ELSE
    RAISE EXCEPTION 'Invalid review action';
  END IF;

  RETURN v_drive_id;
END
$function$;

REVOKE ALL ON FUNCTION review_drive_request(UUID, UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION review_drive_request(UUID, UUID, TEXT, TEXT)
  TO service_role;

-- ── University & Student Tenant Isolation ──────────────────────
CREATE OR REPLACE FUNCTION public.student_belongs_to_university(
  p_university_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_profiles AS student
    WHERE student.user_id = auth.uid()
      AND student.university_id = p_university_id
  );
$function$;

REVOKE ALL ON FUNCTION public.student_belongs_to_university(UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_belongs_to_university(UUID)
  TO authenticated, service_role;

DROP POLICY IF EXISTS "University views own students" ON public.student_profiles;
CREATE POLICY "University views own students"
ON public.student_profiles
FOR SELECT
TO authenticated
USING (
  university_id IN (
    SELECT id
    FROM public.university_profiles
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "University views own drive applications" ON public.drive_applications;
CREATE POLICY "University views own drive applications"
ON public.drive_applications
FOR SELECT
TO authenticated
USING (
  drive_id IN (
    SELECT drive.id
    FROM public.placement_drives AS drive
    JOIN public.university_profiles AS university ON university.id = drive.university_id
    WHERE university.user_id = auth.uid()
  )
);

-- ── Notification Automation Triggers ──────────────────────────
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  target_user UUID;
  job_title TEXT;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  SELECT user_id INTO target_user FROM student_profiles WHERE id = NEW.student_id;
  SELECT title INTO job_title FROM jobs WHERE id = NEW.job_id;
  IF target_user IS NOT NULL THEN
    INSERT INTO notifications(user_id, type, title, message, data)
    VALUES (
      target_user,
      'application_update',
      'Application status updated',
      COALESCE(job_title, 'Your application') || ' is now ' || NEW.status || '.',
      jsonb_build_object('application_id', NEW.id, 'job_id', NEW.job_id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS applications_status_notification ON public.applications;
CREATE TRIGGER applications_status_notification
AFTER UPDATE OF status ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.notify_application_status_change();

CREATE OR REPLACE FUNCTION public.notify_drive_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  target_user UUID;
  drive_name TEXT;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  SELECT user_id INTO target_user FROM student_profiles WHERE id = NEW.student_id;
  SELECT COALESCE(role, title) || ' at ' || company_name
    INTO drive_name FROM placement_drives WHERE id = NEW.drive_id;
  IF target_user IS NOT NULL THEN
    INSERT INTO notifications(user_id, type, title, message, data)
    VALUES (
      target_user,
      'application_update',
      'Placement application updated',
      COALESCE(drive_name, 'Your placement application') || ' is now ' || NEW.status || '.',
      jsonb_build_object('drive_application_id', NEW.id, 'drive_id', NEW.drive_id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS drive_applications_status_notification ON public.drive_applications;
CREATE TRIGGER drive_applications_status_notification
AFTER UPDATE OF status ON public.drive_applications
FOR EACH ROW EXECUTE FUNCTION public.notify_drive_application_status_change();

CREATE OR REPLACE FUNCTION public.notify_students_of_new_drive()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO notifications(user_id, type, title, message, data)
  SELECT
    student.user_id,
    'new_job',
    'New placement drive: ' || NEW.company_name,
    COALESCE(NEW.role, NEW.title) || ' is now open for your university.',
    jsonb_build_object('drive_id', NEW.id, 'university_id', NEW.university_id)
  FROM student_profiles AS student
  WHERE student.university_id = NEW.university_id;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS placement_drive_notification ON public.placement_drives;
CREATE TRIGGER placement_drive_notification
AFTER INSERT ON public.placement_drives
FOR EACH ROW EXECUTE FUNCTION public.notify_students_of_new_drive();

CREATE OR REPLACE FUNCTION public.notify_mentor_session_scheduled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  target_user UUID;
BEGIN
  SELECT user_id INTO target_user FROM student_profiles WHERE id = NEW.student_id;
  IF target_user IS NOT NULL AND NEW.status = 'scheduled' THEN
    INSERT INTO notifications(user_id, type, title, message, data)
    VALUES (
      target_user,
      'session_reminder',
      'Mentor session scheduled',
      NEW.topic || ' is scheduled for ' || to_char(NEW.scheduled_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC.',
      jsonb_build_object('session_id', NEW.id, 'scheduled_at', NEW.scheduled_at)
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS mentor_session_schedule_notification ON public.mentor_sessions;
CREATE TRIGGER mentor_session_schedule_notification
AFTER INSERT OR UPDATE OF scheduled_at ON public.mentor_sessions
FOR EACH ROW EXECUTE FUNCTION public.notify_mentor_session_scheduled();

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END;
$block$;
