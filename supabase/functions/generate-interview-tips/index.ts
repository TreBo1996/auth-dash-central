import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = 45000; // 45 seconds

// Cache for successful responses (in memory for this instance)
const responseCache = new Map();

// Utility functions
async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
}

function getCacheKey(jobDescription: string): string {
  // Simple hash function for caching
  let hash = 0;
  for (let i = 0; i < jobDescription.length; i++) {
    const char = jobDescription.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `tips_${Math.abs(hash)}`;
}

function isRateLimitError(error: any): boolean {
  return error.message?.includes('429') || error.message?.includes('rate limit');
}

function isTemporaryError(error: any): boolean {
  return error.message?.includes('timeout') || 
         error.message?.includes('502') || 
         error.message?.includes('503') || 
         error.message?.includes('504') ||
         isRateLimitError(error);
}

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

    // Check cache first
    const cacheKey = getCacheKey(jobDescription);
    const cachedResult = responseCache.get(cacheKey);
    if (cachedResult) {
      console.log('🎯 Cache hit! Returning cached interview tips');
      return new Response(JSON.stringify({ tips: cachedResult }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('💾 Cache miss, generating new tips');

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

    // Retry logic with exponential backoff
    let tips;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`🚀 Making OpenAI API request (attempt ${attempt}/${MAX_RETRIES})...`);
        
        const openAIRequest = fetch('https://api.openai.com/v1/chat/completions', {
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

        const response = await withTimeout(openAIRequest, REQUEST_TIMEOUT);
        console.log(`📡 OpenAI API response status (attempt ${attempt}):`, response.status);

        if (!response.ok) {
          const errorText = await response.text();
          const errorMsg = `OpenAI API error: ${response.status} - ${errorText}`;
          console.error(`❌ OpenAI API error response (attempt ${attempt}):`, {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          
          lastError = new Error(errorMsg);
          
          // Don't retry on certain errors
          if (response.status === 401 || response.status === 403) {
            throw lastError;
          }
          
          // Handle rate limiting with longer delays
          if (response.status === 429 || isRateLimitError(lastError)) {
            const delay = BASE_DELAY * Math.pow(2, attempt - 1) + (attempt === 1 ? 5000 : 0); // Extra 5s on first rate limit
            console.log(`⏳ Rate limited, waiting ${delay}ms before retry...`);
            if (attempt < MAX_RETRIES) {
              await sleep(delay);
              continue;
            }
          }
          
          // Retry on temporary errors
          if (isTemporaryError(lastError) && attempt < MAX_RETRIES) {
            const delay = BASE_DELAY * Math.pow(2, attempt - 1);
            console.log(`⏳ Temporary error, waiting ${delay}ms before retry...`);
            await sleep(delay);
            continue;
          }
          
          throw lastError;
        }

        const data = await response.json();
        console.log(`📦 OpenAI response data (attempt ${attempt}):`, {
          hasChoices: !!data.choices,
          choicesLength: data.choices?.length || 0,
          hasContent: !!data.choices?.[0]?.message?.content,
          contentLength: data.choices?.[0]?.message?.content?.length || 0,
          contentPreview: data.choices?.[0]?.message?.content?.substring(0, 200) + '...'
        });
        
        const content = data.choices[0]?.message?.content;
        
        if (!content) {
          lastError = new Error('OpenAI returned empty content');
          console.error(`❌ No content in OpenAI response (attempt ${attempt})`);
          if (attempt < MAX_RETRIES) {
            await sleep(BASE_DELAY * attempt);
            continue;
          }
          throw lastError;
        }
        
        // Parse and validate JSON response
        try {
          console.log(`🔍 Attempting to parse JSON response (attempt ${attempt})...`);
          
          // Clean the content before parsing
          const cleanContent = content.trim();
          let jsonContent = cleanContent;
          
          // Handle cases where response might be wrapped in markdown
          if (cleanContent.startsWith('```json')) {
            jsonContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanContent.startsWith('```')) {
            jsonContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          tips = JSON.parse(jsonContent);
          
          // Validate the structure
          const requiredFields = ['jobAnalysis', 'expectedQuestions', 'talkingPoints', 'questionsToAsk', 'industryInsights'];
          const hasAllFields = requiredFields.every(field => tips[field] && typeof tips[field] === 'object');
          
          if (!hasAllFields) {
            throw new Error('Response missing required fields');
          }
          
          console.log(`✅ JSON parsed and validated successfully (attempt ${attempt}):`, {
            hasJobAnalysis: !!tips.jobAnalysis,
            hasExpectedQuestions: !!tips.expectedQuestions,
            hasTalkingPoints: !!tips.talkingPoints,
            hasQuestionsToAsk: !!tips.questionsToAsk,
            hasIndustryInsights: !!tips.industryInsights
          });
          
          // Cache the successful result
          responseCache.set(cacheKey, tips);
          console.log('💾 Tips cached successfully');
          
          break; // Success! Exit the retry loop
          
        } catch (parseError) {
          lastError = new Error(`Invalid response format from AI: ${parseError.message}`);
          console.error(`❌ Failed to parse OpenAI response as JSON (attempt ${attempt}):`, {
            error: parseError.message,
            contentLength: content.length,
            contentStart: content.substring(0, 500),
            contentEnd: content.substring(content.length - 500)
          });
          
          if (attempt < MAX_RETRIES) {
            await sleep(BASE_DELAY * attempt);
            continue;
          }
          throw lastError;
        }
        
      } catch (error) {
        lastError = error;
        console.error(`💥 Error in attempt ${attempt}:`, {
          error: error.message,
          name: error.name,
          isTimeout: error.message?.includes('timeout'),
          isRateLimit: isRateLimitError(error),
          isTemporary: isTemporaryError(error)
        });
        
        if (attempt === MAX_RETRIES) {
          console.error('🔴 All retry attempts exhausted');
          throw lastError;
        }
        
        // Calculate delay for next attempt
        let delay = BASE_DELAY * Math.pow(2, attempt - 1);
        if (isRateLimitError(error)) {
          delay += 5000; // Extra delay for rate limits
        }
        
        console.log(`⏳ Waiting ${delay}ms before next attempt...`);
        await sleep(delay);
      }
    }

    if (!tips) {
      throw lastError || new Error('Failed to generate tips after all retries');
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