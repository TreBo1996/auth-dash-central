-- Create initial_resume_sections table for structured data storage of base resumes
CREATE TABLE public.initial_resume_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.initial_resume_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own initial resume sections" 
ON public.initial_resume_sections 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.resumes 
  WHERE resumes.id = initial_resume_sections.resume_id 
  AND resumes.user_id = auth.uid()
));

CREATE POLICY "Users can create their own initial resume sections" 
ON public.initial_resume_sections 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.resumes 
  WHERE resumes.id = initial_resume_sections.resume_id 
  AND resumes.user_id = auth.uid()
));

CREATE POLICY "Users can update their own initial resume sections" 
ON public.initial_resume_sections 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.resumes 
  WHERE resumes.id = initial_resume_sections.resume_id 
  AND resumes.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own initial resume sections" 
ON public.initial_resume_sections 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.resumes 
  WHERE resumes.id = initial_resume_sections.resume_id 
  AND resumes.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_initial_resume_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_initial_resume_sections_updated_at
BEFORE UPDATE ON public.initial_resume_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_initial_resume_sections_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_initial_resume_sections_resume_id ON public.initial_resume_sections(resume_id);
CREATE INDEX idx_initial_resume_sections_section_type ON public.initial_resume_sections(section_type);