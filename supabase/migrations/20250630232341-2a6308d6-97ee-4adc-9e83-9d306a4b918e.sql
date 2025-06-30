
-- Add full-text search capabilities and Apify-specific columns to cached_jobs
ALTER TABLE public.cached_jobs 
ADD COLUMN IF NOT EXISTS search_vector tsvector,
ADD COLUMN IF NOT EXISTS apify_job_id text,
ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'apify',
ADD COLUMN IF NOT EXISTS job_board text,
ADD COLUMN IF NOT EXISTS remote_type text,
ADD COLUMN IF NOT EXISTS company_size text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS employment_type text,
ADD COLUMN IF NOT EXISTS seniority_level text,
ADD COLUMN IF NOT EXISTS apply_url text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS job_function text,
ADD COLUMN IF NOT EXISTS scraped_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS quality_score integer DEFAULT 5;

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_cached_jobs_search_vector ON public.cached_jobs USING gin(search_vector);

-- Create index for Apify job ID for deduplication
CREATE INDEX IF NOT EXISTS idx_cached_jobs_apify_id ON public.cached_jobs(apify_job_id);

-- Create indexes for common search filters
CREATE INDEX IF NOT EXISTS idx_cached_jobs_remote_type ON public.cached_jobs(remote_type);
CREATE INDEX IF NOT EXISTS idx_cached_jobs_employment_type ON public.cached_jobs(employment_type);
CREATE INDEX IF NOT EXISTS idx_cached_jobs_seniority_level ON public.cached_jobs(seniority_level);
CREATE INDEX IF NOT EXISTS idx_cached_jobs_scraped_at ON public.cached_jobs(scraped_at);

-- Create function to update search vector automatically
CREATE OR REPLACE FUNCTION public.update_job_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.company, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.location, '') || ' ' ||
    COALESCE(NEW.job_function, '') || ' ' ||
    COALESCE(NEW.industry, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS trigger_update_job_search_vector ON public.cached_jobs;
CREATE TRIGGER trigger_update_job_search_vector
  BEFORE INSERT OR UPDATE ON public.cached_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_search_vector();

-- Create function for advanced job search
CREATE OR REPLACE FUNCTION public.search_jobs(
  search_query text DEFAULT '',
  location_filter text DEFAULT '',
  remote_filter text DEFAULT '',
  employment_type_filter text DEFAULT '',
  seniority_filter text DEFAULT '',
  company_filter text DEFAULT '',
  max_age_days integer DEFAULT 30,
  result_limit integer DEFAULT 50,
  result_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  company text,
  location text,
  description text,
  salary text,
  posted_at text,
  job_url text,
  apply_url text,
  source text,
  via text,
  thumbnail text,
  logo_url text,
  job_type text,
  employment_type text,
  experience_level text,
  seniority_level text,
  remote_type text,
  company_size text,
  industry text,
  job_function text,
  scraped_at timestamp with time zone,
  quality_score integer,
  relevance_score real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.title,
    j.company,
    j.location,
    j.description,
    j.salary,
    j.posted_at,
    j.job_url,
    j.apply_url,
    j.source,
    j.via,
    j.thumbnail,
    j.logo_url,
    j.job_type,
    j.employment_type,
    j.experience_level,
    j.seniority_level,
    j.remote_type,
    j.company_size,
    j.industry,
    j.job_function,
    j.scraped_at,
    j.quality_score,
    CASE 
      WHEN search_query = '' THEN 1.0
      ELSE ts_rank(j.search_vector, websearch_to_tsquery('english', search_query))
    END as relevance_score
  FROM public.cached_jobs j
  WHERE 
    (j.scraped_at > now() - (max_age_days || ' days')::interval)
    AND (j.is_expired = false OR j.is_expired IS NULL)
    AND (search_query = '' OR j.search_vector @@ websearch_to_tsquery('english', search_query))
    AND (location_filter = '' OR j.location ILIKE '%' || location_filter || '%')
    AND (remote_filter = '' OR j.remote_type = remote_filter)
    AND (employment_type_filter = '' OR j.employment_type = employment_type_filter)
    AND (seniority_filter = '' OR j.seniority_level = seniority_filter)
    AND (company_filter = '' OR j.company ILIKE '%' || company_filter || '%')
  ORDER BY 
    CASE 
      WHEN search_query = '' THEN j.scraped_at
      ELSE ts_rank(j.search_vector, websearch_to_tsquery('english', search_query))
    END DESC,
    j.quality_score DESC,
    j.scraped_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;

-- Update existing search vectors for current data
UPDATE public.cached_jobs 
SET search_vector = to_tsvector('english', 
  COALESCE(title, '') || ' ' ||
  COALESCE(company, '') || ' ' ||
  COALESCE(description, '') || ' ' ||
  COALESCE(location, '')
)
WHERE search_vector IS NULL;
