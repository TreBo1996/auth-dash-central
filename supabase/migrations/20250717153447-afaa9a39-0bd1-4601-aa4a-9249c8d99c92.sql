-- Create job apply tracking table
CREATE TABLE public.job_apply_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL, -- Allow null for non-authenticated users
  job_source TEXT NOT NULL CHECK (job_source IN ('employer', 'database')),
  job_id UUID NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add apply_count to job_postings table
ALTER TABLE public.job_postings 
ADD COLUMN apply_count INTEGER NOT NULL DEFAULT 0;

-- Add apply_count to cached_jobs table  
ALTER TABLE public.cached_jobs
ADD COLUMN apply_count INTEGER NOT NULL DEFAULT 0;

-- Create indexes for performance
CREATE INDEX idx_job_apply_tracking_job_source_id ON public.job_apply_tracking(job_source, job_id);
CREATE INDEX idx_job_apply_tracking_user_id ON public.job_apply_tracking(user_id);

-- Enable RLS on job_apply_tracking
ALTER TABLE public.job_apply_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_apply_tracking
CREATE POLICY "Anyone can track apply clicks" 
ON public.job_apply_tracking 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own apply tracking" 
ON public.job_apply_tracking 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can manage apply tracking" 
ON public.job_apply_tracking 
FOR ALL 
USING (auth.role() = 'service_role');

-- Function to increment apply counters
CREATE OR REPLACE FUNCTION public.increment_apply_counter()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment counter based on job source
  IF NEW.job_source = 'employer' THEN
    UPDATE public.job_postings 
    SET apply_count = apply_count + 1 
    WHERE id = NEW.job_id;
  ELSIF NEW.job_source = 'database' THEN
    UPDATE public.cached_jobs 
    SET apply_count = apply_count + 1 
    WHERE id = NEW.job_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-increment counters
CREATE TRIGGER trigger_increment_apply_counter
  AFTER INSERT ON public.job_apply_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_apply_counter();