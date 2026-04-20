-- ============================================================
-- MIGRATION: Course publish status (draft | published | archived)
-- Run this once in Supabase SQL Editor.
-- ============================================================

-- 1. Add status column (default 'draft' for new rows)
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft','published','archived'));

-- 2. Backfill existing rows to 'published' so current content stays visible
UPDATE public.courses SET status = 'published' WHERE status = 'draft';

-- 3. Replace the permissive "Anyone can view courses" policy
--    Non-admins may only see published courses; admins see everything.
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
DROP POLICY IF EXISTS "Public view published courses" ON public.courses;

CREATE POLICY "Public view published courses"
  ON public.courses FOR SELECT
  USING (status = 'published' OR public.is_admin());

-- 4. Hide lessons belonging to non-published courses from the free-preview path.
--    (Enrolled-student and admin policies are unaffected.)
DROP POLICY IF EXISTS "Anyone can view free lessons" ON public.lessons;

CREATE POLICY "Anyone can view free lessons"
  ON public.lessons FOR SELECT
  USING (
    is_free = true
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = lessons.course_id
        AND c.status = 'published'
    )
  );

-- 5. Modules: same treatment — only show for published courses (admins bypass).
DROP POLICY IF EXISTS "Anyone can view modules" ON public.modules;

CREATE POLICY "Anyone can view modules"
  ON public.modules FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = modules.course_id
        AND c.status = 'published'
    )
  );
