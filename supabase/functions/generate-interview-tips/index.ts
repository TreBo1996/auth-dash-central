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
    console.log('Starting generate-interview-tips function');
    
    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    const { jobDescription } = requestBody;

    // Validation
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 50) {
      console.error('Invalid job description');
      return new Response(JSON.stringify({ 
        error: 'Invalid job description',
        details: 'Job description must be at least 50 characters long'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Data validation passed. Proceeding with OpenAI API call');

    const prompt = `Analyze this job description and provide personalized interview preparation tips. Return a JSON object with the following structure:

{
  "jobAnalysis": {
    "keySkills": ["skill1", "skill2", "skill3"],
    "requirements": ["req1", "req2", "req3"],
    "companyCulture": "Brief culture insight",
    "seniorityLevel": "Level assessment"
  },
  "expectedQuestions": {
    "behavioral": ["question1", "question2", "question3"],
    "technical": ["question1", "question2", "question3"],
    "companySpecific": ["question1", "question2"],
    "cultureFit": ["question1", "question2"]
  },
  "talkingPoints": {
    "strengthsToHighlight": ["strength1", "strength2", "strength3"],
    "experienceMapping": ["mapping1", "mapping2"],
    "starStories": ["story topic 1", "story topic 2"],
    "achievements": ["achievement focus 1", "achievement focus 2"]
  },
  "questionsToAsk": {
    "roleSpecific": ["question1", "question2"],
    "teamCulture": ["question1", "question2"],
    "growthDevelopment": ["question1", "question2"],
    "companyDirection": ["question1", "question2"]
  },
  "industryInsights": {
    "trends": ["trend1", "trend2"],
    "roleExpectations": ["expectation1", "expectation2"],
    "skillsGap": ["gap1", "gap2"],
    "compensationTips": ["tip1", "tip2"]
  }
}

Job Description:
${jobDescription}

Provide specific, actionable advice tailored to this role. Be concise but detailed. Return only valid JSON.`;

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
            content: 'You are an expert career coach specializing in interview preparation. Provide specific, actionable advice based on the job description. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${response.status} ${response.statusText}`,
        details: errorText
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
        error: 'Invalid response from OpenAI API',
        details: 'Missing expected response structure'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const content = data.choices[0].message.content;

    if (!content || content.trim().length === 0) {
      console.error('Empty generated content from OpenAI');
      return new Response(JSON.stringify({ 
        error: 'Generated interview tips are empty',
        details: 'OpenAI returned empty content'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse JSON response
    try {
      let cleanContent = content.trim();
      
      // Handle cases where response might be wrapped in markdown
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const tips = JSON.parse(cleanContent);

      // Basic validation - ensure main sections exist
      const requiredFields = ['jobAnalysis', 'expectedQuestions', 'talkingPoints', 'questionsToAsk', 'industryInsights'];
      const missingFields = requiredFields.filter(field => !tips[field]);
      
      if (missingFields.length > 0) {
        console.error('Missing required fields in tips:', missingFields);
        return new Response(JSON.stringify({ 
          error: 'Invalid tips structure',
          details: `Missing fields: ${missingFields.join(', ')}`
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Interview tips generated successfully');

      return new Response(JSON.stringify({ tips }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.error('Raw content that failed to parse:', content);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse interview tips response',
        details: parseError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in generate-interview-tips function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.stack || 'No stack trace available'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});