
-- Add new columns to job_descriptions table to support job search functionality
ALTER TABLE public.job_descriptions 
ADD COLUMN source TEXT DEFAULT 'upload',
ADD COLUMN company TEXT,
ADD COLUMN location TEXT,
ADD COLUMN salary_range TEXT,
ADD COLUMN job_url TEXT;

-- Update existing records to have 'upload' as source
UPDATE public.job_descriptions SET source = 'upload' WHERE source IS NULL;
