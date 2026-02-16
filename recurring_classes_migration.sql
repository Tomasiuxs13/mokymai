-- ============================================================
-- MIGRATION: Support for Recurring Classes (Būrelis)
-- Use this to distinguish continuous classes from fixed cohorts
-- ============================================================

-- 1. Add `is_recurring` flag
-- Default is false (standard fixed-term cohort)
ALTER TABLE public.cohorts 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false;

-- 2. Add `schedule_pattern` JSONB
-- Stores the recurrence details, e.g.:
-- {
--   "days": ["Monday", "Wednesday"],
--   "time": "18:00",
--   "duration_minutes": 60,
--   "frequency": "weekly"
-- }
ALTER TABLE public.cohorts 
ADD COLUMN IF NOT EXISTS schedule_pattern JSONB DEFAULT '{}'::jsonb;

-- Comment on columns
COMMENT ON COLUMN public.cohorts.is_recurring IS 'If true, this is a recurring class (būrelis) rather than a fixed cohort.';
COMMENT ON COLUMN public.cohorts.schedule_pattern IS 'JSON defining when the class happens (e.g., days of week, time).';
