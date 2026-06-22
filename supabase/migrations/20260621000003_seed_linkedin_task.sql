-- Seed LinkedIn post task (task_number 0) for every existing domain
INSERT INTO public.tasks (domain, task_number, title, description)
SELECT DISTINCT domain, 0, 'Share Your Offer Letter on LinkedIn',
  'Post your Skyrovix offer letter on LinkedIn to celebrate your internship and inspire others.'
FROM public.tasks
WHERE domain IS NOT NULL
ON CONFLICT (domain, task_number) DO NOTHING;
