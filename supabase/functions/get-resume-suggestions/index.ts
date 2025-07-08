import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { experienceId, jobDescriptionId, companyName, role, currentDescription } = await req.json();

    if (!jobDescriptionId || !role || !companyName) {
      throw new Error('Missing required parameters');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Fetch job description
    const { data: jobDescription, error: jobError } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', jobDescriptionId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !jobDescription) {
      throw new Error('Job description not found');
    }

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Generate suggestions
    const prompt = `You are an expert resume optimization specialist. Analyze the job description and provide targeted suggestions for improving this specific work experience.

Job Title: ${jobDescription.title}
Company: ${jobDescription.company || 'Not specified'}

Job Description:
${jobDescription.parsed_text}

Current Experience Entry:
Role: ${role}
Company: ${companyName}
Current Description: ${currentDescription}

Provide 3-5 specific, actionable bullet points that this person could add to enhance their experience for this role. Focus on:
1. Keywords from the job description that are missing
2. Quantifiable achievements that would be relevant
3. Skills and technologies mentioned in the job posting
4. Action verbs and impact statements

Return ONLY a JSON array of strings, no additional text:
["suggestion 1", "suggestion 2", "suggestion 3"]`;

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
            content: 'You are a resume optimization expert. Always return valid JSON arrays of suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const suggestionsText = openAIData.choices[0].message.content;

    let suggestions;
    try {
      suggestions = JSON.parse(suggestionsText);
    } catch (parseError) {
      console.error('Failed to parse suggestions:', parseError);
      throw new Error('Failed to generate valid suggestions');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      suggestions 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-resume-suggestions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});