-- Update subscriber record for yani.curry@gmail.com to premium
UPDATE public.subscribers 
SET 
  subscribed = true,
  subscription_tier = 'Premium',
  subscription_end = now() + interval '1 year',
  updated_at = now()
WHERE email = 'yani.curry@gmail.com';

-- Update profile record to premium (if plan_level column exists)
UPDATE public.profiles 
SET 
  plan_level = 'premium',
  updated_at = now()
WHERE id = '6f80fcb9-2c42-41a0-a785-78d705d7179b';