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
import { FileText, Sparkles, Send, CheckCircle, Eye, ArrowLeft } from 'lucide-react';

interface Resume {
  id: string;
  file_name: string | null;
  parsed_text: string | null;
}

interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string[];
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
  
  const [step, setStep] = useState<'choose' | 'existing' | 'optimize' | 'review' | 'submit' | 'success'>('choose');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [optimizedResumeId, setOptimizedResumeId] = useState<string>('');
  const [optimizedResumeContent, setOptimizedResumeContent] = useState<string>('');
  const [jobDescriptionId, setJobDescriptionId] = useState<string>('');
  const [creatingJobDescription, setCreatingJobDescription] = useState(false);

  const companyName = jobPosting.employer_profile?.company_name || 'Company Name Not Available';

  useEffect(() => {
    if (isOpen && user) {
      loadResumes();
    }
  }, [isOpen, user]);

  const loadResumes = async () => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('id, file_name, parsed_text')
        .eq('user_id', user!.id)
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
    }
  };

  const createJobDescription = async () => {
    if (!user) return null;
    
    setCreatingJobDescription(true);
    try {
      // Check if job description already exists for this job posting
      const { data: existingJobDesc } = await supabase
        .from('job_descriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', jobPosting.title)
        .eq('parsed_text', jobPosting.description)
        .eq('source', 'application')
        .single();

      if (existingJobDesc) {
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
        .select('id, generated_text')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setOptimizedResumeId(data.id);
        setOptimizedResumeContent(data.generated_text || '');
        setStep('review');
      }
    } catch (error) {
      console.error('Error getting optimized resume:', error);
      setStep('submit');
    }
  };

  const handleAcceptOptimizedResume = () => {
    setStep('submit');
  };

  const handleViewFullResume = () => {
    if (optimizedResumeId) {
      window.open(`/resume-editor/${optimizedResumeId}`, '_blank');
    }
  };

  const submitApplication = async () => {
    if (!selectedResumeId && !optimizedResumeId) {
      toast({
        title: "Resume Required",
        description: "Please select a resume to proceed with your application.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Create job description entry if it doesn't exist
      const { data: existingJobDesc } = await supabase
        .from('job_descriptions')
        .select('id')
        .eq('user_id', user!.id)
        .eq('title', jobPosting.title)
        .eq('source', 'application')
        .single();

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
          resume_id: selectedResumeId || null,
          cover_letter: coverLetter || null,
          status: 'pending'
        });

      if (applicationError) throw applicationError;

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
    setStep('choose');
    setSelectedResumeId('');
    setCoverLetter('');
    setOptimizedResumeId('');
    setOptimizedResumeContent('');
    setJobDescriptionId('');
  };

  const availableResumes = resumes.filter(resume => resume.parsed_text);
  const jobDescriptions = jobDescriptionId ? [{
    id: jobDescriptionId,
    title: jobPosting.title,
    parsed_text: jobPosting.description
  }] : [];

  const getProgressStep = () => {
    switch (step) {
      case 'choose': return 1;
      case 'existing': return 2;
      case 'optimize': return 2;
      case 'review': return 3;
      case 'submit': return 4;
      case 'success': return 5;
      default: return 1;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply to {jobPosting.title}</DialogTitle>
          <DialogDescription>
            at {companyName}
          </DialogDescription>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2 mt-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  num <= getProgressStep()
                    ? 'bg-blue-600 text-white'
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
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
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:bg-gray-50 transition-colors border-purple-200"
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
            </div>
          )}

          {step === 'existing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select Resume</h3>
                <Button variant="outline" onClick={() => setStep('choose')}>
                  Back
                </Button>
              </div>

              {availableResumes.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">No resumes found</p>
                    <Button onClick={handleOptimizeClick} disabled={creatingJobDescription}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {creatingJobDescription ? 'Preparing...' : 'Create Optimized Resume Instead'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a resume" />
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
                    <Button onClick={() => setStep('submit')}>
                      Continue to Application
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
                    <p className="text-gray-500">Preparing job description for optimization...</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Review Optimized Resume</h3>
                <Button variant="outline" onClick={() => setStep('choose')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    Resume Successfully Optimized!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Your resume has been optimized for this position. Here's a preview of the key changes:
                  </p>
                  
                  <div className="bg-white rounded-lg p-4 border max-h-60 overflow-y-auto">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {optimizedResumeContent.slice(0, 500)}
                      {optimizedResumeContent.length > 500 && '...'}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleViewFullResume} variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Resume
                    </Button>
                    <Button onClick={handleAcceptOptimizedResume} className="flex-1">
                      Continue with Optimized Resume
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'submit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Finalize Application</h3>
                <Button variant="outline" onClick={() => setStep('choose')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Cover Letter (Optional)</label>
                  <Textarea
                    placeholder="Tell the employer why you're interested in this position..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={6}
                    className="mt-2"
                  />
                </div>

                <Separator />

                <div className="flex justify-between items-center pt-4">
                  <div className="text-sm text-muted-foreground">
                    {optimizedResumeId ? (
                      <span className="text-green-600 font-medium">✓ Using optimized resume</span>
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
                  >
                    {submitting ? (
                      'Submitting...'
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
                        {optimizedResumeId ? 'Optimized Resume' : 'Selected Resume'}
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
