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
import { ExternalJobApplicationModal } from '@/components/job-application/ExternalJobApplicationModal';
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
  Check
} from 'lucide-react';

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
          .single();

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
          .single();

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
                      <Badge variant="secondary">{job.employment_type}</Badge>
                    )}
                    {job.experience_level && (
                      <Badge variant="outline">{job.experience_level}</Badge>
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
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Apply Now
                      </Button>
                    )
                  ) : (
                    <Button 
                      size="lg"
                      onClick={handleApplyClick}
                      className="bg-blue-800 hover:bg-blue-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Apply
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{job.description}</p>
              </div>

              {/* Database jobs just show description - no structured sections */}

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
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="py-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold text-blue-900">Ready to Apply?</h3>
                  <Button 
                    size="lg"
                    onClick={handleApplyClick}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    {source === 'employer' ? 'Start Application' : 'Apply Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

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
    </div>
  );
};

export default JobDetail;