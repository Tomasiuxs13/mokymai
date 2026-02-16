-- ============================================================
-- Tėvų portalas — RLS taisyklių atnaujinimai
-- Paleiskite tai Supabase SQL redaktoriuje
-- Leidžia tėvams MATYTI susietų vaikų duomenis
-- ============================================================

-- Pagalbinė funkcija: gauna mokinio ID, susietus su esamu tėvu
CREATE OR REPLACE FUNCTION public.get_my_student_ids()
RETURNS SETOF UUID AS $$
  SELECT student_id FROM public.parent_student WHERE parent_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ————— PROFILIAI: tėvai gali matyti susietų mokinių profilius —————
DROP POLICY IF EXISTS "Parents can view linked student profiles" ON public.profiles;
CREATE POLICY "Parents can view linked student profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (SELECT public.get_my_student_ids())
  );

-- ————— REGISTRACIJOS: tėvai gali matyti susietų mokinių registracijas —————
DROP POLICY IF EXISTS "Parents view linked student enrollments" ON public.enrollments;
CREATE POLICY "Parents view linked student enrollments"
  ON public.enrollments FOR SELECT
  USING (
    student_id IN (SELECT public.get_my_student_ids())
  );

-- ————— PAMOKŲ PAŽANGA: tėvai gali matyti susietų mokinių pažangą —————
DROP POLICY IF EXISTS "Parents view linked student progress" ON public.lesson_progress;
CREATE POLICY "Parents view linked student progress"
  ON public.lesson_progress FOR SELECT
  USING (
    student_id IN (SELECT public.get_my_student_ids())
  );

-- ————— PATEIKIMAI: tėvai gali matyti susietų mokinių pateikimus —————
DROP POLICY IF EXISTS "Parents view linked student submissions" ON public.submissions;
CREATE POLICY "Parents view linked student submissions"
  ON public.submissions FOR SELECT
  USING (
    student_id IN (SELECT public.get_my_student_ids())
  );

-- ————— DIPLOMAI: tėvai gali matyti susietų mokinių diplomus —————
DROP POLICY IF EXISTS "Parents view linked student diplomas" ON public.diplomas;
CREATE POLICY "Parents view linked student diplomas"
  ON public.diplomas FOR SELECT
  USING (
    student_id IN (SELECT public.get_my_student_ids())
  );

-- ————— UŽDUOTYS: tėvai gali matyti užduotis savo vaikų kursuose —————
-- (užduotys jau matomos užregistruotiems mokiniams; pridedame tėvų prieigą per registracijos grandinę)
DROP POLICY IF EXISTS "Parents view linked student assignments" ON public.assignments;
CREATE POLICY "Parents view linked student assignments"
  ON public.assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.lessons l ON l.id = assignments.lesson_id
      JOIN public.courses c ON c.id = l.course_id
      WHERE e.student_id IN (SELECT public.get_my_student_ids())
        AND (e.course_id = c.id OR e.cohort_id = c.cohort_id)
        AND e.status = 'active'
    )
  );

-- ————— PAMOKOS: tėvai gali matyti pamokas savo vaikų kursuose —————
DROP POLICY IF EXISTS "Parents view linked student lessons" ON public.lessons;
CREATE POLICY "Parents view linked student lessons"
  ON public.lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.courses c ON c.id = lessons.course_id
      WHERE e.student_id IN (SELECT public.get_my_student_ids())
        AND (e.course_id = c.id OR e.cohort_id = c.cohort_id)
        AND e.status = 'active'
    )
  );
