import React, { useState, useEffect } from 'react';
import { EmployerDashboardLayout } from '@/components/layout/EmployerDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  User,
  Calendar,
  Star,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';

interface Application {
  id: string;
  applicant_id: string;
  applied_at: string;
  status: string;
  cover_letter: string;
  notes: string;
  job_posting: {
    id: string;
    title: string;
    description: string;
    requirements: string[];
  };
  applicant_profile?: {
    full_name: string;
    email: string;
  };
  resume?: {
    id: string;
    file_name: string;
    parsed_text: string;
  };
  fit_score?: number;
  fit_analysis?: string;
}

const Applications: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const selectedJobId = searchParams.get('job');
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState(selectedJobId || 'all');
  const [analyzingFit, setAnalyzingFit] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get employer profile
      const { data: profile } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Get job postings
      const { data: jobs } = await supabase
        .from('job_postings')
        .select('id, title, description, requirements')
        .eq('employer_id', profile.id);

      setJobPostings(jobs || []);

      // Get applications with job posting data
      const { data: apps, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_posting:job_postings!inner(id, title, description, requirements)
        `)
        .in('job_posting_id', (jobs || []).map(j => j.id))
        .order('applied_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        throw error;
      }

      // Fetch applicant profiles separately
      const applicantIds = apps?.map(app => app.applicant_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', applicantIds);

      // Fetch resumes separately
      const { data: resumes } = await supabase
        .from('resumes')
        .select('id, file_name, parsed_text, user_id')
        .in('user_id', applicantIds);

      // Combine the data
      const combinedApplications = apps?.map(app => ({
        ...app,
        applicant_profile: profiles?.find(p => p.id === app.applicant_id),
        resume: resumes?.find(r => r.user_id === app.applicant_id)
      })) || [];

      setApplications(combinedApplications);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeResumeFit = async (applicationId: string, resumeText: string, jobDescription: string, requirements: string[]) => {
    setAnalyzingFit(prev => [...prev, applicationId]);
    
    try {
      const response = await fetch('https://kuthirgvlzyzgmyxyznr.supabase.co/functions/v1/analyze-resume-fit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          requirements
        })
      });

      if (!response.ok) throw new Error('Analysis failed');
      
      const analysis = await response.json();
      
      // Update application with fit analysis
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, fit_score: analysis.score, fit_analysis: analysis.analysis }
          : app
      ));
      
    } catch (error) {
      console.error('Error analyzing resume fit:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze resume fit",
        variant: "destructive"
      });
    } finally {
      setAnalyzingFit(prev => prev.filter(id => id !== applicationId));
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));

      toast({
        title: "Status Updated",
        description: `Application status changed to ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'reviewed': return <Eye className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'reviewed': return 'outline';
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getFitScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.applicant_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job_posting?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesJob = jobFilter === 'all' || app.job_posting?.id === jobFilter;
    
    return matchesSearch && matchesStatus && matchesJob;
  });

  if (loading) {
    return (
      <EmployerDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading applications...</p>
          </div>
        </div>
      </EmployerDashboardLayout>
    );
  }

  return (
    <EmployerDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground">Review and manage job applications</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search applicants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobPostings.map(job => (
                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || jobFilter !== 'all'
                  ? 'No applications match your filters'
                  : 'No applications yet'
                }
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {application.applicant_profile?.full_name || 'Unknown Applicant'}
                        </CardTitle>
                        <Badge variant={getStatusColor(application.status)} className="flex items-center gap-1">
                          {getStatusIcon(application.status)}
                          {application.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{application.applicant_profile?.email || 'No email available'}</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Applied {new Date(application.applied_at).toLocaleDateString()}
                        </div>
                        <span className="font-medium">{application.job_posting?.title}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {application.fit_score !== undefined && (
                        <div className={`flex items-center gap-1 ${getFitScoreColor(application.fit_score)}`}>
                          <Star className="h-4 w-4" />
                          <span className="font-semibold">{application.fit_score}% fit</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {application.cover_letter && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Cover Letter:</h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {application.cover_letter}
                        </p>
                      </div>
                    )}
                    
                    {application.fit_analysis && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Resume Fit Analysis:</h4>
                        <p className="text-sm text-muted-foreground">
                          {application.fit_analysis}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex gap-2">
                        <Select
                          value={application.status}
                          onValueChange={(value) => updateApplicationStatus(application.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {application.resume && application.resume.parsed_text && !application.fit_score && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => analyzeResumeFit(
                              application.id,
                              application.resume!.parsed_text,
                              application.job_posting.description,
                              application.job_posting.requirements || []
                            )}
                            disabled={analyzingFit.includes(application.id)}
                          >
                            {analyzingFit.includes(application.id) ? (
                              'Analyzing...'
                            ) : (
                              <>
                                <Star className="h-4 w-4 mr-2" />
                                Analyze Fit
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {application.resume && (
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            View Resume
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </EmployerDashboardLayout>
  );
};

export default Applications;
