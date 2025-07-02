
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { resumeText, jobDescription, jobTitle, companyName } = await req.json();

    if (!resumeText || !jobDescription) {
      throw new Error('Resume text and job description are required');
    }

    const prompt = `Create a professional and personalized cover letter based on the following:

RESUME CONTENT:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

Instructions:
1. Write a compelling cover letter that demonstrates how the candidate's experience aligns with the job requirements
2. Use specific examples from the resume that relate to the job description
3. Match the tone to be professional but engaging
4. Keep it concise (3-4 paragraphs)
5. Include a strong opening that mentions the specific role and company
6. Highlight 2-3 key qualifications that make the candidate ideal for this position
7. End with a call to action expressing interest in an interview
8. Do not include placeholder text like [Your Name] - write it as if ready to send
9. Use "Dear Hiring Manager" as the greeting
10. Format it as a complete, professional cover letter

Generate only the cover letter content, no additional commentary.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an expert career counselor and professional writer specializing in creating compelling cover letters that help job seekers stand out.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate cover letter');
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    // Generate a title for the cover letter
    const title = `Cover Letter for ${jobTitle}${companyName ? ` at ${companyName}` : ''}`;

    return new Response(JSON.stringify({ 
      generatedText,
      title 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-cover-letter function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
