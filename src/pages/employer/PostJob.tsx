import React, { useState, useEffect } from 'react';
import { EmployerDashboardLayout } from '@/components/layout/EmployerDashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEmployerProfile } from '@/hooks/useEmployerProfile';
import { ProfileCompletionCard } from '@/components/employer/ProfileCompletionCard';
import { useJobFormPersistence } from '@/hooks/useJobFormPersistence';
import { BasicInfoTab, JobDetailsTab, RequirementsBenefitsTab } from '@/components/employer/JobPostingTabs';

const PostJob: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { jobId } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!jobId);
  const [activeTab, setActiveTab] = useState('basic');
  const { profile, loading: profileLoading, profileCompleteness } = useEmployerProfile();
  
  const {
    formData,
    requirements,
    responsibilities,
    benefits,
    updateFormData,
    updateRequirements,
    updateResponsibilities,
    updateBenefits,
    clearDraft,
    loadJobData,
    setFormData,
    setRequirements,
    setResponsibilities,
    setBenefits
  } = useJobFormPersistence(jobId);

  // Load existing job data if in edit mode
  useEffect(() => {
    if (jobId && profile) {
      loadExistingJobData();
    }
  }, [jobId, profile]);

  // Check profile completeness when profile data is loaded
  useEffect(() => {
    if (profileLoading) return;
    
    if (!profile) {
      toast({
        title: "Profile Required",
        description: "Please create your company profile first.",
        variant: "destructive"
      });
      navigate('/employer/profile');
      return;
    }

    if (!profileCompleteness.isComplete) {
      // Don't redirect immediately, let them see the completion card
      return;
    }
  }, [profile, profileLoading, profileCompleteness, navigate, toast]);

  const loadExistingJobData = async () => {
    if (!jobId || !profile) return;
    
    setLoading(true);
    try {
      const { data: jobData, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', jobId)
        .eq('employer_id', profile.id)
        .single();

      if (error) throw error;

      if (jobData) {
        loadJobData(jobData);
      }
    } catch (error) {
      console.error('Error loading job data:', error);
      toast({
        title: "Error",
        description: "Failed to load job data",
        variant: "destructive"
      });
      navigate('/employer/job-postings');
    } finally {
      setLoading(false);
    }
  };

  const validateTab = (tab: string): boolean => {
    switch (tab) {
      case 'basic':
        return !!(formData.title && formData.description);
      case 'details':
        return true; // Optional fields
      case 'requirements':
        return true; // Optional fields
      default:
        return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to post jobs.",
        variant: "destructive",
      });
      return;
    }

    if (!profile) {
      toast({ 
        title: "Profile Required", 
        description: "Please complete your employer profile before posting jobs.", 
        variant: "destructive" 
      });
      return;
    }

    if (!profileCompleteness.isComplete) {
      toast({ 
        title: "Profile Incomplete", 
        description: "Please complete your company profile before posting jobs.", 
        variant: "destructive" 
      });
      return;
    }

    if (!validateTab('basic')) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in the job title and description.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        location: formData.location || null,
        remote_type: formData.remote_type || null,
        employment_type: formData.employment_type || null,
        experience_level: formData.experience_level || null,
        seniority_level: formData.seniority_level || null,
        job_function: formData.job_function || null,
        industry: formData.industry || null,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        salary_currency: formData.salary_currency,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        requirements: requirements.length > 0 ? requirements : null,
        responsibilities: responsibilities.length > 0 ? responsibilities : null,
        benefits: benefits.length > 0 ? benefits : null,
        ...(isEditMode ? {} : { employer_id: profile.id, is_active: true })
      };

      console.log('Submitting job data:', { jobData, profileId: profile.id, userId: user.id });

      if (isEditMode) {
        const { data, error } = await supabase
          .from('job_postings')
          .update(jobData)
          .eq('id', jobId)
          .select();

        console.log('Update result:', { data, error });
        
        if (error) {
          console.error('Update error details:', error);
          throw error;
        }

        toast({
          title: "Job Updated",
          description: "Your job posting has been updated successfully!"
        });
      } else {
        const { data, error } = await supabase
          .from('job_postings')
          .insert({ ...jobData, employer_id: profile.id, is_active: true })
          .select();

        console.log('Insert result:', { data, error });
        
        if (error) {
          console.error('Insert error details:', error);
          throw error;
        }

        clearDraft();
        toast({
          title: "Job Posted",
          description: "Your job posting has been created successfully!"
        });
      }
      
      navigate('/employer/job-postings');
    } catch (error: any) {
      console.error('Error posting job:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = "Failed to post job. Please try again.";
      
      if (error?.code === '42501') {
        errorMessage = "Permission denied. Please ensure your employer profile is complete and you have the correct permissions.";
      } else if (error?.code === 'PGRST301') {
        errorMessage = "Row level security violation. Please contact support if this issue persists.";
      } else if (error?.message?.includes('row-level security')) {
        errorMessage = "Access denied. Your account may need verification. Please contact support.";
      } else if (error?.message?.includes('employer_id')) {
        errorMessage = "There was an issue with your employer profile. Please ensure it's properly configured.";
      } else if (error?.message?.includes('function') && error?.message?.includes('null')) {
        errorMessage = "Authentication issue detected. Please try logging out and back in.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <EmployerDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/employer/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{isEditMode ? 'Edit Job Posting' : 'Post New Job'}</h1>
            <p className="text-muted-foreground">
              {isEditMode 
                ? 'Update your job posting details' 
                : 'Create a detailed job posting to attract the right candidates'
              }
            </p>
          </div>
        </div>

        {/* Show profile completion status if not complete */}
        {!profileLoading && !profileCompleteness.isComplete && (
          <ProfileCompletionCard
            isComplete={profileCompleteness.isComplete}
            missingFields={profileCompleteness.missingFields}
            completionPercentage={profileCompleteness.completionPercentage}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                {validateTab('basic') && <CheckCircle className="h-4 w-4 text-green-500" />}
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2">
                {validateTab('details') && <CheckCircle className="h-4 w-4 text-green-500" />}
                Job Details
              </TabsTrigger>
              <TabsTrigger value="requirements" className="flex items-center gap-2">
                {validateTab('requirements') && <CheckCircle className="h-4 w-4 text-green-500" />}
                Requirements & Benefits
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-6">
              <BasicInfoTab formData={formData} updateFormData={updateFormData} />
            </TabsContent>

            <TabsContent value="details" className="mt-6">
              <JobDetailsTab formData={formData} updateFormData={updateFormData} />
            </TabsContent>

            <TabsContent value="requirements" className="mt-6">
              <RequirementsBenefitsTab
                requirements={requirements}
                responsibilities={responsibilities}
                benefits={benefits}
                updateRequirements={updateRequirements}
                updateResponsibilities={updateResponsibilities}
                updateBenefits={updateBenefits}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-between gap-4 pt-6">
            <Link to="/employer/job-postings">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            
            <div className="flex gap-2">
              {activeTab === 'basic' && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setActiveTab('details')}
                  disabled={!validateTab('basic')}
                >
                  Next: Job Details
                </Button>
              )}
              
              {activeTab === 'details' && (
                <>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab('basic')}
                  >
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab('requirements')}
                  >
                    Next: Requirements
                  </Button>
                </>
              )}
              
              {activeTab === 'requirements' && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setActiveTab('details')}
                >
                  Previous
                </Button>
              )}
              
              <Button type="submit" disabled={loading || !profileCompleteness.isComplete || !validateTab('basic')}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : isEditMode ? "Update Job" : "Post Job"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </EmployerDashboardLayout>
  );
};

export default PostJob;