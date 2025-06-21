
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
  console.log('Fetching structured resume data for:', optimizedResumeId);

  // Fetch all resume data in parallel
  const [sectionsResult, experiencesResult, skillsResult, educationResult, certificationsResult] = await Promise.all([
    supabase
      .from('resume_sections')
      .select('*')
      .eq('optimized_resume_id', optimizedResumeId),
    supabase
      .from('resume_experiences')
      .select('*')
      .eq('optimized_resume_id', optimizedResumeId)
      .order('display_order'),
    supabase
      .from('resume_skills')
      .select('*')
      .eq('optimized_resume_id', optimizedResumeId)
      .order('display_order'),
    supabase
      .from('resume_education')
      .select('*')
      .eq('optimized_resume_id', optimizedResumeId)
      .order('display_order'),
    supabase
      .from('resume_certifications')
      .select('*')
      .eq('optimized_resume_id', optimizedResumeId)
      .order('display_order')
  ]);

  // Handle errors
  if (sectionsResult.error) {
    console.error('Error fetching resume sections:', sectionsResult.error);
    throw new Error('Failed to fetch resume sections');
  }

  if (experiencesResult.error) {
    console.error('Error fetching resume experiences:', experiencesResult.error);
    throw new Error('Failed to fetch resume experiences');
  }

  if (skillsResult.error) {
    console.error('Error fetching resume skills:', skillsResult.error);
    throw new Error('Failed to fetch resume skills');
  }

  if (educationResult.error) {
    console.error('Error fetching resume education:', educationResult.error);
    throw new Error('Failed to fetch resume education');
  }

  if (certificationsResult.error) {
    console.error('Error fetching resume certifications:', certificationsResult.error);
    throw new Error('Failed to fetch resume certifications');
  }

  // Extract data from sections
  const sections = sectionsResult.data || [];
  const contactSection = sections.find(s => s.section_type === 'contact');
  const summarySection = sections.find(s => s.section_type === 'summary');

  // Safely extract contact and summary data with type guards
  const contactData: ContactData = isContactData(contactSection?.content) ? contactSection.content : {};
  const summaryData: SummaryData = isSummaryData(summarySection?.content) ? summarySection.content : {};

  // Build structured data
  const structuredData: StructuredResumeData = {
    name: contactData.name || 'Professional Name',
    email: contactData.email || '',
    phone: contactData.phone || '',
    location: contactData.location || '',
    summary: summaryData.summary || '',
    experience: (experiencesResult.data || []).map(exp => ({
      title: exp.title,
      company: exp.company,
      duration: exp.duration,
      bullets: exp.bullets || []
    })),
    education: (educationResult.data || []).map(edu => ({
      degree: edu.degree,
      school: edu.school,
      year: edu.year
    })),
    skills: (skillsResult.data || []).map(skill => ({
      category: skill.category,
      items: skill.items || []
    })),
    certifications: (certificationsResult.data || []).map(cert => ({
      name: cert.name,
      issuer: cert.issuer,
      year: cert.year
    }))
  };

  console.log('Fetched structured data:', {
    name: structuredData.name,
    experienceCount: structuredData.experience.length,
    skillsCount: structuredData.skills.length,
    educationCount: structuredData.education.length,
    certificationsCount: structuredData.certifications?.length || 0
  });

  return structuredData;
};
