-- Update yani.curry@gmail.com to premium status in subscribers table
UPDATE public.subscribers 
SET 
  subscribed = true,
  subscription_tier = 'premium',
  subscription_end = '2026-07-05T17:15:00.000Z',
  updated_at = now()
WHERE email = 'yani.curry@gmail.com';

-- Update the profiles table to set plan_level to premium for yani.curry@gmail.com
UPDATE public.profiles 
SET 
  plan_level = 'premium',
  updated_at = now()
WHERE id = '6f80fcb9-2c42-41a0-a785-78d705d7179b';