-- Update search_jobs function to prioritize employer jobs
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
  id uuid, title text, company text, location text, description text, 
  salary text, posted_at text, job_url text, apply_url text, source text, 
  via text, thumbnail text, logo_url text, job_type text, employment_type text, 
  experience_level text, seniority_level text, remote_type text, company_size text, 
  industry text, job_function text, scraped_at timestamp with time zone, 
  quality_score integer, relevance_score real
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    j.id, j.title, j.company, j.location, j.description, j.salary, j.posted_at,
    j.job_url, j.apply_url, j.source, j.via, j.thumbnail, j.logo_url, j.job_type,
    j.employment_type, j.experience_level, j.seniority_level, j.remote_type,
    j.company_size, j.industry, j.job_function, j.scraped_at, j.quality_score,
    CASE 
      WHEN search_query = '' THEN 1.0::real
      ELSE 
        ((
          -- Heavy weight for exact title matches (10x multiplier)
          CASE WHEN LOWER(j.title) ILIKE '%' || LOWER(search_query) || '%' THEN 10.0 ELSE 0.0 END +
          -- Medium weight for title word matches (5x multiplier)  
          CASE WHEN to_tsvector('english', j.title) @@ websearch_to_tsquery('english', search_query) THEN 5.0 ELSE 0.0 END +
          -- Base weight for full-text search across all fields (1x)
          ts_rank(j.search_vector, websearch_to_tsquery('english', search_query)) +
          -- Quality score bonus (normalized to 0-1 range)
          (j.quality_score::real / 10.0)
        ))::real
    END as relevance_score
  FROM public.cached_jobs j
  WHERE 
    -- Only include jobs with valid titles and minimum quality
    public.is_valid_job_title(j.title)
    AND j.quality_score >= 3
    AND (j.scraped_at > now() - (max_age_days || ' days')::interval)
    AND (j.is_expired = false OR j.is_expired IS NULL)
    AND (j.archived_at IS NULL)
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
    -- FIRST PRIORITY: Employer jobs always come first
    CASE WHEN j.data_source = 'employer' THEN 1 ELSE 0 END DESC,
    -- Second priority: jobs with search terms in title (if searching)
    CASE WHEN search_query = '' THEN 0 
         WHEN LOWER(j.title) ILIKE '%' || LOWER(search_query) || '%' THEN 1 
         ELSE 0 END DESC,
    -- Third priority: relevance score (includes title weighting)
    CASE WHEN search_query != '' THEN 
      ((
        CASE WHEN LOWER(j.title) ILIKE '%' || LOWER(search_query) || '%' THEN 10.0 ELSE 0.0 END +
        CASE WHEN to_tsvector('english', j.title) @@ websearch_to_tsquery('english', search_query) THEN 5.0 ELSE 0.0 END +
        ts_rank(j.search_vector, websearch_to_tsquery('english', search_query)) +
        (j.quality_score::real / 10.0)
      ))::real
    END DESC,
    -- Fourth priority: quality score
    j.quality_score DESC,
    -- Fifth priority: recency
    j.scraped_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$function$;

-- Update fast_search_jobs function to prioritize employer jobs
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
AS $function$
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
      -- FIRST PRIORITY: Employer jobs always come first  
      CASE WHEN h.data_source = 'employer' THEN 1 ELSE 0 END DESC,
      h.pre_calculated_relevance DESC,
      h.quality_score DESC,
      h.scraped_at DESC
    LIMIT result_limit
    OFFSET result_offset;
  ELSE
    -- Fall back to optimized main search (which now has employer prioritization)
    RETURN QUERY
    SELECT * FROM public.search_jobs(
      search_query, location_filter, '', employment_type_filter, 
      seniority_filter, company_filter, 30, result_limit, result_offset
    );
  END IF;
END;
$function$;