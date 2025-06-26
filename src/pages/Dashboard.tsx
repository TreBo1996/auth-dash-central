
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calendar, Edit, Trash2, Sparkles, Palette, ChevronDown, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { ResumeOptimizer } from '@/components/ResumeOptimizer';
import { ATSScoreDisplay } from '@/components/ATSScoreDisplay';
import { ContentPreview } from '@/components/ContentPreview';
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
  const [previewContent, setPreviewContent] = useState<{
    content: string;
    title: string;
    type: 'resume' | 'job-description';
  } | null>(null);
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
    }
  };

  const fetchOptimizedResumes = async () => {
    try {
      const { data, error } = await supabase
        .from('optimized_resumes')
        .select(`
          *,
          resumes!inner(file_name),
          job_descriptions!inner(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOptimizedResumes(data || []);
    } catch (error) {
      console.error('Error fetching optimized resumes:', error);
      toast({
        title: "Error",
        description: "Failed to load optimized resumes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async (id: string) => {
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setResumes(resumes.filter(resume => resume.id !== id));
      toast({
        title: "Success",
        description: "Resume deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast({
        title: "Error",
        description: "Failed to delete resume.",
        variant: "destructive"
      });
    }
  };

  const deleteJobDescription = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_descriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setJobDescriptions(jobDescriptions.filter(job => job.id !== id));
      toast({
        title: "Success",
        description: "Job description deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting job description:', error);
      toast({
        title: "Error",
        description: "Failed to delete job description.",
        variant: "destructive"
      });
    }
  };

  const deleteOptimizedResume = async (id: string) => {
    try {
      const { error } = await supabase
        .from('optimized_resumes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOptimizedResumes(optimizedResumes.filter(resume => resume.id !== id));
      toast({
        title: "Success",
        description: "Optimized resume deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting optimized resume:', error);
      toast({
        title: "Error",
        description: "Failed to delete optimized resume.",
        variant: "destructive"
      });
    }
  };

  const handlePreview = (content: string, title: string, type: 'resume' | 'job-description') => {
    setPreviewContent({ content, title, type });
  };

  const handleATSScoreUpdate = (resumeId: string, score: number, feedback: ATSFeedback) => {
    setOptimizedResumes(prev => 
      prev.map(resume => 
        resume.id === resumeId 
          ? { ...resume, ats_score: score, ats_feedback: feedback }
          : resume
      )
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back{user?.email ? `, ${user.email}` : ''}!</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/upload-resume')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Upload Resume
            </Button>
            <Button 
              onClick={() => navigate('/upload-job')}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Upload Job
            </Button>
          </div>
        </div>

        {/* Resume Optimizer */}
        <ResumeOptimizer 
          resumes={resumes}
          jobDescriptions={jobDescriptions}
          onOptimizationComplete={() => {
            fetchOptimizedResumes();
          }}
        />

        {/* Content Sections */}
        <div className="grid gap-6">
          {/* Optimized Resumes Section */}
          <Collapsible open={optimizedResumesOpen} onOpenChange={setOptimizedResumesOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 transition-colors">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">AI-Optimized Resumes</h2>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {optimizedResumes.length}
                </Badge>
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${optimizedResumesOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              {optimizedResumes.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Optimized Resumes Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Use the Resume Optimizer above to create AI-enhanced versions of your resumes tailored to specific job descriptions.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {optimizedResumes.map((optimizedResume) => (
                    <Card key={optimizedResume.id} className="h-[480px] flex flex-col">
                      <CardHeader className="p-3 flex-shrink-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-medium text-gray-900 truncate">
                              {optimizedResume.resumes?.file_name || 'Untitled Resume'}
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-600 mt-0.5">
                              For: {optimizedResume.job_descriptions?.title || 'Unknown Job'}
                            </CardDescription>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {new Date(optimizedResume.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-1.5 py-0.5 shrink-0">
                            AI Optimized
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-3 flex-1 flex flex-col min-h-0">
                        <ScrollArea className="flex-1 -mx-1 px-1">
                          <div className="space-y-2">
                            <ATSScoreDisplay
                              optimizedResumeId={optimizedResume.id}
                              atsScore={optimizedResume.ats_score}
                              atsFeedback={optimizedResume.ats_feedback}
                              onScoreUpdate={(score, feedback) => handleATSScoreUpdate(optimizedResume.id, score, feedback)}
                            />
                            
                            <div className="text-xs text-gray-600 leading-relaxed line-clamp-6">
                              {optimizedResume.generated_text.substring(0, 200)}...
                            </div>
                          </div>
                        </ScrollArea>
                        
                        <div className="flex gap-1.5 mt-3 pt-2 border-t flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreview(optimizedResume.generated_text, `Optimized: ${optimizedResume.resumes?.file_name || 'Resume'}`, 'resume')}
                            className="h-7 px-2 text-xs flex-1"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => navigate('/resume-templates', { 
                              state: { 
                                resumeContent: optimizedResume.generated_text,
                                resumeTitle: `Optimized: ${optimizedResume.resumes?.file_name || 'Resume'}`
                              } 
                            })}
                            className="h-7 px-2 text-xs flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            <Palette className="h-3 w-3 mr-1" />
                            Design
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteOptimizedResume(optimizedResume.id)}
                            className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Original Resumes Section */}
          <Collapsible open={resumesOpen} onOpenChange={setResumesOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-blue-50 rounded-lg border hover:bg-blue-100 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Original Resumes</h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {resumes.length}
                </Badge>
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${resumesOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              {resumes.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Resumes Uploaded</h3>
                    <p className="text-gray-600 mb-4">
                      Upload your first resume to get started with AI optimization.
                    </p>
                    <Button onClick={() => navigate('/upload-resume')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Upload Resume
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {resumes.map((resume) => (
                    <Card key={resume.id}>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-900">
                          {resume.file_name || 'Untitled Resume'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3 w-3" />
                          {new Date(resume.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {resume.parsed_text ? resume.parsed_text.substring(0, 150) + '...' : 'No content available'}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resume.parsed_text && handlePreview(resume.parsed_text, resume.file_name || 'Resume', 'resume')}
                            className="flex-1"
                            disabled={!resume.parsed_text}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate('/resume-editor', { state: { resumeData: resume } })}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteResume(resume.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Job Descriptions Section */}
          <Collapsible open={jobDescriptionsOpen} onOpenChange={setJobDescriptionsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-green-50 rounded-lg border hover:bg-green-100 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Job Descriptions</h2>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {jobDescriptions.length}
                </Badge>
              </div>
              <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${jobDescriptionsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              {jobDescriptions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Job Descriptions</h3>
                    <p className="text-gray-600 mb-4">
                      Upload job descriptions to optimize your resumes for specific positions.
                    </p>
                    <Button onClick={() => navigate('/upload-job')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Upload Job Description
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {jobDescriptions.map((job) => (
                    <Card key={job.id}>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-900">
                          {job.title || job.file_name || 'Untitled Job'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3 w-3" />
                          {new Date(job.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {job.parsed_text ? job.parsed_text.substring(0, 150) + '...' : 'No content available'}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreview(job.parsed_text, job.title || job.file_name || 'Job Description', 'job-description')}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteJobDescription(job.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Content Preview Modal */}
        {previewContent && (
          <ContentPreview
            content={previewContent.content}
            title={previewContent.title}
            type={previewContent.type}
            onClose={() => setPreviewContent(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
