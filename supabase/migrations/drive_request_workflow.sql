-- PLACIFY: recruiter campus-drive request and university approval workflow
-- Apply after recruiter_workflow.sql.
BEGIN;

CREATE TABLE IF NOT EXISTS public.drive_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES public.recruiter_profiles(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.university_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  eligibility JSONB NOT NULL DEFAULT '{}'::jsonb,
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
  placement_drive_id UUID UNIQUE REFERENCES public.placement_drives(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (registration_deadline IS NULL OR drive_date IS NULL OR registration_deadline <= drive_date)
);

CREATE INDEX IF NOT EXISTS idx_drive_requests_recruiter
  ON public.drive_requests(recruiter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drive_requests_university_status
  ON public.drive_requests(university_id, status, created_at DESC);

ALTER TABLE public.drive_requests ENABLE ROW LEVEL SECURITY;

-- Campus drives are visible to students belonging to the owning university.
-- The helper bypasses profile-table RLS while retaining the caller's auth.uid().
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
    JOIN public.university_profiles AS university
      ON LOWER(BTRIM(student.university)) = LOWER(BTRIM(university.name))
    WHERE student.user_id = auth.uid()
      AND university.id = p_university_id
  );
$function$;
REVOKE ALL ON FUNCTION public.student_belongs_to_university(UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_belongs_to_university(UUID)
  TO authenticated, service_role;

-- University owners retain access through the existing management policy.
DROP POLICY IF EXISTS "View all drives" ON public.placement_drives;
DROP POLICY IF EXISTS "Students view university drives" ON public.placement_drives;
CREATE POLICY "Students view university drives"
ON public.placement_drives
FOR SELECT
TO authenticated
USING (public.student_belongs_to_university(university_id));

DROP POLICY IF EXISTS "Recruiter views own drive requests" ON public.drive_requests;
CREATE POLICY "Recruiter views own drive requests"
ON public.drive_requests
FOR SELECT
TO authenticated
USING (
  recruiter_id IN (
    SELECT id FROM public.recruiter_profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "University views received drive requests" ON public.drive_requests;
CREATE POLICY "University views received drive requests"
ON public.drive_requests
FOR SELECT
TO authenticated
USING (
  university_id IN (
    SELECT id FROM public.university_profiles WHERE user_id = auth.uid()
  )
);

-- All writes go through ownership-checked backend endpoints. Approval itself
-- uses the service-role-only function below so request approval + drive creation
-- happen in one database transaction.
REVOKE INSERT, UPDATE, DELETE ON public.drive_requests FROM anon, authenticated;
GRANT SELECT ON public.drive_requests TO authenticated;

CREATE OR REPLACE FUNCTION public.review_drive_request(
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
  v_request public.drive_requests%ROWTYPE;
  v_drive_id UUID;
BEGIN
  SELECT *
  INTO v_request
  FROM public.drive_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Drive request not found';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending drive requests can be reviewed';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.university_profiles
    WHERE id = v_request.university_id
      AND user_id = p_reviewer_user_id
      AND verified = TRUE
  ) THEN
    RAISE EXCEPTION 'Reviewer is not authorized for this university';
  END IF;

  IF p_action = 'approve' THEN
    INSERT INTO public.placement_drives (
      university_id,
      title,
      company_name,
      description,
      eligibility,
      drive_date,
      registration_deadline,
      package_lpa,
      role,
      location,
      status
    )
    VALUES (
      v_request.university_id,
      v_request.title,
      v_request.company_name,
      v_request.description,
      v_request.eligibility,
      v_request.drive_date,
      v_request.registration_deadline,
      v_request.package_lpa,
      v_request.role,
      v_request.location,
      'upcoming'
    )
    RETURNING id INTO v_drive_id;

    UPDATE public.drive_requests
    SET
      status = 'approved',
      review_notes = NULLIF(BTRIM(p_notes), ''),
      reviewed_by = p_reviewer_user_id,
      reviewed_at = NOW(),
      placement_drive_id = v_drive_id,
      updated_at = NOW()
    WHERE id = p_request_id;
  ELSIF p_action = 'reject' THEN
    IF NULLIF(BTRIM(p_notes), '') IS NULL THEN
      RAISE EXCEPTION 'Review notes are required when rejecting';
    END IF;
    UPDATE public.drive_requests
    SET
      status = 'rejected',
      review_notes = BTRIM(p_notes),
      reviewed_by = p_reviewer_user_id,
      reviewed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_request_id;
  ELSIF p_action = 'request_changes' THEN
    IF NULLIF(BTRIM(p_notes), '') IS NULL THEN
      RAISE EXCEPTION 'Review notes are required when requesting changes';
    END IF;
    UPDATE public.drive_requests
    SET
      status = 'changes_requested',
      review_notes = BTRIM(p_notes),
      reviewed_by = p_reviewer_user_id,
      reviewed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_request_id;
  ELSE
    RAISE EXCEPTION 'Invalid review action';
  END IF;

  RETURN v_drive_id;
END
$function$;

REVOKE ALL ON FUNCTION public.review_drive_request(UUID, UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_drive_request(UUID, UUID, TEXT, TEXT)
  TO service_role;

COMMIT;
