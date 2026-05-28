-- Fix client profile defaults (safe to re-run)
-- Run in Supabase SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS portal_client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE profiles
  ALTER COLUMN role DROP NOT NULL;

UPDATE profiles
SET role = NULL
WHERE user_type = 'client';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_user_type TEXT := COALESCE(NEW.raw_user_meta_data->>'user_type', 'founder');
  resolved_user_type user_type := CASE
    WHEN meta_user_type = 'client' THEN 'client'::user_type
    ELSE 'founder'::user_type
  END;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'user'), '@', 1)),
    resolved_user_type,
    CASE WHEN resolved_user_type = 'client'::user_type THEN NULL ELSE 'founder_a'::founder_role END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    user_type = EXCLUDED.user_type,
    role = CASE WHEN EXCLUDED.user_type = 'client'::user_type THEN NULL ELSE COALESCE(profiles.role, 'founder_a'::founder_role) END;
  RETURN NEW;
END;
$$;

-- Example: force a specific client login (replace client UUID)
-- UPDATE profiles
-- SET user_type = 'client', role = NULL, portal_client_id = 'YOUR-CLIENT-UUID'
-- WHERE email = 'rindorecar@gmail.com';

SELECT 'Client profile fixes applied' AS status;
