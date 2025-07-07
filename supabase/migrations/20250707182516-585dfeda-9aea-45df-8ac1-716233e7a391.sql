-- Phase 1: Add validation constraints and improve data quality

-- Add validation function to ensure job titles are legitimate
CREATE OR REPLACE FUNCTION public.is_valid_job_title(title TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return false if title is null, empty, or too short/long
  IF title IS NULL OR TRIM(title) = '' OR LENGTH(title) < 3 OR LENGTH(title) > 80 THEN
    RETURN FALSE;
  END IF;
  
  -- Reject location names as titles
  IF title ~* '^[A-Za-z\s]+,\s*(FL|CA|NY|TX|WA|IL|PA|OH|GA|NC|MI|NJ|VA|WI|AZ|MA|TN|IN|MO|MD|WV|DE|UT|NV|NM|HI|AK|VT|WY|RI|CT|NH|ME|ND|SD|MT|ID|OR|KS|NE|IA|AR|LA|MS|AL|SC|KY|OK|CO|MN),?\s*(USA?)?$' THEN
    RETURN FALSE;
  END IF;
  
  -- Reject state abbreviations only
  IF title ~* '^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)$' THEN
    RETURN FALSE;
  END IF;
  
  -- Reject city names only
  IF title ~* '^(Tampa|Orlando|Miami|Jacksonville|Atlanta|Charlotte|Raleigh|Nashville|Austin|Dallas|Houston|Phoenix|Los Angeles|San Francisco|Seattle|Portland|Chicago|Detroit|Boston|New York|Philadelphia|Washington)$' THEN
    RETURN FALSE;
  END IF;
  
  -- Reject description patterns
  IF title ~* '^(description|about|who you|what you|overview|summary|position|job|role):' OR
     title ~* '^(description|about|who you|what you|overview|summary)' OR
     title ~* '(description|overview|summary|about us|who you|what you)' THEN
    RETURN FALSE;
  END IF;
  
  -- Reject multiple sentences (descriptions)
  IF title LIKE '%.%' AND LENGTH(title) - LENGTH(REPLACE(title, '.', '')) > 1 THEN
    RETURN FALSE;
  END IF;
  
  -- Reject exact search term matches
  IF title ~* '^(marketing|sales|engineer|software engineer|developer|manager|analyst|business analyst|project manager|account executive|business development|account manager|senior|junior|entry level|remote|full time|part time)$' THEN
    RETURN FALSE;
  END IF;
  
  -- Reject numbers only
  IF title ~* '^\d+$' OR title ~* '^\d+\s*-\s*\d+$' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Add improved quality scoring function
CREATE OR REPLACE FUNCTION public.calculate_job_quality_score(
  title TEXT,
  company TEXT,
  description TEXT,
  location TEXT,
  salary TEXT,
  employment_type TEXT,
  data_source TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Base score for having a valid title
  IF public.is_valid_job_title(title) THEN
    score := score + 3;
  END IF;
  
  -- Company name quality
  IF company IS NOT NULL AND LENGTH(TRIM(company)) > 2 THEN
    score := score + 2;
  END IF;
  
  -- Description quality
  IF description IS NOT NULL AND LENGTH(TRIM(description)) > 50 THEN
    score := score + 2;
  END IF;
  
  -- Location specificity
  IF location IS NOT NULL AND LENGTH(TRIM(location)) > 2 THEN
    score := score + 1;
  END IF;
  
  -- Salary information
  IF salary IS NOT NULL AND LENGTH(TRIM(salary)) > 0 THEN
    score := score + 1;
  END IF;
  
  -- Employment type
  IF employment_type IS NOT NULL AND employment_type IN ('Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship') THEN
    score := score + 1;
  END IF;
  
  -- Data source bonus (employer posts are higher quality)
  IF data_source = 'employer' THEN
    score := score + 2;
  ELSIF data_source = 'apify' THEN
    score := score + 0;
  END IF;
  
  -- Cap at 10
  RETURN LEAST(score, 10);
END;
$$;

-- Create trigger to automatically calculate quality score and validate data
CREATE OR REPLACE FUNCTION public.update_job_quality_and_search()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate title
  IF NOT public.is_valid_job_title(NEW.title) THEN
    RAISE EXCEPTION 'Invalid job title: %', NEW.title;
  END IF;
  
  -- Calculate and set quality score
  NEW.quality_score := public.calculate_job_quality_score(
    NEW.title,
    NEW.company,
    NEW.description,
    NEW.location,
    NEW.salary,
    NEW.employment_type,
    NEW.data_source
  );
  
  -- Update search vector
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
$$;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_job_search_vector_trigger ON public.cached_jobs;
CREATE TRIGGER update_job_quality_and_search_trigger
  BEFORE INSERT OR UPDATE ON public.cached_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_quality_and_search();

-- Add constraints to ensure data quality
ALTER TABLE public.cached_jobs 
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN company SET NOT NULL,
  ALTER COLUMN job_url SET NOT NULL;

-- Add check constraint for minimum title length (but allow updates for repair)
ALTER TABLE public.cached_jobs 
  ADD CONSTRAINT valid_title_length CHECK (LENGTH(TRIM(title)) >= 3);

-- Create index for better search performance on valid jobs
CREATE INDEX IF NOT EXISTS idx_cached_jobs_quality_search 
  ON public.cached_jobs(quality_score DESC, scraped_at DESC) 
  WHERE is_expired = FALSE OR is_expired IS NULL;