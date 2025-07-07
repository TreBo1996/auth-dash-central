-- Remove all jobs with generic search query titles
-- These jobs don't have proper positionName from Apify and should be excluded
-- to maintain strict 1:1 mapping between database title and Apify positionName

DELETE FROM public.cached_jobs 
WHERE 
  -- Target jobs with generic search query titles (exact matches only)
  title ~* '^(marketing|sales|engineer|software engineer|developer|manager|analyst|business analyst|project manager|account executive|business development|account manager|senior|junior)$'
  -- Also remove jobs where title exactly matches common search terms
  OR title IN (
    'Marketing', 'Sales', 'Engineer', 'Software Engineer', 'Developer', 
    'Manager', 'Analyst', 'Business Analyst', 'Project Manager', 
    'Account Executive', 'Business Development', 'Account Manager',
    'Senior', 'Junior', 'Entry Level', 'Remote', 'Full Time', 'Part Time'
  );

-- Log the results
DO $$
DECLARE
  delete_count INTEGER;
BEGIN
  GET DIAGNOSTICS delete_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % jobs with generic titles to ensure 1:1 mapping with Apify positionName', delete_count;
END;
$$;