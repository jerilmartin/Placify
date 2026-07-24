-- PLACIFY: restore student visibility of their own university's placement drives.
-- Safe to run after drive_request_workflow.sql.
BEGIN;

-- SECURITY DEFINER is intentional: the helper must inspect both profile tables
-- while their own RLS policies remain active. auth.uid() still identifies the
-- calling student.
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

DROP POLICY IF EXISTS "View all drives" ON public.placement_drives;
DROP POLICY IF EXISTS "Students view university drives" ON public.placement_drives;
CREATE POLICY "Students view university drives"
ON public.placement_drives
FOR SELECT
TO authenticated
USING (public.student_belongs_to_university(university_id));

COMMIT;

-- Diagnostic: these names must match after trimming/case normalization.
SELECT
  student.email AS student_email,
  student.university AS student_university,
  university.name AS matched_university,
  university.id AS university_id
FROM public.student_profiles AS student
LEFT JOIN public.university_profiles AS university
  ON LOWER(BTRIM(student.university)) = LOWER(BTRIM(university.name))
WHERE student.email = 'teststudent@example.com';
