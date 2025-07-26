-- Fix security warning: Function Search Path Mutable for categorize_job_title
CREATE OR REPLACE FUNCTION public.categorize_job_title(job_title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  category_record RECORD;
  keyword TEXT;
  normalized_title TEXT;
BEGIN
  -- Return null if title is null or empty
  IF job_title IS NULL OR TRIM(job_title) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Normalize the job title for matching
  normalized_title := LOWER(TRIM(job_title));
  
  -- Check each category's keywords for matches
  FOR category_record IN 
    SELECT category_name, keywords 
    FROM public.job_categories 
    ORDER BY category_name
  LOOP
    -- Check if any keyword matches the job title
    FOREACH keyword IN ARRAY category_record.keywords
    LOOP
      IF normalized_title ILIKE '%' || keyword || '%' THEN
        RETURN category_record.category_name;
      END IF;
    END LOOP;
  END LOOP;
  
  -- If no category matches, return 'Other'
  RETURN 'Other';
END;
$function$;

-- Fix security warning: Function Search Path Mutable for update_job_quality_and_search
CREATE OR REPLACE FUNCTION public.update_job_quality_and_search()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Set job recommendation category
  NEW.job_recommendation_category := public.categorize_job_title(NEW.title);
  
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
$function$;