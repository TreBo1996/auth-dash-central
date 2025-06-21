
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Brain, Wrench, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface JobDescription {
  id: string;
  title: string;
  parsed_text: string;
}

interface InterviewQuestions {
  behavioral: string[];
  technical: string[];
}

const InterviewPrep: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [questions, setQuestions] = useState<InterviewQuestions | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch user's job descriptions
  const { data: jobDescriptions, isLoading: isLoadingJobs, error: jobsError } = useQuery({
    queryKey: ['job-descriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('job_descriptions')
        .select('id, title, parsed_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as JobDescription[];
    },
    enabled: !!user?.id,
  });

  const generateQuestions = async () => {
    if (!selectedJobId) {
      toast({
        title: "Selection Required",
        description: "Please select a job description first.",
        variant: "destructive",
      });
      return;
    }

    const selectedJob = jobDescriptions?.find(job => job.id === selectedJobId);
    if (!selectedJob) return;

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-interview-questions', {
        body: { jobDescription: selectedJob.parsed_text }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setQuestions(response.data);
      toast({
        title: "Questions Generated!",
        description: "Your interview questions are ready.",
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate interview questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoadingJobs) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading job descriptions...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (jobsError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <AlertCircle className="h-8 w-8 text-red-500 mr-2" />
          <span>Error loading job descriptions</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mock Interview Prep</h1>
          <p className="text-gray-600 mt-2">
            Generate AI-powered interview questions based on your uploaded job descriptions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Job Description</CardTitle>
            <CardDescription>
              Choose a job description to generate relevant interview questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!jobDescriptions || jobDescriptions.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  No job descriptions found. Upload a job description first to get started.
                </p>
              </div>
            ) : (
              <>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a job description..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobDescriptions.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  onClick={generateQuestions}
                  disabled={!selectedJobId || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    'Generate Interview Questions'
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {questions && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-md rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5" />
                  Behavioral Questions
                </CardTitle>
                <CardDescription>
                  Questions about your experience and work style
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {questions.behavioral.map((question, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-base">{question}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="mr-2 h-5 w-5" />
                  Technical Questions
                </CardTitle>
                <CardDescription>
                  Questions about your technical skills and knowledge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {questions.technical.map((question, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-base">{question}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InterviewPrep;
