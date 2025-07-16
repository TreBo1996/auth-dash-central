-- Create daily recommendation runs table
CREATE TABLE public.daily_recommendation_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_users_processed INTEGER DEFAULT 0,
  total_recommendations_generated INTEGER DEFAULT 0,
  mailchimp_updated_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user job recommendations table
CREATE TABLE public.user_job_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cached_job_id UUID NOT NULL,
  run_id UUID NOT NULL,
  match_score NUMERIC(5,2) NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  title_similarity_score NUMERIC(5,2) NOT NULL CHECK (title_similarity_score >= 0 AND title_similarity_score <= 100),
  experience_match_score NUMERIC(5,2) NOT NULL CHECK (experience_match_score >= 0 AND experience_match_score <= 100),
  recommended_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  mailchimp_merge_data JSONB,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_job_recommendations_user_id_recommended_at ON public.user_job_recommendations (user_id, recommended_at DESC);
CREATE INDEX idx_user_job_recommendations_run_id_match_score ON public.user_job_recommendations (run_id, match_score DESC);
CREATE INDEX idx_user_job_recommendations_cached_job_id_recommended_at ON public.user_job_recommendations (cached_job_id, recommended_at DESC);
CREATE INDEX idx_daily_recommendation_runs_status_created_at ON public.daily_recommendation_runs (status, created_at DESC);

-- Enable RLS on both tables
ALTER TABLE public.daily_recommendation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_job_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_recommendation_runs
CREATE POLICY "Admins can manage recommendation runs" 
ON public.daily_recommendation_runs 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND is_admin = true
));

CREATE POLICY "Users can view their own recommendations" 
ON public.user_job_recommendations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all recommendations" 
ON public.user_job_recommendations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND is_admin = true
));

CREATE POLICY "System can manage recommendations" 
ON public.user_job_recommendations 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "System can manage recommendation runs" 
ON public.daily_recommendation_runs 
FOR ALL 
USING (auth.role() = 'service_role');

-- Add foreign key constraints
ALTER TABLE public.user_job_recommendations 
ADD CONSTRAINT fk_user_job_recommendations_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_job_recommendations 
ADD CONSTRAINT fk_user_job_recommendations_cached_job_id 
FOREIGN KEY (cached_job_id) REFERENCES public.cached_jobs(id) ON DELETE CASCADE;

ALTER TABLE public.user_job_recommendations 
ADD CONSTRAINT fk_user_job_recommendations_run_id 
FOREIGN KEY (run_id) REFERENCES public.daily_recommendation_runs(id) ON DELETE CASCADE;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_recommendation_runs_updated_at
BEFORE UPDATE ON public.daily_recommendation_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_job_recommendations_updated_at
BEFORE UPDATE ON public.user_job_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();