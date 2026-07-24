-- PLACIFY: ownership-scoped RLS for placement drives, applications, and jobs.
-- recruiter_workflow.sql supersedes this file and should be preferred.
BEGIN;

DROP POLICY IF EXISTS "Authenticated users manage drives" ON public.placement_drives;
DROP POLICY IF EXISTS "University manages drives" ON public.placement_drives;
DROP POLICY IF EXISTS "View all drives" ON public.placement_drives;
CREATE OR REPLACE FUNCTION public.student_belongs_to_university(p_university_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
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
REVOKE ALL ON FUNCTION public.student_belongs_to_university(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_belongs_to_university(UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS "Students view university drives" ON public.placement_drives;
CREATE POLICY "Students view university drives"
ON public.placement_drives FOR SELECT
TO authenticated
USING (public.student_belongs_to_university(university_id));
CREATE POLICY "University manages drives"
ON public.placement_drives FOR ALL
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
ON public.drive_applications FOR ALL
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

DROP POLICY IF EXISTS "Authenticated manage jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters manage jobs" ON public.jobs;
CREATE POLICY "Recruiters manage jobs"
ON public.jobs FOR ALL
USING (recruiter_id = auth.uid())
WITH CHECK (recruiter_id = auth.uid());

COMMIT;

SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('placement_drives', 'drive_applications', 'jobs')
ORDER BY tablename, policyname;
