import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { JobApplicationModal } from '@/components/job-application/JobApplicationModal';
import { ExternalJobApplicationModal } from '@/components/job-application/ExternalJobApplicationModal';
import { Header } from '@/components/layout/Header';
import { UnifiedJob } from '@/types/job';
import { 
  MapPin, 
  Building, 
  DollarSign, 
  Clock, 
  ArrowLeft,
  Briefcase,
  Share2,
  ExternalLink,
  Save,
  Check,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';

// Helper function to parse job attributes that might be JSON strings or arrays
const parseJobAttribute = (value: string | string[] | null | undefined): string[] => {
  if (!value) return [];
  
  // If it's already an array, return it
  if (Array.isArray(value)) {
    return value;
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof value === 'string') {
    // Check if it looks like a JSON array
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch (error) {
        // If parsing fails, return the original string as an array
        return [value];
      }
    }
    // If it's just a regular string, return it as an array
    return [value];
  }
  
  return [];
};

const JobDetail: React.FC = () => {
  const { source, id } = useParams<{ source: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [job, setJob] = useState<UnifiedJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (source && id) {
      loadJobData();
      if (user && source === 'employer') {
        checkApplicationStatus();
      }
    }
  }, [source, id, user]);

  const loadJobData = async () => {
    try {
      if (source === 'employer') {
        // Load employer job from job_postings table
        const { data, error } = await supabase
          .from('job_postings')
          .select(`
            *,
            employer_profile:employer_profiles(
              company_name,
              logo_url,
              company_description,
              industry,
              company_size,
              website
            )
          `)
          .eq('id', id)
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;

        const unifiedJob: UnifiedJob = {
          id: data.id,
          title: data.title,
          company: data.employer_profile?.company_name || 'Company Name Not Available',
          location: data.location || '',
          description: data.description,
          salary: formatSalary(data.salary_min, data.salary_max, data.salary_currency),
          posted_at: new Date(data.created_at).toLocaleDateString(),
          job_url: `/job/employer/${data.id}`,
          source: 'employer',
          employer_profile: data.employer_profile,
          employment_type: data.employment_type,
          experience_level: data.experience_level,
          salary_min: data.salary_min,
          salary_max: data.salary_max,
          salary_currency: data.salary_currency,
          created_at: data.created_at,
          requirements: data.requirements || [],
          responsibilities: data.responsibilities || [],
          benefits: data.benefits || []
        };

        setJob(unifiedJob);
      } else if (source === 'database') {
        // Load database job from cached_jobs table  
        const { data, error } = await supabase
          .from('cached_jobs')
          .select('*') 
          .eq('id', id)
          .eq('is_expired', false)
          .maybeSingle();

        if (error) throw error;

        const unifiedJob: UnifiedJob = {
          id: data.id,
          title: data.title,
          company: data.company,
          location: data.location || '',
          description: data.description || '',
          salary: data.salary,
          posted_at: data.posted_at || new Date(data.scraped_at).toLocaleDateString(),
          job_url: `/job/database/${data.id}`,
          source: 'database',
          via: data.via,
          thumbnail: data.thumbnail,
          job_type: data.job_type,
          employment_type: data.employment_type,
          experience_level: data.experience_level,
          // Note: cached_jobs doesn't have structured requirements/responsibilities/benefits
          // These would be parsed from description if needed
        };

        setJob(unifiedJob);
      }
    } catch (error) {
      console.error('Error loading job:', error);
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
    if (!user || source !== 'employer') return;
    
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_posting_id', id)
        .eq('applicant_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      setHasApplied(!!data);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
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

  const handleApplyClick = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply for this job",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (source === 'employer') {
      if (hasApplied) {
        toast({
          title: "Already Applied",
          description: "You have already applied for this position",
        });
        return;
      }
      setShowApplicationModal(true);
    } else {
      setShowExternalModal(true);
    }
  };

  const handleShareClick = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied!",
        description: "Job posting link has been copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Share Link",
        description: url,
      });
    }
  };

  const handleSaveJob = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save jobs.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('job_descriptions').insert({
        user_id: user.id,
        title: job!.title,
        parsed_text: job!.description,
        source: job!.source,
        company: job!.company,
        location: job!.location,
        salary_range: job!.salary,
        job_url: window.location.href
      });

      if (error) throw error;

      setSaved(true);
      toast({
        title: "Job saved!",
        description: "Job description has been saved to your profile."
      });
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: "Error",
        description: "Failed to save job. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApplicationSubmitted = () => {
    setHasApplied(true);
    setShowApplicationModal(false);
    toast({
      title: "Application Submitted!",
      description: "Your application has been sent to the employer."
    });
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

  if (!job) {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* AI Optimization Hero Section */}
        <section className="bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-yellow-300" />
              <span className="text-sm font-medium">AI-POWERED OPTIMIZATION</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Perfect Your Resume for This {job.title} Position
            </h1>
            <p className="text-lg md:text-xl mb-6 text-blue-100">
              Get 3x more interviews with AI-optimized resumes tailored to this exact job posting
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => user ? navigate('/upload-resume') : navigate('/auth')}
                className="bg-white text-primary hover:bg-gray-100 font-semibold"
              >
                <Target className="h-5 w-5 mr-2" />
                Optimize My Resume
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => user ? navigate('/dashboard') : navigate('/auth')}
                className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 hover:text-white"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                View Dashboard
              </Button>
            </div>
          </div>
        </section>

        {/* Job Details Section */}
        <section className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Button 
              variant="ghost" 
              onClick={() => user ? navigate('/job-search') : navigate('/')}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {user ? 'Back to Job Search' : 'Back to Home'}
            </Button>

            <div className="space-y-6">
              {/* Header Card */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center space-x-4">
                        {job.employer_profile?.logo_url && (
                          <img 
                            src={job.employer_profile.logo_url} 
                            alt={job.company}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        {job.thumbnail && source === 'database' && (
                          <img 
                            src={job.thumbnail} 
                            alt={job.company}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <CardTitle className="text-2xl">{job.title}</CardTitle>
                          <p className="text-lg text-muted-foreground flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            {job.company}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                        )}
                        {job.salary && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {job.salary}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Posted {job.posted_at}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {job.employment_type && (
                          <>
                            {parseJobAttribute(job.employment_type).map((type, index) => (
                              <div key={index} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-sm">
                                {type}
                              </div>
                            ))}
                          </>
                        )}
                        {job.experience_level && (
                          <>
                            {parseJobAttribute(job.experience_level).map((level, index) => (
                              <div key={index} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold shadow-sm">
                                {level}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShareClick}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSaveJob} 
                        disabled={saving || saved}
                      >
                        {saved ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : 'Save'}
                          </>
                        )}
                      </Button>

                      {source === 'employer' ? (
                        hasApplied ? (
                          <Badge className="bg-green-100 text-green-800 px-4 py-2">
                            ✓ Applied
                          </Badge>
                        ) : (
                          <Button 
                            size="lg"
                            onClick={handleApplyClick}
                            className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 shadow-lg"
                          >
                            <Briefcase className="h-4 w-4 mr-2" />
                            Apply Now
                          </Button>
                        )
                      ) : (
                        <Button 
                          size="lg"
                          onClick={handleApplyClick}
                          className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 shadow-lg"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* AI Conversion Section */}
              {!user && (
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50">
                  <CardContent className="py-8">
                    <div className="text-center space-y-6">
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        <h3 className="text-2xl font-bold text-primary">Stand Out From The Competition</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                        <div className="text-center">
                          <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                            <Target className="h-6 w-6 text-primary" />
                          </div>
                          <h4 className="font-semibold mb-2">ATS Optimized</h4>
                          <p className="text-sm text-muted-foreground">95% ATS pass rate with keyword optimization</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                            <TrendingUp className="h-6 w-6 text-primary" />
                          </div>
                          <h4 className="font-semibold mb-2">3x More Interviews</h4>
                          <p className="text-sm text-muted-foreground">Proven results from thousands of users</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                            <Sparkles className="h-6 w-6 text-primary" />
                          </div>
                          <h4 className="font-semibold mb-2">AI-Powered</h4>
                          <p className="text-sm text-muted-foreground">Tailored specifically for this job posting</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button size="lg" onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
                          <Sparkles className="h-5 w-5 mr-2" />
                          Get Started Free
                        </Button>
                        <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                          Learn More
                        </Button>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Join 50,000+ job seekers who've landed their dream jobs with RezLit
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Job Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{job.description}</p>
                  </div>

                  {/* Structured sections for employer jobs */}
                  {source === 'employer' && (
                    <>
                      {job.responsibilities && Array.isArray(job.responsibilities) && job.responsibilities.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="font-semibold mb-3">Key Responsibilities</h3>
                            <ul className="list-disc list-inside space-y-1">
                              {job.responsibilities.map((item, index) => (
                                <li key={index} className="text-muted-foreground">{item}</li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}

                      {job.requirements && Array.isArray(job.requirements) && job.requirements.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="font-semibold mb-3">Requirements</h3>
                            <ul className="list-disc list-inside space-y-1">
                              {job.requirements.map((item, index) => (
                                <li key={index} className="text-muted-foreground">{item}</li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}

                      {job.benefits && Array.isArray(job.benefits) && job.benefits.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h3 className="font-semibold mb-3">Benefits & Perks</h3>
                            <ul className="list-disc list-inside space-y-1">
                              {job.benefits.map((item, index) => (
                                <li key={index} className="text-muted-foreground">{item}</li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Apply Section */}
              {!hasApplied && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="py-6">
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-semibold text-primary">Ready to Apply?</h3>
                      {!user && (
                        <p className="text-sm text-muted-foreground">
                          Optimize your resume with AI first to increase your chances of getting an interview
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {!user && (
                          <Button 
                            size="lg"
                            onClick={() => navigate('/auth')}
                            className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 shadow-lg"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Optimize Resume First
                          </Button>
                        )}
                        <Button 
                          size="lg"
                          variant={user ? "default" : "outline"}
                          onClick={handleApplyClick}
                          className={user ? "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 shadow-lg" : ""}
                        >
                          <Briefcase className="h-4 w-4 mr-2" />
                          {source === 'employer' ? 'Apply Directly' : 'Apply Now'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-50 border-t py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Features</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link to={user ? "/upload-resume" : "/auth"} className="hover:text-primary">Resume Optimizer</Link></li>
                  <li><Link to={user ? "/interview-prep" : "/auth"} className="hover:text-primary">Interview Prep</Link></li>
                  <li><Link to={user ? "/cover-letters" : "/auth"} className="hover:text-primary">Cover Letters</Link></li>
                  <li><Link to={user ? "/resume-templates" : "/auth"} className="hover:text-primary">Templates</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Tools</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link to={user ? "/job-search" : "/auth"} className="hover:text-primary">Job Search</Link></li>
                  <li><Link to={user ? "/dashboard" : "/auth"} className="hover:text-primary">Dashboard</Link></li>
                  <li><Link to={user ? "/profile" : "/auth"} className="hover:text-primary">Profile</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link to="/" className="hover:text-primary">About</Link></li>
                  <li><Link to="/" className="hover:text-primary">Privacy</Link></li>
                  <li><Link to="/" className="hover:text-primary">Terms</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Support</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link to="/" className="hover:text-primary">Help Center</Link></li>
                  <li><Link to="/" className="hover:text-primary">Contact</Link></li>
                </ul>
              </div>
            </div>
            
            <Separator className="my-8" />
            
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-bold">RezLit</span>
                <span className="text-sm text-muted-foreground">- AI-Powered Career Tools</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © 2024 RezLit. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Application Modals */}
      {source === 'employer' && showApplicationModal && (
        <JobApplicationModal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          jobPosting={job as any}
          onApplicationSubmitted={handleApplicationSubmitted}
        />
      )}

      {source === 'database' && showExternalModal && (
        <ExternalJobApplicationModal
          isOpen={showExternalModal}
          onClose={() => setShowExternalModal(false)}
          job={job}
        />
      )}
    </div>
  );
};

export default JobDetail;