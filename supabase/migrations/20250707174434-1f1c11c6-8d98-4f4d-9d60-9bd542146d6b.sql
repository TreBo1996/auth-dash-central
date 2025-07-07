-- Fix recent marketing jobs that were missed by the previous migration
-- Remove the restrictive time condition that excluded recently scraped jobs

UPDATE public.cached_jobs 
SET 
  title = COALESCE(extract_job_title_from_description(description), title),
  updated_at = now()
WHERE 
  -- Target jobs with generic search query titles (including the specific patterns)
  (title ~* '^(marketing|sales|engineer|software engineer|developer|manager|analyst|business analyst|project manager|account executive)$')
  -- Only update if we can extract a better title from description
  AND extract_job_title_from_description(description) IS NOT NULL
  -- Remove the time restriction - fix all generic titles regardless of scrape time
  AND description IS NOT NULL;

-- Log the results
DO $$
DECLARE
  update_count INTEGER;
BEGIN
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % additional job titles that were missed by previous migration', update_count;
END;
$$;