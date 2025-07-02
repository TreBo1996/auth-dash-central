
-- Add is_admin field to profiles table
ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Set admin status for the test user
UPDATE public.profiles 
SET is_admin = TRUE 
WHERE email = 'tcurry0725@gmail.com';

-- Add archived_at field to cached_jobs table for job archival
ALTER TABLE public.cached_jobs ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;

-- Create function to archive old jobs (older than 3 months)
CREATE OR REPLACE FUNCTION public.archive_old_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Archive jobs older than 3 months that aren't already archived
  UPDATE public.cached_jobs 
  SET archived_at = now(), updated_at = now()
  WHERE scraped_at < (now() - INTERVAL '3 months')
    AND archived_at IS NULL;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN archived_count;
END;
$$;

-- Create function to get job statistics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_job_statistics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_active_jobs', (
      SELECT COUNT(*) FROM public.cached_jobs 
      WHERE archived_at IS NULL AND (is_expired = FALSE OR is_expired IS NULL)
    ),
    'jobs_today', (
      SELECT COUNT(*) FROM public.cached_jobs 
      WHERE scraped_at >= CURRENT_DATE AND archived_at IS NULL
    ),
    'jobs_this_week', (
      SELECT COUNT(*) FROM public.cached_jobs 
      WHERE scraped_at >= (CURRENT_DATE - INTERVAL '7 days') AND archived_at IS NULL
    ),
    'archived_jobs', (
      SELECT COUNT(*) FROM public.cached_jobs 
      WHERE archived_at IS NOT NULL
    ),
    'last_scrape_time', (
      SELECT MAX(scraped_at) FROM public.cached_jobs
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;
