import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Loader2, Palette, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResumeSection } from '@/components/resume-editor/ResumeSection';
import { ExperienceSection } from '@/components/resume-editor/ExperienceSection';
import { SkillsSection } from '@/components/resume-editor/SkillsSection';
import { EducationSection } from '@/components/resume-editor/EducationSection';
import { CertificationsSection } from '@/components/resume-editor/CertificationsSection';
import { TemplateGallery } from '@/components/templates/TemplateGallery';
import { ResumeTemplateRenderer } from '@/components/templates/ResumeTemplateRenderer';
import { PDFExporter } from '@/components/templates/PDFExporter';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useTemplatePreferences } from '@/hooks/useTemplatePreferences';

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
  const [activeTab, setActiveTab] = useState('edit');

  const { planLevel } = useUserPlan();
  const { 
    selectedTemplateId, 
    selectedTemplateConfig, 
    updateTemplatePreference 
  } = useTemplatePreferences();

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
      parseResumeText(data.generated_text);
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

  const parseResumeText = (text: string) => {
    // Simple parsing logic - in production, you might want more sophisticated parsing
    const sections = text.split('\n\n');
    const parsed: ParsedResume = {
      summary: '',
      experience: [],
      skills: [],
      education: [],
      certifications: []
    };

    // Basic parsing - this is a simplified version
    // You might want to implement more sophisticated parsing based on your AI output format
    let currentSection = '';
    
    sections.forEach((section, index) => {
      const lowerSection = section.toLowerCase();
      
      if (lowerSection.includes('summary') || lowerSection.includes('profile') || index === 0) {
        parsed.summary = section.replace(/summary|profile/gi, '').trim();
        currentSection = 'summary';
      } else if (lowerSection.includes('experience') || lowerSection.includes('work')) {
        currentSection = 'experience';
        // Parse experience entries - simplified
        if (section.includes('•') || section.includes('-')) {
          parsed.experience.push({
            id: Date.now().toString() + Math.random(),
            company: 'Company Name',
            role: 'Job Title',
            startDate: '2023',
            endDate: '2024',
            description: section
          });
        }
      } else if (lowerSection.includes('skills')) {
        currentSection = 'skills';
        const skillsText = section.replace(/skills/gi, '').trim();
        parsed.skills = skillsText.split(/[,•\-\n]/).map(s => s.trim()).filter(s => s);
      } else if (lowerSection.includes('education')) {
        currentSection = 'education';
        parsed.education.push({
          id: Date.now().toString() + Math.random(),
          institution: 'University Name',
          degree: 'Degree',
          year: '2020'
        });
      } else if (lowerSection.includes('certification')) {
        currentSection = 'certifications';
        parsed.certifications.push({
          id: Date.now().toString() + Math.random(),
          name: 'Certification Name',
          issuer: 'Issuing Organization',
          year: '2023'
        });
      }
    });

    // If we don't have any parsed content, create a basic structure
    if (!parsed.summary && !parsed.experience.length) {
      parsed.summary = text.substring(0, 200) + '...';
      parsed.experience.push({
        id: '1',
        company: 'Company Name',
        role: 'Job Title',
        startDate: '2023',
        endDate: '2024',
        description: 'Job description and achievements...'
      });
    }

    setParsedResume(parsed);
  };

  const handleSave = async () => {
    if (!resume || !parsedResume) return;

    try {
      setSaving(true);
      
      // Convert parsed resume back to text format
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
        text += `${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate})\n${exp.description}\n\n`;
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

  const handleTemplateSelect = (templateId: string, templateConfig: any) => {
    updateTemplatePreference(templateId, templateConfig);
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
      <div className="max-w-6xl mx-auto space-y-6">
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
            <p className="text-gray-600">Edit and customize your AI-optimized resume</p>
          </div>
          <div className="flex gap-2">
            <PDFExporter
              resumeId={resume.id}
              resumeContent={
                selectedTemplateConfig && (
                  <ResumeTemplateRenderer
                    resume={parsedResume}
                    templateConfig={selectedTemplateConfig}
                    templateName="Selected Template"
                  />
                )
              }
              templateId={selectedTemplateId || undefined}
              userName="User"
            />
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

        {/* Tabs for Edit/Template/Preview */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="edit">Edit Content</TabsTrigger>
            <TabsTrigger value="template">
              <Palette className="h-4 w-4 mr-2" />
              Choose Template
            </TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="template">
            <TemplateGallery
              resume={parsedResume}
              onTemplateSelect={handleTemplateSelect}
              selectedTemplateId={selectedTemplateId || undefined}
              userPlanLevel={planLevel}
            />
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Resume Preview</CardTitle>
                <p className="text-sm text-gray-600">
                  This is how your resume will look when exported to PDF
                </p>
              </CardHeader>
              <CardContent>
                {selectedTemplateConfig ? (
                  <div className="border rounded-lg p-4 bg-white">
                    <ResumeTemplateRenderer
                      resume={parsedResume}
                      templateConfig={selectedTemplateConfig}
                      templateName="Preview"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a template to see the preview</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab('template')}
                    >
                      Choose Template
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <PDFExporter
              resumeId={resume.id}
              resumeContent={
                selectedTemplateConfig && (
                  <ResumeTemplateRenderer
                    resume={parsedResume}
                    templateConfig={selectedTemplateConfig}
                    templateName="Selected Template"
                  />
                )
              }
              templateId={selectedTemplateId || undefined}
              userName="User"
            />
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
      </div>
    </DashboardLayout>
  );
};

export default ResumeEditor;
