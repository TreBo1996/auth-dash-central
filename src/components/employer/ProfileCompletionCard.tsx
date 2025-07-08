import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Building, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileCompletionCardProps {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
  showAction?: boolean;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  isComplete,
  missingFields,
  completionPercentage,
  showAction = true
}) => {
  const navigate = useNavigate();

  if (isComplete) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Profile Complete</p>
              <p className="text-sm text-green-600">Your company profile is ready for job postings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="h-5 w-5" />
          Profile Incomplete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-orange-700">Completion Progress</span>
            <span className="font-medium text-orange-800">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        <div>
          <p className="text-sm text-orange-700 mb-2">
            To post jobs, please complete these required fields:
          </p>
          <ul className="text-sm text-orange-600 space-y-1">
            {missingFields.map((field, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full flex-shrink-0" />
                {field}
              </li>
            ))}
          </ul>
        </div>

        {showAction && (
          <Button 
            onClick={() => navigate('/employer/profile')}
            className="w-full"
            variant="default"
          >
            <Building className="h-4 w-4 mr-2" />
            Complete Company Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
};