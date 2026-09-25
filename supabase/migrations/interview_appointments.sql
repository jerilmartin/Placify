-- Recruiter-led interviews are separate from AI mock interviews.
CREATE TABLE IF NOT EXISTS public.interview_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  job_application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  drive_application_id UUID REFERENCES public.drive_applications(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_interview_appointments_recruiter_start
  ON public.interview_appointments(recruiter_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_interview_appointments_student_start
  ON public.interview_appointments(student_id, starts_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_scheduled_job_interview
  ON public.interview_appointments(job_application_id)
  WHERE job_application_id IS NOT NULL AND status = 'scheduled';
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_scheduled_drive_interview
  ON public.interview_appointments(drive_application_id)
  WHERE drive_application_id IS NOT NULL AND status = 'scheduled';

ALTER TABLE public.interview_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own interview appointments" ON public.interview_appointments;
CREATE POLICY "Students view own interview appointments" ON public.interview_appointments
  FOR SELECT USING (student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Recruiters view own interview appointments" ON public.interview_appointments;
CREATE POLICY "Recruiters view own interview appointments" ON public.interview_appointments
  FOR SELECT USING (recruiter_id = auth.uid());

-- All mutations go through the ownership-checking backend endpoints.
REVOKE INSERT, UPDATE, DELETE ON public.interview_appointments FROM anon, authenticated;
GRANT SELECT ON public.interview_appointments TO authenticated;
