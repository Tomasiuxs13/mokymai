-- ============================================================
-- MIGRATION: Course Modules & Builder Support
-- ============================================================

-- 1. Create MODULES table
CREATE TABLE IF NOT EXISTS public.modules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies for Modules
CREATE POLICY "Anyone can view modules"
  ON public.modules FOR SELECT USING (true); -- Public/Students need to see modules

CREATE POLICY "Admins manage modules"
  ON public.modules FOR ALL
  USING (public.is_admin());

-- 3. Update LESSONS table to support modules
-- We add module_id. It can be NULL if a lesson doesn't belong to a module (e.g. legacy or flat structure),
-- but for the builder we will likely enforce it or use a "Default" module.
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL;

-- 4. Update ASSIGNMENTS table (optional, but good for grouping)
-- Assignments are currently linked to LESSONS, which is fine.
-- If we want assignments directly in modules (without a lesson), we'd need a link.
-- For now, we keep assignments linked to lessons as per original design.

-- 5. Helper to create a default module for existing courses (Optional but helpful)
-- DO $$
-- DECLARE
--   c RECORD;
--   m_id UUID;
-- BEGIN
--   FOR c IN SELECT * FROM public.courses LOOP
--     -- Check if course has lessons but no modules
--     IF EXISTS (SELECT 1 FROM public.lessons WHERE course_id = c.id AND module_id IS NULL) THEN
--       -- Create a "Default Module"
--       INSERT INTO public.modules (course_id, title, sort_order)
--       VALUES (c.id, 'General', 0)
--       RETURNING id INTO m_id;
--
--       -- Move lessons to this module
--       UPDATE public.lessons SET module_id = m_id WHERE course_id = c.id AND module_id IS NULL;
--     END IF;
--   END LOOP;
-- END $$;
