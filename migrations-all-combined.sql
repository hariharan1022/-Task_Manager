-- Migration 1: Email Logs
-- Email logs table for tracking all sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_to TEXT NOT NULL,
  student_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('offer_letter', 'certificate')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  subject TEXT NOT NULL,
  reference_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_document_type ON public.email_logs(document_type);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;

-- Admins can do everything
CREATE POLICY "Admins can manage email logs" ON public.email_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own email logs
CREATE POLICY "Users can view own email logs" ON public.email_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

DROP TRIGGER IF EXISTS email_logs_updated_at ON public.email_logs;
CREATE TRIGGER email_logs_updated_at BEFORE UPDATE ON public.email_logs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- Migration 2: Rejected Status
-- Add 'rejected' value to the application_status enum
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
  ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'rejected';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- Migration 3: Reviews RPC
-- RPC to fetch approved reviews with profile data (bypasses RLS on profiles)
CREATE OR REPLACE FUNCTION public.get_reviews_with_profiles(
  p_target_type TEXT,
  p_target_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json)
    FROM (
      SELECT
        r.id,
        r.user_id,
        r.target_type,
        r.target_id,
        r.rating,
        r.title,
        r.content,
        r.status,
        r.created_at,
        r.updated_at,
        json_build_object(
          'full_name', p.full_name,
          'photo_url', p.photo_url
        ) AS profiles
      FROM public.reviews r
      LEFT JOIN public.profiles p ON r.user_id = p.id
      WHERE r.target_type = p_target_type
        AND r.target_id = p_target_id
        AND r.status = 'approved'
    ) t
  );
END;
$$;

-- RPC to fetch recent approved reviews with profiles
CREATE OR REPLACE FUNCTION public.get_recent_reviews_with_profiles(
  p_limit INT DEFAULT 6
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json)
    FROM (
      SELECT
        r.id,
        r.user_id,
        r.target_type,
        r.target_id,
        r.rating,
        r.title,
        r.content,
        r.status,
        r.created_at,
        r.updated_at,
        json_build_object(
          'full_name', p.full_name,
          'photo_url', p.photo_url
        ) AS profiles
      FROM public.reviews r
      LEFT JOIN public.profiles p ON r.user_id = p.id
      WHERE r.status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT p_limit
    ) t
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_reviews_with_profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_reviews_with_profiles TO anon, authenticated;

