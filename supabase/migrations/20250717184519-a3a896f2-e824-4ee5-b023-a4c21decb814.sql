-- Create EEO responses table for job applications
CREATE TABLE public.job_application_eeo_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_application_id UUID NOT NULL,
  eeo_responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.job_application_eeo_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for EEO responses
CREATE POLICY "Applicants can insert their own EEO responses" 
ON public.job_application_eeo_responses 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.job_applications 
    WHERE id = job_application_eeo_responses.job_application_id 
    AND applicant_id = auth.uid()
  )
);

CREATE POLICY "Applicants can view their own EEO responses" 
ON public.job_application_eeo_responses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.job_applications 
    WHERE id = job_application_eeo_responses.job_application_id 
    AND applicant_id = auth.uid()
  )
);

CREATE POLICY "Employers can view EEO responses for their job applications" 
ON public.job_application_eeo_responses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.job_applications ja
    JOIN public.job_postings jp ON ja.job_posting_id = jp.id
    JOIN public.employer_profiles ep ON jp.employer_id = ep.id
    WHERE ja.id = job_application_eeo_responses.job_application_id 
    AND ep.user_id = auth.uid() 
    AND has_role(auth.uid(), 'employer'::app_role)
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_application_eeo_responses_updated_at
BEFORE UPDATE ON public.job_application_eeo_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();