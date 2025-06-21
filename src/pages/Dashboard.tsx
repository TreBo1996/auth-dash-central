import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Edit, Trash2, Sparkles, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { ResumeOptimizer } from '@/components/ResumeOptimizer';
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

interface OptimizedResume {
  id: string;
  original_resume_id: string;
  job_description_id: string;
  generated_text: string;
  created_at: string;
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
      setOptimizedResumes(data || []);
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

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
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
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.user_metadata?.full_name || user?.email}!
          </h1>
          <p className="text-gray-600">
            Manage your resumes and job descriptions from your dashboard.
          </p>
        </div>

        {/* AI Resume Optimizer Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">AI Resume Optimizer</h2>
          <ResumeOptimizer 
            resumes={resumes}
            jobDescriptions={jobDescriptions}
            onOptimizationComplete={handleOptimizationComplete}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Resumes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">My Resumes</h2>
              <Badge variant="secondary">{resumes.length}</Badge>
            </div>
            
            {resumes.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No resumes uploaded yet</p>
                  <Button asChild>
                    <a href="/upload-resume">Upload Your First Resume</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {resumes.map((resume) => (
                  <Card key={resume.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {resume.file_name || 'Untitled Resume'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(resume.created_at)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">Original</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/resume-editor/initial/${resume.id}`)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(resume.id, 'resume')}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* My Job Descriptions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">My Job Descriptions</h2>
              <Badge variant="secondary">{jobDescriptions.length}</Badge>
            </div>
            
            {jobDescriptions.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No job descriptions added yet</p>
                  <Button asChild>
                    <a href="/upload-job">Add Your First Job Description</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobDescriptions.map((jobDesc) => (
                  <Card key={jobDesc.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {jobDesc.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(jobDesc.created_at)}
                          </CardDescription>
                        </div>
                        <Badge variant={jobDesc.source_file_url ? 'default' : 'outline'}>
                          {jobDesc.source_file_url ? 'File' : 'Text'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDelete(jobDesc.id, 'job-description')}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Optimized Resumes Section */}
        {optimizedResumes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Optimized Resumes</h2>
              <Badge variant="secondary">{optimizedResumes.length}</Badge>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-4">
              {optimizedResumes.map((optimizedResume) => (
                <Card key={optimizedResume.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          {optimizedResume.resumes?.file_name || 'Untitled Resume'} → {optimizedResume.job_descriptions?.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(optimizedResume.created_at)}
                        </CardDescription>
                      </div>
                      <Badge variant="default" className="bg-purple-100 text-purple-700">
                        AI Optimized
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/resume-editor/${optimizedResume.id}`)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => navigate(`/resume-templates/${optimizedResume.id}`)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Palette className="h-3 w-3 mr-1" />
                        Format
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(optimizedResume.id, 'optimized-resume')}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
