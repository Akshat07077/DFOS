-- Run AFTER creating user in Dashboard → Authentication → Users → Add user
-- Email: messageakshat@gmail.com | Password: Admin@123 | Auto-confirm: ON

INSERT INTO public.profiles (id, email, full_name)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Akshat Sarma')
FROM auth.users
WHERE email = 'Admin@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Akshat Sarma',
  email = EXCLUDED.email;

SELECT id, email, full_name FROM public.profiles
WHERE email = 'Admin@gmail.com';
