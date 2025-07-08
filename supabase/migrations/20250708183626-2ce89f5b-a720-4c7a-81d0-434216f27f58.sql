-- Add foreign key constraint between job_postings and employer_profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'job_postings_employer_id_fkey'
  ) THEN
    ALTER TABLE public.job_postings 
    ADD CONSTRAINT job_postings_employer_id_fkey 
    FOREIGN KEY (employer_id) REFERENCES public.employer_profiles(id);
  END IF;
END $$;

-- Update RLS policy to allow public viewing of employer profiles for job postings
DROP POLICY IF EXISTS "Public can view employer profiles for job postings" ON public.employer_profiles;

CREATE POLICY "Public can view employer profiles for job postings" 
ON public.employer_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.job_postings 
    WHERE employer_id = employer_profiles.id 
    AND is_active = true
  )
);