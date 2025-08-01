import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ResumeOptimizer } from '@/components/ResumeOptimizer';
import { ATSScoreDisplay } from '@/components/ATSScoreDisplay';
import { ContactSection } from '@/components/resume-editor/ContactSection';
import { ExperienceSection } from '@/components/resume-editor/ExperienceSection';
import { SkillsSection } from '@/components/resume-editor/SkillsSection';
import { EducationSection } from '@/components/resume-editor/EducationSection';
import { CertificationsSection } from '@/components/resume-editor/CertificationsSection';
import { TemplateSelector } from '@/components/resume-templates/TemplateSelector';
import { ColorSchemeSelector } from '@/components/resume-templates/ColorSchemeSelector';
import { ResumePreview } from '@/components/resume-templates/ResumePreview';
import { CoverLetterGenerator } from '@/components/CoverLetterGenerator';
import { generateProfessionalPDF } from '@/utils/unifiedPdfGenerator';
import { fetchStructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';
import { newTemplateConfigs } from '@/components/resume-templates/configs/newTemplateConfigs';
import { useIsMobile } from '@/hooks/use-mobile';
import { InlineFileUpload } from './InlineFileUpload';
import { FileText, Sparkles, Send, CheckCircle, Eye, ArrowLeft, Upload, Save, Download, Edit, Target, Palette, ExternalLink, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  source?: string;
  data_source?: string; // 'employer' or 'apify' to distinguish job sources
  job_url?: string;
  apply_url?: string;
  company?: string;
  employer_job_posting_id?: string; // For employer jobs in cached_jobs, stores actual job posting ID
  employer_profile: {
    company_name: string;
  } | null;
}

interface JobApplicationModalNoResumeProps {
  isOpen: boolean;
  onClose: () => void;
  jobPosting: JobPosting;
  onApplicationSubmitted: () => void;
}

export const JobApplicationModalNoResume: React.FC<JobApplicationModalNoResumeProps> = ({
  isOpen,
  onClose,
  jobPosting,
  onApplicationSubmitted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Comprehensive workflow step management
  const [step, setStep] = useState<'upload' | 'choose-optimization' | 'optimize' | 'edit-resume' | 'templates' | 'cover-letter' | 'final-submit' | 'external-apply' | 'success'>('upload');
  
  // Track workflow intent for streamlined paths
  const [originalIntent, setOriginalIntent] = useState<'optimize' | 'existing' | null>(null);
  
  // Resume management
  const [uploadedResumeId, setUploadedResumeId] = useState<string>('');
  const [optimizedResumeId, setOptimizedResumeId] = useState<string>('');
  const [optimizedResumeContent, setOptimizedResumeContent] = useState<string>('');
  
  // Job description management
  const [jobDescriptionId, setJobDescriptionId] = useState<string>('');
  const [creatingJobDescription, setCreatingJobDescription] = useState(false);
  
  // ATS and optimization
  const [atsScore, setAtsScore] = useState<number | undefined>();
  const [atsFeedback, setAtsFeedback] = useState<any>(undefined);
  
  // Resume editing
  const [editableResumeData, setEditableResumeData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState('modern-ats');
  const [selectedColorScheme, setSelectedColorScheme] = useState('classic-monochrome');
  const [isExporting, setIsExporting] = useState(false);
  
  // Cover letter and application
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const isMobile = useIsMobile();
  const companyName = jobPosting.employer_profile?.company_name || jobPosting.company || 'Company Name Not Available';

  useEffect(() => {
    if (isOpen && user) {
      console.log('🔄 No Resume Modal opened');
      setStep('upload');
    }
  }, [isOpen, user]);

  const createJobDescription = async () => {
    if (!user) {
      console.log('❌ No user found, cannot create job description');
      return null;
    }
    
    setCreatingJobDescription(true);
    try {
      console.log('📝 Creating job description for:', jobPosting.title);
      
      // Check if job description already exists for this job posting
      const { data: existingJobDesc } = await supabase
        .from('job_descriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', jobPosting.title)
        .eq('parsed_text', jobPosting.description)
        .eq('source', 'application')
        .maybeSingle();

      if (existingJobDesc) {
        console.log('✅ Found existing job description:', existingJobDesc.id);
        setJobDescriptionId(existingJobDesc.id);
        return existingJobDesc.id;
      }

      // Create new job description
      const { data: newJobDesc, error } = await supabase
        .from('job_descriptions')
        .insert({
          user_id: user.id,
          title: jobPosting.title,
          parsed_text: jobPosting.description,
          source: 'application',
          company: companyName
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error creating job description:', error);
        throw error;
      }
      
      console.log('✅ Created new job description:', newJobDesc.id);
      setJobDescriptionId(newJobDesc.id);
      return newJobDesc.id;
    } catch (error) {
      console.error('Error creating job description:', error);
      toast({
        title: "Error",
        description: "Failed to prepare job description for optimization",
        variant: "destructive"
      });
      return null;
    } finally {
      setCreatingJobDescription(false);
    }
  };

  const handleUploadSuccess = (resumeId: string) => {
    console.log('✅ Resume uploaded successfully:', resumeId);
    setUploadedResumeId(resumeId);
    setStep('choose-optimization');
  };

  const handleOptimizeClick = async () => {
    console.log('🎯 Optimize button clicked');
    
    // Mark this as an optimization workflow
    setOriginalIntent('optimize');
    
    const jobDescId = await createJobDescription();
    if (jobDescId) {
      console.log('✅ Job description ready, moving to optimize step');
      setStep('optimize');
    }
  };

  const handleSkipOptimization = async () => {
    console.log('⏭️ User chose to use existing resume, going directly to cover letter...');
    
    // Set the uploaded resume as our working resume
    setOptimizedResumeId(uploadedResumeId);
    
    // Mark this as an existing resume workflow to skip editing steps
    setOriginalIntent('existing');
    
    // Create job description for cover letter generation
    const jobDescId = await createJobDescription();
    if (jobDescId) {
      console.log('✅ Job description ready for cover letter generation');
      setStep('cover-letter');
    }
  };

  const handleOptimizationComplete = async () => {
    console.log('✅ Optimization complete, loading optimized resume...');
    
    // Get the most recent optimized resume and load its structured data
    try {
      const { data } = await supabase
        .from('optimized_resumes')
        .select('id, generated_text, ats_score, ats_feedback')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        console.log('✅ Found optimized resume:', data.id);
        setOptimizedResumeId(data.id);
        setOptimizedResumeContent(data.generated_text || '');
        
        // Set ATS data if available
        if (data.ats_score) {
          setAtsScore(data.ats_score);
          setAtsFeedback(data.ats_feedback);
        }
        
        // Load editable resume data for editor
        await loadEditableResumeData(data.id);
        
        setStep('edit-resume');
      } else {
        console.log('⚠️ No optimized resume found, going to final-submit');
        setStep('final-submit');
      }
    } catch (error) {
      console.error('Error getting optimized resume:', error);
      setStep('final-submit');
    }
  };

  const loadEditableResumeData = async (resumeId: string) => {
    try {
      console.log('🔄 Loading structured resume data for editing...');
      const structuredData = await fetchStructuredResumeData(resumeId);
      
      // Transform StructuredResumeData to EditableResumeData format (same as ResumeEditor.tsx)
      const editableData = {
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
      
      setEditableResumeData(editableData);
      console.log('✅ Loaded and transformed resume data for editing');
    } catch (error) {
      console.error('Error loading structured resume data:', error);
      // Fallback to basic structure
      setEditableResumeData({
        contactInfo: { name: '', email: '', phone: '', location: '' },
        summary: '',
        experience: [],
        skills: [],
        education: [],
        certifications: []
      });
    }
  };

  const handleATSScoreUpdate = (newScore: number, newFeedback: any) => {
    setAtsScore(newScore);
    setAtsFeedback(newFeedback);
  };

  const handleResumeDataChange = (newData: any) => {
    setEditableResumeData(newData);
  };

  const handleSaveResumeChanges = async () => {
    if (!optimizedResumeId || !editableResumeData) return;
    
    setIsSaving(true);
    try {
      // Save contact info to resume_sections
      const { error: contactError } = await supabase
        .from('resume_sections')
        .upsert({
          optimized_resume_id: optimizedResumeId,
          section_type: 'contact',
          content: {
            name: editableResumeData.contactInfo.name,
            email: editableResumeData.contactInfo.email,
            phone: editableResumeData.contactInfo.phone,
            location: editableResumeData.contactInfo.location
          }
        }, {
          onConflict: 'optimized_resume_id,section_type'
        });
      if (contactError) throw contactError;

      // Save summary to resume_sections
      const { error: summaryError } = await supabase
        .from('resume_sections')
        .upsert({
          optimized_resume_id: optimizedResumeId,
          section_type: 'summary',
          content: {
            summary: editableResumeData.summary
          }
        }, {
          onConflict: 'optimized_resume_id,section_type'
        });
      if (summaryError) throw summaryError;

      // Delete existing experiences and insert new ones
      await supabase.from('resume_experiences').delete().eq('optimized_resume_id', optimizedResumeId);
      if (editableResumeData.experience.length > 0) {
        const { error: expError } = await supabase
          .from('resume_experiences')
          .insert(editableResumeData.experience.map((exp: any, index: number) => ({
            optimized_resume_id: optimizedResumeId,
            title: exp.title,
            company: exp.company,
            duration: exp.duration,
            bullets: exp.bullets,
            display_order: index
          })));
        if (expError) throw expError;
      }

      // Delete existing skills and insert new ones
      await supabase.from('resume_skills').delete().eq('optimized_resume_id', optimizedResumeId);
      if (editableResumeData.skills.length > 0) {
        const { error: skillsError } = await supabase
          .from('resume_skills')
          .insert(editableResumeData.skills.map((skill: any, index: number) => ({
            optimized_resume_id: optimizedResumeId,
            category: skill.category,
            items: skill.items,
            display_order: index
          })));
        if (skillsError) throw skillsError;
      }

      // Delete existing education and insert new ones
      await supabase.from('resume_education').delete().eq('optimized_resume_id', optimizedResumeId);
      if (editableResumeData.education.length > 0) {
        const { error: eduError } = await supabase
          .from('resume_education')
          .insert(editableResumeData.education.map((edu: any, index: number) => ({
            optimized_resume_id: optimizedResumeId,
            degree: edu.degree,
            school: edu.institution,
            year: edu.year,
            display_order: index
          })));
        if (eduError) throw eduError;
      }

      // Delete existing certifications and insert new ones
      await supabase.from('resume_certifications').delete().eq('optimized_resume_id', optimizedResumeId);
      if (editableResumeData.certifications.length > 0) {
        const { error: certError } = await supabase
          .from('resume_certifications')
          .insert(editableResumeData.certifications.map((cert: any, index: number) => ({
            optimized_resume_id: optimizedResumeId,
            name: cert.name,
            issuer: cert.issuer,
            year: cert.year,
            display_order: index
          })));
        if (certError) throw certError;
      }
      
      toast({
        title: "Resume Saved",
        description: "Your resume changes have been saved successfully."
      });
      
      setStep('templates');
    } catch (error) {
      console.error('Error saving resume changes:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save resume changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleColorSchemeSelect = (schemeId: string) => {
    setSelectedColorScheme(schemeId);
  };

  const handleExportPDF = async () => {
    if (!optimizedResumeId || !editableResumeData) {
      toast({
        title: "Export Error",
        description: "No resume data available for export.",
        variant: "destructive"
      });
      return;
    }
    
    setIsExporting(true);
    try {
      await generateProfessionalPDF(
        selectedTemplate,
        editableResumeData,
        `${jobPosting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_resume.pdf`,
        selectedColorScheme
      );
      
      toast({
        title: "Resume Exported!",
        description: "Your resume has been downloaded successfully."
      });
      
      setStep('cover-letter');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };


  const handleViewFullResume = () => {
    if (optimizedResumeId) {
      console.log('👀 Opening resume editor for:', optimizedResumeId);
      window.open(`/resume-editor/${optimizedResumeId}`, '_blank');
    }
  };

  const submitApplication = async () => {
    const resumeToUse = optimizedResumeId || uploadedResumeId;
    
    if (!resumeToUse) {
      console.log('❌ No resume available for application');
      toast({
        title: "Resume Required",
        description: "Please upload a resume to proceed with your application.",
        variant: "destructive"
      });
      return;
    }

    // Handle external jobs differently - only route to external for scraped jobs, not employer jobs
    if (jobPosting.source === 'database' && jobPosting.data_source !== 'employer') {
      handleExternalJobApplication();
      return;
    }

    setSubmitting(true);
    try {
      console.log('📤 Submitting internal job application...', {
        jobId: jobPosting.id,
        userId: user?.id,
        resumeId: resumeToUse,
        hasCoverLetter: !!coverLetter
      });

      // Create job description entry if it doesn't exist
      const { data: existingJobDesc } = await supabase
        .from('job_descriptions')
        .select('id')
        .eq('user_id', user!.id)
        .eq('title', jobPosting.title)
        .eq('source', 'application')
        .maybeSingle();

      let jobDescriptionId = existingJobDesc?.id;

      if (!jobDescriptionId) {
        const { data: newJobDesc, error: jobDescError } = await supabase
          .from('job_descriptions')
          .insert({
            user_id: user!.id,
            title: jobPosting.title,
            parsed_text: jobPosting.description,
            source: 'application',
            company: companyName
          })
          .select('id')
          .single();

        if (jobDescError) throw jobDescError;
        jobDescriptionId = newJobDesc.id;
      }

      // Submit application to internal job
      // For employer jobs, use the actual job posting ID, not the cached job ID
      const jobPostingId = jobPosting.data_source === 'employer' && jobPosting.employer_job_posting_id 
        ? jobPosting.employer_job_posting_id 
        : jobPosting.id;

      console.log('Submitting application with job_posting_id:', jobPostingId, 'for job source:', jobPosting.data_source);

      const { error: applicationError } = await supabase
        .from('job_applications')
        .insert({
          job_posting_id: jobPostingId,
          applicant_id: user!.id,
          resume_id: resumeToUse,
          cover_letter: coverLetter || null,
          status: 'pending'
        });

      if (applicationError) {
        console.error('❌ Error submitting application:', applicationError);
        throw applicationError;
      }

      console.log('✅ Internal job application submitted successfully');
      setStep('success');
      
      toast({
        title: "Application Submitted!",
        description: `Your application to ${jobPosting.title} at ${companyName} has been successfully submitted.`,
      });

      // Auto-close modal after 3 seconds
      setTimeout(() => {
        onApplicationSubmitted();
        resetModal();
      }, 3000);

    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Application Failed",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExternalJobApplication = () => {
    // Save resume and cover letter data are already saved
    // Just show external application step
    setStep('external-apply');
  };

  const handleExternalApply = () => {
    const externalUrl = jobPosting.apply_url || jobPosting.job_url;
    
    if (externalUrl) {
      // Open external application in new tab
      window.open(externalUrl, '_blank');
      
      // Redirect current tab to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      
      toast({
        title: "Application Opened",
        description: "External application opened in new tab. Your resume and cover letter are saved to your dashboard.",
      });
    } else {
      toast({
        title: "No Application URL",
        description: "This job posting doesn't have an application URL.",
        variant: "destructive"
      });
    }
  };

  const resetModal = () => {
    console.log('🔄 Resetting no resume modal state');
    setStep('upload');
    setUploadedResumeId('');
    setCoverLetter('');
    setOptimizedResumeId('');
    setOptimizedResumeContent('');
    setJobDescriptionId('');
    setOriginalIntent(null);
  };

  const getProgressPercentage = () => {
    // For existing resume workflow, use shorter progress
    if (originalIntent === 'existing') {
      const totalSteps = 4;
      let currentStep = 1;
      
      switch (step) {
        case 'upload': currentStep = 1; break;
        case 'choose-optimization': currentStep = 2; break;
        case 'cover-letter': currentStep = 3; break;
        case 'final-submit':
        case 'external-apply':
        case 'success': currentStep = 4; break;
        default: currentStep = 1;
      }
      
      return Math.round((currentStep / totalSteps) * 100);
    }
    
    // Full optimization workflow
    const totalSteps = 8;
    let currentStep = 1;
    
    switch (step) {
      case 'upload': currentStep = 1; break;
      case 'choose-optimization': currentStep = 2; break;
      case 'optimize': currentStep = 3; break;
      case 'edit-resume': currentStep = 4; break;
      case 'templates': currentStep = 5; break;
      case 'cover-letter': currentStep = 6; break;
      case 'final-submit':
      case 'external-apply': currentStep = 7; break;
      case 'success': currentStep = 8; break;
      default: currentStep = 1;
    }
    
    return Math.round((currentStep / totalSteps) * 100);
  };

  const getCurrentStepText = () => {
    if (originalIntent === 'existing') {
      switch (step) {
        case 'upload': return 'Step 1 of 4';
        case 'choose-optimization': return 'Step 2 of 4';
        case 'cover-letter': return 'Step 3 of 4';
        case 'final-submit':
        case 'external-apply':
        case 'success': return 'Step 4 of 4';
        default: return 'Step 1 of 4';
      }
    }
    
    switch (step) {
      case 'upload': return 'Step 1 of 8';
      case 'choose-optimization': return 'Step 2 of 8';
      case 'optimize': return 'Step 3 of 8';
      case 'edit-resume': return 'Step 4 of 8';
      case 'templates': return 'Step 5 of 8';
      case 'cover-letter': return 'Step 6 of 8';
      case 'final-submit':
      case 'external-apply': return 'Step 7 of 8';
      case 'success': return 'Step 8 of 8';
      default: return 'Step 1 of 8';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${step === 'templates' ? 'max-w-[95vw]' : 'max-w-4xl'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-xl">Apply to {jobPosting.title}</DialogTitle>
          <DialogDescription className="text-lg">
            at {companyName}
          </DialogDescription>
          
          {/* Progress Indicator */}
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{getCurrentStepText()}</span>
              <span>{getProgressPercentage()}% Complete</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Your Resume
              </h3>
              <p className="text-muted-foreground">
                To apply for this position, please upload your resume first.
              </p>
              
              <Card>
                <CardContent className="py-6">
                  <InlineFileUpload
                    onUploadSuccess={handleUploadSuccess}
                    onCancel={() => setStep('upload')}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'choose-optimization' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resume Uploaded Successfully!</h3>
              <p className="text-muted-foreground">
                Would you like to optimize your resume for this specific job before applying?
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className="cursor-pointer hover:bg-gray-50 transition-colors border-2 border-purple-200 hover:border-purple-300"
                  onClick={handleOptimizeClick}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700">
                      <Sparkles className="h-5 w-5" />
                      Optimize Resume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      AI-optimize your resume for this specific job (Recommended)
                    </p>
                    {creatingJobDescription && (
                      <p className="text-xs text-blue-600 mt-2">Preparing job description...</p>
                    )}
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-blue-200"
                  onClick={handleSkipOptimization}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Quick Apply
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Apply with your uploaded resume directly (Skip editing & templates)
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {step === 'optimize' && uploadedResumeId && jobDescriptionId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Optimizing Your Resume</h3>
                <Button variant="outline" onClick={() => setStep('choose-optimization')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
              
              <ResumeOptimizer
                resumes={uploadedResumeId ? [{ id: uploadedResumeId, file_name: 'Uploaded Resume', parsed_text: 'content' }] : []}
                jobDescriptions={jobDescriptionId ? [{ id: jobDescriptionId, title: jobPosting.title, parsed_text: jobPosting.description }] : []}
                onOptimizationComplete={handleOptimizationComplete}
                navigateToEditor={false}
              />
            </div>
          )}

          {step === 'edit-resume' && editableResumeData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Resume
                </h3>
                <Button variant="outline" onClick={() => setStep('choose-optimization')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              {/* Resume Editor Sections */}
              <div className="space-y-4">
                 <ContactSection
                   contactInfo={editableResumeData.contactInfo || { name: '', email: '', phone: '', location: '' }}
                   onChange={(contactInfo) => handleResumeDataChange({ ...editableResumeData, contactInfo })}
                 />

                 <ExperienceSection
                   experiences={editableResumeData.experience || []}
                   onChange={(experience) => handleResumeDataChange({ ...editableResumeData, experience })}
                   jobDescriptionId={jobDescriptionId}
                 />

                <SkillsSection
                  skills={editableResumeData.skills || []}
                  onChange={(skills) => handleResumeDataChange({ ...editableResumeData, skills })}
                  jobDescriptionId={jobDescriptionId}
                />
              </div>

              <Button 
                onClick={handleSaveResumeChanges} 
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save & Continue to Templates
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'templates' && editableResumeData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Choose Template & Export
                </h3>
                <Button variant="outline" onClick={() => setStep('edit-resume')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-8`}>
                {/* Template and Color Selection - Left Column */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Select Template</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TemplateSelector
                        selectedTemplate={selectedTemplate}
                        onTemplateSelect={handleTemplateSelect}
                        isMobile={isMobile}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Color Scheme</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ColorSchemeSelector
                        colorSchemes={newTemplateConfigs[selectedTemplate]?.colorSchemes || []}
                        selectedScheme={selectedColorScheme}
                        onSchemeSelect={handleColorSchemeSelect}
                      />
                    </CardContent>
                  </Card>

                  <Button 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="lg"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download Resume PDF
                      </>
                    )}
                  </Button>
                </div>

                {/* Resume Preview - Takes up 2 columns */}
                <div className="col-span-2 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      <div className="border rounded-lg overflow-hidden">
                        <ResumePreview
                          template={selectedTemplate}
                          resumeData={JSON.stringify(editableResumeData)}
                          optimizedResumeId={optimizedResumeId}
                          selectedColorScheme={selectedColorScheme}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {step === 'cover-letter' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {originalIntent === 'existing' ? 'Generate Cover Letter' : 'Generate Cover Letter'}
                </h3>
                <Button variant="outline" onClick={() => setStep(originalIntent === 'existing' ? 'choose-optimization' : 'templates')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to {originalIntent === 'existing' ? 'Resume Selection' : 'Templates'}
                </Button>
              </div>

              {originalIntent === 'existing' && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-blue-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Using Your Existing Resume</span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      Ready to generate a personalized cover letter for this position.
                    </p>
                  </CardContent>
                </Card>
              )}

              {originalIntent === 'optimize' && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Resume Downloaded Successfully!</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Your optimized resume is ready. Now let's create a cover letter.
                    </p>
                  </CardContent>
                </Card>
              )}

              <CoverLetterGenerator
                onComplete={(generatedText: string) => {
                  setCoverLetter(generatedText);
                  setStep('final-submit');
                }}
                onCancel={() => setStep(originalIntent === 'existing' ? 'choose-optimization' : 'templates')}
              />
            </div>
          )}


          {step === 'final-submit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Finalize Application</h3>
                <Button variant="outline" onClick={() => setStep('cover-letter')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              {coverLetter && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      AI-Generated Cover Letter Ready
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white rounded p-4 border border-green-200 max-h-48 overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap">{coverLetter}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-muted-foreground">
                  {optimizedResumeId ? (
                    <span className="text-green-600 font-medium">✓ Using AI-optimized resume</span>
                  ) : uploadedResumeId ? (
                    'Using uploaded resume'
                  ) : (
                    'No resume selected'
                  )}
                </div>
                <Button 
                  onClick={submitApplication}
                  disabled={submitting || (!uploadedResumeId && !optimizedResumeId)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {(jobPosting.source === 'database' && jobPosting.data_source !== 'employer') ? 'Continue to External Site' : 'Submit Application'}
                    </>
                  )}
                </Button>
              </div>
            </div>
           )}

          {/* External Application Step */}
          {step === 'external-apply' && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                  <ExternalLink className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">External Application</h3>
                  <p className="text-muted-foreground">
                    You'll be taken to the company's website to complete your application
                  </p>
                </div>
              </div>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">What happens next:</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Your resume and cover letter are saved to your RezLit dashboard
                      </li>
                      <li className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        A new tab will open with the job application page
                      </li>
                      <li className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4 text-gray-600" />
                        This tab will redirect to your dashboard
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Important</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      This will take you outside of RezLit to complete your application on the company's website.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('final-submit')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleExternalApply}
                  size="lg"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apply on Company Site
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-green-700">Application Submitted!</h3>
              <p className="text-muted-foreground">
                Your application to {jobPosting.title} at {companyName} has been successfully submitted.
              </p>
              <p className="text-sm text-muted-foreground">
                This modal will close automatically in a few seconds...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};