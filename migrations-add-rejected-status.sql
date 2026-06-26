-- Add 'rejected' value to the application_status enum
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
  ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'rejected';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
