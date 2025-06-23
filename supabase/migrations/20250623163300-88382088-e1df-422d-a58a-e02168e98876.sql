
-- Create interview_sessions table to store complete interview sessions
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  job_description_id UUID REFERENCES public.job_descriptions(id) NOT NULL,
  session_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (session_status IN ('in_progress', 'completed', 'paused')),
  total_questions INTEGER NOT NULL DEFAULT 5,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  overall_score DECIMAL(3,1), -- Average score across all responses
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interview_responses table to store individual question responses
CREATE TABLE public.interview_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('behavioral', 'technical')),
  question_index INTEGER NOT NULL,
  user_response_text TEXT NOT NULL,
  audio_file_url TEXT, -- For storing audio recordings if needed
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  feedback TEXT NOT NULL,
  job_relevance_score INTEGER CHECK (job_relevance_score >= 1 AND job_relevance_score <= 10),
  clarity_score INTEGER CHECK (clarity_score >= 1 AND clarity_score <= 10),
  examples_score INTEGER CHECK (examples_score >= 1 AND examples_score <= 10),
  response_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own data
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for interview_sessions
CREATE POLICY "Users can view their own interview sessions" 
  ON public.interview_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interview sessions" 
  ON public.interview_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview sessions" 
  ON public.interview_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview sessions" 
  ON public.interview_sessions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for interview_responses
CREATE POLICY "Users can view their own interview responses" 
  ON public.interview_responses 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions 
      WHERE interview_sessions.id = interview_responses.session_id 
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own interview responses" 
  ON public.interview_responses 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interview_sessions 
      WHERE interview_sessions.id = interview_responses.session_id 
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own interview responses" 
  ON public.interview_responses 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions 
      WHERE interview_sessions.id = interview_responses.session_id 
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own interview responses" 
  ON public.interview_responses 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions 
      WHERE interview_sessions.id = interview_responses.session_id 
      AND interview_sessions.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_interview_sessions_user_id ON public.interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_job_description_id ON public.interview_sessions(job_description_id);
CREATE INDEX idx_interview_responses_session_id ON public.interview_responses(session_id);
CREATE INDEX idx_interview_responses_question_index ON public.interview_responses(question_index);
