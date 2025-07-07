-- Create function to extract job title from description
CREATE OR REPLACE FUNCTION extract_job_title_from_description(description_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  extracted_title TEXT;
  lines TEXT[];
  first_line TEXT;
BEGIN
  -- Return null if description is empty
  IF description_text IS NULL OR TRIM(description_text) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Split description into lines
  lines := string_to_array(description_text, E'\n');
  
  -- Get first non-empty line
  FOR i IN 1..array_length(lines, 1) LOOP
    first_line := TRIM(lines[i]);
    IF first_line != '' THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- If no content found, return null
  IF first_line IS NULL OR first_line = '' THEN
    RETURN NULL;
  END IF;
  
  -- Clean up common patterns to extract the job title
  extracted_title := first_line;
  
  -- Remove common prefixes like "Job Title:", "Position:", etc.
  extracted_title := regexp_replace(extracted_title, '^(Job Title|Position|Role|Title)\s*:\s*', '', 'i');
  
  -- Remove HTML tags if any
  extracted_title := regexp_replace(extracted_title, '<[^>]*>', '', 'g');
  
  -- Remove extra whitespace
  extracted_title := regexp_replace(extracted_title, '\s+', ' ', 'g');
  extracted_title := TRIM(extracted_title);
  
  -- If the extracted title is too short or looks like a search query, return null
  IF LENGTH(extracted_title) < 3 OR 
     extracted_title ~* '^(marketing|sales|engineer|manager|developer|analyst)$' THEN
    RETURN NULL;
  END IF;
  
  -- Limit length to reasonable job title size
  IF LENGTH(extracted_title) > 100 THEN
    extracted_title := LEFT(extracted_title, 100);
  END IF;
  
  RETURN extracted_title;
END;
$$;

-- Update existing jobs with generic titles
UPDATE public.cached_jobs 
SET 
  title = COALESCE(extract_job_title_from_description(description), title),
  updated_at = now()
WHERE 
  -- Target jobs with generic search query titles
  (title ~* '^(marketing|sales|engineer|software engineer|developer|manager|analyst|business analyst|project manager|account executive)$')
  -- Only update if we can extract a better title
  AND extract_job_title_from_description(description) IS NOT NULL
  -- Don't update recently created jobs (they likely have correct titles)
  AND scraped_at < now() - INTERVAL '1 hour';

-- Log the results
DO $$
DECLARE
  update_count INTEGER;
BEGIN
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RAISE NOTICE 'Updated % job titles from description data', update_count;
END;
$$;