import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Mail, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ApplicationStatus } from '@/components/job-hub/JobStatusSelector';
import { ApplicationPreviewButtons } from './ApplicationPreviewButtons';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    company: string | null;
    location: string | null;
    salary_range: string | null;
    parsed_text: string;
    source: string | null;
    job_url: string | null;
    created_at: string;
    is_applied?: boolean;
    is_saved?: boolean;
    application_status?: ApplicationStatus;
  };
  onStatusUpdate: (jobId: string, field: string, value: boolean | ApplicationStatus) => void;
}

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  isOpen,
  onClose,
  job,
  onStatusUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [optimizedResume, setOptimizedResume] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState<any>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadApplicationStack();
    }
  }, [isOpen, job.id]);

  const loadApplicationStack = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch optimized resume
      const { data: resumeData, error: resumeError } = await supabase
        .from('optimized_resumes')
        .select('*')
        .eq('job_description_id', job.id)
        .eq('user_id', user!.id)
        .single();

      if (resumeError) {
        console.warn('No optimized resume found:', resumeError);
      }

      setOptimizedResume(resumeData);

      // Fetch cover letter
      const { data: coverLetterData, error: coverLetterError } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('job_description_id', job.id)
        .eq('user_id', user!.id)
        .single();

      if (coverLetterError) {
        console.warn('No cover letter found:', coverLetterError);
      }

      setCoverLetter(coverLetterData);
    } catch (error) {
      console.error('Error loading application stack:', error);
      setError('Failed to load application stack. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmitApplication = async () => {
    try {
      setLoading(true);
      setError('');

      // Simulate application submission
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update application status
      await onStatusUpdate(job.id, 'application_status', 'applied');

      toast({
        title: "Application Submitted",
        description: "Your application has been successfully submitted!",
      });

      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTemplateStep = () => {
    if (!optimizedResume || !coverLetter) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your application materials...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Your Application Stack is Ready!</h3>
          <p className="text-gray-600 mb-6">
            Review your optimized resume and cover letter before applying.
          </p>
        </div>

        {/* Application Stack Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Resume Card */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium">Optimized Resume</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {optimizedResume.ats_score}% ATS Score
                </Badge>
                {optimizedResume.job_fit_level && (
                  <Badge variant="outline">
                    {optimizedResume.job_fit_level} Fit
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Tailored specifically for this position
              </p>
            </div>
          </div>

          {/* Cover Letter Card */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium">Cover Letter</h4>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                AI Generated
              </Badge>
              <p className="text-sm text-gray-600">
                Personalized for {job.company || 'this company'}
              </p>
            </div>
          </div>
        </div>

        {/* Preview Buttons */}
        <ApplicationPreviewButtons
          resumeId={optimizedResume.id}
          coverLetter={coverLetter}
          onResumeEdit={() => navigate(`/resume-editor/${optimizedResume.id}`)}
          onCoverLetterEdit={() => {
            if (coverLetter?.id) {
              navigate(`/cover-letters/edit/${coverLetter.id}`);
            } else {
              navigate('/cover-letters');
            }
          }}
          onCoverLetterDownload={() => {
            if (!coverLetter) return;
            
            const fileName = `cover-letter-${job.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${job.company?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'company'}-${new Date().toISOString().split('T')[0]}.txt`;
            const blob = new Blob([coverLetter.generated_text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast({
              title: "Download Complete",
              description: "Cover letter has been downloaded successfully."
            });
          }}
        />

        {/* Application Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Ready to Apply?</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Click <strong>Preview Resume</strong> and <strong>Preview Cover Letter</strong> to review your materials</li>
            <li>Make any final edits if needed using the edit buttons in the preview modals</li>
            <li>Download both documents from the preview modals</li>
            <li>Continue below to submit your application</li>
          </ol>
        </div>
      </div>
    );
  };

  const renderContactStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="contact-name">Full Name</Label>
        <Input
          id="contact-name"
          type="text"
          placeholder="Enter your full name"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="contact-email">Email Address</Label>
        <Input
          id="contact-email"
          type="email"
          placeholder="Enter your email address"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="additional-notes">Additional Notes</Label>
        <Textarea
          id="additional-notes"
          placeholder="Include any additional notes for the employer"
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
        />
      </div>
    </div>
  );

  const renderApplicationStep = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="terms"
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(!!checked)}
        />
        <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
          I agree to the terms and conditions
        </Label>
      </div>
      <Alert>
        <AlertDescription>
          By proceeding, you acknowledge that you have reviewed all the information and
          are ready to submit your application.
        </AlertDescription>
      </Alert>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {job.title} at {job.company}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          {step === 1 && renderTemplateStep()}
          {step === 2 && renderContactStep()}
          {step === 3 && renderApplicationStep()}
        </div>

        <div className="flex justify-between pt-6">
          {step > 1 ? (
            <Button variant="secondary" onClick={handleBack} disabled={loading}>
              Back
            </Button>
          ) : (
            <div></div>
          )}
          {step < 3 ? (
            <Button onClick={handleNext} disabled={loading || (step === 2 && (!contactName || !contactEmail))}>
              Next
            </Button>
          ) : (
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={handleSubmitApplication}
              disabled={loading || !termsAccepted}
            >
              Submit Application
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
