
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

    console.log('Calling OpenAI API for two-stage resume optimization...');

    const prompt = `You are an expert resume optimizer and ATS (Applicant Tracking System) specialist. Your task is to optimize the original resume for the specific job description using a TWO-STAGE APPROACH.

CRITICAL REQUIREMENTS:
1. PRESERVE ALL ORIGINAL JOBS: Keep every single job title, company name, and employment dates exactly as they appear
2. TWO-STAGE PROCESSING for each job description:
   - STAGE 1: Break down paragraph descriptions into 3-5 logical bullet points
   - STAGE 2: Optimize each bullet point with strategic keywords and metrics
3. MANDATORY BULLET POINT FORMAT: Each job MUST have exactly 3-5 bullet points using "•" symbol
4. MAINTAIN AUTHENTICITY: Only use realistic achievements that could reasonably apply to the original role

TWO-STAGE PROCESSING INSTRUCTIONS:

STAGE 1 - CONTENT BREAKDOWN:
- If job description is in paragraph format: Break it into 3-5 key responsibilities/achievements
- If job description already has bullet points: Use existing structure as foundation
- Identify core responsibilities, key achievements, and quantifiable results
- Ensure each bullet point represents a distinct accomplishment or responsibility

STAGE 2 - STRATEGIC OPTIMIZATION:
- Analyze the job description for relevant keywords and requirements
- Integrate 1-2 key industry terms per bullet point naturally
- Add quantifiable metrics (percentages, dollar amounts, team sizes, project counts)
- Use powerful action verbs (Led, Developed, Implemented, Managed, Coordinated, Optimized)
- Align content with target role requirements and responsibilities

KEYWORD INTEGRATION STRATEGY:
Carefully analyze the job description and identify:
- Core responsibilities and required skills
- Industry-specific terminology and technical tools
- Soft skills emphasized (communication, leadership, organization)
- Key action words and measurable outcomes mentioned
- Company culture and values indicated

BULLET POINT OPTIMIZATION FORMULA:
Each bullet should follow: [Action Verb] + [What You Did] + [How/Tools Used] + [Quantifiable Result]

Example Transformation:
Original Paragraph: "Responsible for managing projects and working with teams to deliver results on time."

STAGE 1 - Breakdown:
• Managed multiple cross-functional projects
• Collaborated with diverse teams 
• Ensured timely project completion

STAGE 2 - Optimization:
• Led cross-functional project teams of 8+ members, utilizing Agile methodologies to achieve 95% on-time delivery rate
• Coordinated stakeholder communication across 5 departments, implementing weekly status meetings that improved project transparency by 40%
• Managed project budgets totaling $2M+, delivering initiatives 15% under budget through strategic resource allocation

FORMATTING REQUIREMENTS:
- Section headers: SUMMARY, EXPERIENCE, SKILLS, EDUCATION, CERTIFICATIONS
- Job format: Company Name | Job Title | Start Date - End Date
- Follow immediately with 3-5 bullet points using "•" symbol
- Maintain consistent formatting throughout
- Keep all other sections (Summary, Skills, Education) intact but enhance with relevant keywords

Original Resume:
${resume.parsed_text}

Target Job Description:
${jobDescription.parsed_text}

Please provide the complete optimized resume with strategically enhanced bullet points that result from the two-stage processing approach. Each job description should be transformed from paragraph format (if applicable) into 3-5 optimized bullet points that incorporate relevant keywords while maintaining authenticity.`;

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
            content: 'You are a world-class resume optimization expert specializing in ATS systems and strategic keyword integration. You excel at breaking down complex job descriptions into compelling bullet points and then optimizing each one for maximum impact. You understand both the technical requirements of ATS systems and the human psychology of hiring managers. Your two-stage approach ensures that every resume you optimize maintains authenticity while maximizing competitiveness for specific roles.'
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

    console.log('Successfully generated optimized resume with two-stage processing');

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

    console.log('Successfully created optimized resume with enhanced bullet points:', optimizedResume.id);

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
