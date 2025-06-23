
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Brain, Wrench, MessageSquare, Star, Target, Eye, Lightbulb, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InterviewResponse {
  id: string;
  question_text: string;
  question_type: 'behavioral' | 'technical';
  question_index: number;
  user_response_text: string;
  score: number;
  feedback: string;
  job_relevance_score: number | null;
  clarity_score: number | null;
  examples_score: number | null;
  response_duration_seconds: number | null;
}

interface InterviewSessionDetailProps {
  sessionId: string;
}

export const InterviewSessionDetail: React.FC<InterviewSessionDetailProps> = ({ sessionId }) => {
  const { toast } = useToast();
  const [exampleResponses, setExampleResponses] = useState<Record<string, string>>({});
  const [loadingExamples, setLoadingExamples] = useState<Record<string, boolean>>({});
  const [expandedExamples, setExpandedExamples] = useState<Record<string, boolean>>({});

  const { data: responses, isLoading, error } = useQuery({
    queryKey: ['interview-responses', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interview_responses')
        .select('*')
        .eq('session_id', sessionId)
        .order('question_index', { ascending: true });

      if (error) throw error;
      return data as InterviewResponse[];
    },
    enabled: !!sessionId,
  });

  // Get job title for context
  const { data: sessionData } = useQuery({
    queryKey: ['interview-session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select(`
          job_descriptions(title)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const generateExampleResponse = async (response: InterviewResponse) => {
    setLoadingExamples(prev => ({ ...prev, [response.id]: true }));
    
    try {
      const result = await supabase.functions.invoke('generate-example-response', {
        body: {
          question: response.question_text,
          questionType: response.question_type,
          feedback: response.feedback,
          jobTitle: sessionData?.job_descriptions?.title || 'Software Engineer'
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      setExampleResponses(prev => ({
        ...prev,
        [response.id]: result.data.exampleResponse
      }));

      setExpandedExamples(prev => ({
        ...prev,
        [response.id]: true
      }));

      toast({
        title: "Example Generated!",
        description: "AI has created a perfect 10/10 example response for this question.",
      });

    } catch (error) {
      console.error('Error generating example response:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate example response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingExamples(prev => ({ ...prev, [response.id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 border-t bg-gray-50">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading interview details...</span>
        </div>
      </div>
    );
  }

  if (error || !responses) {
    return (
      <div className="p-6 border-t bg-gray-50">
        <div className="text-center py-8">
          <p className="text-red-600">Failed to load interview details</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 8) return 'default';
    if (score >= 6) return 'secondary';
    return 'destructive';
  };

  const behavioralResponses = responses.filter(r => r.question_type === 'behavioral');
  const technicalResponses = responses.filter(r => r.question_type === 'technical');

  return (
    <div className="p-6 border-t bg-gray-50 space-y-6">
      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Behavioral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {behavioralResponses.length} questions
            </div>
            {behavioralResponses.length > 0 && (
              <div className="text-sm text-gray-600">
                Avg: {(behavioralResponses.reduce((sum, r) => sum + r.score, 0) / behavioralResponses.length).toFixed(1)}/10
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Technical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {technicalResponses.length} questions
            </div>
            {technicalResponses.length > 0 && (
              <div className="text-sm text-gray-600">
                Avg: {(technicalResponses.reduce((sum, r) => sum + r.score, 0) / technicalResponses.length).toFixed(1)}/10
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Best Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {Math.max(...responses.map(r => r.score)).toFixed(1)}/10
            </div>
            <div className="text-sm text-gray-600">
              Question {responses.find(r => r.score === Math.max(...responses.map(r => r.score)))?.question_index! + 1}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {Math.min(...responses.map(r => r.score)).toFixed(1)}/10
            </div>
            <div className="text-sm text-gray-600">
              Focus area
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Responses */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Question Responses
        </h3>
        
        {responses.map((response, index) => (
          <Card key={response.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={response.question_type === 'behavioral' ? 'default' : 'secondary'}>
                      {response.question_type === 'behavioral' ? (
                        <><Brain className="h-3 w-3 mr-1" /> Behavioral</>
                      ) : (
                        <><Wrench className="h-3 w-3 mr-1" /> Technical</>
                      )}
                    </Badge>
                    <span className="text-sm text-gray-600">Question {response.question_index + 1}</span>
                  </div>
                  <CardTitle className="text-base">{response.question_text}</CardTitle>
                </div>
                <Badge variant={getScoreBadgeVariant(response.score)}>
                  <Star className="w-3 h-3 mr-1" />
                  {response.score}/10
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Response */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Your Response:
                </h4>
                <p className="text-sm text-gray-700">{response.user_response_text}</p>
              </div>

              {/* AI Feedback */}
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    AI Feedback:
                  </h4>
                  {!exampleResponses[response.id] && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateExampleResponse(response)}
                      disabled={loadingExamples[response.id]}
                      className="text-xs"
                    >
                      {loadingExamples[response.id] ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-1" />
                          Generate 10/10 Example
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-700">{response.feedback}</p>
              </div>

              {/* AI Example Response */}
              {exampleResponses[response.id] && (
                <Collapsible 
                  open={expandedExamples[response.id]} 
                  onOpenChange={(open) => setExpandedExamples(prev => ({ ...prev, [response.id]: open }))}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between bg-amber-50 hover:bg-amber-100 border border-amber-200">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-800">AI-Generated Perfect Response Example</span>
                      </div>
                      {expandedExamples[response.id] ? 
                        <ChevronUp className="h-4 w-4 text-amber-600" /> : 
                        <ChevronDown className="h-4 w-4 text-amber-600" />
                      }
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="bg-amber-50 border border-amber-200 border-t-0 rounded-b-lg p-3">
                    <p className="text-xs text-amber-700 mb-2 italic">
                      This is an AI-generated example of what a perfect 10/10 response might look like. Use it as a reference for improvement.
                    </p>
                    <p className="text-sm text-gray-800">{exampleResponses[response.id]}</p>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Score Breakdown */}
              {(response.job_relevance_score || response.clarity_score || response.examples_score) && (
                <div className="grid gap-2 md:grid-cols-3">
                  {response.job_relevance_score && (
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">Job Relevance</div>
                      <div className={`text-lg font-bold ${getScoreColor(response.job_relevance_score)}`}>
                        {response.job_relevance_score}/10
                      </div>
                    </div>
                  )}
                  {response.clarity_score && (
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">Clarity</div>
                      <div className={`text-lg font-bold ${getScoreColor(response.clarity_score)}`}>
                        {response.clarity_score}/10
                      </div>
                    </div>
                  )}
                  {response.examples_score && (
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">Examples</div>
                      <div className={`text-lg font-bold ${getScoreColor(response.examples_score)}`}>
                        {response.examples_score}/10
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
