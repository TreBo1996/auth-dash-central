
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParseResumeRequest {
  resume_text: string;
}

interface ParsedResumeResponse {
  summary: string;
  experience: Array<{
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  skills: string[];
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    year: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    year: string;
  }>;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Resume sections parsing request received');
    
    const { resume_text }: ParseResumeRequest = await req.json();
    
    if (!resume_text || resume_text.trim().length === 0) {
      throw new Error('No resume text provided');
    }

    console.log(`Processing resume text: ${resume_text.length} characters`);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an expert resume parser. Your task is to analyze resume text and extract structured information into specific sections.

IMPORTANT INSTRUCTIONS:
1. Parse the resume text and identify these sections: Professional Summary, Work Experience, Skills, Education, and Certifications
2. For Work Experience, extract each job separately with company, role, dates, and description
3. For Skills, create a clean array of individual skills (no categories, just skill names)
4. For Education, extract institution, degree/program, and year
5. For Certifications, extract name, issuing organization, and year
6. Always return valid JSON in the exact format specified
7. If a section is missing or unclear, provide reasonable defaults or empty arrays
8. For dates, extract in simple format like "2020" or "Jan 2020" or "2020-2023"
9. Generate unique IDs for each item using timestamp-based strings

Return ONLY valid JSON in this exact format:
{
  "summary": "Professional summary text",
  "experience": [
    {
      "id": "unique_id",
      "company": "Company Name",
      "role": "Job Title",
      "startDate": "Start Date",
      "endDate": "End Date or Present",
      "description": "Job description and achievements"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "education": [
    {
      "id": "unique_id",
      "institution": "School Name",
      "degree": "Degree Name",
      "year": "Year"
    }
  ],
  "certifications": [
    {
      "id": "unique_id",
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "year": "Year"
    }
  ]
}`;

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
          { role: 'user', content: `Please parse this resume text into structured sections:\n\n${resume_text}` }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const parsedContent = data.choices[0].message.content;
    
    console.log('Raw AI response:', parsedContent);

    // Parse the JSON response
    let structuredResume: ParsedResumeResponse;
    try {
      structuredResume = JSON.parse(parsedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('AI response was not valid JSON');
    }

    // Validate and clean the response
    const cleanedResponse: ParsedResumeResponse = {
      summary: structuredResume.summary || '',
      experience: Array.isArray(structuredResume.experience) ? structuredResume.experience.map((exp, index) => ({
        id: exp.id || `exp_${Date.now()}_${index}`,
        company: exp.company || 'Company Name',
        role: exp.role || 'Job Title',
        startDate: exp.startDate || '2023',
        endDate: exp.endDate || '2024',
        description: exp.description || 'Job description'
      })) : [],
      skills: Array.isArray(structuredResume.skills) ? structuredResume.skills.filter(skill => typeof skill === 'string' && skill.trim()) : [],
      education: Array.isArray(structuredResume.education) ? structuredResume.education.map((edu, index) => ({
        id: edu.id || `edu_${Date.now()}_${index}`,
        institution: edu.institution || 'University Name',
        degree: edu.degree || 'Degree',
        year: edu.year || '2020'
      })) : [],
      certifications: Array.isArray(structuredResume.certifications) ? structuredResume.certifications.map((cert, index) => ({
        id: cert.id || `cert_${Date.now()}_${index}`,
        name: cert.name || 'Certification Name',
        issuer: cert.issuer || 'Issuing Organization',
        year: cert.year || '2023'
      })) : []
    };

    console.log('Successfully parsed resume into sections:', {
      summaryLength: cleanedResponse.summary.length,
      experienceCount: cleanedResponse.experience.length,
      skillsCount: cleanedResponse.skills.length,
      educationCount: cleanedResponse.education.length,
      certificationsCount: cleanedResponse.certifications.length
    });

    return new Response(
      JSON.stringify(cleanedResponse),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Resume sections parsing error:', error);
    
    let errorMessage = 'Unknown error occurred during resume sections parsing';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({
        error: errorMessage
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
