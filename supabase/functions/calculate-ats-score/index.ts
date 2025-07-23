
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 8000,
  backoffMultiplier: 2
};

// OpenAI timeout configuration
const OPENAI_TIMEOUT = 30000; // 30 seconds

// Exponential backoff retry function
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  context: string,
  retries = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`${context} - Attempt ${attempt + 1}/${retries + 1}`);
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`${context} - Attempt ${attempt + 1} failed:`, error);
      
      if (attempt === retries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelay
      );
      
      console.log(`${context} - Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// OpenAI API call with timeout and retry
async function callOpenAI(prompt: string, systemContent: string, maxTokens: number, context: string) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  return await retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens,
          temperature: 0.3,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`OpenAI API timeout after ${OPENAI_TIMEOUT}ms`);
      }
      throw error;
    }
  }, context);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('=== OPTIMIZED ATS SCORING START ===');

  try {
    const { optimizedResumeId } = await req.json();

    if (!optimizedResumeId) {
      throw new Error('Optimized Resume ID is required');
    }

    console.log('Starting ATS scoring for optimized resume:', optimizedResumeId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase environment variables not configured');
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header to extract the JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      console.error('User authentication error:', userError);
      throw new Error('User not authenticated');
    }

    // Fetch optimized resume with related data
    const { data: optimizedResume, error: resumeError } = await supabase
      .from('optimized_resumes')
      .select(`
        *,
        resumes!original_resume_id(file_name, parsed_text),
        job_descriptions!job_description_id(title, parsed_text)
      `)
      .eq('id', optimizedResumeId)
      .eq('user_id', user.id)
      .single();

    if (resumeError) {
      console.error('Optimized resume fetch error:', resumeError);
      throw new Error('Optimized resume not found or access denied');
    }

    const resumeContent = optimizedResume.generated_text;
    const jobDescription = optimizedResume.job_descriptions.parsed_text;
    const jobTitle = optimizedResume.job_descriptions.title;

    console.log('Fetched resume and job description for ATS scoring');

    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume against the job description and provide a comprehensive ATS compatibility score.

CRITICAL: Return ONLY valid JSON in this exact structure:

{
  "overall_score": <number between 0-100>,
  "category_scores": {
    "keyword_match": <number between 0-100>,
    "skills_alignment": <number between 0-100>,
    "experience_relevance": <number between 0-100>,
    "format_compliance": <number between 0-100>
  },
  "recommendations": [
    "specific actionable recommendation 1",
    "specific actionable recommendation 2",
    "specific actionable recommendation 3"
  ],
  "keyword_analysis": {
    "matched_keywords": ["keyword1", "keyword2", "keyword3"],
    "missing_keywords": ["missing1", "missing2"]
  },
  "strengths": [
    "strength 1",
    "strength 2"
  ],
  "areas_for_improvement": [
    "improvement area 1",
    "improvement area 2"
  ]
}

SCORING CRITERIA:
- keyword_match: How well resume keywords match job description (0-100)
- skills_alignment: How well skills align with job requirements (0-100)
- experience_relevance: How relevant experience is to the role (0-100)
- format_compliance: How ATS-friendly the resume format is (0-100)

Job Title: ${jobTitle}

Job Description:
${jobDescription}

Resume Content:
${resumeContent}

Return ONLY the JSON structure above, no additional text.`;

    console.log('Calling OpenAI API for optimized ATS scoring...');
    const atsStart = Date.now();

    const openAIData = await callOpenAI(
      prompt,
      'You are an expert ATS analyzer. Always return valid JSON only, never include markdown or additional text.',
      2000,
      'Optimized ATS Scoring'
    );

    const scoringResult = openAIData.choices[0].message.content;
    const atsTime = Date.now() - atsStart;
    console.log('Optimized ATS scoring completed in', atsTime, 'ms');

    // Validate that the response is valid JSON
    let atsScoring;
    try {
      atsScoring = JSON.parse(scoringResult);
      console.log('Successfully parsed ATS scoring:', {
        overall_score: atsScoring.overall_score,
        category_scores: atsScoring.category_scores
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('OpenAI response was not valid JSON');
    }

    // Update optimized resume with ATS scoring
    const { data: updatedResume, error: updateError } = await supabase
      .from('optimized_resumes')
      .update({
        ats_score: atsScoring.overall_score,
        ats_feedback: atsScoring,
        scoring_criteria: atsScoring.category_scores,
        scored_at: new Date().toISOString()
      })
      .eq('id', optimizedResumeId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to save ATS score: ${updateError.message}`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`=== OPTIMIZED ATS SCORING COMPLETE === Total time: ${totalTime}ms`);

    return new Response(JSON.stringify({ 
      success: true, 
      ats_score: atsScoring.overall_score,
      ats_feedback: atsScoring,
      processingTime: {
        total: totalTime,
        ats_scoring: atsTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('Error in calculate-ats-score function:', error);
    console.log(`=== OPTIMIZED ATS SCORING FAILED === Total time: ${totalTime}ms`);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      processingTime: totalTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
