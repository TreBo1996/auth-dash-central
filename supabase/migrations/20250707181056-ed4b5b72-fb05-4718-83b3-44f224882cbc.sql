-- Aggressive cleanup of jobs without proper position names
-- Remove ALL jobs that don't have legitimate job titles

DELETE FROM public.cached_jobs 
WHERE 
  -- Remove jobs with location names as titles
  title ~* '^[A-Za-z\s]+,\s*(FL|CA|NY|TX|WA|IL|PA|OH|GA|NC|MI|NJ|VA|WI|AZ|MA|TN|IN|MO|MD|WV|DE|UT|NV|NM|HI|AK|VT|WY|RI|CT|NH|ME|ND|SD|MT|ID|OR|KS|NE|IA|AR|LA|MS|AL|SC|KY|OK|CO|MN),?\s*(USA?)?$'
  -- Remove jobs with state abbreviations only
  OR title ~* '^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)$'
  -- Remove jobs with city names only (common patterns)
  OR title ~* '^(Tampa|Orlando|Miami|Jacksonville|Atlanta|Charlotte|Raleigh|Nashville|Austin|Dallas|Houston|Phoenix|Los Angeles|San Francisco|Seattle|Portland|Chicago|Detroit|Boston|New York|Philadelphia|Washington)$'
  -- Remove description-like patterns
  OR title ~* '^(description|about|who you|what you|overview|summary|position|job|role):'
  OR title ~* '^(description|about|who you|what you|overview|summary)'
  OR title ~* '(description|overview|summary|about us|who you|what you)'
  -- Remove company names as titles
  OR title ~* '^(company|corporation|inc\.|llc|ltd\.|co\.)$'
  -- Remove generic recruiting phrases
  OR title ~* '^(looking for|seeking|hiring|we are|join our|opportunity|position available)'
  OR title ~* '^(we|our|the|this|that|job|position|role|opportunity|candidate|applicant)'
  -- Remove formatting artifacts and partial text
  OR title ~* '^\*.*'  -- Starts with asterisk
  OR title ~* '^Time Type:'
  OR title ~* '^A Day in the Life'
  OR title ~* '^Benefits:'
  OR title ~* '^Requirements:'
  OR title ~* '^Responsibilities:'
  OR title ~* '^Qualifications:'
  -- Remove jobs with multiple sentences (descriptions, not titles)
  OR title LIKE '%.%'
  -- Remove extremely long titles (likely descriptions)
  OR LENGTH(title) > 80
  -- Remove extremely short titles (likely incomplete)
  OR LENGTH(title) < 3
  -- Remove exact search term matches (these shouldn't be job titles)
  OR title ~* '^(marketing|sales|engineer|software engineer|developer|manager|analyst|business analyst|project manager|account executive|business development|account manager|senior|junior|entry level|remote|full time|part time)$'
  -- Remove jobs with numbers only or mostly numbers
  OR title ~* '^\d+$'
  OR title ~* '^\d+\s*-\s*\d+$'
  -- Remove jobs with common non-title patterns
  OR title ~* '^(apply now|click here|learn more|view details|see description)$'
  OR title ~* '^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$'
  OR title ~* '^(january|february|march|april|may|june|july|august|september|october|november|december)$';

-- Also remove any jobs with empty or null titles
DELETE FROM public.cached_jobs 
WHERE title IS NULL OR TRIM(title) = '';

-- Log the cleanup results
DO $$
DECLARE
  remaining_count INTEGER;
  total_before INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_before FROM public.cached_jobs;
  
  -- Get remaining count after cleanup
  SELECT COUNT(*) INTO remaining_count FROM public.cached_jobs;
  
  RAISE NOTICE 'Aggressive cleanup complete. % jobs remaining with proper position names', remaining_count;
  RAISE NOTICE 'Note: Run fresh scraper to populate with clean data';
END;
$$;