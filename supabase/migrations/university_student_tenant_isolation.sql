-- Link students to a stable university tenant instead of relying on a name match.
-- Existing unambiguous records are backfilled; unmatched students remain unassigned
-- and are intentionally hidden from university directories until linked.

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS university_id UUID
  REFERENCES public.university_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_student_profiles_university
  ON public.student_profiles(university_id);

UPDATE public.student_profiles AS student
SET university_id = matches.id
FROM (
  SELECT LOWER(BTRIM(name)) AS normalized_name, MIN(id::text)::uuid AS id
  FROM public.university_profiles
  GROUP BY LOWER(BTRIM(name))
  HAVING COUNT(*) = 1
) AS matches
WHERE student.university_id IS NULL
  AND student.university IS NOT NULL
  AND LOWER(BTRIM(student.university)) = matches.normalized_name;

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
