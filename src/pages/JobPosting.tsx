
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
import { JobApplicationModalNoResume } from '@/components/job-application/JobApplicationModalNoResume';
import { 
  MapPin, 
  Building, 
  DollarSign, 
  Clock, 
  Users, 
  Globe,
  ArrowLeft,
  Briefcase,
  Star,
  CheckCircle,
  TrendingUp,
  Shield,
  Zap,
  Target
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
  const [showNoResumeModal, setShowNoResumeModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingResumes, setCheckingResumes] = useState(false);

  useEffect(() => {
    if (id) {
      loadJobPosting();
      checkApplicationStatus();
    }
  }, [id, user]);

  // Check for auto-apply parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoApply = urlParams.get('autoApply');
    
    if (autoApply === 'true' && user && jobPosting && !hasApplied) {
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        handleApplyClick();
      }, 100);
    }
  }, [user, jobPosting, hasApplied]);

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
          employer_profiles!inner(
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
      
      // Transform the data to match expected structure
      const transformedData = {
        ...data,
        employer_profile: data.employer_profiles
      };
      
      console.log('✅ Job posting loaded successfully:', transformedData?.title);
      console.log('✅ Employer profile data:', transformedData?.employer_profile);
      setJobPosting(transformedData);
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

  const checkUserResumes = async () => {
    if (!user) {
      console.log('🔍 No user found, returning 0 resumes');
      return 0;
    }
    
    console.log('🔍 Checking resumes for user:', user.id);
    
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('id')
        .eq('user_id', user.id);
      
      console.log('🔍 Resume query result:', { data, error, count: data?.length });
      
      if (error) {
        console.error('❌ Resume check error:', error);
        throw error;
      }
      
      const count = data?.length || 0;
      console.log('🔍 Final resume count:', count);
      return count;
    } catch (error) {
      console.error('❌ Error checking user resumes:', error);
      return 0;
    }
  };

  const handleApplyClick = async () => {
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
    
    // Reset both modal states first
    setShowApplicationModal(false);
    setShowNoResumeModal(false);
    
    setCheckingResumes(true);
    try {
      const resumeCount = await checkUserResumes();
      console.log('🔍 RESUME COUNT CHECK:', { 
        userId: user.id, 
        resumeCount, 
        type: typeof resumeCount 
      });
      
      if (resumeCount > 0) {
        console.log('✅ SETTING: Application Modal (with resumes)');
        setShowApplicationModal(true);
      } else {
        console.log('✅ SETTING: No-Resume Modal (no resumes)');
        setShowNoResumeModal(true);
      }
    } catch (error) {
      console.error('Error checking resumes:', error);
      toast({
        title: "Error",
        description: "Failed to check your resumes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCheckingResumes(false);
    }
  };

  const handleApplicationSubmitted = () => {
    console.log('✅ Application submitted successfully');
    setHasApplied(true);
    setShowApplicationModal(false);
    setShowNoResumeModal(false);
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
                      disabled={checkingResumes}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 text-lg font-semibold shadow-lg"
                    >
                      {checkingResumes ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Checking...
                        </>
                      ) : (
                        <>
                          <Briefcase className="h-5 w-5 mr-2" />
                          Apply Now
                        </>
                      )}
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

          {/* RezLit Value Proposition - For Non-Authenticated Users */}
          {!user && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="py-8">
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full p-3 shadow-lg">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-blue-900 mb-2">
                      Stand Out with RezLit
                    </h2>
                    <p className="text-blue-700 text-lg">
                      Get AI-powered resume optimization and personalized cover letters that make employers notice you
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div className="text-center space-y-2">
                      <div className="bg-white rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto">
                        <Target className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-blue-900">ATS-Optimized Resumes</h3>
                      <p className="text-sm text-blue-600">Get past applicant tracking systems with AI-optimized keywords</p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="bg-white rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto">
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-blue-900">3x Higher Response Rate</h3>
                      <p className="text-sm text-blue-600">Our users get significantly more interview invitations</p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="bg-white rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto">
                        <Shield className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-blue-900">Personalized Cover Letters</h3>
                      <p className="text-sm text-blue-600">AI generates tailored cover letters for each application</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
                    <div className="flex items-center justify-center space-x-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                      <span className="ml-2 text-gray-600 font-medium">4.9/5 from 2,500+ users</span>
                    </div>
                    <blockquote className="text-gray-700 italic">
                      "I got 3 interview calls within a week of using RezLit. The AI optimization made my resume stand out from hundreds of applications!"
                    </blockquote>
                    <cite className="text-sm text-gray-500 mt-2 block">- Sarah M., Software Engineer</cite>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* What Happens When You Apply */}
          {!user && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  What Happens When You Apply Through RezLit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <h4 className="font-semibold text-green-900">Create Your Account (30 seconds)</h4>
                      <p className="text-green-700 text-sm">Quick signup with your email - no lengthy forms</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <h4 className="font-semibold text-green-900">Upload Your Resume</h4>
                      <p className="text-green-700 text-sm">Our AI analyzes and optimizes your resume for this specific job</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <h4 className="font-semibold text-green-900">Generate Personalized Cover Letter</h4>
                      <p className="text-green-700 text-sm">AI creates a compelling cover letter tailored to this position</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <h4 className="font-semibold text-green-900">Apply with Confidence</h4>
                      <p className="text-green-700 text-sm">Submit your optimized application and track your progress</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 text-green-800">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">100% Free to Start</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    No credit card required. Get 3 free resume optimizations to try RezLit risk-free.
                  </p>
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
                         className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
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
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
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

        {/* Application Modals */}
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
        
        {showNoResumeModal && jobPosting && (
          <JobApplicationModalNoResume
            isOpen={showNoResumeModal}
            onClose={() => {
              console.log('🔄 Closing no-resume modal');
              setShowNoResumeModal(false);
            }}
            jobPosting={jobPosting}
            onApplicationSubmitted={handleApplicationSubmitted}
          />
        )}

        {/* Floating Mobile CTA for Non-Authenticated Users */}
        {!user && !hasApplied && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 text-lg font-semibold shadow-lg"
              size="lg"
            >
              <Zap className="h-5 w-5 mr-2" />
              Apply with RezLit - Free to Start
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPosting;
