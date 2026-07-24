-- PLACIFY: recruiter workflow and RLS repair
-- Apply once to an existing Supabase project.
BEGIN;

-- A profile is one-to-one with an Auth user. These constraints are also
-- required by PostgREST upsert(..., on_conflict: "user_id").
DO $migration$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_profiles_user_id_key') THEN
    ALTER TABLE public.student_profiles ADD CONSTRAINT student_profiles_user_id_key UNIQUE (user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'university_profiles_user_id_key') THEN
    ALTER TABLE public.university_profiles ADD CONSTRAINT university_profiles_user_id_key UNIQUE (user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruiter_profiles_user_id_key') THEN
    ALTER TABLE public.recruiter_profiles ADD CONSTRAINT recruiter_profiles_user_id_key UNIQUE (user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mentor_profiles_user_id_key') THEN
    ALTER TABLE public.mentor_profiles ADD CONSTRAINT mentor_profiles_user_id_key UNIQUE (user_id);
  END IF;
END
$migration$;

ALTER TABLE public.student_profiles
  ALTER COLUMN cgpa TYPE DECIMAL(4,2) USING cgpa::DECIMAL(4,2);
DO $migration$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_profiles_cgpa_range') THEN
    ALTER TABLE public.student_profiles
      ADD CONSTRAINT student_profiles_cgpa_range
      CHECK (cgpa IS NULL OR cgpa BETWEEN 0 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_profiles_active_backlogs_nonnegative') THEN
    ALTER TABLE public.student_profiles
      ADD CONSTRAINT student_profiles_active_backlogs_nonnegative
      CHECK (active_backlogs IS NULL OR active_backlogs >= 0);
  END IF;
END
$migration$;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS recruiter_notes TEXT;
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (
    status IN (
      'submitted', 'reviewed', 'shortlisted', 'interviewed',
      'offered', 'accepted', 'rejected', 'withdrawn'
    )
  );

-- Remove broad policies from the prior development migration.
DROP POLICY IF EXISTS "Public student profile view" ON public.student_profiles;
DROP POLICY IF EXISTS "Public recruiter profile view" ON public.recruiter_profiles;
DROP POLICY IF EXISTS "View verified recruiter profiles" ON public.recruiter_profiles;
CREATE POLICY "View verified recruiter profiles"
ON public.recruiter_profiles
FOR SELECT
USING (verified = true OR user_id = auth.uid());

-- Verification is controlled through backend service-role endpoints.
-- Prevent a recruiter or university user from marking their own row verified.
REVOKE UPDATE ON public.recruiter_profiles FROM authenticated;
REVOKE UPDATE ON public.university_profiles FROM authenticated;

DROP POLICY IF EXISTS "Authenticated manage jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters manage jobs" ON public.jobs;
CREATE POLICY "Recruiters manage jobs"
ON public.jobs
FOR ALL
USING (recruiter_id = auth.uid())
WITH CHECK (recruiter_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users manage drives" ON public.placement_drives;
DROP POLICY IF EXISTS "University manages drives" ON public.placement_drives;
CREATE POLICY "University manages drives"
ON public.placement_drives
FOR ALL
USING (
  university_id IN (
    SELECT id FROM public.university_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  university_id IN (
    SELECT id FROM public.university_profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Authenticated manage drive apps" ON public.drive_applications;
DROP POLICY IF EXISTS "Own drive apps" ON public.drive_applications;
CREATE POLICY "Own drive apps"
ON public.drive_applications
FOR ALL
USING (
  student_id IN (
    SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  student_id IN (
    SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Own applications" ON public.applications;
DROP POLICY IF EXISTS "Recruiters manage job applications" ON public.applications;
CREATE POLICY "Own applications"
ON public.applications
FOR ALL
USING (
  student_id IN (
    SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  student_id IN (
    SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
  )
);
CREATE POLICY "Recruiters manage job applications"
ON public.applications
FOR ALL
USING (
  job_id IN (
    SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()
  )
)
WITH CHECK (
  job_id IN (
    SELECT id FROM public.jobs WHERE recruiter_id = auth.uid()
  )
);

COMMIT;

-- If an ADD CONSTRAINT reports duplicate user_id values, run this diagnostic,
-- resolve the duplicates, then rerun the transaction:
-- SELECT user_id, count(*) FROM recruiter_profiles
-- WHERE user_id IS NOT NULL GROUP BY user_id HAVING count(*) > 1;
