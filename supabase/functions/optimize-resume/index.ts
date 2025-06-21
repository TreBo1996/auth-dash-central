
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

    const prompt = `You are an expert resume optimizer and ATS (Applicant Tracking System) specialist. Your task is to optimize the original resume for the specific job description while maintaining authenticity and ALL original job information.

CRITICAL REQUIREMENTS:
1. PRESERVE ALL ORIGINAL JOBS: Keep every single job title, company name, and employment dates exactly as they appear
2. OPTIMIZE JOB DESCRIPTIONS ONLY: Focus exclusively on rewriting job descriptions using strategic bullet points
3. MANDATORY BULLET POINT FORMAT: Each job MUST have exactly 3-5 bullet points using "•" symbol
4. STRATEGIC KEYWORD INTEGRATION: Analyze the job description and weave relevant keywords naturally into bullet points
5. QUANTIFY ACHIEVEMENTS: Include specific metrics, percentages, dollar amounts, and measurable results
6. MAINTAIN AUTHENTICITY: Only use realistic achievements that could reasonably apply to the original role

BULLET POINT OPTIMIZATION STRATEGY:
- Start each bullet with powerful action verbs (Led, Developed, Implemented, Managed, Coordinated, Optimized, etc.)
- Include 1-2 key industry terms/keywords from the job description per bullet point
- Focus on transferable skills that match the target role requirements
- Use quantifiable results (increased efficiency by X%, managed budgets of $X, coordinated X projects, etc.)
- Emphasize leadership, problem-solving, and project management aspects

KEYWORD EXTRACTION INSTRUCTIONS:
Carefully analyze the job description and identify:
- Core responsibilities and required skills
- Industry-specific terminology
- Technical tools and software mentioned
- Soft skills emphasized (communication, leadership, organization, etc.)
- Key action words and phrases used

FORMATTING REQUIREMENTS:
- Section headers: SUMMARY, EXPERIENCE, SKILLS, EDUCATION, CERTIFICATIONS
- Job format: Company Name | Job Title | Start Date - End Date
- Follow immediately with 3-5 bullet points using "•" symbol
- Maintain consistent formatting throughout
- Keep all other sections (Summary, Skills, Education) intact

EXAMPLE OPTIMIZATION:
Original: "Responsible for managing projects and working with teams."
Optimized: "• Coordinated cross-functional project teams of 8+ members, ensuring 95% on-time delivery of key initiatives
• Implemented project tracking systems using Gantt charts, reducing project delays by 30%
• Managed stakeholder communication across multiple venues, facilitating seamless project execution"

Original Resume:
${resume.parsed_text}

Target Job Description:
${jobDescription.parsed_text}

Please provide the complete optimized resume with strategically enhanced bullet points that incorporate relevant keywords from the job description while maintaining the original job structure and authenticity.`;

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
            content: 'You are a world-class resume optimization expert with deep knowledge of ATS systems, keyword optimization, and professional formatting. You specialize in creating compelling bullet points that showcase achievements while strategically incorporating job-relevant keywords. You always maintain candidate authenticity while maximizing their competitiveness for specific roles.'
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

    console.log('Successfully generated optimized resume content');

    // Save optimized resume to database
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
