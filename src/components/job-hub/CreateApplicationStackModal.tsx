import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Loader2, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Crown,
  Zap,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFeatureUsage } from '@/hooks/useFeatureUsage';
import { ATSPreviewModal } from '@/components/ATSPreviewModal';
import { PaymentModal } from '@/components/subscription/PaymentModal';
import { ResumeTemplateModal } from './ResumeTemplateModal';
import type { UserAddition } from '@/components/UserAdditionsForm';

interface Resume {
  id: string;
  file_name: string | null;
  parsed_text: string | null;
}

interface CreateApplicationStackModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    company: string | null;
    parsed_text: string;
  };
  onComplete: () => void;
}

type Step = 'resume-selection' | 'optimization' | 'cover-letter' | 'complete' | 'preview';

export const CreateApplicationStackModal: React.FC<CreateApplicationStackModalProps> = ({
  isOpen,
  onClose,
  job,
  onComplete
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { usage, checkFeatureAccess, incrementUsage, isPremium } = useFeatureUsage();
  const navigate = useNavigate();

  // State management
  const [currentStep, setCurrentStep] = useState<Step>('resume-selection');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Resume optimization state
  const [showATSModal, setShowATSModal] = useState(false);
  const [originalATSScore, setOriginalATSScore] = useState<number | undefined>();
  const [originalATSFeedback, setOriginalATSFeedback] = useState<any>();
  const [parsedResumeData, setParsedResumeData] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isLoadingATS, setIsLoadingATS] = useState(false);
  const [optimizedResumeId, setOptimizedResumeId] = useState<string>('');

  // Cover letter state
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState<string>('');
  const [coverLetterTitle, setCoverLetterTitle] = useState<string>('');

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Preview modal
  const [showResumePreview, setShowResumePreview] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadResumes();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal closes
      setCurrentStep('resume-selection');
      setSelectedResumeId('');
              setError('');
              setOptimizedResumeId('');
              setCoverLetterText('');
              setCoverLetterTitle('');
              setShowATSModal(false);
              setShowResumePreview(false);
    }
  }, [isOpen]);

  const loadResumes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: resumesData, error } = await supabase
        .from('resumes')
        .select('id, file_name, parsed_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const availableResumes = (resumesData || []).filter(resume => resume.parsed_text);
      setResumes(availableResumes);

      if (availableResumes.length === 0) {
        setError('No resumes found. Please upload a resume first.');
      }
    } catch (error) {
      console.error('Error loading resumes:', error);
      setError('Failed to load resumes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSelection = async () => {
    if (!selectedResumeId) {
      setError('Please select a resume to continue.');
      return;
    }

    // Check usage limits for free users
    if (!isPremium) {
      const canUse = await checkFeatureAccess('resume_optimizations');
      if (!canUse) {
        const currentUsage = usage.resume_optimizations?.current_usage || 0;
        const limit = usage.resume_optimizations?.limit || 3;
        
        toast({
          title: "Monthly Limit Reached",
          description: `You've used ${currentUsage}/${limit} resume optimizations this month.`,
          variant: "destructive"
        });
        setShowPaymentModal(true);
        return;
      }
    }

    setError('');
    setCurrentStep('optimization');
    
    // Automatically start ATS analysis
    await handleATSAnalysis();
  };

  const handleATSAnalysis = async () => {
    try {
      setIsLoadingATS(true);
      setShowATSModal(true);

      const { data, error } = await supabase.functions.invoke('calculate-original-ats-score', {
        body: {
          resumeId: selectedResumeId,
          jobDescriptionId: job.id
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setOriginalATSScore(data.ats_score);
      setOriginalATSFeedback(data.ats_feedback);
      
      if (data.parsed_resume_data) {
        setParsedResumeData(data.parsed_resume_data);
      }
    } catch (error) {
      console.error('ATS scoring error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze resume. Please try again.",
        variant: "destructive"
      });
      setShowATSModal(false);
      setCurrentStep('resume-selection');
    } finally {
      setIsLoadingATS(false);
    }
  };

  const handleOptimizeResume = async (userAdditions?: UserAddition[]) => {
    try {
      setIsOptimizing(true);

      // Store user additions if provided
      if (userAdditions && userAdditions.length > 0) {
        const additionsToStore = userAdditions.map(addition => ({
          user_id: user?.id,
          addition_type: addition.addition_type,
          content: addition.content,
          target_experience_title: addition.target_experience_title,
          target_experience_company: addition.target_experience_company
        }));

        const { error: additionsError } = await supabase
          .from('user_resume_additions')
          .insert(additionsToStore);

        if (additionsError) {
          console.warn('Failed to store user additions:', additionsError);
        }
      }

      const { data, error } = await supabase.functions.invoke('optimize-resume', {
        body: {
          resumeId: selectedResumeId,
          jobDescriptionId: job.id,
          userAdditions: userAdditions || []
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Increment usage for free users
      if (!isPremium) {
        await incrementUsage('resume_optimizations');
      }

      setOptimizedResumeId(data.optimizedResume?.id);
      setShowATSModal(false);
      setCurrentStep('cover-letter');

      // Automatically start cover letter generation
      await handleGenerateCoverLetter();

    } catch (error) {
      console.error('Optimization error:', error);
      toast({
        title: "Optimization Failed",
        description: error instanceof Error ? error.message : "Failed to optimize resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    // Check usage limits for cover letters
    const canUse = await checkFeatureAccess('cover_letters');
    if (!canUse) {
      setShowPaymentModal(true);
      return;
    }

    try {
      setIsGeneratingCoverLetter(true);
      setError('');

      const selectedResume = resumes.find(r => r.id === selectedResumeId);
      if (!selectedResume?.parsed_text) {
        throw new Error('Selected resume content not found');
      }

      const requestPayload = {
        resumeText: selectedResume.parsed_text.trim(),
        jobDescription: job.parsed_text.trim(),
        jobTitle: job.title.trim(),
        companyName: job.company?.trim() || ''
      };

      const { data, error } = await supabase.functions.invoke('generate-cover-letter', {
        body: requestPayload
      });

      if (error) throw error;
      if (!data?.generatedText) throw new Error('No cover letter content received');

      setCoverLetterText(data.generatedText.trim());
      setCoverLetterTitle(data.title || `Cover Letter for ${job.title} at ${job.company}`);

      // Save the cover letter
      await saveCoverLetter(data.generatedText.trim(), data.title || `Cover Letter for ${job.title} at ${job.company}`);

      setCurrentStep('complete');

    } catch (error) {
      console.error('Error generating cover letter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Cover Letter Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const saveCoverLetter = async (text: string, title: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('cover_letters')
      .insert({
        user_id: user.id,
        title: title,
        generated_text: text,
        job_description_id: job.id,
        original_resume_id: selectedResumeId,
        optimized_resume_id: optimizedResumeId
      });

    if (error) {
      console.error('Error saving cover letter:', error);
      // Don't throw here, just log the error
    }
  };

  const handleComplete = () => {
    toast({
      title: "Application Stack Created!",
      description: "Your optimized resume and cover letter are ready."
    });
    onComplete();
    onClose();
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 'resume-selection': return 20;
      case 'optimization': return 40;
      case 'cover-letter': return 60;
      case 'complete': return 80;
      case 'preview': return 100;
      default: return 0;
    }
  };

  const selectedResume = resumes.find(r => r.id === selectedResumeId);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Create Application Stack
            </DialogTitle>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                For: {job.title} {job.company && `at ${job.company}`}
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{getStepProgress()}%</span>
                </div>
                <Progress value={getStepProgress()} className="h-2" />
              </div>
            </div>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Resume Selection */}
          {currentStep === 'resume-selection' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Step 1: Select Your Resume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : resumes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No resumes found. Please upload a resume first.</p>
                      <Button onClick={() => navigate('/upload-resume')}>
                        Upload Resume
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a resume to optimize" />
                        </SelectTrigger>
                        <SelectContent>
                          {resumes.map(resume => (
                            <SelectItem key={resume.id} value={resume.id}>
                              {resume.file_name || 'Untitled Resume'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedResume && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">
                            <strong>Selected:</strong> {selectedResume.file_name || 'Untitled Resume'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleResumeSelection}
                  disabled={!selectedResumeId || loading}
                >
                  Continue to Optimization
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Cover Letter Generation (Loading) */}
          {currentStep === 'cover-letter' && (
            <div className="space-y-6">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-2">Generating Cover Letter</h3>
                  <p className="text-muted-foreground text-center">
                    Creating a personalized cover letter using your optimized resume...
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 'complete' && (
            <div className="space-y-6">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Application Stack Created Successfully!
                  </h3>
                  <p className="text-green-700 text-center mb-6">
                    Your optimized resume and personalized cover letter are ready for{' '}
                    <strong>{job.title}</strong>
                    {job.company && (
                      <>
                        {' '}at <strong>{job.company}</strong>
                      </>
                    )}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Optimized Resume</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ATS-optimized for this position
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Cover Letter</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Personalized for this role
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={handleComplete}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete & Return to Job Hub
                </Button>
              </div>
            </div>
          )}

          {/* Usage limit info for free users */}
          {!isPremium && usage.resume_optimizations && currentStep === 'resume-selection' && (
            <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span>
                  {usage.resume_optimizations.current_usage}/{usage.resume_optimizations.limit} optimizations used this month
                </span>
              </div>
              {usage.resume_optimizations.limit_reached && (
                <Button 
                  size="sm" 
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Upgrade
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Step 4: Preview */}
      {currentStep === 'preview' && optimizedResumeId && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Step 4: Preview Your Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Review your optimized resume with different templates and color schemes.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowResumePreview(true)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Open Full Preview
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('complete')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleComplete}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Setup
            </Button>
          </div>
        </div>
      )}

      <ATSPreviewModal 
        isOpen={showATSModal} 
        onClose={() => setShowATSModal(false)} 
        onOptimize={handleOptimizeResume} 
        resumeName={selectedResume?.file_name || 'Untitled Resume'} 
        jobTitle={job.title} 
        atsScore={originalATSScore} 
        atsFeedback={originalATSFeedback} 
        isLoading={isLoadingATS} 
        isOptimizing={isOptimizing}
        resumeData={parsedResumeData}
      />

      {/* Resume Preview Modal */}
      {optimizedResumeId && (
        <ResumeTemplateModal
          isOpen={showResumePreview}
          onClose={() => setShowResumePreview(false)}
          optimizedResumeId={optimizedResumeId}
          onEdit={() => {
            setShowResumePreview(false);
            onClose();
            window.location.href = `/resume-editor/${optimizedResumeId}`;
          }}
        />
      )}
      
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        returnUrl={window.location.href}
      />
    </>
  );
};