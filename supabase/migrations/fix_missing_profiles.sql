-- ══════════════════════════════════════════════════════════════
-- PLACIFY: Complete Demo Data Seed & Profile Repair
-- Run this in Supabase SQL Editor → New query
-- ══════════════════════════════════════════════════════════════

-- ── 1. Student Profile Repair & Rich Data ────────────────────
INSERT INTO student_profiles (user_id, full_name, email)
SELECT au.id, 'Arjun Mathew', au.email
FROM auth.users au
WHERE au.email = 'teststudent@example.com'
  AND NOT EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = au.id);

UPDATE student_profiles
SET
  full_name        = 'Arjun Mathew',
  email            = 'teststudent@example.com',
  phone            = '+91 98765 43210',
  location         = 'Bangalore, Karnataka',
  bio              = 'Final year CS student passionate about distributed systems and fintech. Seeking SDE roles.',
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


-- ── 2. University Profile Repair & Rich Data ─────────────────
INSERT INTO university_profiles (user_id, name, contact_email)
SELECT au.id, 'Christ University', au.email
FROM auth.users au
WHERE au.email = 'testuni@christ.edu'
  AND NOT EXISTS (SELECT 1 FROM university_profiles up WHERE up.user_id = au.id);

UPDATE university_profiles
SET
  name                   = 'Christ University',
  contact_email          = 'testuni@christ.edu',
  website                = 'https://christuniversity.in',
  location               = 'Bangalore, Karnataka',
  contact_phone          = '+91 80 4012 9100',
  placement_officer_name = 'Dr. Rajesh Sharma',
  accreditation          = 'NAAC A++',
  established_year       = 1969,
  verified               = true
WHERE contact_email = 'testuni@christ.edu';


-- ── 3. Recruiter Profile Repair & Rich Data ──────────────────
INSERT INTO recruiter_profiles (user_id, company_name, contact_email)
SELECT au.id, 'TechCorp Solutions', au.email
FROM auth.users au
WHERE au.email = 'testrecruiter@techcorp.com'
  AND NOT EXISTS (SELECT 1 FROM recruiter_profiles rp WHERE rp.user_id = au.id);

UPDATE recruiter_profiles
SET
  company_name        = 'TechCorp Solutions',
  contact_email       = 'testrecruiter@techcorp.com',
  company_website     = 'https://techcorp.example.com',
  company_description = 'Global enterprise software leader building cloud Infrastructure & AI tools.',
  industry            = 'Technology / Cloud Enterprise',
  company_size        = '500-1000 employees',
  headquarters        = 'Bangalore / San Francisco',
  designation         = 'Lead Technical Recruiter',
  verified            = true
WHERE contact_email = 'testrecruiter@techcorp.com';


-- ── 4. Create Placement Drives for University ────────────────
INSERT INTO placement_drives (
  university_id, title, company_name, role, location,
  package_lpa, drive_date, registration_deadline, status, eligibility,
  total_registered, total_selected
)
SELECT
  up.id,
  'Google Campus Drive 2026', 'Google India', 'Software Engineer (L3)',
  'Bangalore / Hybrid', 32, '2026-08-15', '2026-08-10', 'upcoming',
  '{"min_cgpa": 8.0, "max_backlogs": 0, "eligible_branches": ["Computer Science", "Information Technology", "Electronics"]}'::jsonb,
  142, 12
FROM university_profiles up WHERE up.contact_email = 'testuni@christ.edu'
ON CONFLICT DO NOTHING;

INSERT INTO placement_drives (
  university_id, title, company_name, role, location,
  package_lpa, drive_date, registration_deadline, status, eligibility,
  total_registered, total_selected
)
SELECT
  up.id,
  'Infosys InStep 2026', 'Infosys', 'Systems Engineer',
  'Mysore / Onsite', 6.5, '2026-08-20', '2026-08-18', 'upcoming',
  '{"min_cgpa": 6.0, "max_backlogs": 2, "eligible_branches": ["Computer Science", "Information Technology", "Electronics", "Mechanical"]}'::jsonb,
  280, 45
FROM university_profiles up WHERE up.contact_email = 'testuni@christ.edu'
ON CONFLICT DO NOTHING;

INSERT INTO placement_drives (
  university_id, title, company_name, role, location,
  package_lpa, drive_date, registration_deadline, status, eligibility,
  total_registered, total_selected
)
SELECT
  up.id,
  'Razorpay SDE Hiring', 'Razorpay', 'Software Development Engineer',
  'Bangalore', 24, '2026-09-05', '2026-09-01', 'active',
  '{"min_cgpa": 7.5, "max_backlogs": 0, "eligible_branches": ["Computer Science", "Information Technology"]}'::jsonb,
  195, 18
FROM university_profiles up WHERE up.contact_email = 'testuni@christ.edu'
ON CONFLICT DO NOTHING;


-- ── 5. Register Student for Drives ───────────────────────────
INSERT INTO drive_applications (drive_id, student_id, status)
SELECT pd.id, sp.id, 'registered'
FROM placement_drives pd
CROSS JOIN student_profiles sp
WHERE pd.company_name = 'Razorpay' AND sp.email = 'teststudent@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO drive_applications (drive_id, student_id, status)
SELECT pd.id, sp.id, 'registered'
FROM placement_drives pd
CROSS JOIN student_profiles sp
WHERE pd.company_name = 'Infosys' AND sp.email = 'teststudent@example.com'
ON CONFLICT DO NOTHING;


-- ── 6. Verification Report ───────────────────────────────────
SELECT 'student_profiles' as table_name, count(*) as count FROM student_profiles
UNION ALL
SELECT 'university_profiles', count(*) FROM university_profiles
UNION ALL
SELECT 'recruiter_profiles', count(*) FROM recruiter_profiles
UNION ALL
SELECT 'placement_drives', count(*) FROM placement_drives
UNION ALL
SELECT 'drive_applications', count(*) FROM drive_applications;
