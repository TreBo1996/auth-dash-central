
-- Create table for resume experiences
CREATE TABLE public.resume_experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  optimized_resume_id UUID NOT NULL REFERENCES public.optimized_resumes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  duration TEXT NOT NULL,
  bullets TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for resume skills
CREATE TABLE public.resume_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  optimized_resume_id UUID NOT NULL REFERENCES public.optimized_resumes(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  items TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for resume education
CREATE TABLE public.resume_education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  optimized_resume_id UUID NOT NULL REFERENCES public.optimized_resumes(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  school TEXT NOT NULL,
  year TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for resume certifications
CREATE TABLE public.resume_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  optimized_resume_id UUID NOT NULL REFERENCES public.optimized_resumes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  year TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for resume sections (summary, contact info, etc.)
CREATE TABLE public.resume_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  optimized_resume_id UUID NOT NULL REFERENCES public.optimized_resumes(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL, -- 'summary', 'contact', etc.
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(optimized_resume_id, section_type)
);

-- Add RLS policies for resume_experiences
ALTER TABLE public.resume_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resume experiences" 
  ON public.resume_experiences 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_experiences.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add RLS policies for resume_skills
ALTER TABLE public.resume_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resume skills" 
  ON public.resume_skills 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_skills.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add RLS policies for resume_education
ALTER TABLE public.resume_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resume education" 
  ON public.resume_education 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_education.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add RLS policies for resume_certifications
ALTER TABLE public.resume_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resume certifications" 
  ON public.resume_certifications 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_certifications.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add RLS policies for resume_sections
ALTER TABLE public.resume_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resume sections" 
  ON public.resume_sections 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_sections.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_resume_experiences_optimized_resume_id ON public.resume_experiences(optimized_resume_id);
CREATE INDEX idx_resume_skills_optimized_resume_id ON public.resume_skills(optimized_resume_id);
CREATE INDEX idx_resume_education_optimized_resume_id ON public.resume_education(optimized_resume_id);
CREATE INDEX idx_resume_certifications_optimized_resume_id ON public.resume_certifications(optimized_resume_id);
CREATE INDEX idx_resume_sections_optimized_resume_id ON public.resume_sections(optimized_resume_id);
