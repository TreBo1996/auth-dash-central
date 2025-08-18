import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFeatureUsage } from '@/hooks/useFeatureUsage';
import { PaymentModal } from '@/components/subscription/PaymentModal';

interface Resume {
  id: string;
  file_name: string | null;
  parsed_text: string | null;
}

interface OptimizedResume {
  id: string;
  generated_text: string;
  created_at: string;
}

interface CoverLetterGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    company: string | null;
    parsed_text: string;
  };
  onComplete?: () => void;
}

export const CoverLetterGenerationModal: React.FC<CoverLetterGenerationModalProps> = ({
  isOpen,
  onClose,
  job,
  onComplete
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkFeatureAccess, incrementUsage, isPremium } = useFeatureUsage();

  // State management
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [optimizedResumes, setOptimizedResumes] = useState<OptimizedResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [selectedResumeType, setSelectedResumeType] = useState<'original' | 'optimized'>('optimized');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState<string>('');
  const [coverLetterTitle, setCoverLetterTitle] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadResumes();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSelectedResumeId('');
      setError('');
      setCoverLetterText('');
      setCoverLetterTitle('');
      setIsComplete(false);
    }
  }, [isOpen]);

  const loadResumes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load original resumes
      const { data: resumesData, error: resumesError } = await supabase
        .from('resumes')
        .select('id, file_name, parsed_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (resumesError) throw resumesError;

      // Load optimized resumes for this job
      const { data: optimizedData, error: optimizedError } = await supabase
        .from('optimized_resumes')
        .select('id, generated_text, created_at')
        .eq('user_id', user.id)
        .eq('job_description_id', job.id)
        .order('created_at', { ascending: false });

      if (optimizedError) throw optimizedError;

      const availableResumes = (resumesData || []).filter(resume => resume.parsed_text);
      setResumes(availableResumes);
      setOptimizedResumes(optimizedData || []);

      // Auto-select the latest optimized resume if available, otherwise the latest original
      if (optimizedData && optimizedData.length > 0) {
        setSelectedResumeId(optimizedData[0].id);
        setSelectedResumeType('optimized');
      } else if (availableResumes.length > 0) {
        setSelectedResumeId(availableResumes[0].id);
        setSelectedResumeType('original');
      }

      if (availableResumes.length === 0 && (optimizedData?.length || 0) === 0) {
        setError('No resumes found. Please upload a resume first.');
      }
    } catch (error) {
      console.error('Error loading resumes:', error);
      setError('Failed to load resumes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedResumeId) {
      setError('Please select a resume to continue.');
      return;
    }

    // Check usage limits for cover letters
    if (!isPremium) {
      const canUse = await checkFeatureAccess('cover_letters');
      if (!canUse) {
        setShowPaymentModal(true);
        return;
      }
    }

    try {
      setIsGenerating(true);
      setError('');

      let resumeText = '';
      
      if (selectedResumeType === 'original') {
        const selectedResume = resumes.find(r => r.id === selectedResumeId);
        if (!selectedResume?.parsed_text) {
          throw new Error('Selected resume content not found');
        }
        resumeText = selectedResume.parsed_text;
      } else {
        const selectedOptimized = optimizedResumes.find(r => r.id === selectedResumeId);
        if (!selectedOptimized?.generated_text) {
          throw new Error('Selected optimized resume content not found');
        }
        resumeText = selectedOptimized.generated_text;
      }

      const requestPayload = {
        resumeText: resumeText.trim(),
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

      // Increment usage for free users
      if (!isPremium) {
        await incrementUsage('cover_letters');
      }

      setIsComplete(true);

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
      setIsGenerating(false);
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
        original_resume_id: selectedResumeType === 'original' ? selectedResumeId : null,
        optimized_resume_id: selectedResumeType === 'optimized' ? selectedResumeId : null
      });

    if (error) {
      console.error('Error saving cover letter:', error);
      throw error;
    }
  };

  const handleComplete = () => {
    toast({
      title: "Cover Letter Generated!",
      description: "Your personalized cover letter is ready."
    });
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  const selectedResumeName = selectedResumeType === 'original' 
    ? resumes.find(r => r.id === selectedResumeId)?.file_name || 'Untitled Resume'
    : `Optimized Resume (${new Date(optimizedResumes.find(r => r.id === selectedResumeId)?.created_at || '').toLocaleDateString()})`;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Generate Cover Letter
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              For: {job.title} {job.company && `at ${job.company}`}
            </p>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isGenerating && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-medium mb-2">Generating Cover Letter</h3>
                <p className="text-muted-foreground text-center">
                  Creating a personalized cover letter using your resume...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Complete State */}
          {isComplete && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-bold text-green-900 mb-2">
                  Cover Letter Generated Successfully!
                </h3>
                <p className="text-green-700 text-center mb-4">
                  Your personalized cover letter for <strong>{job.title}</strong> is ready.
                </p>
                
                <div className="w-full max-w-2xl">
                  <div className="p-4 bg-white rounded-lg border mb-4">
                    <h4 className="font-medium mb-3">{coverLetterTitle}</h4>
                    <div className="max-h-60 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {coverLetterText}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                      <span>{coverLetterText.trim().split(/\s+/).filter(word => word.length > 0).length} words</span>
                      <span>{coverLetterText.length} characters</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button onClick={handleComplete}>
                    Done
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selection State */}
          {!isGenerating && !isComplete && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Select Resume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (resumes.length === 0 && optimizedResumes.length === 0) ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No resumes found. Please upload a resume first.</p>
                      <Button onClick={() => window.location.href = '/upload-resume'}>
                        Upload Resume
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Resume Type Selection */}
                      <div className="grid grid-cols-2 gap-4">
                        {optimizedResumes.length > 0 && (
                          <Card 
                            className={`cursor-pointer transition-colors ${
                              selectedResumeType === 'optimized' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              setSelectedResumeType('optimized');
                              if (optimizedResumes.length > 0) {
                                setSelectedResumeId(optimizedResumes[0].id);
                              }
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Optimized Resume</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                ATS-optimized for this position
                              </p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {resumes.length > 0 && (
                          <Card 
                            className={`cursor-pointer transition-colors ${
                              selectedResumeType === 'original' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              setSelectedResumeType('original');
                              if (resumes.length > 0) {
                                setSelectedResumeId(resumes[0].id);
                              }
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-gray-600" />
                                <span className="font-medium">Original Resume</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Use your uploaded resume
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Resume Selection */}
                      <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a specific resume" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedResumeType === 'optimized' 
                            ? optimizedResumes.map(resume => (
                                <SelectItem key={resume.id} value={resume.id}>
                                  Optimized Resume - {new Date(resume.created_at).toLocaleDateString()}
                                </SelectItem>
                              ))
                            : resumes.map(resume => (
                                <SelectItem key={resume.id} value={resume.id}>
                                  {resume.file_name || 'Untitled Resume'}
                                </SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>

                      {selectedResumeId && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">
                            <strong>Selected:</strong> {selectedResumeName}
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
                  onClick={handleGenerate}
                  disabled={!selectedResumeId || loading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Generate Cover Letter
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </>
  );
};