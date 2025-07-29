-- Create a SECURITY DEFINER function to bypass RLS and update premium user status
CREATE OR REPLACE FUNCTION public.update_user_to_premium(target_email text, target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update subscriber record
  UPDATE public.subscribers 
  SET 
    subscribed = true,
    subscription_tier = 'Premium',
    subscription_end = now() + interval '1 year',
    updated_at = now()
  WHERE email = target_email;
  
  -- Update profile record (if plan_level column exists)
  UPDATE public.profiles 
  SET 
    plan_level = 'premium',
    updated_at = now()
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$;

-- Call the function to update yani.curry@gmail.com to premium
SELECT public.update_user_to_premium('yani.curry@gmail.com', '6f80fcb9-2c42-41a0-a785-78d705d7179b');

-- Drop the function after use (cleanup)
DROP FUNCTION IF EXISTS public.update_user_to_premium(text, uuid);