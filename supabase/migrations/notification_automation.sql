-- Event-driven notifications for application changes and newly approved drives.

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
