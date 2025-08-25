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
    const { jobTitle } = await req.json();
    
    console.log('Generating market insights for job title:', jobTitle);

    if (!jobTitle || jobTitle.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Job title is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const systemPrompt = `You are a career market analyst with access to current job market data. Provide accurate, helpful job market insights for the given job title. Return only a JSON response with the exact structure specified.`;

    const userPrompt = `Provide current job market insights for: "${jobTitle}"

Return a JSON response with this exact structure:
{
  "averageSalary": {
    "min": number (in USD),
    "max": number (in USD), 
    "currency": "USD"
  },
  "experienceLevel": {
    "entry": "string describing years/requirements",
    "mid": "string describing years/requirements", 
    "senior": "string describing years/requirements"
  },
  "topSkills": [array of 4-5 most important technical and soft skills],
  "marketOutlook": {
    "demand": "High/Medium/Low",
    "growth": "Growing/Stable/Declining",
    "description": "brief explanation of market trends"
  },
  "commonLocations": [array of 3-4 top cities/regions],
  "remoteAvailability": "High/Medium/Low",
  "keyIndustries": [array of 3-4 top hiring industries]
}

Be specific, accurate, and helpful. Base insights on current 2024 job market data.`;

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
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    console.log('OpenAI response:', generatedContent);

    // Parse the JSON response from OpenAI
    let insights;
    try {
      insights = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // Try to clean the response if it has markdown formatting
      const cleanedContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      insights = JSON.parse(cleanedContent);
    }

    // Validate the response structure
    if (!insights.averageSalary || !insights.topSkills || !insights.marketOutlook) {
      throw new Error('Invalid response structure from OpenAI');
    }

    console.log('Successfully generated insights for:', jobTitle);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-job-market-insights function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate market insights',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});