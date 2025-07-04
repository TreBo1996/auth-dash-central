
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FileText, Building, Sparkles, Save, CheckCircle, Eye, AlertCircle, Crown } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useFeatureUsage } from '@/hooks/useFeatureUsage';
import { PaymentModal } from '@/components/subscription/PaymentModal';

interface Resume {
  id: string;
  file_name: string;
  parsed_text: string;
  type: 'original' | 'optimized';
  job_title?: string;
  company_name?: string;
}

interface JobDescription {
  id: string;
  title: string;
  company: string;
  parsed_text: string;
}

interface CoverLetterGeneratorProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  onComplete,
  onCancel
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkFeatureAccess, isPremium } = useFeatureUsage();
  const [step, setStep] = useState<'select' | 'preview' | 'generating' | 'complete' | 'review'>('select');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [coverLetterTitle, setCoverLetterTitle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      console.log('Loading user data for cover letter generation');
      
      // Load original resumes
      const { data: originalResumes, error: resumesError } = await supabase
        .from('resumes')
        .select('id, file_name, parsed_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (resumesError) throw resumesError;

      // Load optimized resumes
      const { data: optimizedResumes, error: optimizedError } = await supabase
        .from('optimized_resumes')
        .select(`
          id, 
          generated_text,
          job_descriptions!inner(title, company)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (optimizedError) throw optimizedError;

      // Combine resumes with type indication
      const combinedResumes: Resume[] = [
        ...(originalResumes || []).map(resume => ({
          ...resume,
          type: 'original' as const
        })),
        ...(optimizedResumes || []).map(resume => ({
          id: resume.id,
          file_name: `Optimized for ${resume.job_descriptions.title} at ${resume.job_descriptions.company}`,
          parsed_text: resume.generated_text,
          type: 'optimized' as const,
          job_title: resume.job_descriptions.title,
          company_name: resume.job_descriptions.company
        }))
      ];

      // Load job descriptions
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_descriptions')
        .select('id, title, company, parsed_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      console.log('Available resumes:', combinedResumes.length);
      console.log('Available job descriptions:', jobsData?.length || 0);

      setResumes(combinedResumes);
      setJobDescriptions(jobsData || []);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your resumes and job descriptions.",
        variant: "destructive"
      });
    }
  };

  const selectedResume = resumes.find(r => r.id === selectedResumeId);
  const selectedJob = jobDescriptions.find(j => j.id === selectedJobId);

  const validateSelection = () => {
    setError('');
    console.log('Validating selection...', {
      selectedResumeId,
      selectedJobId,
      selectedResume: selectedResume ? {
        id: selectedResume.id,
        file_name: selectedResume.file_name,
        type: selectedResume.type,
        parsed_text_length: selectedResume.parsed_text?.length || 0,
        parsed_text_preview: selectedResume.parsed_text?.substring(0, 100) || 'empty'
      } : null,
      selectedJob: selectedJob ? {
        id: selectedJob.id,
        title: selectedJob.title,
        company: selectedJob.company,
        parsed_text_length: selectedJob.parsed_text?.length || 0,
        parsed_text_preview: selectedJob.parsed_text?.substring(0, 100) || 'empty'
      } : null
    });
    
    if (!selectedResume || !selectedJob) {
      const missingItems = [];
      if (!selectedResume) missingItems.push('resume');
      if (!selectedJob) missingItems.push('job description');
      setError(`Please select a ${missingItems.join(' and ')}.`);
      return false;
    }

    // Enhanced validation with specific checks
    if (!selectedResume.parsed_text || typeof selectedResume.parsed_text !== 'string') {
      setError('The selected resume has invalid content. Please choose a different resume or re-upload it.');
      return false;
    }

    if (selectedResume.parsed_text.trim().length === 0) {
      setError('The selected resume has no content. Please choose a different resume or re-upload it.');
      return false;
    }

    if (selectedResume.parsed_text.trim().length < 50) {
      setError('The selected resume content is too short. Please choose a different resume or re-upload it.');
      return false;
    }

    if (!selectedJob.parsed_text || typeof selectedJob.parsed_text !== 'string') {
      setError('The selected job description has invalid content. Please choose a different job description or re-upload it.');
      return false;
    }

    if (selectedJob.parsed_text.trim().length === 0) {
      setError('The selected job description has no content. Please choose a different job description or re-upload it.');
      return false;
    }

    if (selectedJob.parsed_text.trim().length < 50) {
      setError('The selected job description content is too short. Please choose a different job description or re-upload it.');
      return false;
    }

    if (!selectedJob.title || typeof selectedJob.title !== 'string' || selectedJob.title.trim().length === 0) {
      setError('The selected job description is missing a title. Please choose a different job description.');
      return false;
    }

    console.log('Validation passed successfully');
    return true;
  };

  const handlePreview = () => {
    if (validateSelection()) {
      setStep('preview');
    }
  };

  const handleGenerate = async () => {
    if (!validateSelection()) return;

    // Check usage limits before proceeding
    const canUse = await checkFeatureAccess('cover_letters');
    if (!canUse) {
      setShowPaymentModal(true);
      return;
    }

    setStep('generating');
    setLoading(true);
    setError('');
    
    try {
      const requestPayload = {
        resumeText: selectedResume!.parsed_text.trim(),
        jobDescription: selectedJob!.parsed_text.trim(),
        jobTitle: selectedJob!.title.trim(),
        companyName: selectedJob!.company?.trim() || ''
      };

      console.log('Starting cover letter generation with payload:', {
        resumeType: selectedResume?.type,
        resumeTextLength: requestPayload.resumeText.length,
        resumeTextPreview: requestPayload.resumeText.substring(0, 100) + '...',
        jobTitle: requestPayload.jobTitle,
        company: requestPayload.companyName,
        jobDescriptionLength: requestPayload.jobDescription.length,
        jobDescriptionPreview: requestPayload.jobDescription.substring(0, 100) + '...'
      });

      const { data, error } = await supabase.functions.invoke('generate-cover-letter', {
        body: requestPayload
      });

      console.log('Cover letter generation response:', { 
        data, 
        error,
        hasGeneratedText: !!data?.generatedText,
        generatedTextLength: data?.generatedText?.length || 0
      });

      if (error) {
        console.error('Supabase function error:', error);
        let errorMessage = 'Failed to generate cover letter';
        
        if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        
        // Handle specific error types
        if (error.message?.includes('Validation failed') || error.message?.includes('validation')) {
          errorMessage = `Data validation error: ${error.details || error.message}`;
        } else if (error.message?.includes('API key')) {
          errorMessage = `API configuration error: ${error.details || error.message}`;
        } else if (error.message?.includes('OpenAI')) {
          errorMessage = `AI service error: ${error.details || error.message}`;
        } else if (error.message?.includes('Monthly limit reached') || error.message?.includes('limit reached')) {
          setShowPaymentModal(true);
          setStep('preview');
          setLoading(false);
          return;
        }

        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error('No response data received from the server');
      }

      if (!data.generatedText || typeof data.generatedText !== 'string') {
        throw new Error('Invalid cover letter content received from the server');
      }

      if (data.generatedText.trim().length === 0) {
        throw new Error('Empty cover letter content received from the server');
      }

      setGeneratedText(data.generatedText.trim());
      setCoverLetterTitle(data.title || `Cover Letter for ${selectedJob!.title} at ${selectedJob!.company}`);
      setStep('complete');

      console.log('Cover letter generation completed successfully');
    } catch (error) {
      console.error('Error generating cover letter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToReview = () => {
    setStep('review');
  };

  const handleSave = async () => {
    if (!user || !generatedText || !coverLetterTitle) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cover_letters')
        .insert({
          user_id: user.id,
          title: coverLetterTitle,
          generated_text: generatedText,
          job_description_id: selectedJobId,
          original_resume_id: null,
          optimized_resume_id: null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cover letter saved successfully!"
      });
      onComplete();
    } catch (error) {
      console.error('Error saving cover letter:', error);
      toast({
        title: "Error",
        description: "Failed to save cover letter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = selectedResumeId && selectedJobId;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Cover Letter</h1>
          <p className="text-muted-foreground">
            Generate a personalized cover letter using your resume and target job
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Generation Error</div>
              <div className="text-sm">{error}</div>
              {error.includes('validation') && (
                <div className="text-xs mt-2 opacity-90">
                  Please ensure both your resume and job description contain sufficient content (at least 50 characters each).
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {step === 'select' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Select Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resume to use" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      <div className="flex flex-col">
                        <span>{resume.file_name || 'Untitled Resume'}</span>
                        <span className="text-xs text-muted-foreground">
                          {resume.type === 'original' ? 'Original Resume' : 'Optimized Resume'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {resumes.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No resumes found. Please upload a resume first.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Select Job Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job description" />
                </SelectTrigger>
                <SelectContent>
                  {jobDescriptions.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} at {job.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {jobDescriptions.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No job descriptions found. Please upload a job description first.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handlePreview}
              disabled={!canProceed}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Selection
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Your Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Selected Resume:</h3>
                <p className="text-sm bg-muted p-3 rounded-md">
                  {selectedResume?.file_name} ({selectedResume?.type === 'original' ? 'Original' : 'Optimized'})
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Target Position:</h3>
                <p className="text-sm bg-muted p-3 rounded-md">
                  {selectedJob?.title} at {selectedJob?.company}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('select')}>
              Back to Selection
            </Button>
            <Button onClick={handleGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Cover Letter
            </Button>
          </div>
        </div>
      )}

      {step === 'generating' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Generating Your Cover Letter</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Our AI is crafting a personalized cover letter that highlights your experience for the {selectedJob?.title} position at {selectedJob?.company}...
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'complete' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Cover Letter Generated!</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Your personalized cover letter for {selectedJob?.title} at {selectedJob?.company} is ready for review.
              </p>
              <Button onClick={handleContinueToReview}>
                <Eye className="h-4 w-4 mr-2" />
                Review & Edit
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review & Edit Your Cover Letter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={coverLetterTitle}
                  onChange={(e) => setCoverLetterTitle(e.target.value)}
                  placeholder="Cover letter title..."
                />
              </div>
              <div>
                <Label htmlFor="content">Cover Letter Content</Label>
                <Textarea
                  id="content"
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  rows={20}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('preview')}>
              Back to Preview
            </Button>
            <Button onClick={handleSave} disabled={loading || !generatedText.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Cover Letter
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        returnUrl={window.location.href}
      />
    </div>
  );
};
