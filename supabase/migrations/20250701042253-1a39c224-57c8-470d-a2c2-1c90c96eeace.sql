
-- Add unique constraint on apify_job_id to enable proper upsert functionality
ALTER TABLE public.cached_jobs 
ADD CONSTRAINT unique_apify_job_id UNIQUE (apify_job_id);

-- Create an index on apify_job_id for better performance
CREATE INDEX IF NOT EXISTS idx_cached_jobs_apify_job_id ON public.cached_jobs(apify_job_id);
