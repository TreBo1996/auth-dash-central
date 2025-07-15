import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { EmploymentPreferencesForm } from '@/components/forms/EmploymentPreferencesForm';

interface EmploymentPreferencesModalProps {
  fromParam?: string | null;
  onComplete: () => void;
}

export const EmploymentPreferencesModal: React.FC<EmploymentPreferencesModalProps> = ({
  fromParam,
  onComplete
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Debug logging for fromParam
  console.log('EmploymentPreferencesModal - fromParam received:', fromParam);

  const handleSavePreferences = (data: any) => {
    console.log('Employment preferences saved successfully:', data);
    
    toast({
      title: "Preferences saved!",
      description: "We'll use these to find better job matches for you.",
    });
    
    console.log('EmploymentPreferencesModal - calling onComplete with fromParam:', fromParam);
    onComplete();
  };

  const handlePreferencesError = (error: Error) => {
    console.error('Error saving preferences:', error);
    toast({
      title: "Error",
      description: "Please fix the errors and try again. This information is required to continue.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full w-16 h-16 flex items-center justify-center">
            <Star className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Complete Your Job Profile</CardTitle>
          <CardDescription className="text-base">
            {fromParam 
              ? 'Complete your job preferences to get better matches, then we\'ll take you back to where you left off.'
              : 'This information is required to personalize your job search experience and provide better recommendations.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {user && (
            <EmploymentPreferencesForm
              userId={user.id}
              onSave={handleSavePreferences}
              onError={handlePreferencesError}
              showNotificationSettings={false}
            />
          )}

          <p className="text-center text-sm text-muted-foreground mt-4">
            Complete all required fields (*) to continue. You can update these preferences anytime in your Profile Settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};