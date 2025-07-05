-- Upgrade test user tcurry0725@gmail.com to premium subscription
-- Update subscribers table
INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, subscription_end, updated_at)
SELECT 
  id, 
  'tcurry0725@gmail.com', 
  true, 
  'premium', 
  (now() + interval '1 year'),
  now()
FROM auth.users 
WHERE email = 'tcurry0725@gmail.com'
ON CONFLICT (email) 
DO UPDATE SET
  subscribed = true,
  subscription_tier = 'premium',
  subscription_end = (now() + interval '1 year'),
  updated_at = now();

-- Update profiles table  
UPDATE public.profiles 
SET 
  plan_level = 'premium',
  updated_at = now()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'tcurry0725@gmail.com'
);