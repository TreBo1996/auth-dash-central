import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ATSPreviewModal } from './ATSPreviewModal';
interface Resume {
  id: string;
  file_name: string | null;
  parsed_text: string | null;
}
interface JobDescription {
  id: string;
  title: string;
  parsed_text: string;
}
interface ATSFeedback {
  overall_score: number;
  category_scores: {
    keyword_match: number;
    skills_alignment: number;
    experience_relevance: number;
    format_compliance: number;
  };
  recommendations: string[];
  keyword_analysis: {
    matched_keywords: string[];
    missing_keywords: string[];
  };
  strengths: string[];
  areas_for_improvement: string[];
}
interface ResumeOptimizerProps {
  resumes: Resume[];
  jobDescriptions: JobDescription[];
  onOptimizationComplete: () => void;
}
export const ResumeOptimizer: React.FC<ResumeOptimizerProps> = ({
  resumes,
  jobDescriptions,
  onOptimizationComplete
}) => {
  const navigate = useNavigate();
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [selectedJobDescId, setSelectedJobDescId] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showATSModal, setShowATSModal] = useState(false);
  const [originalATSScore, setOriginalATSScore] = useState<number | undefined>();
  const [originalATSFeedback, setOriginalATSFeedback] = useState<ATSFeedback | undefined>();
  const [isLoadingATS, setIsLoadingATS] = useState(false);
  const {
    toast
  } = useToast();
  const handleAnalyzeATS = async () => {
    if (!selectedResumeId || !selectedJobDescId) {
      toast({
        title: "Selection Required",
        description: "Please select both a resume and job description.",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsLoadingATS(true);
      setShowATSModal(true);
      console.log('Calculating original ATS score...');
      const {
        data,
        error
      } = await supabase.functions.invoke('calculate-original-ats-score', {
        body: {
          resumeId: selectedResumeId,
          jobDescriptionId: selectedJobDescId
        }
      });
      if (error) throw error;
      if (data.error) {
        throw new Error(data.error);
      }
      setOriginalATSScore(data.ats_score);
      setOriginalATSFeedback(data.ats_feedback);
      console.log('Original ATS score calculated:', data.ats_score);
    } catch (error) {
      console.error('ATS scoring error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze resume. Please try again.",
        variant: "destructive"
      });
      setShowATSModal(false);
    } finally {
      setIsLoadingATS(false);
    }
  };
  const handleOptimize = async () => {
    if (!selectedResumeId || !selectedJobDescId) {
      return;
    }
    try {
      setIsOptimizing(true);
      console.log('Starting resume optimization...');
      const {
        data,
        error
      } = await supabase.functions.invoke('optimize-resume', {
        body: {
          resumeId: selectedResumeId,
          jobDescriptionId: selectedJobDescId
        }
      });
      if (error) throw error;
      if (data.error) {
        throw new Error(data.error);
      }
      toast({
        title: "Resume Optimized!",
        description: "Your optimized resume has been created successfully."
      });

      // Close modal and reset state
      setShowATSModal(false);
      setSelectedResumeId('');
      setSelectedJobDescId('');
      setOriginalATSScore(undefined);
      setOriginalATSFeedback(undefined);

      // Notify parent component
      onOptimizationComplete();

      // Navigate to the resume editor for the newly created optimized resume
      if (data.optimizedResume?.id) {
        console.log('Navigating to resume editor with ID:', data.optimizedResume.id);
        navigate(`/resume-editor/${data.optimizedResume.id}`);
      }
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
  const handleResumeSelect = (value: string) => {
    console.log('Resume selected:', value);
    setSelectedResumeId(value);
  };
  const handleJobDescSelect = (value: string) => {
    console.log('Job description selected:', value);
    setSelectedJobDescId(value);
  };
  const availableResumes = resumes.filter(resume => resume.parsed_text);
  const selectedResume = availableResumes.find(r => r.id === selectedResumeId);
  const selectedJobDesc = jobDescriptions.find(j => j.id === selectedJobDescId);
  console.log('Available resumes:', availableResumes.length);
  console.log('Available job descriptions:', jobDescriptions.length);
  console.log('Selected resume ID:', selectedResumeId);
  console.log('Selected job desc ID:', selectedJobDescId);
  if (availableResumes.length === 0) {
    return <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">Upload a resume to get started with AI optimization</p>
          <Button asChild>
            <a href="/upload-resume">Upload Resume</a>
          </Button>
        </CardContent>
      </Card>;
  }
  if (jobDescriptions.length === 0) {
    return <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">Add a job description to optimize your resume</p>
          <Button asChild>
            <a href="/upload-job">Add Job Description</a>
          </Button>
        </CardContent>
      </Card>;
  }
  return <>
      <Card>
        <CardHeader>
          <CardDescription>
            Select a resume and job description to see your current ATS score and create an optimized version
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Resume</label>
            <div className="relative z-[10]">
              <Select value={selectedResumeId} onValueChange={handleResumeSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a resume to optimize" />
                </SelectTrigger>
                <SelectContent>
                  {availableResumes.map(resume => <SelectItem key={resume.id} value={resume.id}>
                      {resume.file_name || 'Untitled Resume'}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Job Description</label>
            <div className="relative z-[9]">
              <Select value={selectedJobDescId} onValueChange={handleJobDescSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job description" />
                </SelectTrigger>
                <SelectContent>
                  {jobDescriptions.map(jobDesc => <SelectItem key={jobDesc.id} value={jobDesc.id}>
                      {jobDesc.title}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleAnalyzeATS} disabled={!selectedResumeId || !selectedJobDescId || isLoadingATS} className="w-full bg-indigo-800 hover:bg-indigo-700">
            {isLoadingATS ? <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Current Score...
              </> : <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze & Optimize Resume
              </>}
          </Button>
        </CardContent>
      </Card>

      <ATSPreviewModal isOpen={showATSModal} onClose={() => setShowATSModal(false)} onOptimize={handleOptimize} resumeName={selectedResume?.file_name || 'Untitled Resume'} jobTitle={selectedJobDesc?.title || 'Job Position'} atsScore={originalATSScore} atsFeedback={originalATSFeedback} isLoading={isLoadingATS} isOptimizing={isOptimizing} />
    </>;
};