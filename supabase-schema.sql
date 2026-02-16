-- ============================================================
-- Web Genius — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES  (extends auth.users)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'student', 'parent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role NOT NULL DEFAULT 'student',
  full_name     TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  locale        TEXT NOT NULL DEFAULT 'en',        -- 'en' | 'lt'
  timezone      TEXT DEFAULT 'America/New_York',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create a profile on signup (uses role from metadata if provided)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role  public.user_role := 'student';
  _name  TEXT := '';
  _raw   TEXT;
BEGIN
  -- Safely read role from metadata
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    _name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    _raw  := NEW.raw_user_meta_data->>'role';
    IF _raw IN ('admin', 'student', 'parent') THEN
      _role := _raw::public.user_role;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, _role, _name);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user creation; fall back to defaults
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, 'student', '')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. PARENT ↔ STUDENT LINK
-- ============================================================
CREATE TABLE IF NOT EXISTS public.parent_student (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_id, student_id)
);

-- ============================================================
-- 3. COHORTS  (Live Academy batches)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cohorts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,                       -- e.g. "Spring 2026"
  starts_at   DATE NOT NULL,
  ends_at     DATE NOT NULL,
  max_seats   INT NOT NULL DEFAULT 30,
  price_usd   NUMERIC(10,2) NOT NULL DEFAULT 750,
  price_eur   NUMERIC(10,2) NOT NULL DEFAULT 360,
  status      TEXT NOT NULL DEFAULT 'upcoming'     -- upcoming | active | completed
    CHECK (status IN ('upcoming','active','completed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. COURSES  (modules inside a cohort or self-paced)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE course_type AS ENUM ('self_paced', 'live');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.courses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id   UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  type        course_type NOT NULL DEFAULT 'self_paced',
  month       INT,                                 -- 1, 2, 3 for live cohort
  sort_order  INT NOT NULL DEFAULT 0,
  thumbnail   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. LESSONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  video_url   TEXT,
  content     JSONB DEFAULT '{}',                  -- rich content / markdown
  sort_order  INT NOT NULL DEFAULT 0,
  duration_min INT DEFAULT 0,
  is_free     BOOLEAN NOT NULL DEFAULT false,      -- free preview lesson
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. ENROLLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cohort_id   UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  course_id   UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending','active','completed','cancelled')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. ASSIGNMENTS & SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assignments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id   UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  due_offset_days INT DEFAULT 7,                   -- days after lesson is released
  max_points  INT NOT NULL DEFAULT 100,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content       JSONB DEFAULT '{}',
  file_url      TEXT,
  grade         INT,
  feedback      TEXT,
  graded_by     UUID REFERENCES public.profiles(id),
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  graded_at     TIMESTAMPTZ
);

-- ============================================================
-- 8. DIPLOMAS / CERTIFICATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.diplomas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cohort_id   UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  certificate_url TEXT,
  final_grade NUMERIC(5,2)
);

-- ============================================================
-- 9. PROGRESS TRACKING
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id   UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed   BOOLEAN NOT NULL DEFAULT false,
  progress_pct INT NOT NULL DEFAULT 0,
  last_watched_at TIMESTAMPTZ,
  UNIQUE (student_id, lesson_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ————— Helper: is current user an admin? —————
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ————— PROFILES —————
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins full access profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins full access profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- ————— PARENT-STUDENT —————
ALTER TABLE public.parent_student ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can see their linked students" ON public.parent_student;
DROP POLICY IF EXISTS "Admins manage parent-student links" ON public.parent_student;

CREATE POLICY "Parents can see their linked students"
  ON public.parent_student FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Admins manage parent-student links"
  ON public.parent_student FOR ALL
  USING (public.is_admin());

-- ————— COHORTS —————
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view cohorts" ON public.cohorts;
DROP POLICY IF EXISTS "Admins manage cohorts" ON public.cohorts;

CREATE POLICY "Anyone can view cohorts"
  ON public.cohorts FOR SELECT USING (true);

CREATE POLICY "Admins manage cohorts"
  ON public.cohorts FOR ALL
  USING (public.is_admin());

-- ————— COURSES —————
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;

CREATE POLICY "Anyone can view courses"
  ON public.courses FOR SELECT USING (true);

CREATE POLICY "Admins manage courses"
  ON public.courses FOR ALL
  USING (public.is_admin());

-- ————— LESSONS —————
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view free lessons" ON public.lessons;
DROP POLICY IF EXISTS "Enrolled students view lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins manage lessons" ON public.lessons;

CREATE POLICY "Anyone can view free lessons"
  ON public.lessons FOR SELECT USING (is_free = true);

CREATE POLICY "Enrolled students view lessons"
  ON public.lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.courses c ON c.id = lessons.course_id
      WHERE e.student_id = auth.uid()
        AND (e.course_id = c.id OR e.cohort_id = c.cohort_id)
        AND e.status = 'active'
    )
  );

CREATE POLICY "Admins manage lessons"
  ON public.lessons FOR ALL
  USING (public.is_admin());

