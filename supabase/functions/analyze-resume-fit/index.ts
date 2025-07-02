
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobDescription, requirements } = await req.json();

    if (!resumeText || !jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Resume text and job description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `
You are an expert ATS (Applicant Tracking System) and HR professional. Analyze how well this resume matches the given job description and requirements.

JOB DESCRIPTION:
${jobDescription}

REQUIREMENTS:
${requirements ? requirements.join('\n- ') : 'No specific requirements listed'}

RESUME:
${resumeText}

Please provide:
1. An overall fit score (0-100)
2. A detailed analysis covering:
   - Skills match
   - Experience relevance
   - Education alignment
   - Key strengths
   - Areas of concern or gaps
   - Recommendations

Format your response as JSON:
{
  "score": <number 0-100>,
  "analysis": "<detailed analysis text>",
  "skillsMatch": <number 0-100>,
  "experienceMatch": <number 0-100>,
  "educationMatch": <number 0-100>,
  "strengths": ["<strength1>", "<strength2>"],
  "concerns": ["<concern1>", "<concern2>"],
  "recommendation": "<overall recommendation>"
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert ATS and HR professional. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    try {
      const analysis = JSON.parse(analysisText);
      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      // If JSON parsing fails, return a basic analysis
      const fallbackAnalysis = {
        score: 50,
        analysis: analysisText,
        skillsMatch: 50,
        experienceMatch: 50,
        educationMatch: 50,
        strengths: ["Analysis available"],
        concerns: ["Detailed scoring unavailable"],
        recommendation: "Manual review recommended"
      };

      return new Response(JSON.stringify(fallbackAnalysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in analyze-resume-fit function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed',
        score: 0,
        analysis: 'Unable to analyze resume at this time'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
