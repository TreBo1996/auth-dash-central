
-- Add unique constraint to job_searches table for search_query
ALTER TABLE public.job_searches ADD CONSTRAINT unique_search_query UNIQUE (search_query);

-- Verify that job_url already has unique constraint (it should from the table creation)
-- If not, this will add it (but it should already exist from the CREATE TABLE statement)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cached_jobs_job_url_key' 
        AND table_name = 'cached_jobs'
    ) THEN
        ALTER TABLE public.cached_jobs ADD CONSTRAINT unique_job_url UNIQUE (job_url);
    END IF;
END $$;
