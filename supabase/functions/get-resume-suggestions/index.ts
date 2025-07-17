import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('get-resume-suggestions function called:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request...');
    const body = await req.json();
    console.log('Request body:', body);
    
    const { experienceId, jobDescriptionId, companyName, role, currentDescription } = body;

    if (!jobDescriptionId || !role || !companyName) {
      console.error('Missing required parameters:', { jobDescriptionId, role, companyName });
      throw new Error('Missing required parameters: jobDescriptionId, role, and companyName are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Server configuration error: Missing Supabase credentials');
    }
    
    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('Authorization header is required');
    }

    console.log('Authenticating user...');
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      throw new Error('User not authenticated');
    }
    
    console.log('User authenticated:', user.id);

    // Fetch job description
    console.log('Fetching job description:', jobDescriptionId);
    const { data: jobDescription, error: jobError } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', jobDescriptionId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !jobDescription) {
      console.error('Job description fetch error:', jobError);
      throw new Error('Job description not found or access denied');
    }
    
    console.log('Job description found:', jobDescription.title);

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }
    
    console.log('Generating AI suggestions...');

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

    console.log('Calling OpenAI API...');
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
      console.error('OpenAI API error:', openAIResponse.status, openAIResponse.statusText);
      const errorText = await openAIResponse.text();
      console.error('OpenAI error details:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('OpenAI response received');
    const suggestionsText = openAIData.choices[0].message.content;

    let suggestions;
    try {
      suggestions = JSON.parse(suggestionsText);
      console.log('Suggestions parsed successfully:', suggestions.length, 'suggestions');
    } catch (parseError) {
      console.error('Failed to parse suggestions:', parseError);
      console.error('Raw suggestions text:', suggestionsText);
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
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});