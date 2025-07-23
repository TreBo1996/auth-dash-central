
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
const OPENAI_TIMEOUT = 30000; // 30 seconds for ATS scoring

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
  console.log('=== ORIGINAL ATS SCORING START ===');

  try {
    const { resumeId, jobDescriptionId } = await req.json();

    if (!resumeId || !jobDescriptionId) {
      throw new Error('Resume ID and Job Description ID are required');
    }

    console.log('Starting original ATS scoring for resumeId:', resumeId, 'jobDescriptionId:', jobDescriptionId);

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

    // Fetch resume and job description in parallel
    const [resumeResult, jobDescResult] = await Promise.all([
      supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('job_descriptions')
        .select('*')
        .eq('id', jobDescriptionId)
        .eq('user_id', user.id)
        .single()
    ]);

    if (resumeResult.error) {
      console.error('Resume fetch error:', resumeResult.error);
      throw new Error('Resume not found or access denied');
    }

    if (jobDescResult.error) {
      console.error('Job description fetch error:', jobDescResult.error);
      throw new Error('Job description not found or access denied');
    }

    const resume = resumeResult.data;
    const jobDescription = jobDescResult.data;

    if (!resume.parsed_text) {
      throw new Error('Resume has no parsed text content');
    }

    if (!jobDescription.parsed_text) {
      throw new Error('Job description has no parsed text content');
    }

    console.log('Successfully fetched resume and job description for original ATS scoring');

    // Parse resume to extract structured data for user additions form (with timeout and retry)
    console.log('Parsing resume for structured data...');
    
    const parsePrompt = `Extract structured data from this resume text. Return ONLY valid JSON in this exact format:

{
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name", 
      "duration": "Date Range",
      "bullets": ["responsibility 1", "responsibility 2"]
    }
  ]
}

Resume text:
${resume.parsed_text}

Return ONLY the JSON structure above, no additional text.`;

    let parsedResumeData = null;
    try {
      const parseResponse = await callOpenAI(
        parsePrompt,
        'You are a resume parser. Always return valid JSON only, never include markdown or additional text.',
        1500,
        'Resume Structure Parsing'
      );

      const parseResult = parseResponse.choices[0].message.content;
      parsedResumeData = JSON.parse(parseResult);
      console.log('Successfully parsed resume data:', parsedResumeData);
    } catch (parseError) {
      console.warn('Failed to parse resume structure:', parseError);
      // Continue without parsed data - it's optional
    }

    // Call OpenAI API for ATS scoring
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
    "missing_keywords": ["missing1", "missing2", "missing3"]
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

Job Title: ${jobDescription.title}

Job Description:
${jobDescription.parsed_text}

Resume Content:
${resume.parsed_text}

Return ONLY the JSON structure above, no additional text.`;

    console.log('Calling OpenAI API for original ATS scoring...');
    const atsStart = Date.now();

    const openAIData = await callOpenAI(
      prompt,
      'You are an expert ATS analyzer. Always return valid JSON only, never include markdown or additional text.',
      2000,
      'Original ATS Scoring'
    );

    const scoringResult = openAIData.choices[0].message.content;
    const atsTime = Date.now() - atsStart;
    console.log('Original ATS scoring completed in', atsTime, 'ms');

    // Validate that the response is valid JSON
    let atsScoring;
    try {
      atsScoring = JSON.parse(scoringResult);
      console.log('Successfully parsed original ATS scoring:', {
        overall_score: atsScoring.overall_score,
        category_scores: atsScoring.category_scores
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('OpenAI response was not valid JSON');
    }

    const totalTime = Date.now() - startTime;
    console.log(`=== ORIGINAL ATS SCORING COMPLETE === Total time: ${totalTime}ms`);

    return new Response(JSON.stringify({ 
      success: true, 
      ats_score: atsScoring.overall_score,
      ats_feedback: atsScoring,
      parsed_resume_data: parsedResumeData,
      processingTime: {
        total: totalTime,
        ats_scoring: atsTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('Error in calculate-original-ats-score function:', error);
    console.log(`=== ORIGINAL ATS SCORING FAILED === Total time: ${totalTime}ms`);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      processingTime: totalTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
