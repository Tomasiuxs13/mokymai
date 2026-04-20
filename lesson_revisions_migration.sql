-- ============================================================
-- MIGRATION: Lesson Revision History
-- Stores a snapshot of a lesson's title/content/video_url/duration/is_free
-- each time it's saved. Admins can browse and restore any revision.
-- Run this once in Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lesson_revisions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id    UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title        TEXT,
  video_url    TEXT,
  duration_min INT,
  is_free      BOOLEAN,
  content      JSONB,
  edited_by    UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_revisions_lesson_idx
  ON public.lesson_revisions (lesson_id, created_at DESC);

ALTER TABLE public.lesson_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage lesson revisions" ON public.lesson_revisions;

CREATE POLICY "Admins manage lesson revisions"
  ON public.lesson_revisions FOR ALL
  USING (public.is_admin());

-- Keep the table trim: delete all but the most recent 50 revisions per lesson.
-- Call this periodically (e.g. via a cron job), or ignore and let it grow.
CREATE OR REPLACE FUNCTION public.prune_lesson_revisions(keep_count INT DEFAULT 50)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY lesson_id ORDER BY created_at DESC) AS rn
    FROM public.lesson_revisions
  )
  DELETE FROM public.lesson_revisions
  WHERE id IN (SELECT id FROM ranked WHERE rn > keep_count);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
