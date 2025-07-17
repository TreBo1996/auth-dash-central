import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sparkles, Loader2, AlertTriangle, Crown, Zap, Star, CheckCircle, TrendingUp, Target, Award, Users, Trophy, BarChart3, FileText, Brain, Lightbulb, ChevronDown, ChevronUp, Rocket, Shield, Upload, PlusCircle, HelpCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { ATSPreviewModal } from './ATSPreviewModal';
import { PaymentModal } from '@/components/subscription/PaymentModal';
import { useFeatureUsage } from '@/hooks/useFeatureUsage';
import type { UserAddition } from './UserAdditionsForm';

interface Resume {
  id: string;
  file_name: string | null;
  parsed_text: string | null;
}
interface JobDescription {
  id: string;
  title: string;
  parsed_text: string;
  company?: string | null;
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
  navigateToEditor?: boolean; // New prop to control navigation
}

export const ResumeOptimizer: React.FC<ResumeOptimizerProps> = ({
  resumes,
  jobDescriptions,
  onOptimizationComplete,
  navigateToEditor = true // Default to true for backward compatibility
}) => {
  const navigate = useNavigate();
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [selectedJobDescId, setSelectedJobDescId] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showATSModal, setShowATSModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [originalATSScore, setOriginalATSScore] = useState<number | undefined>();
  const [originalATSFeedback, setOriginalATSFeedback] = useState<ATSFeedback | undefined>();
  const [isLoadingATS, setIsLoadingATS] = useState(false);
  const [parsedResumeData, setParsedResumeData] = useState<any>(null);
  const [showHowTo, setShowHowTo] = useState(false);
  const { usage, checkFeatureAccess, incrementUsage, isPremium } = useFeatureUsage();
  const { toast } = useToast();
  const handleAnalyzeATS = async () => {
    if (!selectedResumeId || !selectedJobDescId) {
      toast({
        title: "Selection Required",
        description: "Please select both a resume and job description.",
        variant: "destructive"
      });
      return;
    }

    // Check usage limits for free users
    if (!isPremium) {
      const canUse = await checkFeatureAccess('resume_optimizations');
      if (!canUse) {
        const currentUsage = usage.resume_optimizations?.current_usage || 0;
        const limit = usage.resume_optimizations?.limit || 3;
        
        toast({
          title: "Monthly Limit Reached",
          description: `You've used ${currentUsage}/${limit} resume optimizations this month.`,
          variant: "destructive"
        });
        setShowPaymentModal(true);
        return;
      }
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
      
      // Parse resume data for user additions form
      if (data.parsed_resume_data) {
        setParsedResumeData(data.parsed_resume_data);
      }
      
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
  const handleOptimize = async (userAdditions?: UserAddition[]) => {
    if (!selectedResumeId || !selectedJobDescId) {
      return;
    }

    try {
      setIsOptimizing(true);
      console.log('Starting resume optimization...');
      
      // Store user additions in database if provided
      let storedAdditions = null;
      if (userAdditions && userAdditions.length > 0) {
        const { data: userData } = await supabase.auth.getUser();
        const additionsToStore = userAdditions.map(addition => ({
          user_id: userData.user?.id,
          addition_type: addition.addition_type,
          content: addition.content,
          target_experience_title: addition.target_experience_title,
          target_experience_company: addition.target_experience_company
        }));

        const { data: additions, error: additionsError } = await supabase
          .from('user_resume_additions')
          .insert(additionsToStore)
          .select();

        if (additionsError) {
          console.warn('Failed to store user additions:', additionsError);
        } else {
          storedAdditions = additions;
        }
      }
      
      const { data, error } = await supabase.functions.invoke('optimize-resume', {
        body: {
          resumeId: selectedResumeId,
          jobDescriptionId: selectedJobDescId,
          userAdditions: userAdditions || []
        }
      });

      if (error) throw error;
      if (data.error) {
        throw new Error(data.error);
      }

      // Increment usage for free users
      if (!isPremium) {
        await incrementUsage('resume_optimizations');
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

      // Only navigate to editor if navigateToEditor is true
      if (navigateToEditor && data.optimizedResume?.id) {
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
  return <>
      {/* How To Guide Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Info className="h-5 w-5" />
              AI Resume Optimizer
            </CardTitle>
            <Collapsible open={showHowTo} onOpenChange={setShowHowTo}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-purple-700 hover:text-purple-900">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  How It Works
                  {showHowTo ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="bg-white/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</div>
                    <div>
                      <h4 className="font-medium text-purple-900">Upload Your Base Resume</h4>
                      <p className="text-sm text-purple-700">Start by uploading your primary resume file (PDF, DOC, or DOCX)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</div>
                    <div>
                      <h4 className="font-medium text-purple-900">Add Target Job Descriptions</h4>
                      <p className="text-sm text-purple-700">Upload or paste job descriptions for positions you're targeting</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</div>
                    <div>
                      <h4 className="font-medium text-purple-900">Select & Analyze</h4>
                      <p className="text-sm text-purple-700">Choose your resume and target job to get an ATS compatibility score</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">4</div>
                    <div>
                      <h4 className="font-medium text-purple-900">AI Optimization</h4>
                      <p className="text-sm text-purple-700">Our AI will optimize keywords, skills, and formatting for maximum ATS compatibility</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">5</div>
                    <div>
                      <h4 className="font-medium text-purple-900">Export & Apply</h4>
                      <p className="text-sm text-purple-700">Download your optimized resume and start applying with confidence</p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <CardDescription className="text-purple-700">
            Get your resume past ATS systems and into human hands
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Benefits Overview - Always visible */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Rocket className="h-5 w-5" />
            Why Optimize Your Resume?
          </CardTitle>
          <CardDescription className="text-blue-700">
            AI-powered resume optimization to maximize your interview chances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Higher ATS Scores</h4>
                <p className="text-sm text-gray-600">Dramatically improve your Applicant Tracking System compatibility</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Job-Specific Tailoring</h4>
                <p className="text-sm text-gray-600">Customize your resume for each specific role and company</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">AI-Powered Enhancement</h4>
                <p className="text-sm text-gray-600">Advanced algorithms optimize keywords, skills, and formatting</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Professional Formatting</h4>
                <p className="text-sm text-gray-600">Clean, ATS-friendly structure that recruiters love</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Skills Alignment</h4>
                <p className="text-sm text-gray-600">Match your experience with job requirements perfectly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Better Callback Rates</h4>
                <p className="text-sm text-gray-600">Increase your chances of landing interviews significantly</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditional content based on uploads */}
      {availableResumes.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">Upload a resume to get started with AI optimization</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link to="/upload-resume">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resume
                </Link>
              </Button>
              {jobDescriptions.length === 0 && (
                <Button variant="outline" asChild>
                  <Link to="/upload-job">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Job Description
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : jobDescriptions.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">Add a job description to optimize your resume</p>
            <Button asChild>
              <Link to="/upload-job">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Job Description
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Start Optimization
                  </span>
                </CardTitle>
                <CardDescription>
                  Select a resume and job description to see your current ATS score and create an optimized version
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/upload-resume">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New Resume
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/upload-job">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Job Description
                  </Link>
                </Button>
              </div>
            </div>
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
                        {jobDesc.company ? `${jobDesc.title} at ${jobDesc.company}` : jobDesc.title}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleAnalyzeATS} disabled={!selectedResumeId || !selectedJobDescId || isLoadingATS} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
              {isLoadingATS ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Current Score...
                </> : <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze & Optimize Resume
                </>}
            </Button>

            {/* Usage limit info for free users */}
            {!isPremium && usage.resume_optimizations && (
              <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    {usage.resume_optimizations.current_usage}/{usage.resume_optimizations.limit} optimizations used this month
                  </span>
                </div>
                {usage.resume_optimizations.limit_reached && (
                  <Button 
                    size="sm" 
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Upgrade
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ATSPreviewModal 
        isOpen={showATSModal} 
        onClose={() => setShowATSModal(false)} 
        onOptimize={handleOptimize} 
        resumeName={selectedResume?.file_name || 'Untitled Resume'} 
        jobTitle={selectedJobDesc?.title || 'Job Position'} 
        atsScore={originalATSScore} 
        atsFeedback={originalATSFeedback} 
        isLoading={isLoadingATS} 
        isOptimizing={isOptimizing}
        resumeData={parsedResumeData}
      />
      
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        returnUrl={window.location.href}
      />
    </>;
};
