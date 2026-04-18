-- ============================================================
-- MIGRATION: Registration Hardening (GDPR consent + validation + email-check RPC)
-- Run in Supabase SQL Editor after previous registration migrations.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Consent + validation columns
-- ------------------------------------------------------------
ALTER TABLE public.course_registrations
  ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ip_address    INET,
  ADD COLUMN IF NOT EXISTS user_agent    TEXT;

-- Length / format constraints (drop first so re-runs are safe)
ALTER TABLE public.course_registrations DROP CONSTRAINT IF EXISTS reg_email_format;
ALTER TABLE public.course_registrations DROP CONSTRAINT IF EXISTS reg_name_length;
ALTER TABLE public.course_registrations DROP CONSTRAINT IF EXISTS reg_phone_length;
ALTER TABLE public.course_registrations DROP CONSTRAINT IF EXISTS reg_email_length;

ALTER TABLE public.course_registrations
  ADD CONSTRAINT reg_email_format
    CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ADD CONSTRAINT reg_email_length
    CHECK (char_length(email) BETWEEN 3 AND 120),
  ADD CONSTRAINT reg_name_length
    CHECK (char_length(coalesce(name, '')) BETWEEN 0 AND 80),
  ADD CONSTRAINT reg_phone_length
    CHECK (char_length(coalesce(phone, '')) BETWEEN 0 AND 30);

-- Prevent duplicate (email, cohort_id) combos.
-- First, dedupe existing rows: keep the OLDEST row per (lower(email), cohort_id),
-- delete the rest. Swap to `created_at DESC` if you'd rather keep the newest.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY lower(email), coalesce(cohort_id::text, '')
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM public.course_registrations
)
DELETE FROM public.course_registrations r
USING ranked
WHERE r.id = ranked.id AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reg_email_cohort
  ON public.course_registrations (lower(email), coalesce(cohort_id::text, ''));

CREATE INDEX IF NOT EXISTS idx_reg_created_at
  ON public.course_registrations (created_at DESC);

-- ------------------------------------------------------------
-- 2. Tighten INSERT policy to REQUIRE consent
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public can register interest" ON public.course_registrations;
CREATE POLICY "Public can register interest"
  ON public.course_registrations FOR INSERT
  WITH CHECK (consent_given = TRUE);

-- ------------------------------------------------------------
-- 3. Trigger: stamp consent_at when consent_given flips to TRUE
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.stamp_consent_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.consent_given = TRUE AND NEW.consent_at IS NULL THEN
    NEW.consent_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reg_consent_at ON public.course_registrations;
CREATE TRIGGER trg_reg_consent_at
  BEFORE INSERT OR UPDATE ON public.course_registrations
  FOR EACH ROW EXECUTE FUNCTION public.stamp_consent_at();

-- ------------------------------------------------------------
-- 4. RPC: check_email_registered (safe: returns boolean only)
--    Anon role CAN call it but cannot SELECT from the table.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_email_registered(
  p_email     TEXT,
  p_cohort_id UUID DEFAULT NULL
) RETURNS BOOLEAN
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.course_registrations
    WHERE lower(email) = lower(p_email)
      AND (p_cohort_id IS NULL OR cohort_id = p_cohort_id)
  );
$$;

REVOKE ALL ON FUNCTION public.check_email_registered(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_email_registered(TEXT, UUID) TO anon, authenticated;

-- ------------------------------------------------------------
-- 5. GDPR support: RPC to delete a registration by email + token
--    (Optional — call from a signed "unsubscribe" email link.)
-- ------------------------------------------------------------
-- Leave commented until you decide on a token strategy:
--
-- CREATE OR REPLACE FUNCTION public.forget_registration(p_email TEXT, p_token TEXT)
-- RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
-- DECLARE n INT;
-- BEGIN
--   -- TODO: verify p_token matches a stored hash
--   DELETE FROM public.course_registrations WHERE lower(email) = lower(p_email);
--   GET DIAGNOSTICS n = ROW_COUNT;
--   RETURN n;
-- END; $$;
