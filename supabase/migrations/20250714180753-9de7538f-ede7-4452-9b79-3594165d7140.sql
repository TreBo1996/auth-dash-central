-- First drop the policy that depends on the function
DROP POLICY IF EXISTS "Employers can manage their job postings" ON public.job_postings;

-- Drop and recreate the get_employer_profile_id function
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

-- Recreate the policy using the fixed function
CREATE POLICY "Employers can manage their job postings" 
ON public.job_postings 
FOR ALL 
USING (
  employer_id = public.get_employer_profile_id() 
  AND has_role(auth.uid(), 'employer'::app_role)
) 
WITH CHECK (
  employer_id = public.get_employer_profile_id() 
  AND has_role(auth.uid(), 'employer'::app_role)
);