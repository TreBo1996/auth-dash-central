import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  FileText, 
  Mail, 
  CheckCircle, 
  Plus,
  Target,
  Award,
  BarChart3,
  Lightbulb,
  Search,
  Filter,
  Briefcase
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { JobHubCard } from '@/components/job-hub/JobHubCard';
import { JobHubMetrics } from '@/components/job-hub/JobHubMetrics';
import { JobHubSuggestions } from '@/components/job-hub/JobHubSuggestions';

interface JobDescription {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  salary_range: string | null;
  parsed_text: string;
  source: string | null;
  job_url: string | null;
  created_at: string;
  is_applied?: boolean;
  is_saved?: boolean;
  optimized_resumes?: any[];
  cover_letters?: any[];
}

const JobHub: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (user) {
      fetchJobDescriptions();
    }
  }, [user]);

  const fetchJobDescriptions = async () => {
    try {
      setLoading(true);
      
      // Fetch job descriptions with related optimized resumes and cover letters
      const { data: jobDescriptions, error } = await supabase
        .from('job_descriptions')
        .select(`
          *,
          optimized_resumes(id, ats_score, job_fit_level, created_at),
          cover_letters(id, title, generated_text, created_at)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setJobs(jobDescriptions || []);
    } catch (error) {
      console.error('Error fetching job descriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load job descriptions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshJobs = () => {
    fetchJobDescriptions();
  };

  const handleStatusUpdate = async (jobId: string, field: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('job_descriptions')
        .update({ [field]: value })
        .eq('id', jobId)
        .eq('user_id', user!.id);

      if (error) throw error;

      // Update local state
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, [field]: value } : job
      ));

      toast({
        title: "Updated",
        description: `Job ${field === 'is_applied' ? 'application status' : 'save status'} updated successfully.`
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: "Failed to update job status.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      // First, delete related data in the correct order to handle foreign key constraints
      
      // Delete resume sections, skills, experiences, certifications, education
      const { data: optimizedResumes } = await supabase
        .from('optimized_resumes')
        .select('id')
        .eq('job_description_id', jobId)
        .eq('user_id', user!.id);

      if (optimizedResumes && optimizedResumes.length > 0) {
        const resumeIds = optimizedResumes.map(r => r.id);
        
        // Delete resume sections
        await supabase
          .from('resume_sections')
          .delete()
          .in('optimized_resume_id', resumeIds);

        // Delete resume skills
        await supabase
          .from('resume_skills')
          .delete()
          .in('optimized_resume_id', resumeIds);

        // Delete resume experiences
        await supabase
          .from('resume_experiences')
          .delete()
          .in('optimized_resume_id', resumeIds);

        // Delete resume certifications
        await supabase
          .from('resume_certifications')
          .delete()
          .in('optimized_resume_id', resumeIds);

        // Delete resume education
        await supabase
          .from('resume_education')
          .delete()
          .in('optimized_resume_id', resumeIds);
      }

      // Delete interview responses first, then sessions
      const { data: interviewSessions } = await supabase
        .from('interview_sessions')
        .select('id')
        .eq('job_description_id', jobId)
        .eq('user_id', user!.id);

      if (interviewSessions && interviewSessions.length > 0) {
        const sessionIds = interviewSessions.map(s => s.id);
        
        await supabase
          .from('interview_responses')
          .delete()
          .in('session_id', sessionIds);

        await supabase
          .from('interview_sessions')
          .delete()
          .in('id', sessionIds);
      }

      // Delete cover letters
      await supabase
        .from('cover_letters')
        .delete()
        .eq('job_description_id', jobId)
        .eq('user_id', user!.id);

      // Delete optimized resumes
      await supabase
        .from('optimized_resumes')
        .delete()
        .eq('job_description_id', jobId)
        .eq('user_id', user!.id);

      // Finally, delete the job description
      const { error } = await supabase
        .from('job_descriptions')
        .delete()
        .eq('id', jobId)
        .eq('user_id', user!.id);

      if (error) throw error;

      // Remove from local state
      setJobs(prev => prev.filter(job => job.id !== jobId));

      toast({
        title: "Deleted",
        description: "Job and all related data have been successfully deleted."
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "Failed to delete job. Please try again.",
        variant: "destructive"
      });
      throw error; // Re-throw to handle in the card component
    }
  };

  const getFilteredJobs = () => {
    switch (activeTab) {
      case 'pending':
        return jobs.filter(job => !job.is_applied);
      case 'applied':
        return jobs.filter(job => job.is_applied);
      case 'with-stack':
        return jobs.filter(job => 
          job.optimized_resumes && job.optimized_resumes.length > 0 &&
          job.cover_letters && job.cover_letters.length > 0
        );
      default:
        return jobs;
    }
  };

  const filteredJobs = getFilteredJobs();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Job Hub
            </h1>
            <p className="text-gray-600 mt-1">
              Track your applications, manage your job pipeline, and optimize your application stack
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/job-search')}
              className="hover:bg-blue-50"
            >
              <Search className="h-4 w-4 mr-2" />
              Find More Jobs
            </Button>
            <Button 
              onClick={() => navigate('/upload-job')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Job
            </Button>
          </div>
        </div>

        {/* Metrics Dashboard */}
        <JobHubMetrics jobs={jobs} />

        {/* Smart Suggestions */}
        <JobHubSuggestions jobs={jobs} />

        {/* Job Listings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Your Job Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  All Jobs ({jobs.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({jobs.filter(j => !j.is_applied).length})
                </TabsTrigger>
                <TabsTrigger value="applied">
                  Applied ({jobs.filter(j => j.is_applied).length})
                </TabsTrigger>
                <TabsTrigger value="with-stack">
                  With Stack ({jobs.filter(j => 
                    j.optimized_resumes && j.optimized_resumes.length > 0 &&
                    j.cover_letters && j.cover_letters.length > 0
                  ).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeTab === 'all' ? 'No jobs yet' : `No ${activeTab} jobs`}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {activeTab === 'all' 
                        ? 'Start by uploading job descriptions or searching for jobs.'
                        : `You haven't ${activeTab === 'applied' ? 'applied to' : activeTab === 'pending' ? 'found pending' : 'created application stacks for'} any jobs yet.`
                      }
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/upload-job')}
                      >
                        Upload Job Description
                      </Button>
                      <Button 
                        onClick={() => navigate('/job-search')}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        Search Jobs
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
                    {filteredJobs.map((job) => (
                      <JobHubCard 
                        key={job.id} 
                        job={job} 
                        onStatusUpdate={handleStatusUpdate}
                        onRefresh={refreshJobs}
                        onDelete={handleDeleteJob}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default JobHub;