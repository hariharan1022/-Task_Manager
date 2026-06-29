-- =========================================================
-- SKYROVIX — RPC: ensure_any_task + widen CHECK constraint
-- Run this in your Supabase SQL Editor
-- =========================================================

-- 1. Drop old CHECK constraint and replace with 0-12
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_number_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_task_number_check CHECK (task_number BETWEEN 0 AND 12);

-- 2. Create SECURITY DEFINER RPC so authenticated users can upsert any task
--    (same pattern as ensure_linkedin_task but for any task_number)
CREATE OR REPLACE FUNCTION public.ensure_task(
  p_domain TEXT,
  p_task_number INT,
  p_title TEXT,
  p_description TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Try to find existing task first
  SELECT id INTO v_id
  FROM public.tasks
  WHERE domain = p_domain AND task_number = p_task_number;

  -- If not found, create it
  IF v_id IS NULL THEN
    INSERT INTO public.tasks (domain, task_number, title, description)
    VALUES (p_domain, p_task_number, p_title, p_description)
    ON CONFLICT (domain, task_number) DO NOTHING
    RETURNING id INTO v_id;

    -- Handle race condition
    IF v_id IS NULL THEN
      SELECT id INTO v_id
      FROM public.tasks
      WHERE domain = p_domain AND task_number = p_task_number;
    END IF;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_task(TEXT, INT, TEXT, TEXT) TO authenticated;
