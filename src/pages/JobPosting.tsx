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

  const loadJobPosting = async () => {
    try {
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

      if (error) throw error;
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
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_posting_id', id)
        .eq('applicant_id', user.id)
        .single();
      
      setHasApplied(!!data);
    } catch (error) {
      // No application found, which is fine
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
                  {hasApplied ? (
                    <Badge className="bg-green-100 text-green-800">Applied</Badge>
                  ) : (
                    <Button 
                      size="lg"
                      onClick={() => setShowApplicationModal(true)}
                      disabled={!user}
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Apply Now
                    </Button>
                  )}
                  {!user && (
                    <p className="text-sm text-muted-foreground">Login to apply</p>
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

          {/* Apply Section */}
          {!hasApplied && user && (
            <Card>
              <CardContent className="py-6">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">Ready to Apply?</h3>
                  <p className="text-muted-foreground">
                    Apply with an existing resume or create an optimized resume for this position
                  </p>
                  <Button 
                    size="lg"
                    onClick={() => setShowApplicationModal(true)}
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Start Application
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Application Modal */}
        {showApplicationModal && (
          <JobApplicationModal
            isOpen={showApplicationModal}
            onClose={() => setShowApplicationModal(false)}
            jobPosting={jobPosting}
            onApplicationSubmitted={() => {
              setHasApplied(true);
              setShowApplicationModal(false);
              toast({
                title: "Application Submitted!",
                description: "Your application has been sent to the employer."
              });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default JobPosting;
