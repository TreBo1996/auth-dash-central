import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { FileText, Calendar, Edit, Trash2, Sparkles, Palette, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { ResumeOptimizer } from '@/components/ResumeOptimizer';
import { ATSScoreDisplay } from '@/components/ATSScoreDisplay';
import { useNavigate } from 'react-router-dom';

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
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [optimizedResumes, setOptimizedResumes] = useState<OptimizedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumesOpen, setResumesOpen] = useState(true);
  const [jobDescriptionsOpen, setJobDescriptionsOpen] = useState(true);
  const [optimizedResumesOpen, setOptimizedResumesOpen] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
    fetchResumes();
    fetchJobDescriptions();
    fetchOptimizedResumes();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchResumes = async () => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('created_at', { ascending: false });

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
      const { data, error } = await supabase
        .from('job_descriptions')
        .select('*')
        .order('created_at', { ascending: false });

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
      const { data, error } = await supabase
        .from('optimized_resumes')
        .select(`
          *,
          resumes(file_name),
          job_descriptions(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our OptimizedResume interface
      const transformedData: OptimizedResume[] = (data || []).map(item => ({
        id: item.id,
        original_resume_id: item.original_resume_id,
        job_description_id: item.job_description_id,
        generated_text: item.generated_text,
        created_at: item.created_at,
        ats_score: item.ats_score,
        ats_feedback: item.ats_feedback ? (item.ats_feedback as unknown as ATSFeedback) : undefined,
        resumes: item.resumes,
        job_descriptions: item.job_descriptions
      }));
      
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
    setOptimizedResumes(prev => 
      prev.map(resume => 
        resume.id === resumeId 
          ? { ...resume, ats_score: newScore, ats_feedback: newFeedback }
          : resume
      )
    );
  };

  const handleDelete = async (id: string, type: 'resume' | 'job-description' | 'optimized-resume') => {
    try {
      let error;
      let itemName: string;

      switch (type) {
        case 'resume':
          ({ error } = await supabase.from('resumes').delete().eq('id', id));
          itemName = 'Resume';
          break;
        case 'job-description':
          ({ error } = await supabase.from('job_descriptions').delete().eq('id', id));
          itemName = 'Job description';
          break;
        case 'optimized-resume':
          ({ error } = await supabase.from('optimized_resumes').delete().eq('id', id));
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
        description: `${itemName} deleted successfully.`,
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.user_metadata?.full_name || user?.email}!
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Manage your resumes and job descriptions from your dashboard.
          </p>
        </div>

        {/* AI Resume Optimizer Section */}
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">AI Resume Optimizer</h2>
          <ResumeOptimizer 
            resumes={resumes}
            jobDescriptions={jobDescriptions}
            onOptimizationComplete={handleOptimizationComplete}
          />
        </div>

        {/* Three Column Layout with Collapsible Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* My Resumes Column */}
          <div className="space-y-4">
            <Collapsible open={resumesOpen} onOpenChange={setResumesOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">My Resumes</h2>
                    <Badge variant="secondary">{resumes.length}</Badge>
                  </div>
                  <ChevronDown className={`h-5 w-5 transition-transform ${resumesOpen ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4">
                {resumes.length === 0 ? (
                  <Card className="border-2 border-dashed border-gray-300">
                    <CardContent className="py-8 md:py-12 text-center px-4">
                      <FileText className="h-10 w-10 md:h-12 md:w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-4 text-sm md:text-base">No resumes uploaded yet</p>
                      <Button asChild className="h-10 md:h-auto">
                        <a href="/upload-resume">Upload Your First Resume</a>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {resumes.map((resume) => (
                      <Card key={resume.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 p-4 md:p-6">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm md:text-base flex items-center gap-2 truncate">
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{resume.file_name || 'Untitled Resume'}</span>
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1 text-xs md:text-sm">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                {formatDate(resume.created_at)}
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs flex-shrink-0">Original</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 p-4 md:p-6 pt-0">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/resume-editor/initial/${resume.id}`)}
                              className="h-9 flex-1 sm:flex-none"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              <span className="sm:inline">Edit</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDelete(resume.id, 'resume')}
                              className="h-9 flex-1 sm:flex-none"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              <span className="sm:inline">Delete</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* My Job Descriptions Column */}
          <div className="space-y-4">
            <Collapsible open={jobDescriptionsOpen} onOpenChange={setJobDescriptionsOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">My Job Descriptions</h2>
                    <Badge variant="secondary">{jobDescriptions.length}</Badge>
                  </div>
                  <ChevronDown className={`h-5 w-5 transition-transform ${jobDescriptionsOpen ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4">
                {jobDescriptions.length === 0 ? (
                  <Card className="border-2 border-dashed border-gray-300">
                    <CardContent className="py-8 md:py-12 text-center px-4">
                      <FileText className="h-10 w-10 md:h-12 md:w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-4 text-sm md:text-base">No job descriptions added yet</p>
                      <Button asChild className="h-10 md:h-auto">
                        <a href="/upload-job">Add Your First Job Description</a>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {jobDescriptions.map((jobDesc) => (
                      <Card key={jobDesc.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 p-4 md:p-6">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{jobDesc.title}</span>
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1 text-xs md:text-sm">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                {formatDate(jobDesc.created_at)}
                              </CardDescription>
                            </div>
                            <Badge variant={jobDesc.source_file_url ? 'default' : 'outline'} className="text-xs flex-shrink-0">
                              {jobDesc.source_file_url ? 'File' : 'Text'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 p-4 md:p-6 pt-0">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button size="sm" variant="outline" className="h-9 flex-1 sm:flex-none">
                              <Edit className="h-3 w-3 mr-1" />
                              <span className="sm:inline">Edit</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDelete(jobDesc.id, 'job-description')}
                              className="h-9 flex-1 sm:flex-none"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              <span className="sm:inline">Delete</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Optimized Resumes Column */}
          <div className="space-y-4">
            <Collapsible open={optimizedResumesOpen} onOpenChange={setOptimizedResumesOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">Optimized Resumes</h2>
                    <Badge variant="secondary">{optimizedResumes.length}</Badge>
                  </div>
                  <ChevronDown className={`h-5 w-5 transition-transform ${optimizedResumesOpen ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4">
                {optimizedResumes.length === 0 ? (
                  <Card className="border-2 border-dashed border-gray-300">
                    <CardContent className="py-8 md:py-12 text-center px-4">
                      <Sparkles className="h-10 w-10 md:h-12 md:w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-4 text-sm md:text-base">No optimized resumes yet</p>
                      <p className="text-xs text-gray-400">Use the AI Resume Optimizer above to create your first optimized resume</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {optimizedResumes.map((optimizedResume) => (
                      <Card key={optimizedResume.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 p-4 md:p-6">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm md:text-base flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate">
                                    {optimizedResume.resumes?.file_name || 'Untitled Resume'}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                                    <span className="truncate">for {optimizedResume.job_descriptions?.title}</span>
                                  </div>
                                </div>
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1 text-xs md:text-sm">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                {formatDate(optimizedResume.created_at)}
                              </CardDescription>
                            </div>
                            <Badge variant="default" className="bg-purple-100 text-purple-700 text-xs flex-shrink-0">
                              AI Optimized
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 p-4 md:p-6 pt-0">
                          {/* ATS Score Display */}
                          <ATSScoreDisplay
                            optimizedResumeId={optimizedResume.id}
                            atsScore={optimizedResume.ats_score}
                            atsFeedback={optimizedResume.ats_feedback}
                            onScoreUpdate={(newScore, newFeedback) => 
                              handleATSScoreUpdate(optimizedResume.id, newScore, newFeedback)
                            }
                          />
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/resume-editor/${optimizedResume.id}`)}
                              className="h-9 flex-1 sm:flex-none"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              <span className="sm:inline">Edit</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => navigate(`/resume-templates/${optimizedResume.id}`)}
                              className="bg-blue-600 hover:bg-blue-700 h-9 flex-1 sm:flex-none"
                            >
                              <Palette className="h-3 w-3 mr-1" />
                              <span className="sm:inline">Format</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDelete(optimizedResume.id, 'optimized-resume')}
                              className="h-9 flex-1 sm:flex-none"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              <span className="sm:inline">Delete</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
