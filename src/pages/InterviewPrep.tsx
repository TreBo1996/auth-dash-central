import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Brain, Wrench, AlertCircle, Play, TrendingUp, Calendar, Target, Award, CheckCircle, Star, Clock, BarChart3, Mic, ChevronDown, ChevronUp, HelpCircle, Lightbulb, Users, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { InterviewSession } from '@/components/interview/InterviewSession';
import { InterviewHistoryTable } from '@/components/interview/InterviewHistoryTable';
import { InterviewAnalytics } from '@/components/interview/InterviewAnalytics';
import { ContextualUsageCounter } from '@/components/common/ContextualUsageCounter';
import { useFeatureUsage } from '@/hooks/useFeatureUsage';
import { PaymentModal } from '@/components/subscription/PaymentModal';

interface JobDescription {
  id: string;
  title: string;
  parsed_text: string;
  company?: string;
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
  const { checkFeatureAccess } = useFeatureUsage();
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [questions, setQuestions] = useState<InterviewQuestions | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [activeTab, setActiveTab] = useState('new-interview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTipsGuide, setShowTipsGuide] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [interviewTips, setInterviewTips] = useState<any>(null);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [selectedTipsJobId, setSelectedTipsJobId] = useState<string>('');

  // Fetch user's job descriptions
  const { data: jobDescriptions, isLoading: isLoadingJobs, error: jobsError } = useQuery({
    queryKey: ['job-descriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('job_descriptions')
        .select('id, title, parsed_text, company')
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

    // Check usage limits before proceeding
    const canUse = await checkFeatureAccess('interview_sessions');
    if (!canUse) {
      setShowPaymentModal(true);
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

  const generateInterviewTips = async (jobId: string) => {
    console.log('Starting interview tips generation for job:', jobId);
    
    const selectedJob = jobDescriptions?.find(job => job.id === jobId);
    if (!selectedJob) {
      toast({
        title: "Error",
        description: "Selected job description not found.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedJob.parsed_text || selectedJob.parsed_text.trim().length < 50) {
      toast({
        title: "Job Description Too Short",
        description: "This job description is too short to generate meaningful tips. Please try with a more detailed job posting.",
        variant: "destructive",
      });
      return;
    }

    setTipsLoading(true);
    
    toast({
      title: "Generating Tips...",
      description: "Creating personalized interview tips for your selected role.",
    });
    
    try {
      console.log('Calling edge function with job description length:', selectedJob.parsed_text?.length);
      
      const response = await supabase.functions.invoke('generate-interview-tips', {
        body: { jobDescription: selectedJob.parsed_text }
      });

      console.log('Edge function response:', response);

      if (response.error) {
        console.error('Edge function returned error:', response.error);
        throw new Error(response.error.message || 'Failed to generate interview tips');
      }

      if (!response.data || !response.data.tips) {
        console.error('Invalid response data:', response.data);
        throw new Error('Invalid response from interview tips service');
      }

      setInterviewTips(response.data.tips);
      setTipsLoading(false);
      toast({
        title: "Tips Generated!",
        description: "Your personalized interview tips are ready.",
      });
      
    } catch (error) {
      console.error('Error generating tips:', error);
      setTipsLoading(false);
      toast({
        title: "Generation Failed",
        description: error instanceof Error 
          ? `Failed to generate interview tips: ${error.message}` 
          : "Failed to generate interview tips. Please try again.",
        variant: "destructive",
      });
    }
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

        {/* Benefits Overview */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Star className="h-5 w-5" />
              Why Use AI Interview Coach?
            </CardTitle>
            <CardDescription className="text-blue-700">
              Master your interview skills with personalized AI feedback and practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Job-Specific Questions</h4>
                  <p className="text-sm text-gray-600">AI generates questions tailored to your actual job descriptions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Real-Time Scoring</h4>
                  <p className="text-sm text-gray-600">Get instant feedback with detailed 1-10 scoring on every response</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">24/7 Practice</h4>
                  <p className="text-sm text-gray-600">Practice anytime, anywhere at your own pace</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mic className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Voice Recording</h4>
                  <p className="text-sm text-gray-600">Practice speaking your answers with audio transcription</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Progress Tracking</h4>
                  <p className="text-sm text-gray-600">Monitor improvement over time with detailed analytics</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">AI-Powered Insights</h4>
                  <p className="text-sm text-gray-600">Get specific feedback on clarity, examples, and job relevance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips & Features Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Collapsible open={showTipsGuide} onOpenChange={setShowTipsGuide}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      How to Use Effectively
                    </div>
                    {showTipsGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                  <CardDescription>
                    Best practices for interview success
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Behavioral Questions (STAR Method)</h4>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        <li>• <strong>Situation:</strong> Set the context and background</li>
                        <li>• <strong>Task:</strong> Describe your responsibility or challenge</li>
                        <li>• <strong>Action:</strong> Explain the steps you took</li>
                        <li>• <strong>Result:</strong> Share the outcome and impact</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Technical Questions</h4>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        <li>• Think out loud to show your problem-solving process</li>
                        <li>• Use specific examples from your experience</li>
                        <li>• Explain trade-offs and alternatives</li>
                        <li>• Ask clarifying questions when needed</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Best Practices</h4>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        <li>• Practice 2-3 times per week for best results</li>
                        <li>• Speak clearly and at a steady pace</li>
                        <li>• Review feedback after each session</li>
                        <li>• Focus on improving low-scoring areas</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={showFeatures} onOpenChange={setShowFeatures}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Success Metrics
                    </div>
                    {showFeatures ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </CardTitle>
                  <CardDescription>
                    What you can expect from practice
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid gap-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Trophy className="h-8 w-8 text-green-600" />
                      <div>
                        <h4 className="font-medium text-green-900">Average Score Improvement</h4>
                        <p className="text-sm text-green-700">Users see 2-3 point improvement after 5 sessions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-blue-900">Confidence Boost</h4>
                        <p className="text-sm text-blue-700">85% of users report feeling more confident</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Target className="h-8 w-8 text-purple-600" />
                      <div>
                        <h4 className="font-medium text-purple-900">Interview Success</h4>
                        <p className="text-sm text-purple-700">Higher callback rates for consistent users</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <h4 className="font-medium text-gray-900 mb-2">Understanding Your Scores</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• <strong>8-10:</strong> Excellent response with strong examples</p>
                      <p>• <strong>6-7:</strong> Good response, room for improvement</p>
                      <p>• <strong>4-5:</strong> Adequate but lacks depth or clarity</p>
                      <p>• <strong>1-3:</strong> Needs significant improvement</p>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {sessionActive && selectedJob && questions ? (
          <InterviewSession
            jobDescription={selectedJob}
            questions={questions}
            onSessionComplete={handleSessionComplete}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tips" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Interview Tips
              </TabsTrigger>
              <TabsTrigger value="new-interview" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                New Mock Interview
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
                              {job.company ? `${job.title} at ${job.company}` : job.title}
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

            <TabsContent value="tips" className="space-y-6">
              {/* Interview Tips Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Interview Tips & Insights</CardTitle>
                  <CardDescription>
                    Get strategic advice for your job interviews based on selected job descriptions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!jobDescriptions || jobDescriptions.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Upload a job description first to get personalized interview tips.
                      </p>
                    </div>
                  ) : (
                    <>
                       <div className="space-y-4">
                         <Select 
                           value={selectedTipsJobId} 
                           onValueChange={(value) => {
                             setSelectedTipsJobId(value);
                             setInterviewTips(null);
                           }}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="Select a job description for tips..." />
                           </SelectTrigger>
                           <SelectContent>
                              {jobDescriptions.map((job) => (
                                <SelectItem key={job.id} value={job.id}>
                                  {job.company ? `${job.title} at ${job.company}` : job.title}
                                </SelectItem>
                              ))}
                           </SelectContent>
                         </Select>

                         {selectedTipsJobId && !interviewTips && !tipsLoading && (
                           <Button 
                             onClick={() => generateInterviewTips(selectedTipsJobId)}
                             className="w-full"
                             size="lg"
                           >
                             <Target className="mr-2 h-4 w-4" />
                             Generate Interview Tips
                           </Button>
                         )}
                       </div>

                       {tipsLoading && (
                         <div className="flex items-center justify-center py-8">
                           <Loader2 className="h-8 w-8 animate-spin mr-2" />
                           <span>Generating personalized interview tips...</span>
                         </div>
                       )}

                       {interviewTips && selectedTipsJobId && (
                        <div className="space-y-4 mt-6">
                          {/* Job Analysis Section */}
                          <Collapsible defaultOpen={true}>
                            <Card>
                              <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                  <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Target className="h-5 w-5 text-blue-600" />
                                      Job Analysis & Key Focus Areas
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                  </CardTitle>
                                </CardHeader>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <CardContent className="space-y-4">
                                   <div className="bg-blue-50 p-4 rounded-lg">
                                     <h4 className="font-semibold text-blue-900 mb-3">Role: {jobDescriptions?.find(job => job.id === selectedTipsJobId)?.title}</h4>
                                     <div className="grid gap-3 md:grid-cols-2">
                                       <div>
                                         <h5 className="font-medium text-blue-800 mb-2">Key Skills Required:</h5>
                                         <ul className="text-sm text-blue-700 space-y-1">
                                           {interviewTips.jobAnalysis.keySkills.map((skill: string, index: number) => (
                                             <li key={index}>• {skill}</li>
                                           ))}
                                         </ul>
                                       </div>
                                       <div>
                                         <h5 className="font-medium text-blue-800 mb-2">Key Requirements:</h5>
                                         <ul className="text-sm text-blue-700 space-y-1">
                                           {interviewTips.jobAnalysis.requirements.map((req: string, index: number) => (
                                             <li key={index}>• {req}</li>
                                           ))}
                                         </ul>
                                       </div>
                                     </div>
                                     <div className="mt-4">
                                       <h5 className="font-medium text-blue-800 mb-2">Company Culture & Level:</h5>
                                       <p className="text-sm text-blue-700 mb-2">{interviewTips.jobAnalysis.companyCulture}</p>
                                       <p className="text-sm text-blue-700"><strong>Seniority:</strong> {interviewTips.jobAnalysis.seniorityLevel}</p>
                                     </div>
                                   </div>
                                </CardContent>
                              </CollapsibleContent>
                            </Card>
                          </Collapsible>

                          {/* Question Categories */}
                          <Collapsible>
                            <Card>
                              <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                  <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <HelpCircle className="h-5 w-5 text-purple-600" />
                                      Expected Question Categories
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                  </CardTitle>
                                </CardHeader>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <CardContent className="space-y-4">
                                   <div className="grid gap-4 md:grid-cols-2">
                                     <div className="bg-purple-50 p-4 rounded-lg">
                                       <h5 className="font-medium text-purple-900 mb-2">Behavioral Questions</h5>
                                       <ul className="text-sm text-purple-700 space-y-1">
                                         {interviewTips.expectedQuestions.behavioral.map((question: string, index: number) => (
                                           <li key={index}>• {question}</li>
                                         ))}
                                       </ul>
                                     </div>
                                     <div className="bg-green-50 p-4 rounded-lg">
                                       <h5 className="font-medium text-green-900 mb-2">Technical Questions</h5>
                                       <ul className="text-sm text-green-700 space-y-1">
                                         {interviewTips.expectedQuestions.technical.map((question: string, index: number) => (
                                           <li key={index}>• {question}</li>
                                         ))}
                                       </ul>
                                     </div>
                                   </div>
                                   <div className="grid gap-4 md:grid-cols-2 mt-4">
                                     <div className="bg-blue-50 p-4 rounded-lg">
                                       <h5 className="font-medium text-blue-900 mb-2">Company-Specific Questions</h5>
                                       <ul className="text-sm text-blue-700 space-y-1">
                                         {interviewTips.expectedQuestions.companySpecific.map((question: string, index: number) => (
                                           <li key={index}>• {question}</li>
                                         ))}
                                       </ul>
                                     </div>
                                     <div className="bg-yellow-50 p-4 rounded-lg">
                                       <h5 className="font-medium text-yellow-900 mb-2">Culture Fit Questions</h5>
                                       <ul className="text-sm text-yellow-700 space-y-1">
                                         {interviewTips.expectedQuestions.cultureFit.map((question: string, index: number) => (
                                           <li key={index}>• {question}</li>
                                         ))}
                                       </ul>
                                     </div>
                                   </div>
                                </CardContent>
                              </CollapsibleContent>
                            </Card>
                          </Collapsible>

                          {/* Talking Points */}
                          <Collapsible>
                            <Card>
                              <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                  <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-5 w-5 text-orange-600" />
                                      Your Talking Points & Stories
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                  </CardTitle>
                                </CardHeader>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <CardContent className="space-y-4">
                                   <div className="bg-orange-50 p-4 rounded-lg space-y-4">
                                     <div>
                                       <h5 className="font-medium text-orange-900 mb-2">Strengths to Highlight</h5>
                                       <ul className="text-sm text-orange-700 space-y-1">
                                         {interviewTips.talkingPoints.strengthsToHighlight.map((strength: string, index: number) => (
                                           <li key={index}>• {strength}</li>
                                         ))}
                                       </ul>
                                     </div>
                                     <div>
                                       <h5 className="font-medium text-orange-900 mb-2">STAR Story Topics</h5>
                                       <ul className="text-sm text-orange-700 space-y-1">
                                         {interviewTips.talkingPoints.starStories.map((story: string, index: number) => (
                                           <li key={index}>• {story}</li>
                                         ))}
                                       </ul>
                                     </div>
                                     <div>
                                       <h5 className="font-medium text-orange-900 mb-2">Achievement Focus Areas</h5>
                                       <ul className="text-sm text-orange-700 space-y-1">
                                         {interviewTips.talkingPoints.achievements.map((achievement: string, index: number) => (
                                           <li key={index}>• {achievement}</li>
                                         ))}
                                       </ul>
                                     </div>
                                   </div>
                                </CardContent>
                              </CollapsibleContent>
                            </Card>
                          </Collapsible>

                          {/* Questions to Ask */}
                          <Collapsible>
                            <Card>
                              <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                  <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                                      Smart Questions to Ask Interviewers
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                  </CardTitle>
                                </CardHeader>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <CardContent className="space-y-4">
                                   <div className="grid gap-4 md:grid-cols-2">
                                     <div className="bg-yellow-50 p-4 rounded-lg">
                                       <h5 className="font-medium text-yellow-900 mb-2">Role-Specific Questions</h5>
                                       <ul className="text-sm text-yellow-700 space-y-1">
                                         {interviewTips.questionsToAsk.roleSpecific.map((question: string, index: number) => (
                                           <li key={index}>• {question}</li>
                                         ))}
                                       </ul>
                                     </div>
                                     <div className="bg-indigo-50 p-4 rounded-lg">
                                       <h5 className="font-medium text-indigo-900 mb-2">Team & Culture Questions</h5>
                                       <ul className="text-sm text-indigo-700 space-y-1">
                                         {interviewTips.questionsToAsk.teamCulture.map((question: string, index: number) => (
                                           <li key={index}>• {question}</li>
                                         ))}
                                       </ul>
                                     </div>
                                   </div>
                                   <div className="grid gap-4 md:grid-cols-2 mt-4">
                                     <div className="bg-green-50 p-4 rounded-lg">
                                       <h5 className="font-medium text-green-900 mb-2">Growth & Development</h5>
                                       <ul className="text-sm text-green-700 space-y-1">
                                         {interviewTips.questionsToAsk.growthDevelopment.map((question: string, index: number) => (
                                           <li key={index}>• {question}</li>
                                         ))}
                                       </ul>
                                     </div>
                                     <div className="bg-purple-50 p-4 rounded-lg">
                                       <h5 className="font-medium text-purple-900 mb-2">Company Direction</h5>
                                       <ul className="text-sm text-purple-700 space-y-1">
                                         {interviewTips.questionsToAsk.companyDirection.map((question: string, index: number) => (
                                           <li key={index}>• {question}</li>
                                         ))}
                                       </ul>
                                     </div>
                                   </div>
                                </CardContent>
                              </CollapsibleContent>
                            </Card>
                          </Collapsible>

                           {/* Industry Insights */}
                           <Collapsible>
                             <Card>
                               <CollapsibleTrigger asChild>
                                 <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                   <CardTitle className="flex items-center justify-between">
                                     <div className="flex items-center gap-2">
                                       <TrendingUp className="h-5 w-5 text-indigo-600" />
                                       Industry Insights & Preparation
                                     </div>
                                     <ChevronDown className="h-4 w-4" />
                                   </CardTitle>
                                 </CardHeader>
                               </CollapsibleTrigger>
                               <CollapsibleContent>
                                 <CardContent className="space-y-4">
                                   <div className="grid gap-4 md:grid-cols-2">
                                     <div className="bg-indigo-50 p-4 rounded-lg">
                                       <h5 className="font-medium text-indigo-900 mb-2">Industry Trends</h5>
                                       <ul className="text-sm text-indigo-700 space-y-1">
                                         {interviewTips.industryInsights.trends.map((trend: string, index: number) => (
                                           <li key={index}>• {trend}</li>
                                         ))}
                                       </ul>
                                     </div>
                                     <div className="bg-pink-50 p-4 rounded-lg">
                                       <h5 className="font-medium text-pink-900 mb-2">Role Expectations</h5>
                                       <ul className="text-sm text-pink-700 space-y-1">
                                         {interviewTips.industryInsights.roleExpectations.map((expectation: string, index: number) => (
                                           <li key={index}>• {expectation}</li>
                                         ))}
                                       </ul>
                                     </div>
                                   </div>
                                   <div className="grid gap-4 md:grid-cols-2">
                                     <div className="bg-red-50 p-4 rounded-lg">
                                       <h5 className="font-medium text-red-900 mb-2">Skills Gap to Address</h5>
                                       <ul className="text-sm text-red-700 space-y-1">
                                         {interviewTips.industryInsights.skillsGap.map((gap: string, index: number) => (
                                           <li key={index}>• {gap}</li>
                                         ))}
                                       </ul>
                                     </div>
                                     <div className="bg-emerald-50 p-4 rounded-lg">
                                       <h5 className="font-medium text-emerald-900 mb-2">Compensation Tips</h5>
                                       <ul className="text-sm text-emerald-700 space-y-1">
                                         {interviewTips.industryInsights.compensationTips.map((tip: string, index: number) => (
                                           <li key={index}>• {tip}</li>
                                         ))}
                                       </ul>
                                     </div>
                                   </div>
                                 </CardContent>
                               </CollapsibleContent>
                             </Card>
                           </Collapsible>

                           {/* Final Tips */}
                           <Collapsible>
                             <Card>
                               <CollapsibleTrigger asChild>
                                 <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                   <CardTitle className="flex items-center justify-between">
                                     <div className="flex items-center gap-2">
                                       <TrendingUp className="h-5 w-5 text-green-600" />
                                       Day-of-Interview Checklist
                                     </div>
                                     <ChevronDown className="h-4 w-4" />
                                   </CardTitle>
                                 </CardHeader>
                               </CollapsibleTrigger>
                               <CollapsibleContent>
                                 <CardContent className="space-y-4">
                                   <div className="bg-green-50 p-4 rounded-lg">
                                     <h5 className="font-medium text-green-900 mb-3">Interview Day Best Practices</h5>
                                     <div className="grid gap-3 md:grid-cols-2">
                                       <div>
                                         <h6 className="font-medium text-green-800 mb-2">Before the Interview:</h6>
                                         <ul className="text-sm text-green-700 space-y-1">
                                           <li>• Research recent company news</li>
                                           <li>• Review your resume and their job posting</li>
                                           <li>• Prepare physical/digital copies of materials</li>
                                           <li>• Plan your route and arrive 10-15 min early</li>
                                         </ul>
                                       </div>
                                       <div>
                                         <h6 className="font-medium text-green-800 mb-2">During the Interview:</h6>
                                         <ul className="text-sm text-green-700 space-y-1">
                                           <li>• Make eye contact and smile genuinely</li>
                                           <li>• Listen actively and ask clarifying questions</li>
                                           <li>• Take notes to show engagement</li>
                                           <li>• End by asking about next steps</li>
                                         </ul>
                                       </div>
                                     </div>
                                   </div>
                                 </CardContent>
                               </CollapsibleContent>
                             </Card>
                           </Collapsible>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <InterviewAnalytics sessions={interviewSessions || []} />
              <InterviewHistoryTable sessions={interviewSessions || []} />
            </TabsContent>
          </Tabs>
        )}

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          returnUrl={window.location.href}
        />
      </div>
    </DashboardLayout>
  );
};

export default InterviewPrep;