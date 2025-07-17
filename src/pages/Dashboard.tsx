import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AppLoadingScreen } from '@/components/common/AppLoadingScreen';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calendar, Edit, Trash2, Sparkles, Palette, ChevronDown, Eye, Building2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { ResumeOptimizer } from '@/components/ResumeOptimizer';
import { ATSScoreDisplay } from '@/components/ATSScoreDisplay';
import { ContentPreview } from '@/components/ContentPreview';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { ContextualUsageCounter } from '@/components/common/ContextualUsageCounter';
import { useSubscription } from '@/contexts/SubscriptionContext';
interface Resume {
  id: string;
  original_file_url: string | null;
  parsed_text: string | null;
  file_name: string | null;
  created_at: string;
}
interface JobDescription {
  id: string;
  title: string;
  source_file_url: string | null;
  parsed_text: string;
  file_name: string | null;
  created_at: string;
  company: string | null;
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
interface OptimizedResume {
  id: string;
  original_resume_id: string;
  job_description_id: string;
  generated_text: string;
  created_at: string;
  ats_score?: number;
  ats_feedback?: ATSFeedback;
  resumes?: {
    file_name: string | null;
  };
  job_descriptions?: {
    title: string;
    company: string | null;
  };
}
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isLoadingRoles,
    isInitializing
  } = useRole();
  const {
    refreshSubscription
  } = useSubscription();
  const [user, setUser] = useState<User | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [optimizedResumes, setOptimizedResumes] = useState<OptimizedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [resumesOpen, setResumesOpen] = useState(true);
  const [jobDescriptionsOpen, setJobDescriptionsOpen] = useState(true);
  const [optimizedResumesOpen, setOptimizedResumesOpen] = useState(true);
  const [previewContent, setPreviewContent] = useState<{
    content: string;
    title: string;
    type: 'resume' | 'job-description';
  } | null>(null);
  const {
    toast
  } = useToast();

  // Handle Stripe return URLs
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');
    if (paymentStatus === 'success') {
      toast({
        title: "Payment Successful!",
        description: "Welcome to RezLit Premium! Your subscription is now active.",
        variant: "default"
      });

      // Refresh subscription status
      refreshSubscription();

      // Clear URL parameters
      window.history.replaceState({}, '', location.pathname);
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: "Payment Cancelled",
        description: "No worries! You can upgrade to Premium anytime.",
        variant: "default"
      });

      // Clear URL parameters
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search, toast, refreshSubscription]);
  useEffect(() => {
    const initializeDashboard = async () => {
      // Wait for roles to be fully loaded before proceeding
      if (isLoadingRoles || isInitializing) {
        return;
      }
      try {
        console.log('Initializing dashboard data...');
        setLoading(true);

        // Fetch all data concurrently
        await Promise.all([fetchUserData(), fetchResumes(), fetchJobDescriptions(), fetchOptimizedResumes()]);
        setDataLoaded(true);
        console.log('Dashboard data loaded successfully');
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please refresh the page.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    initializeDashboard();
  }, [isLoadingRoles, isInitializing]);
  const showLoadingScreen = isLoadingRoles || isInitializing || loading || !dataLoaded;
  const fetchUserData = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };
  const fetchResumes = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('resumes').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast({
        title: "Error",
        description: "Failed to load resumes.",
        variant: "destructive"
      });
    }
  };
  const fetchJobDescriptions = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('job_descriptions').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setJobDescriptions(data || []);
    } catch (error) {
      console.error('Error fetching job descriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load job descriptions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchOptimizedResumes = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('optimized_resumes').select(`
          *,
          resumes(file_name),
          job_descriptions(title, company)
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;

      // Transform the data to match our OptimizedResume interface with safe array handling
      const transformedData: OptimizedResume[] = (data || []).map(item => {
        // Safely handle ATS feedback with proper array defaults
        let atsFeedback: ATSFeedback | undefined = undefined;
        if (item.ats_feedback && typeof item.ats_feedback === 'object') {
          const feedback = item.ats_feedback as any;
          atsFeedback = {
            overall_score: feedback.overall_score || 0,
            category_scores: {
              keyword_match: feedback.category_scores?.keyword_match || 0,
              skills_alignment: feedback.category_scores?.skills_alignment || 0,
              experience_relevance: feedback.category_scores?.experience_relevance || 0,
              format_compliance: feedback.category_scores?.format_compliance || 0
            },
            recommendations: Array.isArray(feedback.recommendations) ? feedback.recommendations : [],
            keyword_analysis: {
              matched_keywords: Array.isArray(feedback.keyword_analysis?.matched_keywords) ? feedback.keyword_analysis.matched_keywords : [],
              missing_keywords: Array.isArray(feedback.keyword_analysis?.missing_keywords) ? feedback.keyword_analysis.missing_keywords : []
            },
            strengths: Array.isArray(feedback.strengths) ? feedback.strengths : [],
            areas_for_improvement: Array.isArray(feedback.areas_for_improvement) ? feedback.areas_for_improvement : []
          };
        }
        return {
          id: item.id,
          original_resume_id: item.original_resume_id,
          job_description_id: item.job_description_id,
          generated_text: item.generated_text,
          created_at: item.created_at,
          ats_score: item.ats_score,
          ats_feedback: atsFeedback,
          resumes: item.resumes,
          job_descriptions: item.job_descriptions
        };
      });
      setOptimizedResumes(transformedData);
    } catch (error) {
      console.error('Error fetching optimized resumes:', error);
      toast({
        title: "Error",
        description: "Failed to load optimized resumes.",
        variant: "destructive"
      });
    }
  };
  const handleOptimizationComplete = () => {
    fetchOptimizedResumes();
  };
  const handleATSScoreUpdate = (resumeId: string, newScore: number, newFeedback: ATSFeedback) => {
    setOptimizedResumes(prev => prev.map(resume => resume.id === resumeId ? {
      ...resume,
      ats_score: newScore,
      ats_feedback: newFeedback
    } : resume));
  };
  const handleJobDescriptionView = (jobDesc: JobDescription) => {
    setPreviewContent({
      content: jobDesc.parsed_text,
      title: jobDesc.title,
      type: 'job-description'
    });
  };
  const handleDelete = async (id: string, type: 'resume' | 'job-description' | 'optimized-resume') => {
    try {
      let error;
      let itemName: string;
      switch (type) {
        case 'resume':
          ({
            error
          } = await supabase.from('resumes').delete().eq('id', id));
          itemName = 'Resume';
          break;
        case 'job-description':
          ({
            error
          } = await supabase.from('job_descriptions').delete().eq('id', id));
          itemName = 'Job description';
          break;
        case 'optimized-resume':
          ({
            error
          } = await supabase.from('optimized_resumes').delete().eq('id', id));
          itemName = 'Optimized resume';
          break;
        default:
          throw new Error('Invalid item type');
      }
      if (error) throw error;

      // Update state based on type
      if (type === 'resume') {
        setResumes(prev => prev.filter(item => item.id !== id));
      } else if (type === 'job-description') {
        setJobDescriptions(prev => prev.filter(item => item.id !== id));
      } else if (type === 'optimized-resume') {
        setOptimizedResumes(prev => prev.filter(item => item.id !== id));
      }
      toast({
        title: "Deleted",
        description: `${itemName} deleted successfully.`
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete the item.",
        variant: "destructive"
      });
    }
  };
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  if (showLoadingScreen) {
    return <AppLoadingScreen message="Loading Resume Optimizer..." />;
  }
  return <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/80 backdrop-blur-sm rounded-2xl shadow-xl-modern border border-indigo-100/50 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5"></div>
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Resume Optimizer
            </h1>
            <p className="text-base md:text-lg text-gray-600">
              Upload your resume and job descriptions to get AI-powered optimization recommendations.
            </p>
          </div>
        </div>

        {/* Usage Overview */}
        <ContextualUsageCounter features={['resume_optimizations', 'job_descriptions']} />

        {/* AI Resume Optimizer Section */}
        <div className="space-y-4">
          
          <div className="bg-gradient-to-r from-purple-50 via-white to-indigo-50 rounded-xl p-1 shadow-lg relative z-[5]">
            <div className="bg-white rounded-lg">
              <ResumeOptimizer resumes={resumes} jobDescriptions={jobDescriptions} onOptimizationComplete={handleOptimizationComplete} />
            </div>
          </div>
        </div>

        {/* Three Column Layout with Collapsible Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* My Resumes Column */}
          <div className="bg-gradient-to-b from-white to-blue-50/30 rounded-xl border border-blue-200/50 shadow-xl-modern overflow-hidden backdrop-blur-sm">
            <Collapsible open={resumesOpen} onOpenChange={setResumesOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 p-6 transition-all duration-300 border-b border-blue-100/50 py-[24px]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      My Resumes
                    </h2>
                    <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200 font-semibold">
                      {resumes.length}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate('/upload-resume')}
                      className="ml-1 h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${resumesOpen ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="p-6">
                {resumes.length === 0 ? <Card className="border-2 border-dashed border-blue-300/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 hover:border-blue-400/50 transition-colors duration-300">
                    <CardContent className="py-8 md:py-12 text-center px-4">
                      <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full w-fit mx-auto mb-4">
                        <FileText className="h-10 w-10 md:h-12 md:w-12 text-blue-600" />
                      </div>
                      <p className="text-gray-600 mb-4 text-sm md:text-base font-medium">No resumes uploaded yet</p>
                      <Button onClick={() => navigate('/upload-resume')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg">
                        Upload Your First Resume
                      </Button>
                    </CardContent>
                  </Card> : <ScrollArea className="h-[480px]">
                    <div className="space-y-4 pr-4">
                      {resumes.map(resume => <Card key={resume.id} className="bg-slate-50 shadow-md border border-blue-200/40 hover:shadow-card-hover hover:border-blue-400 hover:shadow-blue-200/50 transition-all duration-300">
                          <CardHeader className="pb-3 p-4 md:p-6">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm md:text-base flex items-center gap-2 truncate">
                                  <FileText className="h-4 w-4 flex-shrink-0 text-blue-600" />
                                  <span className="truncate font-semibold text-gray-800">{resume.file_name || 'Untitled Resume'}</span>
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1 text-xs md:text-sm text-gray-500">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  {formatDate(resume.created_at)}
                                </CardDescription>
                              </div>
                              <Badge variant="outline" className="text-xs flex-shrink-0 bg-blue-50 text-blue-700 border-blue-200">
                                Original
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 p-4 md:p-6 pt-0">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button size="sm" variant="outline" onClick={() => navigate(`/resume-editor/initial/${resume.id}`)} className="h-9 flex-1 sm:flex-none border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300">
                                <Edit className="h-3 w-3 mr-1" />
                                <span className="sm:inline">Edit</span>
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(resume.id, 'resume')} className="h-9 flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300">
                                <Trash2 className="h-3 w-3 mr-1" />
                                <span className="sm:inline">Delete</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>)}
                    </div>
                  </ScrollArea>}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* My Job Descriptions Column */}
          <div className="bg-gradient-to-b from-white to-green-50/30 rounded-xl border border-green-200/50 shadow-xl-modern overflow-hidden backdrop-blur-sm">
            <Collapsible open={jobDescriptionsOpen} onOpenChange={setJobDescriptionsOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 p-6 transition-all duration-300 border-b border-green-100/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      My Job Descriptions
                    </h2>
                    <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 font-semibold">
                      {jobDescriptions.length}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate('/upload-job')}
                      className="ml-1 h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${jobDescriptionsOpen ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="p-6">
                {jobDescriptions.length === 0 ? <Card className="border-2 border-dashed border-green-300/50 bg-gradient-to-br from-green-50/50 to-emerald-50/30 hover:border-green-400/50 transition-colors duration-300">
                    <CardContent className="py-8 md:py-12 text-center px-4">
                      <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full w-fit mx-auto mb-4">
                        <FileText className="h-10 w-10 md:h-12 md:w-12 text-green-600" />
                      </div>
                      <p className="text-gray-600 mb-4 text-sm md:text-base font-medium">No job descriptions added yet</p>
                      <Button onClick={() => navigate('/upload-job')} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg">
                        Add Your First Job Description
                      </Button>
                    </CardContent>
                  </Card> : <ScrollArea className="h-[480px]">
                    <div className="space-y-4 pr-4">
                      {jobDescriptions.map(jobDesc => <Card key={jobDesc.id} className="bg-slate-50 shadow-md border border-green-200/40 hover:shadow-card-hover hover:border-green-400 hover:shadow-green-200/50 transition-all duration-300">
                          <CardHeader className="pb-3 p-4 md:p-6">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                                  <FileText className="h-4 w-4 flex-shrink-0 text-green-600" />
                                  <span className="truncate font-semibold text-gray-800">{jobDesc.title}</span>
                                </CardTitle>
                                {jobDesc.company && <CardDescription className="text-sm text-muted-foreground font-medium">
                                    {jobDesc.company}
                                  </CardDescription>}
                                <CardDescription className="flex items-center gap-2 mt-1 text-xs md:text-sm text-gray-500">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  {formatDate(jobDesc.created_at)}
                                </CardDescription>
                              </div>
                              <Badge variant={jobDesc.source_file_url ? 'default' : 'outline'} className={`text-xs flex-shrink-0 ${jobDesc.source_file_url ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                {jobDesc.source_file_url ? 'File' : 'Text'}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 p-4 md:p-6 pt-0">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleJobDescriptionView(jobDesc)} className="h-9 flex-1 sm:flex-none border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300">
                                <Eye className="h-3 w-3 mr-1" />
                                <span className="sm:inline">View</span>
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(jobDesc.id, 'job-description')} className="h-9 flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300">
                                <Trash2 className="h-3 w-3 mr-1" />
                                <span className="sm:inline">Delete</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>)}
                    </div>
                  </ScrollArea>}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Optimized Resumes Column */}
          <div className="bg-gradient-to-b from-white to-purple-50/30 rounded-xl border border-purple-200/50 shadow-xl-modern overflow-hidden backdrop-blur-sm">
            <Collapsible open={optimizedResumesOpen} onOpenChange={setOptimizedResumesOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 p-6 transition-all duration-300 border-b border-purple-100/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Optimized Resumes
                    </h2>
                    <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200 font-semibold">
                      {optimizedResumes.length}
                    </Badge>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${optimizedResumesOpen ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="p-6">
                {optimizedResumes.length === 0 ? <Card className="border-2 border-dashed border-purple-300/50 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 hover:border-purple-400/50 transition-colors duration-300">
                    <CardContent className="py-8 md:py-12 text-center px-4">
                      <div className="p-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full w-fit mx-auto mb-4">
                        <Sparkles className="h-10 w-10 md:h-12 md:w-12 text-purple-600" />
                      </div>
                      <p className="text-gray-600 mb-4 text-sm md:text-base font-medium">No optimized resumes yet</p>
                      <p className="text-xs text-gray-500">Use the AI Resume Optimizer above to create your first optimized resume</p>
                    </CardContent>
                  </Card> : <ScrollArea className="h-[520px]">
                    <div className="space-y-4 pr-4">
                      {optimizedResumes.map(optimizedResume => <Card key={optimizedResume.id} className="bg-slate-50 shadow-md border border-purple-200/40 hover:shadow-card-hover hover:border-purple-400 hover:shadow-purple-200/50 transition-all duration-300">
                          <CardHeader className="pb-3 p-4 md:p-6 py-[5px]">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm md:text-base flex items-start gap-2">
                                  <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                                   <div className="min-w-0 flex-1">
                                     <div className="truncate font-semibold text-gray-800">
                                       {optimizedResume.job_descriptions?.title || 'Job Position'}
                                     </div>
                                   </div>
                                </CardTitle>
                                <CardDescription className="flex flex-col gap-1 mt-1 text-xs md:text-sm text-gray-500">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3 flex-shrink-0" />
                                    {formatDate(optimizedResume.created_at)}
                                  </div>
                                  {optimizedResume.job_descriptions?.company && (
                                    <Badge variant="outline" className="text-xs w-fit bg-slate-50 text-slate-600 border-slate-200">
                                      <Building2 className="h-3 w-3 mr-1" />
                                      {optimizedResume.job_descriptions.company}
                                    </Badge>
                                  )}
                                </CardDescription>
                              </div>
                              <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs flex-shrink-0 font-semibold">
                                AI Optimized
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 p-4 md:p-6 pt-0 px-[10px]">
                            <ATSScoreDisplay optimizedResumeId={optimizedResume.id} atsScore={optimizedResume.ats_score} atsFeedback={optimizedResume.ats_feedback} onScoreUpdate={(newScore, newFeedback) => handleATSScoreUpdate(optimizedResume.id, newScore, newFeedback)} />
                            
                            <div className="flex flex-col sm:flex-row gap-0.5">
                              <Button size="sm" variant="outline" onClick={() => navigate(`/resume-editor/${optimizedResume.id}`)} className="h-6 flex-1 sm:flex-none border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 mx-[5px] px-1.5 text-xs">
                                <Edit className="h-3 w-3 mr-0.5" />
                                <span className="sm:inline">Edit</span>
                              </Button>
                              <Button size="sm" variant="default" onClick={() => navigate(`/resume-templates/${optimizedResume.id}`)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-6 flex-1 sm:flex-none font-semibold mx-[5px] px-1.5 text-xs">
                                <Palette className="h-3 w-3 mr-0.5" />
                                <span className="sm:inline text-right mx- px-[2px]">Export</span>
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(optimizedResume.id, 'optimized-resume')} className="h-6 flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 mx-[5px] px-1.5 text-xs">
                                <Trash2 className="h-3 w-3 mr-0.5" />
                                <span className="sm:inline">Delete</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>)}
                    </div>
                  </ScrollArea>}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>

      {/* Content Preview Modal */}
      {previewContent && <ContentPreview content={previewContent.content} title={previewContent.title} type={previewContent.type} onClose={() => setPreviewContent(null)} />}
    </DashboardLayout>;
};
export default Dashboard;