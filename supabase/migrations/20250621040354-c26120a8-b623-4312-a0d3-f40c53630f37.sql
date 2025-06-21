
-- Add plan_level to profiles table to track user subscription tiers
ALTER TABLE public.profiles 
ADD COLUMN plan_level TEXT DEFAULT 'free' CHECK (plan_level IN ('free', 'starter', 'premium'));

-- Create template metadata table
CREATE TABLE public.resume_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  premium_required BOOLEAN DEFAULT false,
  template_config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default templates
INSERT INTO public.resume_templates (name, description, premium_required, template_config) VALUES
('Basic Professional', 'Clean single-column layout perfect for any industry', false, '{"layout": "single-column", "colors": {"primary": "#1f2937", "accent": "#3b82f6"}, "fonts": {"heading": "font-bold", "body": "font-normal"}}'),
('Modern Professional', 'Contemporary two-column design with sidebar', false, '{"layout": "two-column", "colors": {"primary": "#111827", "accent": "#6366f1"}, "fonts": {"heading": "font-semibold", "body": "font-normal"}}'),
('Executive Premium', 'Sophisticated layout for senior-level positions', true, '{"layout": "executive", "colors": {"primary": "#0f172a", "accent": "#059669"}, "fonts": {"heading": "font-bold", "body": "font-medium"}}'),
('Creative Premium', 'Stylized design for creative professionals', true, '{"layout": "creative", "colors": {"primary": "#581c87", "accent": "#db2777"}, "fonts": {"heading": "font-bold", "body": "font-normal"}}'),
('Tech Premium', 'Modern design optimized for technical roles', true, '{"layout": "tech", "colors": {"primary": "#0c4a6e", "accent": "#0ea5e9"}, "fonts": {"heading": "font-semibold", "body": "font-normal"}}');

-- Create user template preferences table
CREATE TABLE public.user_template_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_template_id UUID REFERENCES public.resume_templates(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create resume exports tracking table
CREATE TABLE public.resume_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  optimized_resume_id UUID NOT NULL REFERENCES public.optimized_resumes(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.resume_templates(id),
  file_name TEXT NOT NULL,
  file_path TEXT,
  export_format TEXT DEFAULT 'pdf',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_template_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_exports ENABLE ROW LEVEL SECURITY;

-- RLS policies for resume_templates (readable by all authenticated users)
CREATE POLICY "All users can view templates"
  ON public.resume_templates FOR SELECT
  TO authenticated
  USING (true);

-- RLS policies for user_template_preferences
CREATE POLICY "Users can view their own template preferences"
  ON public.user_template_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own template preferences"
  ON public.user_template_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own template preferences"
  ON public.user_template_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own template preferences"
  ON public.user_template_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for resume_exports
CREATE POLICY "Users can view their own exports"
  ON public.resume_exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exports"
  ON public.resume_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exports"
  ON public.resume_exports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exports"
  ON public.resume_exports FOR DELETE
  USING (auth.uid() = user_id);
