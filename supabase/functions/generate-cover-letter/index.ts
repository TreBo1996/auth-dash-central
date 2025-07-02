
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Try both possible secret names for OpenAI API key
const openAIApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OpenAI');

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
    console.log('Starting generate-cover-letter function');
    
    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured. Please check Edge Function secrets.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    console.log('Request body received:', { 
      hasResumeText: !!requestBody.resumeText,
      hasJobDescription: !!requestBody.jobDescription,
      jobTitle: requestBody.jobTitle,
      companyName: requestBody.companyName,
      resumeTextLength: requestBody.resumeText?.length || 0,
      jobDescriptionLength: requestBody.jobDescription?.length || 0
    });

    const { resumeText, jobDescription, jobTitle, companyName } = requestBody;

    // Validate required parameters
    if (!resumeText) {
      console.error('Missing resumeText parameter');
      return new Response(JSON.stringify({ error: 'Resume text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!jobDescription) {
      console.error('Missing jobDescription parameter');
      return new Response(JSON.stringify({ error: 'Job description is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!jobTitle) {
      console.error('Missing jobTitle parameter');
      return new Response(JSON.stringify({ error: 'Job title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Create a professional and personalized cover letter based on the following:

RESUME CONTENT:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

JOB TITLE: ${jobTitle}
COMPANY: ${companyName || 'the company'}

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

    console.log('Making request to OpenAI API');
    
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

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      if (response.status === 401) {
        return new Response(JSON.stringify({ 
          error: 'Invalid OpenAI API key. Please check your API key configuration.' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${response.status} ${response.statusText}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('OpenAI API response received successfully');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI API response structure:', data);
      return new Response(JSON.stringify({ 
        error: 'Invalid response from OpenAI API' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const generatedText = data.choices[0].message.content;

    // Generate a title for the cover letter
    const title = `Cover Letter for ${jobTitle}${companyName ? ` at ${companyName}` : ''}`;

    console.log('Cover letter generated successfully');

    return new Response(JSON.stringify({ 
      generatedText,
      title 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-cover-letter function:', error);
    return new Response(JSON.stringify({ 
      error: `Server error: ${error.message}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
