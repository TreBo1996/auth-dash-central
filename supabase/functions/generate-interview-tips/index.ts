import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
Analyze this job description and provide personalized interview preparation tips. Return a JSON object with the following structure:

{
  "jobAnalysis": {
    "keySkills": ["skill1", "skill2", ...],
    "requirements": ["req1", "req2", ...],
    "companyCulture": "culture insight",
    "seniorityLevel": "level assessment"
  },
  "expectedQuestions": {
    "behavioral": ["question1", "question2", ...],
    "technical": ["question1", "question2", ...],
    "companySpecific": ["question1", "question2", ...],
    "cultureFit": ["question1", "question2", ...]
  },
  "talkingPoints": {
    "strengthsToHighlight": ["strength1", "strength2", ...],
    "experienceMapping": ["mapping1", "mapping2", ...],
    "starStories": ["story topic 1", "story topic 2", ...],
    "achievements": ["achievement focus 1", "achievement focus 2", ...]
  },
  "questionsToAsk": {
    "roleSpecific": ["question1", "question2", ...],
    "teamCulture": ["question1", "question2", ...],
    "growthDevelopment": ["question1", "question2", ...],
    "companyDirection": ["question1", "question2", ...]
  },
  "industryInsights": {
    "trends": ["trend1", "trend2", ...],
    "roleExpectations": ["expectation1", "expectation2", ...],
    "skillsGap": ["gap1", "gap2", ...],
    "compensationTips": ["tip1", "tip2", ...]
  }
}

Job Description:
${jobDescription}

Provide specific, actionable advice tailored to this exact role and company. Be detailed and relevant.`;

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
            content: 'You are an expert career coach specializing in interview preparation. Provide specific, actionable advice based on the job description. Return only valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    let tips;
    try {
      tips = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse OpenAI response as JSON:', error);
      throw new Error('Invalid response format from AI');
    }

    return new Response(JSON.stringify({ tips }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-interview-tips function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});