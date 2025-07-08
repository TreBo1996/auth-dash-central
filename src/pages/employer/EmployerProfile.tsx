
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, MapPin, Globe, Phone, Mail, Users, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { EmployerDashboardLayout } from '@/components/layout/EmployerDashboardLayout';
import { useEmployerProfile } from '@/hooks/useEmployerProfile';
import { ProfileCompletionCard } from '@/components/employer/ProfileCompletionCard';

const EmployerProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { profile, loading: profileLoading, fetchProfile, profileCompleteness } = useEmployerProfile();
  
  const [formData, setFormData] = useState({
    company_name: '',
    company_description: '',
    industry: '',
    company_size: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: 'United States',
    contact_email: '',
    contact_phone: '',
    logo_url: ''
  });

  // Load existing profile data when it's available
  useEffect(() => {
    if (profile) {
      setFormData({
        company_name: profile.company_name || '',
        company_description: profile.company_description || '',
        industry: profile.industry || '',
        company_size: profile.company_size || '',
        website: profile.website || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || 'United States',
        contact_email: profile.contact_email || '',
        contact_phone: profile.contact_phone || '',
        logo_url: profile.logo_url || ''
      });
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from('employer_profiles')
          .update(formData)
          .eq('id', profile.id);

        if (error) throw error;

        toast({
          title: "Profile updated successfully!",
          description: "Your company profile has been updated.",
        });
      } else {
        // Create new profile
        const { error } = await supabase
          .from('employer_profiles')
          .insert({
            user_id: user.id,
            ...formData
          });

        if (error) throw error;

        toast({
          title: "Profile created successfully!",
          description: "Your company profile has been set up. You can now start posting jobs.",
        });
      }

      // Refresh profile data
      await fetchProfile();

      // Check if we came from job posting and redirect back
      const fromJobPost = searchParams.get('from') === 'job-post';
      if (fromJobPost) {
        navigate('/employer/post-job');
      } else {
        navigate('/employer/dashboard');
      }
    } catch (error) {
      console.error('Error saving employer profile:', error);
      toast({
        title: profile ? "Error updating profile" : "Error creating profile",
        description: "Please try again later.",
        variant: "destructive",
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
            <h1 className="text-3xl font-bold">
              {profile ? 'Update Company Profile' : 'Create Company Profile'}
            </h1>
            <p className="text-muted-foreground">
              {profile 
                ? 'Update your company information and profile details.'
                : 'Set up your company profile to start posting jobs and attract top talent.'
              }
            </p>
          </div>
        </div>

        {/* Show profile completion status */}
        {!profileLoading && (
          <ProfileCompletionCard
            isComplete={profileCompleteness.isComplete}
            missingFields={profileCompleteness.missingFields}
            completionPercentage={profileCompleteness.completionPercentage}
            showAction={false}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    required
                    placeholder="Your company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">
                    Industry <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.industry} onValueChange={(value) => handleChange('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_size">
                    Company Size <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.company_size} onValueChange={(value) => handleChange('company_size', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="501-1000">501-1000 employees</SelectItem>
                      <SelectItem value="1000+">1000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://www.yourcompany.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_description">
                  Company Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="company_description"
                  value={formData.company_description}
                  onChange={(e) => handleChange('company_description', e.target.value)}
                  placeholder="Tell us about your company, mission, and culture..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">
                    Contact Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    placeholder="hr@yourcompany.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="San Francisco"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="CA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={formData.country} onValueChange={(value) => handleChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} size="lg">
                  <Save className="mr-2 h-4 w-4" />
                  {loading 
                    ? (profile ? 'Updating Profile...' : 'Creating Profile...') 
                    : (profile ? 'Update Profile' : 'Create Profile')
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </EmployerDashboardLayout>
  );
};

export default EmployerProfile;
