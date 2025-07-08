-- Add employment preference columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN desired_job_title TEXT,
ADD COLUMN desired_salary_min INTEGER,
ADD COLUMN desired_salary_max INTEGER,
ADD COLUMN desired_salary_currency TEXT DEFAULT 'USD',
ADD COLUMN work_setting_preference TEXT CHECK (work_setting_preference IN ('remote', 'hybrid', 'on-site', 'any')),
ADD COLUMN experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
ADD COLUMN preferred_location TEXT,
ADD COLUMN industry_preferences TEXT[],
ADD COLUMN job_type_preference TEXT CHECK (job_type_preference IN ('full-time', 'part-time', 'contract', 'any')),
ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN newsletter_enabled BOOLEAN DEFAULT true;