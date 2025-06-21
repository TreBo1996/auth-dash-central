
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Eye, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { LoadingFallback } from '@/components/LoadingFallback';
import { SimpleErrorBoundary } from '@/components/SimpleErrorBoundary';
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

const Dashboard: React.FC = () => {
  console.log('Dashboard: Component rendering...');
  
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Dashboard: useEffect triggered, initializing...');
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      console.log('Dashboard: Starting initialization...');
      setLoading(true);
      setError(null);
      
      // First, get user data
      console.log('Dashboard: Fetching user data...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Dashboard: User fetch error:', userError);
        throw userError;
      }
      
      if (!user) {
        console.error('Dashboard: No user found');
        setError('No authenticated user found');
        setLoading(false);
        return;
      }
      
      console.log('Dashboard: User found:', user.email);
      setUser(user);
      
      // Then fetch data sequentially to avoid overwhelming the database
      console.log('Dashboard: Fetching resumes...');
      await fetchResumes();
      
      console.log('Dashboard: Fetching job descriptions...');
      await fetchJobDescriptions();
      
      console.log('Dashboard: Initialization complete');
      
    } catch (err) {
      console.error('Dashboard: Initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10); // Limit to improve performance

      if (error) {
        console.error('Dashboard: Resumes fetch error:', error);
        throw error;
      }
      
      console.log('Dashboard: Resumes fetched:', data?.length || 0);
      setResumes(data || []);
    } catch (error) {
      console.error('Dashboard: Error in fetchResumes:', error);
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
        .order('created_at', { ascending: false })
        .limit(10); // Limit to improve performance

      if (error) {
        console.error('Dashboard: Job descriptions fetch error:', error);
        throw error;
      }
      
      console.log('Dashboard: Job descriptions fetched:', data?.length || 0);
      setJobDescriptions(data || []);
    } catch (error) {
      console.error('Dashboard: Error in fetchJobDescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load job descriptions.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string, type: 'resume' | 'job-description') => {
    try {
      console.log('Dashboard: Deleting', type, id);
      
      let error;
      let itemName: string;

      if (type === 'resume') {
        ({ error } = await supabase.from('resumes').delete().eq('id', id));
        itemName = 'Resume';
        setResumes(prev => prev.filter(item => item.id !== id));
      } else {
        ({ error } = await supabase.from('job_descriptions').delete().eq('id', id));
        itemName = 'Job description';
        setJobDescriptions(prev => prev.filter(item => item.id !== id));
      }

      if (error) throw error;

      toast({
        title: "Deleted",
        description: `${itemName} deleted successfully.`,
      });
    } catch (error) {
      console.error('Dashboard: Delete error:', error);
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
    return <LoadingFallback message="Loading your dashboard..." />;
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={initializeDashboard}>
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  console.log('Dashboard: Rendering dashboard with data - resumes:', resumes.length, 'jobs:', jobDescriptions.length);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <SimpleErrorBoundary fallbackMessage="Welcome section failed to load.">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.user_metadata?.full_name || user?.email || 'User'}!
            </h1>
            <p className="text-gray-600">
              Manage your resumes and job descriptions from your dashboard.
            </p>
          </div>
        </SimpleErrorBoundary>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Resumes Section */}
          <SimpleErrorBoundary fallbackMessage="Resumes section failed to load.">
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
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
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
          </SimpleErrorBoundary>

          {/* My Job Descriptions Section */}
          <SimpleErrorBoundary fallbackMessage="Job descriptions section failed to load.">
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
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
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
          </SimpleErrorBoundary>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
