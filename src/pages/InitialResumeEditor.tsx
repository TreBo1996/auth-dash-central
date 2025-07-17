import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResumeSection } from '@/components/resume-editor/ResumeSection';
import { ExperienceSection } from '@/components/resume-editor/ExperienceSection';
import { SkillsSection } from '@/components/resume-editor/SkillsSection';
import { EducationSection } from '@/components/resume-editor/EducationSection';
import { CertificationsSection } from '@/components/resume-editor/CertificationsSection';
import { ContactSection } from '@/components/resume-editor/ContactSection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fetchInitialResumeStructuredData, saveInitialResumeStructuredData, updateInitialResumeSection, convertStructuredDataToEditorFormat } from '@/utils/initialResumeStorage';
import { getUserContactInfo } from '@/utils/contactInfoUtils';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedSection } from '@/components/common/AnimatedSection';
interface Resume {
  id: string;
  user_id: string;
  parsed_text: string;
  file_name: string | null;
  created_at: string;
  updated_at: string;
}
interface Experience {
  title: string;
  company: string;
  duration: string;
  bullets: string[];
}
interface SkillGroup {
  category: string;
  items: string[];
}
interface Education {
  id: string;
  institution: string;
  degree: string;
  year: string;
}
interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}
interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
}

interface ParsedResume {
  contact: ContactInfo;
  summary: string;
  experience: Experience[];
  skills: SkillGroup[];
  education: Education[];
  certifications: Certification[];
}

