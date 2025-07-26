-- Add job_recommendation_category column to cached_jobs table
ALTER TABLE public.cached_jobs 
ADD COLUMN job_recommendation_category TEXT;

-- Create job_categories lookup table for standard category definitions
CREATE TABLE public.job_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on job_categories
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view job categories (they're reference data)
CREATE POLICY "Anyone can view job categories" 
ON public.job_categories 
FOR SELECT 
USING (true);

-- Only service role can manage categories
CREATE POLICY "System can manage job categories" 
ON public.job_categories 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Insert standard job categories with keywords
INSERT INTO public.job_categories (category_name, description, keywords) VALUES
('Business Analyst', 'Business analysis and process improvement roles', ARRAY['business analyst', 'ba', 'business analysis', 'process analyst', 'systems analyst']),
('Software Engineer', 'Software development and engineering roles', ARRAY['software engineer', 'software developer', 'developer', 'programmer', 'full stack', 'frontend', 'backend', 'web developer', 'mobile developer', 'application developer']),
('Data Scientist', 'Data science and analytics roles', ARRAY['data scientist', 'data analyst', 'data engineer', 'machine learning', 'ml engineer', 'ai engineer', 'analytics']),
('Marketing', 'Marketing and digital marketing roles', ARRAY['marketing', 'digital marketing', 'marketing manager', 'marketing specialist', 'content marketing', 'seo', 'social media', 'brand', 'growth']),
('Sales', 'Sales and business development roles', ARRAY['sales', 'account manager', 'sales manager', 'business development', 'sales representative', 'account executive', 'sales specialist']),
('Project Manager', 'Project and program management roles', ARRAY['project manager', 'program manager', 'scrum master', 'product manager', 'pm', 'agile', 'project coordinator']),
('Human Resources', 'HR and people operations roles', ARRAY['human resources', 'hr', 'recruiter', 'talent acquisition', 'people operations', 'hr specialist', 'hr manager']),
('Finance', 'Finance and accounting roles', ARRAY['finance', 'financial analyst', 'accountant', 'accounting', 'controller', 'cfo', 'financial']),
('Operations', 'Operations and logistics roles', ARRAY['operations', 'operations manager', 'logistics', 'supply chain', 'warehouse', 'operations specialist']),
('Customer Service', 'Customer service and support roles', ARRAY['customer service', 'customer support', 'support', 'customer success', 'help desk', 'technical support']);

-- Create function to categorize job titles
CREATE OR REPLACE FUNCTION public.categorize_job_title(job_title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
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

-- Update the existing trigger function to include categorization
CREATE OR REPLACE FUNCTION public.update_job_quality_and_search()
RETURNS trigger
LANGUAGE plpgsql
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

-- Update existing jobs with recommendation categories
UPDATE public.cached_jobs 
SET job_recommendation_category = public.categorize_job_title(title),
    updated_at = now()
WHERE job_recommendation_category IS NULL;