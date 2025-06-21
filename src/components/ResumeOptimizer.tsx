
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [selectedJobDescId, setSelectedJobDescId] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const handleOptimize = async () => {
    if (!selectedResumeId || !selectedJobDescId) {
      toast({
        title: "Selection Required",
        description: "Please select both a resume and job description.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsOptimizing(true);

      const { data, error } = await supabase.functions.invoke('optimize-resume', {
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
        description: "Your optimized resume has been created successfully.",
      });

      // Reset selections
      setSelectedResumeId('');
      setSelectedJobDescId('');
      
      // Notify parent component
      onOptimizationComplete();

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

  const availableResumes = resumes.filter(resume => resume.parsed_text);

  if (availableResumes.length === 0) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">Upload a resume to get started with AI optimization</p>
          <Button asChild>
            <a href="/upload-resume">Upload Resume</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (jobDescriptions.length === 0) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">Add a job description to optimize your resume</p>
          <Button asChild>
            <a href="/upload-job">Add Job Description</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Resume Optimizer
        </CardTitle>
        <CardDescription>
          Select a resume and job description to create an optimized version tailored to the role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Resume</label>
          <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a resume to optimize" />
            </SelectTrigger>
            <SelectContent>
              {availableResumes.map((resume) => (
                <SelectItem key={resume.id} value={resume.id}>
                  {resume.file_name || 'Untitled Resume'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Select Job Description</label>
          <Select value={selectedJobDescId} onValueChange={setSelectedJobDescId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a job description" />
            </SelectTrigger>
            <SelectContent>
              {jobDescriptions.map((jobDesc) => (
                <SelectItem key={jobDesc.id} value={jobDesc.id}>
                  {jobDesc.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleOptimize}
          disabled={!selectedResumeId || !selectedJobDescId || isOptimizing}
          className="w-full"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Optimizing Resume...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Optimize Resume with AI
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
