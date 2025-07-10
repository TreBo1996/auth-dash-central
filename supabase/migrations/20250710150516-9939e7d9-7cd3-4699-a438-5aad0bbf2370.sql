-- Create a security definer function to get employer profile ID for current user
-- This breaks the circular dependency in RLS policies
CREATE OR REPLACE FUNCTION public.get_employer_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.employer_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop the existing job_postings RLS policy that causes circular dependency
DROP POLICY IF EXISTS "Employers can manage their job postings" ON public.job_postings;

-- Create a new policy that uses the security definer function to avoid recursion
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