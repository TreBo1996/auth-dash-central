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
  onSkip: () => void;
}

export const EmploymentPreferencesModal: React.FC<EmploymentPreferencesModalProps> = ({
  fromParam,
  onComplete,
  onSkip
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
      description: "Could not save preferences. You can set them later in your profile.",
      variant: "destructive",
    });
    console.log('EmploymentPreferencesModal - error occurred, calling onSkip with fromParam:', fromParam);
    onSkip(); // Fall back to skipping on error
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
            {fromParam 
              ? 'Set your preferences to get better job matches, then we\'ll take you back to where you left off.'
              : 'Help us find the perfect job matches for you. You can update these anytime in your profile.'
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

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onSkip}
              className="flex-1"
            >
              Skip for now
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