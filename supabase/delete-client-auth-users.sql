-- Delete misconfigured client auth users (run in Supabase SQL Editor)
-- Safe preview first, then uncomment DELETE block at bottom.

-- ─── 1) Preview accounts to remove ───────────────────────────────────────────
SELECT
  u.id,
  u.email,
  u.created_at,
  p.user_type,
  p.portal_client_id,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email IN (
  'ubs@gmail.com',
  'rindorecar@gmail.com'
)
   OR u.id IN (
  '191ffec8-aa7f-46d9-bf98-935c2f9c7fd1'  -- ubs@gmail.com (from your profiles export)
  -- add second UUID here if you have it:
  -- ,'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
);

-- ─── 2) Clean portal-related rows (if tables exist) ──────────────────────────
DELETE FROM public.client_project_access
WHERE client_profile_id IN (
  SELECT id FROM auth.users
  WHERE email IN ('ubs@gmail.com', 'rindorecar@gmail.com')
     OR id = '191ffec8-aa7f-46d9-bf98-935c2f9c7fd1'
);

DELETE FROM public.client_feedback
WHERE author_id IN (
  SELECT id FROM auth.users
  WHERE email IN ('ubs@gmail.com', 'rindorecar@gmail.com')
     OR id = '191ffec8-aa7f-46d9-bf98-935c2f9c7fd1'
);

-- ─── 3) Delete auth users (profiles row cascades via FK) ─────────────────────
DELETE FROM auth.users
WHERE email IN ('ubs@gmail.com', 'rindorecar@gmail.com')
   OR id = '191ffec8-aa7f-46d9-bf98-935c2f9c7fd1';

-- ─── 4) Verify ───────────────────────────────────────────────────────────────
SELECT id, email FROM auth.users
WHERE email IN ('ubs@gmail.com', 'rindorecar@gmail.com')
   OR id = '191ffec8-aa7f-46d9-bf98-935c2f9c7fd1';

SELECT 'Done — users removed' AS status;
