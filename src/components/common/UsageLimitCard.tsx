import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap } from 'lucide-react';
import { useFeatureUsage, type FeatureLimits } from '@/hooks/useFeatureUsage';

interface UsageLimitCardProps {
  title: string;
  feature: keyof FeatureLimits;
  description: string;
  onUpgrade?: () => void;
}

const FEATURE_LABELS: Record<keyof FeatureLimits, string> = {
  resume_optimizations: 'Resume Optimizations',
  interview_sessions: 'Interview Prep Sessions',
  cover_letters: 'Cover Letter Generations',
  job_descriptions: 'Job Description Saves',
};

export const UsageLimitCard: React.FC<UsageLimitCardProps> = ({
  title,
  feature,
  description,
  onUpgrade,
}) => {
  const { usage, isPremium, limits } = useFeatureUsage();
  
  const featureUsage = usage[feature];
  const limit = limits[feature];
  const isUnlimited = limit === -1;
  const progressPercentage = isUnlimited ? 0 : (featureUsage?.current_usage || 0) / limit * 100;
  const remaining = isUnlimited ? 'Unlimited' : Math.max(0, limit - (featureUsage?.current_usage || 0));

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {title}
              {isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          </div>
          {isPremium ? (
            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          ) : (
            <Badge variant="outline">Free</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {!isPremium && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Usage this month</span>
              <span className="font-medium">
                {featureUsage?.current_usage || 0} of {limit} used
              </span>
            </div>
          )}
          
          {!isPremium && (
            <Progress 
              value={progressPercentage} 
              className="h-2"
            />
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isPremium ? 'Unlimited access' : `${remaining} remaining`}
            </span>
            
            {!isPremium && featureUsage?.limit_reached && onUpgrade && (
              <Button 
                size="sm" 
                onClick={onUpgrade}
                className="h-8 px-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Zap className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};