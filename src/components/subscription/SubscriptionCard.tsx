import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Calendar, RefreshCw, Settings } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { format } from 'date-fns';

export const SubscriptionCard = () => {
  const { subscriptionData, loading, refreshSubscription, openCustomerPortal, createCheckout } = useSubscription();

  const handleUpgradeClick = async () => {
    try {
      const checkoutUrl = await createCheckout();
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    }
  };

  const isPremium = subscriptionData?.subscribed && subscriptionData?.subscription_tier === 'premium';
  const isSubscribed = subscriptionData?.subscribed;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className={`h-5 w-5 ${isPremium ? 'text-yellow-500' : 'text-gray-400'}`} />
            <CardTitle className="text-lg">Subscription Status</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshSubscription}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <div className="flex items-center gap-2">
              <p className="font-semibold capitalize">
                {isSubscribed ? subscriptionData?.subscription_tier || 'Premium' : 'Free'}
              </p>
              {isPremium && (
                <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500">
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </div>

        {isSubscribed && subscriptionData?.subscription_end && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Renews {format(new Date(subscriptionData.subscription_end), 'MMM dd, yyyy')}</span>
          </div>
        )}

        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button 
              onClick={handleUpgradeClick}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Premium
            </Button>
          ) : (
            <Button 
              onClick={openCustomerPortal}
              variant="outline" 
              className="flex-1"
            >
              <Settings className="mr-2 h-4 w-4" />
              Manage Subscription
            </Button>
          )}
        </div>

        {!isSubscribed && (
          <CardDescription className="text-xs">
            Upgrade to unlock unlimited resume optimizations, cover letters, and premium templates.
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
};