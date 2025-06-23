
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AudioRecorder } from './AudioRecorder';
import { Brain, Wrench, Star, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Question {
  text: string;
  type: 'behavioral' | 'technical';
}

interface InterviewSessionProps {
  jobDescription: {
    id: string;
    title: string;
    parsed_text: string;
  };
  questions: {
    behavioral: string[];
    technical: string[];
  };
  onSessionComplete: () => void;
}

interface Response {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  type: 'behavioral' | 'technical';
}

export const InterviewSession: React.FC<InterviewSessionProps> = ({
  jobDescription,
  questions,
  onSessionComplete
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      // Combine and shuffle questions (3 behavioral, 2 technical)
      const behavioralQuestions = questions.behavioral.slice(0, 3).map(q => ({ text: q, type: 'behavioral' as const }));
      const technicalQuestions = questions.technical.slice(0, 2).map(q => ({ text: q, type: 'technical' as const }));
      const combinedQuestions = [...behavioralQuestions, ...technicalQuestions];
      
      setAllQuestions(combinedQuestions);

      // Create session in database
      const { data: session, error } = await supabase
        .from('interview_sessions')
        .insert({
          job_description_id: jobDescription.id,
          total_questions: combinedQuestions.length,
          current_question_index: 0,
          session_status: 'in_progress'
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(session.id);
    } catch (error) {
      console.error('Error initializing session:', error);
      toast({
        title: "Session Error",
        description: "Failed to start interview session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTranscription = (text: string) => {
    setCurrentResponse(text);
  };

  const submitResponse = async () => {
    if (!currentResponse.trim() || !sessionId) return;

    setIsProcessing(true);
    try {
      const currentQuestion = allQuestions[currentQuestionIndex];
      
      // Score the response
      const scoreResponse = await supabase.functions.invoke('score-interview-response', {
        body: {
          question: currentQuestion.text,
          response: currentResponse,
          jobDescription: jobDescription.parsed_text,
          questionType: currentQuestion.type
        }
      });

      if (scoreResponse.error) throw scoreResponse.error;

      const scoring = scoreResponse.data;

      // Save response to database
      const { error: responseError } = await supabase
        .from('interview_responses')
        .insert({
          session_id: sessionId,
          question_text: currentQuestion.text,
          question_type: currentQuestion.type,
          question_index: currentQuestionIndex,
          user_response_text: currentResponse,
          score: scoring.overall_score,
          feedback: scoring.feedback,
          job_relevance_score: scoring.job_relevance_score,
          clarity_score: scoring.clarity_score,
          examples_score: scoring.examples_score
        });

      if (responseError) throw responseError;

      // Add to local responses
      const newResponse: Response = {
        question: currentQuestion.text,
        answer: currentResponse,
        score: scoring.overall_score,
        feedback: scoring.feedback,
        type: currentQuestion.type
      };

      setResponses(prev => [...prev, newResponse]);
      setCurrentResponse('');

      // Move to next question or complete session
      if (currentQuestionIndex < allQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        
        // Update session progress
        await supabase
          .from('interview_sessions')
          .update({ current_question_index: currentQuestionIndex + 1 })
          .eq('id', sessionId);
      } else {
        await completeSession();
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit your response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const completeSession = async () => {
    if (!sessionId) return;

    try {
      const averageScore = responses.reduce((sum, r) => sum + r.score, 0) / responses.length;
      
      await supabase
        .from('interview_sessions')
        .update({
          session_status: 'completed',
          completed_at: new Date().toISOString(),
          overall_score: averageScore
        })
        .eq('id', sessionId);

      setSessionCompleted(true);
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  if (sessionCompleted) {
    const averageScore = responses.reduce((sum, r) => sum + r.score, 0) / responses.length;
    
    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Interview Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Star className="h-8 w-8 text-yellow-500" />
              <span className="text-3xl font-bold">{averageScore.toFixed(1)}/10</span>
            </div>
            <p className="text-gray-600">Great job completing your mock interview!</p>
            <Button onClick={onSessionComplete} className="mt-4">
              View Detailed Results
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Session Summary</h3>
          {responses.map((response, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={response.type === 'behavioral' ? 'default' : 'secondary'}>
                    {response.type === 'behavioral' ? (
                      <><Brain className="h-3 w-3 mr-1" /> Behavioral</>
                    ) : (
                      <><Wrench className="h-3 w-3 mr-1" /> Technical</>
                    )}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{response.score}/10</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">{response.question}</p>
                <p className="text-sm font-medium text-green-700">{response.feedback}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!allQuestions.length) {
    return <div className="text-center">Loading interview questions...</div>;
  }

  const currentQuestion = allQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / allQuestions.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-lg">Mock Interview Session</CardTitle>
            <Badge variant="outline">
              Question {currentQuestionIndex + 1} of {allQuestions.length}
            </Badge>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      {/* Current Question */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            {currentQuestion.type === 'behavioral' ? (
              <><Brain className="h-5 w-5" /> <span>Behavioral Question</span></>
            ) : (
              <><Wrench className="h-5 w-5" /> <span>Technical Question</span></>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-lg font-medium">{currentQuestion.text}</p>
            </div>
            
            <AudioRecorder
              onTranscription={handleTranscription}
              isRecording={isRecording}
              onRecordingStateChange={setIsRecording}
              disabled={isProcessing}
            />

            {currentResponse && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Your Response:
                </h4>
                <p className="text-gray-700">{currentResponse}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={submitResponse}
                disabled={!currentResponse.trim() || isProcessing || isRecording}
                className="flex-1"
              >
                {isProcessing ? 'Processing...' : 'Submit & Continue'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Previous Responses */}
      {responses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Previous Responses</h3>
          {responses.map((response, index) => (
            <Card key={index} className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={response.type === 'behavioral' ? 'default' : 'secondary'}>
                    {response.type}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{response.score}/10</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-green-700">{response.feedback}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
