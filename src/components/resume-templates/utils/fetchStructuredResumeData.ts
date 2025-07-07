
import { supabase } from '@/integrations/supabase/client';

export interface StructuredResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  skills: Array<{
    category: string;
    items: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    year: string;
  }>;
}

// Type guard for contact data
interface ContactData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
}

// Type guard for summary data
interface SummaryData {
  summary?: string;
}

const isContactData = (data: any): data is ContactData => {
  return typeof data === 'object' && data !== null;
};

const isSummaryData = (data: any): data is SummaryData => {
  return typeof data === 'object' && data !== null;
};

// Helper function to limit skills for PDF export
const limitSkillsForExport = (skills: Array<{ category: string; items: string[] }>, limitSkills?: boolean) => {
  if (!limitSkills) return skills;
  
  // Flatten all skills and take the first 6
  const allSkills: string[] = [];
  skills.forEach(group => allSkills.push(...group.items));
  
  if (allSkills.length <= 6) return skills;
  
  // Limit to 6 skills and reorganize into 1-2 categories
  const limitedSkills = allSkills.slice(0, 6);
  
  // If we have many skills, split into two categories
  if (limitedSkills.length > 3) {
    const mid = Math.ceil(limitedSkills.length / 2);
    return [
      {
        category: 'Technical Skills',
        items: limitedSkills.slice(0, mid)
      },
      {
        category: 'Professional Skills', 
        items: limitedSkills.slice(mid)
      }
    ];
  } else {
    return [
      {
        category: 'Key Skills',
        items: limitedSkills
      }
    ];
  }
};

