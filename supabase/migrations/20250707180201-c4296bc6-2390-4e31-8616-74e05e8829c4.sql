-- Clean up recent jobs (last 24 hours) with description-like titles
-- Remove jobs where title contains description patterns instead of proper position names

DELETE FROM public.cached_jobs 
WHERE 
  -- Only target recent jobs from last 24 hours
  scraped_at >= (now() - INTERVAL '24 hours')
  AND (
    -- Remove jobs with description-like patterns
    title ~* '^(description|about|who you|what you|overview|summary|position|job|role):'
    OR title ~* '^(description|about|who you|what you|overview|summary)'
    OR title ~* '(description|overview|summary|about us|who you|what you)'
    -- Remove jobs with company names as titles (common scraping error)
    OR title ~* '^(company|corporation|inc\.|llc|ltd\.|co\.)$'
    -- Remove jobs with generic phrases
    OR title ~* '^(looking for|seeking|hiring|we are|join our|opportunity|position available)'
    -- Remove jobs that start with common description words
    OR title ~* '^(we|our|the|this|that|job|position|role|opportunity|candidate|applicant)'
    -- Remove jobs with multiple sentences (descriptions, not titles)
    OR title LIKE '%.%'
    OR LENGTH(title) > 100  -- Job titles shouldn't be this long
  );

-- Also clean up any remaining generic search terms from recent jobs
DELETE FROM public.cached_jobs 
WHERE 
  scraped_at >= (now() - INTERVAL '24 hours')
  AND (
    title ~* '^(marketing|sales|engineer|software engineer|developer|manager|analyst|business analyst|project manager|account executive|business development|account manager|senior|junior|entry level|remote|full time|part time)$'
  );

-- Log the cleanup results
DO $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cleanup_count
  FROM public.cached_jobs 
  WHERE scraped_at >= (now() - INTERVAL '24 hours');
  
  RAISE NOTICE 'Cleanup complete. % jobs remaining from last 24 hours with proper titles', cleanup_count;
END;
$$;