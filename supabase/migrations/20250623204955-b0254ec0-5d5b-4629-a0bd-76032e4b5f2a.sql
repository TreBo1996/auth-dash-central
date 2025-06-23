
-- Create table to track search queries and their freshness
CREATE TABLE public.job_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_query TEXT NOT NULL,
  location TEXT,
  date_posted TEXT,
  job_type TEXT,
  experience_level TEXT,
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_results INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to store cached job listings
CREATE TABLE public.cached_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  description TEXT,
  salary TEXT,
  posted_at TEXT,
  source TEXT NOT NULL DEFAULT 'Google Jobs',
  via TEXT,
  thumbnail TEXT,
  job_type TEXT,
  experience_level TEXT,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_expired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table linking searches to jobs
CREATE TABLE public.job_search_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_search_id UUID REFERENCES public.job_searches(id) ON DELETE CASCADE,
  cached_job_id UUID REFERENCES public.cached_jobs(id) ON DELETE CASCADE,
  relevance_score INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_search_id, cached_job_id)
);

-- Create indexes for performance
CREATE INDEX idx_job_searches_query ON public.job_searches(search_query, location);
CREATE INDEX idx_job_searches_updated ON public.job_searches(last_updated_at);
CREATE INDEX idx_cached_jobs_url ON public.cached_jobs(job_url);
CREATE INDEX idx_cached_jobs_last_seen ON public.cached_jobs(last_seen_at);
CREATE INDEX idx_cached_jobs_expired ON public.cached_jobs(is_expired);
CREATE INDEX idx_job_search_results_search ON public.job_search_results(job_search_id);
CREATE INDEX idx_job_search_results_job ON public.job_search_results(cached_job_id);

-- Add Row Level Security (RLS) - these tables can be publicly readable for job search
ALTER TABLE public.job_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_search_results ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (jobs are public information)
CREATE POLICY "Anyone can view job searches" ON public.job_searches FOR SELECT USING (true);
CREATE POLICY "Anyone can view cached jobs" ON public.cached_jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can view job search results" ON public.job_search_results FOR SELECT USING (true);

-- Create policies for system operations (only edge functions can modify)
CREATE POLICY "System can manage job searches" ON public.job_searches FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "System can manage cached jobs" ON public.cached_jobs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "System can manage job search results" ON public.job_search_results FOR ALL USING (auth.role() = 'service_role');

-- Create function to clean up old job listings (older than 6 months)
CREATE OR REPLACE FUNCTION public.cleanup_old_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_count INTEGER;
BEGIN
  -- Mark jobs as expired if they haven't been seen in 6 months
  UPDATE public.cached_jobs 
  SET is_expired = true, updated_at = now()
  WHERE last_seen_at < (now() - INTERVAL '6 months')
    AND is_expired = false;
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Delete job search results for expired jobs to keep junction table clean
  DELETE FROM public.job_search_results 
  WHERE cached_job_id IN (
    SELECT id FROM public.cached_jobs WHERE is_expired = true
  );
  
  -- Delete old job searches that haven't been updated in 30 days
  DELETE FROM public.job_searches 
  WHERE last_updated_at < (now() - INTERVAL '30 days');
  
  RETURN cleanup_count;
END;
$$;

-- Create function to normalize search queries for better cache hits
CREATE OR REPLACE FUNCTION public.normalize_search_query(input_query TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT 
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            lower(trim(input_query)),
            '\bpm\b', 'project manager', 'g'
          ),
          '\bdev\b', 'developer', 'g'
        ),
        '\bsr\b', 'senior', 'g'
      ),
      '\bjr\b', 'junior', 'g'
    );
$$;
