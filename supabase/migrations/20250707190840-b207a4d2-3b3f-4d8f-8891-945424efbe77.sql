-- Fix the is_valid_job_title function to allow legitimate job titles
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
  
  -- Reject vague search terms only (removed legitimate job titles like "project manager")
  IF title ~* '^(marketing|sales|engineer|developer|manager|analyst|senior|junior|entry level|remote|full time|part time)$' THEN
    RETURN FALSE;
  END IF;
  
  -- Reject numbers only
  IF title ~* '^\d+$' OR title ~* '^\d+\s*-\s*\d+$' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;