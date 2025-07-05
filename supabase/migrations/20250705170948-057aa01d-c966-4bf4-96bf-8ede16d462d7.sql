-- Fix the premium upgrade for tcurry0725@gmail.com
-- First update the profiles table
UPDATE public.profiles 
SET 
  plan_level = 'premium',
  updated_at = now()
WHERE id = 'f1c51aae-0e4b-497e-924c-d904ef93cd43';

-- Then upsert the subscribers table
INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, subscription_end, updated_at)
VALUES (
  'f1c51aae-0e4b-497e-924c-d904ef93cd43',
  'tcurry0725@gmail.com',
  true,
  'premium',
  (now() + interval '1 year'),
  now()
)
ON CONFLICT (email) 
DO UPDATE SET
  user_id = EXCLUDED.user_id,
  subscribed = true,
  subscription_tier = 'premium',
  subscription_end = (now() + interval '1 year'),
  updated_at = now();