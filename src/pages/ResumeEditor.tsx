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
      console.log('=== RESUME FETCH SUCCESS ===');
      console.log('Raw generated_text length:', data.generated_text.length);
      console.log('First 500 chars:', data.generated_text.substring(0, 500));
      console.log('Contains bullet points:', data.generated_text.includes('•'));
      
      // Parse the resume with enhanced parsing
      parseResumeContent(data.generated_text);
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

  const parseResumeContent = (text: string) => {
    console.log('=== STARTING ENHANCED RESUME PARSING ===');
    console.log('Input text length:', text.length);
    console.log('Full text preview:', text.substring(0, 500));

    const parsed: ParsedResume = {
      summary: '',
      experience: [],
      skills: [],
      education: [],
      certifications: []
    };

    // First, let's find the EXPERIENCE section specifically
    const experienceMatch = text.match(/EXPERIENCE\s*\n([\s\S]*?)(?=\n(?:SKILLS|EDUCATION|CERTIFICATIONS|$))/i);
    
    if (experienceMatch) {
      const experienceBlock = experienceMatch[1].trim();
      console.log('=== EXPERIENCE BLOCK FOUND ===');
      console.log('Experience block length:', experienceBlock.length);
      console.log('Experience block content:', experienceBlock);
      
      // Parse experience entries using improved logic
      const experienceEntries = parseExperienceEntries(experienceBlock);
      console.log('=== PARSED EXPERIENCE ENTRIES ===');
      console.log('Number of entries found:', experienceEntries.length);
      
      experienceEntries.forEach((entry, index) => {
        console.log(`Entry ${index + 1}:`, entry.substring(0, 150));
        
        const lines = entry.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length === 0) return;
        
        const headerLine = lines[0];
        console.log(`Processing header: "${headerLine}"`);
        
        // Look for the pattern: Company | Role | Dates
        if (headerLine.includes('|')) {
          const parts = headerLine.split('|').map(p => p.trim());
          console.log('Header parts:', parts);
          
          if (parts.length >= 3) {
            const [company, role, dates] = parts;
            const dateRange = dates.split(' - ');
            
            // Get all bullet points (everything after the header)
            const bulletLines = lines.slice(1);
            const description = bulletLines.join('\n');
            
            console.log(`Creating experience: ${company} | ${role}`);
            console.log(`Description length: ${description.length}`);
            console.log(`Description preview: ${description.substring(0, 100)}`);
            
            parsed.experience.push({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              company: company || 'Company Name',
              role: role || 'Job Title',
              startDate: dateRange[0]?.trim() || '2023',
              endDate: dateRange[1]?.trim() || 'Present',
              description: description || '• Job responsibilities and achievements'
            });
          }
        } else {
          console.log('No | found in header, creating fallback entry');
          // Fallback for entries without proper formatting
          parsed.experience.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            company: 'Company Name',
            role: 'Job Title',
            startDate: '2023',
            endDate: 'Present',
            description: entry
          });
        }
      });
    }

    // Parse other sections using existing logic
    const sections = text.split(/\n\n+/);
    sections.forEach((section, index) => {
      const trimmed = section.trim();
      const upperSection = trimmed.toUpperCase();
      
      if (upperSection.startsWith('SUMMARY') || upperSection.startsWith('PROFESSIONAL SUMMARY')) {
        parsed.summary = trimmed.replace(/^(SUMMARY|PROFESSIONAL SUMMARY)[\s\n]*/i, '').trim();
        console.log('Found summary:', parsed.summary.substring(0, 100));
      }
      else if (upperSection.startsWith('SKILLS')) {
        const skillsText = trimmed.replace(/^SKILLS[\s\n]*/i, '').trim();
        parsed.skills = skillsText.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0);
        console.log('Found skills:', parsed.skills);
      }
      else if (upperSection.startsWith('EDUCATION')) {
        const educationText = trimmed.replace(/^EDUCATION[\s\n]*/i, '').trim();
        const educationLines = educationText.split('\n').filter(line => line.trim());
        educationLines.forEach(line => {
          const parts = line.split(' from ');
          if (parts.length >= 2) {
            const yearMatch = line.match(/\((\d{4})\)/);
            parsed.education.push({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              degree: parts[0].trim(),
              institution: parts[1].replace(/\s*\(\d{4}\)/, '').trim(),
              year: yearMatch ? yearMatch[1] : '2020'
            });
          }
        });
        console.log('Found education:', parsed.education);
      }
      else if (upperSection.startsWith('CERTIFICATIONS')) {
        const certsText = trimmed.replace(/^CERTIFICATIONS[\s\n]*/i, '').trim();
        const certLines = certsText.split('\n').filter(line => line.trim());
        certLines.forEach(line => {
          const parts = line.split(' from ');
          if (parts.length >= 2) {
            const yearMatch = line.match(/\((\d{4})\)/);
            parsed.certifications.push({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: parts[0].trim(),
              issuer: parts[1].replace(/\s*\(\d{4}\)/, '').trim(),
              year: yearMatch ? yearMatch[1] : '2023'
            });
          }
        });
        console.log('Found certifications:', parsed.certifications);
      }
    });

    console.log('=== FINAL PARSING RESULTS ===');
    console.log('Summary length:', parsed.summary.length);
    console.log('Experience count:', parsed.experience.length);
    console.log('Skills count:', parsed.skills.length);
    console.log('Education count:', parsed.education.length);
    console.log('Certifications count:', parsed.certifications.length);

    parsed.experience.forEach((exp, i) => {
      console.log(`Experience ${i + 1}: ${exp.company} | ${exp.role} (${exp.startDate} - ${exp.endDate})`);
      console.log(`  Description length: ${exp.description.length}`);
      console.log(`  Has bullets: ${exp.description.includes('•')}`);
    });

    setParsedResume(parsed);
  };

  const parseExperienceEntries = (experienceBlock: string): string[] => {
    console.log('=== PARSING EXPERIENCE ENTRIES ===');
    console.log('Experience block to parse:', experienceBlock);
    
    // Split by lines and process
    const lines = experienceBlock.split('\n');
    const entries: string[] = [];
    let currentEntry: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line looks like a header (Company | Role | Dates)
      const isHeader = line.includes('|') && line.split('|').length >= 3;
      
      if (isHeader && currentEntry.length > 0) {
        // Save the previous entry and start a new one
        entries.push(currentEntry.join('\n').trim());
        currentEntry = [line];
      } else if (isHeader) {
        // Start first entry
        currentEntry = [line];
      } else if (line.length > 0) {
        // Add content to current entry
        currentEntry.push(line);
      }
    }
    
    // Don't forget the last entry
    if (currentEntry.length > 0) {
      entries.push(currentEntry.join('\n').trim());
    }
    
    console.log(`Found ${entries.length} experience entries`);
    entries.forEach((entry, i) => {
      console.log(`Entry ${i + 1} preview:`, entry.substring(0, 100));
    });
    
    return entries.filter(entry => entry.trim().length > 0);
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
