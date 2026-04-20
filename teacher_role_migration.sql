-- ============================================================
-- MIGRATION: Teacher role + course collaborators
-- Lets non-admin "teacher" profiles edit courses they're assigned to.
-- Run this once in Supabase SQL Editor.
-- ============================================================

-- 1. Add 'teacher' to the user_role enum (no-op if already present).
DO $$ BEGIN
  ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'teacher';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Collaborator join table.
CREATE TABLE IF NOT EXISTS public.course_collaborators (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS course_collaborators_teacher_idx
  ON public.course_collaborators (teacher_id);
CREATE INDEX IF NOT EXISTS course_collaborators_course_idx
  ON public.course_collaborators (course_id);

ALTER TABLE public.course_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage collaborators" ON public.course_collaborators;
DROP POLICY IF EXISTS "Teachers view their collaborations" ON public.course_collaborators;

CREATE POLICY "Admins manage collaborators"
  ON public.course_collaborators FOR ALL
  USING (public.is_admin());

CREATE POLICY "Teachers view their collaborations"
  ON public.course_collaborators FOR SELECT
  USING (teacher_id = auth.uid());

-- 3. Helper: is the current user allowed to edit the given course?
CREATE OR REPLACE FUNCTION public.is_course_editor(cid UUID)
RETURNS BOOLEAN AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.course_collaborators
      WHERE course_id = cid
        AND teacher_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Courses: teachers manage courses they collaborate on; can also see draft versions.
DROP POLICY IF EXISTS "Public view published courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers view their courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers manage their courses" ON public.courses;

CREATE POLICY "Public view published courses"
  ON public.courses FOR SELECT
  USING (
    status = 'published'
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.course_collaborators cc
      WHERE cc.course_id = courses.id
        AND cc.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers manage their courses"
  ON public.courses FOR UPDATE
  USING (public.is_course_editor(id))
  WITH CHECK (public.is_course_editor(id));

-- 5. Modules: teachers manage modules for their courses.
DROP POLICY IF EXISTS "Teachers manage modules for their courses" ON public.modules;
CREATE POLICY "Teachers manage modules for their courses"
  ON public.modules FOR ALL
  USING (public.is_course_editor(course_id))
  WITH CHECK (public.is_course_editor(course_id));

-- 6. Lessons: teachers manage lessons for their courses.
DROP POLICY IF EXISTS "Teachers manage lessons for their courses" ON public.lessons;
CREATE POLICY "Teachers manage lessons for their courses"
  ON public.lessons FOR ALL
  USING (public.is_course_editor(course_id))
  WITH CHECK (public.is_course_editor(course_id));

-- 7. Assignments: teachers manage assignments attached to lessons in their courses.
DROP POLICY IF EXISTS "Teachers manage assignments for their courses" ON public.assignments;
CREATE POLICY "Teachers manage assignments for their courses"
  ON public.assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = assignments.lesson_id
        AND public.is_course_editor(l.course_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = assignments.lesson_id
        AND public.is_course_editor(l.course_id)
    )
  );

-- 8. Submissions: teachers can view + grade submissions for their assignments.
DROP POLICY IF EXISTS "Teachers view submissions for their courses" ON public.submissions;
DROP POLICY IF EXISTS "Teachers grade submissions for their courses" ON public.submissions;

CREATE POLICY "Teachers view submissions for their courses"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.lessons l ON l.id = a.lesson_id
      WHERE a.id = submissions.assignment_id
        AND public.is_course_editor(l.course_id)
    )
  );

CREATE POLICY "Teachers grade submissions for their courses"
  ON public.submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.lessons l ON l.id = a.lesson_id
      WHERE a.id = submissions.assignment_id
        AND public.is_course_editor(l.course_id)
    )
  );

-- 9. Lesson attachments: teachers manage attachments for their lessons.
DROP POLICY IF EXISTS "Teachers manage lesson attachments" ON public.lesson_attachments;
CREATE POLICY "Teachers manage lesson attachments"
  ON public.lesson_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_attachments.lesson_id
        AND public.is_course_editor(l.course_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_attachments.lesson_id
        AND public.is_course_editor(l.course_id)
    )
  );

-- 10. Lesson revisions: teachers can view + create revisions for their lessons.
DROP POLICY IF EXISTS "Teachers manage lesson revisions" ON public.lesson_revisions;
CREATE POLICY "Teachers manage lesson revisions"
  ON public.lesson_revisions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_revisions.lesson_id
        AND public.is_course_editor(l.course_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = lesson_revisions.lesson_id
        AND public.is_course_editor(l.course_id)
    )
  );

-- 11. Storage: teachers can read/write lesson-files for their lessons.
-- Files are stored as lesson-files/{lesson_id}/{...}, so we look up the lesson.
DROP POLICY IF EXISTS "Teachers manage lesson files" ON storage.objects;

CREATE POLICY "Teachers manage lesson files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'lesson-files'
    AND EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id::text = (storage.foldername(name))[1]
        AND public.is_course_editor(l.course_id)
    )
  )
  WITH CHECK (
    bucket_id = 'lesson-files'
    AND EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id::text = (storage.foldername(name))[1]
        AND public.is_course_editor(l.course_id)
    )
  );

-- Also allow teachers to manage course thumbnails for courses they edit.
-- Files are stored as course-thumbnails/{course_id}/{...}.
DROP POLICY IF EXISTS "Teachers manage course thumbnails" ON storage.objects;
CREATE POLICY "Teachers manage course thumbnails"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'course-thumbnails'
    AND public.is_course_editor(((storage.foldername(name))[1])::uuid)
  )
  WITH CHECK (
    bucket_id = 'course-thumbnails'
    AND public.is_course_editor(((storage.foldername(name))[1])::uuid)
  );
