
-- Create table for user-provided resume additions
CREATE TABLE public.user_resume_additions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  optimized_resume_id UUID NULL,
  addition_type TEXT NOT NULL CHECK (addition_type IN ('skill', 'experience', 'achievement')),
  content TEXT NOT NULL,
  target_experience_title TEXT NULL, -- Store the job title to match against
  target_experience_company TEXT NULL, -- Store company to help identify the role
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_resume_additions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own resume additions" 
ON public.user_resume_additions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume additions" 
ON public.user_resume_additions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume additions" 
ON public.user_resume_additions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume additions" 
ON public.user_resume_additions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_resume_additions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_resume_additions_updated_at
BEFORE UPDATE ON public.user_resume_additions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_resume_additions_updated_at();
