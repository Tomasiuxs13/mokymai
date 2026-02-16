-- ============================================================
-- Kalbų palaikymo migracija
-- Prideda 'language' stulpelį į 'cohorts' ir 'courses' lenteles
-- Paleiskite tai Supabase SQL redaktoriuje
-- ============================================================

-- Pridėti kalbos stulpelį į 'cohorts' lentelę
ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en'
  CHECK (language IN ('en','lt'));

-- Pridėti kalbos stulpelį į 'courses' lentelę
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en'
  CHECK (language IN ('en','lt'));
