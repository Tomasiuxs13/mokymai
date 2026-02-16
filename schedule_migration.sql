-- ============================================================
-- SQL Migracija: Suplanuotos Sesijos
-- Paleiskite tai Supabase SQL redaktoriuje
-- ============================================================

CREATE TABLE IF NOT EXISTS public.scheduled_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id    UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  cohort_id    UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,           -- pvz., „Tinklalapių kūrimo pagrindai – 1 pamoka“
  description  TEXT,
  start_time   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ NOT NULL,
  meeting_url  TEXT,                    -- Zoom/Google Meet nuoroda
  status       TEXT NOT NULL DEFAULT 'scheduled'
               CHECK (status IN ('scheduled','cancelled','completed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS TAISYKLĖS
-- ============================================================
ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view scheduled sessions" ON public.scheduled_sessions;
DROP POLICY IF EXISTS "Admins manage scheduled sessions" ON public.scheduled_sessions;

-- 1. Peržiūros taisyklė:
--    - Administratorius: gali matyti visus įrašus
--    - Mokinys/Tėvas: gali matyti, jei priklauso grupei (cohort).
--    Tačiau, siekiant paprastumo ir našumo šioje programoje (bei atitinkant esamus modelius),
--    galime leisti autentifikuotiems vartotojams matyti sesijas (filtravimas vyksta kliento pusėje arba per JOIN).
--    Griežta RLS atrodytų taip:
--    USING (
--       public.is_admin() OR
--       EXISTS (
--         SELECT 1 FROM public.enrollments e
--         WHERE e.cohort_id = scheduled_sessions.cohort_id
--         AND e.student_id = auth.uid()
--         AND e.status = 'active'
--       ) -- plius tėvų logika...
--    )
--    Pilikime prie paprastesnio „Autentifikuoti vartotojai gali matyti“ modelio, naudojamo kursams/grupėms,
--    nebent reikalingas griežtas privatumas. Atsižvelgiant į kontekstą (kursai yra vieši/kataloge),
--    tvarkaraščio matomumas nėra labai jautrus, tačiau apribokime bent jau autentifikuotiems vartotojams.

CREATE POLICY "Authenticated users view sessions"
  ON public.scheduled_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

-- 2. Administratoriaus taisyklė: Pilna prieiga
CREATE POLICY "Admins manage scheduled sessions"
  ON public.scheduled_sessions FOR ALL
  USING (public.is_admin());
