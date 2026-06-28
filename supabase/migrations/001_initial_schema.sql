-- Users table (extends Supabase auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'university', 'recruiter')),
  student_id TEXT,
  full_name TEXT,
  university TEXT,
  course TEXT,
  graduation_year INTEGER,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student profiles table
CREATE TABLE student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  university TEXT,
  course TEXT,
  graduation_year INTEGER,
  cgpa DECIMAL(3,2),
  skills TEXT[],
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  projects JSONB,
  work_experience JSONB,
  achievements TEXT,
  tenth_marksheet_uploaded BOOLEAN DEFAULT FALSE,
  twelfth_marksheet_uploaded BOOLEAN DEFAULT FALSE,
  profile_completion INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resumes table
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  original_filename TEXT,
  file_data BYTEA,
  file_mimetype TEXT,
  parsed_text TEXT,
  extracted_data JSONB,
  generated_data BYTEA,
  generated_content JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'parsed', 'generated', 'error')),
  completion_percentage INTEGER DEFAULT 0,
  template TEXT DEFAULT 'modern',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  description TEXT,
  requirements TEXT,
  skills_required TEXT[],
  job_type TEXT CHECK (job_type IN ('full_time', 'part_time', 'internship', 'contract')),
  experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior')),
  salary_range TEXT,
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  recruiter_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job matches table (AI-driven recommendations)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, job_id)
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'rejected')),
  next_step TEXT,
  next_step_date DATE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, job_id)
);

-- Interviews table (mock interviews)
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  interview_type TEXT CHECK (interview_type IN ('technical', 'behavioral', 'mixed')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  current_question TEXT,
  questions_asked TEXT[],
  responses JSONB,
  feedback JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table (marksheets, certificates, etc.)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('10th_marksheet', '12th_marksheet', 'resume', 'certificate', 'other')),
  description TEXT,
  original_filename TEXT,
  file_data BYTEA,
  file_mimetype TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending_verification', 'verified', 'rejected', 'active')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Background jobs table (for heavy processing tasks)
CREATE TABLE background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN ('resume_parse', 'resume_generate', 'job_match', 'interview_analyze')),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  payload JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX idx_student_profiles_student_id ON student_profiles(student_id);
CREATE INDEX idx_resumes_student_id ON resumes(student_id);
CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_deadline ON jobs(deadline);
CREATE INDEX idx_job_matches_student_id ON job_matches(student_id);
CREATE INDEX idx_job_matches_job_id ON job_matches(job_id);
CREATE INDEX idx_job_matches_score ON job_matches(match_score DESC);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_interviews_student_id ON interviews(student_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_documents_student_id ON documents(student_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_background_jobs_student_id ON background_jobs(student_id);
CREATE INDEX idx_background_jobs_status ON background_jobs(status);

-- RLS Policies

-- Users table policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Student profiles table policies
CREATE POLICY "Students can view their own profile" ON student_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Students can update their own profile" ON student_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Resumes table policies
CREATE POLICY "Students can view their own resumes" ON resumes
  FOR SELECT USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can create their own resumes" ON resumes
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can update their own resumes" ON resumes
  FOR UPDATE USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

-- Jobs table policies (read-only for students)
CREATE POLICY "Students can view active jobs" ON jobs
  FOR SELECT USING (status = 'active');

-- Job matches table policies
CREATE POLICY "Students can view their own job matches" ON job_matches
  FOR SELECT USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can update their own job matches" ON job_matches
  FOR UPDATE USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

-- Applications table policies
CREATE POLICY "Students can view their own applications" ON applications
  FOR SELECT USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can create their own applications" ON applications
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can update their own applications" ON applications
  FOR UPDATE USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

-- Interviews table policies
CREATE POLICY "Students can view their own interviews" ON interviews
  FOR SELECT USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can create their own interviews" ON interviews
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can update their own interviews" ON interviews
  FOR UPDATE USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

-- Documents table policies
CREATE POLICY "Students can view their own documents" ON documents
  FOR SELECT USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can create their own documents" ON documents
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can update their own documents" ON documents
  FOR UPDATE USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can delete their own documents" ON documents
  FOR DELETE USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

-- Background jobs table policies
CREATE POLICY "Students can view their own background jobs" ON background_jobs
  FOR SELECT USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can create their own background jobs" ON background_jobs
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON users TO anon, authenticated;
GRANT UPDATE ON users TO authenticated;
GRANT SELECT ON student_profiles TO anon, authenticated;
GRANT UPDATE ON student_profiles TO authenticated;
GRANT SELECT ON resumes TO anon, authenticated;
GRANT INSERT ON resumes TO authenticated;
GRANT UPDATE ON resumes TO authenticated;
GRANT SELECT ON jobs TO anon, authenticated;
GRANT SELECT ON job_matches TO anon, authenticated;
GRANT UPDATE ON job_matches TO authenticated;
GRANT SELECT ON applications TO anon, authenticated;
GRANT INSERT ON applications TO authenticated;
GRANT UPDATE ON applications TO authenticated;
GRANT SELECT ON interviews TO anon, authenticated;
GRANT INSERT ON interviews TO authenticated;
GRANT UPDATE ON interviews TO authenticated;
GRANT SELECT ON documents TO anon, authenticated;
GRANT INSERT ON documents TO authenticated;
GRANT UPDATE ON documents TO authenticated;
GRANT DELETE ON documents TO authenticated;
GRANT SELECT ON background_jobs TO anon, authenticated;
GRANT INSERT ON background_jobs TO authenticated;
