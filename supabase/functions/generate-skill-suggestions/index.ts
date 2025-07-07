import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescriptionId, currentSkills } = await req.json();
    
    console.log('Generating skill suggestions for job description:', jobDescriptionId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the job description to get context
    const { data: jobData, error: jobError } = await supabase
      .from('job_descriptions')
      .select('parsed_text, title')
      .eq('id', jobDescriptionId)
      .single();

    if (jobError) {
      console.error('Error fetching job description:', jobError);
      throw new Error('Failed to fetch job description');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const currentSkillsList = currentSkills.map((group: any) => 
      `${group.category}: ${group.items.join(', ')}`
    ).join('\n');

    const prompt = `You are an expert resume writer helping someone identify relevant skills for a specific job position.

Job Title: ${jobData.title}

Job Requirements/Description:
${jobData.parsed_text}

Current Skills on Resume:
${currentSkillsList}

Analyze this job description and suggest 8-12 relevant skills that would be valuable for this role. Only suggest skills that are:
- Commonly required for this position based on the job description
- Skills that a candidate might realistically possess
- A mix of technical and soft skills as appropriate for the role
- Skills that aren't already prominently featured in their current skills

Organize the skills into 2-3 logical categories (e.g., "Technical Skills", "Professional Skills", "Industry Skills").

IMPORTANT: Only suggest realistic skills that candidates might actually possess. Do not suggest overly specific tools unless they're clearly mentioned in the job description.

Format your response as JSON with this structure:
{
  "skillCategories": [
    {
      "category": "Technical Skills",
      "skills": ["JavaScript", "Python", "SQL"]
    },
    {
      "category": "Professional Skills", 
      "skills": ["Project Management", "Team Leadership"]
    }
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert resume writer specializing in identifying relevant skills for job positions. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response from OpenAI');
    }

    const generatedText = data.choices[0].message.content;
    
    try {
      const skillSuggestions = JSON.parse(generatedText);
      console.log('Generated skill suggestions:', skillSuggestions);

      return new Response(JSON.stringify(skillSuggestions), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Raw response:', generatedText);
      throw new Error('Failed to parse skill suggestions');
    }

  } catch (error) {
    console.error('Error in generate-skill-suggestions function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});