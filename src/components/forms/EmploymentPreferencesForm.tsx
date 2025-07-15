import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { MapPin, DollarSign, Briefcase, Star, Clock, Loader2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmploymentPreferences {
  desired_job_title: string;
  experience_level: string;
  work_setting_preference: string;
  preferred_location: string;
  job_type_preference: string;
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  desired_salary_currency: string;
  industry_preferences: string[];
  email_notifications_enabled: boolean;
  newsletter_enabled: boolean;
  // Contact information fields
  contact_phone: string;
  contact_location: string;
}

interface EmploymentPreferencesFormProps {
  userId: string;
  initialData?: Partial<EmploymentPreferences>;
  onSave?: (data: EmploymentPreferences) => void;
  onError?: (error: Error) => void;
  showNotificationSettings?: boolean;
  className?: string;
}

// Value mappings between UI display and database values
// These MUST match the database CHECK constraints exactly
const EXPERIENCE_LEVEL_MAP = {
  // UI Display -> Database Value
  'Entry Level': 'entry',
  'Mid Level': 'mid', 
  'Senior Level': 'senior',
  'Executive': 'executive'
} as const;

const WORK_SETTING_MAP = {
  'Remote': 'remote',
  'Hybrid': 'hybrid',
  'On-site': 'on-site',
  'Any': 'any'
} as const;

const JOB_TYPE_MAP = {
  'Full-time': 'full-time',
  'Part-time': 'part-time',
  'Contract': 'contract',
  'Any': 'any'
} as const;

// Reverse mappings for display
const getDisplayValue = (dbValue: string, map: Record<string, string>) => {
  return Object.keys(map).find(key => map[key as keyof typeof map] === dbValue) || dbValue;
};

export const EmploymentPreferencesForm: React.FC<EmploymentPreferencesFormProps> = ({
  userId,
  initialData = {},
  onSave,
  onError,
  showNotificationSettings = true,
  className = ''
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  
  const [preferences, setPreferences] = useState<EmploymentPreferences>({
    desired_job_title: '',
    experience_level: '',
    work_setting_preference: '',
    preferred_location: '',
    job_type_preference: '',
    desired_salary_min: null,
    desired_salary_max: null,
    desired_salary_currency: 'USD',
    industry_preferences: [],
    email_notifications_enabled: true,
    newsletter_enabled: true,
    contact_phone: '',
    contact_location: '',
    ...initialData
  });

  // Validation for required fields
  const requiredFields = ['desired_job_title', 'experience_level', 'work_setting_preference'] as const;
  const isFormValid = requiredFields.every(field => preferences[field] && preferences[field].trim() !== '');
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  const experienceLevels = Object.keys(EXPERIENCE_LEVEL_MAP);
  const workSettings = Object.keys(WORK_SETTING_MAP);
  const jobTypes = Object.keys(JOB_TYPE_MAP);
  
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

  // Load initial data on mount and map database values to display values
  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      console.log('Loading initial data from database:', initialData);
      
      // Map database values back to display values for the form
      const mappedData = {
        ...initialData,
        experience_level: initialData.experience_level 
          ? getDisplayValue(initialData.experience_level, EXPERIENCE_LEVEL_MAP)
          : '',
        work_setting_preference: initialData.work_setting_preference
          ? getDisplayValue(initialData.work_setting_preference, WORK_SETTING_MAP)
          : '',
        job_type_preference: initialData.job_type_preference
          ? getDisplayValue(initialData.job_type_preference, JOB_TYPE_MAP)
          : ''
      };
      
      console.log('Mapped data for form display:', mappedData);
      setPreferences(prev => ({ ...prev, ...mappedData }));
    }
  }, [initialData]);

  const handleInputChange = (field: keyof EmploymentPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleIndustryToggle = (industry: string) => {
    setPreferences(prev => ({
      ...prev,
      industry_preferences: prev.industry_preferences.includes(industry)
        ? prev.industry_preferences.filter(i => i !== industry)
        : [...prev.industry_preferences, industry]
    }));
    setHasUnsavedChanges(true);
  };

  const handleSavePreferences = async () => {
    setHasAttemptedSave(true);
    
    if (!userId) {
      onError?.(new Error('User ID is required'));
      return;
    }

    // Validate required fields
    if (!isFormValid) {
      const missingFields = requiredFields.filter(field => !preferences[field] || preferences[field].trim() === '');
      onError?.(new Error(`Please complete the following required fields: ${missingFields.join(', ')}`));
      return;
    }

    try {
      setIsLoading(true);
      setHasUnsavedChanges(false);
      
      // Map display values back to database values
      const dbData = {
        desired_job_title: preferences.desired_job_title || null,
        experience_level: preferences.experience_level 
          ? EXPERIENCE_LEVEL_MAP[preferences.experience_level as keyof typeof EXPERIENCE_LEVEL_MAP] || null
          : null,
        work_setting_preference: preferences.work_setting_preference
          ? WORK_SETTING_MAP[preferences.work_setting_preference as keyof typeof WORK_SETTING_MAP] || null
          : null,
        job_type_preference: preferences.job_type_preference
          ? JOB_TYPE_MAP[preferences.job_type_preference as keyof typeof JOB_TYPE_MAP] || null
          : null,
        preferred_location: preferences.preferred_location || null,
        desired_salary_min: preferences.desired_salary_min || null,
        desired_salary_max: preferences.desired_salary_max || null,
        desired_salary_currency: preferences.desired_salary_currency,
        industry_preferences: preferences.industry_preferences.length > 0 ? preferences.industry_preferences : null,
        email_notifications_enabled: preferences.email_notifications_enabled,
        newsletter_enabled: preferences.newsletter_enabled,
        contact_phone: preferences.contact_phone || null,
        contact_location: preferences.contact_location || null
      };

      console.log('Saving employment preferences:', dbData);

      const { error } = await supabase
        .from('profiles')
        .update(dbData)
        .eq('id', userId);

      if (error) {
        console.error('Error saving employment preferences:', error);
        
        // Handle specific constraint violations
        if (error.message.includes('constraint') || error.message.includes('check')) {
          const friendlyError = new Error('Please check your selections. Some values may not be valid for the database.');
          onError?.(friendlyError);
          toast({
            title: "Invalid Data",
            description: "Please check your selections and try again. Some values may not be valid.",
            variant: "destructive"
          });
        } else {
          onError?.(error);
          toast({
            title: "Save Failed",
            description: "There was an error saving your preferences. Please try again.",
            variant: "destructive"
          });
        }
        return;
      }

      console.log('Employment preferences saved successfully');
      
      // Set success state
      setLastSavedAt(new Date());
      setShowSuccessBanner(true);
      
      // Hide success banner after 3 seconds
      setTimeout(() => {
        setShowSuccessBanner(false);
      }, 3000);

      // Call onSave callback with current preferences
      onSave?.(preferences);

      toast({
        title: "Preferences Saved ✓",
        description: `Your employment preferences have been updated successfully at ${new Date().toLocaleTimeString()}.`,
        duration: 5000
      });
    } catch (error) {
      console.error('Error saving employment preferences:', error);
      const err = error instanceof Error ? error : new Error('Unknown error occurred');
      onError?.(err);
      toast({
        title: "Save Failed",
        description: "There was an error saving your employment preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-800 text-sm font-medium">
            Preferences saved successfully!
          </span>
        </div>
      )}

      {/* Unsaved Changes Indicator */}
      {hasUnsavedChanges && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <span className="text-amber-800 text-sm">
            You have unsaved changes
          </span>
        </div>
      )}

      <div className="space-y-6">
        {/* Contact Information */}
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
          <h3 className="text-lg font-medium text-blue-900">Contact Information</h3>
          <p className="text-sm text-blue-700">This information will be used in your resumes and job applications</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone Number</Label>
              <Input
                id="contact-phone"
                placeholder="e.g. (555) 123-4567"
                value={preferences.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-location">Contact Location</Label>
              <Input
                id="contact-location"
                placeholder="e.g. New York, NY"
                value={preferences.contact_location}
                onChange={(e) => handleInputChange('contact_location', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Job Title */}
        <div className="space-y-2">
          <Label htmlFor="job-title" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Desired Job Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="job-title"
            placeholder="e.g. Software Engineer, Marketing Manager"
            value={preferences.desired_job_title}
            onChange={(e) => handleInputChange('desired_job_title', e.target.value)}
            className={hasAttemptedSave && !preferences.desired_job_title.trim() ? 'border-red-500' : ''}
          />
          {hasAttemptedSave && !preferences.desired_job_title.trim() && (
            <p className="text-sm text-red-500">Job title is required</p>
          )}
        </div>

        {/* Experience Level */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Experience Level <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={preferences.experience_level} 
            onValueChange={(value) => handleInputChange('experience_level', value)}
          >
            <SelectTrigger className={hasAttemptedSave && !preferences.experience_level ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select your experience level" />
            </SelectTrigger>
            <SelectContent>
              {experienceLevels.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasAttemptedSave && !preferences.experience_level && (
            <p className="text-sm text-red-500">Experience level is required</p>
          )}
        </div>

        {/* Work Setting */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Work Setting <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={preferences.work_setting_preference} 
            onValueChange={(value) => handleInputChange('work_setting_preference', value)}
          >
            <SelectTrigger className={hasAttemptedSave && !preferences.work_setting_preference ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select preferred work setting" />
            </SelectTrigger>
            <SelectContent>
              {workSettings.map(setting => (
                <SelectItem key={setting} value={setting}>{setting}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasAttemptedSave && !preferences.work_setting_preference && (
            <p className="text-sm text-red-500">Work setting is required</p>
          )}
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
            onChange={(e) => handleInputChange('preferred_location', e.target.value)}
          />
        </div>

        {/* Job Type */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Job Type
          </Label>
          <Select 
            value={preferences.job_type_preference} 
            onValueChange={(value) => handleInputChange('job_type_preference', value)}
          >
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
            Salary Range (Annual)
          </Label>
          <div className="grid grid-cols-3 gap-3">
            <Input
              placeholder="Min salary"
              type="number"
              value={preferences.desired_salary_min || ''}
              onChange={(e) => handleInputChange('desired_salary_min', e.target.value ? parseInt(e.target.value) : null)}
            />
            <Input
              placeholder="Max salary"
              type="number"
              value={preferences.desired_salary_max || ''}
              onChange={(e) => handleInputChange('desired_salary_max', e.target.value ? parseInt(e.target.value) : null)}
            />
            <Select 
              value={preferences.desired_salary_currency} 
              onValueChange={(value) => handleInputChange('desired_salary_currency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
              </SelectContent>
            </Select>
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

        {/* Notification Settings */}
        {showNotificationSettings && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Notification Preferences</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications about job matches and updates</p>
              </div>
              <Switch
                checked={preferences.email_notifications_enabled}
                onCheckedChange={(checked) => handleInputChange('email_notifications_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Newsletter</Label>
                <p className="text-sm text-gray-500">Receive our weekly job market insights and tips</p>
              </div>
              <Switch
                checked={preferences.newsletter_enabled}
                onCheckedChange={(checked) => handleInputChange('newsletter_enabled', checked)}
              />
            </div>
          </div>
        )}

        {/* Validation Message */}
        {hasAttemptedSave && !isFormValid && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-red-800 text-sm">
              Please complete all required fields (*) to continue
            </span>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4">
          <Button
            onClick={handleSavePreferences}
            disabled={isLoading || (!hasUnsavedChanges && isFormValid)}
            className="w-full bg-indigo-900 hover:bg-indigo-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Profile'
            )}
          </Button>
          
          {lastSavedAt && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Last saved: {lastSavedAt.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};