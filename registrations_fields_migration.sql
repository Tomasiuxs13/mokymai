-- ============================================================
-- MIGRATION: Added Name and Phone to Course Registrations
-- ============================================================

-- Safely add the columns
ALTER TABLE public.course_registrations 
  ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
