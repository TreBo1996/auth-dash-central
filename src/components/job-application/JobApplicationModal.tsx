
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
import { FileText, Sparkles, Send } from 'lucide-react';

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
  };
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
  
  const [step, setStep] = useState<'choose' | 'existing' | 'optimize' | 'submit'>('choose');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [optimizedResumeId, setOptimizedResumeId] = useState<string>('');

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
        setStep('submit');
      }
    } catch (error) {
      console.error('Error getting optimized resume:', error);
      setStep('submit');
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
            company: jobPosting.employer_profile.company_name
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

      onApplicationSubmitted();
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

  const availableResumes = resumes.filter(resume => resume.parsed_text);
  const jobDescriptions = [{
    id: 'current-job',
    title: jobPosting.title,
    parsed_text: jobPosting.description
  }];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply to {jobPosting.title}</DialogTitle>
          <DialogDescription>
            at {jobPosting.employer_profile.company_name}
          </DialogDescription>
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
                  onClick={() => setStep('optimize')}
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
                    <Button onClick={() => setStep('optimize')}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Optimized Resume Instead
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
                  Back
                </Button>
              </div>

              <ResumeOptimizer
                resumes={resumes}
                jobDescriptions={jobDescriptions}
                onOptimizationComplete={handleOptimizationComplete}
              />
            </div>
          )}

          {step === 'submit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Finalize Application</h3>
                <Button variant="outline" onClick={() => setStep('choose')}>
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
                    {optimizedResumeId ? 'Using optimized resume' : selectedResumeId ? 'Using selected resume' : 'No resume selected'}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
