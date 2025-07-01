
-- Fix the search_jobs function to resolve CASE type mismatch issue
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
    CASE WHEN search_query = '' THEN 0 ELSE 1 END DESC,
    CASE WHEN search_query != '' THEN ts_rank(j.search_vector, websearch_to_tsquery('english', search_query)) END DESC,
    j.quality_score DESC,
    j.scraped_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$function$
