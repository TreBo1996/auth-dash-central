import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, RefreshCw, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
interface ATSScoreDisplayProps {
  optimizedResumeId: string;
  atsScore?: number;
  atsFeedback?: ATSFeedback;
  onScoreUpdate?: (score: number, feedback: ATSFeedback) => void;
}
export const ATSScoreDisplay: React.FC<ATSScoreDisplayProps> = ({
  optimizedResumeId,
  atsScore,
  atsFeedback,
  onScoreUpdate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRescoring, setIsRescoring] = useState(false);
  const {
    toast
  } = useToast();
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };
  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };
  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };
  const handleRescore = async () => {
    setIsRescoring(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('calculate-ats-score', {
        body: {
          optimizedResumeId
        }
      });
      if (error) throw error;
      if (data.success && onScoreUpdate) {
        onScoreUpdate(data.ats_score, data.ats_feedback);
        toast({
          title: "Score Updated",
          description: `New ATS score: ${data.ats_score}/100`
        });
      }
    } catch (error) {
      console.error('Error rescoring:', error);
      toast({
        title: "Error",
        description: "Failed to recalculate ATS score.",
        variant: "destructive"
      });
    } finally {
      setIsRescoring(false);
    }
  };
  if (!atsScore) {
    return <div className="flex items-center gap-2 text-sm text-gray-500">
        <Target className="h-4 w-4" />
        <span>No ATS score available</span>
        <Button size="sm" variant="outline" onClick={handleRescore} disabled={isRescoring} className="h-7">
          {isRescoring ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Score Now'}
        </Button>
      </div>;
  }
  return <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-4 w-4" />
          <span className="text-sm font-medium">ATS Score:</span>
          <div className="flex items-center gap-2">
            <div className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-sm font-medium transition-colors", getScoreColor(atsScore))}>
              {atsScore}/100
            </div>
            <span className={cn("text-xs font-medium", getScoreTextColor(atsScore))}>
              {getScoreLabel(atsScore)}
            </span>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={handleRescore} disabled={isRescoring} className="h-7 px-[2px]">
          {isRescoring ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        </Button>
      </div>

      {atsFeedback && <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between h-7 px-2">
              <span className="text-xs">View Details</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 mt-2">
            <Card className="border-gray-200">
              <CardContent className="p-3 space-y-3">
                {/* Category Scores */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Score Breakdown</h4>
                  {Object.entries(atsFeedback.category_scores).map(([category, score]) => <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{category.replace('_', ' ')}</span>
                        <span className={getScoreTextColor(score)}>{score}/100</span>
                      </div>
                      <Progress value={score} className="h-1" />
                    </div>)}
                </div>

                {/* Keywords */}
                {atsFeedback.keyword_analysis && <div className="space-y-2">
                    <h4 className="text-sm font-medium">Keywords</h4>
                    {atsFeedback.keyword_analysis.matched_keywords.length > 0 && <div>
                        <div className="flex items-center gap-1 mb-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-700">Matched</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {atsFeedback.keyword_analysis.matched_keywords.slice(0, 5).map((keyword, index) => <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                              {keyword}
                            </Badge>)}
                        </div>
                      </div>}
                    {atsFeedback.keyword_analysis.missing_keywords.length > 0 && <div>
                        <div className="flex items-center gap-1 mb-1">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-700">Missing</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {atsFeedback.keyword_analysis.missing_keywords.slice(0, 5).map((keyword, index) => <Badge key={index} variant="outline" className="text-xs px-1 py-0 border-red-200">
                              {keyword}
                            </Badge>)}
                        </div>
                      </div>}
                  </div>}

                {/* Recommendations */}
                {atsFeedback.recommendations && atsFeedback.recommendations.length > 0 && <div className="space-y-2">
                    <h4 className="text-sm font-medium">Top Recommendations</h4>
                    <ul className="space-y-1">
                      {atsFeedback.recommendations.slice(0, 3).map((rec, index) => <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>)}
                    </ul>
                  </div>}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>}
    </div>;
};