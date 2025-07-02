
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Sparkles, Save } from 'lucide-react';

interface Resume {
  id: string;
  file_name: string;
  created_at: string;
}

interface OptimizedResume {
  id: string;
  created_at: string;
  job_description: {
    title: string;
  };
}

interface JobDescription {
  id: string;
  title: string;
  company: string;
  created_at: string;
}

interface CoverLetterCreatorProps {
  onSave?: () => void;
}

export const CoverLetterCreator: React.FC<CoverLetterCreatorProps> = ({ onSave }) => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [optimizedResumes, setOptimizedResumes] = useState<OptimizedResume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedOptimizedResumeId, setSelectedOptimizedResumeId] = useState('');
  const [selectedJobDescriptionId, setSelectedJobDescriptionId] = useState('');
  const [useOptimizedResume, setUseOptimizedResume] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [tone, setTone] = useState('professional');
  const [title, setTitle] = useState('');
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load resumes
      const { data: resumesData } = await supabase
        .from('resumes')
        .select('id, file_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Load optimized resumes
      const { data: optimizedResumesData } = await supabase
        .from('optimized_resumes')
        .select(`
          id,
          created_at,
          job_description:job_descriptions(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Load job descriptions
      const { data: jobDescriptionsData } = await supabase
        .from('job_descriptions')
        .select('id, title, company, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setResumes(resumesData || []);
      setOptimizedResumes(optimizedResumesData || []);
      setJobDescriptions(jobDescriptionsData || []);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleGenerate = async () => {
    if (!selectedJobDescriptionId) {
      toast({
        title: "Missing Information",
        description: "Please select a job description.",
        variant: "destructive"
      });
      return;
    }

    if (!useOptimizedResume && !selectedResumeId) {
      toast({
        title: "Missing Information",
        description: "Please select a resume.",
        variant: "destructive"
      });
      return;
    }

    if (useOptimizedResume && !selectedOptimizedResumeId) {
      toast({
        title: "Missing Information",
        description: "Please select an optimized resume.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-cover-letter', {
        body: {
          jobDescriptionId: selectedJobDescriptionId,
          optimizedResumeId: useOptimizedResume ? selectedOptimizedResumeId : null,
          originalResumeId: useOptimizedResume ? null : selectedResumeId,
          additionalInfo,
          tone
        }
      });

      if (error) throw error;

      setGeneratedCoverLetter(data.coverLetter);
      if (!title) {
        setTitle(`Cover Letter for ${data.jobTitle} at ${data.company || 'Company'}`);
      }

      toast({
        title: "Cover Letter Generated!",
        description: "Your AI-powered cover letter has been created successfully."
      });
    } catch (error) {
      console.error('Error generating cover letter:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate cover letter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedCoverLetter || !title) {
      toast({
        title: "Missing Information",
        description: "Please generate a cover letter and provide a title.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('cover_letters')
        .insert({
          user_id: user.id,
          title,
          generated_text: generatedCoverLetter,
          job_description_id: selectedJobDescriptionId,
          optimized_resume_id: useOptimizedResume ? selectedOptimizedResumeId : null,
          original_resume_id: useOptimizedResume ? null : selectedResumeId
        });

      if (error) throw error;

      toast({
        title: "Cover Letter Saved!",
        description: "Your cover letter has been saved successfully."
      });

      // Reset form
      setTitle('');
      setGeneratedCoverLetter('');
      setSelectedJobDescriptionId('');
      setSelectedResumeId('');
      setSelectedOptimizedResumeId('');
      setAdditionalInfo('');
      
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving cover letter:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save cover letter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate AI Cover Letter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Job Description Selection */}
          <div className="space-y-2">
            <Label htmlFor="job-description">Job Description</Label>
            <Select value={selectedJobDescriptionId} onValueChange={setSelectedJobDescriptionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job description" />
              </SelectTrigger>
              <SelectContent>
                {jobDescriptions.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title} {job.company && `at ${job.company}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resume Type Selection */}
          <div className="space-y-2">
            <Label>Resume Type</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={!useOptimizedResume}
                  onChange={() => setUseOptimizedResume(false)}
                />
                <span>Original Resume</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={useOptimizedResume}
                  onChange={() => setUseOptimizedResume(true)}
                />
                <span>Optimized Resume</span>
              </label>
            </div>
          </div>

          {/* Resume Selection */}
          {!useOptimizedResume ? (
            <div className="space-y-2">
              <Label htmlFor="resume">Original Resume</Label>
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.file_name || `Resume ${resume.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="optimized-resume">Optimized Resume</Label>
              <Select value={selectedOptimizedResumeId} onValueChange={setSelectedOptimizedResumeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an optimized resume" />
                </SelectTrigger>
                <SelectContent>
                  {optimizedResumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      Optimized for {resume.job_description?.title || 'Unknown Job'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tone Selection */}
          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                <SelectItem value="conservative">Conservative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Information */}
          <div className="space-y-2">
            <Label htmlFor="additional-info">Additional Information (Optional)</Label>
            <Textarea
              id="additional-info"
              placeholder="Any specific points you'd like to highlight or additional context..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Cover Letter Preview */}
      {generatedCoverLetter && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generated Cover Letter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your cover letter"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Cover Letter Content</Label>
              <Textarea
                value={generatedCoverLetter}
                onChange={(e) => setGeneratedCoverLetter(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Cover Letter'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
