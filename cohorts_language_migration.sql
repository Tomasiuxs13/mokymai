-- ============================================================
-- MIGRATION: Add Locale to Cohorts
-- ============================================================

-- Add locale column with default 'en'
ALTER TABLE public.cohorts 
ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en';

-- Optional: You might want to update existing records if any
-- UPDATE public.cohorts SET locale = 'lt' WHERE name ILIKE '%Lithuanian%';
