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
  Clock,
  Phone,
  MapPin,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';

interface ContactInfo {
  phone?: string;
  email?: string;
  location?: string;
}

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
  contact_info?: ContactInfo;
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
  const [autoScoring, setAutoScoring] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const extractContactInfo = (resumeText: string): ContactInfo => {
    if (!resumeText) return {};
    
    const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    
    // Extract location - look for city, state patterns
    const locationRegex = /([A-Z][a-z]+,?\s+[A-Z]{2})|([A-Z][a-z]+\s*,\s*[A-Z][a-zA-Z\s]+)/;
    const locationMatch = resumeText.match(locationRegex);
    
    const phoneMatch = resumeText.match(phoneRegex);
    const emailMatch = resumeText.match(emailRegex);
    
    return {
      phone: phoneMatch ? phoneMatch[0] : undefined,
      email: emailMatch ? emailMatch[0] : undefined,
      location: locationMatch ? locationMatch[0] : undefined
    };
  };

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Loading applications data for user:', user.id);
      
      // Get employer profile
      const { data: profile, error: profileError } = await supabase
        .from('employer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching employer profile:', profileError);
        throw profileError;
      }

      if (!profile) {
        console.log('No employer profile found');
        setLoading(false);
        return;
      }

      console.log('Found employer profile:', profile.id);

      // Get job postings
      const { data: jobs, error: jobsError } = await supabase
        .from('job_postings')
        .select('id, title, description, requirements')
        .eq('employer_id', profile.id);

      if (jobsError) {
        console.error('Error fetching job postings:', jobsError);
        throw jobsError;
      }

      console.log('Found job postings:', jobs?.length || 0);
      setJobPostings(jobs || []);

      if (!jobs || jobs.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      // Get applications with job posting data
      const { data: apps, error: appsError } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_posting:job_postings!inner(id, title, description, requirements)
        `)
        .in('job_posting_id', jobs.map(j => j.id))
        .order('applied_at', { ascending: false });

      if (appsError) {
        console.error('Error fetching applications:', appsError);
        throw appsError;
      }

      console.log('Found applications:', apps?.length || 0);

      if (!apps || apps.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      // Get unique applicant IDs
      const applicantIds = [...new Set(apps.map(app => app.applicant_id))];
      console.log('Fetching profiles for applicant IDs:', applicantIds);

      // Fetch applicant profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', applicantIds);

      if (profilesError) {
        console.error('Error fetching applicant profiles:', profilesError);
      }

      console.log('Fetched profiles:', profiles?.length || 0);
      profiles?.forEach(profile => {
        console.log('Profile:', profile.id, profile.full_name, profile.email);
      });

      // Fetch resumes
      const { data: resumes, error: resumesError } = await supabase
        .from('resumes')
        .select('id, file_name, parsed_text, user_id')
        .in('user_id', applicantIds);

      if (resumesError) {
        console.error('Error fetching resumes:', resumesError);
      }

      console.log('Fetched resumes:', resumes?.length || 0);

      // Combine the data and ensure all properties are properly typed
      const combinedApplications: Application[] = apps.map(app => {
        const applicantProfile = profiles?.find(p => p.id === app.applicant_id);
        const resume = resumes?.find(r => r.user_id === app.applicant_id);
        const contactInfo = resume?.parsed_text ? extractContactInfo(resume.parsed_text) : {};
        
        console.log(`Application ${app.id}:`, {
          applicant_id: app.applicant_id,
          profile: applicantProfile,
          has_resume: !!resume
        });

        return {
          id: app.id,
          applicant_id: app.applicant_id,
          applied_at: app.applied_at,
          status: app.status || 'pending',
          cover_letter: app.cover_letter || '',
          notes: app.notes || '',
          job_posting: app.job_posting,
          applicant_profile: applicantProfile,
          resume: resume,
          contact_info: contactInfo,
          fit_score: undefined,
          fit_analysis: undefined
        };
      });

      console.log('Final combined applications:', combinedApplications.length);
      setApplications(combinedApplications);

      // Auto-score applications that don't have fit scores
      const unscored = combinedApplications.filter(app => 
        !app.fit_score && app.resume?.parsed_text && app.job_posting
      );
      
      if (unscored.length > 0) {
        console.log('Auto-scoring', unscored.length, 'applications');
        autoScoreApplications(unscored);
      }

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

  const autoScoreApplications = async (applicationsToScore: Application[]) => {
    const scoringIds = applicationsToScore.map(app => app.id);
    setAutoScoring(prev => [...prev, ...scoringIds]);

    for (const application of applicationsToScore) {
      try {
        await analyzeResumeFit(
          application.id,
          application.resume!.parsed_text,
          application.job_posting.description,
          application.job_posting.requirements || []
        );
      } catch (error) {
        console.error(`Failed to auto-score application ${application.id}:`, error);
      }
    }

    setAutoScoring(prev => prev.filter(id => !scoringIds.includes(id)));
  };

  const analyzeResumeFit = async (applicationId: string, resumeText: string, jobDescription: string, requirements: string[]) => {
    setAnalyzingFit(prev => [...prev, applicationId]);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume-fit', {
        body: {
          resumeText,
          jobDescription,
          requirements
        }
      });

      if (error) throw error;
      
      // Update application with fit analysis
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, fit_score: data.score, fit_analysis: data.analysis }
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

  const getFitScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
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
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {application.applicant_profile?.full_name || 'No Name Available'}
                        </CardTitle>
                        <Badge variant={getStatusColor(application.status)} className="flex items-center gap-1">
                          {getStatusIcon(application.status)}
                          {application.status}
                        </Badge>
                      </div>

                      {/* Contact Information */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {application.applicant_profile?.email || application.contact_info?.email || 'No email available'}
                        </div>
                        {application.contact_info?.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {application.contact_info.phone}
                          </div>
                        )}
                        {application.contact_info?.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {application.contact_info.location}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Applied {new Date(application.applied_at).toLocaleDateString()}
                        </div>
                        <span className="font-medium">{application.job_posting?.title}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      {application.fit_score !== undefined ? (
                        <div className={`px-3 py-1 rounded-full flex items-center gap-1 ${getFitScoreBgColor(application.fit_score)}`}>
                          <Star className={`h-4 w-4 ${getFitScoreColor(application.fit_score)}`} />
                          <span className={`font-semibold ${getFitScoreColor(application.fit_score)}`}>
                            {application.fit_score}% Potential Fit
                          </span>
                        </div>
                      ) : (
                        autoScoring.includes(application.id) && (
                          <div className="px-3 py-1 rounded-full bg-gray-100 flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                            <span className="text-sm text-gray-600">Analyzing...</span>
                          </div>
                        )
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
                        
                        {application.resume && application.resume.parsed_text && !application.fit_score && !autoScoring.includes(application.id) && (
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
