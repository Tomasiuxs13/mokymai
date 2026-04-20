-- ============================================================
-- MIGRATION: Lesson Attachments
-- Downloadable files (PDFs, slides, etc.) attached to lessons.
-- Run this once in Supabase SQL Editor.
-- ============================================================

-- 1. Table
CREATE TABLE IF NOT EXISTS public.lesson_attachments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id   UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,                        -- path inside the storage bucket
  file_name   TEXT NOT NULL,                        -- original filename shown to students
  file_size   BIGINT,                               -- bytes
  mime_type   TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_attachments_lesson_idx
  ON public.lesson_attachments (lesson_id, sort_order);

ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;

-- 2. Row-level policies
-- Enrolled students see attachments for lessons in their courses.
DROP POLICY IF EXISTS "Admins manage lesson attachments" ON public.lesson_attachments;
DROP POLICY IF EXISTS "Enrolled students view lesson attachments" ON public.lesson_attachments;
DROP POLICY IF EXISTS "Public view free lesson attachments" ON public.lesson_attachments;

CREATE POLICY "Admins manage lesson attachments"
  ON public.lesson_attachments FOR ALL
  USING (public.is_admin());

CREATE POLICY "Enrolled students view lesson attachments"
  ON public.lesson_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.lessons l ON l.id = lesson_attachments.lesson_id
      JOIN public.courses c ON c.id = l.course_id
      WHERE e.student_id = auth.uid()
        AND (e.course_id = c.id OR e.cohort_id = c.cohort_id)
        AND e.status = 'active'
    )
  );

CREATE POLICY "Public view free lesson attachments"
  ON public.lesson_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id = lesson_attachments.lesson_id
        AND l.is_free = true
        AND c.status = 'published'
    )
  );

-- 3. Storage bucket for the files themselves (private; signed URLs).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-files',
  'lesson-files',
  false,
  52428800,  -- 50 MB
  ARRAY[
    'application/pdf',
    'application/zip','application/x-zip-compressed',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain','text/csv','text/markdown',
    'image/jpeg','image/png','image/gif','image/webp','image/svg+xml'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage policies
DROP POLICY IF EXISTS "Admins manage lesson files" ON storage.objects;
DROP POLICY IF EXISTS "Enrolled students read lesson files" ON storage.objects;
DROP POLICY IF EXISTS "Public read free lesson files" ON storage.objects;

CREATE POLICY "Admins manage lesson files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'lesson-files' AND public.is_admin());

-- Enrolled students may read any file whose path starts with their enrolled lesson id.
-- Files are stored as: lesson-files/{lesson_id}/{timestamp}_{filename}
CREATE POLICY "Enrolled students read lesson files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lesson-files'
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.lessons l ON l.id::text = (storage.foldername(name))[1]
      JOIN public.courses c ON c.id = l.course_id
      WHERE e.student_id = auth.uid()
        AND (e.course_id = c.id OR e.cohort_id = c.cohort_id)
        AND e.status = 'active'
    )
  );

CREATE POLICY "Public read free lesson files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lesson-files'
    AND EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id::text = (storage.foldername(name))[1]
        AND l.is_free = true
        AND c.status = 'published'
    )
  );
