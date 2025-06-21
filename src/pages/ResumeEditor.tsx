import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResumeSection } from '@/components/resume-editor/ResumeSection';
import { ExperienceSection } from '@/components/resume-editor/ExperienceSection';
import { SkillsSection } from '@/components/resume-editor/SkillsSection';
import { EducationSection } from '@/components/resume-editor/EducationSection';
import { CertificationsSection } from '@/components/resume-editor/CertificationsSection';

interface OptimizedResume {
  id: string;
  user_id: string;
  original_resume_id: string;
  job_description_id: string;
  generated_text: string;
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

const ResumeEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [resume, setResume] = useState<OptimizedResume | null>(null);
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
        .from('optimized_resumes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setResume(data);
      await parseResumeWithAI(data.generated_text);
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
      console.log('Parsing optimized resume with AI...');
      
      const { data, error } = await supabase.functions.invoke('parse-resume-sections', {
        body: { resume_text: text }
      });

      if (error) {
        console.error('AI parsing error:', error);
        throw error;
      }

      console.log('AI parsing successful:', data);
      setParsedResume(data);
    } catch (error) {
      console.error('Error parsing resume with AI:', error);
      console.log('Falling back to enhanced parsing for optimized content...');
      
      // Enhanced fallback parsing specifically for optimized resumes
      const enhancedParsed = parseOptimizedResumeText(text);
      setParsedResume(enhancedParsed);
      
      toast({
        title: "Parsing Notice",
        description: "Using enhanced parsing for optimized content.",
        variant: "default"
      });
    } finally {
      setParsing(false);
    }
  };

  const parseOptimizedResumeText = (text: string): ParsedResume => {
    console.log('Enhanced parsing for optimized resume content');
    
    const sections = text.split(/\n\n+/);
    const parsed: ParsedResume = {
      summary: '',
      experience: [],
      skills: [],
      education: [],
      certifications: []
    };

    let currentSection = '';
    
    sections.forEach((section, index) => {
      const lowerSection = section.toLowerCase().trim();
      const lines = section.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lowerSection.includes('summary') || lowerSection.includes('profile') || (index === 0 && !lowerSection.includes('experience'))) {
        parsed.summary = section.replace(/^(summary|profile|professional summary)[\s\n]*/gi, '').trim();
        currentSection = 'summary';
      } else if (lowerSection.includes('experience') || lowerSection.includes('work history')) {
        currentSection = 'experience';
        
        // Parse experience entries - enhanced for optimized content
        if (lines.length > 1) {
          let currentExp: any = null;
          
          lines.forEach(line => {
            // Check if this is a job title line (contains company and dates)
            if (line.includes('|') && (line.includes('20') || line.includes('Present'))) {
              // Save previous experience if exists
              if (currentExp) {
                parsed.experience.push(currentExp);
              }
              
              // Parse new experience header: "Company | Role | Dates"
              const parts = line.split('|').map(p => p.trim());
              currentExp = {
                id: Date.now().toString() + Math.random(),
                company: parts[0] || 'Company Name',
                role: parts[1] || 'Job Title',
                startDate: parts[2]?.split('-')[0]?.trim() || '2023',
                endDate: parts[2]?.split('-')[1]?.trim() || 'Present',
                description: ''
              };
            } else if (currentExp && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
              // Add bullet points to current experience
              if (currentExp.description) {
                currentExp.description += '\n' + line;
              } else {
                currentExp.description = line;
              }
            } else if (currentExp && line && !line.toLowerCase().includes('experience')) {
              // Add non-bullet content to description
              if (currentExp.description) {
                currentExp.description += '\n' + line;
              } else {
                currentExp.description = line;
              }
            }
          });
          
          // Add the last experience
          if (currentExp) {
            parsed.experience.push(currentExp);
          }
        }
      } else if (lowerSection.includes('skills')) {
        currentSection = 'skills';
        const skillsText = section.replace(/^skills[\s\n]*/gi, '').trim();
        // Split by various delimiters and clean up
        parsed.skills = skillsText
          .split(/[,•\-\n|]/)
          .map(s => s.trim())
          .filter(s => s && s.length > 1)
          .slice(0, 50); // Limit to reasonable number
      } else if (lowerSection.includes('education')) {
        currentSection = 'education';
        lines.forEach(line => {
          if (line && !line.toLowerCase().includes('education')) {
            parsed.education.push({
              id: Date.now().toString() + Math.random(),
              institution: line.includes('from') ? line.split('from')[1]?.trim() || 'University' : 'University',
              degree: line.includes('from') ? line.split('from')[0]?.trim() || 'Degree' : line,
              year: line.match(/\d{4}/)?.[0] || '2020'
            });
          }
        });
      } else if (lowerSection.includes('certification')) {
        currentSection = 'certifications';
        lines.forEach(line => {
          if (line && !line.toLowerCase().includes('certification')) {
            parsed.certifications.push({
              id: Date.now().toString() + Math.random(),
              name: line.includes('from') ? line.split('from')[0]?.trim() || 'Certification' : line,
              issuer: line.includes('from') ? line.split('from')[1]?.trim() || 'Issuer' : 'Issuing Organization',
              year: line.match(/\d{4}/)?.[0] || '2023'
            });
          }
        });
      }
    });

    // Ensure we have at least some content with preserved bullet points
    if (!parsed.experience.length && text.includes('•')) {
      // Fallback: treat the entire text as one experience with bullet points
      parsed.experience.push({
        id: '1',
        company: 'Company Name',
        role: 'Job Title',
        startDate: '2023',
        endDate: '2024',
        description: text.substring(0, 1000) // Preserve original bullet points
      });
    }

    console.log('Enhanced parsed result:', {
      summaryLength: parsed.summary.length,
      experienceCount: parsed.experience.length,
      experienceDescriptions: parsed.experience.map(exp => exp.description.substring(0, 100))
    });

    return parsed;
  };

  const handleSave = async () => {
    if (!resume || !parsedResume) return;

    try {
      setSaving(true);
      
      // Convert parsed resume back to text format with preserved bullet points
      const updatedText = generateResumeText(parsedResume);
      
      const { error } = await supabase
        .from('optimized_resumes')
        .update({ 
          generated_text: updatedText,
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
        text += `${edu.degree} from ${edu.institution} (${edu.year})\n`;
      });
      text += '\n';
    }
    
    if (parsed.certifications.length > 0) {
      text += `CERTIFICATIONS\n`;
      parsed.certifications.forEach(cert => {
        text += `${cert.name} from ${cert.issuer} (${cert.year})\n`;
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
            <h1 className="text-2xl font-bold text-gray-900">Resume Editor</h1>
            <p className="text-gray-600">Edit your AI-optimized resume</p>
            {parsing && (
              <p className="text-sm text-blue-600 mt-1">
                <Loader2 className="h-3 w-3 inline mr-1 animate-spin" />
                Parsing resume sections...
              </p>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving}>
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
          <Button onClick={handleSave} disabled={saving}>
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

export default ResumeEditor;
