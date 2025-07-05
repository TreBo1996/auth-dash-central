-- Fix the search_jobs function data type issue
CREATE OR REPLACE FUNCTION public.search_jobs(
  search_query text DEFAULT ''::text, 
  location_filter text DEFAULT ''::text, 
  remote_filter text DEFAULT ''::text, 
  employment_type_filter text DEFAULT ''::text, 
  seniority_filter text DEFAULT ''::text, 
  company_filter text DEFAULT ''::text, 
  max_age_days integer DEFAULT 30, 
  result_limit integer DEFAULT 50, 
  result_offset integer DEFAULT 0
)
RETURNS TABLE(
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
)
LANGUAGE plpgsql
AS $function$
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
      WHEN search_query = '' THEN 1.0::real
      ELSE 
        -- Enhanced relevance scoring with title prioritization
        ((
          -- Heavy weight for exact title matches (10x multiplier)
          CASE WHEN LOWER(j.title) ILIKE '%' || LOWER(search_query) || '%' THEN 10.0 ELSE 0.0 END +
          -- Medium weight for title word matches (5x multiplier)  
          CASE WHEN to_tsvector('english', j.title) @@ websearch_to_tsquery('english', search_query) THEN 5.0 ELSE 0.0 END +
          -- Base weight for full-text search across all fields (1x)
          ts_rank(j.search_vector, websearch_to_tsquery('english', search_query)) +
          -- Bonus for quality score (normalized to 0-1 range)
          (j.quality_score::real / 10.0)
        ))::real
    END as relevance_score
  FROM public.cached_jobs j
  WHERE 
    (j.scraped_at > now() - (max_age_days || ' days')::interval)
    AND (j.is_expired = false OR j.is_expired IS NULL)
    AND (
      search_query = '' OR 
      -- Prioritize title matches first
      LOWER(j.title) ILIKE '%' || LOWER(search_query) || '%' OR
      -- Then check full-text search
      j.search_vector @@ websearch_to_tsquery('english', search_query)
    )
    AND (location_filter = '' OR j.location ILIKE '%' || location_filter || '%')
    AND (remote_filter = '' OR j.remote_type = remote_filter)
    AND (employment_type_filter = '' OR j.employment_type = employment_type_filter)
    AND (seniority_filter = '' OR j.seniority_level = seniority_filter)
    AND (company_filter = '' OR j.company ILIKE '%' || company_filter || '%')
  ORDER BY 
    -- First priority: jobs with search terms in title (if searching)
    CASE WHEN search_query = '' THEN 0 
         WHEN LOWER(j.title) ILIKE '%' || LOWER(search_query) || '%' THEN 1 
         ELSE 0 END DESC,
    -- Second priority: relevance score (includes title weighting)
    CASE WHEN search_query != '' THEN 
      ((
        CASE WHEN LOWER(j.title) ILIKE '%' || LOWER(search_query) || '%' THEN 10.0 ELSE 0.0 END +
        CASE WHEN to_tsvector('english', j.title) @@ websearch_to_tsquery('english', search_query) THEN 5.0 ELSE 0.0 END +
        ts_rank(j.search_vector, websearch_to_tsquery('english', search_query)) +
        (j.quality_score::real / 10.0)
      ))::real
    END DESC,
    -- Third priority: quality score
    j.quality_score DESC,
    -- Fourth priority: recency
    j.scraped_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$function$