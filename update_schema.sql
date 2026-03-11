ALTER TABLE course_registrations ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'creator';
ALTER TABLE public.course_registrations ADD COLUMN IF NOT EXISTS children_count TEXT;
