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
      console.log('=== DEBUGGING GENERATED TEXT ===');
      console.log('Full generated_text length:', data.generated_text.length);
      console.log('First 500 characters:', data.generated_text.substring(0, 500));
      console.log('Contains bullet points (•):', data.generated_text.includes('•'));
      console.log('Contains EXPERIENCE section:', data.generated_text.includes('EXPERIENCE'));
      
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
    console.log('=== ENHANCED PARSING DEBUG ===');
    console.log('Input text length:', text.length);
    console.log('Text preview:', text.substring(0, 200));
    
    // Split by double newlines to get major sections
    const sections = text.split(/\n\n+/);
    console.log('Number of sections found:', sections.length);
    
    const parsed: ParsedResume = {
      summary: '',
      experience: [],
      skills: [],
      education: [],
      certifications: []
    };

    let currentSection = '';
    let experienceContent = '';
    
    sections.forEach((section, index) => {
      const trimmed = section.trim();
      const lowerSection = trimmed.toLowerCase();
      
      console.log(`Processing section ${index}:`, trimmed.substring(0, 100));
      
      if (lowerSection.startsWith('summary') || lowerSection.startsWith('professional summary')) {
        currentSection = 'summary';
        parsed.summary = trimmed.replace(/^(summary|professional summary)[\s\n]*/gi, '').trim();
        console.log('Found summary section, length:', parsed.summary.length);
      } 
      else if (lowerSection.startsWith('experience') || lowerSection.startsWith('work experience')) {
        currentSection = 'experience';
        experienceContent = trimmed.replace(/^(experience|work experience)[\s\n]*/gi, '').trim();
        console.log('Found experience section, content length:', experienceContent.length);
        console.log('Experience content preview:', experienceContent.substring(0, 200));
      }
      else if (lowerSection.startsWith('skills')) {
        currentSection = 'skills';
        const skillsText = trimmed.replace(/^skills[\s\n]*/gi, '').trim();
        parsed.skills = skillsText
          .split(/[,\n]/)
          .map(s => s.trim())
          .filter(s => s && s.length > 1);
        console.log('Found skills, count:', parsed.skills.length);
      }
      else if (lowerSection.startsWith('education')) {
        currentSection = 'education';
        const educationLines = trimmed.replace(/^education[\s\n]*/gi, '').split('\n').filter(line => line.trim());
        educationLines.forEach(line => {
          if (line.trim()) {
            const parts = line.split('|').map(p => p.trim());
            parsed.education.push({
              id: Date.now().toString() + Math.random(),
              institution: parts[0] || 'University',
              degree: parts[1] || 'Degree',
              year: parts[2] || line.match(/\d{4}/)?.[0] || '2020'
            });
          }
        });
        console.log('Found education, count:', parsed.education.length);
      }
      else if (lowerSection.startsWith('certifications')) {
        currentSection = 'certifications';
        const certLines = trimmed.replace(/^certifications[\s\n]*/gi, '').split('\n').filter(line => line.trim());
        certLines.forEach(line => {
          if (line.trim()) {
            const parts = line.split('|').map(p => p.trim());
            parsed.certifications.push({
              id: Date.now().toString() + Math.random(),
              name: parts[0] || line.trim(),
              issuer: parts[1] || 'Issuing Organization',
              year: parts[2] || line.match(/\d{4}/)?.[0] || '2023'
            });
          }
        });
        console.log('Found certifications, count:', parsed.certifications.length);
      }
      else if (currentSection === 'experience' && trimmed) {
        // This might be additional experience content
        experienceContent += '\n\n' + trimmed;
        console.log('Added to experience content, new length:', experienceContent.length);
      }
    });

    // Parse the experience content more carefully
    if (experienceContent) {
      console.log('=== PARSING EXPERIENCE CONTENT ===');
      console.log('Full experience content:', experienceContent);
      
      // Split experience content by company/job entries
      // Look for patterns like "Company | Role | Dates"
      const experienceBlocks = experienceContent.split(/(?=\n[A-Z][^|\n]*\s*\|\s*[^|\n]*\s*\|\s*[^|\n]*)/);
      
      console.log('Experience blocks found:', experienceBlocks.length);
      
      experienceBlocks.forEach((block, index) => {
        const lines = block.split('\n').map(line => line.trim()).filter(line => line);
        console.log(`Processing experience block ${index}:`, lines[0]?.substring(0, 100));
        
        if (lines.length === 0) return;
        
        const firstLine = lines[0];
        
        // Check if this looks like a job header (Company | Role | Dates)
        if (firstLine.includes('|')) {
          const parts = firstLine.split('|').map(p => p.trim());
          
          if (parts.length >= 3) {
            // Extract dates from the third part
            const datePart = parts[2];
            const dateMatch = datePart.match(/(.+?)\s*-\s*(.+)/);
            
            // Get all remaining lines as description, preserving bullet points
            const descriptionLines = lines.slice(1);
            const description = descriptionLines.join('\n');
            
            console.log(`Experience ${index}: Company=${parts[0]}, Role=${parts[1]}, Description length=${description.length}`);
            console.log(`Description preview:`, description.substring(0, 200));
            console.log(`Contains bullets:`, description.includes('•'));
            
            parsed.experience.push({
              id: Date.now().toString() + index,
              company: parts[0] || 'Company Name',
              role: parts[1] || 'Job Title',
              startDate: dateMatch ? dateMatch[1].trim() : '2023',
              endDate: dateMatch ? dateMatch[2].trim() : 'Present',
              description: description || 'Job responsibilities and achievements'
            });
          }
        } else if (parsed.experience.length === 0 && lines.length > 0) {
          // Fallback: treat entire content as one job if no proper format found
          console.log('Fallback: treating entire content as single job');
          parsed.experience.push({
            id: '1',
            company: 'Company Name',
            role: 'Job Title',
            startDate: '2023',
            endDate: 'Present',
            description: experienceContent
          });
        }
      });
    }

    // Final fallback if no experience was parsed
    if (parsed.experience.length === 0 && text.includes('•')) {
      console.log('Final fallback: preserving bullet points in single job entry');
      parsed.experience.push({
        id: '1',
        company: 'Company Name',
        role: 'Job Title',
        startDate: '2023',
        endDate: 'Present',
        description: text.substring(0, 2000) // Preserve original with bullet points
      });
    }

    console.log('=== FINAL PARSED RESULT ===');
    console.log('Summary length:', parsed.summary.length);
    console.log('Experience count:', parsed.experience.length);
    console.log('Experience descriptions with bullets:', parsed.experience.map(exp => ({
      company: exp.company,
      hasBullets: exp.description.includes('•'),
      descLength: exp.description.length,
      preview: exp.description.substring(0, 100)
    })));

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
