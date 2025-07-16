
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { question, response, jobDescription, questionType } = await req.json();

    if (!question || !response || !jobDescription) {
      throw new Error('Question, response, and job description are required');
    }

    const prompt = `
You are an expert interview coach. Score this interview response on a scale of 1-10 and provide actionable feedback.

Job Description: ${jobDescription}

Question (${questionType}): ${question}

Candidate Response: ${response}

Please provide your evaluation in the following JSON format:
{
  "overall_score": <number 1-10>,
  "job_relevance_score": <number 1-10>,
  "clarity_score": <number 1-10>, 
  "examples_score": <number 1-10>,
  "feedback": "<concise actionable feedback in 2-3 sentences>"
}

Scoring criteria:
- Job Relevance (1-10): How well does the response relate to the job requirements?
- Clarity (1-10): How clear and well-structured is the response?
- Examples (1-10): Does the response include specific, relevant examples?
- Overall Score: Average of the three scores

Keep feedback constructive, specific, and actionable. Focus on what they did well and one key improvement.
`;

    const response_ai = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert interview coach providing detailed scoring and feedback. Return only valid JSON, no markdown or additional text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response_ai.ok) {
      const error = await response_ai.json();
      throw new Error(error.error?.message || 'Failed to score response');
    }

    const data = await response_ai.json();
    const scoringText = data.choices[0].message.content;

    // Parse the JSON response
    try {
      const cleanedScoringText = cleanOpenAIResponse(scoringText);
      const scoring = JSON.parse(cleanedScoringText);
      return new Response(JSON.stringify(scoring), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Raw response:', scoringText);
      // Fallback if JSON parsing fails
      return new Response(JSON.stringify({
        overall_score: 5,
        job_relevance_score: 5,
        clarity_score: 5,
        examples_score: 5,
        feedback: "I was unable to properly analyze your response. Please try again."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in score-interview-response function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
