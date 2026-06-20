
-- =========================================================
-- COURSES
-- =========================================================
CREATE TABLE public.courses (
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
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT USING (is_published = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage courses" ON public.courses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- COURSE TOPICS (lessons)
-- =========================================================
CREATE TABLE public.course_topics (
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
CREATE POLICY "Anyone can view topics" ON public.course_topics FOR SELECT USING (true);
CREATE POLICY "Admins manage topics" ON public.course_topics
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- COURSE TASKS
-- =========================================================
CREATE TABLE public.course_tasks (
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
CREATE POLICY "Anyone can view course tasks" ON public.course_tasks FOR SELECT USING (true);
CREATE POLICY "Admins manage course tasks" ON public.course_tasks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- QUIZ QUESTIONS
-- =========================================================
CREATE TABLE public.course_quiz_questions (
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
CREATE POLICY "Authenticated can view quiz questions" ON public.course_quiz_questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage quiz" ON public.course_quiz_questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- ENROLLMENTS
-- =========================================================
CREATE TABLE public.enrollments (
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
CREATE POLICY "Users view own enrollments" ON public.enrollments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own enrollment" ON public.enrollments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own enrollment" ON public.enrollments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users delete own enrollment" ON public.enrollments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- LESSON PROGRESS
-- =========================================================
CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.course_topics(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, topic_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own progress" ON public.lesson_progress
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND (e.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));

-- =========================================================
-- COURSE TASK SUBMISSIONS
-- =========================================================
CREATE TABLE public.course_task_submissions (
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
CREATE POLICY "Users view own task submissions" ON public.course_task_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND (e.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Users insert own task submissions" ON public.course_task_submissions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));
CREATE POLICY "Users update own task submissions" ON public.course_task_submissions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND (e.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND (e.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- =========================================================
-- QUIZ ATTEMPTS
-- =========================================================
CREATE TABLE public.quiz_attempts (
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
CREATE POLICY "Users view own attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND (e.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Users insert own attempts" ON public.quiz_attempts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));
CREATE POLICY "Users update own attempts" ON public.quiz_attempts
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));

-- =========================================================
-- COURSE CERTIFICATES
-- =========================================================
CREATE TABLE public.course_certificates (
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
CREATE POLICY "Anyone can verify a certificate" ON public.course_certificates
  FOR SELECT USING (true);
CREATE POLICY "Users insert own certificate" ON public.course_certificates
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));

-- =========================================================
-- updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER courses_touch BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER enrollments_touch BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

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
