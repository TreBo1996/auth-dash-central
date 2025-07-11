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
    console.log('🎯 generate-interview-tips function called');
    
    const requestBody = await req.json();
    console.log('📥 Request body received:', {
      hasJobDescription: !!requestBody.jobDescription,
      jobDescriptionLength: requestBody.jobDescription?.length || 0,
      jobDescriptionPreview: requestBody.jobDescription?.substring(0, 200) + '...'
    });
    
    const { jobDescription } = requestBody;
    
    if (!jobDescription) {
      console.error('❌ No job description provided');
      throw new Error('Job description is required');
    }

    if (typeof jobDescription !== 'string' || jobDescription.trim().length < 50) {
      console.error('❌ Job description too short or invalid:', jobDescription?.length);
      throw new Error('Job description must be at least 50 characters long');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    console.log('✅ OpenAI API key found, proceeding with request');

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

    console.log('🚀 Making OpenAI API request...');
    
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

    console.log('📡 OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📦 OpenAI response data:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length || 0,
      hasContent: !!data.choices?.[0]?.message?.content,
      contentLength: data.choices?.[0]?.message?.content?.length || 0,
      contentPreview: data.choices?.[0]?.message?.content?.substring(0, 200) + '...'
    });
    
    const content = data.choices[0].message.content;
    
    if (!content) {
      console.error('❌ No content in OpenAI response');
      throw new Error('OpenAI returned empty content');
    }
    
    // Parse the JSON response
    let tips;
    try {
      console.log('🔍 Attempting to parse JSON response...');
      tips = JSON.parse(content);
      console.log('✅ JSON parsed successfully:', {
        hasJobAnalysis: !!tips.jobAnalysis,
        hasExpectedQuestions: !!tips.expectedQuestions,
        hasTalkingPoints: !!tips.talkingPoints,
        hasQuestionsToAsk: !!tips.questionsToAsk,
        hasIndustryInsights: !!tips.industryInsights
      });
    } catch (error) {
      console.error('❌ Failed to parse OpenAI response as JSON:', {
        error: error.message,
        contentLength: content.length,
        contentStart: content.substring(0, 500),
        contentEnd: content.substring(content.length - 500)
      });
      throw new Error('Invalid response format from AI - not valid JSON');
    }

    console.log('🎉 Successfully generated interview tips, returning response');
    
    return new Response(JSON.stringify({ tips }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in generate-interview-tips function:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});