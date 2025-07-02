
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FileText, Building, Sparkles, Save, CheckCircle, Eye } from 'lucide-react';
import { Loader2 } from 'lucide-react';

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
  const [step, setStep] = useState<'select' | 'preview' | 'generating' | 'complete' | 'review'>('select');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [coverLetterTitle, setCoverLetterTitle] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
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

  const handlePreview = () => {
    if (selectedResume && selectedJob) {
      setStep('preview');
    }
  };

  const handleGenerate = async () => {
    if (!selectedResume || !selectedJob) return;

    setStep('generating');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-cover-letter', {
        body: {
          resumeText: selectedResume.parsed_text,
          jobDescription: selectedJob.parsed_text,
          jobTitle: selectedJob.title,
          companyName: selectedJob.company
        }
      });

      if (error) throw error;

      setGeneratedText(data.generatedText);
      setCoverLetterTitle(data.title || `Cover Letter for ${selectedJob.title} at ${selectedJob.company}`);
      setStep('complete');
    } catch (error) {
      console.error('Error generating cover letter:', error);
      toast({
        title: "Error",
        description: "Failed to generate cover letter. Please try again.",
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
    </div>
  );
};
