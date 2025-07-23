
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
const OPENAI_TIMEOUT = 45000; // 45 seconds

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

// Background ATS scoring function
async function performATSScoring(optimizedResumeId: string, supabase: any, openAIApiKey: string) {
  try {
    console.log('Starting background ATS scoring for resume:', optimizedResumeId);
    
    // Fetch optimized resume with related data
    const { data: optimizedResume, error: resumeError } = await supabase
      .from('optimized_resumes')
      .select(`
        *,
        resumes!original_resume_id(file_name, parsed_text),
        job_descriptions!job_description_id(title, parsed_text)
      `)
      .eq('id', optimizedResumeId)
      .single();

    if (resumeError) {
      throw new Error(`Failed to fetch optimized resume: ${resumeError.message}`);
    }

    const resumeContent = optimizedResume.generated_text;
    const jobDescription = optimizedResume.job_descriptions.parsed_text;
    const jobTitle = optimizedResume.job_descriptions.title;

    const atsPrompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following OPTIMIZED resume against the job description and provide a comprehensive ATS compatibility score.

IMPORTANT: This resume has been optimized specifically for this job description, so the score should be significantly HIGHER than a typical unoptimized resume.

CRITICAL: Return ONLY valid JSON in this exact structure:

{
  "overall_score": <number between 80-100 for optimized resumes>,
  "category_scores": {
    "keyword_match": <number between 80-100>,
    "skills_alignment": <number between 80-100>,
    "experience_relevance": <number between 80-100>,
    "format_compliance": <number between 85-100>
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
    "strength 2",
    "strength 3"
  ],
  "areas_for_improvement": [
    "improvement area 1",
    "improvement area 2"
  ]
}

Job Title: ${jobTitle}

Job Description:
${jobDescription}

OPTIMIZED Resume Content:
${resumeContent}

Return ONLY the JSON structure above, no additional text.`;

    const atsResponse = await callOpenAI(
      atsPrompt,
      'You are an expert ATS analyzer. Always return valid JSON only, never include markdown or additional text. Optimized resumes should score 80+ overall.',
      2000,
      'Background ATS Scoring'
    );

    const atsResult = atsResponse.choices[0].message.content;
    const atsScoring = JSON.parse(atsResult);

    // Update the optimized resume with ATS scoring
    await supabase
      .from('optimized_resumes')
      .update({
        ats_score: atsScoring.overall_score,
        ats_feedback: atsScoring,
        scoring_criteria: atsScoring.category_scores,
        scored_at: new Date().toISOString()
      })
      .eq('id', optimizedResumeId);

    console.log('Successfully completed background ATS scoring:', atsScoring.overall_score);
  } catch (error) {
    console.error('Background ATS scoring failed:', error);
    // Don't throw - this is a background task and shouldn't fail the main operation
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('=== RESUME OPTIMIZATION START ===');

  try {
    const { resumeId, jobDescriptionId, userAdditions = [] } = await req.json();

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

    console.log('Authenticated user:', user.id);

    // Check if user can use resume optimization feature
    const { data: usageCheck, error: usageError } = await supabase.rpc('can_use_feature', {
      p_user_id: user.id,
      p_feature_type: 'resume_optimizations'
    });

    if (usageError) {
      console.error('Error checking usage limits:', usageError);
      throw new Error('Unable to verify usage limits');
    }

    const canUse = usageCheck[0];
    if (!canUse.can_use) {
      console.log('User has reached monthly limit for resume optimizations');
      return new Response(JSON.stringify({ 
        error: 'Monthly limit reached',
        message: `You have reached your monthly limit of resume optimizations. You have used ${canUse.current_usage} optimizations this month.`,
        upgrade_required: true,
        current_usage: canUse.current_usage
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch resume and job description in parallel
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

    // Build user additions section for prompt
    let userAdditionsSection = '';
    if (userAdditions && userAdditions.length > 0) {
      userAdditionsSection = `\n\nUSER-PROVIDED ADDITIONS TO INCORPORATE AND OPTIMIZE:
The user has specified these additional experiences/skills to include in specific roles:
${userAdditions.map(addition => 
  `- ADD "${addition.content}" to the "${addition.target_experience_title}" role${addition.target_experience_company ? ` at ${addition.target_experience_company}` : ''} (Type: ${addition.addition_type})`
).join('\n')}

CRITICAL OPTIMIZATION INSTRUCTIONS FOR USER ADDITIONS:
1. **PROFESSIONALLY REWORD**: Transform each user addition from casual language into professional, industry-standard terminology
2. **KEYWORD INTEGRATION**: Seamlessly integrate relevant keywords from the job description into each addition
3. **ENHANCE ACTION VERBS**: Use strong, ATS-friendly action verbs that match the job requirements
4. **QUANTIFY WHEN POSSIBLE**: If the user provides any numbers or metrics, emphasize them professionally
5. **MATCH TONE & STYLE**: Ensure additions flow naturally with the optimized resume's professional tone
6. **TYPE-SPECIFIC HANDLING**:
   - Skills: Use industry-standard terminology and group with related skills
   - Experience/Responsibilities: Transform into impactful bullet points with strong action verbs
   - Achievements: Emphasize measurable impact and results
7. **SEAMLESS INTEGRATION**: Make additions appear as natural parts of the original experience, not obvious insertions

These are legitimate experiences the user wants highlighted - treat them as raw material that needs professional enhancement and optimization, not just insertion.`;
    }

    // Optimized prompt (streamlined while maintaining functionality)
    const prompt = `You are an expert ATS optimization specialist. Your PRIMARY OBJECTIVE is to enhance the existing resume content for better ATS compatibility while maintaining complete accuracy and authenticity.

CRITICAL CONTACT INFORMATION EXTRACTION - HIGHEST PRIORITY:
1. **NEVER USE PLACEHOLDER CONTACT INFORMATION**: ABSOLUTELY NO placeholders like "email@example.com", "your.email@example.com", "+1234567890", "(555) 123-4567", "City, State", etc.
2. **EXTRACT ACTUAL CONTACT DATA**: Carefully scan the original resume text for real email addresses, phone numbers, names, and locations
3. **LOOK FOR CONTACT PATTERNS**: Search for patterns like:
   - Email: look for @gmail.com, @yahoo.com, @outlook.com, @[company].com, etc.
   - Phone: look for actual phone numbers like (XXX) XXX-XXXX, XXX-XXX-XXXX, +1-XXX-XXX-XXXX
   - Name: usually appears at the top of the resume
   - Location: look for "City, ST", "City, State", specific addresses
4. **VALIDATION RULES**: 
   - If you find a real email, use it exactly as written
   - If you find a real phone number, preserve the original formatting
   - If you find the person's actual name, use it exactly
   - If you find a real location, use it exactly
   - If contact information is unclear or missing from the original text, use "Not provided" rather than placeholders

CRITICAL AUTHENTICITY REQUIREMENTS:
1. **PRESERVE ORIGINAL EXPERIENCES**: NEVER create, add, or invent new job positions, responsibilities, or achievements
2. **ENHANCE EXISTING CONTENT ONLY**: Only improve the wording, structure, and keyword integration of existing bullet points
3. **NO FABRICATED METRICS**: Only suggest quantifiable metrics where they can reasonably be inferred from existing content - NEVER invent specific numbers, percentages, or dollar amounts
4. **MAINTAIN ORIGINAL STRUCTURE**: Keep the same number of experiences and preserve the essence of each role
5. **NO NEW CERTIFICATIONS**: Only include certifications that already exist in the original resume
6. **KEYWORD INTEGRATION**: Naturally integrate relevant job description keywords into existing content without changing the fundamental meaning

ATS OPTIMIZATION STRATEGIES:
- Improve keyword density by rephrasing existing content with job description terminology
- Enhance action verbs while preserving the original responsibilities
- Restructure existing bullet points for better ATS readability
- **SKILLS LIMITATION**: Select ONLY the top 6 most relevant skills from the original resume that match the job description - organize them into 1-2 skill categories maximum
- Prioritize skills that appear in or closely relate to the job description requirements
- Improve formatting for ATS compatibility
- Enhance existing education and certification descriptions (if any exist)

CONTENT ENHANCEMENT RULES:
- Improve clarity and professional tone of existing bullet points
- Integrate job description keywords naturally into existing responsibilities
- Enhance action verbs but keep the same underlying activities
- Maintain the original timeline and progression of roles
- NEVER add responsibilities or achievements that weren't in the original resume
- **SKILLS SELECTION**: Choose MAXIMUM 6 individual skills from the original resume that are most relevant to the job description
- Focus on better articulation rather than content expansion

You MUST return ONLY valid JSON. The structure should match the original resume's sections exactly:

{
  "name": "ACTUAL FULL NAME FROM RESUME (never placeholder)",
  "contact": {
    "email": "ACTUAL EMAIL FROM RESUME (never placeholder)",
    "phone": "ACTUAL PHONE FROM RESUME (never placeholder)", 
    "location": "ACTUAL LOCATION FROM RESUME (never placeholder)"
  },
  "summary": "Enhanced professional summary with job description keywords (based on original if it exists)",
  "experience": [
    {
      "title": "Job Title (exact from original)",
      "company": "Company Name (exact from original)",
      "duration": "Start Date - End Date (exact from original)",
      "bullets": [
        "Enhanced version of original bullet point 1",
        "Enhanced version of original bullet point 2",
        "Enhanced version of original bullet point 3"
      ]
    }
  ],
  "skills": [
    {
      "category": "Most Relevant Skills",
      "items": ["Top relevant skill 1", "Top relevant skill 2", "Top relevant skill 3"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name (from original)",
      "school": "Institution Name (from original)", 
      "year": "Year (from original)"
    }
  ]
}

IMPORTANT: Only include "certifications" array if the original resume had certifications. Maintain the same number of experiences as the original resume. **CRITICAL SKILLS REQUIREMENT**: Select ONLY the top 6 most relevant skills from the original resume - no more than 6 individual skill items total.

TARGET JOB DESCRIPTION:
${jobDescription.parsed_text}

ORIGINAL RESUME TO OPTIMIZE:
${resume.parsed_text}
${userAdditionsSection}

Return ONLY the enhanced resume as valid JSON.`;

    // Call OpenAI API for resume optimization
    console.log('Calling OpenAI API for resume optimization...');
    const optimizationStart = Date.now();
    
    const openAIData = await callOpenAI(
      prompt,
      'You are an expert ATS optimization specialist focused on enhancing existing resume content for better compatibility while maintaining complete authenticity. Never fabricate experiences, achievements, or certifications. Always return valid JSON only.',
      4000,
      'Resume Optimization'
    );

    const generatedText = openAIData.choices[0].message.content;
    const optimizationTime = Date.now() - optimizationStart;
    console.log('Resume optimization completed in', optimizationTime, 'ms');

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

    // Save optimized resume to database
    console.log('Saving optimized resume to database...');
    const dbStart = Date.now();
    
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

    // Store structured data in the new tables using parallel operations
    const structuredDataOperations = [];

    // Store contact information and summary
    const contactData = {
      name: structuredResume.name || '',
      email: structuredResume.contact?.email || '',
      phone: structuredResume.contact?.phone || '',
      location: structuredResume.contact?.location || ''
    };

    structuredDataOperations.push(
      supabase
        .from('resume_sections')
        .insert([
          {
            optimized_resume_id: optimizedResume.id,
            section_type: 'contact',
            content: contactData
          },
          {
            optimized_resume_id: optimizedResume.id,
            section_type: 'summary',
            content: { summary: structuredResume.summary || '' }
          }
        ])
    );

    // Store experiences with enhanced bullet points
    if (structuredResume.experience && structuredResume.experience.length > 0) {
      const experienceInserts = structuredResume.experience.map((exp, index) => ({
        optimized_resume_id: optimizedResume.id,
        title: exp.title || '',
        company: exp.company || '',
        duration: exp.duration || '',
        bullets: exp.bullets || [],
        display_order: index
      }));

      structuredDataOperations.push(
        supabase
          .from('resume_experiences')
          .insert(experienceInserts)
      );
    }

    // Store enhanced skills
    if (structuredResume.skills && structuredResume.skills.length > 0) {
      const skillsInserts = structuredResume.skills.map((skill, index) => ({
        optimized_resume_id: optimizedResume.id,
        category: skill.category || '',
        items: skill.items || [],
        display_order: index
      }));

      structuredDataOperations.push(
        supabase
          .from('resume_skills')
          .insert(skillsInserts)
      );
    }

    // Store education
    if (structuredResume.education && structuredResume.education.length > 0) {
      const educationInserts = structuredResume.education.map((edu, index) => ({
        optimized_resume_id: optimizedResume.id,
        degree: edu.degree || '',
        school: edu.school || '',
        year: edu.year || '',
        display_order: index
      }));

      structuredDataOperations.push(
        supabase
          .from('resume_education')
          .insert(educationInserts)
      );
    }

    // Store certifications
    if (structuredResume.certifications && structuredResume.certifications.length > 0) {
      const certificationsInserts = structuredResume.certifications.map((cert, index) => ({
        optimized_resume_id: optimizedResume.id,
        name: cert.name || '',
        issuer: cert.issuer || '',
        year: cert.year || '',
        display_order: index
      }));

      structuredDataOperations.push(
        supabase
          .from('resume_certifications')
          .insert(certificationsInserts)
      );
    }

    // Execute all structured data operations in parallel
    await Promise.all(structuredDataOperations);
    
    const dbTime = Date.now() - dbStart;
    console.log('Database operations completed in', dbTime, 'ms');

    // Increment usage count for the user
    try {
      await supabase.rpc('increment_feature_usage', {
        p_user_id: user.id,
        p_feature_type: 'resume_optimizations'
      });
      console.log('Successfully incremented resume optimization usage');
    } catch (usageIncrementError) {
      console.error('Error incrementing usage count:', usageIncrementError);
      // Don't fail the entire operation if usage tracking fails
    }

    // Start background ATS scoring (non-blocking)
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (openAIApiKey) {
      console.log('Starting background ATS scoring...');
      EdgeRuntime.waitUntil(
        performATSScoring(optimizedResume.id, supabase, openAIApiKey)
      );
    }

    const totalTime = Date.now() - startTime;
    console.log(`=== RESUME OPTIMIZATION COMPLETE === Total time: ${totalTime}ms`);

    return new Response(JSON.stringify({ 
      success: true, 
      optimizedResume: optimizedResume,
      processingTime: {
        total: totalTime,
        optimization: optimizationTime,
        database: dbTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('Error in optimize-resume function:', error);
    console.log(`=== RESUME OPTIMIZATION FAILED === Total time: ${totalTime}ms`);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      processingTime: totalTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
