import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResumeSection } from '@/components/resume-editor/ResumeSection';
import { ContactSection } from '@/components/resume-editor/ContactSection';
import { ExperienceSection } from '@/components/resume-editor/ExperienceSection';
import { SkillsSection } from '@/components/resume-editor/SkillsSection';
import { EducationSection } from '@/components/resume-editor/EducationSection';
import { CertificationsSection } from '@/components/resume-editor/CertificationsSection';
import { ATSScoreDisplay } from '@/components/ATSScoreDisplay';
import { fetchStructuredResumeData, StructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
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

interface EditableResumeData {
  contactInfo: ContactInfo;
  summary: string;
  experience: Experience[];
  skills: SkillGroup[];
  education: Education[];
  certifications: Certification[];
}

const ResumeEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [resumeData, setResumeData] = useState<EditableResumeData | null>(null);
  const [jobDescriptionId, setJobDescriptionId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [atsScore, setAtsScore] = useState<number | undefined>();
  const [atsFeedback, setAtsFeedback] = useState<any>();

  useEffect(() => {
    if (id) {
      fetchResumeData();
    }
  }, [id]);

  const fetchResumeData = async () => {
    try {
      setLoading(true);
      
      // First get the optimized resume to get job_description_id and ATS score
      const { data: optimizedResume, error: resumeError } = await supabase
        .from('optimized_resumes')
        .select('job_description_id, ats_score, ats_feedback')
        .eq('id', id)
        .single();

      if (resumeError) throw resumeError;
      
      setJobDescriptionId(optimizedResume.job_description_id);
      setAtsScore(optimizedResume.ats_score);
      setAtsFeedback(optimizedResume.ats_feedback);

      // Fetch structured data
      const structuredData = await fetchStructuredResumeData(id!);
      
      // Convert to editable format
      const editableData: EditableResumeData = {
        contactInfo: {
          name: structuredData.name,
          email: structuredData.email,
          phone: structuredData.phone,
          location: structuredData.location
        },
        summary: structuredData.summary,
        experience: structuredData.experience.map(exp => ({
          title: exp.title,
          company: exp.company,
          duration: exp.duration,
          bullets: exp.bullets
        })),
        skills: structuredData.skills,
        education: structuredData.education.map(edu => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          institution: edu.school,
          degree: edu.degree,
          year: edu.year
        })),
        certifications: structuredData.certifications?.map(cert => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: cert.name,
          issuer: cert.issuer,
          year: cert.year
        })) || []
      };

      setResumeData(editableData);
    } catch (error) {
      console.error('Error fetching resume data:', error);
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

  const handleATSScoreUpdate = (newScore: number, newFeedback: any) => {
    setAtsScore(newScore);
    setAtsFeedback(newFeedback);
  };

  const handleSave = async () => {
    if (!resumeData || !id) return;

    try {
      setSaving(true);

      // Save contact info to resume_sections
      const { error: contactError } = await supabase
        .from('resume_sections')
        .upsert({
          optimized_resume_id: id,
          section_type: 'contact',
          content: {
            name: resumeData.contactInfo.name,
            email: resumeData.contactInfo.email,
            phone: resumeData.contactInfo.phone,
            location: resumeData.contactInfo.location
          }
        }, {
          onConflict: 'optimized_resume_id,section_type'
        });

      if (contactError) throw contactError;

      // Save summary to resume_sections
      const { error: summaryError } = await supabase
        .from('resume_sections')
        .upsert({
          optimized_resume_id: id,
          section_type: 'summary',
          content: {
            summary: resumeData.summary
          }
        }, {
          onConflict: 'optimized_resume_id,section_type'
        });

      if (summaryError) throw summaryError;

      // Delete existing experiences and insert new ones
      await supabase
        .from('resume_experiences')
        .delete()
        .eq('optimized_resume_id', id);

      if (resumeData.experience.length > 0) {
        const { error: expError } = await supabase
          .from('resume_experiences')
          .insert(
            resumeData.experience.map((exp, index) => ({
              optimized_resume_id: id,
              title: exp.title,
              company: exp.company,
              duration: exp.duration,
              bullets: exp.bullets,
              display_order: index
            }))
          );

        if (expError) throw expError;
      }

      // Delete existing skills and insert new ones
      await supabase
        .from('resume_skills')
        .delete()
        .eq('optimized_resume_id', id);

      if (resumeData.skills.length > 0) {
        const { error: skillsError } = await supabase
          .from('resume_skills')
          .insert(
            resumeData.skills.map((skill, index) => ({
              optimized_resume_id: id,
              category: skill.category,
              items: skill.items,
              display_order: index
            }))
          );

        if (skillsError) throw skillsError;
      }

      // Delete existing education and insert new ones
      await supabase
        .from('resume_education')
        .delete()
        .eq('optimized_resume_id', id);

      if (resumeData.education.length > 0) {
        const { error: eduError } = await supabase
          .from('resume_education')
          .insert(
            resumeData.education.map((edu, index) => ({
              optimized_resume_id: id,
              degree: edu.degree,
              school: edu.institution,
              year: edu.year,
              display_order: index
            }))
          );

        if (eduError) throw eduError;
      }

      // Delete existing certifications and insert new ones
      await supabase
        .from('resume_certifications')
        .delete()
        .eq('optimized_resume_id', id);

      if (resumeData.certifications.length > 0) {
        const { error: certError } = await supabase
          .from('resume_certifications')
          .insert(
            resumeData.certifications.map((cert, index) => ({
              optimized_resume_id: id,
              name: cert.name,
              issuer: cert.issuer,
              year: cert.year,
              display_order: index
            }))
          );

        if (certError) throw certError;
      }

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!resumeData) {
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
        {/* Header with ATS Score */}
        <div className="flex justify-between items-start">
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
          <div className="flex items-center gap-4">
            {/* ATS Score Display */}
            {id && (
              <div className="bg-white border rounded-lg p-4 shadow-sm min-w-[250px]">
                <ATSScoreDisplay
                  optimizedResumeId={id}
                  atsScore={atsScore}
                  atsFeedback={atsFeedback}
                  onScoreUpdate={handleATSScoreUpdate}
                />
              </div>
            )}
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

        {/* Resume Sections */}
        <div className="space-y-6">
          {/* Contact Information */}
          <ContactSection
            contactInfo={resumeData.contactInfo}
            onChange={(contactInfo) => setResumeData(prev => prev ? { ...prev, contactInfo } : null)}
          />

          {/* Professional Summary */}
          <ResumeSection
            title="Professional Summary"
            value={resumeData.summary}
            onChange={(summary) => setResumeData(prev => prev ? { ...prev, summary }  : null)}
          />

          {/* Experience Section */}
          <ExperienceSection
            experiences={resumeData.experience}
            onChange={(experience) => setResumeData(prev => prev ? { ...prev, experience } : null)}
            jobDescriptionId={jobDescriptionId}
          />

          {/* Skills Section */}
          <SkillsSection
            skills={resumeData.skills}
            onChange={(skills) => setResumeData(prev => prev ? { ...prev, skills } : null)}
          />

          {/* Education Section */}
          <EducationSection
            education={resumeData.education}
            onChange={(education) => setResumeData(prev => prev ? { ...prev, education } : null)}
          />

          {/* Certifications Section */}
          <CertificationsSection
            certifications={resumeData.certifications}
            onChange={(certifications) => setResumeData(prev => prev ? { ...prev, certifications } : null)}
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
