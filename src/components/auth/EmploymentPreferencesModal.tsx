import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, DollarSign, Briefcase, Star, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EmploymentPreferencesModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const EmploymentPreferencesModal: React.FC<EmploymentPreferencesModalProps> = ({
  onComplete,
  onSkip
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [preferences, setPreferences] = useState({
    desired_job_title: '',
    experience_level: '',
    work_setting_preference: '',
    preferred_location: '',
    job_type_preference: '',
    desired_salary_min: '',
    desired_salary_max: '',
    industry_preferences: [] as string[],
  });

  const experienceLevels = [
    'Entry Level',
    'Mid Level', 
    'Senior Level',
    'Lead/Principal',
    'Executive'
  ];

  const workSettings = [
    'Remote',
    'Hybrid',
    'On-site',
    'Flexible'
  ];

  const jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Freelance',
    'Internship'
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Marketing',
    'Sales',
    'Manufacturing',
    'Retail',
    'Consulting',
    'Government',
    'Non-profit',
    'Media',
    'Real Estate',
    'Transportation',
    'Energy'
  ];

  const handleIndustryToggle = (industry: string) => {
    setPreferences(prev => ({
      ...prev,
      industry_preferences: prev.industry_preferences.includes(industry)
        ? prev.industry_preferences.filter(i => i !== industry)
        : [...prev.industry_preferences, industry]
    }));
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updateData: any = {};
      
      if (preferences.desired_job_title) updateData.desired_job_title = preferences.desired_job_title;
      if (preferences.experience_level) updateData.experience_level = preferences.experience_level;
      if (preferences.work_setting_preference) updateData.work_setting_preference = preferences.work_setting_preference;
      if (preferences.preferred_location) updateData.preferred_location = preferences.preferred_location;
      if (preferences.job_type_preference) updateData.job_type_preference = preferences.job_type_preference;
      if (preferences.desired_salary_min) updateData.desired_salary_min = parseInt(preferences.desired_salary_min);
      if (preferences.desired_salary_max) updateData.desired_salary_max = parseInt(preferences.desired_salary_max);
      if (preferences.industry_preferences.length > 0) updateData.industry_preferences = preferences.industry_preferences;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Preferences saved!",
        description: "We'll use these to find better job matches for you.",
      });
      
      onComplete();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Could not save preferences. You can set them later in your profile.",
        variant: "destructive",
      });
      onSkip(); // Fall back to skipping on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full w-16 h-16 flex items-center justify-center">
            <Star className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Set Your Job Preferences</CardTitle>
          <CardDescription className="text-base">
            Help us find the perfect job matches for you. You can update these anytime in your profile.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="job-title" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Desired Job Title
            </Label>
            <Input
              id="job-title"
              placeholder="e.g. Software Engineer, Marketing Manager"
              value={preferences.desired_job_title}
              onChange={(e) => setPreferences(prev => ({ ...prev, desired_job_title: e.target.value }))}
            />
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Experience Level
            </Label>
            <Select value={preferences.experience_level} onValueChange={(value) => setPreferences(prev => ({ ...prev, experience_level: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select your experience level" />
              </SelectTrigger>
              <SelectContent>
                {experienceLevels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Work Setting */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Work Setting
            </Label>
            <Select value={preferences.work_setting_preference} onValueChange={(value) => setPreferences(prev => ({ ...prev, work_setting_preference: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select preferred work setting" />
              </SelectTrigger>
              <SelectContent>
                {workSettings.map(setting => (
                  <SelectItem key={setting} value={setting}>{setting}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Preferred Location
            </Label>
            <Input
              id="location"
              placeholder="e.g. New York, NY or Remote"
              value={preferences.preferred_location}
              onChange={(e) => setPreferences(prev => ({ ...prev, preferred_location: e.target.value }))}
            />
          </div>

          {/* Job Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Job Type
            </Label>
            <Select value={preferences.job_type_preference} onValueChange={(value) => setPreferences(prev => ({ ...prev, job_type_preference: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                {jobTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Salary Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Salary Range (Annual, USD)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Min salary"
                type="number"
                value={preferences.desired_salary_min}
                onChange={(e) => setPreferences(prev => ({ ...prev, desired_salary_min: e.target.value }))}
              />
              <Input
                placeholder="Max salary"
                type="number"
                value={preferences.desired_salary_max}
                onChange={(e) => setPreferences(prev => ({ ...prev, desired_salary_max: e.target.value }))}
              />
            </div>
          </div>

          {/* Industries */}
          <div className="space-y-3">
            <Label>Preferred Industries (select all that apply)</Label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {industries.map(industry => (
                <div key={industry} className="flex items-center space-x-2">
                  <Checkbox
                    id={industry}
                    checked={preferences.industry_preferences.includes(industry)}
                    onCheckedChange={() => handleIndustryToggle(industry)}
                  />
                  <label htmlFor={industry} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {industry}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onSkip}
              disabled={isLoading}
              className="flex-1"
            >
              Skip for now
            </Button>
            <Button
              onClick={handleSavePreferences}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            You can update these preferences anytime in your Profile Settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
};