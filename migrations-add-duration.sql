-- Add duration columns to applications table
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS duration INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_tasks INTEGER NOT NULL DEFAULT 5;
