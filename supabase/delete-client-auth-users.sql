-- Delete ONLY client portal auth users (safe preview + founder guard)
-- Run in Supabase SQL Editor. NEVER delete founder emails here.

-- ─── 1) Preview (must show user_type = client) ───────────────────────────────
SELECT
  u.id,
  u.email,
  p.user_type,
  p.portal_client_id,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email IN ('ubs@gmail.com', 'rindorecar@gmail.com');

-- STOP if any row has user_type = 'founder' or portal_client_id IS NULL
-- unless you are sure that account is only a test client login.

-- ─── 2) Portal cleanup ───────────────────────────────────────────────────────
DELETE FROM public.client_project_access
WHERE client_profile_id IN (
  SELECT p.id FROM public.profiles p
  WHERE p.email IN ('ubs@gmail.com', 'rindorecar@gmail.com')
    AND p.user_type = 'client'
);

DELETE FROM public.client_feedback
WHERE author_id IN (
  SELECT p.id FROM public.profiles p
  WHERE p.email IN ('ubs@gmail.com', 'rindorecar@gmail.com')
    AND p.user_type = 'client'
);

-- ─── 3) Delete auth users — CLIENT ONLY ────────────────────────────────────────
DELETE FROM auth.users u
USING public.profiles p
WHERE p.id = u.id
  AND p.user_type = 'client'
  AND u.email IN ('ubs@gmail.com', 'rindorecar@gmail.com');

-- ─── 4) Verify ───────────────────────────────────────────────────────────────
SELECT id, email FROM auth.users
WHERE email IN ('ubs@gmail.com', 'rindorecar@gmail.com');

SELECT 'Done — only client portal users removed' AS status;
