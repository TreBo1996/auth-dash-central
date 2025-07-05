-- Force premium access for test user with explicit commits
BEGIN;

-- Direct update to profiles
UPDATE public.profiles 
SET plan_level = 'premium'
WHERE email = 'tcurry0725@gmail.com';

-- Direct update to subscribers
UPDATE public.subscribers 
SET 
  subscribed = true,
  subscription_tier = 'premium',
  subscription_end = '2026-07-05 17:15:00+00'::timestamptz
WHERE email = 'tcurry0725@gmail.com';

COMMIT;