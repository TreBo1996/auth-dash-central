
-- Create optimized_resumes table
CREATE TABLE public.optimized_resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_description_id UUID NOT NULL REFERENCES public.job_descriptions(id) ON DELETE CASCADE,
  generated_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on optimized_resumes table
ALTER TABLE public.optimized_resumes ENABLE ROW LEVEL SECURITY;

-- RLS policies for optimized_resumes table
CREATE POLICY "Users can view their own optimized resumes"
  ON public.optimized_resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own optimized resumes"
  ON public.optimized_resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own optimized resumes"
  ON public.optimized_resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own optimized resumes"
  ON public.optimized_resumes FOR DELETE
  USING (auth.uid() = user_id);
