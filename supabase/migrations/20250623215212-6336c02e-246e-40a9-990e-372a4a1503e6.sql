
-- Add ATS scoring columns to optimized_resumes table
ALTER TABLE public.optimized_resumes 
ADD COLUMN ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
ADD COLUMN ats_feedback JSONB,
ADD COLUMN scoring_criteria JSONB,
ADD COLUMN scored_at TIMESTAMP WITH TIME ZONE;

-- Add index for better performance on ATS score queries
CREATE INDEX idx_optimized_resumes_ats_score ON public.optimized_resumes(ats_score) WHERE ats_score IS NOT NULL;

-- Add index for scored_at timestamp
CREATE INDEX idx_optimized_resumes_scored_at ON public.optimized_resumes(scored_at) WHERE scored_at IS NOT NULL;
