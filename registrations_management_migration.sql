-- ============================================================
-- MIGRATION: Added Status and Notes to Course Registrations
-- ============================================================

-- Safely add the columns (if they don't exist yet)
ALTER TABLE public.course_registrations 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'enrolled', 'lost')),
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Add a policy allowing Admins to update registrations
DROP POLICY IF EXISTS "Admins update registrations" ON public.course_registrations;
CREATE POLICY "Admins update registrations"
  ON public.course_registrations FOR UPDATE
  USING (public.is_admin());
