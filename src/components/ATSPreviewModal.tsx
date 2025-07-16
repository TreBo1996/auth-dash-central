import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, TrendingUp, AlertCircle, Target, Zap, FileText, CheckCircle } from 'lucide-react';
import { ATSInfoTooltip } from '@/components/common/ATSInfoTooltip';
import { UserAdditionsForm, UserAddition } from './UserAdditionsForm';
import { supabase } from '@/integrations/supabase/client';
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
interface ATSPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOptimize: (userAdditions?: UserAddition[]) => void;
  resumeName: string;
  jobTitle: string;
  atsScore?: number;
  atsFeedback?: ATSFeedback;
  isLoading: boolean;
  isOptimizing: boolean;
  resumeData?: {
    experience?: Array<{
      title: string;
      company: string;
      duration: string;
      bullets: string[];
    }>;
  };
}
export const ATSPreviewModal: React.FC<ATSPreviewModalProps> = ({
  isOpen,
  onClose,
  onOptimize,
  resumeName,
  jobTitle,
  atsScore,
  atsFeedback,
  isLoading,
  isOptimizing,
  resumeData
}) => {
  const [optimizationStep, setOptimizationStep] = useState(0);
  const [userAdditions, setUserAdditions] = useState<UserAddition[]>([]);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const handleOptimize = () => {
    // Scroll to top to show the loading screen
    modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    onOptimize(userAdditions);
  };

  // Prevent tab switching during optimization
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isOptimizing) {
        e.preventDefault();
        e.returnValue = 'Resume optimization is in progress. Are you sure you want to leave?';
      }
    };

    if (isOptimizing) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isOptimizing]);

  const optimizationSteps = [
    { icon: <TrendingUp className="h-5 w-5" />, text: "Analyzing resume content..." },
    { icon: <Zap className="h-5 w-5" />, text: "Enhancing keywords and phrases..." },
    { icon: <FileText className="h-5 w-5" />, text: "Optimizing format and structure..." },
    { icon: <CheckCircle className="h-5 w-5" />, text: "Finalizing your optimized resume..." }
  ];

  useEffect(() => {
    if (isOptimizing) {
      setOptimizationStep(0);
      const interval = setInterval(() => {
        setOptimizationStep(prev => (prev + 1) % optimizationSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isOptimizing]);
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };
  const getExpectedImprovement = (currentScore?: number) => {
    if (!currentScore) return 85;
    // AI optimization should improve score by 10-15 points minimum
    return Math.min(95, currentScore + 15);
  };
  return <Dialog open={isOpen} onOpenChange={isOptimizing ? undefined : onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" ref={modalContentRef}>
        {/* Optimization Loading Overlay */}
        {isOptimizing && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Creating Your Optimized Resume</h3>
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  {optimizationSteps[optimizationStep].icon}
                  <span>{optimizationSteps[optimizationStep].text}</span>
                </div>
              </div>
              <Progress value={(optimizationStep + 1) * 25} className="w-full" />
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Please keep this tab active and don't switch tabs until optimization is complete
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  This usually takes 30-60 seconds. Switching tabs may interrupt the process.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Current ATS Score Analysis
            <ATSInfoTooltip size="md" />
          </DialogTitle>
          <DialogDescription>
            Review how your current resume performs against this job description before AI optimization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resume and Job Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium truncate">{resumeName}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Job Position</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium truncate">{jobTitle}</p>
              </CardContent>
            </Card>
          </div>

          {isLoading ? <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-6 max-w-md mx-auto">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground">Analyzing Your Resume Against Job Requirements</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p className="text-sm">Our AI is scanning your resume to identify:</p>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-primary" />
                        <span>Keyword matches and optimization opportunities</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3 text-primary" />
                        <span>Format compliance with ATS systems</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-primary" />
                        <span>Skills alignment and experience relevance</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-medium">Analysis in progress...</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This analysis typically takes 25-40 seconds
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>Why this matters:</strong> 95% of large companies use ATS systems to filter resumes. 
                    Our analysis ensures your resume passes these automated screenings.
                  </p>
                </div>
              </div>
            </div> : atsScore !== undefined && atsFeedback ? <>
              {/* Current vs Expected Score Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span>Current ATS Score</span>
                        <ATSInfoTooltip />
                      </div>
                      <Badge variant={getScoreBadgeVariant(atsScore)}>
                        {atsScore}/100
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={atsScore} className="h-3 mb-2" />
                    <p className="text-sm text-gray-600">
                      {atsScore >= 80 ? "Good score, but optimization can still improve it!" : atsScore >= 60 ? "Decent foundation with significant room for improvement." : "Major optimization needed to improve your chances."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-green-800">
                      <span className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Expected After AI Optimization
                      </span>
                      <Badge className="bg-green-600 text-white">
                        {getExpectedImprovement(atsScore)}/100
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={getExpectedImprovement(atsScore)} className="h-3 mb-2" />
                    <p className="text-sm text-green-700">
                      Our AI will enhance keywords, improve bullet points, and optimize formatting for ATS systems.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Category Scores */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-1">
                    Current Score Breakdown
                    <ATSInfoTooltip />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(atsFeedback.category_scores).map(([category, score]) => <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">
                          {category.replace('_', ' ')}
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                          {score}/100
                        </span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>)}
                </CardContent>
              </Card>

              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {atsFeedback.strengths.length > 0 && <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-green-600">Current Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1">
                        {atsFeedback.strengths.slice(0, 3).map((strength, index) => <li key={index} className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{strength}</span>
                          </li>)}
                      </ul>
                    </CardContent>
                  </Card>}

                {atsFeedback.areas_for_improvement.length > 0 && <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-orange-600">AI Will Improve</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1">
                        {atsFeedback.areas_for_improvement.slice(0, 3).map((area, index) => <li key={index} className="flex items-start gap-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>{area}</span>
                          </li>)}
                      </ul>
                    </CardContent>
                  </Card>}
              </div>

              {/* Keywords Analysis */}
              {atsFeedback.keyword_analysis && <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Keyword Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {atsFeedback.keyword_analysis.matched_keywords.length > 0 && <div>
                        <h4 className="text-sm font-medium text-green-600 mb-2">Matched Keywords</h4>
                        <div className="flex flex-wrap gap-1">
                          {atsFeedback.keyword_analysis.matched_keywords.slice(0, 10).map((keyword, index) => <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>)}
                        </div>
                      </div>}
                    {atsFeedback.keyword_analysis.missing_keywords.length > 0 && <div>
                        <h4 className="text-sm font-medium text-red-600 mb-2">Missing Keywords (AI Will Add)</h4>
                        <div className="flex flex-wrap gap-1">
                          {atsFeedback.keyword_analysis.missing_keywords.slice(0, 10).map((keyword, index) => <Badge key={index} variant="outline" className="text-xs border-red-200">
                              {keyword}
                            </Badge>)}
                        </div>
                      </div>}
                  </CardContent>
                </Card>}

              {/* User Additions Form */}
              {resumeData?.experience && resumeData.experience.length > 0 && (
                <UserAdditionsForm
                  experiences={resumeData.experience}
                  additions={userAdditions}
                  onAdditionsChange={setUserAdditions}
                />
              )}
              
            </> : <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Unable to analyze resume at this time.</p>
              </CardContent>
            </Card>}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isOptimizing}>
              Cancel
            </Button>
            <Button onClick={handleOptimize} disabled={isOptimizing || isLoading} className="bg-purple-600 hover:bg-purple-700">
              {isOptimizing ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing Resume...
                </> : <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimize Resume with AI
                  {userAdditions.length > 0 && (
                    <Badge className="ml-2 bg-green-600">
                      +{userAdditions.length}
                    </Badge>
                  )}
                </>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};