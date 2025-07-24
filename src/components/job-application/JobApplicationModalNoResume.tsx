
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ApplicationPreviewButtons } from './ApplicationPreviewButtons';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job?: {
    id: string;
    title: string;
    company: string | null;
    location: string | null;
    salary_range: string | null;
    parsed_text: string;
    source: string | null;
    job_url: string | null;
  };
  jobPosting?: any;
  onApplicationSubmitted?: () => void;
}

export const JobApplicationModalNoResume: React.FC<JobApplicationModalProps> = ({
  isOpen,
  onClose,
  job,
  jobPosting,
  onApplicationSubmitted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use either job or jobPosting data
  const jobData = job || jobPosting;

  const [step, setStep] = useState(1);
  const [coverLetter, setCoverLetter] = useState<any>(null);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: '',
    linkedin: ''
  });
  const [applicationDetails, setApplicationDetails] = useState({
    cover_letter: '',
    resume_file: null,
    additional_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && jobData) {
      generateCoverLetter();
    }
  }, [isOpen, jobData]);

  const generateCoverLetter = async () => {
    if (!jobData) return;

    try {
      setLoading(true);
      setError('');

      // Fetch user's name from their profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user!.id)
        .single();

      if (profileError) throw profileError;

      const userName = profileData?.full_name || 'Applicant';

      // Call the function to generate the cover letter
      const { data, error } = await supabase.functions.invoke('generate-cover-letter', {
        body: {
          job_description: jobData.parsed_text || jobData.description,
          job_title: jobData.title,
          company_name: jobData.company || 'Company',
          applicant_name: userName
        }
      });

      if (error) throw error;

      // Save the generated cover letter to the database
      const { data: coverLetterData, error: coverLetterError } = await supabase
        .from('cover_letters')
        .insert([
          {
            user_id: user!.id,
            job_description_id: jobData.id,
            title: `Cover Letter for ${jobData.title} at ${jobData.company || 'Company'}`,
            generated_text: data,
          }
        ])
        .select()
        .single();

      if (coverLetterError) throw coverLetterError;

      setCoverLetter(coverLetterData);
      setStep(2); // Move to the next step after generating the cover letter
    } catch (error: any) {
      console.error('Error generating cover letter:', error);
      setError('Failed to generate cover letter. Please try again.');
      toast({
        title: "Error",
        description: "Failed to generate cover letter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleApplicationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setApplicationDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!jobData) return;

    try {
      setSubmitting(true);
      setError('');

      // Basic validation
      if (!contactInfo.name || !contactInfo.email) {
        setError('Please fill in all required fields.');
        return;
      }

      // Construct the application data
      const applicationData = {
        job_posting_id: jobData.id,
        applicant_id: user!.id,
        cover_letter: coverLetter?.generated_text || '',
        status: 'pending',
        notes: applicationDetails.additional_notes
      };

      // Submit the application data to the database
      const { error } = await supabase
        .from('job_applications')
        .insert([applicationData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application submitted successfully!",
      });
      
      if (onApplicationSubmitted) {
        onApplicationSubmitted();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      setError('Failed to submit application. Please try again.');
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderTemplateStep = () => {
    if (!coverLetter) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your cover letter...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Your Cover Letter is Ready!</h3>
          <p className="text-gray-600 mb-6">
            Review your personalized cover letter before applying.
          </p>
        </div>

        {/* Cover Letter Summary Card */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-600" />
            <h4 className="text-lg font-medium">AI-Generated Cover Letter</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Personalized Content
              </Badge>
              <Badge variant="outline">
                Ready to Use
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Tailored specifically for the {jobData?.title} position at {jobData?.company || 'this company'}
            </p>
          </div>
        </div>

        {/* Preview Button */}
        <ApplicationPreviewButtons
          coverLetter={coverLetter}
          onCoverLetterEdit={() => {
            if (coverLetter?.id) {
              navigate(`/cover-letters/edit/${coverLetter.id}`);
            } else {
              navigate('/cover-letters');
            }
          }}
          onCoverLetterDownload={() => {
            if (!coverLetter || !jobData) return;
            
            const fileName = `cover-letter-${jobData.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${jobData.company?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'company'}-${new Date().toISOString().split('T')[0]}.txt`;
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
            <li>Click <strong>Preview Cover Letter</strong> to review your personalized letter</li>
            <li>Make any final edits if needed using the edit button in the preview modal</li>
            <li>Download the cover letter from the preview modal</li>
            <li>Continue below to submit your application</li>
          </ol>
        </div>
      </div>
    );
  };

  const renderContactStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={contactInfo.name}
          onChange={handleInputChange}
          placeholder="Your Full Name"
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          type="email"
          id="email"
          name="email"
          value={contactInfo.email}
          onChange={handleInputChange}
          placeholder="Your Email Address"
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          type="tel"
          id="phone"
          name="phone"
          value={contactInfo.phone}
          onChange={handleInputChange}
          placeholder="Your Phone Number"
        />
      </div>
      <div>
        <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
        <Input
          type="url"
          id="linkedin"
          name="linkedin"
          value={contactInfo.linkedin}
          onChange={handleInputChange}
          placeholder="Your LinkedIn Profile URL"
        />
      </div>
    </div>
  );

  const renderApplicationStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="additional_notes">Additional Notes</Label>
        <Textarea
          id="additional_notes"
          name="additional_notes"
          value={applicationDetails.additional_notes}
          onChange={handleApplicationChange}
          placeholder="Any additional notes you'd like to add?"
        />
      </div>
    </div>
  );

  if (!jobData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {jobData.title} at {jobData.company}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="py-4">
            {step === 1 && renderTemplateStep()}
            {step === 2 && (
              <>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                {renderContactStep()}
              </>
            )}
            {step === 3 && (
              <>
                <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
                {renderApplicationStep()}
              </>
            )}

            <div className="flex justify-between mt-6">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Previous
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} disabled={step === 1 && loading}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
