import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResumeSection } from '@/components/resume-editor/ResumeSection';
import { ExperienceSection } from '@/components/resume-editor/ExperienceSection';
import { SkillsSection } from '@/components/resume-editor/SkillsSection';
import { EducationSection } from '@/components/resume-editor/EducationSection';
import { CertificationsSection } from '@/components/resume-editor/CertificationsSection';

interface Resume {
  id: string;
  user_id: string;
  parsed_text: string;
  file_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ParsedResume {
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

const InitialResumeEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [resume, setResume] = useState<Resume | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchResume();
    }
  }, [id]);

  const fetchResume = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setResume(data);
      await parseResumeWithAI(data.parsed_text || '');
    } catch (error) {
      console.error('Error fetching resume:', error);
      toast({
        title: "Error",
        description: "Failed to load resume for editing.",
        variant: "destructive"
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const parseResumeWithAI = async (text: string) => {
    try {
      setParsing(true);
      console.log('Starting AI parsing for resume text:', text.substring(0, 200));
      
      const { data, error } = await supabase.functions.invoke('parse-resume-sections', {
        body: { resume_text: text }
      });

      if (error) {
        console.error('AI parsing error:', error);
        toast({
          title: "AI Parsing Failed",
          description: "Using basic parsing instead. You can still edit the sections manually.",
          variant: "destructive"
        });
        // Fall back to basic parsing
        parseResumeTextBasic(text);
        return;
      }

      console.log('AI parsing successful:', data);
      setParsedResume(data);
      
      toast({
        title: "Resume Parsed",
        description: "Your resume has been automatically organized into sections.",
      });
    } catch (error) {
      console.error('Error during AI parsing:', error);
      toast({
        title: "Parsing Error", 
        description: "Using basic parsing instead.",
        variant: "destructive"
      });
      // Fall back to basic parsing
      parseResumeTextBasic(text);
    } finally {
      setParsing(false);
    }
  };

  // Fallback basic parsing method
  const parseResumeTextBasic = (text: string) => {
    const sections = text.split('\n\n').filter(section => section.trim());
    const parsed: ParsedResume = {
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
              id: Date.now().toString() + Math.random(),
              company: parts[0] || 'Company Name',
              role: parts[1] || 'Job Title',
              startDate: parts[2]?.split('-')[0]?.trim() || '2023',
              endDate: parts[2]?.split('-')[1]?.trim() || '2024',
              description: ''
            };
          } else if (currentJob && line.trim()) {
            currentJob.description += (currentJob.description ? '\n' : '') + line.trim();
          }
        });
        
        if (currentJob) {
          parsed.experience.push(currentJob);
        }
        
        if (parsed.experience.length === 0 && experienceLines.length > 0) {
          parsed.experience.push({
            id: '1',
            company: 'Company Name',
            role: 'Job Title',
            startDate: '2023',
            endDate: '2024',
            description: experienceLines.join('\n')
          });
        }
      } else if (lowerSection.includes('skill')) {
        currentSection = 'skills';
        const skillsText = lines.slice(1).join(' ').replace(/skills/gi, '').trim();
        parsed.skills = skillsText.split(/[,•\-\n|]/).map(s => s.trim()).filter(s => s && s.length > 1);
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
        parsed.experience.push({
          id: '1',
          company: 'Company Name',
          role: 'Job Title',
          startDate: '2023',
          endDate: '2024',
          description: text.substring(firstLines.length).trim() || 'Job description and achievements...'
        });
      }
    }

    setParsedResume(parsed);
  };

  const handleSave = async () => {
    if (!resume || !parsedResume) return;

    try {
      setSaving(true);
      
      const updatedText = generateResumeText(parsedResume);
      
      const { error } = await supabase
        .from('resumes')
        .update({ 
          parsed_text: updatedText,
          updated_at: new Date().toISOString()
        })
        .eq('id', resume.id);

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Resume changes saved successfully.",
      });
    } catch (error) {
      console.error('Error saving resume:', error);
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
    
    if (parsed.summary) {
      text += `SUMMARY\n${parsed.summary}\n\n`;
    }
    
    if (parsed.experience.length > 0) {
      text += `EXPERIENCE\n`;
      parsed.experience.forEach(exp => {
        text += `${exp.company} | ${exp.role} | ${exp.startDate} - ${exp.endDate}\n${exp.description}\n\n`;
      });
    }
    
    if (parsed.skills.length > 0) {
      text += `SKILLS\n${parsed.skills.join(', ')}\n\n`;
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!resume || !parsedResume) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Resume not found</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Resume</h1>
            <p className="text-gray-600">Structure your resume for better AI optimization</p>
            {parsing && (
              <p className="text-sm text-blue-600 mt-1">
                <Loader2 className="h-4 w-4 inline mr-1 animate-spin" />
                AI is parsing your resume...
              </p>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving || parsing}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        {/* Resume Sections */}
        <div className="space-y-6">
          {/* Summary Section */}
          <ResumeSection
            title="Professional Summary"
            value={parsedResume.summary}
            onChange={(value) => setParsedResume(prev => prev ? { ...prev, summary: value } : null)}
          />

          {/* Experience Section */}
          <ExperienceSection
            experiences={parsedResume.experience}
            onChange={(experiences) => setParsedResume(prev => prev ? { ...prev, experience: experiences } : null)}
          />

          {/* Skills Section */}
          <SkillsSection
            skills={parsedResume.skills}
            onChange={(skills) => setParsedResume(prev => prev ? { ...prev, skills } : null)}
          />

          {/* Education Section */}
          <EducationSection
            education={parsedResume.education}
            onChange={(education) => setParsedResume(prev => prev ? { ...prev, education } : null)}
          />

          {/* Certifications Section */}
          <CertificationsSection
            certifications={parsedResume.certifications}
            onChange={(certifications) => setParsedResume(prev => prev ? { ...prev, certifications } : null)}
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={handleSave} disabled={saving || parsing}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InitialResumeEditor;
