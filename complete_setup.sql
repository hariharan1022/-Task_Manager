/* === SKYROVIX LMS - COMPLETE SETUP === */

-- 20260615124725_4485fbfc-ca01-41e0-8269-1ee84256e72b.sql

-- ============ ENUMS ============
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.application_status AS ENUM ('pending', 'approved'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_status AS ENUM ('pending', 'verified', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  college TEXT,
  course TEXT,
  year TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============ APPLICATIONS ============
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status public.application_status NOT NULL DEFAULT 'approved',
  intern_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  college TEXT,
  course TEXT,
  year TEXT,
  photo_url TEXT,
  offer_issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- ============ TASKS ============
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  task_number INT NOT NULL CHECK (task_number BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  resources TEXT,
  UNIQUE (domain, task_number)
);
GRANT SELECT ON public.tasks TO authenticated, anon;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tasks are public" ON public.tasks;
CREATE POLICY "Tasks are public" ON public.tasks FOR SELECT TO anon, authenticated USING (true);

-- ============ SUBMISSIONS ============
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  github_url TEXT,
  deployed_url TEXT,
  notes TEXT,
  status public.submission_status NOT NULL DEFAULT 'pending',
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE (application_id, task_id)
);
GRANT SELECT, INSERT, UPDATE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- ============ PAYMENTS ============
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE UNIQUE,
  utr_number TEXT NOT NULL,
  screenshot_url TEXT,
  amount NUMERIC NOT NULL DEFAULT 100,
  status public.payment_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============ CERTIFICATES ============
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE UNIQUE,
  certificate_id TEXT NOT NULL UNIQUE,
  verification_hash TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.certificates TO authenticated, anon;
GRANT INSERT, UPDATE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Certificates are publicly verifiable" ON public.certificates;
CREATE POLICY "Certificates are publicly verifiable" ON public.certificates FOR SELECT TO anon, authenticated USING (true);

-- ============ POLICIES ============
-- profiles
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- user_roles
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- applications
DROP POLICY IF EXISTS "Users view own applications" ON public.applications;
CREATE POLICY "Users view own applications" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users create own applications" ON public.applications;
CREATE POLICY "Users create own applications" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins update applications" ON public.applications;
CREATE POLICY "Admins update applications" ON public.applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- submissions
DROP POLICY IF EXISTS "Users view own submissions" ON public.submissions;
CREATE POLICY "Users view own submissions" ON public.submissions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.applications a WHERE a.id = submissions.application_id AND a.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
DROP POLICY IF EXISTS "Users insert own submissions" ON public.submissions;
CREATE POLICY "Users insert own submissions" ON public.submissions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.applications a WHERE a.id = submissions.application_id AND a.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users update own pending submissions" ON public.submissions;
CREATE POLICY "Users update own pending submissions" ON public.submissions FOR UPDATE TO authenticated USING (
  (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = submissions.application_id AND a.user_id = auth.uid()) AND status = 'pending')
  OR public.has_role(auth.uid(), 'admin')
);

-- payments
DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.applications a WHERE a.id = payments.application_id AND a.user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);
DROP POLICY IF EXISTS "Users insert own payments" ON public.payments;
CREATE POLICY "Users insert own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.applications a WHERE a.id = payments.application_id AND a.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins update payments" ON public.payments;
CREATE POLICY "Admins update payments" ON public.payments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- certificates
DROP POLICY IF EXISTS "Authenticated can insert certificates" ON public.certificates;
CREATE POLICY "Authenticated can insert certificates" ON public.certificates FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));

  IF NEW.email = 'hariharan@skyrovix.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- ============ SEED TASKS ============
INSERT INTO public.tasks (domain, task_number, title, description, resources) VALUES
-- Full Stack
('fullstack', 1, 'Personal Portfolio Website', 'Build a responsive personal portfolio with React + Tailwind. Include Home, About, Projects, Contact.', 'MDN, React docs'),
('fullstack', 2, 'REST API with CRUD', 'Build a Node.js/Express API with full CRUD on a "tasks" resource. Use MongoDB or PostgreSQL.', 'Express docs'),
('fullstack', 3, 'Authentication System', 'Add JWT or session-based auth (signup/login/logout) to your API + a React frontend.', ''),
('fullstack', 4, 'Real-time Chat App', 'Build a real-time chat with Socket.io or Supabase Realtime.', ''),
('fullstack', 5, 'Full Stack Capstone', 'Design + ship a full stack product of your choice (e.g. blog, task manager, e-commerce). Deploy live.', ''),
-- Frontend
('frontend', 1, 'Landing Page Clone', 'Pixel-perfect responsive clone of any modern SaaS landing page.', ''),
('frontend', 2, 'Component Library', 'Build 8 reusable accessible components (Button, Modal, Tabs, Toast, etc.) with Tailwind.', ''),
('frontend', 3, 'Dashboard UI', 'Build an analytics dashboard with charts (Recharts/Chart.js), filters, dark mode.', ''),
('frontend', 4, 'Animated Web App', 'Use Framer Motion to build an interactive animated UI (e.g. onboarding flow, product showcase).', ''),
('frontend', 5, 'Frontend Capstone', 'Ship a polished frontend product. Lighthouse score ≥ 90.', ''),
-- Backend
('backend', 1, 'REST API Basics', 'Build a Node/Express API with CRUD + validation + error handling.', ''),
('backend', 2, 'Database Design', 'Design a normalized relational schema for an e-commerce store. Implement migrations.', ''),
('backend', 3, 'Authentication & Authorization', 'Implement JWT auth + role-based access control.', ''),
('backend', 4, 'File Uploads & Email', 'Add S3/Cloudinary uploads + transactional email (SendGrid/Resend).', ''),
('backend', 5, 'Backend Capstone', 'Ship a production-grade backend with tests, docs (Swagger/Postman) and deployment.', ''),
-- Data Science
('datascience', 1, 'Exploratory Data Analysis', 'Pick a Kaggle dataset, do EDA with pandas + matplotlib/seaborn. Submit notebook.', ''),
('datascience', 2, 'Data Cleaning Pipeline', 'Build a reproducible cleaning pipeline for a messy dataset.', ''),
('datascience', 3, 'Predictive Model', 'Train + evaluate a regression or classification model. Report metrics.', ''),
('datascience', 4, 'Dashboard / Visualization', 'Build an interactive dashboard with Streamlit or Plotly Dash.', ''),
('datascience', 5, 'DS Capstone', 'End-to-end DS project: data → model → deployed app or report.', ''),
-- AI/ML
('aiml', 1, 'ML Fundamentals', 'Implement linear regression + logistic regression from scratch in NumPy.', ''),
('aiml', 2, 'Classification Project', 'Train a classifier (sklearn) on a real dataset. Report confusion matrix + F1.', ''),
('aiml', 3, 'Neural Network', 'Build an image classifier with PyTorch or TensorFlow.', ''),
('aiml', 4, 'LLM Application', 'Build an app using OpenAI / Gemini APIs (e.g. chatbot, summarizer, RAG).', ''),
('aiml', 5, 'AI/ML Capstone', 'Ship an ML model behind a web UI. Document the pipeline.', ''),
-- UI/UX
('uiux', 1, 'Design Research', 'Pick a problem, do user interviews/surveys, document personas + journey map.', ''),
('uiux', 2, 'Wireframes', 'Low-fi wireframes for a mobile app (5+ screens) in Figma.', ''),
('uiux', 3, 'High-Fidelity Mockups', 'High-fidelity Figma mockups with proper design system (colors, type, components).', ''),
('uiux', 4, 'Interactive Prototype', 'Clickable Figma prototype with micro-interactions.', ''),
('uiux', 5, 'UX Capstone', 'Full case study (research → wireframes → mockups → prototype → usability test).', ''),
-- Python
('python', 1, 'Python Basics Project', 'CLI tool of your choice (e.g. todo, currency converter, file organizer).', ''),
('python', 2, 'Web Scraper', 'Scrape a website with requests + BeautifulSoup or Playwright; save to CSV.', ''),
('python', 3, 'Flask/FastAPI App', 'Build a small web API with FastAPI.', ''),
('python', 4, 'Automation Script', 'Automate a real-world task (email, file processing, reports).', ''),
('python', 5, 'Python Capstone', 'Ship a Python project (web app, data tool, or library) with tests.', ''),
-- Java
('java', 1, 'Java Fundamentals', 'OOP project: design a Library Management System (classes, inheritance, interfaces).', ''),
('java', 2, 'Collections & Streams', 'Build a data-processing app using Streams, Lambdas, Collections.', ''),
('java', 3, 'Spring Boot REST API', 'Build a REST API with Spring Boot + JPA + PostgreSQL.', ''),
('java', 4, 'Authentication', 'Add JWT auth to your Spring Boot API.', ''),
('java', 5, 'Java Capstone', 'Ship a full Spring Boot backend, deployed with documentation.', ''),
-- Cyber Security
('cybersecurity', 1, 'CIA Triad & Recon', 'Write a report on Confidentiality/Integrity/Availability + perform OSINT on a target you own.', ''),
('cybersecurity', 2, 'Network Scanning', 'Use Nmap to scan + document open ports + services on a lab machine.', ''),
('cybersecurity', 3, 'Web Vulnerability Lab', 'Solve OWASP Juice Shop / DVWA challenges (SQLi, XSS, CSRF). Submit writeups.', ''),
('cybersecurity', 4, 'Password Cracking & Hashing', 'Use Hashcat/John on test hashes; explain salting + KDFs.', ''),
('cybersecurity', 5, 'CyberSec Capstone', 'Full pentest report on a vulnerable VM (HackTheBox/TryHackMe).', ''),
-- Digital Marketing
('digitalmarketing', 1, 'SEO Audit', 'Run a full SEO audit on a website (keywords, on-page, backlinks). Submit report.', ''),
('digitalmarketing', 2, 'Social Media Strategy', '30-day content calendar for a brand of your choice (Instagram + LinkedIn).', ''),
('digitalmarketing', 3, 'Google Ads Campaign', 'Plan a Google Ads campaign (keywords, ad copy, budget, KPIs).', ''),
('digitalmarketing', 4, 'Email Marketing', 'Design a 5-email drip campaign + landing page.', ''),
('digitalmarketing', 5, 'DM Capstone', 'Real campaign for a small business / portfolio site with measurable results.', '');

-- 20260615124748_ab1b8349-d021-4dd2-a4ca-a4b3f9feba88.sql

-- Lock down SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- has_role still callable by authenticated and anon (needed inside RLS policies via auth.uid())
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

-- Storage policies: profile-photos
DROP POLICY IF EXISTS "Users upload own profile photo" ON storage.objects;
CREATE POLICY "Users upload own profile photo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users view own profile photos" ON storage.objects;
CREATE POLICY "Users view own profile photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));

DROP POLICY IF EXISTS "Users update own profile photos" ON storage.objects;
CREATE POLICY "Users update own profile photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies: payment-screenshots
DROP POLICY IF EXISTS "Users upload own payment screenshot" ON storage.objects;
CREATE POLICY "Users upload own payment screenshot"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users view own payment screenshot" ON storage.objects;
CREATE POLICY "Users view own payment screenshot"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-screenshots' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));

-- 20260620152643_29d9ea0d-a546-492e-bd07-2b273ffcf27b.sql

-- Storage: profile-photos DELETE (own folder)
DROP POLICY IF EXISTS "Users delete own profile photos" ON storage.objects;
CREATE POLICY "Users delete own profile photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage: payment-screenshots DELETE (own folder)
DROP POLICY IF EXISTS "Users delete own payment screenshots" ON storage.objects;
CREATE POLICY "Users delete own payment screenshots"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage: payment-screenshots DELETE (admins)
DROP POLICY IF EXISTS "Admins delete payment screenshots" ON storage.objects;
CREATE POLICY "Admins delete payment screenshots"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-screenshots' AND public.has_role(auth.uid(), 'admin'));

-- user_roles: admin-only INSERT/DELETE/UPDATE
DROP POLICY IF EXISTS "Admins insert user roles" ON public.user_roles;
CREATE POLICY "Admins insert user roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete user roles" ON public.user_roles;
CREATE POLICY "Admins delete user roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update user roles" ON public.user_roles;
CREATE POLICY "Admins update user roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 20260620153212_6ae526c8-a1b9-4051-aad0-143eb5988a0d.sql

-- =========================================================
-- COURSES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  short_description text NOT NULL,
  icon text NOT NULL DEFAULT 'BookOpen',
  domain text NOT NULL,
  total_topics int NOT NULL DEFAULT 0,
  total_tasks int NOT NULL DEFAULT 5,
  quiz_marks int NOT NULL DEFAULT 100,
  pass_marks int NOT NULL DEFAULT 60,
  quiz_duration_min int NOT NULL DEFAULT 60,
  duration_weeks int NOT NULL DEFAULT 8,
  difficulty text NOT NULL DEFAULT 'Intermediate',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO authenticated, anon;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT USING (is_published = true OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
CREATE POLICY "Admins manage courses" ON public.courses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- COURSE TOPICS (lessons)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.course_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index int NOT NULL,
  title text NOT NULL,
  content_md text NOT NULL DEFAULT '',
  code_example text,
  key_points text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, order_index)
);
GRANT SELECT ON public.course_topics TO authenticated, anon;
GRANT ALL ON public.course_topics TO service_role;
ALTER TABLE public.course_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view topics" ON public.course_topics;
CREATE POLICY "Anyone can view topics" ON public.course_topics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage topics" ON public.course_topics;
CREATE POLICY "Admins manage topics" ON public.course_topics
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- COURSE TASKS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.course_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  task_number int NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  requirements text NOT NULL DEFAULT '',
  due_days int NOT NULL DEFAULT 7,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, task_number)
);
GRANT SELECT ON public.course_tasks TO authenticated, anon;
GRANT ALL ON public.course_tasks TO service_role;
ALTER TABLE public.course_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view course tasks" ON public.course_tasks;
CREATE POLICY "Anyone can view course tasks" ON public.course_tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage course tasks" ON public.course_tasks;
CREATE POLICY "Admins manage course tasks" ON public.course_tasks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- QUIZ QUESTIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.course_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_index int NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index int NOT NULL,
  question_type text NOT NULL DEFAULT 'mcq',
  marks int NOT NULL DEFAULT 2,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_quiz_questions TO authenticated;
