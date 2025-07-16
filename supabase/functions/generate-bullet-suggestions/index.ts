
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility function to clean OpenAI response
function cleanOpenAIResponse(response: string): string {
  // Remove markdown code blocks if present
  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { experienceId, jobDescriptionId, companyName, role, currentDescription } = await req.json();
    
    console.log('Generating bullet suggestions for:', { experienceId, jobDescriptionId, companyName, role });

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

    const prompt = `You are an expert resume writer helping someone optimize their resume for a specific job. 

Job Title: ${jobData.title}
Company: ${companyName}
Role: ${role}
Current Description: ${currentDescription}

Job Requirements/Description:
${jobData.parsed_text}

Generate 5-6 high-impact bullet points for this role that would be relevant additions to their current experience. The bullet points should:
- Use strong action verbs (Led, Managed, Implemented, Achieved, etc.)
- Include quantifiable metrics where appropriate (percentages, numbers, dollar amounts)
- Be tailored specifically to the job requirements above
- Use ATS-friendly formatting with bullet symbols (•)
- Focus on achievements and results rather than just responsibilities
- Be specific to the ${role} role at ${companyName}

Format each bullet point on a new line starting with •

Example format:
• Led cross-functional team of 8 developers to deliver project 3 weeks ahead of schedule, resulting in 15% cost savings
• Implemented automated testing framework that reduced bug reports by 40% and improved deployment efficiency by 25%`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert resume writer specializing in creating compelling, ATS-optimized bullet points. Follow the exact format requested.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response from OpenAI');
    }

    const generatedText = data.choices[0].message.content;
    
    // Parse the bullet points and remove bullet symbols
    const bulletPoints = generatedText
      .split('\n')
      .filter((line: string) => line.trim().startsWith('•'))
      .map((line: string) => line.trim().replace(/^•\s*/, '')) // Remove bullet symbol and whitespace
      .filter((line: string) => line.length > 10); // Filter out very short points

    console.log('Generated bullet points:', bulletPoints);

    return new Response(JSON.stringify({ bulletPoints }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-bullet-suggestions function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
