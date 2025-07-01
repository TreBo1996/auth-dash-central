
-- Fix the database trigger to properly read intended_role from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_with_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert into profiles (existing functionality)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  -- Insert role based on intended_role from metadata, defaulting to job_seeker
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id, 
    COALESCE(
      (new.raw_user_meta_data->>'intended_role')::app_role, 
      'job_seeker'::app_role
    )
  );
  
  -- Set role preference to match the assigned role
  INSERT INTO public.user_role_preferences (user_id, preferred_role)
  VALUES (
    new.id,
    COALESCE(
      (new.raw_user_meta_data->>'intended_role')::app_role, 
      'job_seeker'::app_role
    )
  );
  
  RETURN new;
END;
$$;

-- Fix the current test user's role to match their intended role
UPDATE public.user_roles 
SET role = 'employer'::app_role 
WHERE user_id = 'cbb0c0aa-ff8e-4803-939e-ab1097850cc7' 
  AND role = 'job_seeker'::app_role;

-- Also update their role preference
UPDATE public.user_role_preferences 
SET preferred_role = 'employer'::app_role 
WHERE user_id = 'cbb0c0aa-ff8e-4803-939e-ab1097850cc7' 
  AND preferred_role = 'job_seeker'::app_role;
