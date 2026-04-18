-- ============================================================
-- MIGRATION: GDPR data subject rights (request, export, delete)
-- ============================================================

-- 1. Table: user-initiated data requests ---------------------
CREATE TABLE IF NOT EXISTS public.data_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT NOT NULL,
  request_type  TEXT NOT NULL CHECK (request_type IN ('export', 'delete')),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'fulfilled', 'rejected')),
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  fulfilled_at  TIMESTAMPTZ,
  fulfilled_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT data_req_email_format
    CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

ALTER TABLE public.data_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit data request" ON public.data_requests;
CREATE POLICY "Public can submit data request"
  ON public.data_requests FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage data requests" ON public.data_requests;
CREATE POLICY "Admins manage data requests"
  ON public.data_requests FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_data_req_status
  ON public.data_requests (status, created_at DESC);

-- 2. RPC: export_user_data --------------------------------------
--    Admin-only. Returns all rows across tables that reference the
--    given email. Returns JSON so the admin UI can offer a download.
CREATE OR REPLACE FUNCTION public.export_user_data(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins may export user data';
  END IF;

  SELECT jsonb_build_object(
    'email', p_email,
    'exported_at', now(),
    'course_registrations', (
      SELECT coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
      FROM public.course_registrations r
      WHERE lower(r.email) = lower(p_email)
    ),
    'data_requests', (
      SELECT coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb)
      FROM public.data_requests d
      WHERE lower(d.email) = lower(p_email)
    ),
    'profiles', (
      SELECT coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
      FROM public.profiles p
      WHERE lower(coalesce(p.email, '')) = lower(p_email)
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.export_user_data(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.export_user_data(TEXT) TO authenticated;

-- 3. RPC: forget_user_data --------------------------------------
--    Admin-only. Hard-deletes all rows matching the email across
--    the tables that hold non-account data. Auth users / profiles
--    with active accounts are NOT deleted here (do that via auth
--    admin so RLS-protected children cascade correctly).
CREATE OR REPLACE FUNCTION public.forget_user_data(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n_reg   INT;
  n_req   INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins may delete user data';
  END IF;

  DELETE FROM public.course_registrations
    WHERE lower(email) = lower(p_email);
  GET DIAGNOSTICS n_reg = ROW_COUNT;

  UPDATE public.data_requests
    SET status = 'fulfilled', fulfilled_at = now(), fulfilled_by = auth.uid()
    WHERE lower(email) = lower(p_email) AND status = 'pending';
  GET DIAGNOSTICS n_req = ROW_COUNT;

  RETURN jsonb_build_object(
    'email', p_email,
    'registrations_deleted', n_reg,
    'requests_marked_fulfilled', n_req,
    'at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.forget_user_data(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.forget_user_data(TEXT) TO authenticated;
