-- ══════════════════════════════════════════════════════════════
-- PLACIFY TEST DATA SEED
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
--
-- Creates:
--   1. A test UNIVERSITY (Christ University) with a placement drive
--   2. A test STUDENT (Arjun Mathew) with a full profile
--   3. A drive application linking student → drive
--   4. A test RECRUITER (TechCorp)
--
-- HOW TO USE:
--   Step 1: Register via the app UI first:
--     • University: testuni@christ.edu / TestPass123!  (role: university)
--     • Student:    teststudent@example.com / TestPass123!  (role: student)
--     • Recruiter:  testrecruiter@techcorp.com / TestPass123!  (role: recruiter)
--
--   Step 2: Run this SQL to fill their profiles with rich demo data.
--   Step 3: Run the PLACEMENT DRIVE section (uses the university_profiles row).
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Update the student profile with full demo data
-- (Replace <student_user_id> with the actual UUID from auth.users)
-- ─────────────────────────────────────────────────────────────
UPDATE student_profiles
SET
  full_name        = 'Arjun Mathew',
  email            = 'teststudent@example.com',
  phone            = '+91 98765 43210',
  location         = 'Bangalore, Karnataka',
  bio              = 'Final year CS student passionate about distributed systems and fintech. Looking for SWE roles at product companies.',
  university       = 'Christ University',
  course           = 'B.Tech Computer Science',
  graduation_year  = 2026,
  cgpa             = 8.7,
  active_backlogs  = 0,
  skills           = ARRAY['Python', 'TypeScript', 'React', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'System Design'],
  github_url       = 'https://github.com/arjunmathew',
  linkedin_url     = 'https://linkedin.com/in/arjunmathew',
  portfolio_url    = 'https://arjunmathew.dev',
  profile_completion = 95
WHERE email = 'teststudent@example.com';

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Update the university profile
-- ─────────────────────────────────────────────────────────────
UPDATE university_profiles
SET
  name          = 'Christ University',
  contact_email = 'testuni@christ.edu',
  website       = 'https://christuniversity.in',
  location      = 'Bangalore, Karnataka'
WHERE contact_email = 'testuni@christ.edu';

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Create placement drives for the university
-- (Run AFTER updating university_profiles so the id is valid)
-- ─────────────────────────────────────────────────────────────
INSERT INTO placement_drives (
  university_id,
  title,
  company_name,
  role,
  location,
  package_lpa,
  drive_date,
  registration_deadline,
  status,
  eligibility,
  total_registered,
  total_selected
)
SELECT
  up.id,
  'Google Campus Drive 2026',
  'Google India',
  'Software Engineer (L3)',
  'Bangalore / Hybrid',
  32,
  '2026-08-15',
  '2026-08-10',
  'upcoming',
  '{"min_cgpa": 8.0, "max_backlogs": 0, "eligible_branches": ["Computer Science", "Information Technology", "Electronics"]}'::jsonb,
  0,
  0
FROM university_profiles up
WHERE up.contact_email = 'testuni@christ.edu'
ON CONFLICT DO NOTHING;

INSERT INTO placement_drives (
  university_id,
  title,
  company_name,
  role,
  location,
  package_lpa,
  drive_date,
  registration_deadline,
  status,
  eligibility,
  total_registered,
  total_selected
)
SELECT
  up.id,
  'Infosys InStep 2026',
  'Infosys',
  'Systems Engineer',
  'Mysore / Onsite',
  6.5,
  '2026-08-20',
  '2026-08-18',
  'upcoming',
  '{"min_cgpa": 6.0, "max_backlogs": 2, "eligible_branches": ["Computer Science", "Information Technology", "Electronics", "Mechanical"]}'::jsonb,
  0,
  0
FROM university_profiles up
WHERE up.contact_email = 'testuni@christ.edu'
ON CONFLICT DO NOTHING;

INSERT INTO placement_drives (
  university_id,
  title,
  company_name,
  role,
  location,
  package_lpa,
  drive_date,
  registration_deadline,
  status,
  eligibility,
  total_registered,
  total_selected
)
SELECT
  up.id,
  'Razorpay SDE Hiring',
  'Razorpay',
  'Software Development Engineer',
  'Bangalore',
  24,
  '2026-09-05',
  '2026-09-01',
  'active',
  '{"min_cgpa": 7.5, "max_backlogs": 0, "eligible_branches": ["Computer Science", "Information Technology"]}'::jsonb,
  0,
  0
FROM university_profiles up
WHERE up.contact_email = 'testuni@christ.edu'
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- STEP 4: Register the student for one drive (Infosys — eligibility passes)
-- ─────────────────────────────────────────────────────────────
INSERT INTO drive_applications (
  drive_id,
  student_id,
  status
)
SELECT
  pd.id,
  sp.id,
  'registered'
FROM placement_drives pd
CROSS JOIN student_profiles sp
WHERE pd.company_name = 'Infosys'
  AND sp.email = 'teststudent@example.com'
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- STEP 5: Update recruiter profile
-- ─────────────────────────────────────────────────────────────
UPDATE recruiter_profiles
SET
  company_name  = 'TechCorp Solutions',
  contact_email = 'testrecruiter@techcorp.com',
  industry      = 'Technology'
WHERE contact_email = 'testrecruiter@techcorp.com';

-- ─────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES
-- ─────────────────────────────────────────────────────────────
-- SELECT * FROM student_profiles WHERE email = 'teststudent@example.com';
-- SELECT * FROM university_profiles WHERE contact_email = 'testuni@christ.edu';
-- SELECT * FROM placement_drives WHERE company_name IN ('Google India', 'Infosys', 'Razorpay');
-- SELECT * FROM drive_applications;
