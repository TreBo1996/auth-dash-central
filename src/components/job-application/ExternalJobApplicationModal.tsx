import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ResumeOptimizer } from '@/components/ResumeOptimizer';
import { FileText, Sparkles, ExternalLink, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { UnifiedJob } from '@/types/job';

interface Resume {
  id: string;
  file_name: string | null;
  parsed_text: string | null;
}

interface ExternalJobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: UnifiedJob;
}

export const ExternalJobApplicationModal: React.FC<ExternalJobApplicationModalProps> = ({
  isOpen,
  onClose,
  job
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'choose' | 'existing' | 'optimize' | 'review' | 'redirect'>('choose');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [optimizedResumeId, setOptimizedResumeId] = useState<string>('');
  const [optimizedResumeName, setOptimizedResumeName] = useState<string>('');
  const [jobDescriptionId, setJobDescriptionId] = useState<string>('');
  const [creatingJobDescription, setCreatingJobDescription] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadResumes();
      resetModal();
    }
  }, [isOpen, user]);

  const loadResumes = async () => {
    if (!user) return;

    try {
      setLoadingResumes(true);
      const { data, error } = await supabase
        .from('resumes')
        .select('id, file_name, parsed_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResumes(data || []);
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
    if (!user) return null;
    
    setCreatingJobDescription(true);
    try {
      // Check if job description already exists for this external job
      const { data: existingJobDesc } = await supabase
        .from('job_descriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', job.title)
        .eq('company', job.company)
        .eq('source', 'external')
        .maybeSingle();

      if (existingJobDesc) {
        setJobDescriptionId(existingJobDesc.id);
        return existingJobDesc.id;
      }

      // Create new job description for external job
      const { data: newJobDesc, error } = await supabase
        .from('job_descriptions')
        .insert({
          user_id: user.id,
          title: job.title,
          parsed_text: job.description,
          source: 'external',
          company: job.company,
          location: job.location,
          job_url: job.job_url
        })
        .select('id')
        .single();

      if (error) throw error;
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
    const jobDescId = await createJobDescription();
    if (jobDescId) {
      setStep('optimize');
    }
  };

  const handleOptimizationComplete = async () => {
    // Reload resumes to get the newly created optimized resume
    await loadResumes();
    
    // Get the most recent optimized resume
    try {
      const { data } = await supabase
        .from('optimized_resumes')
        .select('id')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setOptimizedResumeId(data.id);
        // Generate a descriptive name for the optimized resume
        const resumeName = `${job.title} at ${job.company} - Optimized Resume`;
        setOptimizedResumeName(resumeName);
        setStep('review');
      } else {
        setStep('redirect');
      }
    } catch (error) {
      console.error('Error getting optimized resume:', error);
      setStep('redirect');
    }
  };

  const handleProceedToApplication = () => {
    setStep('redirect');
  };

  const handleRedirectToJob = () => {
    setRedirecting(true);
    
    toast({
      title: "Resume Saved!",
      description: "Your optimized resume has been saved to your dashboard.",
    });

    // Short delay to show the toast, then redirect
    setTimeout(() => {
      window.open(job.job_url, '_blank');
      onClose();
      resetModal();
    }, 2000);
  };

  const resetModal = () => {
    setStep('choose');
    setSelectedResumeId('');
    setOptimizedResumeId('');
    setOptimizedResumeName('');
    setJobDescriptionId('');
    setRedirecting(false);
  };

  const availableResumes = resumes.filter(resume => resume.parsed_text);
  const jobDescriptions = jobDescriptionId ? [{
    id: jobDescriptionId,
    title: job.title,
    parsed_text: job.description
  }] : [];

  const getProgressStep = () => {
    switch (step) {
      case 'choose': return 1;
      case 'existing': return 2;
      case 'optimize': return 2;
      case 'review': return 3;
      case 'redirect': return 4;
      default: return 1;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Optimize Resume for {job.title}</DialogTitle>
          <DialogDescription className="text-lg">
            at {job.company}
          </DialogDescription>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2 mt-4">
            {[1, 2, 3, 4].map((num) => (
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
                    onClick={() => setStep('existing')}
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

          {step === 'existing' && (
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
                      You need to upload a resume before you can optimize it for jobs.
                    </p>
                    <Button 
                      onClick={() => window.open('/upload-resume', '_blank')}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Upload Resume
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a resume to optimize" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableResumes.map(resume => (
                        <SelectItem key={resume.id} value={resume.id}>
                          {resume.file_name || 'Untitled Resume'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedResumeId && (
                    <Button 
                      onClick={handleOptimizeClick}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={creatingJobDescription}
                    >
                      {creatingJobDescription ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Preparing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Optimize Selected Resume
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
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

          {step === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Resume Optimization Complete</h3>
                <Button variant="outline" onClick={() => setStep('choose')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    Resume Successfully Optimized & Saved!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-semibold text-gray-800 mb-2">Optimized Resume Created:</h4>
                    <p className="text-sm text-gray-700 font-medium">"{optimizedResumeName}"</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Your resume has been optimized for this position and saved to your dashboard.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => window.open(`/resume-editor/${optimizedResumeId}`, '_blank')} 
                      variant="outline" 
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Full Resume
                    </Button>
                    <Button onClick={handleProceedToApplication} className="flex-1">
                      Continue to Application
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'redirect' && (
            <div className="space-y-4 text-center py-8">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              
              <h3 className="text-2xl font-bold text-green-700">Resume Optimized & Saved!</h3>
              
              <div className="space-y-2 text-gray-600">
                <p>Your optimized resume has been saved to your dashboard.</p>
                <p>You can now proceed to apply for <strong>{job.title}</strong> at <strong>{job.company}</strong>.</p>
              </div>

              <Card className="bg-blue-50 mt-6">
                <CardContent className="pt-6">
                  <p className="text-sm text-blue-700 mb-4">
                    You will be redirected to the external job posting to complete your application.
                  </p>
                  <Button 
                    onClick={handleRedirectToJob}
                    disabled={redirecting}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                  >
                    {redirecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apply Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