-- ————— ENROLLMENTS —————
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students see own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins manage enrollments" ON public.enrollments;

CREATE POLICY "Students see own enrollments"
  ON public.enrollments FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins manage enrollments"
  ON public.enrollments FOR ALL
  USING (public.is_admin());

-- ————— ASSIGNMENTS —————
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enrolled students view assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins manage assignments" ON public.assignments;

CREATE POLICY "Enrolled students view assignments"
  ON public.assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.lessons l ON l.id = assignments.lesson_id
      JOIN public.courses c ON c.id = l.course_id
      WHERE e.student_id = auth.uid()
        AND (e.course_id = c.id OR e.cohort_id = c.cohort_id)
        AND e.status = 'active'
    )
  );

CREATE POLICY "Admins manage assignments"
  ON public.assignments FOR ALL
  USING (public.is_admin());

-- ————— SUBMISSIONS —————
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students see own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins manage submissions" ON public.submissions;

CREATE POLICY "Students see own submissions"
  ON public.submissions FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students create submissions"
  ON public.submissions FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins manage submissions"
  ON public.submissions FOR ALL
  USING (public.is_admin());

-- ————— PROGRESS —————
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students manage own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Admins manage progress" ON public.lesson_progress;

CREATE POLICY "Students manage own progress"
  ON public.lesson_progress FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Admins manage progress"
  ON public.lesson_progress FOR ALL
  USING (public.is_admin());

-- ————— DIPLOMAS —————
ALTER TABLE public.diplomas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students see own diplomas" ON public.diplomas;
DROP POLICY IF EXISTS "Admins manage diplomas" ON public.diplomas;

CREATE POLICY "Students see own diplomas"
  ON public.diplomas FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins manage diplomas"
  ON public.diplomas FOR ALL
  USING (public.is_admin());

-- ============================================================
-- 10a. STORAGE — Course Thumbnails
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-thumbnails',
  'course-thumbnails',
  true,           -- public bucket (thumbnails are shown on the website)
  5242880,        -- 5 MB limit
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Admins can upload / manage thumbnails
CREATE POLICY "Admins manage course thumbnails"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'course-thumbnails'
    AND public.is_admin()
  );

-- ============================================================
-- 10b. STORAGE — Submission File Uploads
-- ============================================================
-- Create the storage bucket (run once in Supabase Dashboard > Storage,
-- or via the SQL below if using the management API).
-- Bucket name: submissions
-- Public: false (private bucket, accessed via signed URLs)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submissions',
  'submissions',
  false,
  10485760,  -- 10 MB limit
  ARRAY['image/jpeg','image/png','image/gif','image/webp',
        'application/pdf',
        'application/zip','application/x-zip-compressed',
        'text/plain','text/html','text/css','text/javascript',
        'application/json',
        'video/mp4','video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
-- Students can upload files to their own folder: submissions/{student_id}/*
CREATE POLICY "Students upload own submission files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Students can read their own files
CREATE POLICY "Students read own submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Students can delete their own files
CREATE POLICY "Students delete own submission files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can do everything with submission files
CREATE POLICY "Admins manage all submission files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'submissions'
    AND public.is_admin()
  );

-- ============================================================
-- 11. ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  audience      TEXT NOT NULL DEFAULT 'all'
                  CHECK (audience IN ('all', 'students', 'parents')),
  cohort_id     UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  priority      TEXT NOT NULL DEFAULT 'normal'
                  CHECK (priority IN ('normal', 'important', 'urgent')),
  published_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ,
  created_by    UUID NOT NULL REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage announcements"
  ON public.announcements FOR ALL
  USING (public.is_admin());

-- Authenticated users can read published, non-expired announcements
CREATE POLICY "Users read published announcements"
  ON public.announcements FOR SELECT
  USING (
    published_at <= now()
    AND (expires_at IS NULL OR expires_at > now())
  );

-- ============================================================
-- 12. PLATFORM SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id            INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name     TEXT NOT NULL DEFAULT 'Web Genius Academy',
  price_usd     NUMERIC(10,2) NOT NULL DEFAULT 750,
  price_eur     NUMERIC(10,2) NOT NULL DEFAULT 360,
  contact_email TEXT NOT NULL DEFAULT 'hello@webgenius.academy',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings (needed for signup page pricing etc.)
CREATE POLICY "Public read settings"
  ON public.platform_settings FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins update settings"
  ON public.platform_settings FOR UPDATE
  USING (public.is_admin());

-- Insert default row if not exists
INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
-- ============================================================
-- 10c. STORAGE — User Avatars
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg','image/png','image/gif','image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Policies for Avatars
-- Anyone can view avatars (public profile images)
CREATE POLICY "Public view avatars"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Users can upload/update/delete their own avatar
-- We assume the filename path is {user_id}/{filename} or just {user_id}.ext
-- But usually {user_id} as the file name is easiest to manage for 1:1 mapping.

CREATE POLICY "Users manage own avatar"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
