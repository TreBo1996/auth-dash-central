-- Grant premium access to yani.curry@gmail.com
INSERT INTO public.subscribers (
  email,
  subscribed,
  subscription_tier,
  subscription_end,
  updated_at,
  created_at
) VALUES (
  'yani.curry@gmail.com',
  true,
  'premium',
  '2025-12-31T23:59:59+00:00', -- Premium access through end of 2025
  now(),
  now()
) 
ON CONFLICT (email) 
DO UPDATE SET
  subscribed = true,
  subscription_tier = 'premium',
  subscription_end = '2025-12-31T23:59:59+00:00',
  updated_at = now();