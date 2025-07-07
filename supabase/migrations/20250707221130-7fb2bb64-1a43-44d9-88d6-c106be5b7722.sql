-- Update the can_use_feature function to change resume_optimizations limit from 3 to 2
CREATE OR REPLACE FUNCTION public.can_use_feature(p_user_id uuid, p_feature_type text)
 RETURNS TABLE(can_use boolean, current_usage integer, limit_reached boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    WHEN 'resume_optimizations' THEN feature_limit := 2; -- Changed from 3 to 2
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
$function$