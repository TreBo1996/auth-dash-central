
-- Add INSERT policies for resume_sections
CREATE POLICY "Users can insert their own resume sections" 
  ON public.resume_sections 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_sections.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add UPDATE policies for resume_sections
CREATE POLICY "Users can update their own resume sections" 
  ON public.resume_sections 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_sections.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add DELETE policies for resume_sections
CREATE POLICY "Users can delete their own resume sections" 
  ON public.resume_sections 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_sections.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add INSERT policies for resume_experiences
CREATE POLICY "Users can insert their own resume experiences" 
  ON public.resume_experiences 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_experiences.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add UPDATE policies for resume_experiences
CREATE POLICY "Users can update their own resume experiences" 
  ON public.resume_experiences 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_experiences.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add DELETE policies for resume_experiences
CREATE POLICY "Users can delete their own resume experiences" 
  ON public.resume_experiences 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_experiences.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add INSERT policies for resume_skills
CREATE POLICY "Users can insert their own resume skills" 
  ON public.resume_skills 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_skills.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add UPDATE policies for resume_skills
CREATE POLICY "Users can update their own resume skills" 
  ON public.resume_skills 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_skills.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add DELETE policies for resume_skills
CREATE POLICY "Users can delete their own resume skills" 
  ON public.resume_skills 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_skills.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add INSERT policies for resume_education
CREATE POLICY "Users can insert their own resume education" 
  ON public.resume_education 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_education.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add UPDATE policies for resume_education
CREATE POLICY "Users can update their own resume education" 
  ON public.resume_education 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_education.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add DELETE policies for resume_education
CREATE POLICY "Users can delete their own resume education" 
  ON public.resume_education 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_education.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add INSERT policies for resume_certifications
CREATE POLICY "Users can insert their own resume certifications" 
  ON public.resume_certifications 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_certifications.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add UPDATE policies for resume_certifications
CREATE POLICY "Users can update their own resume certifications" 
  ON public.resume_certifications 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_certifications.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );

-- Add DELETE policies for resume_certifications
CREATE POLICY "Users can delete their own resume certifications" 
  ON public.resume_certifications 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.optimized_resumes 
      WHERE optimized_resumes.id = resume_certifications.optimized_resume_id 
      AND optimized_resumes.user_id = auth.uid()
    )
  );
