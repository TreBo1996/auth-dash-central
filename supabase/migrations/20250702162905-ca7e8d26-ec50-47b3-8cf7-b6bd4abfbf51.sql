
-- Create cover_letters table to store AI-generated cover letters
CREATE TABLE public.cover_letters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  generated_text TEXT NOT NULL,
  job_description_id UUID REFERENCES public.job_descriptions(id) ON DELETE CASCADE,
  optimized_resume_id UUID REFERENCES public.optimized_resumes(id) ON DELETE SET NULL,
  original_resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own cover letters
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own cover letters
CREATE POLICY "Users can view their own cover letters" 
  ON public.cover_letters 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own cover letters
CREATE POLICY "Users can create their own cover letters" 
  ON public.cover_letters 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own cover letters
CREATE POLICY "Users can update their own cover letters" 
  ON public.cover_letters 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own cover letters
CREATE POLICY "Users can delete their own cover letters" 
  ON public.cover_letters 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create an index on user_id for better query performance
CREATE INDEX idx_cover_letters_user_id ON public.cover_letters(user_id);

-- Create an index on job_description_id for better query performance
CREATE INDEX idx_cover_letters_job_description_id ON public.cover_letters(job_description_id);