export const fetchStructuredResumeData = async (optimizedResumeId: string, options?: { limitSkills?: boolean }): Promise<StructuredResumeData> => {
  console.log('fetchStructuredResumeData: Starting fetch for ID:', optimizedResumeId);

  if (!optimizedResumeId) {
    console.error('fetchStructuredResumeData: No optimizedResumeId provided');
    throw new Error('Resume ID is required');
  }

  try {
    // Add timeout for the entire operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timed out after 15 seconds')), 15000);
    });

    // Fetch all resume data in parallel with individual error handling
    console.log('fetchStructuredResumeData: Starting parallel queries...');
    
    const fetchPromises = [
      supabase
        .from('resume_sections')
        .select('*')
        .eq('optimized_resume_id', optimizedResumeId)
        .then(result => {
          console.log('fetchStructuredResumeData: Sections query result:', result);
          if (result.error) {
            console.error('fetchStructuredResumeData: Sections query failed:', result.error);
            return { type: 'sections', data: [], error: result.error };
          }
          return { type: 'sections', data: result.data || [], error: null };
        }),
      supabase
        .from('resume_experiences')
        .select('*')
        .eq('optimized_resume_id', optimizedResumeId)
        .order('display_order')
        .then(result => {
          console.log('fetchStructuredResumeData: Experiences query result:', result);
          if (result.error) {
            console.error('fetchStructuredResumeData: Experiences query failed:', result.error);
            return { type: 'experiences', data: [], error: result.error };
          }
          return { type: 'experiences', data: result.data || [], error: null };
        }),
      supabase
        .from('resume_skills')
        .select('*')
        .eq('optimized_resume_id', optimizedResumeId)
        .order('display_order')
        .then(result => {
          console.log('fetchStructuredResumeData: Skills query result:', result);
          if (result.error) {
            console.error('fetchStructuredResumeData: Skills query failed:', result.error);
            return { type: 'skills', data: [], error: result.error };
          }
          return { type: 'skills', data: result.data || [], error: null };
        }),
      supabase
        .from('resume_education')
        .select('*')
        .eq('optimized_resume_id', optimizedResumeId)
        .order('display_order')
        .then(result => {
          console.log('fetchStructuredResumeData: Education query result:', result);
          if (result.error) {
            console.error('fetchStructuredResumeData: Education query failed:', result.error);
            return { type: 'education', data: [], error: result.error };
          }
          return { type: 'education', data: result.data || [], error: null };
        }),
      supabase
        .from('resume_certifications')
        .select('*')
        .eq('optimized_resume_id', optimizedResumeId)
        .order('display_order')
        .then(result => {
          console.log('fetchStructuredResumeData: Certifications query result:', result);
          if (result.error) {
            console.error('fetchStructuredResumeData: Certifications query failed:', result.error);
            return { type: 'certifications', data: [], error: result.error };
          }
          return { type: 'certifications', data: result.data || [], error: null };
        })
    ];

    const results = await Promise.race([
      Promise.all(fetchPromises),
      timeoutPromise
    ]) as any[];

    console.log('fetchStructuredResumeData: All queries completed');

    // Process results and handle individual errors
    const sectionsResult = results.find(r => r.type === 'sections');
    const experiencesResult = results.find(r => r.type === 'experiences');
    const skillsResult = results.find(r => r.type === 'skills');
    const educationResult = results.find(r => r.type === 'education');
    const certificationsResult = results.find(r => r.type === 'certifications');

    // Check for critical errors
    const criticalErrors = [sectionsResult, experiencesResult, skillsResult, educationResult]
      .filter(result => result?.error && (!result?.data || result.data.length === 0))
      .map(result => result.error);

    if (criticalErrors.length > 2) {
      console.error('fetchStructuredResumeData: Too many critical errors:', criticalErrors);
      throw new Error('Multiple database queries failed - unable to load structured data');
    }

    // Extract data from sections with fallbacks
    const sections = sectionsResult?.data || [];
    const contactSection = sections.find(s => s.section_type === 'contact');
    const summarySection = sections.find(s => s.section_type === 'summary');

    console.log('fetchStructuredResumeData: Processing sections:', {
      totalSections: sections.length,
      hasContactSection: !!contactSection,
      hasSummarySection: !!summarySection
    });

    // Safely extract contact and summary data with type guards
    const contactData: ContactData = isContactData(contactSection?.content) ? contactSection.content : {};
    const summaryData: SummaryData = isSummaryData(summarySection?.content) ? summarySection.content : {};

    // Build structured data with comprehensive fallbacks
    const structuredData: StructuredResumeData = {
      name: contactData.name || 'Professional Name',
      email: contactData.email || '',
      phone: contactData.phone || '',
      location: contactData.location || '',
      summary: summaryData.summary || '',
      experience: (experiencesResult?.data || []).map(exp => ({
        title: exp.title || 'Job Title',
        company: exp.company || 'Company Name',
        duration: exp.duration || '2023 - 2024',
        bullets: Array.isArray(exp.bullets) ? exp.bullets : ['Job responsibility']
      })),
      education: (educationResult?.data || []).map(edu => ({
        degree: edu.degree || 'Degree',
        school: edu.school || 'University Name',
        year: edu.year || '2020'
      })),
      skills: limitSkillsForExport((skillsResult?.data || []).map(skill => ({
        category: skill.category || 'Skills',
        items: Array.isArray(skill.items) ? skill.items : []
      })), options?.limitSkills),
      certifications: (certificationsResult?.data || []).map(cert => ({
        name: cert.name || 'Certification Name',
        issuer: cert.issuer || 'Issuing Organization',
        year: cert.year || '2023'
      }))
    };

    // Validate that we have meaningful data
    const hasValidData = structuredData.name !== 'Professional Name' || 
                        structuredData.experience.length > 0 || 
                        structuredData.skills.length > 0 || 
                        structuredData.education.length > 0;

    if (!hasValidData) {
      console.warn('fetchStructuredResumeData: No meaningful structured data found');
      throw new Error('No structured resume data available');
    }

    console.log('fetchStructuredResumeData: Successfully built structured data:', {
      name: structuredData.name,
      experienceCount: structuredData.experience.length,
      skillsCount: structuredData.skills.length,
      educationCount: structuredData.education.length,
      certificationsCount: structuredData.certifications?.length || 0
    });

    return structuredData;

  } catch (error) {
    console.error('fetchStructuredResumeData: Critical error:', error);
    
    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        throw new Error('Request timed out - please try again');
      }
      if (error.message.includes('No structured resume data')) {
        throw new Error('Structured resume data not available - will use text parsing');
      }
      throw error;
    }

    throw new Error('Failed to fetch resume data - please try again');
  }
};
