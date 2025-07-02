
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { JobApplicationModal } from '@/components/job-application/JobApplicationModal';
import { 
  MapPin, 
  Building, 
  DollarSign, 
  Clock, 
  Users, 
  Globe,
  ArrowLeft,
  Briefcase
} from 'lucide-react';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  location: string;
  remote_type: string;
  employment_type: string;
  experience_level: string;
  seniority_level: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  created_at: string;
  employer_profile: {
    company_name: string;
    company_description: string;
    industry: string;
    company_size: string;
    website: string;
    logo_url: string;
  } | null;
}

const JobPosting: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (id) {
      loadJobPosting();
      checkApplicationStatus();
    }
  }, [id, user]);

  useEffect(() => {
    // Debug logging for user authentication
    console.log('🔍 JobPosting Debug - User auth state:', {
      isAuthenticated: !!user,
      userId: user?.id,
      userEmail: user?.email
    });
  }, [user]);

  useEffect(() => {
    // Debug logging for application state
    console.log('🔍 JobPosting Debug - Application state:', {
      jobPostingId: id,
      hasApplied,
      showApplicationModal,
      jobPostingLoaded: !!jobPosting
    });
  }, [id, hasApplied, showApplicationModal, jobPosting]);

  const loadJobPosting = async () => {
    try {
      console.log('📋 Loading job posting with ID:', id);
      const { data, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          employer_profile:employer_profiles(
            company_name,
            company_description,
            industry,
            company_size,
            website,
            logo_url
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('❌ Error loading job posting:', error);
        throw error;
      }
      
      console.log('✅ Job posting loaded successfully:', data?.title);
      setJobPosting(data);
    } catch (error) {
      console.error('Error loading job posting:', error);
      toast({
        title: "Error",
        description: "Failed to load job posting",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!user) {
      console.log('🔍 No user found, skipping application status check');
      return;
    }
    
    try {
      console.log('🔍 Checking application status for user:', user.id, 'job:', id);
      const { data, error } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_posting_id', id)
        .eq('applicant_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error checking application status:', error);
        throw error;
      }
      
      const hasUserApplied = !!data;
      console.log('✅ Application status check result:', {
        hasApplied: hasUserApplied,
        applicationId: data?.id
      });
      
      setHasApplied(hasUserApplied);
    } catch (error) {
      console.error('Error checking application status:', error);
      // Don't show error toast for this, just log it
      setHasApplied(false);
    }
  };

  const handleApplyClick = () => {
    console.log('🎯 Apply button clicked:', {
      userId: user?.id,
      jobId: id,
      hasApplied,
      showApplicationModal
    });
    
    if (!user) {
      console.log('❌ No user authenticated, cannot apply');
      toast({
        title: "Authentication Required",
        description: "Please log in to apply for this job",
        variant: "destructive"
      });
      return;
    }
    
    if (hasApplied) {
      console.log('❌ User has already applied');
      toast({
        title: "Already Applied",
        description: "You have already applied for this position",
      });
      return;
    }
    
    console.log('✅ Opening application modal');
    setShowApplicationModal(true);
  };

  const handleApplicationSubmitted = () => {
    console.log('✅ Application submitted successfully');
    setHasApplied(true);
    setShowApplicationModal(false);
    toast({
      title: "Application Submitted!",
      description: "Your application has been sent to the employer."
    });
  };

  const formatSalary = (min: number, max: number, currency: string) => {
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    } else if (min) {
      return `${currency} ${min.toLocaleString()}+`;
    } else if (max) {
      return `Up to ${currency} ${max.toLocaleString()}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading job posting...</p>
        </div>
      </div>
    );
  }

  if (!jobPosting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-4">This job posting may have been removed or doesn't exist.</p>
          <Button onClick={() => navigate('/job-search')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Search
          </Button>
        </div>
      </div>
    );
  }

  const salaryRange = formatSalary(jobPosting.salary_min, jobPosting.salary_max, jobPosting.salary_currency);
  const companyName = jobPosting.employer_profile?.company_name || 'Company Name Not Available';

  // Debug logging for render decisions
  console.log('🎨 Rendering job posting with state:', {
    userAuthenticated: !!user,
    hasApplied,
    showApplicationModal,
    jobTitle: jobPosting.title,
    companyName
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/job-search')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Job Search
        </Button>

        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    {jobPosting.employer_profile?.logo_url && (
                      <img 
                        src={jobPosting.employer_profile.logo_url} 
                        alt={companyName}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="text-2xl">{jobPosting.title}</CardTitle>
                      <p className="text-lg text-muted-foreground flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        {companyName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {jobPosting.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {jobPosting.location}
                      </div>
                    )}
                    {salaryRange && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {salaryRange}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Posted {new Date(jobPosting.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {jobPosting.employment_type && (
                      <Badge variant="secondary">{jobPosting.employment_type}</Badge>
                    )}
                    {jobPosting.remote_type && (
                      <Badge variant="outline">{jobPosting.remote_type}</Badge>
                    )}
                    {jobPosting.experience_level && (
                      <Badge variant="outline">{jobPosting.experience_level}</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {!user ? (
                    <div className="text-center space-y-2">
                      <Button 
                        size="lg"
                        onClick={() => navigate('/auth')}
                        className="w-full"
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Login to Apply
                      </Button>
                      <p className="text-sm text-muted-foreground">Sign in to apply for this position</p>
                    </div>
                  ) : hasApplied ? (
                    <div className="text-center space-y-2">
                      <Badge className="bg-green-100 text-green-800 px-4 py-2">
                        ✓ Application Submitted
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        You've successfully applied for this position
                      </p>
                    </div>
                  ) : (
                    <Button 
                      size="lg"
                      onClick={handleApplyClick}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg font-semibold"
                    >
                      <Briefcase className="h-5 w-5 mr-2" />
                      Apply Now
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Company Info */}
          {jobPosting.employer_profile && (
            <Card>
              <CardHeader>
                <CardTitle>About {companyName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobPosting.employer_profile.company_description && (
                  <p className="text-muted-foreground">
                    {jobPosting.employer_profile.company_description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  {jobPosting.employer_profile.industry && (
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {jobPosting.employer_profile.industry}
                    </div>
                  )}
                  {jobPosting.employer_profile.company_size && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {jobPosting.employer_profile.company_size}
                    </div>
                  )}
                  {jobPosting.employer_profile.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      <a 
                        href={jobPosting.employer_profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{jobPosting.description}</p>
              </div>

              {jobPosting.responsibilities && jobPosting.responsibilities.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Key Responsibilities</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {jobPosting.responsibilities.map((item, index) => (
                        <li key={index} className="text-muted-foreground">{item}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {jobPosting.requirements && jobPosting.requirements.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Requirements</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {jobPosting.requirements.map((item, index) => (
                        <li key={index} className="text-muted-foreground">{item}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {jobPosting.benefits && jobPosting.benefits.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Benefits & Perks</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {jobPosting.benefits.map((item, index) => (
                        <li key={index} className="text-muted-foreground">{item}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Apply Section - Enhanced for non-authenticated users */}
          {!hasApplied && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="py-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold text-blue-900">Ready to Apply?</h3>
                  {!user ? (
                    <>
                      <p className="text-blue-700">
                        Create an account or sign in to apply with an optimized resume and cover letter
                      </p>
                      <Button 
                        size="lg"
                        onClick={() => navigate('/auth')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Sign Up / Login to Apply
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-blue-700">
                        Apply with an existing resume or create an AI-optimized resume for this position
                      </p>
                      <Button 
                        size="lg"
                        onClick={handleApplyClick}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Start Application
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Application Modal */}
        {showApplicationModal && jobPosting && (
          <JobApplicationModal
            isOpen={showApplicationModal}
            onClose={() => {
              console.log('🔄 Closing application modal');
              setShowApplicationModal(false);
            }}
            jobPosting={jobPosting}
            onApplicationSubmitted={handleApplicationSubmitted}
          />
        )}
      </div>
    </div>
  );
};

export default JobPosting;
