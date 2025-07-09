import { supabase } from '@/integrations/supabase/client';

export interface InitialResumeSection {
  id?: string;
  resume_id: string;
  section_type: string;
  content: any;
  created_at?: string;
  updated_at?: string;
}

// Fetch structured data for an initial resume
export const fetchInitialResumeStructuredData = async (resumeId: string) => {
  const { data, error } = await supabase
    .from('initial_resume_sections')
    .select('*')
    .eq('resume_id', resumeId)
    .order('section_type');

  if (error) {
    console.error('Error fetching initial resume structured data:', error);
    throw error;
  }

  return data;
};

// Save structured data for an initial resume
export const saveInitialResumeStructuredData = async (resumeId: string, parsedData: any) => {
  const sections = [
    { resume_id: resumeId, section_type: 'contact', content: parsedData.contact || {} },
    { resume_id: resumeId, section_type: 'summary', content: { summary: parsedData.summary || '' } },
    { resume_id: resumeId, section_type: 'experience', content: { experiences: parsedData.experience || [] } },
    { resume_id: resumeId, section_type: 'skills', content: { skills: parsedData.skills || [] } },
    { resume_id: resumeId, section_type: 'education', content: { education: parsedData.education || [] } },
    { resume_id: resumeId, section_type: 'certifications', content: { certifications: parsedData.certifications || [] } }
  ];

  // Delete existing sections first
  await supabase
    .from('initial_resume_sections')
    .delete()
    .eq('resume_id', resumeId);

  // Insert new sections
  const { error } = await supabase
    .from('initial_resume_sections')
    .insert(sections);

  if (error) {
    console.error('Error saving initial resume structured data:', error);
    throw error;
  }
};

// Update a specific section
export const updateInitialResumeSection = async (resumeId: string, sectionType: string, content: any) => {
  const { error } = await supabase
    .from('initial_resume_sections')
    .upsert({
      resume_id: resumeId,
      section_type: sectionType,
      content,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'resume_id, section_type'
    });

  if (error) {
    console.error('Error updating initial resume section:', error);
    throw error;
  }
};

// Convert structured data back to the format expected by the editor
export const convertStructuredDataToEditorFormat = (sections: InitialResumeSection[]) => {
  const result: any = {
    contact: {},
    summary: '',
    experience: [],
    skills: [],
    education: [],
    certifications: []
  };

  sections.forEach(section => {
    switch (section.section_type) {
      case 'contact':
        result.contact = section.content;
        break;
      case 'summary':
        result.summary = section.content.summary || '';
        break;
      case 'experience':
        result.experience = section.content.experiences || [];
        break;
      case 'skills':
        result.skills = section.content.skills || [];
        break;
      case 'education':
        result.education = section.content.education || [];
        break;
      case 'certifications':
        result.certifications = section.content.certifications || [];
        break;
    }
  });

  return result;
};