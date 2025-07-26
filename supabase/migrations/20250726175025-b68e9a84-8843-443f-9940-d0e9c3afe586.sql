-- Add job_page_link column to cached_jobs table
ALTER TABLE public.cached_jobs 
ADD COLUMN job_page_link TEXT;

-- Update existing records to populate job_page_link based on data_source
UPDATE public.cached_jobs 
SET job_page_link = CASE 
  WHEN data_source = 'employer' AND apify_job_id LIKE 'employer_%' THEN 
    '/job-posting/' || SUBSTRING(apify_job_id FROM 10)
  WHEN data_source = 'apify' OR data_source IS NULL THEN 
    '/job/database/' || id::text
  ELSE 
    '/job/database/' || id::text
END
WHERE job_page_link IS NULL;

-- Update the sync trigger to set job_page_link for employer jobs
CREATE OR REPLACE FUNCTION public.sync_job_posting_to_cached_jobs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    job_page_link,
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
    job_page_link = EXCLUDED.job_page_link,
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
$function$;