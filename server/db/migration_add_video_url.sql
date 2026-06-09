-- Migration: Add video_url column and migrate from first lesson
-- Run this in Supabase SQL editor

-- Add column (safe to run multiple times)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT '';

-- Migrate first lesson's videoUrl to course-level video_url
UPDATE courses c
SET video_url = (
  SELECT jsonb_array_elements(
    jsonb_array_elements(c.modules->'lessons') -> 'videoUrl'
  )::text
  LIMIT 1
)
WHERE c.modules != '[]'::jsonb AND c.video_url = '';

-- For newly seeded courses that already have video_url set in seed data,
-- update total_lessons to 1 (they were seeded with 6 from modules)
UPDATE courses SET total_lessons = 1 WHERE video_url != '';
