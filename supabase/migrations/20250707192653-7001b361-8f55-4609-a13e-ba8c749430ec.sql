-- Performance optimization for job search - Phase 1: Database Indexes
-- Add composite indexes for common search patterns to dramatically improve query performance

-- Index for title + location searches (most common pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cached_jobs_title_location_scraped 
ON public.cached_jobs (title, location, scraped_at DESC) 
WHERE archived_at IS NULL AND (is_expired = FALSE OR is_expired IS NULL);

-- Index for company searches with recency
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cached_jobs_company_scraped 
ON public.cached_jobs (company, scraped_at DESC) 
WHERE archived_at IS NULL AND (is_expired = FALSE OR is_expired IS NULL);

-- Index for filter combinations (employment type + seniority)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cached_jobs_filters_scraped 
ON public.cached_jobs (employment_type, seniority_level, remote_type, scraped_at DESC) 
WHERE archived_at IS NULL AND (is_expired = FALSE OR is_expired IS NULL);

-- Index for quality score + recency (for ranking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cached_jobs_quality_scraped 
ON public.cached_jobs (quality_score DESC, scraped_at DESC) 
WHERE archived_at IS NULL AND (is_expired = FALSE OR is_expired IS NULL) AND quality_score >= 3;

-- Optimize full-text search vector index
DROP INDEX IF EXISTS idx_cached_jobs_search_vector;
CREATE INDEX idx_cached_jobs_search_vector_gin 
ON public.cached_jobs USING GIN (search_vector) 
WHERE archived_at IS NULL AND (is_expired = FALSE OR is_expired IS NULL) AND quality_score >= 3;

-- Create materialized view for hot searches (updated every 15 minutes)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.hot_job_searches AS
SELECT 
  j.id, j.title, j.company, j.location, j.description, j.salary, j.posted_at,
  j.job_url, j.apply_url, j.source, j.via, j.thumbnail, j.logo_url, j.job_type,
  j.employment_type, j.experience_level, j.seniority_level, j.remote_type,
  j.company_size, j.industry, j.job_function, j.scraped_at, j.quality_score,
  -- Pre-calculate relevance for common search terms
  CASE 
    WHEN LOWER(j.title) ILIKE '%software engineer%' THEN 10.0
    WHEN LOWER(j.title) ILIKE '%project manager%' THEN 10.0
    WHEN LOWER(j.title) ILIKE '%data analyst%' THEN 10.0
    WHEN LOWER(j.title) ILIKE '%marketing%' THEN 8.0
    WHEN LOWER(j.title) ILIKE '%sales%' THEN 8.0
    ELSE 5.0
  END as pre_calculated_relevance
FROM public.cached_jobs j
WHERE 
  j.quality_score >= 5
  AND (j.scraped_at > now() - INTERVAL '30 days')
  AND (j.is_expired = false OR j.is_expired IS NULL)
  AND (j.archived_at IS NULL)
  AND public.is_valid_job_title(j.title);

-- Index on materialized view
CREATE INDEX idx_hot_job_searches_title ON public.hot_job_searches (title);
CREATE INDEX idx_hot_job_searches_company ON public.hot_job_searches (company);
CREATE INDEX idx_hot_job_searches_location ON public.hot_job_searches (location);

-- Create optimized search function for cached results
CREATE OR REPLACE FUNCTION public.fast_search_jobs(
  search_query text DEFAULT ''::text, 
  location_filter text DEFAULT ''::text, 
  employment_type_filter text DEFAULT ''::text, 
  seniority_filter text DEFAULT ''::text, 
  company_filter text DEFAULT ''::text, 
  result_limit integer DEFAULT 50, 
  result_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, title text, company text, location text, description text, 
  salary text, posted_at text, job_url text, apply_url text, source text, 
  via text, thumbnail text, logo_url text, job_type text, employment_type text, 
  experience_level text, seniority_level text, remote_type text, company_size text, 
  industry text, job_function text, scraped_at timestamp with time zone, 
  quality_score integer, relevance_score real
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- For hot searches, use materialized view first
  IF search_query ILIKE ANY(ARRAY['%software engineer%', '%project manager%', '%data analyst%', '%marketing%', '%sales%']) THEN
    RETURN QUERY
    SELECT 
      h.id, h.title, h.company, h.location, h.description, h.salary, h.posted_at,
      h.job_url, h.apply_url, h.source, h.via, h.thumbnail, h.logo_url, h.job_type,
      h.employment_type, h.experience_level, h.seniority_level, h.remote_type,
      h.company_size, h.industry, h.job_function, h.scraped_at, h.quality_score,
      h.pre_calculated_relevance::real as relevance_score
    FROM public.hot_job_searches h
    WHERE 
      (search_query = '' OR LOWER(h.title) ILIKE '%' || LOWER(search_query) || '%')
      AND (location_filter = '' OR h.location ILIKE '%' || location_filter || '%')
      AND (employment_type_filter = '' OR h.employment_type = employment_type_filter)
      AND (seniority_filter = '' OR h.seniority_level = seniority_filter)
      AND (company_filter = '' OR h.company ILIKE '%' || company_filter || '%')
    ORDER BY 
      h.pre_calculated_relevance DESC,
      h.quality_score DESC,
      h.scraped_at DESC
    LIMIT result_limit
    OFFSET result_offset;
  ELSE
    -- Fall back to optimized main search
    RETURN QUERY
    SELECT * FROM public.search_jobs(
      search_query, location_filter, '', employment_type_filter, 
      seniority_filter, company_filter, 30, result_limit, result_offset
    );
  END IF;
END;
$$;