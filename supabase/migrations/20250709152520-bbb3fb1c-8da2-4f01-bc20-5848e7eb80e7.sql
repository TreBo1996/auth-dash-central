-- Add unique constraint to prevent duplicate sections for same resume
ALTER TABLE public.initial_resume_sections 
ADD CONSTRAINT unique_resume_section_type 
UNIQUE (resume_id, section_type);