-- Update the sync function to handle DELETE operations and is_active changes
CREATE OR REPLACE FUNCTION public.sync_job_posting_to_cached_jobs()
RETURNS TRIGGER AS $$
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
  
  -- Insert or update in cached_jobs
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
$$ LANGUAGE plpgsql;

-- Drop the existing trigger and recreate it to handle DELETE operations
DROP TRIGGER IF EXISTS sync_job_posting_trigger ON public.job_postings;

CREATE TRIGGER sync_job_posting_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_job_posting_to_cached_jobs();

-- Clean up existing orphaned entries - mark cached jobs as expired if their job posting no longer exists or is inactive
UPDATE public.cached_jobs 
SET 
  is_expired = true,
  archived_at = now(),
  updated_at = now()
WHERE 
  data_source = 'employer'
  AND apify_job_id LIKE 'employer_%'
  AND (
    -- Job posting was deleted
    NOT EXISTS (
      SELECT 1 FROM public.job_postings 
      WHERE 'employer_' || id = cached_jobs.apify_job_id
    )
    OR
    -- Job posting is inactive
    EXISTS (
      SELECT 1 FROM public.job_postings 
      WHERE 'employer_' || id = cached_jobs.apify_job_id 
      AND is_active = false
    )
  )
  AND (is_expired = false OR is_expired IS NULL);