GRANT ALL ON public.course_quiz_questions TO service_role;
ALTER TABLE public.course_quiz_questions ENABLE ROW LEVEL SECURITY;
-- Students can read questions (to render the quiz); correct_index is exposed
-- in the API surface but graded server-side. For tighter security a view could
-- mask it; acceptable for MVP given small question pool.
DROP POLICY IF EXISTS "Authenticated can view quiz questions" ON public.course_quiz_questions;
CREATE POLICY "Authenticated can view quiz questions" ON public.course_quiz_questions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage quiz" ON public.course_quiz_questions;
CREATE POLICY "Admins manage quiz" ON public.course_quiz_questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- ENROLLMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'enrolled',
  progress_percent int NOT NULL DEFAULT 0,
  current_topic_id uuid REFERENCES public.course_topics(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own enrollments" ON public.enrollments;
CREATE POLICY "Users view own enrollments" ON public.enrollments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Users create own enrollment" ON public.enrollments;
CREATE POLICY "Users create own enrollment" ON public.enrollments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own enrollment" ON public.enrollments;
CREATE POLICY "Users update own enrollment" ON public.enrollments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Users delete own enrollment" ON public.enrollments;
CREATE POLICY "Users delete own enrollment" ON public.enrollments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- LESSON PROGRESS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.course_topics(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, topic_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own progress" ON public.lesson_progress;
CREATE POLICY "Users manage own progress" ON public.lesson_progress
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND (e.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));

-- =========================================================
-- COURSE TASK SUBMISSIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.course_task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.course_tasks(id) ON DELETE CASCADE,
  project_url text,
  file_path text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  feedback text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE (enrollment_id, task_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_task_submissions TO authenticated;
GRANT ALL ON public.course_task_submissions TO service_role;
ALTER TABLE public.course_task_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own task submissions" ON public.course_task_submissions;
CREATE POLICY "Users view own task submissions" ON public.course_task_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND (e.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
DROP POLICY IF EXISTS "Users insert own task submissions" ON public.course_task_submissions;
CREATE POLICY "Users insert own task submissions" ON public.course_task_submissions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users update own task submissions" ON public.course_task_submissions;
CREATE POLICY "Users update own task submissions" ON public.course_task_submissions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND (e.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND (e.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- =========================================================
-- QUIZ ATTEMPTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 100,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own attempts" ON public.quiz_attempts;
CREATE POLICY "Users view own attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND (e.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
DROP POLICY IF EXISTS "Users insert own attempts" ON public.quiz_attempts;
CREATE POLICY "Users insert own attempts" ON public.quiz_attempts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users update own attempts" ON public.quiz_attempts;
CREATE POLICY "Users update own attempts" ON public.quiz_attempts
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));

-- =========================================================
-- COURSE CERTIFICATES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.course_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL UNIQUE REFERENCES public.enrollments(id) ON DELETE CASCADE,
  certificate_id text NOT NULL UNIQUE,
  verification_hash text NOT NULL UNIQUE,
  score int NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.course_certificates TO authenticated;
GRANT SELECT ON public.course_certificates TO anon;
GRANT ALL ON public.course_certificates TO service_role;
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can verify a certificate" ON public.course_certificates;
CREATE POLICY "Anyone can verify a certificate" ON public.course_certificates
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users insert own certificate" ON public.course_certificates;
CREATE POLICY "Users insert own certificate" ON public.course_certificates
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));

-- =========================================================
-- updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- =========================================================
-- SEED: Full Stack Development course
-- =========================================================
WITH c AS (
  INSERT INTO public.courses (slug, name, short_description, icon, domain, total_topics, total_tasks, duration_weeks, difficulty)
  VALUES ('fullstack', 'Full Stack Development', 'Learn React, Node.js, Express, MongoDB and deployment end-to-end.', 'Layers', 'fullstack', 12, 5, 8, 'Intermediate')
  RETURNING id
)
INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT c.id, t.idx, t.title, t.content, t.code, t.points FROM c, (VALUES
  (1, 'Introduction to Full Stack', 'Full stack development means building both the front-end (what users see) and the back-end (servers, databases, APIs) of a web application. In this course you will learn the modern JavaScript stack: React for the UI, Node.js + Express for APIs, and MongoDB for data.', NULL::text, ARRAY['Frontend = browser','Backend = server + database','APIs connect them']),
  (2, 'HTML Basics', 'HTML structures web pages. Elements like <h1>, <p>, <a>, and <img> describe content semantically so browsers and search engines understand it.', '<h1>Hello World</h1>
<p>My first page.</p>', ARRAY['Use semantic tags','Always close tags','Alt text on images']),
  (3, 'CSS Fundamentals', 'CSS styles HTML. Modern CSS uses Flexbox and Grid for layout, custom properties for theming, and media queries for responsive design.', '.button {
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  background: hsl(220 90% 56%);
  color: white;
}', ARRAY['Mobile-first','Use rem/em not px','Avoid !important']),
  (4, 'JavaScript Essentials', 'JavaScript is the language of the web. You will use modern ES2020+ features: arrow functions, async/await, destructuring, modules.', 'const fetchUser = async (id) => {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
};', ARRAY['Use const/let, not var','Async/await over .then','Modules over scripts']),
  (5, 'React Basics', 'React builds UIs with components. Components are functions that return JSX. State is managed with useState, and side effects with useEffect.', 'function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n+1)}>{n}</button>;
}', ARRAY['Components are functions','State drives UI','Keys for lists']),
  (6, 'Node.js Runtime', 'Node.js runs JavaScript on the server. It uses an event loop for non-blocking I/O, making it ideal for APIs and real-time apps.', 'import { readFile } from "node:fs/promises";
const data = await readFile("./data.json", "utf8");', ARRAY['Single-threaded event loop','npm for packages','ESM modules']),
  (7, 'Express.js APIs', 'Express is the most popular Node web framework. Define routes, parse JSON, and return responses with minimal boilerplate.', 'app.get("/api/users", async (req, res) => {
  const users = await db.users.find();
  res.json(users);
});', ARRAY['Middleware pipeline','REST conventions','Error handling middleware']),
  (8, 'MongoDB & Mongoose', 'MongoDB stores documents (JSON-like). Mongoose adds schemas, validation, and a clean query API on top.', 'const User = mongoose.model("User", new Schema({
  name: String, email: { type: String, unique: true }
}));', ARRAY['Documents, not rows','Indexes for speed','Schema validation']),
  (9, 'Authentication & JWT', 'Authentication identifies a user; authorization decides what they can do. JWT tokens are signed strings carrying user identity between client and server.', 'const token = jwt.sign({ sub: user.id }, SECRET, { expiresIn: "7d" });', ARRAY['Hash passwords with bcrypt','Short-lived access tokens','HttpOnly cookies in prod']),
  (10, 'Building REST APIs', 'A REST API exposes resources via HTTP verbs (GET, POST, PUT, DELETE). Design predictable URLs, return proper status codes.', 'router.post("/posts", auth, async (req, res) => {
  const post = await Post.create({ ...req.body, author: req.user.id });
  res.status(201).json(post);
});', ARRAY['Plural nouns in URLs','Use 201 for create','Validate input']),
  (11, 'Deployment', 'Modern apps deploy to platforms like Vercel, Netlify, or Render. Use environment variables for secrets, and CI for automated builds.', NULL, ARRAY['Env vars for secrets','HTTPS everywhere','Monitor errors']),
  (12, 'Final Project', 'Put it all together: build a full-stack internship portal with auth, a database, an API, and a deployed React frontend.', NULL, ARRAY['Plan before coding','Ship something small first','Document your work'])
) AS t(idx, title, content, code, points);

WITH c AS (SELECT id FROM public.courses WHERE slug = 'fullstack')
INSERT INTO public.course_tasks (course_id, task_number, title, description, requirements, due_days)
SELECT c.id, t.n, t.title, t.descr, t.req, 7 FROM c, (VALUES
  (1, 'Responsive Portfolio Website', 'Build a personal portfolio that showcases your skills and projects.', 'Responsive on mobile, About + Projects + Contact sections, deployed live.'),
  (2, 'Todo App with React', 'Create a todo application with add, edit, delete, and filter (all/active/done).', 'React + localStorage persistence, keyboard accessible, no console errors.'),
  (3, 'Authentication System', 'Build sign-up, sign-in, and protected routes with JWT.', 'Email + password, hashed passwords, JWT auth, protected /dashboard route.'),
  (4, 'E-Commerce Storefront', 'A small e-commerce site with product list, cart, and checkout.', 'Product catalog from DB, cart state, checkout form, order saved to DB.'),
  (5, 'Internship Management Portal', 'Capstone: rebuild a portal where students apply, submit tasks, and get certificates.', 'Auth, applications, submissions, admin panel, certificate generation.')
) AS t(n, title, descr, req);

WITH c AS (SELECT id FROM public.courses WHERE slug = 'fullstack')
INSERT INTO public.course_quiz_questions (course_id, order_index, question, options, correct_index, marks)
SELECT c.id, q.idx, q.question, q.options::jsonb, q.correct, 2 FROM c, (VALUES
  (1, 'Which HTML tag is used for the largest heading?', '["<h6>","<h1>","<head>","<heading>"]', 1),
  (2, 'In CSS, which property controls text size?', '["font-style","text-size","font-size","size"]', 2),
  (3, 'What keyword declares a block-scoped variable in modern JS?', '["var","let","function","static"]', 1),
  (4, 'In React, what hook manages local component state?', '["useEffect","useState","useMemo","useRef"]', 1),
  (5, 'What does Node.js use for non-blocking I/O?', '["Threads per request","Event loop","Forked processes","Web workers"]', 1),
  (6, 'Which HTTP method is conventionally used to CREATE a resource?', '["GET","PUT","POST","DELETE"]', 2),
  (7, 'MongoDB stores data as:', '["Tables of rows","BSON documents","XML files","Key-value pairs only"]', 1),
  (8, 'Which library is commonly used to hash passwords in Node?', '["bcrypt","lodash","axios","cors"]', 0),
  (9, 'What status code means "Created"?', '["200","201","204","301"]', 1),
  (10, 'Which is NOT a valid React hook?', '["useState","useEffect","useFetch","useMemo"]', 2)
) AS q(idx, question, options, correct);

UPDATE public.courses SET total_topics = 12 WHERE slug = 'fullstack';

-- Additional placeholder courses (no topics seeded yet)
INSERT INTO public.courses (slug, name, short_description, icon, domain, total_topics, total_tasks, duration_weeks, difficulty)
VALUES
  ('frontend','Frontend Development','Master React, Tailwind, and modern responsive UI patterns.','Monitor','frontend',0,5,6,'Beginner'),
  ('backend','Backend Development','Node.js, Express, databases, and production-grade APIs.','Server','backend',0,5,8,'Intermediate'),
  ('datascience','Data Science','Python, Pandas, visualization, and statistical thinking.','BarChart3','datascience',0,5,10,'Intermediate'),
  ('aiml','AI & Machine Learning','Build ML models and integrate LLMs into real products.','Brain','aiml',0,5,10,'Advanced'),
  ('uiux','UI / UX Design','Human-centered design from research to high-fidelity prototypes.','Palette','uiux',0,5,6,'Beginner'),
  ('python','Python Development','Python for web, automation, and data work.','Code2','python',0,5,6,'Beginner'),
  ('cybersecurity','Cyber Security','Defensive and offensive security fundamentals.','Shield','cybersecurity',0,5,8,'Intermediate'),
  ('digitalmarketing','Digital Marketing','SEO, paid ads, content, and growth funnels.','TrendingUp','digitalmarketing',0,5,6,'Beginner');

-- 20260620164000_fix_has_role_permissions.sql
-- Grant execute privilege on has_role function to anon and authenticated users
-- This prevents the 'permission denied for function has_role' error when public or anon queries are made.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- 20260621000000_add_internship_statuses.sql
DO $$ BEGIN ALTER TYPE public.application_status ADD VALUE 'ongoing' AFTER 'approved'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.application_status ADD VALUE 'completed' AFTER 'ongoing'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 20260621000001_fix_task_number_check.sql
-- Allow task_number 0 for the LinkedIn post task
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_number_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_task_number_check CHECK (task_number BETWEEN 0 AND 5);

-- 20260621000003_seed_linkedin_task.sql
-- Seed LinkedIn post task (task_number 0) for every existing domain
INSERT INTO public.tasks (domain, task_number, title, description)
SELECT DISTINCT domain, 0, 'Share Your Offer Letter on LinkedIn',
  'Post your Skyrovix offer letter on LinkedIn to celebrate your internship and inspire others.'
FROM public.tasks
WHERE domain IS NOT NULL
ON CONFLICT (domain, task_number) DO NOTHING;

