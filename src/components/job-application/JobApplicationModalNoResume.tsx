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
import { InlineFileUpload } from './InlineFileUpload';
import { FileText, Sparkles, Send, CheckCircle, Eye, ArrowLeft, Upload } from 'lucide-react';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string[];
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
  
  const [step, setStep] = useState<'upload' | 'choose-optimization' | 'optimize' | 'review' | 'submit' | 'success'>('upload');
  const [uploadedResumeId, setUploadedResumeId] = useState<string>('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [optimizedResumeId, setOptimizedResumeId] = useState<string>('');
  const [optimizedResumeContent, setOptimizedResumeContent] = useState<string>('');
  const [jobDescriptionId, setJobDescriptionId] = useState<string>('');
  const [creatingJobDescription, setCreatingJobDescription] = useState(false);

  const companyName = jobPosting.employer_profile?.company_name || 'Company Name Not Available';

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
    const jobDescId = await createJobDescription();
    if (jobDescId) {
      console.log('✅ Job description ready, moving to optimize step');
      setStep('optimize');
    }
  };

  const handleSkipOptimization = () => {
    console.log('⏭️ User chose to skip optimization');
    setStep('submit');
  };

  const handleOptimizationComplete = async () => {
    console.log('✅ Optimization complete');
    
    // Get the most recent optimized resume
    try {
      const { data } = await supabase
        .from('optimized_resumes')
        .select('id, generated_text')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        console.log('✅ Found optimized resume:', data.id);
        setOptimizedResumeId(data.id);
        setOptimizedResumeContent(data.generated_text || '');
        setStep('review');
      } else {
        console.log('⚠️ No optimized resume found, going to submit');
        setStep('submit');
      }
    } catch (error) {
      console.error('Error getting optimized resume:', error);
      setStep('submit');
    }
  };

  const handleAcceptOptimizedResume = () => {
    console.log('✅ User accepted optimized resume');
    setStep('submit');
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

    setSubmitting(true);
    try {
      console.log('📤 Submitting application...', {
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

      // Submit application
      const { error: applicationError } = await supabase
        .from('job_applications')
        .insert({
          job_posting_id: jobPosting.id,
          applicant_id: user!.id,
          resume_id: resumeToUse,
          cover_letter: coverLetter || null,
          status: 'pending'
        });

      if (applicationError) {
        console.error('❌ Error submitting application:', applicationError);
        throw applicationError;
      }

      console.log('✅ Application submitted successfully');
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

  const resetModal = () => {
    console.log('🔄 Resetting no resume modal state');
    setStep('upload');
    setUploadedResumeId('');
    setCoverLetter('');
    setOptimizedResumeId('');
    setOptimizedResumeContent('');
    setJobDescriptionId('');
  };

  const getProgressStep = () => {
    switch (step) {
      case 'upload': return 1;
      case 'choose-optimization': return 2;
      case 'optimize': return 3;
      case 'review': return 4;
      case 'submit': return 5;
      case 'success': return 6;
      default: return 1;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Apply to {jobPosting.title}</DialogTitle>
          <DialogDescription className="text-lg">
            at {companyName}
          </DialogDescription>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2 mt-4">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div
                key={num}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
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
                      Use As-Is
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Apply with your uploaded resume without optimization
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

          {step === 'review' && optimizedResumeContent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Review Optimized Resume</h3>
                <Button variant="outline" onClick={() => setStep('choose-optimization')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              <Card>
                <CardContent className="max-h-96 overflow-y-auto p-6">
                  <div className="whitespace-pre-wrap text-sm">
                    {optimizedResumeContent.slice(0, 500)}...
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button onClick={handleAcceptOptimizedResume} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Use This Resume
                </Button>
                <Button variant="outline" onClick={handleViewFullResume}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Resume
                </Button>
              </div>
            </div>
          )}

          {step === 'submit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Write Cover Letter (Optional)</h3>
                <Button variant="outline" onClick={() => setStep(optimizedResumeId ? 'review' : 'choose-optimization')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              <Textarea
                placeholder={`Dear ${companyName} Hiring Team,\n\nI am excited to apply for the ${jobPosting.title} position...`}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={8}
                className="resize-none"
              />

              <Button 
                onClick={submitApplication} 
                disabled={submitting}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                size="lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
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