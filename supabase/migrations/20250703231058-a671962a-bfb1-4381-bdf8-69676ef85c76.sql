-- Create usage tracking table for monthly feature limits
CREATE TABLE public.user_feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  feature_type TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  last_reset_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_type, month_year)
);

-- Enable RLS
ALTER TABLE public.user_feature_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for users to manage their own usage data
CREATE POLICY "Users can view their own usage data" 
ON public.user_feature_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage data" 
ON public.user_feature_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage data" 
ON public.user_feature_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policy for service role to manage usage data
CREATE POLICY "Service role can manage all usage data" 
ON public.user_feature_usage 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Create function to get current month usage for a user and feature
CREATE OR REPLACE FUNCTION public.get_monthly_usage(
  p_user_id UUID,
  p_feature_type TEXT
) 
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT;
  usage_count INTEGER;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  
  SELECT COALESCE(ufu.usage_count, 0) INTO usage_count
  FROM public.user_feature_usage ufu
  WHERE ufu.user_id = p_user_id 
    AND ufu.feature_type = p_feature_type
    AND ufu.month_year = current_month;
  
  RETURN COALESCE(usage_count, 0);
END;
$$;

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_feature_usage(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT;
  new_count INTEGER;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  
  INSERT INTO public.user_feature_usage (user_id, feature_type, month_year, usage_count)
  VALUES (p_user_id, p_feature_type, current_month, 1)
  ON CONFLICT (user_id, feature_type, month_year)
  DO UPDATE SET 
    usage_count = user_feature_usage.usage_count + 1,
    updated_at = now()
  RETURNING usage_count INTO new_count;
  
  RETURN new_count;
END;
$$;

-- Create function to check if user can use a feature (returns true/false and current usage)
CREATE OR REPLACE FUNCTION public.can_use_feature(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS TABLE(can_use BOOLEAN, current_usage INTEGER, limit_reached BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan TEXT;
  current_usage_count INTEGER;
  feature_limit INTEGER;
BEGIN
  -- Get user's plan level
  SELECT COALESCE(plan_level, 'free') INTO user_plan
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Premium users have unlimited access
  IF user_plan = 'premium' THEN
    RETURN QUERY SELECT true, 0, false;
    RETURN;
  END IF;
  
  -- Get current month usage
  current_usage_count := public.get_monthly_usage(p_user_id, p_feature_type);
  
  -- Set limits based on feature type for free users
  CASE p_feature_type
    WHEN 'resume_optimizations' THEN feature_limit := 3;
    WHEN 'interview_sessions' THEN feature_limit := 1;
    WHEN 'cover_letters' THEN feature_limit := 2;
    WHEN 'job_descriptions' THEN feature_limit := 3;
    ELSE feature_limit := 0; -- Unknown feature, deny access
  END CASE;
  
  RETURN QUERY SELECT 
    current_usage_count < feature_limit,
    current_usage_count,
    current_usage_count >= feature_limit;
END;
$$;