-- 20260621000004_add_submission_files.sql
-- Add file columns to submissions table
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Create storage bucket for task submission files
INSERT INTO storage.buckets (id, name, public) VALUES ('task-submissions', 'task-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own task files
DROP POLICY IF EXISTS "Users upload own task submission files" ON storage.objects;
CREATE POLICY "Users upload own task submission files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'task-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users and admins to view task submission files
DROP POLICY IF EXISTS "Users view own task submission files" ON storage.objects;
CREATE POLICY "Users view own task submission files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'task-submissions'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Allow users to update/delete their own task submission files
DROP POLICY IF EXISTS "Users update own task submission files" ON storage.objects;
CREATE POLICY "Users update own task submission files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'task-submissions' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own task submission files" ON storage.objects;
CREATE POLICY "Users delete own task submission files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'task-submissions' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admin can delete any task submission file
DROP POLICY IF EXISTS "Admin delete task submission files" ON storage.objects;
CREATE POLICY "Admin delete task submission files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'task-submissions' AND public.has_role(auth.uid(), 'admin'));

-- 20260622000001_rpc_ensure_linkedin_task.sql
-- RPC: ensure the LinkedIn post task (task_number 0) exists for a given domain
-- and return its UUID. Uses SECURITY DEFINER so authenticated users can trigger
-- the INSERT even though they only have SELECT on the tasks table.
CREATE OR REPLACE FUNCTION public.ensure_linkedin_task(p_domain TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Try to find existing task
  SELECT id INTO v_id
  FROM public.tasks
  WHERE domain = p_domain AND task_number = 0;

  -- If not found, create it
  IF v_id IS NULL THEN
    INSERT INTO public.tasks (domain, task_number, title, description)
    VALUES (
      p_domain,
      0,
      'Share Your Offer Letter on LinkedIn',
      'Post your Skyrovix offer letter on LinkedIn to celebrate your internship and inspire others.'
    )
    ON CONFLICT (domain, task_number) DO NOTHING
    RETURNING id INTO v_id;

    -- In case of a race condition (conflict), fetch it again
    IF v_id IS NULL THEN
      SELECT id INTO v_id
      FROM public.tasks
      WHERE domain = p_domain AND task_number = 0;
    END IF;
  END IF;

  RETURN v_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_linkedin_task(TEXT) TO authenticated;

-- Also seed LinkedIn tasks for all existing domains right now
-- (in case this migration runs on the live DB)
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_number_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_task_number_check CHECK (task_number BETWEEN 0 AND 5);

INSERT INTO public.tasks (domain, task_number, title, description)
SELECT DISTINCT domain, 0,
  'Share Your Offer Letter on LinkedIn',
  'Post your Skyrovix offer letter on LinkedIn to celebrate your internship and inspire others.'
FROM public.tasks
WHERE domain IS NOT NULL AND task_number > 0
ON CONFLICT (domain, task_number) DO NOTHING;

-- 20260622000002_create_payment_storage_buckets.sql
-- Create storage buckets for payment screenshots and profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their own payment screenshots
DROP POLICY IF EXISTS "Users upload own payment screenshots" ON storage.objects;
CREATE POLICY "Users upload own payment screenshots"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'payment-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users and admins to view payment screenshots
DROP POLICY IF EXISTS "Users view own payment screenshots" ON storage.objects;
CREATE POLICY "Users view own payment screenshots"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-screenshots'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Allow users to delete their own payment screenshots
DROP POLICY IF EXISTS "Users delete own payment screenshots" ON storage.objects;
CREATE POLICY "Users delete own payment screenshots"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admin can delete any payment screenshot
DROP POLICY IF EXISTS "Admin delete payment screenshots" ON storage.objects;
CREATE POLICY "Admin delete payment screenshots"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-screenshots' AND public.has_role(auth.uid(), 'admin'));

-- Allow users to upload their own profile photos
DROP POLICY IF EXISTS "Users upload own profile photos" ON storage.objects;
CREATE POLICY "Users upload own profile photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users and admins to view profile photos
DROP POLICY IF EXISTS "Users view own profile photos" ON storage.objects;
CREATE POLICY "Users view own profile photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Allow users to delete their own profile photos
DROP POLICY IF EXISTS "Users delete own profile photos" ON storage.objects;
CREATE POLICY "Users delete own profile photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 20260622000003_lms_enhancements.sql
-- Topic quiz questions (5 MCQs per topic)
CREATE TABLE IF NOT EXISTS public.topic_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.course_topics(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  explanation TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.topic_quiz_questions TO authenticated;
GRANT INSERT ON public.topic_quiz_questions TO authenticated;
ALTER TABLE public.topic_quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view topic quiz questions" ON public.topic_quiz_questions;
CREATE POLICY "Anyone can view topic quiz questions" ON public.topic_quiz_questions FOR SELECT USING (true);

-- Topic quiz attempts
CREATE TABLE IF NOT EXISTS public.topic_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.course_topics(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 5,
  passed BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, topic_id)
);
GRANT SELECT, INSERT, UPDATE ON public.topic_quiz_attempts TO authenticated;
ALTER TABLE public.topic_quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own topic quiz attempts" ON public.topic_quiz_attempts;
CREATE POLICY "Users manage own topic quiz attempts" ON public.topic_quiz_attempts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));

-- Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.course_topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);
GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own bookmarks" ON public.bookmarks;
CREATE POLICY "Users manage own bookmarks" ON public.bookmarks FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Notes
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.course_topics(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notes" ON public.notes;
CREATE POLICY "Users manage own notes" ON public.notes FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Achievement definitions
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Trophy',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievement_definitions TO authenticated;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View achievements" ON public.achievement_definitions;
CREATE POLICY "View achievements" ON public.achievement_definitions FOR SELECT USING (true);

-- User achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
GRANT SELECT, INSERT ON public.achievements TO authenticated;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own achievements" ON public.achievements;
CREATE POLICY "Users view own achievements" ON public.achievements FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users earn achievements" ON public.achievements;
CREATE POLICY "Users earn achievements" ON public.achievements FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Leaderboard (materialized from quiz_attempts)
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 100,
  quiz_attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT ON public.leaderboard TO authenticated;
GRANT INSERT, UPDATE ON public.leaderboard TO authenticated;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard;
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users insert own leaderboard" ON public.leaderboard;
CREATE POLICY "Users insert own leaderboard" ON public.leaderboard FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users update own leaderboard" ON public.leaderboard;
CREATE POLICY "Users update own leaderboard" ON public.leaderboard FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Seed default achievements
INSERT INTO public.achievement_definitions (key, title, description, icon) VALUES
  ('first_topic', 'First Steps', 'Complete your first topic', 'BookOpen'),
  ('halfway', 'Halfway There', 'Complete 50% of a course', 'TrendingUp'),
  ('course_complete', 'Course Champion', 'Complete an entire course', 'Trophy'),
  ('quiz_perfect', 'Perfect Score', 'Get 100% on the final quiz', 'Award'),
  ('quiz_first_try', 'First Try', 'Pass the final quiz on your first attempt', 'Zap'),
  ('speed_demon', 'Speed Demon', 'Finish a quiz in under 15 minutes', 'Clock'),
  ('bookmarker', 'Bookmarker', 'Bookmark 5 topics', 'Star'),
  ('note_taker', 'Note Taker', 'Write notes on 3 topics', 'FileText')
ON CONFLICT (key) DO NOTHING;

-- SEED COURSES
-- Seed 7 core courses
INSERT INTO public.courses (slug, name, short_description, icon, domain, difficulty, duration_weeks, total_topics, quiz_marks, pass_marks, quiz_duration_min) VALUES
('python', 'Python', 'Learn Python programming from basics to advanced', 'Code2', 'python', 'Beginner', 10, 0, 100, 60, 60),
('java', 'Java', 'Master Java development with OOP and data structures', 'Monitor', 'java', 'Intermediate', 10, 0, 100, 60, 60),
('html', 'HTML', 'Build web pages with HTML5 from scratch', 'Code2', 'html', 'Beginner', 6, 0, 100, 60, 60),
('css', 'CSS', 'Style beautiful responsive websites with CSS', 'Palette', 'css', 'Intermediate', 8, 0, 100, 60, 60),
('javascript', 'JavaScript', 'Learn JavaScript for dynamic web applications', 'Brain', 'javascript', 'Intermediate', 10, 0, 100, 60, 60),
('php', 'PHP', 'Build dynamic web applications with PHP', 'Server', 'php', 'Intermediate', 8, 0, 100, 60, 60),
('sql', 'SQL', 'Master database queries with SQL', 'Layers', 'sql', 'Intermediate', 6, 0, 100, 60, 60)
ON CONFLICT (slug) DO NOTHING;

-- SEED TOPICS
INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 0, $t$Python HOME$t$, $md$## Python HOME

Welcome to the Python HOME section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python home. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python home is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python home and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python HOME', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 1, $t$Python Intro$t$, $md$## Python Intro

Welcome to the Python Intro section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python intro. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python intro is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python intro and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Intro', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 2, $t$Python Get Started$t$, $md$## Python Get Started

Welcome to the Python Get Started section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python get started. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python get started is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python get started and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Get Started', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 3, $t$Python Syntax$t$, $md$## Python Syntax

Welcome to the Python Syntax section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python syntax. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python syntax is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python syntax and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Syntax', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 4, $t$Python Output$t$, $md$## Python Output

Welcome to the Python Output section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python output. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python output is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python output and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Output', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 5, $t$Python Comments$t$, $md$## Python Comments

Welcome to the Python Comments section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python comments. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python comments is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python comments and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Comments', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 6, $t$Python Variables$t$, $md$## Python Variables

Welcome to the Python Variables section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python variables. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python variables is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python variables and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Variables', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 7, $t$Python Data Types$t$, $md$## Python Data Types

Welcome to the Python Data Types section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python data types. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python data types is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python data types and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Data Types', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 8, $t$Python Numbers$t$, $md$## Python Numbers

Welcome to the Python Numbers section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python numbers. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python numbers is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python numbers and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Numbers', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 9, $t$Python Casting$t$, $md$## Python Casting

Welcome to the Python Casting section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python casting. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python casting is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python casting and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Casting', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 10, $t$Python Strings$t$, $md$## Python Strings

Welcome to the Python Strings section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python strings. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python strings is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python strings and be ready to apply these skills in your projects.$md$, $ce$text = "Hello, World!"
print(text.upper())
print(len(text))$ce$, ARRAY['Understand the fundamentals of Python Strings', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 11, $t$Python Booleans$t$, $md$## Python Booleans

Welcome to the Python Booleans section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python booleans. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python booleans is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python booleans and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Booleans', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 12, $t$Python Operators$t$, $md$## Python Operators

Welcome to the Python Operators section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python operators. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python operators is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python operators and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Operators', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 13, $t$Python Lists$t$, $md$## Python Lists

Welcome to the Python Lists section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python lists. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python lists is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python lists and be ready to apply these skills in your projects.$md$, $ce$fruits = ["apple", "banana", "cherry"]
for f in fruits:
    print(f)$ce$, ARRAY['Understand the fundamentals of Python Lists', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 14, $t$Python Tuples$t$, $md$## Python Tuples

Welcome to the Python Tuples section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python tuples. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python tuples is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python tuples and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Tuples', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 15, $t$Python Sets$t$, $md$## Python Sets

Welcome to the Python Sets section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python sets. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python sets is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python sets and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Sets', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 16, $t$Python Dictionaries$t$, $md$## Python Dictionaries

Welcome to the Python Dictionaries section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python dictionaries. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python dictionaries is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python dictionaries and be ready to apply these skills in your projects.$md$, $ce$person = {"name": "John", "age": 30}
print(person["name"])$ce$, ARRAY['Understand the fundamentals of Python Dictionaries', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 17, $t$Python If...Else$t$, $md$## Python If...Else

Welcome to the Python If...Else section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python if...else. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python if...else is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python if...else and be ready to apply these skills in your projects.$md$, $ce$x = 10
if x > 5:
    print("x is greater than 5")$ce$, ARRAY['Understand the fundamentals of Python If...Else', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 18, $t$Python Match$t$, $md$## Python Match

Welcome to the Python Match section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python match. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python match is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python match and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Match', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 19, $t$Python While Loops$t$, $md$## Python While Loops

Welcome to the Python While Loops section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python while loops. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python while loops is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python while loops and be ready to apply these skills in your projects.$md$, $ce$for i in range(5):
    print(i)$ce$, ARRAY['Understand the fundamentals of Python While Loops', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 20, $t$Python For Loops$t$, $md$## Python For Loops

Welcome to the Python For Loops section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python for loops. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python for loops is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python for loops and be ready to apply these skills in your projects.$md$, $ce$for i in range(5):
    print(i)$ce$, ARRAY['Understand the fundamentals of Python For Loops', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 21, $t$Python Functions$t$, $md$## Python Functions

Welcome to the Python Functions section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python functions. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python functions is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python functions and be ready to apply these skills in your projects.$md$, $ce$def greet(name):
    return f"Hello, {name}!"$ce$, ARRAY['Understand the fundamentals of Python Functions', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 22, $t$Python Range$t$, $md$## Python Range

Welcome to the Python Range section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python range. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python range is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python range and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Range', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 23, $t$Python Arrays$t$, $md$## Python Arrays

Welcome to the Python Arrays section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python arrays. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python arrays is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python arrays and be ready to apply these skills in your projects.$md$, $ce$fruits = ["apple", "banana", "cherry"]
for f in fruits:
    print(f)$ce$, ARRAY['Understand the fundamentals of Python Arrays', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 24, $t$Python Iterators$t$, $md$## Python Iterators

Welcome to the Python Iterators section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python iterators. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python iterators is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python iterators and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Iterators', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 25, $t$Python Modules$t$, $md$## Python Modules

Welcome to the Python Modules section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python modules. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python modules is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python modules and be ready to apply these skills in your projects.$md$, $ce$import math
print(math.sqrt(16))$ce$, ARRAY['Understand the fundamentals of Python Modules', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 26, $t$Python Dates$t$, $md$## Python Dates

Welcome to the Python Dates section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python dates. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python dates is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python dates and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Dates', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 27, $t$Python Math$t$, $md$## Python Math

Welcome to the Python Math section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python math. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python math is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python math and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Math', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 28, $t$Python JSON$t$, $md$## Python JSON

Welcome to the Python JSON section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python json. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python json is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python json and be ready to apply these skills in your projects.$md$, $ce$import json
data = ''{"name": "John"}''
obj = json.loads(data)
print(obj["name"])$ce$, ARRAY['Understand the fundamentals of Python JSON', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 29, $t$Python RegEx$t$, $md$## Python RegEx

Welcome to the Python RegEx section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python regex. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python regex is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python regex and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python RegEx', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 30, $t$Python PIP$t$, $md$## Python PIP

Welcome to the Python PIP section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python pip. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python pip is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python pip and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python PIP', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 31, $t$Python Try...Except$t$, $md$## Python Try...Except

Welcome to the Python Try...Except section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python try...except. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python try...except is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python try...except and be ready to apply these skills in your projects.$md$, $ce$try:
    x = 1 / 0
except ZeroDivisionError:
    print("Cannot divide by zero")$ce$, ARRAY['Understand the fundamentals of Python Try...Except', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 32, $t$Python String Formatting$t$, $md$## Python String Formatting

Welcome to the Python String Formatting section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python string formatting. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python string formatting is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python string formatting and be ready to apply these skills in your projects.$md$, $ce$for i in range(5):
    print(i)$ce$, ARRAY['Understand the fundamentals of Python String Formatting', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 33, $t$Python None$t$, $md$## Python None

Welcome to the Python None section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python none. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python none is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python none and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python None', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 34, $t$Python User Input$t$, $md$## Python User Input

Welcome to the Python User Input section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python user input. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python user input is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python user input and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python User Input', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 35, $t$Python VirtualEnv$t$, $md$## Python VirtualEnv

Welcome to the Python VirtualEnv section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python virtualenv. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python virtualenv is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python virtualenv and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python VirtualEnv', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 36, $t$Python Classes/Objects$t$, $md$## Python Classes/Objects

Welcome to the Python Classes/Objects section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python classes/objects. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python classes/objects is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python classes/objects and be ready to apply these skills in your projects.$md$, $ce$class Person:
    def __init__(self, name):
        self.name = name
    def greet(self):
        return f"Hi, I''m {self.name}"$ce$, ARRAY['Understand the fundamentals of Python Classes/Objects', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 37, $t$Python __init__ Method$t$, $md$## Python __init__ Method

Welcome to the Python __init__ Method section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python __init__ method. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python __init__ method is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python __init__ method and be ready to apply these skills in your projects.$md$, $ce$class Person:
    def __init__(self, name):
        self.name = name
    def greet(self):
        return f"Hi, I''m {self.name}"$ce$, ARRAY['Understand the fundamentals of Python __init__ Method', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 38, $t$Python self Parameter$t$, $md$## Python self Parameter

Welcome to the Python self Parameter section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python self parameter. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python self parameter is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python self parameter and be ready to apply these skills in your projects.$md$, $ce$class Person:
    def __init__(self, name):
        self.name = name
    def greet(self):
        return f"Hi, I''m {self.name}"$ce$, ARRAY['Understand the fundamentals of Python self Parameter', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 39, $t$Python Class Properties$t$, $md$## Python Class Properties

Welcome to the Python Class Properties section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python class properties. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python class properties is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python class properties and be ready to apply these skills in your projects.$md$, $ce$class Person:
    def __init__(self, name):
        self.name = name
    def greet(self):
        return f"Hi, I''m {self.name}"$ce$, ARRAY['Understand the fundamentals of Python Class Properties', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 40, $t$Python Class Methods$t$, $md$## Python Class Methods

Welcome to the Python Class Methods section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python class methods. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python class methods is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python class methods and be ready to apply these skills in your projects.$md$, $ce$class Person:
    def __init__(self, name):
        self.name = name
    def greet(self):
        return f"Hi, I''m {self.name}"$ce$, ARRAY['Understand the fundamentals of Python Class Methods', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 41, $t$Python Inheritance$t$, $md$## Python Inheritance

Welcome to the Python Inheritance section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python inheritance. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python inheritance is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python inheritance and be ready to apply these skills in your projects.$md$, $ce$class Animal:
    def sound(self): pass
class Dog(Animal):
    def sound(self): return "Bark"$ce$, ARRAY['Understand the fundamentals of Python Inheritance', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 42, $t$Python Polymorphism$t$, $md$## Python Polymorphism

Welcome to the Python Polymorphism section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python polymorphism. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python polymorphism is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python polymorphism and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Polymorphism', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 43, $t$Python Encapsulation$t$, $md$## Python Encapsulation

Welcome to the Python Encapsulation section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python encapsulation. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python encapsulation is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python encapsulation and be ready to apply these skills in your projects.$md$, $ce$print("Hello, World!")$ce$, ARRAY['Understand the fundamentals of Python Encapsulation', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 44, $t$Python Inner Classes$t$, $md$## Python Inner Classes

Welcome to the Python Inner Classes section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python inner classes. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python inner classes is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python inner classes and be ready to apply these skills in your projects.$md$, $ce$class Person:
    def __init__(self, name):
        self.name = name
    def greet(self):
        return f"Hi, I''m {self.name}"$ce$, ARRAY['Understand the fundamentals of Python Inner Classes', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 45, $t$Python File Handling$t$, $md$## Python File Handling

Welcome to the Python File Handling section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python file handling. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python file handling is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python file handling and be ready to apply these skills in your projects.$md$, $ce$with open("file.txt", "r") as f:
    content = f.read()
    print(content)$ce$, ARRAY['Understand the fundamentals of Python File Handling', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 46, $t$Python Read Files$t$, $md$## Python Read Files

Welcome to the Python Read Files section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python read files. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python read files is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python read files and be ready to apply these skills in your projects.$md$, $ce$with open("file.txt", "r") as f:
    content = f.read()
    print(content)$ce$, ARRAY['Understand the fundamentals of Python Read Files', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 47, $t$Python Write/Create Files$t$, $md$## Python Write/Create Files

Welcome to the Python Write/Create Files section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python write/create files. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python write/create files is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python write/create files and be ready to apply these skills in your projects.$md$, $ce$with open("file.txt", "r") as f:
    content = f.read()
    print(content)$ce$, ARRAY['Understand the fundamentals of Python Write/Create Files', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 48, $t$Python Delete Files$t$, $md$## Python Delete Files

Welcome to the Python Delete Files section of our Python course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind python delete files. Understanding these concepts is crucial for mastering Python development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how python delete files is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of python delete files and be ready to apply these skills in your projects.$md$, $ce$with open("file.txt", "r") as f:
    content = f.read()
    print(content)$ce$, ARRAY['Understand the fundamentals of Python Delete Files', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'python'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 0, $t$Java HOME$t$, $md$## Java HOME

Welcome to the Java HOME section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java home. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java home is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java home and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java HOME', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 1, $t$Java Intro$t$, $md$## Java Intro

Welcome to the Java Intro section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java intro. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java intro is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java intro and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Intro', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 2, $t$Java Get Started$t$, $md$## Java Get Started

Welcome to the Java Get Started section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java get started. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java get started is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java get started and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Get Started', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 3, $t$Java Syntax$t$, $md$## Java Syntax

Welcome to the Java Syntax section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java syntax. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java syntax is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java syntax and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Syntax', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 4, $t$Java Output$t$, $md$## Java Output

Welcome to the Java Output section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java output. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java output is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java output and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Output', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 5, $t$Java Comments$t$, $md$## Java Comments

Welcome to the Java Comments section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java comments. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java comments is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java comments and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Comments', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 6, $t$Java Variables$t$, $md$## Java Variables

Welcome to the Java Variables section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java variables. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java variables is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java variables and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Variables', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 7, $t$Java Data Types$t$, $md$## Java Data Types

Welcome to the Java Data Types section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java data types. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java data types is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java data types and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Data Types', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 8, $t$Java Type Casting$t$, $md$## Java Type Casting

Welcome to the Java Type Casting section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java type casting. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java type casting is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java type casting and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Type Casting', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 9, $t$Java Operators$t$, $md$## Java Operators

Welcome to the Java Operators section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java operators. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java operators is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java operators and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Operators', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 10, $t$Java Strings$t$, $md$## Java Strings

Welcome to the Java Strings section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java strings. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java strings is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java strings and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Strings', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 11, $t$Java Math$t$, $md$## Java Math

Welcome to the Java Math section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java math. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java math is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java math and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Math', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 12, $t$Java Booleans$t$, $md$## Java Booleans

Welcome to the Java Booleans section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java booleans. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java booleans is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java booleans and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Booleans', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 13, $t$Java If...Else$t$, $md$## Java If...Else

Welcome to the Java If...Else section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java if...else. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java if...else is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java if...else and be ready to apply these skills in your projects.$md$, $ce$int age = 18;
if (age >= 18) {
  System.out.println("Adult");
} else {
  System.out.println("Minor");
}$ce$, ARRAY['Understand the fundamentals of Java If...Else', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 14, $t$Java Switch$t$, $md$## Java Switch

Welcome to the Java Switch section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java switch. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java switch is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java switch and be ready to apply these skills in your projects.$md$, $ce$int age = 18;
if (age >= 18) {
  System.out.println("Adult");
} else {
  System.out.println("Minor");
}$ce$, ARRAY['Understand the fundamentals of Java Switch', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 15, $t$Java While Loop$t$, $md$## Java While Loop

Welcome to the Java While Loop section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java while loop. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java while loop is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java while loop and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java While Loop', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 16, $t$Java For Loop$t$, $md$## Java For Loop

Welcome to the Java For Loop section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java for loop. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java for loop is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java for loop and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java For Loop', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 17, $t$Java Break/Continue$t$, $md$## Java Break/Continue

Welcome to the Java Break/Continue section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java break/continue. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java break/continue is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java break/continue and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Break/Continue', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 18, $t$Java Arrays$t$, $md$## Java Arrays

Welcome to the Java Arrays section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java arrays. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java arrays is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java arrays and be ready to apply these skills in your projects.$md$, $ce$import java.util.ArrayList;
ArrayList<String> list = new ArrayList<>();
list.add("Hello");
System.out.println(list.get(0));$ce$, ARRAY['Understand the fundamentals of Java Arrays', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 19, $t$Java Methods$t$, $md$## Java Methods

Welcome to the Java Methods section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java methods. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java methods is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java methods and be ready to apply these skills in your projects.$md$, $ce$public static int add(int a, int b) {
  return a + b;
}$ce$, ARRAY['Understand the fundamentals of Java Methods', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 20, $t$Java Method Parameters$t$, $md$## Java Method Parameters

Welcome to the Java Method Parameters section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java method parameters. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java method parameters is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java method parameters and be ready to apply these skills in your projects.$md$, $ce$public static int add(int a, int b) {
  return a + b;
}$ce$, ARRAY['Understand the fundamentals of Java Method Parameters', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 21, $t$Java Method Overloading$t$, $md$## Java Method Overloading

Welcome to the Java Method Overloading section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java method overloading. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java method overloading is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java method overloading and be ready to apply these skills in your projects.$md$, $ce$public static int add(int a, int b) {
  return a + b;
}$ce$, ARRAY['Understand the fundamentals of Java Method Overloading', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 22, $t$Java Scope$t$, $md$## Java Scope

Welcome to the Java Scope section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java scope. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java scope is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java scope and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Scope', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 23, $t$Java Recursion$t$, $md$## Java Recursion

Welcome to the Java Recursion section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java recursion. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java recursion is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java recursion and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Recursion', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 24, $t$Java OOP$t$, $md$## Java OOP

Welcome to the Java OOP section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java oop. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java oop is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java oop and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java OOP', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 25, $t$Java Classes/Objects$t$, $md$## Java Classes/Objects

Welcome to the Java Classes/Objects section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java classes/objects. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java classes/objects is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java classes/objects and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Classes/Objects', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 26, $t$Java Class Attributes$t$, $md$## Java Class Attributes

Welcome to the Java Class Attributes section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java class attributes. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java class attributes is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java class attributes and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Class Attributes', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 27, $t$Java Class Methods$t$, $md$## Java Class Methods

Welcome to the Java Class Methods section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java class methods. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java class methods is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java class methods and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Class Methods', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 28, $t$Java Constructors$t$, $md$## Java Constructors

Welcome to the Java Constructors section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java constructors. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java constructors is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java constructors and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Constructors', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 29, $t$Java this Keyword$t$, $md$## Java this Keyword

Welcome to the Java this Keyword section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java this keyword. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java this keyword is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java this keyword and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java this Keyword', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 30, $t$Java Modifiers$t$, $md$## Java Modifiers

Welcome to the Java Modifiers section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java modifiers. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java modifiers is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java modifiers and be ready to apply these skills in your projects.$md$, $ce$int age = 18;
if (age >= 18) {
  System.out.println("Adult");
} else {
  System.out.println("Minor");
}$ce$, ARRAY['Understand the fundamentals of Java Modifiers', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 31, $t$Java Encapsulation$t$, $md$## Java Encapsulation

Welcome to the Java Encapsulation section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java encapsulation. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java encapsulation is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java encapsulation and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Encapsulation', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 32, $t$Java Packages$t$, $md$## Java Packages

Welcome to the Java Packages section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java packages. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java packages is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java packages and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Packages', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 33, $t$Java Inheritance$t$, $md$## Java Inheritance

Welcome to the Java Inheritance section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java inheritance. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java inheritance is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java inheritance and be ready to apply these skills in your projects.$md$, $ce$class Animal {
  void sound() { System.out.println("Some sound"); }
}
class Dog extends Animal {
  void sound() { System.out.println("Bark"); }
}$ce$, ARRAY['Understand the fundamentals of Java Inheritance', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 34, $t$Java Polymorphism$t$, $md$## Java Polymorphism

Welcome to the Java Polymorphism section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java polymorphism. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java polymorphism is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java polymorphism and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Polymorphism', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 35, $t$Java super Keyword$t$, $md$## Java super Keyword

Welcome to the Java super Keyword section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java super keyword. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java super keyword is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java super keyword and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java super Keyword', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 36, $t$Java Inner Classes$t$, $md$## Java Inner Classes

Welcome to the Java Inner Classes section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java inner classes. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java inner classes is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java inner classes and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Inner Classes', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 37, $t$Java Abstraction$t$, $md$## Java Abstraction

Welcome to the Java Abstraction section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java abstraction. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java abstraction is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java abstraction and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Abstraction', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 38, $t$Java Interface$t$, $md$## Java Interface

Welcome to the Java Interface section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java interface. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java interface is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java interface and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Interface', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 39, $t$Java Enum$t$, $md$## Java Enum

Welcome to the Java Enum section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java enum. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java enum is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java enum and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Enum', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 40, $t$Java User Input$t$, $md$## Java User Input

Welcome to the Java User Input section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java user input. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java user input is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java user input and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java User Input', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 41, $t$Java Date$t$, $md$## Java Date

Welcome to the Java Date section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java date. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java date is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java date and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Date', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 42, $t$Java Errors$t$, $md$## Java Errors

Welcome to the Java Errors section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java errors. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java errors is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java errors and be ready to apply these skills in your projects.$md$, $ce$try {
  int x = 1 / 0;
} catch (ArithmeticException e) {
  System.out.println("Cannot divide by zero");
}$ce$, ARRAY['Understand the fundamentals of Java Errors', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 43, $t$Java Exceptions$t$, $md$## Java Exceptions

Welcome to the Java Exceptions section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java exceptions. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java exceptions is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java exceptions and be ready to apply these skills in your projects.$md$, $ce$try {
  int x = 1 / 0;
} catch (ArithmeticException e) {
  System.out.println("Cannot divide by zero");
}$ce$, ARRAY['Understand the fundamentals of Java Exceptions', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 44, $t$Java Files$t$, $md$## Java Files

Welcome to the Java Files section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java files. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java files is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java files and be ready to apply these skills in your projects.$md$, $ce$import java.io.*;
BufferedReader br = new BufferedReader(new FileReader("file.txt"));
System.out.println(br.readLine());$ce$, ARRAY['Understand the fundamentals of Java Files', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 45, $t$Java Create Files$t$, $md$## Java Create Files

Welcome to the Java Create Files section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java create files. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java create files is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java create files and be ready to apply these skills in your projects.$md$, $ce$import java.io.*;
BufferedReader br = new BufferedReader(new FileReader("file.txt"));
System.out.println(br.readLine());$ce$, ARRAY['Understand the fundamentals of Java Create Files', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 46, $t$Java Write Files$t$, $md$## Java Write Files

Welcome to the Java Write Files section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java write files. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java write files is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java write files and be ready to apply these skills in your projects.$md$, $ce$import java.io.*;
BufferedReader br = new BufferedReader(new FileReader("file.txt"));
System.out.println(br.readLine());$ce$, ARRAY['Understand the fundamentals of Java Write Files', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 47, $t$Java Read Files$t$, $md$## Java Read Files

Welcome to the Java Read Files section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java read files. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java read files is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java read files and be ready to apply these skills in your projects.$md$, $ce$import java.io.*;
BufferedReader br = new BufferedReader(new FileReader("file.txt"));
System.out.println(br.readLine());$ce$, ARRAY['Understand the fundamentals of Java Read Files', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 48, $t$Java Delete Files$t$, $md$## Java Delete Files

Welcome to the Java Delete Files section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java delete files. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java delete files is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java delete files and be ready to apply these skills in your projects.$md$, $ce$import java.io.*;
BufferedReader br = new BufferedReader(new FileReader("file.txt"));
System.out.println(br.readLine());$ce$, ARRAY['Understand the fundamentals of Java Delete Files', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 49, $t$Java ArrayList$t$, $md$## Java ArrayList

Welcome to the Java ArrayList section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java arraylist. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java arraylist is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java arraylist and be ready to apply these skills in your projects.$md$, $ce$import java.util.ArrayList;
ArrayList<String> list = new ArrayList<>();
list.add("Hello");
System.out.println(list.get(0));$ce$, ARRAY['Understand the fundamentals of Java ArrayList', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 50, $t$Java LinkedList$t$, $md$## Java LinkedList

Welcome to the Java LinkedList section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java linkedlist. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java linkedlist is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java linkedlist and be ready to apply these skills in your projects.$md$, $ce$import java.util.ArrayList;
ArrayList<String> list = new ArrayList<>();
list.add("Hello");
System.out.println(list.get(0));$ce$, ARRAY['Understand the fundamentals of Java LinkedList', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 51, $t$Java HashMap$t$, $md$## Java HashMap

Welcome to the Java HashMap section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java hashmap. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java hashmap is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java hashmap and be ready to apply these skills in your projects.$md$, $ce$import java.util.HashMap;
HashMap<String, Integer> map = new HashMap<>();
map.put("age", 30);
System.out.println(map.get("age"));$ce$, ARRAY['Understand the fundamentals of Java HashMap', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 52, $t$Java HashSet$t$, $md$## Java HashSet

Welcome to the Java HashSet section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java hashset. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java hashset is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java hashset and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java HashSet', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 53, $t$Java Iterator$t$, $md$## Java Iterator

Welcome to the Java Iterator section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java iterator. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java iterator is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java iterator and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Iterator', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 54, $t$Java Wrapper Classes$t$, $md$## Java Wrapper Classes

Welcome to the Java Wrapper Classes section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java wrapper classes. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java wrapper classes is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java wrapper classes and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Wrapper Classes', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 55, $t$Java Generics$t$, $md$## Java Generics

Welcome to the Java Generics section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java generics. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java generics is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java generics and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Generics', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 56, $t$Java Threads$t$, $md$## Java Threads

Welcome to the Java Threads section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java threads. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java threads is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java threads and be ready to apply these skills in your projects.$md$, $ce$import java.io.*;
BufferedReader br = new BufferedReader(new FileReader("file.txt"));
System.out.println(br.readLine());$ce$, ARRAY['Understand the fundamentals of Java Threads', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 57, $t$Java Lambda$t$, $md$## Java Lambda

Welcome to the Java Lambda section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java lambda. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java lambda is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java lambda and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Lambda', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 58, $t$Java Advanced Sorting$t$, $md$## Java Advanced Sorting

Welcome to the Java Advanced Sorting section of our Java course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind java advanced sorting. Understanding these concepts is crucial for mastering Java development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how java advanced sorting is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of java advanced sorting and be ready to apply these skills in your projects.$md$, $ce$public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, World!");
  }
}$ce$, ARRAY['Understand the fundamentals of Java Advanced Sorting', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'java'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 0, $t$HTML HOME$t$, $md$## HTML HOME

Welcome to the HTML HOME section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html home. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html home is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html home and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML HOME', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 1, $t$HTML Introduction$t$, $md$## HTML Introduction

Welcome to the HTML Introduction section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html introduction. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html introduction is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html introduction and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Introduction', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 2, $t$HTML Editors$t$, $md$## HTML Editors

Welcome to the HTML Editors section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html editors. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html editors is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html editors and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Editors', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 3, $t$HTML Basic$t$, $md$## HTML Basic

Welcome to the HTML Basic section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html basic. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html basic is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html basic and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Basic', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 4, $t$HTML Elements$t$, $md$## HTML Elements

Welcome to the HTML Elements section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html elements. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html elements is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html elements and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Elements', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 5, $t$HTML Attributes$t$, $md$## HTML Attributes

Welcome to the HTML Attributes section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html attributes. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html attributes is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html attributes and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Attributes', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 6, $t$HTML Headings$t$, $md$## HTML Headings

Welcome to the HTML Headings section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html headings. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html headings is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html headings and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Headings', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 7, $t$HTML Paragraphs$t$, $md$## HTML Paragraphs

Welcome to the HTML Paragraphs section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html paragraphs. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html paragraphs is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html paragraphs and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Paragraphs', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 8, $t$HTML Styles$t$, $md$## HTML Styles

Welcome to the HTML Styles section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html styles. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html styles is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html styles and be ready to apply these skills in your projects.$md$, $ce$<p style="color: blue; font-size: 18px;">Styled text</p>$ce$, ARRAY['Understand the fundamentals of HTML Styles', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 9, $t$HTML Formatting$t$, $md$## HTML Formatting

Welcome to the HTML Formatting section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html formatting. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html formatting is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html formatting and be ready to apply these skills in your projects.$md$, $ce$<form action="/submit" method="POST">
  <input type="text" name="name" />
  <button>Submit</button>
</form>$ce$, ARRAY['Understand the fundamentals of HTML Formatting', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 10, $t$HTML Quotations$t$, $md$## HTML Quotations

Welcome to the HTML Quotations section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html quotations. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html quotations is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html quotations and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Quotations', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 11, $t$HTML Comments$t$, $md$## HTML Comments

Welcome to the HTML Comments section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html comments. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html comments is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html comments and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Comments', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 12, $t$HTML Colors$t$, $md$## HTML Colors

Welcome to the HTML Colors section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html colors. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html colors is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html colors and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Colors', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 13, $t$HTML CSS$t$, $md$## HTML CSS

Welcome to the HTML CSS section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html css. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html css is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html css and be ready to apply these skills in your projects.$md$, $ce$<p style="color: blue; font-size: 18px;">Styled text</p>$ce$, ARRAY['Understand the fundamentals of HTML CSS', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 14, $t$HTML Links$t$, $md$## HTML Links

Welcome to the HTML Links section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html links. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html links is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html links and be ready to apply these skills in your projects.$md$, $ce$<a href="https://example.com">Visit Example</a>$ce$, ARRAY['Understand the fundamentals of HTML Links', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 15, $t$HTML Images$t$, $md$## HTML Images

Welcome to the HTML Images section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html images. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html images is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html images and be ready to apply these skills in your projects.$md$, $ce$<img src="photo.jpg" alt="Description" width="300" />$ce$, ARRAY['Understand the fundamentals of HTML Images', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 16, $t$HTML Favicon$t$, $md$## HTML Favicon

Welcome to the HTML Favicon section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html favicon. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html favicon is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html favicon and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Favicon', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 17, $t$HTML Page Title$t$, $md$## HTML Page Title

Welcome to the HTML Page Title section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html page title. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html page title is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html page title and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Page Title', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 18, $t$HTML Tables$t$, $md$## HTML Tables

Welcome to the HTML Tables section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html tables. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html tables is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html tables and be ready to apply these skills in your projects.$md$, $ce$<table>
  <tr><th>Name</th><th>Age</th></tr>
  <tr><td>John</td><td>30</td></tr>
</table>$ce$, ARRAY['Understand the fundamentals of HTML Tables', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 19, $t$HTML Lists$t$, $md$## HTML Lists

Welcome to the HTML Lists section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html lists. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html lists is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html lists and be ready to apply these skills in your projects.$md$, $ce$<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>$ce$, ARRAY['Understand the fundamentals of HTML Lists', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 20, $t$HTML Block & Inline$t$, $md$## HTML Block & Inline

Welcome to the HTML Block & Inline section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html block & inline. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html block & inline is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html block & inline and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Block & Inline', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 21, $t$HTML Div$t$, $md$## HTML Div

Welcome to the HTML Div section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html div. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html div is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html div and be ready to apply these skills in your projects.$md$, $ce$<div class="container">
  <h1>Title</h1>
  <p>Content here</p>
</div>$ce$, ARRAY['Understand the fundamentals of HTML Div', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 22, $t$HTML Classes$t$, $md$## HTML Classes

Welcome to the HTML Classes section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html classes. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html classes is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html classes and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Classes', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 23, $t$HTML Id$t$, $md$## HTML Id

Welcome to the HTML Id section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html id. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html id is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html id and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Id', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 24, $t$HTML Iframes$t$, $md$## HTML Iframes

Welcome to the HTML Iframes section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html iframes. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html iframes is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html iframes and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Iframes', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 25, $t$HTML JavaScript$t$, $md$## HTML JavaScript

Welcome to the HTML JavaScript section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html javascript. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html javascript is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html javascript and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML JavaScript', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 26, $t$HTML File Paths$t$, $md$## HTML File Paths

Welcome to the HTML File Paths section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html file paths. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html file paths is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html file paths and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML File Paths', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 27, $t$HTML Head$t$, $md$## HTML Head

Welcome to the HTML Head section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html head. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html head is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html head and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Head', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 28, $t$HTML Layout$t$, $md$## HTML Layout

Welcome to the HTML Layout section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html layout. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html layout is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html layout and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Layout', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 29, $t$HTML Responsive$t$, $md$## HTML Responsive

Welcome to the HTML Responsive section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html responsive. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html responsive is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html responsive and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Responsive', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 30, $t$HTML Semantics$t$, $md$## HTML Semantics

Welcome to the HTML Semantics section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html semantics. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html semantics is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html semantics and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Semantics', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 31, $t$HTML Style Guide$t$, $md$## HTML Style Guide

Welcome to the HTML Style Guide section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html style guide. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html style guide is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html style guide and be ready to apply these skills in your projects.$md$, $ce$<p style="color: blue; font-size: 18px;">Styled text</p>$ce$, ARRAY['Understand the fundamentals of HTML Style Guide', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 32, $t$HTML Entities$t$, $md$## HTML Entities

Welcome to the HTML Entities section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html entities. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html entities is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html entities and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Entities', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 33, $t$HTML Symbols$t$, $md$## HTML Symbols

Welcome to the HTML Symbols section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html symbols. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html symbols is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html symbols and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Symbols', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 34, $t$HTML Emojis$t$, $md$## HTML Emojis

Welcome to the HTML Emojis section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html emojis. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html emojis is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html emojis and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Emojis', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 35, $t$HTML Charsets$t$, $md$## HTML Charsets

Welcome to the HTML Charsets section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html charsets. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html charsets is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html charsets and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Charsets', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 36, $t$HTML URL Encode$t$, $md$## HTML URL Encode

Welcome to the HTML URL Encode section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html url encode. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html url encode is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html url encode and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML URL Encode', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 37, $t$HTML Forms$t$, $md$## HTML Forms

Welcome to the HTML Forms section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html forms. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html forms is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html forms and be ready to apply these skills in your projects.$md$, $ce$<form action="/submit" method="POST">
  <input type="text" name="name" />
  <button>Submit</button>
</form>$ce$, ARRAY['Understand the fundamentals of HTML Forms', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 38, $t$HTML Form Attributes$t$, $md$## HTML Form Attributes

Welcome to the HTML Form Attributes section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html form attributes. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html form attributes is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html form attributes and be ready to apply these skills in your projects.$md$, $ce$<form action="/submit" method="POST">
  <input type="text" name="name" />
  <button>Submit</button>
</form>$ce$, ARRAY['Understand the fundamentals of HTML Form Attributes', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 39, $t$HTML Form Elements$t$, $md$## HTML Form Elements

Welcome to the HTML Form Elements section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html form elements. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html form elements is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html form elements and be ready to apply these skills in your projects.$md$, $ce$<form action="/submit" method="POST">
  <input type="text" name="name" />
  <button>Submit</button>
</form>$ce$, ARRAY['Understand the fundamentals of HTML Form Elements', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 40, $t$HTML Input Types$t$, $md$## HTML Input Types

Welcome to the HTML Input Types section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html input types. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html input types is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html input types and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Input Types', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 41, $t$HTML Input Attributes$t$, $md$## HTML Input Attributes

Welcome to the HTML Input Attributes section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html input attributes. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html input attributes is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html input attributes and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Input Attributes', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 42, $t$HTML Canvas$t$, $md$## HTML Canvas

Welcome to the HTML Canvas section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html canvas. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html canvas is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html canvas and be ready to apply these skills in your projects.$md$, $ce$<canvas id="myCanvas" width="200" height="100"></canvas>$ce$, ARRAY['Understand the fundamentals of HTML Canvas', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 43, $t$HTML SVG$t$, $md$## HTML SVG

Welcome to the HTML SVG section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html svg. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html svg is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html svg and be ready to apply these skills in your projects.$md$, $ce$<svg width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="red" />
</svg>$ce$, ARRAY['Understand the fundamentals of HTML SVG', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 44, $t$HTML Media$t$, $md$## HTML Media

Welcome to the HTML Media section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html media. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html media is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html media and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Media', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 45, $t$HTML Video$t$, $md$## HTML Video

Welcome to the HTML Video section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html video. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html video is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html video and be ready to apply these skills in your projects.$md$, $ce$<video width="320" controls>
  <source src="video.mp4" type="video/mp4" />
</video>$ce$, ARRAY['Understand the fundamentals of HTML Video', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 46, $t$HTML Audio$t$, $md$## HTML Audio

Welcome to the HTML Audio section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html audio. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html audio is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html audio and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Audio', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 47, $t$HTML YouTube$t$, $md$## HTML YouTube

Welcome to the HTML YouTube section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html youtube. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html youtube is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html youtube and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML YouTube', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 48, $t$HTML Web APIs$t$, $md$## HTML Web APIs

Welcome to the HTML Web APIs section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html web apis. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html web apis is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html web apis and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Web APIs', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 49, $t$HTML Geolocation$t$, $md$## HTML Geolocation

Welcome to the HTML Geolocation section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html geolocation. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html geolocation is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html geolocation and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Geolocation', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 50, $t$HTML Drag and Drop$t$, $md$## HTML Drag and Drop

Welcome to the HTML Drag and Drop section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html drag and drop. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html drag and drop is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html drag and drop and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Drag and Drop', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 51, $t$HTML Web Storage$t$, $md$## HTML Web Storage

Welcome to the HTML Web Storage section of our HTML course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind html web storage. Understanding these concepts is crucial for mastering HTML development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how html web storage is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of html web storage and be ready to apply these skills in your projects.$md$, $ce$<h1>Hello, World!</h1>
<p>Welcome to HTML.</p>$ce$, ARRAY['Understand the fundamentals of HTML Web Storage', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'html'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 0, $t$CSS HOME$t$, $md$## CSS HOME

Welcome to the CSS HOME section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css home. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css home is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css home and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS HOME', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 1, $t$CSS Introduction$t$, $md$## CSS Introduction

Welcome to the CSS Introduction section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css introduction. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css introduction is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css introduction and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Introduction', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 2, $t$CSS Syntax$t$, $md$## CSS Syntax

Welcome to the CSS Syntax section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css syntax. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css syntax is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css syntax and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Syntax', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 3, $t$CSS Selectors$t$, $md$## CSS Selectors

Welcome to the CSS Selectors section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css selectors. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css selectors is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css selectors and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Selectors', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 4, $t$CSS How To$t$, $md$## CSS How To

Welcome to the CSS How To section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css how to. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css how to is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css how to and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS How To', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 5, $t$CSS Comments$t$, $md$## CSS Comments

Welcome to the CSS Comments section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css comments. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css comments is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css comments and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Comments', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 6, $t$CSS Colors$t$, $md$## CSS Colors

Welcome to the CSS Colors section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css colors. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css colors is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css colors and be ready to apply these skills in your projects.$md$, $ce$body {
  background-color: #f0f0f0;
  color: #333;
}$ce$, ARRAY['Understand the fundamentals of CSS Colors', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 7, $t$CSS Backgrounds$t$, $md$## CSS Backgrounds

Welcome to the CSS Backgrounds section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css backgrounds. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css backgrounds is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css backgrounds and be ready to apply these skills in your projects.$md$, $ce$body {
  background-color: #f0f0f0;
  color: #333;
}$ce$, ARRAY['Understand the fundamentals of CSS Backgrounds', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 8, $t$CSS Borders$t$, $md$## CSS Borders

Welcome to the CSS Borders section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css borders. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css borders is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css borders and be ready to apply these skills in your projects.$md$, $ce$.box {
  border: 2px solid #333;
  border-radius: 8px;
}$ce$, ARRAY['Understand the fundamentals of CSS Borders', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 9, $t$CSS Margins$t$, $md$## CSS Margins

Welcome to the CSS Margins section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css margins. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css margins is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css margins and be ready to apply these skills in your projects.$md$, $ce$.box {
  margin: 10px;
  padding: 20px;
  border: 1px solid #ccc;
}$ce$, ARRAY['Understand the fundamentals of CSS Margins', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 10, $t$CSS Padding$t$, $md$## CSS Padding

Welcome to the CSS Padding section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css padding. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css padding is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css padding and be ready to apply these skills in your projects.$md$, $ce$.box {
  margin: 10px;
  padding: 20px;
  border: 1px solid #ccc;
}$ce$, ARRAY['Understand the fundamentals of CSS Padding', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 11, $t$CSS Height/Width$t$, $md$## CSS Height/Width

Welcome to the CSS Height/Width section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css height/width. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css height/width is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css height/width and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Height/Width', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 12, $t$CSS Box Model$t$, $md$## CSS Box Model

Welcome to the CSS Box Model section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css box model. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css box model is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css box model and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Box Model', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 13, $t$CSS Outline$t$, $md$## CSS Outline

Welcome to the CSS Outline section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css outline. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css outline is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css outline and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Outline', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 14, $t$CSS Text$t$, $md$## CSS Text

Welcome to the CSS Text section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css text. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css text is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css text and be ready to apply these skills in your projects.$md$, $ce$h1 {
  font-family: Arial, sans-serif;
  font-size: 24px;
  text-align: center;
}$ce$, ARRAY['Understand the fundamentals of CSS Text', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 15, $t$CSS Fonts$t$, $md$## CSS Fonts

Welcome to the CSS Fonts section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css fonts. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css fonts is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css fonts and be ready to apply these skills in your projects.$md$, $ce$h1 {
  font-family: Arial, sans-serif;
  font-size: 24px;
  text-align: center;
}$ce$, ARRAY['Understand the fundamentals of CSS Fonts', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 16, $t$CSS Icons$t$, $md$## CSS Icons

Welcome to the CSS Icons section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css icons. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css icons is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css icons and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Icons', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 17, $t$CSS Links$t$, $md$## CSS Links

Welcome to the CSS Links section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css links. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css links is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css links and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Links', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 18, $t$CSS Lists$t$, $md$## CSS Lists

Welcome to the CSS Lists section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css lists. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css lists is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css lists and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Lists', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 19, $t$CSS Tables$t$, $md$## CSS Tables

Welcome to the CSS Tables section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css tables. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css tables is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css tables and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Tables', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 20, $t$CSS Display$t$, $md$## CSS Display

Welcome to the CSS Display section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css display. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css display is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css display and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Display', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 21, $t$CSS Max-width$t$, $md$## CSS Max-width

Welcome to the CSS Max-width section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css max-width. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css max-width is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css max-width and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Max-width', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 22, $t$CSS Position$t$, $md$## CSS Position

Welcome to the CSS Position section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css position. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css position is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css position and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Position', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 23, $t$CSS Z-index$t$, $md$## CSS Z-index

Welcome to the CSS Z-index section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css z-index. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css z-index is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css z-index and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Z-index', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 24, $t$CSS Overflow$t$, $md$## CSS Overflow

Welcome to the CSS Overflow section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css overflow. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css overflow is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css overflow and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Overflow', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 25, $t$CSS Float$t$, $md$## CSS Float

Welcome to the CSS Float section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css float. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css float is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css float and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Float', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 26, $t$CSS Inline-block$t$, $md$## CSS Inline-block

Welcome to the CSS Inline-block section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css inline-block. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css inline-block is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css inline-block and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Inline-block', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 27, $t$CSS Align$t$, $md$## CSS Align

Welcome to the CSS Align section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css align. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css align is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css align and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Align', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 28, $t$CSS Combinators$t$, $md$## CSS Combinators

Welcome to the CSS Combinators section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css combinators. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css combinators is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css combinators and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Combinators', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 29, $t$CSS Pseudo-classes$t$, $md$## CSS Pseudo-classes

Welcome to the CSS Pseudo-classes section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css pseudo-classes. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css pseudo-classes is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css pseudo-classes and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Pseudo-classes', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 30, $t$CSS Pseudo-elements$t$, $md$## CSS Pseudo-elements

Welcome to the CSS Pseudo-elements section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css pseudo-elements. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css pseudo-elements is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css pseudo-elements and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Pseudo-elements', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 31, $t$CSS Opacity$t$, $md$## CSS Opacity

Welcome to the CSS Opacity section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css opacity. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css opacity is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css opacity and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Opacity', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 32, $t$CSS Navigation Bars$t$, $md$## CSS Navigation Bars

Welcome to the CSS Navigation Bars section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css navigation bars. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css navigation bars is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css navigation bars and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Navigation Bars', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 33, $t$CSS Dropdowns$t$, $md$## CSS Dropdowns

Welcome to the CSS Dropdowns section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css dropdowns. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css dropdowns is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css dropdowns and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Dropdowns', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 34, $t$CSS Image Gallery$t$, $md$## CSS Image Gallery

Welcome to the CSS Image Gallery section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css image gallery. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css image gallery is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css image gallery and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Image Gallery', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 35, $t$CSS Attribute Selectors$t$, $md$## CSS Attribute Selectors

Welcome to the CSS Attribute Selectors section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css attribute selectors. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css attribute selectors is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css attribute selectors and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Attribute Selectors', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 36, $t$CSS Forms$t$, $md$## CSS Forms

Welcome to the CSS Forms section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css forms. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css forms is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css forms and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Forms', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 37, $t$CSS Counters$t$, $md$## CSS Counters

Welcome to the CSS Counters section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css counters. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css counters is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css counters and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Counters', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 38, $t$CSS Units$t$, $md$## CSS Units

Welcome to the CSS Units section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css units. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css units is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css units and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Units', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 39, $t$CSS !important$t$, $md$## CSS !important

Welcome to the CSS !important section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css !important. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css !important is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css !important and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS !important', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 40, $t$CSS Gradients$t$, $md$## CSS Gradients

Welcome to the CSS Gradients section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css gradients. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css gradients is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css gradients and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Gradients', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 41, $t$CSS Shadows$t$, $md$## CSS Shadows

Welcome to the CSS Shadows section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css shadows. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css shadows is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css shadows and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Shadows', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 42, $t$CSS Text Effects$t$, $md$## CSS Text Effects

Welcome to the CSS Text Effects section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css text effects. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css text effects is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css text effects and be ready to apply these skills in your projects.$md$, $ce$h1 {
  font-family: Arial, sans-serif;
  font-size: 24px;
  text-align: center;
}$ce$, ARRAY['Understand the fundamentals of CSS Text Effects', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 43, $t$CSS 2D Transforms$t$, $md$## CSS 2D Transforms

Welcome to the CSS 2D Transforms section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css 2d transforms. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css 2d transforms is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css 2d transforms and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS 2D Transforms', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 44, $t$CSS 3D Transforms$t$, $md$## CSS 3D Transforms

Welcome to the CSS 3D Transforms section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css 3d transforms. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css 3d transforms is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css 3d transforms and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS 3D Transforms', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 45, $t$CSS Transitions$t$, $md$## CSS Transitions

Welcome to the CSS Transitions section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css transitions. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css transitions is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css transitions and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Transitions', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 46, $t$CSS Animations$t$, $md$## CSS Animations

Welcome to the CSS Animations section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css animations. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css animations is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css animations and be ready to apply these skills in your projects.$md$, $ce$@keyframes slide {
  from { transform: translateX(0); }
  to { transform: translateX(100px); }
}$ce$, ARRAY['Understand the fundamentals of CSS Animations', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 47, $t$CSS Tooltips$t$, $md$## CSS Tooltips

Welcome to the CSS Tooltips section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css tooltips. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css tooltips is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css tooltips and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Tooltips', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 48, $t$CSS Buttons$t$, $md$## CSS Buttons

Welcome to the CSS Buttons section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css buttons. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css buttons is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css buttons and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Buttons', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 49, $t$CSS Pagination$t$, $md$## CSS Pagination

Welcome to the CSS Pagination section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css pagination. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css pagination is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css pagination and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Pagination', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 50, $t$CSS Multiple Columns$t$, $md$## CSS Multiple Columns

Welcome to the CSS Multiple Columns section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css multiple columns. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css multiple columns is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css multiple columns and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Multiple Columns', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 51, $t$CSS Variables$t$, $md$## CSS Variables

Welcome to the CSS Variables section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css variables. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css variables is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css variables and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Variables', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 52, $t$CSS Box Sizing$t$, $md$## CSS Box Sizing

Welcome to the CSS Box Sizing section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css box sizing. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css box sizing is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css box sizing and be ready to apply these skills in your projects.$md$, $ce$h1 {
  color: blue;
  font-size: 24px;
}$ce$, ARRAY['Understand the fundamentals of CSS Box Sizing', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 53, $t$CSS Media Queries$t$, $md$## CSS Media Queries

Welcome to the CSS Media Queries section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css media queries. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css media queries is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css media queries and be ready to apply these skills in your projects.$md$, $ce$@media (max-width: 768px) {
  body { font-size: 14px; }
}$ce$, ARRAY['Understand the fundamentals of CSS Media Queries', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 54, $t$CSS Flexbox Intro$t$, $md$## CSS Flexbox Intro

Welcome to the CSS Flexbox Intro section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css flexbox intro. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css flexbox intro is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css flexbox intro and be ready to apply these skills in your projects.$md$, $ce$.container {
  display: flex;
  justify-content: center;
  align-items: center;
}$ce$, ARRAY['Understand the fundamentals of CSS Flexbox Intro', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 55, $t$CSS Flex Container$t$, $md$## CSS Flex Container

Welcome to the CSS Flex Container section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css flex container. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css flex container is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css flex container and be ready to apply these skills in your projects.$md$, $ce$.container {
  display: flex;
  justify-content: center;
  align-items: center;
}$ce$, ARRAY['Understand the fundamentals of CSS Flex Container', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 56, $t$CSS Flex Items$t$, $md$## CSS Flex Items

Welcome to the CSS Flex Items section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css flex items. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css flex items is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css flex items and be ready to apply these skills in your projects.$md$, $ce$.container {
  display: flex;
  justify-content: center;
  align-items: center;
}$ce$, ARRAY['Understand the fundamentals of CSS Flex Items', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 57, $t$CSS Flex Responsive$t$, $md$## CSS Flex Responsive

Welcome to the CSS Flex Responsive section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css flex responsive. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css flex responsive is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css flex responsive and be ready to apply these skills in your projects.$md$, $ce$.container {
  display: flex;
  justify-content: center;
  align-items: center;
}$ce$, ARRAY['Understand the fundamentals of CSS Flex Responsive', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 58, $t$CSS Grid Intro$t$, $md$## CSS Grid Intro

Welcome to the CSS Grid Intro section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css grid intro. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css grid intro is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css grid intro and be ready to apply these skills in your projects.$md$, $ce$.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}$ce$, ARRAY['Understand the fundamentals of CSS Grid Intro', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 59, $t$CSS Grid Container$t$, $md$## CSS Grid Container

Welcome to the CSS Grid Container section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css grid container. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css grid container is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css grid container and be ready to apply these skills in your projects.$md$, $ce$.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}$ce$, ARRAY['Understand the fundamentals of CSS Grid Container', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 60, $t$CSS Grid Items$t$, $md$## CSS Grid Items

Welcome to the CSS Grid Items section of our CSS course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind css grid items. Understanding these concepts is crucial for mastering CSS development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how css grid items is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of css grid items and be ready to apply these skills in your projects.$md$, $ce$.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}$ce$, ARRAY['Understand the fundamentals of CSS Grid Items', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'css'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 0, $t$JS HOME$t$, $md$## JS HOME

Welcome to the JS HOME section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js home. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js home is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js home and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS HOME', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 1, $t$JS Introduction$t$, $md$## JS Introduction

Welcome to the JS Introduction section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js introduction. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js introduction is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js introduction and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Introduction', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 2, $t$JS Where To$t$, $md$## JS Where To

Welcome to the JS Where To section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js where to. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js where to is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js where to and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Where To', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 3, $t$JS Output$t$, $md$## JS Output

Welcome to the JS Output section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js output. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js output is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js output and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Output', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 4, $t$JS Syntax$t$, $md$## JS Syntax

Welcome to the JS Syntax section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js syntax. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js syntax is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js syntax and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Syntax', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 5, $t$JS Operators$t$, $md$## JS Operators

Welcome to the JS Operators section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js operators. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js operators is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js operators and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Operators', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 6, $t$JS If Conditions$t$, $md$## JS If Conditions

Welcome to the JS If Conditions section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js if conditions. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js if conditions is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js if conditions and be ready to apply these skills in your projects.$md$, $ce$const age = 18;
if (age >= 18) {
  console.log("Adult");
} else {
  console.log("Minor");
}$ce$, ARRAY['Understand the fundamentals of JS If Conditions', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 7, $t$JS Loops$t$, $md$## JS Loops

Welcome to the JS Loops section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js loops. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js loops is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js loops and be ready to apply these skills in your projects.$md$, $ce$for (let i = 0; i < 5; i++) {
  console.log(i);
}$ce$, ARRAY['Understand the fundamentals of JS Loops', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 8, $t$JS Strings$t$, $md$## JS Strings

Welcome to the JS Strings section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js strings. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js strings is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js strings and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Strings', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 9, $t$JS Numbers$t$, $md$## JS Numbers

Welcome to the JS Numbers section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js numbers. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js numbers is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js numbers and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Numbers', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 10, $t$JS Functions$t$, $md$## JS Functions

Welcome to the JS Functions section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js functions. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js functions is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js functions and be ready to apply these skills in your projects.$md$, $ce$function greet(name) {
  return `Hello, ${name}!`;
}$ce$, ARRAY['Understand the fundamentals of JS Functions', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 11, $t$JS Objects$t$, $md$## JS Objects

Welcome to the JS Objects section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js objects. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js objects is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js objects and be ready to apply these skills in your projects.$md$, $ce$const person = {
  name: "John",
  age: 30,
  greet() { return this.name; }
};$ce$, ARRAY['Understand the fundamentals of JS Objects', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 12, $t$JS Scope$t$, $md$## JS Scope

Welcome to the JS Scope section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js scope. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js scope is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js scope and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Scope', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 13, $t$JS Dates$t$, $md$## JS Dates

Welcome to the JS Dates section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js dates. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js dates is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js dates and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Dates', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 14, $t$JS Arrays$t$, $md$## JS Arrays

Welcome to the JS Arrays section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js arrays. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js arrays is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js arrays and be ready to apply these skills in your projects.$md$, $ce$const arr = [1, 2, 3, 4, 5];
arr.forEach(n => console.log(n));$ce$, ARRAY['Understand the fundamentals of JS Arrays', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 15, $t$JS Sets$t$, $md$## JS Sets

Welcome to the JS Sets section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js sets. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js sets is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js sets and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Sets', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 16, $t$JS Maps$t$, $md$## JS Maps

Welcome to the JS Maps section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js maps. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js maps is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js maps and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Maps', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 17, $t$JS Math$t$, $md$## JS Math

Welcome to the JS Math section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js math. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js math is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js math and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Math', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 18, $t$JS RegExp$t$, $md$## JS RegExp

Welcome to the JS RegExp section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js regexp. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js regexp is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js regexp and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS RegExp', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 19, $t$JS Data Types$t$, $md$## JS Data Types

Welcome to the JS Data Types section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js data types. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js data types is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js data types and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Data Types', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 20, $t$JS Errors$t$, $md$## JS Errors

Welcome to the JS Errors section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js errors. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js errors is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js errors and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Errors', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 21, $t$JS Debugging$t$, $md$## JS Debugging

Welcome to the JS Debugging section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js debugging. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js debugging is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js debugging and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Debugging', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 22, $t$JS HTML DOM$t$, $md$## JS HTML DOM

Welcome to the JS HTML DOM section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js html dom. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js html dom is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js html dom and be ready to apply these skills in your projects.$md$, $ce$document.getElementById("demo").innerHTML = "Hello!";$ce$, ARRAY['Understand the fundamentals of JS HTML DOM', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 23, $t$JS HTML Events$t$, $md$## JS HTML Events

Welcome to the JS HTML Events section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js html events. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js html events is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js html events and be ready to apply these skills in your projects.$md$, $ce$button.addEventListener("click", () => {
  alert("Clicked!");
});$ce$, ARRAY['Understand the fundamentals of JS HTML Events', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 24, $t$JS Functions Advanced$t$, $md$## JS Functions Advanced

Welcome to the JS Functions Advanced section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js functions advanced. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js functions advanced is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js functions advanced and be ready to apply these skills in your projects.$md$, $ce$function greet(name) {
  return `Hello, ${name}!`;
}$ce$, ARRAY['Understand the fundamentals of JS Functions Advanced', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 25, $t$JS Objects Advanced$t$, $md$## JS Objects Advanced

Welcome to the JS Objects Advanced section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js objects advanced. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js objects advanced is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js objects advanced and be ready to apply these skills in your projects.$md$, $ce$const person = {
  name: "John",
  age: 30,
  greet() { return this.name; }
};$ce$, ARRAY['Understand the fundamentals of JS Objects Advanced', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 26, $t$JS Classes$t$, $md$## JS Classes

Welcome to the JS Classes section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js classes. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js classes is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js classes and be ready to apply these skills in your projects.$md$, $ce$class Car {
  constructor(brand) {
    this.brand = brand;
  }
  drive() { return `${this.brand} is driving`; }
}$ce$, ARRAY['Understand the fundamentals of JS Classes', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 27, $t$JS Asynchronous$t$, $md$## JS Asynchronous

Welcome to the JS Asynchronous section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js asynchronous. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js asynchronous is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js asynchronous and be ready to apply these skills in your projects.$md$, $ce$async function fetchData() {
  const res = await fetch(''/api/data'');
  return res.json();
}$ce$, ARRAY['Understand the fundamentals of JS Asynchronous', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 28, $t$JS Modules$t$, $md$## JS Modules

Welcome to the JS Modules section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js modules. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js modules is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js modules and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS Modules', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 29, $t$JS AJAX$t$, $md$## JS AJAX

Welcome to the JS AJAX section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js ajax. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js ajax is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js ajax and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS AJAX', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 30, $t$JS JSON$t$, $md$## JS JSON

Welcome to the JS JSON section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js json. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js json is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js json and be ready to apply these skills in your projects.$md$, $ce$const json = ''{"name":"John"}'';
const obj = JSON.parse(json);$ce$, ARRAY['Understand the fundamentals of JS JSON', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 31, $t$JS jQuery$t$, $md$## JS jQuery

Welcome to the JS jQuery section of our JavaScript course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind js jquery. Understanding these concepts is crucial for mastering JavaScript development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how js jquery is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of js jquery and be ready to apply these skills in your projects.$md$, $ce$console.log("Hello, World!");$ce$, ARRAY['Understand the fundamentals of JS jQuery', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'javascript'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 0, $t$PHP HOME$t$, $md$## PHP HOME

Welcome to the PHP HOME section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php home. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php home is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php home and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP HOME', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 1, $t$PHP Intro$t$, $md$## PHP Intro

Welcome to the PHP Intro section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php intro. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php intro is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php intro and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Intro', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 2, $t$PHP Install$t$, $md$## PHP Install

Welcome to the PHP Install section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php install. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php install is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php install and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Install', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 3, $t$PHP Syntax$t$, $md$## PHP Syntax

Welcome to the PHP Syntax section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php syntax. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php syntax is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php syntax and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Syntax', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 4, $t$PHP Comments$t$, $md$## PHP Comments

Welcome to the PHP Comments section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php comments. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php comments is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php comments and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Comments', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 5, $t$PHP Variables$t$, $md$## PHP Variables

Welcome to the PHP Variables section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php variables. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php variables is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php variables and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Variables', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 6, $t$PHP Echo/Print$t$, $md$## PHP Echo/Print

Welcome to the PHP Echo/Print section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php echo/print. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php echo/print is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php echo/print and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Echo/Print', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 7, $t$PHP Data Types$t$, $md$## PHP Data Types

Welcome to the PHP Data Types section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php data types. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php data types is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php data types and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Data Types', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 8, $t$PHP Strings$t$, $md$## PHP Strings

Welcome to the PHP Strings section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php strings. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php strings is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php strings and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Strings', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 9, $t$PHP Numbers$t$, $md$## PHP Numbers

Welcome to the PHP Numbers section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php numbers. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php numbers is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php numbers and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Numbers', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 10, $t$PHP Casting$t$, $md$## PHP Casting

Welcome to the PHP Casting section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php casting. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php casting is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php casting and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Casting', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 11, $t$PHP Math$t$, $md$## PHP Math

Welcome to the PHP Math section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php math. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php math is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php math and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Math', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 12, $t$PHP Constants$t$, $md$## PHP Constants

Welcome to the PHP Constants section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php constants. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php constants is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php constants and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Constants', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 13, $t$PHP Operators$t$, $md$## PHP Operators

Welcome to the PHP Operators section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php operators. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php operators is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php operators and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Operators', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 14, $t$PHP If...Else$t$, $md$## PHP If...Else

Welcome to the PHP If...Else section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php if...else. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php if...else is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php if...else and be ready to apply these skills in your projects.$md$, $ce$<?php
$age = 18;
if ($age >= 18) {
    echo "Adult";
}
?>$ce$, ARRAY['Understand the fundamentals of PHP If...Else', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 15, $t$PHP Switch$t$, $md$## PHP Switch

Welcome to the PHP Switch section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php switch. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php switch is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php switch and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Switch', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 16, $t$PHP Loops$t$, $md$## PHP Loops

Welcome to the PHP Loops section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php loops. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php loops is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php loops and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Loops', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 17, $t$PHP Functions$t$, $md$## PHP Functions

Welcome to the PHP Functions section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php functions. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php functions is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php functions and be ready to apply these skills in your projects.$md$, $ce$<?php
function greet($name) {
    return "Hello, $name!";
}
echo greet("John");
?>$ce$, ARRAY['Understand the fundamentals of PHP Functions', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 18, $t$PHP Arrays$t$, $md$## PHP Arrays

Welcome to the PHP Arrays section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php arrays. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php arrays is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php arrays and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Arrays', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 19, $t$PHP Superglobals$t$, $md$## PHP Superglobals

Welcome to the PHP Superglobals section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php superglobals. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php superglobals is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php superglobals and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Superglobals', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 20, $t$PHP RegEx$t$, $md$## PHP RegEx

Welcome to the PHP RegEx section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php regex. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php regex is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php regex and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP RegEx', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 21, $t$PHP Form Handling$t$, $md$## PHP Form Handling

Welcome to the PHP Form Handling section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php form handling. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php form handling is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php form handling and be ready to apply these skills in your projects.$md$, $ce$<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST["name"];
    echo "Hello, $name!";
}
?>$ce$, ARRAY['Understand the fundamentals of PHP Form Handling', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 22, $t$PHP Form Validation$t$, $md$## PHP Form Validation

Welcome to the PHP Form Validation section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php form validation. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php form validation is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php form validation and be ready to apply these skills in your projects.$md$, $ce$<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST["name"];
    echo "Hello, $name!";
}
?>$ce$, ARRAY['Understand the fundamentals of PHP Form Validation', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 23, $t$PHP Date/Time$t$, $md$## PHP Date/Time

Welcome to the PHP Date/Time section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php date/time. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php date/time is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php date/time and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Date/Time', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 24, $t$PHP Include$t$, $md$## PHP Include

Welcome to the PHP Include section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php include. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php include is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php include and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Include', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 25, $t$PHP File Handling$t$, $md$## PHP File Handling

Welcome to the PHP File Handling section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php file handling. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php file handling is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php file handling and be ready to apply these skills in your projects.$md$, $ce$<?php
$content = file_get_contents("file.txt");
echo $content;
?>$ce$, ARRAY['Understand the fundamentals of PHP File Handling', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 26, $t$PHP File Open/Read$t$, $md$## PHP File Open/Read

Welcome to the PHP File Open/Read section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php file open/read. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php file open/read is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php file open/read and be ready to apply these skills in your projects.$md$, $ce$<?php
$content = file_get_contents("file.txt");
echo $content;
?>$ce$, ARRAY['Understand the fundamentals of PHP File Open/Read', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 27, $t$PHP File Create/Write$t$, $md$## PHP File Create/Write

Welcome to the PHP File Create/Write section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php file create/write. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php file create/write is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php file create/write and be ready to apply these skills in your projects.$md$, $ce$<?php
$content = file_get_contents("file.txt");
echo $content;
?>$ce$, ARRAY['Understand the fundamentals of PHP File Create/Write', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 28, $t$PHP File Upload$t$, $md$## PHP File Upload

Welcome to the PHP File Upload section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php file upload. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php file upload is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php file upload and be ready to apply these skills in your projects.$md$, $ce$<?php
$content = file_get_contents("file.txt");
echo $content;
?>$ce$, ARRAY['Understand the fundamentals of PHP File Upload', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 29, $t$PHP Cookies$t$, $md$## PHP Cookies

Welcome to the PHP Cookies section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php cookies. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php cookies is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php cookies and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Cookies', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 30, $t$PHP Sessions$t$, $md$## PHP Sessions

Welcome to the PHP Sessions section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php sessions. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php sessions is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php sessions and be ready to apply these skills in your projects.$md$, $ce$<?php
session_start();
$_SESSION["user"] = "John";
?>$ce$, ARRAY['Understand the fundamentals of PHP Sessions', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 31, $t$PHP Filters$t$, $md$## PHP Filters

Welcome to the PHP Filters section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php filters. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php filters is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php filters and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Filters', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 32, $t$PHP JSON$t$, $md$## PHP JSON

Welcome to the PHP JSON section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php json. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php json is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php json and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP JSON', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 33, $t$PHP Exceptions$t$, $md$## PHP Exceptions

Welcome to the PHP Exceptions section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php exceptions. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php exceptions is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php exceptions and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Exceptions', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 34, $t$PHP Classes/Objects$t$, $md$## PHP Classes/Objects

Welcome to the PHP Classes/Objects section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php classes/objects. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php classes/objects is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php classes/objects and be ready to apply these skills in your projects.$md$, $ce$<?php
class Car {
  public $brand;
  function __construct($brand) {
    $this->brand = $brand;
  }
}
?>$ce$, ARRAY['Understand the fundamentals of PHP Classes/Objects', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 35, $t$PHP Constructor$t$, $md$## PHP Constructor

Welcome to the PHP Constructor section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php constructor. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php constructor is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php constructor and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Constructor', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 36, $t$PHP Destructor$t$, $md$## PHP Destructor

Welcome to the PHP Destructor section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php destructor. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php destructor is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php destructor and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Destructor', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 37, $t$PHP Inheritance$t$, $md$## PHP Inheritance

Welcome to the PHP Inheritance section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php inheritance. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php inheritance is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php inheritance and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Inheritance', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 38, $t$PHP Interfaces$t$, $md$## PHP Interfaces

Welcome to the PHP Interfaces section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php interfaces. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php interfaces is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php interfaces and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Interfaces', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 39, $t$PHP Traits$t$, $md$## PHP Traits

Welcome to the PHP Traits section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php traits. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php traits is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php traits and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP Traits', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 40, $t$PHP MySQL Database$t$, $md$## PHP MySQL Database

Welcome to the PHP MySQL Database section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php mysql database. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php mysql database is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php mysql database and be ready to apply these skills in your projects.$md$, $ce$<?php
$conn = new mysqli($servername, $username, $password, $dbname);
$result = $conn->query("SELECT * FROM users");
?>$ce$, ARRAY['Understand the fundamentals of PHP MySQL Database', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 41, $t$PHP MySQL Connect$t$, $md$## PHP MySQL Connect

Welcome to the PHP MySQL Connect section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php mysql connect. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php mysql connect is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php mysql connect and be ready to apply these skills in your projects.$md$, $ce$<?php
$conn = new mysqli($servername, $username, $password, $dbname);
$result = $conn->query("SELECT * FROM users");
?>$ce$, ARRAY['Understand the fundamentals of PHP MySQL Connect', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 42, $t$PHP MySQL Select$t$, $md$## PHP MySQL Select

Welcome to the PHP MySQL Select section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php mysql select. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php mysql select is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php mysql select and be ready to apply these skills in your projects.$md$, $ce$<?php
$conn = new mysqli($servername, $username, $password, $dbname);
$result = $conn->query("SELECT * FROM users");
?>$ce$, ARRAY['Understand the fundamentals of PHP MySQL Select', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 43, $t$PHP MySQL Insert$t$, $md$## PHP MySQL Insert

Welcome to the PHP MySQL Insert section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php mysql insert. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php mysql insert is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php mysql insert and be ready to apply these skills in your projects.$md$, $ce$<?php
$conn = new mysqli($servername, $username, $password, $dbname);
$result = $conn->query("SELECT * FROM users");
?>$ce$, ARRAY['Understand the fundamentals of PHP MySQL Insert', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 44, $t$PHP XML$t$, $md$## PHP XML

Welcome to the PHP XML section of our PHP course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind php xml. Understanding these concepts is crucial for mastering PHP development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how php xml is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of php xml and be ready to apply these skills in your projects.$md$, $ce$<?php
echo "Hello, World!";
?>$ce$, ARRAY['Understand the fundamentals of PHP XML', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'php'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 0, $t$SQL HOME$t$, $md$## SQL HOME

Welcome to the SQL HOME section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql home. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql home is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql home and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users;$ce$, ARRAY['Understand the fundamentals of SQL HOME', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 1, $t$SQL Intro$t$, $md$## SQL Intro

Welcome to the SQL Intro section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql intro. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql intro is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql intro and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users;$ce$, ARRAY['Understand the fundamentals of SQL Intro', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 2, $t$SQL Syntax$t$, $md$## SQL Syntax

Welcome to the SQL Syntax section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql syntax. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql syntax is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql syntax and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users;$ce$, ARRAY['Understand the fundamentals of SQL Syntax', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 3, $t$SQL Select$t$, $md$## SQL Select

Welcome to the SQL Select section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql select. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql select is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql select and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users;$ce$, ARRAY['Understand the fundamentals of SQL Select', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 4, $t$SQL Where$t$, $md$## SQL Where

Welcome to the SQL Where section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql where. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql where is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql where and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users WHERE age > 18;$ce$, ARRAY['Understand the fundamentals of SQL Where', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 5, $t$SQL And/Or/Not$t$, $md$## SQL And/Or/Not

Welcome to the SQL And/Or/Not section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql and/or/not. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql and/or/not is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql and/or/not and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users;$ce$, ARRAY['Understand the fundamentals of SQL And/Or/Not', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 6, $t$SQL Order By$t$, $md$## SQL Order By

Welcome to the SQL Order By section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql order by. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql order by is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql order by and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM products ORDER BY price DESC;$ce$, ARRAY['Understand the fundamentals of SQL Order By', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 7, $t$SQL Insert$t$, $md$## SQL Insert

Welcome to the SQL Insert section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql insert. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql insert is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql insert and be ready to apply these skills in your projects.', 'INSERT INTO users (name, email) VALUES (''John$md$, $ce$john@example.com'');$ce$, ARRAY['Understand the fundamentals of SQL Insert', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 8, $t$SQL Null Values$t$, $md$## SQL Null Values

Welcome to the SQL Null Values section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql null values. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql null values is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql null values and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users;$ce$, ARRAY['Understand the fundamentals of SQL Null Values', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 9, $t$SQL Update$t$, $md$## SQL Update

Welcome to the SQL Update section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql update. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql update is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql update and be ready to apply these skills in your projects.$md$, $ce$UPDATE users SET name = ''Jane'' WHERE id = 1;$ce$, ARRAY['Understand the fundamentals of SQL Update', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 10, $t$SQL Delete$t$, $md$## SQL Delete

Welcome to the SQL Delete section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql delete. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql delete is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql delete and be ready to apply these skills in your projects.$md$, $ce$DELETE FROM users WHERE id = 1;$ce$, ARRAY['Understand the fundamentals of SQL Delete', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 11, $t$SQL Limit$t$, $md$## SQL Limit

Welcome to the SQL Limit section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql limit. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql limit is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql limit and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users LIMIT 10;$ce$, ARRAY['Understand the fundamentals of SQL Limit', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 12, $t$SQL Min/Max$t$, $md$## SQL Min/Max

Welcome to the SQL Min/Max section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql min/max. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql min/max is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql min/max and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users;$ce$, ARRAY['Understand the fundamentals of SQL Min/Max', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 13, $t$SQL Count/Avg/Sum$t$, $md$## SQL Count/Avg/Sum

Welcome to the SQL Count/Avg/Sum section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql count/avg/sum. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql count/avg/sum is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql count/avg/sum and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users;$ce$, ARRAY['Understand the fundamentals of SQL Count/Avg/Sum', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 14, $t$SQL Like$t$, $md$## SQL Like

Welcome to the SQL Like section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql like. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql like is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql like and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users WHERE name LIKE ''J%'';$ce$, ARRAY['Understand the fundamentals of SQL Like', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 15, $t$SQL Wildcards$t$, $md$## SQL Wildcards

Welcome to the SQL Wildcards section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql wildcards. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql wildcards is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql wildcards and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users;$ce$, ARRAY['Understand the fundamentals of SQL Wildcards', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 16, $t$SQL In$t$, $md$## SQL In

Welcome to the SQL In section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql in. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql in is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql in and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users;$ce$, ARRAY['Understand the fundamentals of SQL In', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 17, $t$SQL Between$t$, $md$## SQL Between

Welcome to the SQL Between section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql between. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql between is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql between and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users;$ce$, ARRAY['Understand the fundamentals of SQL Between', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 18, $t$SQL Aliases$t$, $md$## SQL Aliases

Welcome to the SQL Aliases section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql aliases. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql aliases is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql aliases and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users;$ce$, ARRAY['Understand the fundamentals of SQL Aliases', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 19, $t$SQL Joins$t$, $md$## SQL Joins

Welcome to the SQL Joins section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql joins. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql joins is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql joins and be ready to apply these skills in your projects.$md$, $ce$SELECT users.name, orders.total
FROM users
INNER JOIN orders ON users.id = orders.user_id;$ce$, ARRAY['Understand the fundamentals of SQL Joins', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 20, $t$SQL Inner Join$t$, $md$## SQL Inner Join

Welcome to the SQL Inner Join section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql inner join. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql inner join is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql inner join and be ready to apply these skills in your projects.$md$, $ce$SELECT users.name, orders.total
FROM users
INNER JOIN orders ON users.id = orders.user_id;$ce$, ARRAY['Understand the fundamentals of SQL Inner Join', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 21, $t$SQL Left Join$t$, $md$## SQL Left Join

Welcome to the SQL Left Join section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql left join. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql left join is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql left join and be ready to apply these skills in your projects.$md$, $ce$SELECT users.name, orders.total
FROM users
INNER JOIN orders ON users.id = orders.user_id;$ce$, ARRAY['Understand the fundamentals of SQL Left Join', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 22, $t$SQL Right Join$t$, $md$## SQL Right Join

Welcome to the SQL Right Join section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql right join. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql right join is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql right join and be ready to apply these skills in your projects.$md$, $ce$SELECT users.name, orders.total
FROM users
INNER JOIN orders ON users.id = orders.user_id;$ce$, ARRAY['Understand the fundamentals of SQL Right Join', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 23, $t$SQL Group By$t$, $md$## SQL Group By

Welcome to the SQL Group By section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql group by. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql group by is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql group by and be ready to apply these skills in your projects.$md$, $ce$SELECT department, COUNT(*) as count
FROM employees
GROUP BY department;$ce$, ARRAY['Understand the fundamentals of SQL Group By', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, 24, $t$SQL Having$t$, $md$## SQL Having

Welcome to the SQL Having section of our SQL course. This topic covers essential concepts and practical applications that will help you build a strong foundation.

In this lesson, you will explore the core principles behind sql having. Understanding these concepts is crucial for mastering SQL development and creating efficient, maintainable code.

We''ll walk through detailed examples and best practices that demonstrate how sql having is used in real-world scenarios. Practice the code examples and experiment with modifications to deepen your understanding.

By the end of this topic, you''ll have practical knowledge of sql having and be ready to apply these skills in your projects.$md$, $ce$SELECT * FROM users;$ce$, ARRAY['Understand the fundamentals of SQL Having', 'Learn practical implementation patterns', 'Explore real-world use cases and examples', 'Master best practices and common pitfalls', 'Build confidence through hands-on practice']
FROM public.courses WHERE slug = 'sql'
ON CONFLICT (course_id, order_index) DO NOTHING;

-- ADD AUTH TRIGGER
DO $do$ BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN OTHERS THEN NULL;
END $do$;
UPDATE public.courses SET total_topics = (SELECT COUNT(*) FROM public.course_topics WHERE course_id = (SELECT id FROM public.courses WHERE slug = 'python')) WHERE slug = 'python';
UPDATE public.courses SET total_topics = (SELECT COUNT(*) FROM public.course_topics WHERE course_id = (SELECT id FROM public.courses WHERE slug = 'java')) WHERE slug = 'java';
UPDATE public.courses SET total_topics = (SELECT COUNT(*) FROM public.course_topics WHERE course_id = (SELECT id FROM public.courses WHERE slug = 'html')) WHERE slug = 'html';
UPDATE public.courses SET total_topics = (SELECT COUNT(*) FROM public.course_topics WHERE course_id = (SELECT id FROM public.courses WHERE slug = 'css')) WHERE slug = 'css';
UPDATE public.courses SET total_topics = (SELECT COUNT(*) FROM public.course_topics WHERE course_id = (SELECT id FROM public.courses WHERE slug = 'javascript')) WHERE slug = 'javascript';
UPDATE public.courses SET total_topics = (SELECT COUNT(*) FROM public.course_topics WHERE course_id = (SELECT id FROM public.courses WHERE slug = 'php')) WHERE slug = 'php';
UPDATE public.courses SET total_topics = (SELECT COUNT(*) FROM public.course_topics WHERE course_id = (SELECT id FROM public.courses WHERE slug = 'sql')) WHERE slug = 'sql';
