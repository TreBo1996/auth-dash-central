
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

export const fetchStructuredResumeData = async (optimizedResumeId: string): Promise<StructuredResumeData> => {
  console.log('fetchStructuredResumeData: Starting fetch for ID:', optimizedResumeId);

  try {
    // Add timeout for the entire operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timed out')), 25000);
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
          return { type: 'sections', ...result };
        }),
      supabase
        .from('resume_experiences')
        .select('*')
        .eq('optimized_resume_id', optimizedResumeId)
        .order('display_order')
        .then(result => {
          console.log('fetchStructuredResumeData: Experiences query result:', result);
          return { type: 'experiences', ...result };
        }),
      supabase
        .from('resume_skills')
        .select('*')
        .eq('optimized_resume_id', optimizedResumeId)
        .order('display_order')
        .then(result => {
          console.log('fetchStructuredResumeData: Skills query result:', result);
          return { type: 'skills', ...result };
        }),
      supabase
        .from('resume_education')
        .select('*')
        .eq('optimized_resume_id', optimizedResumeId)
        .order('display_order')
        .then(result => {
          console.log('fetchStructuredResumeData: Education query result:', result);
          return { type: 'education', ...result };
        }),
      supabase
        .from('resume_certifications')
        .select('*')
        .eq('optimized_resume_id', optimizedResumeId)
        .order('display_order')
        .then(result => {
          console.log('fetchStructuredResumeData: Certifications query result:', result);
          return { type: 'certifications', ...result };
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

    // Handle individual query errors with fallbacks
    if (sectionsResult?.error) {
      console.error('fetchStructuredResumeData: Sections query error:', sectionsResult.error);
      console.log('fetchStructuredResumeData: Using fallback for sections');
    }

    if (experiencesResult?.error) {
      console.error('fetchStructuredResumeData: Experiences query error:', experiencesResult.error);
      console.log('fetchStructuredResumeData: Using fallback for experiences');
    }

    if (skillsResult?.error) {
      console.error('fetchStructuredResumeData: Skills query error:', skillsResult.error);
      console.log('fetchStructuredResumeData: Using fallback for skills');
    }

    if (educationResult?.error) {
      console.error('fetchStructuredResumeData: Education query error:', educationResult.error);
      console.log('fetchStructuredResumeData: Using fallback for education');
    }

    if (certificationsResult?.error) {
      console.error('fetchStructuredResumeData: Certifications query error:', certificationsResult.error);
      console.log('fetchStructuredResumeData: Using fallback for certifications');
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
        bullets: exp.bullets || ['Job responsibility']
      })),
      education: (educationResult?.data || []).map(edu => ({
        degree: edu.degree || 'Degree',
        school: edu.school || 'University Name',
        year: edu.year || '2020'
      })),
      skills: (skillsResult?.data || []).map(skill => ({
        category: skill.category || 'Skills',
        items: skill.items || []
      })),
      certifications: (certificationsResult?.data || []).map(cert => ({
        name: cert.name || 'Certification Name',
        issuer: cert.issuer || 'Issuing Organization',
        year: cert.year || '2023'
      }))
    };

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
    
    // Provide fallback data structure
    const fallbackData: StructuredResumeData = {
      name: 'Professional Name',
      email: '',
      phone: '',
      location: '',
      summary: '',
      experience: [{
        title: 'Job Title',
        company: 'Company Name',
        duration: '2023 - 2024',
        bullets: ['Job responsibility']
      }],
      education: [{
        degree: 'Degree',
        school: 'University Name',
        year: '2020'
      }],
      skills: [{
        category: 'Skills',
        items: ['Skill 1', 'Skill 2']
      }],
      certifications: []
    };

    console.log('fetchStructuredResumeData: Returning fallback data due to error');
    throw new Error(`Failed to fetch resume data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
