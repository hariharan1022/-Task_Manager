-- Drop all tables first (clean slate)
DROP TABLE IF EXISTS verification_logs CASCADE;
DROP TABLE IF EXISTS certificate_payments CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS id_cards CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS exam_attempts CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS task_submissions CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS internship_programs CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Now create all tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone TEXT DEFAULT '',
  college TEXT DEFAULT '',
  department TEXT DEFAULT '',
  graduation_year INT,
  profile_photo TEXT DEFAULT '',
  linkedin_profile TEXT DEFAULT '',
  github_url TEXT DEFAULT '',
  portfolio_url TEXT DEFAULT '',
  resume_url TEXT DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  is_email_verified BOOLEAN DEFAULT false,
  email_otp TEXT DEFAULT NULL,
  email_otp_expires_at TIMESTAMPTZ DEFAULT NULL,
  refresh_token_hash TEXT DEFAULT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT DEFAULT '',
  description TEXT DEFAULT '',
  thumbnail TEXT DEFAULT '',
  category TEXT NOT NULL,
  level TEXT DEFAULT 'Beginner' CHECK (level IN ('Beginner','Intermediate','Advanced')),
  duration TEXT DEFAULT '',
  instructor TEXT DEFAULT 'Skyrovix Academy',
  learning_objectives TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  modules JSONB DEFAULT '[]'::jsonb,
  video_url TEXT DEFAULT '',
  total_lessons INT DEFAULT 0,
  total_duration INT DEFAULT 0,
  enrolled_count INT DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_lessons TEXT[] DEFAULT '{}',
  last_lesson_id TEXT DEFAULT '',
  last_position INT DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','dropped')),
  completed_at TIMESTAMPTZ DEFAULT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  watch_time INT DEFAULT 0,
  last_position INT DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE internship_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  duration TEXT NOT NULL,
  description TEXT DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  stipend TEXT DEFAULT 'Unpaid',
  cover_image TEXT DEFAULT '',
  tasks JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  certificate_template TEXT DEFAULT '',
  offer_letter_template TEXT DEFAULT '',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES internship_programs(id) ON DELETE CASCADE,
  task_number INT NOT NULL CHECK (task_number >= 1 AND task_number <= 5),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  instructions TEXT DEFAULT '',
  submission_type TEXT DEFAULT 'link' CHECK (submission_type IN ('link','file','text','github')),
  due_in_days INT DEFAULT 7,
  points INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(internship_id, task_number)
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES internship_programs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','completed')),
  motivation TEXT DEFAULT '',
  skills TEXT[] DEFAULT '{}',
  availability TEXT DEFAULT '',
  relevant_experience TEXT DEFAULT '',
  projects_highlight TEXT DEFAULT '',
  linked_in_url TEXT DEFAULT '',
  github_url TEXT DEFAULT '',
  hours_per_week TEXT DEFAULT '',
  expected_start TEXT DEFAULT '',
  admin_feedback TEXT DEFAULT '',
  offer_letter_url TEXT DEFAULT '',
  offer_letter_id TEXT DEFAULT '',
  intern_id TEXT DEFAULT '',
  internship_mode TEXT DEFAULT 'Online',
  offer_letter_linkedin_post TEXT DEFAULT '',
  offer_letter_posted_at TIMESTAMPTZ DEFAULT NULL,
  certificate_url TEXT DEFAULT '',
  certificate_linkedin_post TEXT DEFAULT '',
  certificate_posted_at TIMESTAMPTZ DEFAULT NULL,
  total_score INT DEFAULT 0,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, internship_id)
);

CREATE TABLE task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  submission_content TEXT NOT NULL,
  submission_file_url TEXT DEFAULT '',
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed','approved','rejected')),
  feedback TEXT DEFAULT '',
  score INT DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ DEFAULT NULL,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  instructions TEXT DEFAULT '',
  max_marks INT DEFAULT 50,
  due_date TIMESTAMPTZ DEFAULT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  file_url TEXT DEFAULT '',
  file_name TEXT DEFAULT '',
  content TEXT DEFAULT '',
  marks INT DEFAULT NULL,
  feedback TEXT DEFAULT '',
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed','graded')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ DEFAULT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, assignment_id)
);

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  total_questions INT DEFAULT 100,
  duration INT DEFAULT 60,
  total_marks INT DEFAULT 100,
  converted_marks INT DEFAULT 50,
  passing_marks INT DEFAULT 50,
  shuffle_questions BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INT NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
  explanation TEXT DEFAULT '',
  marks INT DEFAULT 1,
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '[]'::jsonb,
  question_order UUID[] DEFAULT '{}',
  total_questions INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  score NUMERIC DEFAULT 0,
  converted_marks NUMERIC DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ DEFAULT NULL,
  time_spent INT DEFAULT 0,
  status TEXT DEFAULT 'in-progress' CHECK (status IN ('in-progress','completed','expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exam_id)
);

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  certificate_id TEXT NOT NULL UNIQUE,
  pdf_url TEXT DEFAULT '',
  pdf_path TEXT DEFAULT '',
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  linkedin_post_url TEXT DEFAULT '',
  score INT DEFAULT 0,
  grade TEXT DEFAULT 'Good' CHECK (grade IN ('Excellent','Good','Satisfactory')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE id_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  intern_id TEXT NOT NULL UNIQUE,
  pdf_url TEXT DEFAULT '',
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ DEFAULT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'system' CHECK (type IN ('application','task','system')),
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  link TEXT DEFAULT '',
  read BOOLEAN DEFAULT false,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assignment_marks INT DEFAULT 0,
  exam_marks INT DEFAULT 0,
  total_score INT DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 100),
  grade TEXT DEFAULT 'Fail' CHECK (grade IN ('A+','A','B+','B','C','Fail')),
  status TEXT DEFAULT 'in-progress' CHECK (status IN ('in-progress','passed','failed')),
  completed_at TIMESTAMPTZ DEFAULT NULL,
  certificate_issued BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE certificate_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  certificate_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  email TEXT NOT NULL,
  program_name TEXT DEFAULT '',
  amount NUMERIC DEFAULT 100,
  transaction_id TEXT NOT NULL,
  screenshot_url TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason TEXT DEFAULT '',
  approved_at TIMESTAMPTZ DEFAULT NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES certificate_payments(id) ON DELETE SET NULL,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certificate_id TEXT DEFAULT '',
  action TEXT NOT NULL DEFAULT 'approve',
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_internships_domain ON internship_programs(domain);
CREATE INDEX IF NOT EXISTS idx_internships_active ON internship_programs(is_active);
CREATE INDEX IF NOT EXISTS idx_tasks_internship ON tasks(internship_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_offer ON applications(offer_letter_id);
CREATE INDEX IF NOT EXISTS idx_applications_intern ON applications(intern_id);
CREATE INDEX IF NOT EXISTS idx_task_subs_student ON task_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_task_subs_application ON task_submissions(application_id);
CREATE INDEX IF NOT EXISTS idx_task_subs_task ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignment_subs_user ON assignment_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_subs_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_exams_course ON exams(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_user ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_course ON results(course_id);
CREATE INDEX IF NOT EXISTS idx_cert_payments_student ON certificate_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_cert_payments_status ON certificate_payments(status);
CREATE INDEX IF NOT EXISTS idx_verification_logs_student ON verification_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_payment ON verification_logs(payment_id);

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE internship_programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE id_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE results DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_payments DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon role (needed when using anon key instead of service key)
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER TABLE verification_logs DISABLE ROW LEVEL SECURITY;
