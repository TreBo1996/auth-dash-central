
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
    const { question, questionType, feedback, jobTitle } = await req.json();

    console.log('Generating example response for:', { question, questionType, jobTitle });

    const systemPrompt = `You are an expert interview coach. Generate a perfect 10/10 example response to an interview question. The response should:

1. Be specific, detailed, and demonstrate deep expertise
2. Address all the feedback points mentioned
3. Use the STAR method for behavioral questions (Situation, Task, Action, Result)
4. Be technically accurate and comprehensive for technical questions
5. Show strong communication skills and confidence
6. Be relevant to the job role
7. Include specific examples and quantifiable results where possible

Keep the response professional, engaging, and authentic. Aim for 150-250 words.`;

    const userPrompt = `Generate a perfect 10/10 example response for this interview question:

**Job Title:** ${jobTitle}
**Question Type:** ${questionType}
**Question:** ${question}

**AI Feedback to Address:** ${feedback}

Create an exemplary response that would receive a perfect score by addressing all the feedback points and demonstrating best practices for interview responses.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'Failed to generate example response');
    }

    const exampleResponse = data.choices[0].message.content;
    
    console.log('Generated example response successfully');

    return new Response(JSON.stringify({ exampleResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-example-response function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
