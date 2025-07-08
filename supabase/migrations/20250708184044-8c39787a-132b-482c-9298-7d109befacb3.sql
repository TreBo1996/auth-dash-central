-- Add trigger to sync job postings to cached_jobs on insert/update
CREATE OR REPLACE FUNCTION sync_job_posting_to_cached_jobs()
RETURNS TRIGGER AS $$
DECLARE
  employer_profile RECORD;
  salary_text TEXT;
BEGIN
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
    apify_job_id
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
    'employer_' || NEW.id
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
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE
DROP TRIGGER IF EXISTS sync_job_posting_trigger ON public.job_postings;
CREATE TRIGGER sync_job_posting_trigger
  AFTER INSERT OR UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION sync_job_posting_to_cached_jobs();

-- Sync existing job postings
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
  apify_job_id
)
SELECT 
  jp.title,
  ep.company_name,
  jp.location,
  jp.description,
  CASE 
    WHEN jp.salary_min IS NOT NULL AND jp.salary_max IS NOT NULL THEN 
      '$' || jp.salary_min || ' - $' || jp.salary_max || ' ' || jp.salary_currency
    WHEN jp.salary_min IS NOT NULL THEN 
      '$' || jp.salary_min || '+ ' || jp.salary_currency
    WHEN jp.salary_max IS NOT NULL THEN 
      'Up to $' || jp.salary_max || ' ' || jp.salary_currency
    ELSE NULL
  END,
  '/job-posting/' || jp.id,
  '/job-posting/' || jp.id,
  'Employer',
  ep.company_name,
  jp.employment_type,
  jp.experience_level,
  jp.seniority_level,
  jp.remote_type,
  jp.industry,
  jp.job_function,
  'employer',
  'Direct',
  10,
  'employer_' || jp.id
FROM public.job_postings jp
JOIN public.employer_profiles ep ON ep.id = jp.employer_id
WHERE jp.is_active = true
ON CONFLICT (apify_job_id) DO NOTHING;