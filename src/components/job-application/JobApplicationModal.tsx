import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { generateNewProfessionalPDF } from '@/utils/newPdfGenerators/NewPdfGeneratorFactory';
import { fetchStructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';
import { newTemplateConfigs } from '@/components/resume-templates/configs/newTemplateConfigs';
import { useIsMobile } from '@/hooks/use-mobile';
import { InlineFileUpload } from './InlineFileUpload';
import { FileText, Sparkles, Send, CheckCircle, Eye, ArrowLeft, AlertCircle, Upload, Save, Download, Edit, Target, Palette, ExternalLink } from 'lucide-react';

interface Resume {
  id: string;
  file_name: string | null;
  parsed_text: string | null;
  type: 'original' | 'optimized';
  job_title?: string;
}

interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  source?: string;
  job_url?: string;
  apply_url?: string;
  employer_profile: {
    company_name: string;
  } | null;
}

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobPosting: JobPosting;
  onApplicationSubmitted: () => void;
}

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  isOpen,
  onClose,
  jobPosting,
  onApplicationSubmitted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Comprehensive workflow step management
  const [step, setStep] = useState<'choose' | 'upload' | 'ats-score' | 'optimize' | 'edit-resume' | 'templates' | 'cover-letter' | 'submit' | 'final-submit' | 'external-apply' | 'success'>('choose');
  const [originalIntent, setOriginalIntent] = useState<'optimize' | 'existing' | null>(null);
  
  // Resume management
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [optimizedResumeId, setOptimizedResumeId] = useState<string>('');
  const [optimizedResumeContent, setOptimizedResumeContent] = useState<string>('');
  const [loadingResumes, setLoadingResumes] = useState(false);
  
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
  const [selectedColorScheme, setSelectedColorScheme] = useState('professional');
  const [isExporting, setIsExporting] = useState(false);
  
  // Cover letter
  const [coverLetter, setCoverLetter] = useState('');
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  
  // Application submission
  const [submitting, setSubmitting] = useState(false);
  
  const isMobile = useIsMobile();
  const companyName = jobPosting.employer_profile?.company_name || 'Company Name Not Available';

  useEffect(() => {
    if (isOpen && user) {
      console.log('🔄 Modal opened, loading user resumes...');
      loadResumes();
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Debug logging for modal state
    console.log('🔍 Modal Debug - Current state:', {
      isOpen,
      step,
      userId: user?.id,
      resumesCount: resumes.length,
      selectedResumeId,
      optimizedResumeId,
      jobDescriptionId,
      submitting
    });
  }, [isOpen, step, user, resumes.length, selectedResumeId, optimizedResumeId, jobDescriptionId, submitting]);

  const loadResumes = async () => {
    if (!user) {
      console.log('❌ No user found, cannot load resumes');
      return;
    }

    try {
      setLoadingResumes(true);
      console.log('📋 Loading resumes for user:', user.id);
      
      // Fetch original resumes
      const { data: originalResumes, error: originalError } = await supabase
        .from('resumes')
        .select('id, file_name, parsed_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (originalError) {
        console.error('❌ Error loading original resumes:', originalError);
        throw originalError;
      }

      // Fetch optimized resumes with job description titles
      const { data: optimizedResumes, error: optimizedError } = await supabase
        .from('optimized_resumes')
        .select(`
          id, 
          generated_text,
          job_descriptions!inner(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (optimizedError) {
        console.error('❌ Error loading optimized resumes:', optimizedError);
        throw optimizedError;
      }

      // Combine and format all resumes
      const allResumes: Resume[] = [
        ...(originalResumes || []).map(resume => ({
          id: resume.id,
          file_name: resume.file_name,
          parsed_text: resume.parsed_text,
          type: 'original' as const
        })),
        ...(optimizedResumes || []).map(resume => ({
          id: resume.id,
          file_name: `${resume.job_descriptions?.title || 'Optimized Resume'}`,
          parsed_text: resume.generated_text,
          type: 'optimized' as const,
          job_title: resume.job_descriptions?.title
        }))
      ];
      
      console.log('✅ Loaded all resumes:', allResumes.length);
      setResumes(allResumes);
      
      // Check if user has no resumes - redirect to upload with optimize intent
      if (allResumes.length === 0) {
        console.log('⚠️ No resumes found on apply, redirecting to upload with optimize intent');
        setOriginalIntent('optimize');
        setStep('upload');
      }
    } catch (error) {
      console.error('Error loading resumes:', error);
      toast({
        title: "Error",
        description: "Failed to load your resumes",
        variant: "destructive"
      });
    } finally {
      setLoadingResumes(false);
    }
  };

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

  const handleOptimizeClick = async () => {
    console.log('🎯 Optimize button clicked');
    
    // Check if user has any resumes
    if (availableResumes.length === 0) {
      console.log('⚠️ No resumes available, redirecting to upload with optimize intent');
      setOriginalIntent('optimize');
      setStep('upload');
      return;
    }
    
    const jobDescId = await createJobDescription();
    if (jobDescId) {
      console.log('✅ Job description ready, moving to optimize step');
      setStep('optimize');
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
        console.log('⚠️ No optimized resume found, going to submit');
        setStep('submit');
      }
    } catch (error) {
      console.error('Error getting optimized resume:', error);
      setStep('submit');
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
      const templateConfig = newTemplateConfigs[selectedTemplate];
      const colorScheme = templateConfig.colorSchemes.find(
        scheme => scheme.id === selectedColorScheme
      );
      
      await generateNewProfessionalPDF(
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

  const handleCoverLetterGenerated = (generatedText: string) => {
    setCoverLetter(generatedText);
    setStep('final-submit');
  };

  const handleProceedWithExistingResume = async () => {
    if (!selectedResumeId) return;
    
    console.log('✅ User chose existing resume, going directly to cover letter...');
    
    // Set the selected resume as our working resume
    setOptimizedResumeId(selectedResumeId);
    
    // Mark this as an existing resume workflow to skip editing steps
    setOriginalIntent('existing');
    
    // Skip directly to cover letter generation
    setStep('cover-letter');
  };

  const handleViewFullResume = () => {
    if (optimizedResumeId) {
      console.log('👀 Opening resume editor for:', optimizedResumeId);
      window.open(`/resume-editor/${optimizedResumeId}`, '_blank');
    }
  };

  const submitApplication = async () => {
    if (!selectedResumeId && !optimizedResumeId) {
      console.log('❌ No resume selected for application');
      toast({
        title: "Resume Required",
        description: "Please select a resume to proceed with your application.",
        variant: "destructive"
      });
      return;
    }

    // Handle external jobs differently
    if (jobPosting.source === 'database') {
      handleExternalJobApplication();
      return;
    }

    setSubmitting(true);
    try {
      console.log('📤 Submitting internal job application...', {
        jobId: jobPosting.id,
        userId: user?.id,
        resumeId: selectedResumeId || optimizedResumeId,
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
      const { error: applicationError } = await supabase
        .from('job_applications')
        .insert({
          job_posting_id: jobPosting.id,
          applicant_id: user!.id,
          resume_id: selectedResumeId || optimizedResumeId,
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

  const handleUploadSuccess = async (resumeId: string) => {
    console.log('✅ Resume uploaded successfully:', resumeId);
    
    // Reload resumes to include the new one
    await loadResumes();
    
    // Set the newly uploaded resume as selected
    setSelectedResumeId(resumeId);
    
    // Determine next step based on original intent
    if (originalIntent === 'optimize') {
      // User wanted to optimize, so proceed with optimization
      const jobDescId = await createJobDescription();
      if (jobDescId) {
        setStep('optimize');
      }
    } else {
      // User just wanted to upload, so go to submit step
      setStep('submit');
    }
  };

  const handleUploadAndOptimize = async () => {
    setOriginalIntent('optimize');
    setStep('upload');
  };

  const handleUploadOnly = () => {
    setOriginalIntent('existing');
    setStep('upload');
  };

  const resetModal = () => {
    console.log('🔄 Resetting modal state');
    setStep('choose');
    setSelectedResumeId('');
    setCoverLetter('');
    setOptimizedResumeId('');
    setOptimizedResumeContent('');
    setJobDescriptionId('');
    setOriginalIntent(null);
  };

  const availableResumes = resumes.filter(resume => resume.parsed_text);
  const jobDescriptions = jobDescriptionId ? [{
    id: jobDescriptionId,
    title: jobPosting.title,
    parsed_text: jobPosting.description
  }] : [];

  const getProgressStep = () => {
    // Adjust progress based on workflow type
    if (originalIntent === 'existing') {
      // Quick apply workflow: choose -> ats-score -> cover-letter -> final-submit
      switch (step) {
        case 'choose': return 1;
        case 'ats-score': return 2;
        case 'cover-letter': return 3;
        case 'final-submit': 
        case 'external-apply': return 4;
        case 'success': return 5;
        default: return 1;
      }
    } else {
      // Full optimization workflow
      switch (step) {
        case 'choose': return 1;
        case 'upload': return 2;
        case 'ats-score': return 3;
        case 'optimize': return 4;
        case 'edit-resume': return 5;
        case 'templates': return 6;
        case 'cover-letter': return 7;
        case 'submit': return 8;
        case 'final-submit': 
        case 'external-apply': return 8;
        case 'success': return 9;
        default: return 1;
      }
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
          <div className="flex items-center space-x-1 mt-4 overflow-x-auto">
            {Array.from({ length: originalIntent === 'existing' ? 5 : 9 }, (_, i) => i + 1).map((num) => (
              <div
                key={num}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  num <= getProgressStep()
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {num}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'choose' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">How would you like to apply?</h3>
              
              {loadingResumes ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your resumes...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className="cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-blue-200"
                    onClick={() => setStep('ats-score')}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Use Existing Resume
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Apply with one of your uploaded resumes
                      </p>
                      {availableResumes.length > 0 && (
                        <p className="text-xs text-green-600 mt-2">
                          {availableResumes.length} resume(s) available
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:bg-gray-50 transition-colors border-2 border-purple-200 hover:border-purple-300"
                    onClick={handleOptimizeClick}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-purple-700">
                        <Sparkles className="h-5 w-5" />
                        Create Optimized Resume
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        AI-optimize your resume for this specific job
                      </p>
                      {creatingJobDescription && (
                        <p className="text-xs text-blue-600 mt-2">Preparing job description...</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {step === 'ats-score' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select Resume</h3>
                <Button variant="outline" onClick={() => setStep('choose')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              {availableResumes.length === 0 ? (
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="py-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-orange-500 mb-4" />
                    <h4 className="font-semibold text-orange-900 mb-2">No Resumes Found</h4>
                    <p className="text-orange-700 mb-4">
                      You need to upload a resume before you can apply for jobs.
                    </p>
                    <div className="space-y-2">
                      <Button 
                        onClick={handleUploadOnly}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Resume Here
                      </Button>
                      <p className="text-sm text-orange-600">or</p>
                      <Button 
                        onClick={handleUploadAndOptimize} 
                        disabled={creatingJobDescription}
                        variant="outline"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {creatingJobDescription ? 'Preparing...' : 'Upload & Optimize Resume'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a resume" />
                    </SelectTrigger>
                    <SelectContent>
                       {availableResumes.map(resume => (
                         <SelectItem key={resume.id} value={resume.id}>
                           {resume.type === 'optimized' 
                             ? `${resume.file_name} (Optimized)`
                             : `${resume.file_name || 'Untitled Resume'} (Original)`
                           }
                         </SelectItem>
                       ))}
                    </SelectContent>
                  </Select>

                   {selectedResumeId && (
                      <Button 
                        onClick={handleProceedWithExistingResume}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                      >
                        Quick Apply with This Resume
                      </Button>
                   )}
                </>
              )}
            </div>
          )}

          {step === 'upload' && (
            <InlineFileUpload
              onUploadSuccess={handleUploadSuccess}
              onCancel={() => setStep('choose')}
            />
          )}

          {step === 'optimize' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">AI Resume Optimization</h3>
                <Button variant="outline" onClick={() => setStep('choose')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              {jobDescriptions.length > 0 ? (
                <ResumeOptimizer
                  resumes={resumes}
                  jobDescriptions={jobDescriptions}
                  onOptimizationComplete={handleOptimizationComplete}
                  navigateToEditor={false}
                />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Preparing job description for optimization...</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}


          {step === 'edit-resume' && editableResumeData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Resume
                </h3>
                <Button variant="outline" onClick={() => setStep('choose')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              {/* ATS Score Display */}
              {atsScore && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Target className="h-5 w-5" />
                      Current ATS Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ATSScoreDisplay
                      optimizedResumeId={optimizedResumeId}
                      atsScore={atsScore}
                      atsFeedback={atsFeedback}
                      onScoreUpdate={handleATSScoreUpdate}
                    />
                  </CardContent>
                </Card>
              )}

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

                <EducationSection
                  education={editableResumeData.education || []}
                  onChange={(education) => handleResumeDataChange({ ...editableResumeData, education })}
                />

                <CertificationsSection
                  certifications={editableResumeData.certifications || []}
                  onChange={(certifications) => handleResumeDataChange({ ...editableResumeData, certifications })}
                />
              </div>

              {/* Save and Continue */}
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSaveResumeChanges} 
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600"
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
                  Back to Editor
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
                  Generate Cover Letter
                </h3>
                <Button variant="outline" onClick={() => setStep('templates')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Templates
                </Button>
              </div>

              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    Resume Downloaded Successfully!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-700">
                    Your optimized resume has been downloaded. Now let's create a personalized cover letter for this position.
                  </p>
                </CardContent>
              </Card>

              <CoverLetterGenerator
                onComplete={handleCoverLetterGenerated}
                onCancel={() => setStep('templates')}
              />

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('submit')}
                  className="flex-1"
                >
                  Skip Cover Letter
                </Button>
              </div>
            </div>
          )}

          {step === 'submit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Write Cover Letter (Optional)</h3>
                <Button variant="outline" onClick={() => setStep('cover-letter')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Cover Letter (Optional)</label>
                  <Textarea
                    placeholder="Tell the employer why you're interested in this position and what makes you a great fit..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={6}
                    className="w-full"
                  />
                </div>

                <Separator />

                <div className="flex justify-between items-center pt-4">
                  <div className="text-sm text-muted-foreground">
                    {optimizedResumeId ? (
                      <span className="text-green-600 font-medium">✓ Using AI-optimized resume</span>
                    ) : selectedResumeId ? (
                      'Using selected resume'
                    ) : (
                      'No resume selected'
                    )}
                  </div>
                  <Button 
                    onClick={submitApplication}
                    disabled={submitting || (!selectedResumeId && !optimizedResumeId)}
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
                        Submit Application
                      </>
                    )}
                  </Button>
                </div>
              </div>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setStep('submit')}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Cover Letter
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Separator />

              <div className="flex justify-between items-center pt-4">
                <div className="text-sm text-muted-foreground">
                  {optimizedResumeId ? (
                    <span className="text-green-600 font-medium">✓ Using AI-optimized resume</span>
                  ) : selectedResumeId ? (
                    'Using selected resume'
                  ) : (
                    'No resume selected'
                  )}
                </div>
                  <Button 
                    onClick={submitApplication}
                    disabled={submitting || (!selectedResumeId && !optimizedResumeId)}
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
                        {jobPosting.source === 'database' ? 'Continue to External Site' : 'Submit Application'}
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
            <div className="space-y-4 text-center py-8">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              
              <h3 className="text-2xl font-bold text-green-700">Application Submitted!</h3>
              
              <div className="space-y-2 text-gray-600">
                <p>Your application to <strong>{jobPosting.title}</strong></p>
                <p>at <strong>{companyName}</strong> has been successfully submitted.</p>
              </div>

              <Card className="bg-gray-50 mt-6">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Resume:</span>
                      <span className="font-medium">
                        {optimizedResumeId ? 'AI-Optimized Resume' : 'Selected Resume'}
                      </span>
                    </div>
                    {coverLetter && (
                      <div className="flex justify-between">
                        <span>Cover Letter:</span>
                        <span className="font-medium">{coverLetter.length} characters</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Submitted:</span>
                      <span className="font-medium">Just now</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-gray-500 mt-4">
                This window will close automatically in a few seconds...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
