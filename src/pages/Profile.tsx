
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { User, Save, Mail, Briefcase, DollarSign, Lock, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { AdminTools } from '@/components/admin/AdminTools';
import { UsageDashboard } from '@/components/dashboard/UsageDashboard';
import { SubscriptionCard } from '@/components/subscription/SubscriptionCard';

interface UserProfile {
  email: string;
  full_name?: string;
  is_admin?: boolean;
  user_metadata?: {
    full_name?: string;
  };
  // Employment preferences
  desired_job_title?: string;
  desired_salary_min?: number;
  desired_salary_max?: number;
  desired_salary_currency?: string;
  work_setting_preference?: string;
  experience_level?: string;
  preferred_location?: string;
  industry_preferences?: string[];
  job_type_preference?: string;
  email_notifications_enabled?: boolean;
  newsletter_enabled?: boolean;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Employment preferences state
  const [desiredJobTitle, setDesiredJobTitle] = useState('');
  const [salaryMin, setSalaryMin] = useState<number | undefined>();
  const [salaryMax, setSalaryMax] = useState<number | undefined>();
  const [salaryCurrency, setSalaryCurrency] = useState('USD');
  const [workSetting, setWorkSetting] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [industryPreferences, setIndustryPreferences] = useState<string[]>([]);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newsletter, setNewsletter] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setFullName(user.user_metadata?.full_name || '');
        
        // Fetch profile data including admin status and employment preferences
        const { data: profileData } = await supabase
          .from('profiles')
          .select(`
            email, full_name, is_admin,
            desired_job_title, desired_salary_min, desired_salary_max, desired_salary_currency,
            work_setting_preference, experience_level, preferred_location,
            industry_preferences, job_type_preference, email_notifications_enabled, newsletter_enabled
          `)
          .eq('id', user.id)
          .single();
          
        setProfile(profileData);
        
        // Set employment preferences state if data exists
        if (profileData) {
          setDesiredJobTitle(profileData.desired_job_title || '');
          setSalaryMin(profileData.desired_salary_min || undefined);
          setSalaryMax(profileData.desired_salary_max || undefined);
          setSalaryCurrency(profileData.desired_salary_currency || 'USD');
          setWorkSetting(profileData.work_setting_preference || '');
          setExperienceLevel(profileData.experience_level || '');
          setPreferredLocation(profileData.preferred_location || '');
          setJobType(profileData.job_type_preference || '');
          setIndustryPreferences(profileData.industry_preferences || []);
          setEmailNotifications(profileData.email_notifications_enabled ?? true);
          setNewsletter(profileData.newsletter_enabled ?? true);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (authError) throw authError;

      // Update profile in database including employment preferences
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          desired_job_title: desiredJobTitle || null,
          desired_salary_min: salaryMin || null,
          desired_salary_max: salaryMax || null,
          desired_salary_currency: salaryCurrency,
          work_setting_preference: workSetting || null,
          experience_level: experienceLevel || null,
          preferred_location: preferredLocation || null,
          job_type_preference: jobType || null,
          industry_preferences: industryPreferences.length > 0 ? industryPreferences : null,
          email_notifications_enabled: emailNotifications,
          newsletter_enabled: newsletter
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update local state
      setUser(prev => prev ? {
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          full_name: fullName
        }
      } : null);

      toast({
        title: "Profile Updated",
        description: "Your profile and employment preferences have been updated successfully."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/\d/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');
    return errors;
  };

  const handleChangePassword = async () => {
    if (!user) return;

    // Validation
    if (!currentPassword) {
      toast({
        title: "Current Password Required",
        description: "Please enter your current password to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive"
      });
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      toast({
        title: "Password Too Weak",
        description: `Password must include: ${passwordErrors.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsChangingPassword(true);

      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
      });

      if (verifyError) {
        toast({
          title: "Incorrect Password",
          description: "Your current password is incorrect.",
          variant: "destructive"
        });
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        toast({
          title: "Password Update Failed",
          description: updateError.message,
          variant: "destructive"
        });
        return;
      }

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully."
      });

    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while changing your password.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        {/* Admin Tools - Only visible to admin users */}
        <AdminTools isAdmin={profile?.is_admin || false} />

        {/* Subscription & Billing */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Subscription & Billing</h2>
          <p className="text-gray-600">Manage your subscription plan and billing information</p>
        </div>
        <SubscriptionCard />

        {/* Usage Overview */}
        <UsageDashboard />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details and account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="pl-10 bg-gray-50"
                />
              </div>
              <p className="text-sm text-gray-500">
                Email address cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving || !fullName.trim()}
                className="w-full bg-indigo-900 hover:bg-indigo-800"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Change your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && (
                <div className="text-sm space-y-1">
                  {validatePassword(newPassword).map((error, index) => (
                    <div key={index} className="text-red-600">• {error}</div>
                  ))}
                  {validatePassword(newPassword).length === 0 && (
                    <div className="text-green-600">• Password meets all requirements</div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <div className="text-sm text-red-600">• Passwords do not match</div>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <div className="text-sm text-green-600">• Passwords match</div>
              )}
            </div>

            <div className="pt-4">
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || validatePassword(newPassword).length > 0}
                variant="outline"
                className="w-full"
              >
                {isChangingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Employment Preferences
            </CardTitle>
            <CardDescription>
              Set your job preferences for personalized job matching and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="desiredJobTitle">Desired Job Title</Label>
                <Input
                  id="desiredJobTitle"
                  type="text"
                  placeholder="e.g., Software Engineer, Product Manager"
                  value={desiredJobTitle}
                  onChange={(e) => setDesiredJobTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entry Level">Entry Level</SelectItem>
                    <SelectItem value="Mid Level">Mid Level</SelectItem>
                    <SelectItem value="Senior Level">Senior Level</SelectItem>
                    <SelectItem value="Lead/Principal">Lead/Principal</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workSetting">Work Setting Preference</Label>
                <Select value={workSetting} onValueChange={setWorkSetting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select work setting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="On-site">On-site</SelectItem>
                    <SelectItem value="Flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobType">Job Type</Label>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredLocation">Preferred Location</Label>
                <Input
                  id="preferredLocation"
                  type="text"
                  placeholder="e.g., San Francisco, CA or Remote"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salaryCurrency">Currency</Label>
                <Select value={salaryCurrency} onValueChange={setSalaryCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Desired Salary Range
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="salaryMin" className="text-sm text-gray-600">Minimum</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    placeholder="50000"
                    value={salaryMin || ''}
                    onChange={(e) => setSalaryMin(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="salaryMax" className="text-sm text-gray-600">Maximum</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    placeholder="100000"
                    value={salaryMax || ''}
                    onChange={(e) => setSalaryMax(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>

            {/* Industry Preferences */}
            <div className="space-y-3">
              <Label>Industry Preferences</Label>
              <p className="text-sm text-gray-600">Select industries you're interested in working in</p>
              <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                {[
                  'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing',
                  'Sales', 'Manufacturing', 'Retail', 'Consulting', 'Government',
                  'Non-profit', 'Media', 'Real Estate', 'Transportation', 'Energy'
                ].map(industry => (
                  <div key={industry} className="flex items-center space-x-2">
                    <Checkbox
                      id={industry}
                      checked={industryPreferences.includes(industry)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setIndustryPreferences(prev => [...prev, industry]);
                        } else {
                          setIndustryPreferences(prev => prev.filter(i => i !== industry));
                        }
                      }}
                    />
                    <label 
                      htmlFor={industry} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {industry}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-gray-900">Notification Preferences</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="emailNotifications">Job Match Notifications</Label>
                  <p className="text-sm text-gray-600">Receive email notifications for matching job opportunities</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="newsletter">Weekly Newsletter</Label>
                  <p className="text-sm text-gray-600">Get weekly career insights and job market updates</p>
                </div>
                <Switch
                  id="newsletter"
                  checked={newsletter}
                  onCheckedChange={setNewsletter}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
            <CardDescription>
              Overview of your account activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600">Resumes Uploaded</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">Job Descriptions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
