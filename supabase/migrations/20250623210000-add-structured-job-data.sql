
-- Add columns for structured job data
ALTER TABLE public.cached_jobs 
ADD COLUMN job_highlights TEXT,
ADD COLUMN requirements TEXT,
ADD COLUMN responsibilities TEXT,
ADD COLUMN benefits TEXT;

-- Add indexes for better performance on new columns
CREATE INDEX idx_cached_jobs_highlights ON public.cached_jobs USING gin ((job_highlights::jsonb)) WHERE job_highlights IS NOT NULL;
CREATE INDEX idx_cached_jobs_requirements ON public.cached_jobs USING gin ((requirements::jsonb)) WHERE requirements IS NOT NULL;
CREATE INDEX idx_cached_jobs_responsibilities ON public.cached_jobs USING gin ((responsibilities::jsonb)) WHERE responsibilities IS NOT NULL;
