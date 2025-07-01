
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('job_seeker', 'employer', 'both');

-- Create user_roles table to track what roles each user has
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create user_role_preferences to remember which dashboard users prefer
CREATE TABLE public.user_role_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employer_profiles table for company information
CREATE TABLE public.employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  company_description TEXT,
  website TEXT,
  company_size TEXT,
  industry TEXT,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'United States',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_postings table for employer-created jobs
CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES public.employer_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[],
  responsibilities TEXT[],
  benefits TEXT[],
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  location TEXT,
  remote_type TEXT,
  employment_type TEXT,
  experience_level TEXT,
  seniority_level TEXT,
  job_function TEXT,
  industry TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0
);

-- Create job_applications table to track applications
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES public.resumes(id),
  cover_letter TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'interview', 'hired', 'rejected')),
  notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (job_posting_id, applicant_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  ) OR EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'both'
  );
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roles"
  ON public.user_roles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for user_role_preferences
CREATE POLICY "Users can manage their role preferences"
  ON public.user_role_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for employer_profiles
CREATE POLICY "Employers can manage their profiles"
  ON public.employer_profiles FOR ALL
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'employer'))
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'employer'));

-- RLS policies for job_postings
CREATE POLICY "Employers can manage their job postings"
  ON public.job_postings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.employer_profiles ep 
    WHERE ep.id = job_postings.employer_id 
    AND ep.user_id = auth.uid()
    AND public.has_role(auth.uid(), 'employer')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.employer_profiles ep 
    WHERE ep.id = job_postings.employer_id 
    AND ep.user_id = auth.uid()
    AND public.has_role(auth.uid(), 'employer')
  ));

CREATE POLICY "Job seekers can view active job postings"
  ON public.job_postings FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- RLS policies for job_applications
CREATE POLICY "Applicants can manage their applications"
  ON public.job_applications FOR ALL
  USING (auth.uid() = applicant_id AND public.has_role(auth.uid(), 'job_seeker'))
  WITH CHECK (auth.uid() = applicant_id AND public.has_role(auth.uid(), 'job_seeker'));

CREATE POLICY "Employers can view applications to their jobs"
  ON public.job_applications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.job_postings jp
    JOIN public.employer_profiles ep ON ep.id = jp.employer_id
    WHERE jp.id = job_applications.job_posting_id
    AND ep.user_id = auth.uid()
    AND public.has_role(auth.uid(), 'employer')
  ));

CREATE POLICY "Employers can update application status"
  ON public.job_applications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.job_postings jp
    JOIN public.employer_profiles ep ON ep.id = jp.employer_id
    WHERE jp.id = job_applications.job_posting_id
    AND ep.user_id = auth.uid()
    AND public.has_role(auth.uid(), 'employer')
  ));

-- Function to sync job postings to cached_jobs for search
CREATE OR REPLACE FUNCTION public.sync_job_posting_to_cached_jobs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  employer_profile RECORD;
  salary_text TEXT;
BEGIN
  -- Get employer profile information
  SELECT * INTO employer_profile 
  FROM public.employer_profiles 
  WHERE id = NEW.employer_id;
  
  -- Format salary text
  IF NEW.salary_min IS NOT NULL AND NEW.salary_max IS NOT NULL THEN
    salary_text := '$' || NEW.salary_min || ' - $' || NEW.salary_max || ' ' || NEW.salary_currency;
  ELSIF NEW.salary_min IS NOT NULL THEN
    salary_text := '$' || NEW.salary_min || '+ ' || NEW.salary_currency;
  ELSIF NEW.salary_max IS NOT NULL THEN
    salary_text := 'Up to $' || NEW.salary_max || ' ' || NEW.salary_currency;
  END IF;
  
  -- Insert or update in cached_jobs
  INSERT INTO public.cached_jobs (
    title,
    company,
    location,
    description,
    salary,
    job_url,
    apply_url,
    source,
    via,
    employment_type,
    experience_level,
    seniority_level,
    remote_type,
    industry,
    job_function,
    data_source,
    job_board,
    quality_score,
    apify_job_id
  ) VALUES (
    NEW.title,
    employer_profile.company_name,
    NEW.location,
    NEW.description,
    salary_text,
    '/job-posting/' || NEW.id,
    '/job-posting/' || NEW.id || '/apply',
    'Employer',
    employer_profile.company_name,
    NEW.employment_type,
    NEW.experience_level,
    NEW.seniority_level,
    NEW.remote_type,
    NEW.industry,
    NEW.job_function,
    'employer',
    'Direct',
    10, -- Higher quality score for direct employer postings
    'employer_' || NEW.id
  )
  ON CONFLICT (apify_job_id) 
  DO UPDATE SET
    title = EXCLUDED.title,
    company = EXCLUDED.company,
    location = EXCLUDED.location,
    description = EXCLUDED.description,
    salary = EXCLUDED.salary,
    employment_type = EXCLUDED.employment_type,
    experience_level = EXCLUDED.experience_level,
    seniority_level = EXCLUDED.seniority_level,
    remote_type = EXCLUDED.remote_type,
    industry = EXCLUDED.industry,
    job_function = EXCLUDED.job_function,
    updated_at = now();
    
  RETURN NEW;
END;
$$;

-- Create trigger to sync job postings
CREATE TRIGGER sync_job_posting_trigger
  AFTER INSERT OR UPDATE ON public.job_postings
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.sync_job_posting_to_cached_jobs();

-- Function to handle new user registration with role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user_with_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert into profiles (existing functionality)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  -- Insert default role (job_seeker) unless specified in metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id, 
    COALESCE(
      (new.raw_user_meta_data->>'role')::app_role, 
      'job_seeker'::app_role
    )
  );
  
  -- Set role preference
  INSERT INTO public.user_role_preferences (user_id, preferred_role)
  VALUES (
    new.id,
    COALESCE(
      (new.raw_user_meta_data->>'role')::app_role, 
      'job_seeker'::app_role
    )
  );
  
  RETURN new;
END;
$$;

-- Update the existing trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_with_role();
