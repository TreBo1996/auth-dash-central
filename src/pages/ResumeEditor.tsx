
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ATSInfoTooltip } from '@/components/common/ATSInfoTooltip';

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
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [resumeData, setResumeData] = useState<EditableResumeData | null>(null);
  const [jobDescriptionId, setJobDescriptionId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [atsScore, setAtsScore] = useState<number | undefined>();
  const [atsFeedback, setAtsFeedback] = useState<any>();
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');

  useEffect(() => {
    console.log('ResumeEditor: Component mounted with resumeId:', resumeId);
    if (resumeId) {
      fetchResumeData();
    } else {
      console.error('ResumeEditor: No resume ID provided');
      setError('No resume ID provided');
      setLoading(false);
    }
  }, [resumeId]);

  const fetchResumeData = async () => {
    try {
      console.log('ResumeEditor: Starting to fetch resume data for resumeId:', resumeId);
      setLoading(true);
      setError(null);
      setLoadingStep('Fetching resume metadata...');

      // Add timeout for the entire operation
      const timeoutId = setTimeout(() => {
        console.error('ResumeEditor: Fetch operation timed out after 30 seconds');
        setError('Request timed out. Please try again.');
        setLoading(false);
      }, 30000);

      // First get the optimized resume to get job_description_id and ATS score
      console.log('ResumeEditor: Fetching optimized resume metadata...');
      const { data: optimizedResume, error: resumeError } = await supabase
        .from('optimized_resumes')
        .select('job_description_id, ats_score, ats_feedback')
        .eq('id', resumeId)
        .single();

      console.log('ResumeEditor: Optimized resume query result:', { 
        data: optimizedResume, 
        error: resumeError 
      });

      if (resumeError) {
        console.error('ResumeEditor: Error fetching optimized resume:', resumeError);
        throw new Error(`Failed to fetch resume metadata: ${resumeError.message}`);
      }

      if (!optimizedResume) {
        console.error('ResumeEditor: No optimized resume found');
        throw new Error('Resume not found');
      }
      
      console.log('ResumeEditor: Successfully fetched resume metadata:', {
        jobDescriptionId: optimizedResume.job_description_id,
        atsScore: optimizedResume.ats_score
      });

      setJobDescriptionId(optimizedResume.job_description_id);
      setAtsScore(optimizedResume.ats_score);
      setAtsFeedback(optimizedResume.ats_feedback);

      // Fetch structured data
      setLoadingStep('Fetching structured resume data...');
      console.log('ResumeEditor: Fetching structured resume data...');
      
      const structuredData = await fetchStructuredResumeData(resumeId!);
      console.log('ResumeEditor: Successfully fetched structured data:', {
        name: structuredData.name,
        experienceCount: structuredData.experience.length,
        skillsCount: structuredData.skills.length
      });
      
      // Convert to editable format
      setLoadingStep('Processing resume data...');
      console.log('ResumeEditor: Converting to editable format...');
      
      const editableData: EditableResumeData = {
        contactInfo: {
          name: structuredData.name || 'Professional Name',
          email: structuredData.email || '',
          phone: structuredData.phone || '',
          location: structuredData.location || ''
        },
        summary: structuredData.summary || '',
        experience: structuredData.experience.map(exp => ({
          title: exp.title || 'Job Title',
          company: exp.company || 'Company Name',
          duration: exp.duration || '2023 - 2024',
          bullets: exp.bullets || ['Job responsibility']
        })),
        skills: structuredData.skills || [],
        education: structuredData.education.map(edu => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          institution: edu.school || 'University Name',
          degree: edu.degree || 'Degree',
          year: edu.year || '2020'
        })),
        certifications: structuredData.certifications?.map(cert => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: cert.name || 'Certification Name',
          issuer: cert.issuer || 'Issuing Organization',
          year: cert.year || '2023'
        })) || []
      };

      console.log('ResumeEditor: Successfully converted to editable format');
      setResumeData(editableData);
      clearTimeout(timeoutId);
      
    } catch (error) {
      console.error('ResumeEditor: Error in fetchResumeData:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load resume for editing';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleRetry = () => {
    console.log('ResumeEditor: Retrying data fetch...');
    fetchResumeData();
  };

  const handleATSScoreUpdate = (newScore: number, newFeedback: any) => {
    setAtsScore(newScore);
    setAtsFeedback(newFeedback);
  };

  const handleSave = async () => {
    if (!resumeData || !resumeId) {
      console.error('ResumeEditor: Cannot save - missing resume data or resumeId');
      return;
    }

    try {
      console.log('ResumeEditor: Starting save operation...');
      setSaving(true);

      // Save contact info to resume_sections
      const { error: contactError } = await supabase
        .from('resume_sections')
        .upsert({
          optimized_resume_id: resumeId,
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
          optimized_resume_id: resumeId,
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
        .eq('optimized_resume_id', resumeId);

      if (resumeData.experience.length > 0) {
        const { error: expError } = await supabase
          .from('resume_experiences')
          .insert(
            resumeData.experience.map((exp, index) => ({
              optimized_resume_id: resumeId,
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
        .eq('optimized_resume_id', resumeId);

      if (resumeData.skills.length > 0) {
        const { error: skillsError } = await supabase
          .from('resume_skills')
          .insert(
            resumeData.skills.map((skill, index) => ({
              optimized_resume_id: resumeId,
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
        .eq('optimized_resume_id', resumeId);

      if (resumeData.education.length > 0) {
        const { error: eduError } = await supabase
          .from('resume_education')
          .insert(
            resumeData.education.map((edu, index) => ({
              optimized_resume_id: resumeId,
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
        .eq('optimized_resume_id', resumeId);

      if (resumeData.certifications.length > 0) {
        const { error: certError } = await supabase
          .from('resume_certifications')
          .insert(
            resumeData.certifications.map((cert, index) => ({
              optimized_resume_id: resumeId,
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
      console.error('ResumeEditor: Error saving resume:', error);
      toast({
        title: "Error",
        description: "Failed to save resume changes.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  console.log('ResumeEditor: Render state:', {
    loading,
    error,
    hasResumeData: !!resumeData,
    loadingStep
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading resume editor...</p>
              {loadingStep && (
                <p className="mt-2 text-sm text-blue-600">{loadingStep}</p>
              )}
            </div>
          </div>
          
          {/* Loading Skeletons */}
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
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
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
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
        {/* Clean Header */}
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

        {/* Dedicated ATS Banner */}
        {resumeId && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 shadow-sm">
            <div className="max-w-full">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-gray-900">ATS Performance</h2>
                <ATSInfoTooltip size="md" />
              </div>
              <p className="text-sm text-gray-600 mb-4">Monitor how well your resume performs against applicant tracking systems</p>
              <ATSScoreDisplay
                optimizedResumeId={resumeId}
                atsScore={atsScore}
                atsFeedback={atsFeedback}
                onScoreUpdate={handleATSScoreUpdate}
              />
            </div>
          </div>
        )}

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
