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
