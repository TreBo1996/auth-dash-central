
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeId, jobDescriptionId } = await req.json();

    if (!resumeId || !jobDescriptionId) {
      throw new Error('Resume ID and Job Description ID are required');
    }

    console.log('Starting resume optimization with resumeId:', resumeId, 'jobDescriptionId:', jobDescriptionId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase environment variables not configured');
      throw new Error('Supabase configuration missing');
    }

    // Create Supabase client with service role key for server-side operations
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

    // Extract the JWT token from the Bearer token
    const jwt = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      console.error('User authentication error:', userError);
      throw new Error('User not authenticated');
    }

    console.log('Authenticated user:', user.id);

    // Fetch resume and job description
    console.log('Fetching resume and job description...');
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

    console.log('Successfully fetched resume and job description');

    // Call OpenAI API
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your Supabase secrets.');
    }

    console.log('Calling OpenAI API for resume optimization...');

    const prompt = `You are an expert resume optimizer and ATS specialist. Your task is to optimize the resume for the specific job description and return the result as structured JSON.

CRITICAL OUTPUT FORMAT REQUIREMENTS:
You MUST return ONLY valid JSON in exactly this structure:

{
  "name": "Full Name",
  "contact": {
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "City, State"
  },
  "summary": "Professional summary paragraph",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Start Date - End Date",
      "bullets": [
        "Achievement/responsibility with metrics and keywords",
        "Achievement/responsibility with metrics and keywords",
        "Achievement/responsibility with metrics and keywords"
      ]
    }
  ],
  "skills": [
    {
      "category": "Technical Skills",
      "items": ["Skill 1", "Skill 2", "Skill 3"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "school": "Institution Name",
      "year": "Year"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "year": "Year"
    }
  ]
}

OPTIMIZATION GUIDELINES:
1. Each job should have 3-5 bullet points maximum
2. Include quantifiable metrics (percentages, dollar amounts, team sizes)
3. Use powerful action verbs (Led, Developed, Implemented, Managed, Coordinated)
4. Integrate relevant keywords from the job description naturally
5. Keep all original company names, job titles, and dates EXACTLY as provided
6. Return ONLY the JSON structure above, no additional text or markdown

Original Resume:
${resume.parsed_text}

Target Job Description:
${jobDescription.parsed_text}

Provide ONLY the optimized resume as valid JSON in the exact structure specified above.`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional resume optimization expert. You create ATS-friendly resumes using structured JSON format. Always return valid JSON only, never include markdown or additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate optimized resume: ${openAIResponse.status} ${openAIResponse.statusText}`);
    }

    const openAIData = await openAIResponse.json();
    const generatedText = openAIData.choices[0].message.content;

    console.log('Generated resume length:', generatedText.length);
    console.log('Generated preview:', generatedText.substring(0, 500));

    // Validate that the response is valid JSON
    let structuredResume;
    try {
      structuredResume = JSON.parse(generatedText);
      console.log('Successfully parsed structured resume:', {
        name: structuredResume.name,
        experienceCount: structuredResume.experience?.length || 0,
        skillsCount: structuredResume.skills?.length || 0,
        educationCount: structuredResume.education?.length || 0
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('OpenAI response was not valid JSON');
    }

    // Save optimized resume to database (store as JSON string)
    console.log('Saving optimized resume to database...');
    const { data: optimizedResume, error: saveError } = await supabase
      .from('optimized_resumes')
      .insert({
        user_id: user.id,
        original_resume_id: resumeId,
        job_description_id: jobDescriptionId,
        generated_text: generatedText,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Database save error:', saveError);
      throw new Error(`Failed to save optimized resume: ${saveError.message}`);
    }

    console.log('Successfully created optimized resume:', optimizedResume.id);

    return new Response(JSON.stringify({ 
      success: true, 
      optimizedResume: optimizedResume
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in optimize-resume function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
