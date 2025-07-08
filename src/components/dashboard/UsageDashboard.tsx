import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Zap, FileText, MessageSquare, BrainCircuit, Upload } from 'lucide-react';
import { useFeatureUsage, type FeatureLimits } from '@/hooks/useFeatureUsage';
import { PaymentModal } from '@/components/subscription/PaymentModal';

const FEATURE_INFO: Record<keyof FeatureLimits, {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  resume_optimizations: {
    title: 'Resume Optimizations',
    description: 'AI-powered resume optimization and editing saves',
    icon: FileText,
  },
  interview_sessions: {
    title: 'Interview Prep Sessions',
    description: 'Mock interview sessions with AI feedback',
    icon: BrainCircuit,
  },
  cover_letters: {
    title: 'Cover Letter Generations',
    description: 'AI-generated personalized cover letters',
    icon: MessageSquare,
  },
  job_descriptions: {
    title: 'Job Description Saves',
    description: 'Job description uploads and saves',
    icon: Upload,
  },
};

export const UsageDashboard: React.FC = () => {
  const { usage, isPremium, limits, loading } = useFeatureUsage();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleUpgrade = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading usage data...</div>
        </CardContent>
      </Card>
    );
  }

  const getProgressGradient = (percentage: number) => {
    if (percentage >= 90) return 'bg-gradient-to-r from-blue-600 to-purple-600';
    if (percentage >= 70) return 'bg-gradient-to-r from-blue-500 to-purple-500';
    return 'bg-gradient-to-r from-blue-400 to-purple-400';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Usage Overview
              {isPremium && <Crown className="h-5 w-5 text-yellow-500" />}
            </CardTitle>
            <CardDescription>
              {isPremium 
                ? 'You have unlimited access to all features'
                : 'Track your monthly feature usage limits'
              }
            </CardDescription>
          </div>
          {isPremium ? (
            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          ) : (
            <Button size="sm" onClick={handleUpgrade} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Zap className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {Object.entries(FEATURE_INFO).map(([feature, info]) => {
          const featureUsage = usage[feature];
          const limit = limits[feature as keyof FeatureLimits];
          const isUnlimited = limit === -1;
          const currentUsage = featureUsage?.current_usage || 0;
          const progressPercentage = isUnlimited ? 0 : (currentUsage / limit) * 100;
          const remaining = isUnlimited ? 'Unlimited' : Math.max(0, limit - currentUsage);
          const Icon = info.icon;

          return (
            <div key={feature} className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="flex-shrink-0">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium truncate">{info.title}</h4>
                  <span className="text-xs text-muted-foreground">
                    {isPremium ? 'Unlimited' : `${currentUsage}/${limit}`}
                  </span>
                </div>
                
                {!isPremium && (
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 mb-1">
                    <div 
                      className={`h-full transition-all ${getProgressGradient(progressPercentage)}`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground truncate">
                    {info.description}
                  </p>
                  <span className="text-xs font-medium whitespace-nowrap">
                    {typeof remaining === 'string' ? remaining : `${remaining} left`}
                  </span>
                </div>
              </div>
              
              {!isPremium && featureUsage?.limit_reached && (
                <Badge variant="destructive" className="text-xs">
                  Limit Reached
                </Badge>
              )}
            </div>
          );
        })}
        
        {!isPremium && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Get unlimited access to all features
                </p>
                <p className="text-xs text-blue-700">
                  Upgrade to Premium for unlimited optimizations, interviews, and more
                </p>
              </div>
              <Button size="sm" onClick={handleUpgrade} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Crown className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
        returnUrl={window.location.href}
      />
    </Card>
  );
};