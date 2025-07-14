-- Fix the get_employer_profile_id function to work properly in RLS context
-- The current function returns null because auth.uid() may not work in security definer context
DROP FUNCTION IF EXISTS public.get_employer_profile_id();

CREATE OR REPLACE FUNCTION public.get_employer_profile_id()
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
  profile_id UUID;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Return null if no authenticated user
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the employer profile ID for the current user
  SELECT id INTO profile_id 
  FROM public.employer_profiles 
  WHERE user_id = current_user_id 
  LIMIT 1;
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;