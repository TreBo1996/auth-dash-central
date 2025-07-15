
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
    const { jobDescription } = await req.json();

    if (!jobDescription) {
      throw new Error('Job description is required');
    }

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
            content: 'You are an expert interview coach. Generate relevant, realistic interview questions based on job descriptions. Return your response as a JSON object with "behavioral" and "technical" arrays, each containing exactly 5 questions as strings.'
          },
          {
            role: 'user',
            content: `Based on the following job description, generate 5 behavioral and 5 technical interview questions that a candidate might be asked:

Job Description:
${jobDescription}

Return the response as JSON in this format:
{
  "behavioral": ["question 1", "question 2", "question 3", "question 4", "question 5"],
  "technical": ["question 1", "question 2", "question 3", "question 4", "question 5"]
}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI API response structure:', data);
      throw new Error('Invalid response from OpenAI API');
    }

    const content = data.choices[0].message.content;

    if (!content || content.trim().length === 0) {
      console.error('Empty generated content from OpenAI');
      throw new Error('Generated interview questions are empty');
    }

    // Parse JSON response with robust handling
    let cleanContent = content.trim();
    
    // Handle cases where response might be wrapped in markdown
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const questions = JSON.parse(cleanContent);

    // Basic validation - ensure required fields exist
    if (!questions.behavioral || !questions.technical || 
        !Array.isArray(questions.behavioral) || !Array.isArray(questions.technical)) {
      console.error('Invalid questions structure:', questions);
      throw new Error('Invalid questions structure - missing behavioral or technical arrays');
    }

    return new Response(JSON.stringify(questions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating interview questions:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate interview questions', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
