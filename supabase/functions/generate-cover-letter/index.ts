
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { jobDescriptionId, optimizedResumeId, originalResumeId, additionalInfo, tone = 'professional' } = await req.json()

    if (!jobDescriptionId) {
      return new Response(JSON.stringify({ error: 'Job description ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch job description
    const { data: jobDescription } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', jobDescriptionId)
      .eq('user_id', user.id)
      .single()

    if (!jobDescription) {
      return new Response(JSON.stringify({ error: 'Job description not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch resume content
    let resumeContent = ''
    if (optimizedResumeId) {
      const { data: optimizedResume } = await supabase
        .from('optimized_resumes')
        .select('generated_text')
        .eq('id', optimizedResumeId)
        .eq('user_id', user.id)
        .single()
      
      if (optimizedResume) {
        resumeContent = optimizedResume.generated_text
      }
    } else if (originalResumeId) {
      const { data: originalResume } = await supabase
        .from('resumes')
        .select('parsed_text')
        .eq('id', originalResumeId)
        .eq('user_id', user.id)
        .single()
      
      if (originalResume && originalResume.parsed_text) {
        resumeContent = originalResume.parsed_text
      }
    }

    if (!resumeContent) {
      return new Response(JSON.stringify({ error: 'Resume content not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Prepare OpenAI prompt
    const toneInstructions = {
      professional: 'Write in a professional, formal tone.',
      enthusiastic: 'Write in an enthusiastic and energetic tone while maintaining professionalism.',
      conservative: 'Write in a conservative, traditional business tone.'
    }

    const prompt = `You are an expert career counselor and professional writer. Create a compelling cover letter based on the following information:

JOB DESCRIPTION:
${jobDescription.parsed_text}

RESUME CONTENT:
${resumeContent}

ADDITIONAL INFORMATION:
${additionalInfo || 'None provided'}

INSTRUCTIONS:
- ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional}
- Create a personalized cover letter that highlights relevant experience from the resume
- Address specific requirements mentioned in the job description
- Keep it concise (3-4 paragraphs)
- Include a strong opening, relevant experience highlights, and compelling closing
- Make it ATS-friendly with relevant keywords from the job description
- Format it professionally with proper structure
- Do not include placeholder text like [Your Name] or [Company Name]
- Make it ready to use as-is

Generate the cover letter now:`

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional cover letter writer. Create compelling, personalized cover letters that highlight relevant experience and address job requirements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!openAIResponse.ok) {
      throw new Error('Failed to generate cover letter')
    }

    const openAIData = await openAIResponse.json()
    const generatedCoverLetter = openAIData.choices[0].message.content

    return new Response(JSON.stringify({ 
      coverLetter: generatedCoverLetter,
      jobTitle: jobDescription.title,
      company: jobDescription.company 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error generating cover letter:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate cover letter' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
