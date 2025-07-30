import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Zap, AlertTriangle, FileText } from 'lucide-react';
import { useFeatureUsage } from '@/hooks/useFeatureUsage';

interface JobDescriptionUsageCardProps {
  onUpgrade?: () => void;
}

export const JobDescriptionUsageCard: React.FC<JobDescriptionUsageCardProps> = ({
  onUpgrade
}) => {
  const { usage, isPremium, limits } = useFeatureUsage();
  
  const jobDescUsage = usage['job_descriptions'];
  const limit = limits['job_descriptions'];
  const isUnlimited = limit === -1;
  const currentUsage = jobDescUsage?.current_usage || 0;
  const progressPercentage = isUnlimited ? 0 : (currentUsage / limit) * 100;
  const remaining = isUnlimited ? 'Unlimited' : Math.max(0, limit - currentUsage);
  const isNearLimit = !isUnlimited && progressPercentage >= 66; // Show warning at 2/3 usage
  const isAtLimit = !isUnlimited && jobDescUsage?.limit_reached;

  if (isPremium) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Job Description Saves
            </CardTitle>
            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">This month</span>
            <span className="font-medium text-green-600">Unlimited saves available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${isAtLimit ? 'border-red-200 bg-red-50/30' : isNearLimit ? 'border-orange-200 bg-orange-50/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Job Description Saves
          </CardTitle>
          <Badge variant="outline">Free Plan</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Usage Display */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Usage this month</span>
          <span className="font-medium">
            {currentUsage} of {limit} used
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div 
            className={`h-full transition-all ${
              isAtLimit 
                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                : isNearLimit 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        
        {/* Status and Actions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isAtLimit ? 'Limit reached' : `${remaining} remaining`}
            </span>
          </div>

          {/* Warning/Limit Messages */}
          {isAtLimit && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                You've reached your monthly limit. Upgrade to continue saving job descriptions.
              </AlertDescription>
            </Alert>
          )}

          {isNearLimit && !isAtLimit && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                You're close to your monthly limit. Consider upgrading for unlimited saves.
              </AlertDescription>
            </Alert>
          )}

          {/* Upgrade Button */}
          {(isAtLimit || isNearLimit) && onUpgrade && (
            <Button 
              size="sm" 
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Zap className="h-3 w-3 mr-1" />
              Upgrade to Premium
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};