// AI Response interfaces to handle the different structure
interface AIExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}
interface AIEducation {
  id: string;
  institution: string;
  degree: string;
  year: string;
}
interface AICertification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}
interface AIParseResponse {
  contact: ContactInfo;
  summary: string;
  experience: AIExperience[];
  skills: string[];
  education: AIEducation[];
  certifications: AICertification[];
}
const InitialResumeEditor: React.FC = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [resume, setResume] = useState<Resume | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<'fetching' | 'parsing'>('fetching');
  useEffect(() => {
    console.log('InitialResumeEditor: Component mounted with ID:', id);
    if (id) {
      fetchResume();
    } else {
      console.error('InitialResumeEditor: No resume ID provided');
      setError('No resume ID provided');
      setLoading(false);
    }
  }, [id]);
  const fetchResume = async () => {
    try {
      console.log('InitialResumeEditor: Starting to fetch resume with ID:', id);
      setLoading(true);
      setError(null);
      const {
        data,
        error
      } = await supabase.from('resumes').select('*').eq('id', id).single();
      console.log('InitialResumeEditor: Supabase query result:', {
        data,
        error
      });
      if (error) {
        console.error('InitialResumeEditor: Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      if (!data) {
        console.error('InitialResumeEditor: No resume data found');
        throw new Error('Resume not found');
      }
      console.log('InitialResumeEditor: Resume data loaded:', {
        id: data.id,
        fileName: data.file_name,
        textLength: data.parsed_text?.length || 0
      });
      setResume(data);

      // Try to load structured data first, fall back to AI parsing if not available
      await loadResumeData(data.id, data.parsed_text || '');
    } catch (error) {
      console.error('InitialResumeEditor: Error in fetchResume:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load resume';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const loadResumeData = async (resumeId: string, resumeText: string) => {
    try {
      console.log('InitialResumeEditor: Checking for existing structured data...');

      // Try to load existing structured data first
      const structuredData = await fetchInitialResumeStructuredData(resumeId);
      if (structuredData && structuredData.length > 0) {
        console.log('InitialResumeEditor: Found existing structured data, loading instantly');
        const convertedData = convertStructuredDataToEditorFormat(structuredData);
        setParsedResume(convertedData);
        toast({
          title: "Resume Loaded",
          description: "Your resume data loaded instantly from saved structure."
        });
        return;
      }
      console.log('InitialResumeEditor: No structured data found, parsing with AI...');

      // If no structured data exists, parse with AI and save the result
      if (resumeText.trim()) {
        await parseResumeWithAI(resumeText, resumeId);
      } else {
        console.warn('InitialResumeEditor: No resume text to parse, using default structure');
        const defaultStructure = await getDefaultResumeStructure();
        setParsedResume(defaultStructure);
        // Save the default structure for future loads
        await saveInitialResumeStructuredData(resumeId, defaultStructure);
      }
    } catch (error) {
      console.error('InitialResumeEditor: Error loading resume data:', error);
      // Fall back to AI parsing
      if (resumeText.trim()) {
        await parseResumeWithAI(resumeText, resumeId);
      } else {
        const defaultStructure = await getDefaultResumeStructure();
        setParsedResume(defaultStructure);
      }
    }
  };
  const getDefaultResumeStructure = async (): Promise<ParsedResume> => {
    let contactInfo = {
      name: 'Not provided',
      email: 'Not provided',
      phone: 'Not provided',
      location: 'Not provided'
    };

    // Try to get contact info from user profile
    if (user?.id) {
      try {
        const profileContact = await getUserContactInfo(user.id);
        if (profileContact.name || profileContact.email || profileContact.phone || profileContact.location) {
          contactInfo = profileContact;
        }
      } catch (error) {
        console.error('Error loading profile contact info:', error);
      }
    }

    return {
      contact: contactInfo,
      summary: 'Professional Summary',
      experience: [{
        title: 'Job Title',
        company: 'Company Name',
        duration: '2023 - 2024',
        bullets: ['Key achievement or responsibility']
      }],
      skills: [{
        category: 'Skills',
        items: ['Skill 1', 'Skill 2', 'Skill 3']
      }],
      education: [{
        id: 'edu_default',
        institution: 'University Name',
        degree: 'Degree',
        year: '2020'
      }],
      certifications: []
    };
  };
  const convertAIResponseToEditorFormat = async (aiResponse: AIParseResponse): Promise<ParsedResume> => {
    console.log('Converting AI response to editor format:', aiResponse);

    // Get contact info from profile first, fallback to AI
    let contactInfo = {
      name: 'Not provided',
      email: 'Not provided',
      phone: 'Not provided',
      location: 'Not provided'
    };

    if (user?.id) {
      try {
        const profileContact = await getUserContactInfo(user.id);
        if (profileContact.name || profileContact.email || profileContact.phone || profileContact.location) {
          contactInfo = profileContact;
        } else if (aiResponse.contact) {
          // Use AI contact as fallback
          contactInfo = aiResponse.contact;
        }
      } catch (error) {
        console.error('Error loading profile contact info, using AI contact:', error);
        contactInfo = aiResponse.contact || contactInfo;
      }
    } else if (aiResponse.contact) {
      contactInfo = aiResponse.contact;
    }

    // Convert experience - handle both single description and bullets array
    const experience: Experience[] = (aiResponse.experience || []).map(exp => {
      let bullets: string[] = [];
      if (exp.description) {
        // Split description by sentence markers or line breaks
        bullets = exp.description.split(/[.!?]\s+|\n+/).map(bullet => bullet.trim()).filter(bullet => bullet.length > 10) // Only keep substantial bullets
        .map(bullet => bullet.endsWith('.') ? bullet : bullet + '.');

        // If we don't get good bullets from splitting, use the whole description
        if (bullets.length === 0) {
          bullets = [exp.description];
        }
      }
      return {
        title: exp.role || 'Job Title',
        // Use role instead of title
        company: exp.company || 'Company Name',
        duration: exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '2023 - 2024',
        bullets: bullets.length > 0 ? bullets : ['Job responsibility']
      };
    });

    // Convert skills - create single section with max 10 skills
    let skills: SkillGroup[] = [];
    if (Array.isArray(aiResponse.skills) && aiResponse.skills.length > 0) {
      // Take only first 10 skills and create a single group
      const limitedSkills = aiResponse.skills.slice(0, 10);
      skills.push({
        category: 'Skills',
        items: limitedSkills
      });
    }

    // Convert education
    const education: Education[] = (aiResponse.education || []).map(edu => ({
      id: edu.id || `edu_${Date.now()}_${Math.random()}`,
      institution: edu.institution || 'University Name',
      degree: edu.degree || 'Degree',
      year: edu.year || '2020'
    }));

    // Convert certifications
    const certifications: Certification[] = (aiResponse.certifications || []).map(cert => ({
      id: cert.id || `cert_${Date.now()}_${Math.random()}`,
      name: cert.name || 'Certification Name',
      issuer: cert.issuer || 'Issuing Organization',
      year: cert.year || '2023'
    }));
    return {
      contact: contactInfo,
      summary: aiResponse.summary || 'Professional Summary',
      experience,
      skills,
      education,
      certifications
    };
  };
  const parseResumeWithAI = async (text: string, resumeId?: string) => {
    try {
      console.log('InitialResumeEditor: Starting AI parsing...');
      setParsing(true);
      setLoadingPhase('parsing');
      const {
        data,
        error
      } = await supabase.functions.invoke('parse-resume-sections', {
        body: {
          resume_text: text
        }
      });
      console.log('InitialResumeEditor: AI parsing response:', {
        data,
        error
      });
      if (error) {
        console.error('InitialResumeEditor: AI parsing error:', error);
        toast({
          title: "AI Parsing Failed",
          description: "Using basic parsing instead. You can still edit the sections manually.",
          variant: "destructive"
        });
        parseResumeTextBasic(text);
        return;
      }
      if (!data) {
        console.warn('InitialResumeEditor: No data from AI parsing, using basic parsing');
        parseResumeTextBasic(text);
        return;
      }
      console.log('InitialResumeEditor: AI parsing successful, converting data...');
      const convertedData = await convertAIResponseToEditorFormat(data);
      setParsedResume(convertedData);

      // Save the structured data for future fast loading
      if (resumeId) {
        try {
          await saveInitialResumeStructuredData(resumeId, convertedData);
          console.log('InitialResumeEditor: Structured data saved for future use');
        } catch (saveError) {
          console.error('InitialResumeEditor: Error saving structured data:', saveError);
        }
      }
      toast({
        title: "Resume Parsed",
        description: "Your resume has been automatically organized into sections."
      });
    } catch (error) {
      console.error('InitialResumeEditor: Error during AI parsing:', error);
      toast({
        title: "Parsing Error",
        description: "Using basic parsing instead.",
        variant: "destructive"
      });
      parseResumeTextBasic(text);
    } finally {
      setParsing(false);
    }
  };

  // Fallback basic parsing method
  const parseResumeTextBasic = (text: string) => {
    const sections = text.split('\n\n').filter(section => section.trim());
    const parsed: ParsedResume = {
      contact: {
        name: 'Not provided',
        email: 'Not provided', 
        phone: 'Not provided',
        location: 'Not provided'
      },
      summary: '',
      experience: [],
      skills: [],
      education: [],
      certifications: []
    };
    let currentSection = '';
    sections.forEach((section, index) => {
      const lowerSection = section.toLowerCase();
      const lines = section.split('\n').filter(line => line.trim());
      if (lowerSection.includes('summary') || lowerSection.includes('profile') || lowerSection.includes('objective')) {
        currentSection = 'summary';
        parsed.summary = lines.slice(1).join('\n').trim() || lines[0];
      } else if (lowerSection.includes('experience') || lowerSection.includes('work') || lowerSection.includes('employment')) {
        currentSection = 'experience';
        const experienceLines = lines.slice(1);
        let currentJob = null;
        experienceLines.forEach(line => {
          if (line.includes('|') || line.match(/\d{4}\s*-\s*\d{4}/) || line.match(/\d{4}\s*-\s*(present|current)/i)) {
            if (currentJob) {
              parsed.experience.push(currentJob);
            }
            const parts = line.split('|').map(p => p.trim());
            currentJob = {
              company: parts[0] || 'Company Name',
              title: parts[1] || 'Job Title',
              duration: parts[2] || '2023 - 2024',
              bullets: []
            };
          } else if (currentJob && line.trim()) {
            currentJob.bullets.push(line.trim());
          }
        });
        if (currentJob) {
          parsed.experience.push(currentJob);
        }
        if (parsed.experience.length === 0 && experienceLines.length > 0) {
          parsed.experience.push({
            company: 'Company Name',
            title: 'Job Title',
            duration: '2023 - 2024',
            bullets: experienceLines.filter(line => line.trim()).map(line => line.trim())
          });
        }
      } else if (lowerSection.includes('skill')) {
        currentSection = 'skills';
        const skillsText = lines.slice(1).join(' ').replace(/skills/gi, '').trim();
        const skillItems = skillsText.split(/[,•\-\n|]/).map(s => s.trim()).filter(s => s && s.length > 1);
        if (skillItems.length > 0) {
          parsed.skills.push({
            category: 'Technical Skills',
            items: skillItems
          });
        }
      } else if (lowerSection.includes('education')) {
        currentSection = 'education';
        const educationLines = lines.slice(1);
        educationLines.forEach(line => {
          if (line.trim()) {
            parsed.education.push({
              id: Date.now().toString() + Math.random(),
              institution: line.includes('|') ? line.split('|')[0].trim() : 'University Name',
              degree: line.includes('|') ? line.split('|')[1]?.trim() || 'Degree' : 'Degree',
              year: line.match(/\d{4}/)?.[0] || '2020'
            });
          }
        });
      } else if (lowerSection.includes('certification')) {
        currentSection = 'certifications';
        const certLines = lines.slice(1);
        certLines.forEach(line => {
          if (line.trim()) {
            parsed.certifications.push({
              id: Date.now().toString() + Math.random(),
              name: line.includes('|') ? line.split('|')[0].trim() : line.trim(),
              issuer: line.includes('|') ? line.split('|')[1]?.trim() || 'Issuing Organization' : 'Issuing Organization',
              year: line.match(/\d{4}/)?.[0] || '2023'
            });
          }
        });
      }
    });
    if (!parsed.summary && !parsed.experience.length && text.trim()) {
      const firstLines = text.split('\n').slice(0, 3).join('\n');
      parsed.summary = firstLines || 'Professional Summary';
      if (text.length > firstLines.length) {
        const remainingText = text.substring(firstLines.length).trim();
        if (remainingText) {
          parsed.experience.push({
            company: 'Company Name',
            title: 'Job Title',
            duration: '2023 - 2024',
            bullets: [remainingText]
          });
        }
      }
    }
    setParsedResume(parsed);
  };
  const handleSave = async () => {
    if (!resume || !parsedResume) {
      console.error('InitialResumeEditor: Cannot save - missing resume or parsedResume');
      return;
    }
    try {
      console.log('InitialResumeEditor: Starting save operation...');
      setSaving(true);

      // Save structured data to initial_resume_sections
      await saveInitialResumeStructuredData(resume.id, parsedResume);

      // Also update the parsed_text for backward compatibility
      const updatedText = generateResumeText(parsedResume);
      console.log('InitialResumeEditor: Generated resume text length:', updatedText.length);
      const {
        error
      } = await supabase.from('resumes').update({
        parsed_text: updatedText,
        updated_at: new Date().toISOString()
      }).eq('id', resume.id);
      if (error) {
        console.error('InitialResumeEditor: Save error:', error);
        throw error;
      }
      console.log('InitialResumeEditor: Save successful');
      toast({
        title: "Saved",
        description: "Resume changes saved successfully."
      });
    } catch (error) {
      console.error('InitialResumeEditor: Error saving resume:', error);
      toast({
        title: "Error",
        description: "Failed to save resume changes.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  const generateResumeText = (parsed: ParsedResume): string => {
    let text = '';
    if (parsed.contact) {
      text += `CONTACT INFORMATION\n`;
      if (parsed.contact.name !== 'Not provided') text += `${parsed.contact.name}\n`;
      if (parsed.contact.email !== 'Not provided') text += `${parsed.contact.email}\n`;
      if (parsed.contact.phone !== 'Not provided') text += `${parsed.contact.phone}\n`;
      if (parsed.contact.location !== 'Not provided') text += `${parsed.contact.location}\n`;
      text += '\n';
    }
    if (parsed.summary) {
      text += `SUMMARY\n${parsed.summary}\n\n`;
    }
    if (parsed.experience.length > 0) {
      text += `EXPERIENCE\n`;
      parsed.experience.forEach(exp => {
        text += `${exp.company} | ${exp.title} | ${exp.duration}\n`;
        exp.bullets.forEach(bullet => {
          text += `• ${bullet}\n`;
        });
        text += '\n';
      });
    }
    if (parsed.skills.length > 0) {
      text += `SKILLS\n`;
      parsed.skills.forEach(skillGroup => {
        text += `${skillGroup.category}: ${skillGroup.items.join(', ')}\n`;
      });
      text += '\n';
    }
    if (parsed.education.length > 0) {
      text += `EDUCATION\n`;
      parsed.education.forEach(edu => {
        text += `${edu.institution} | ${edu.degree} | ${edu.year}\n`;
      });
      text += '\n';
    }
    if (parsed.certifications.length > 0) {
      text += `CERTIFICATIONS\n`;
      parsed.certifications.forEach(cert => {
        text += `${cert.name} | ${cert.issuer} | ${cert.year}\n`;
      });
    }
    return text.trim();
  };
  console.log('InitialResumeEditor: Render state:', {
    loading,
    error,
    hasResume: !!resume,
    hasParsedResume: !!parsedResume,
    parsing
  });
  if (loading) {
    return <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center max-w-md mx-auto">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <h3 className="mt-4 text-lg font-medium text-foreground">
              Preparing your resume for AI optimization...
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Retrieving your resume data
            </p>
            <p className="text-xs text-muted-foreground">
              Usually takes 10-15 seconds
            </p>
          </div>
        </div>
      </DashboardLayout>;
  }
  if (error) {
    return <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Button onClick={() => navigate('/dashboard')} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button onClick={fetchResume} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>;
  }
  if (!resume) {
    return <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Resume not found</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>;
  }
  if (!parsedResume) {
    return <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center max-w-md mx-auto">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <h3 className="mt-4 text-lg font-medium text-foreground">
              Structuring your resume for optimization...
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              AI is organizing your resume into sections for better optimization results
            </p>
            <p className="text-xs text-muted-foreground">
              Usually takes 15-30 seconds
            </p>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                This one-time process enables faster edits and more targeted improvements
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>;
  }
  return <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <AnimatedSection immediate={true} delay={0}>
          <div className="flex justify-between items-center">
          <div>
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Resume</h1>
            <p className="text-gray-600">Structure your resume for better AI optimization</p>
            {parsing && <p className="text-sm text-blue-600 mt-1">
                <Loader2 className="h-4 w-4 inline mr-1 animate-spin" />
                AI is parsing your resume...
              </p>}
          </div>
          <Button onClick={handleSave} disabled={saving || parsing} className="bg-blue-800 hover:bg-blue-700">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
          </div>
        </AnimatedSection>

        {/* Resume Sections */}
        <AnimatedSection immediate={true} delay={100} stagger={true} staggerDelay={50}>
          <div className="space-y-6">
          {/* Contact Information Section */}
          <ContactSection 
            contactInfo={parsedResume.contact} 
            onChange={contactInfo => setParsedResume(prev => prev ? {
              ...prev,
              contact: contactInfo
            } : null)} 
          />

          {/* Summary Section */}
          <ResumeSection title="Professional Summary" value={parsedResume.summary} onChange={value => setParsedResume(prev => prev ? {
          ...prev,
          summary: value
        } : null)} />

          {/* Experience Section */}
          <ExperienceSection experiences={parsedResume.experience} onChange={experiences => setParsedResume(prev => prev ? {
          ...prev,
          experience: experiences
        } : null)} jobDescriptionId={undefined} showOptimizedBadges={false} />

          {/* Skills Section */}
          <SkillsSection skills={parsedResume.skills} onChange={skills => setParsedResume(prev => prev ? {
          ...prev,
          skills
        } : null)} />

          {/* Education Section */}
          <EducationSection education={parsedResume.education} onChange={education => setParsedResume(prev => prev ? {
          ...prev,
          education
        } : null)} />

          {/* Certifications Section */}
          <CertificationsSection certifications={parsedResume.certifications} onChange={certifications => setParsedResume(prev => prev ? {
          ...prev,
           certifications
         } : null)} />
          </div>
        </AnimatedSection>

        {/* Bottom Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={handleSave} disabled={saving || parsing} className="bg-blue-800 hover:bg-blue-700">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>;
};
export default InitialResumeEditor;