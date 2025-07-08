
import React, { useState, useEffect } from 'react';
import { EmployerDashboardLayout } from '@/components/layout/EmployerDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEmployerProfile } from '@/hooks/useEmployerProfile';
import { ProfileCompletionCard } from '@/components/employer/ProfileCompletionCard';

const PostJob: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { jobId } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!jobId);
  const { profile, loading: profileLoading, profileCompleteness } = useEmployerProfile();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    remote_type: '',
    employment_type: '',
    experience_level: '',
    seniority_level: '',
    job_function: '',
    industry: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    expires_at: ''
  });
  
  const [requirements, setRequirements] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  
  const [newRequirement, setNewRequirement] = useState('');
  const [newResponsibility, setNewResponsibility] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  // Load existing job data if in edit mode
  useEffect(() => {
    if (jobId && profile) {
      loadJobData();
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

  const loadJobData = async () => {
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
        setFormData({
          title: jobData.title || '',
          description: jobData.description || '',
          location: jobData.location || '',
          remote_type: jobData.remote_type || '',
          employment_type: jobData.employment_type || '',
          experience_level: jobData.experience_level || '',
          seniority_level: jobData.seniority_level || '',
          job_function: jobData.job_function || '',
          industry: jobData.industry || '',
          salary_min: jobData.salary_min?.toString() || '',
          salary_max: jobData.salary_max?.toString() || '',
          salary_currency: jobData.salary_currency || 'USD',
          expires_at: jobData.expires_at ? new Date(jobData.expires_at).toISOString().split('T')[0] : ''
        });

        setRequirements(jobData.requirements || []);
        setResponsibilities(jobData.responsibilities || []);
        setBenefits(jobData.benefits || []);
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

  const addItem = (item: string, setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[], inputSetter: React.Dispatch<React.SetStateAction<string>>) => {
    if (item.trim() && !current.includes(item.trim())) {
      setter([...current, item.trim()]);
      inputSetter('');
    }
  };

  const removeItem = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[]) => {
    setter(current.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) {
      toast({ title: "Error", description: "Employer profile not found", variant: "destructive" });
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

      if (isEditMode) {
        const { error } = await supabase
          .from('job_postings')
          .update(jobData)
          .eq('id', jobId);

        if (error) throw error;

        toast({
          title: "Job Updated",
          description: "Your job posting has been updated successfully!"
        });
      } else {
        const { error } = await supabase
          .from('job_postings')
          .insert({ ...jobData, employer_id: profile.id, is_active: true });

        if (error) throw error;

        toast({
          title: "Job Posted",
          description: "Your job posting has been created successfully!"
        });
      }
      
      navigate('/employer/job-postings');
    } catch (error) {
      console.error('Error posting job:', error);
      toast({
        title: "Error",
        description: "Failed to post job. Please try again.",
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
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role, company culture, and what makes this opportunity unique..."
                  rows={6}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select value={formData.employment_type} onValueChange={(value) => setFormData({ ...formData, employment_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <Select value={formData.experience_level} onValueChange={(value) => setFormData({ ...formData, experience_level: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry-level">Entry Level</SelectItem>
                      <SelectItem value="mid-level">Mid Level</SelectItem>
                      <SelectItem value="senior-level">Senior Level</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Remote Type</Label>
                  <Select value={formData.remote_type} onValueChange={(value) => setFormData({ ...formData, remote_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on-site">On-site</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g., Technology, Healthcare"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Job Function</Label>
                  <Input
                    value={formData.job_function}
                    onChange={(e) => setFormData({ ...formData, job_function: e.target.value })}
                    placeholder="e.g., Engineering, Marketing"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Salary Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Salary</Label>
                  <Input
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Salary</Label>
                  <Input
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                    placeholder="100000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.salary_currency} onValueChange={(value) => setFormData({ ...formData, salary_currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements Section */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Add a requirement..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newRequirement, setRequirements, requirements, setNewRequirement))}
                />
                <Button type="button" onClick={() => addItem(newRequirement, setRequirements, requirements, setNewRequirement)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {requirements.map((req, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {req}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem(index, setRequirements, requirements)} />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Responsibilities Section */}
          <Card>
            <CardHeader>
              <CardTitle>Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newResponsibility}
                  onChange={(e) => setNewResponsibility(e.target.value)}
                  placeholder="Add a responsibility..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newResponsibility, setResponsibilities, responsibilities, setNewResponsibility))}
                />
                <Button type="button" onClick={() => addItem(newResponsibility, setResponsibilities, responsibilities, setNewResponsibility)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {responsibilities.map((resp, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {resp}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem(index, setResponsibilities, responsibilities)} />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <Card>
            <CardHeader>
              <CardTitle>Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Add a benefit..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newBenefit, setBenefits, benefits, setNewBenefit))}
                />
                <Button type="button" onClick={() => addItem(newBenefit, setBenefits, benefits, setNewBenefit)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {benefits.map((benefit, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {benefit}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem(index, setBenefits, benefits)} />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/employer/dashboard')}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !profileCompleteness.isComplete}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading 
                ? (isEditMode ? 'Updating...' : 'Posting...') 
                : (isEditMode ? 'Update Job' : 'Post Job')
              }
            </Button>
          </div>
        </form>
      </div>
    </EmployerDashboardLayout>
  );
};

export default PostJob;
