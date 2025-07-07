-- Add columns to track optimization metadata for keyword highlighting
ALTER TABLE optimized_resumes 
ADD COLUMN IF NOT EXISTS original_content TEXT,
ADD COLUMN IF NOT EXISTS keyword_enhancements JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS job_fit_level TEXT;

-- Update the job_fit_level based on existing ats_score
UPDATE optimized_resumes 
SET job_fit_level = CASE 
  WHEN ats_score >= 90 THEN 'excellent'
  WHEN ats_score >= 80 THEN 'strong' 
  WHEN ats_score >= 70 THEN 'good'
  WHEN ats_score >= 60 THEN 'fair'
  WHEN ats_score >= 50 THEN 'weak'
  ELSE 'poor'
END
WHERE ats_score IS NOT NULL;