-- Ensure test user has premium in both tables
UPDATE public.profiles 
SET plan_level = 'premium', updated_at = now()
WHERE email = 'tcurry0725@gmail.com';

UPDATE public.subscribers 
SET 
  subscribed = true,
  subscription_tier = 'premium',
  subscription_end = '2025-12-31 23:59:59+00',
  updated_at = now()
WHERE email = 'tcurry0725@gmail.com';