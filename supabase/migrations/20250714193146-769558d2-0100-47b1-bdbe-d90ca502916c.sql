-- Add application tracking fields to job_descriptions table
ALTER TABLE public.job_descriptions 
ADD COLUMN is_applied BOOLEAN DEFAULT FALSE,
ADD COLUMN is_saved BOOLEAN DEFAULT FALSE;

-- Add helpful comment
COMMENT ON COLUMN public.job_descriptions.is_applied IS 'Whether the user has applied to this job';
COMMENT ON COLUMN public.job_descriptions.is_saved IS 'Whether the user has manually saved this job';