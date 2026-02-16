-- ============================================================
-- MIGRATION: Course Registrations (Leads)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.course_registrations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL,
  cohort_id   UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Public insert (allow anyone to register interest)
CREATE POLICY "Public can register interest"
  ON public.course_registrations FOR INSERT
  WITH CHECK (true);

-- 2. Admins view all
CREATE POLICY "Admins view registrations"
  ON public.course_registrations FOR SELECT
  USING (public.is_admin());
