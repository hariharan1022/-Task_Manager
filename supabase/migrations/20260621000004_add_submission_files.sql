-- Add file columns to submissions table
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Create storage bucket for task submission files
INSERT INTO storage.buckets (id, name, public) VALUES ('task-submissions', 'task-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own task files
CREATE POLICY "Users upload own task submission files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'task-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users and admins to view task submission files
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
CREATE POLICY "Users update own task submission files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'task-submissions' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own task submission files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'task-submissions' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admin can delete any task submission file
CREATE POLICY "Admin delete task submission files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'task-submissions' AND public.has_role(auth.uid(), 'admin'));
