-- Phase 1: Fix the get_employer_profile_id function with proper error handling
DROP FUNCTION IF EXISTS public.get_employer_profile_id();

CREATE OR REPLACE FUNCTION public.get_employer_profile_id()
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
  profile_id UUID;
BEGIN
  -- Get the current user ID from the JWT context
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

-- Phase 2: Fix the sync trigger to run with SECURITY DEFINER
DROP FUNCTION IF EXISTS public.sync_job_posting_to_cached_jobs();

CREATE OR REPLACE FUNCTION public.sync_job_posting_to_cached_jobs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
  employer_profile RECORD;
  salary_text TEXT;
BEGIN
  -- Handle DELETE operations
  IF TG_OP = 'DELETE' THEN
    UPDATE public.cached_jobs 
    SET 
      is_expired = true,
      archived_at = now(),
      updated_at = now()
    WHERE apify_job_id = 'employer_' || OLD.id;
    
    RETURN OLD;
  END IF;
  
  -- Handle INSERT and UPDATE operations
  -- Get employer profile information
  SELECT * INTO employer_profile 
  FROM public.employer_profiles 
  WHERE id = NEW.employer_id;
  
  -- Format salary text
  IF NEW.salary_min IS NOT NULL AND NEW.salary_max IS NOT NULL THEN
    salary_text := '$' || NEW.salary_min || ' - $' || NEW.salary_max || ' ' || NEW.salary_currency;
  ELSIF NEW.salary_min IS NOT NULL THEN
    salary_text := '$' || NEW.salary_min || '+ ' || NEW.salary_currency;
  ELSIF NEW.salary_max IS NOT NULL THEN
    salary_text := 'Up to $' || NEW.salary_max || ' ' || NEW.salary_currency;
  END IF;
  
  -- Insert or update in cached_jobs with SECURITY DEFINER privileges
  INSERT INTO public.cached_jobs (
    title,
    company,
    location,
    description,
    salary,
    job_url,
    apply_url,
    source,
    via,
    employment_type,
    experience_level,
    seniority_level,
    remote_type,
    industry,
    job_function,
    data_source,
    job_board,
    quality_score,
    apify_job_id,
    is_expired,
    archived_at
  ) VALUES (
    NEW.title,
    employer_profile.company_name,
    NEW.location,
    NEW.description,
    salary_text,
    '/job-posting/' || NEW.id,
    '/job-posting/' || NEW.id,
    'Employer',
    employer_profile.company_name,
    NEW.employment_type,
    NEW.experience_level,
    NEW.seniority_level,
    NEW.remote_type,
    NEW.industry,
    NEW.job_function,
    'employer',
    'Direct',
    10, -- Higher quality score for direct employer postings
    'employer_' || NEW.id,
    CASE WHEN NEW.is_active = false THEN true ELSE false END,
    CASE WHEN NEW.is_active = false THEN now() ELSE NULL END
  )
  ON CONFLICT (apify_job_id) 
  DO UPDATE SET
    title = EXCLUDED.title,
    company = EXCLUDED.company,
    location = EXCLUDED.location,
    description = EXCLUDED.description,
    salary = EXCLUDED.salary,
    employment_type = EXCLUDED.employment_type,
    experience_level = EXCLUDED.experience_level,
    seniority_level = EXCLUDED.seniority_level,
    remote_type = EXCLUDED.remote_type,
    industry = EXCLUDED.industry,
    job_function = EXCLUDED.job_function,
    is_expired = CASE WHEN NEW.is_active = false THEN true ELSE false END,
    archived_at = CASE WHEN NEW.is_active = false THEN now() ELSE NULL END,
    updated_at = now();
    
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS sync_job_posting_trigger ON public.job_postings;
CREATE TRIGGER sync_job_posting_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.sync_job_posting_to_cached_jobs();

-- Phase 3: Update RLS policies to be more robust
DROP POLICY IF EXISTS "Employers can manage their job postings" ON public.job_postings;

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