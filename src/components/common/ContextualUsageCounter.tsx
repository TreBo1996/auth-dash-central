import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, AlertTriangle } from 'lucide-react';
import { useFeatureUsage, type FeatureLimits } from '@/hooks/useFeatureUsage';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PaymentModal } from '@/components/subscription/PaymentModal';

interface ContextualUsageCounterProps {
  features: (keyof FeatureLimits)[];
  showUpgradePrompt?: boolean;
  compact?: boolean;
  onUpgrade?: () => void;
}

const FEATURE_LABELS: Record<keyof FeatureLimits, string> = {
  resume_optimizations: 'Resume Optimizations',
  interview_sessions: 'Interview Sessions',
  cover_letters: 'Cover Letters',
  job_descriptions: 'Job Description Saves',
};

export const ContextualUsageCounter: React.FC<ContextualUsageCounterProps> = ({
  features,
  showUpgradePrompt = true,
  compact = false,
  onUpgrade,
}) => {
  const { usage, isPremium, limits, loading } = useFeatureUsage();
  const { createCheckout } = useSubscription();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Don't show for premium users
  if (isPremium) {
    return null;
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-2 bg-muted rounded w-full"></div>
        </CardContent>
      </Card>
    );
  }

  const handleUpgrade = () => {
    setShowPaymentModal(true);
    onUpgrade?.();
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
  };


  const hasLimitReached = features.some(feature => usage[feature]?.limit_reached);

  return (
    <Card className={`border-2 ${hasLimitReached ? 'border-red-200 bg-red-50/50' : 'border-blue-200/50'}`}>
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'} text-gray-800`}>
              Usage This Month
            </h3>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Free Plan
            </Badge>
          </div>

          {features.map(feature => {
            const featureUsage = usage[feature];
            const limit = limits[feature];
            const currentUsage = featureUsage?.current_usage || 0;
            const progressPercentage = (currentUsage / limit) * 100;
            const remaining = Math.max(0, limit - currentUsage);

            return (
              <div key={feature} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>
                    {FEATURE_LABELS[feature]}
                  </span>
                  <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
                    {currentUsage}/{limit}
                  </span>
                </div>
                
                <Progress 
                  value={progressPercentage} 
                  className="h-1.5"
                />
                
                <div className="flex items-center justify-between">
                  <span className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {remaining} remaining
                  </span>
                  
                  {featureUsage?.limit_reached && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Limit Reached
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}

          {showUpgradePrompt && (
            <div className={`mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border ${hasLimitReached ? 'border-red-200 bg-red-50/50' : 'border-blue-200'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${hasLimitReached ? 'text-red-900' : 'text-blue-900'}`}>
                    {hasLimitReached ? 'Monthly limit reached' : 'Upgrade to Premium'}
                  </p>
                  <p className={`text-xs ${hasLimitReached ? 'text-red-700' : 'text-blue-700'}`}>
                    {hasLimitReached ? 'Upgrade for unlimited access' : 'Get unlimited access and premium features'}
                  </p>
                </div>
                <Button size="sm" onClick={handleUpgrade} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Zap className="h-3 w-3 mr-1" />
                  Upgrade
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
        returnUrl={window.location.href}
      />
    </Card>
  );
};