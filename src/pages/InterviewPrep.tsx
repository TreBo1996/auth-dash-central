
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Brain, Wrench, AlertCircle, Play, TrendingUp, Calendar, Target, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { InterviewSession } from '@/components/interview/InterviewSession';
import { InterviewHistoryTable } from '@/components/interview/InterviewHistoryTable';
import { InterviewAnalytics } from '@/components/interview/InterviewAnalytics';
import { ContextualUsageCounter } from '@/components/common/ContextualUsageCounter';

interface JobDescription {
  id: string;
  title: string;
  parsed_text: string;
}

interface InterviewQuestions {
  behavioral: string[];
  technical: string[];
}

interface InterviewSessionData {
  id: string;
  job_description_id: string;
  overall_score: number | null;
  completed_at: string | null;
  created_at: string;
  session_status: string;
  total_questions: number;
  job_descriptions: {
    title: string;
  };
}

const InterviewPrep: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [questions, setQuestions] = useState<InterviewQuestions | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [activeTab, setActiveTab] = useState('new-interview');

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

  // Fetch user's interview sessions with more details
  const { data: interviewSessions, refetch: refetchSessions } = useQuery({
    queryKey: ['interview-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('interview_sessions')
        .select(`
          id,
          job_description_id,
          overall_score,
          completed_at,
          created_at,
          session_status,
          total_questions,
          job_descriptions(title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InterviewSessionData[];
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
        description: "Your interview questions are ready. Click 'Start Interview' to begin.",
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

  const startInterview = () => {
    if (!questions) return;
    setSessionActive(true);
  };

  const handleSessionComplete = () => {
    setSessionActive(false);
    setQuestions(null);
    setSelectedJobId('');
    refetchSessions();
    setActiveTab('history');
    toast({
      title: "Interview Complete!",
      description: "Your interview session has been saved. Check your history for detailed feedback.",
    });
  };

  if (isLoadingJobs) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (jobsError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <AlertCircle className="h-8 w-8 text-red-500 mr-2" />
          <span>Error loading data</span>
        </div>
      </DashboardLayout>
    );
  }

  const selectedJob = jobDescriptions?.find(job => job.id === selectedJobId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Interview Coach</h1>
          <p className="text-gray-600 mt-2">
            Practice with AI-powered interview questions and track your progress over time
          </p>
        </div>

        {/* Usage Counter */}
        <ContextualUsageCounter features={['interview_sessions']} />

        {sessionActive && selectedJob && questions ? (
          <InterviewSession
            jobDescription={selectedJob}
            questions={questions}
            onSessionComplete={handleSessionComplete}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new-interview" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                New Interview
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                History & Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="new-interview" className="space-y-6">
              {/* New Interview Setup */}
              <Card>
                <CardHeader>
                  <CardTitle>Start New Interview Session</CardTitle>
                  <CardDescription>
                    Select a job description and generate AI-powered interview questions
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

              {/* Generated Questions Preview */}
              {questions && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Ready to Start Interview
                    </CardTitle>
                    <CardDescription>
                      5 questions generated for {selectedJob?.title}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        <span className="text-sm">{questions.behavioral.length} Behavioral Questions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        <span className="text-sm">{questions.technical.length} Technical Questions</span>
                      </div>
                    </div>
                    <Button onClick={startInterview} className="w-full bg-green-600 hover:bg-green-700">
                      <Play className="h-4 w-4 mr-2" />
                      Start Interview Session
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <InterviewAnalytics sessions={interviewSessions || []} />
              <InterviewHistoryTable sessions={interviewSessions || []} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InterviewPrep;
