-- Create enum for application statuses
CREATE TYPE application_status AS ENUM ('pending', 'applied', 'interviewing', 'rejected', 'offer', 'withdrawn');

-- Add application_status column to job_descriptions
ALTER TABLE job_descriptions ADD COLUMN application_status application_status DEFAULT 'pending';

-- Update existing records based on is_applied
UPDATE job_descriptions SET application_status = 'applied' WHERE is_applied = true;