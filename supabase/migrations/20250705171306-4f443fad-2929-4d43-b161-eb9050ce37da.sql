-- Directly grant premium access to test user tcurry0725@gmail.com
-- Update profiles table to premium
UPDATE public.profiles 
SET 
  plan_level = 'premium',
  updated_at = now()
WHERE id = 'f1c51aae-0e4b-497e-924c-d904ef93cd43';

-- Update subscribers table to premium with 1 year subscription
UPDATE public.subscribers 
SET 
  subscribed = true,
  subscription_tier = 'premium',
  subscription_end = (now() + interval '1 year'),
  updated_at = now()
WHERE email = 'tcurry0725@gmail.com';