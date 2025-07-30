-- Fix the fast_search_jobs function to remove reference to non-existent h.data_source column
-- and ensure it respects the result_limit parameter properly

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
  id uuid, title text, company text, location text, description text, salary text, posted_at text,
  job_url text, apply_url text, source text, via text, thumbnail text, logo_url text, job_type text,
  employment_type text, experience_level text, seniority_level text, remote_type text,
  company_size text, industry text, job_function text, scraped_at timestamp with time zone, 
  quality_score integer, relevance_score real
)
LANGUAGE plpgsql
AS $function$
BEGIN
  -- For hot searches, use materialized view first if it exists
  IF search_query ILIKE ANY(ARRAY['%software engineer%', '%project manager%', '%data analyst%', '%marketing%', '%sales%']) THEN
    BEGIN
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
        CASE WHEN h.source = 'Employer' THEN 1 ELSE 0 END DESC,
        h.pre_calculated_relevance DESC,
        h.quality_score DESC,
        h.scraped_at DESC
      LIMIT result_limit
      OFFSET result_offset;
      
      -- If we got results, return them
      IF FOUND THEN
        RETURN;
      END IF;
    EXCEPTION
      WHEN others THEN
        -- If hot_job_searches doesn't exist or has issues, fall through to regular search
        NULL;
    END;
  END IF;
  
  -- Fall back to optimized main search (which now has employer prioritization)
  RETURN QUERY
  SELECT * FROM public.search_jobs(
    search_query, location_filter, '', employment_type_filter, 
    seniority_filter, company_filter, 30, result_limit, result_offset
  );
END;
$function$;