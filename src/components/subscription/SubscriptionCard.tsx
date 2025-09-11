import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Calendar, RefreshCw, Settings, Wallet } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useWalletContext } from '@/contexts/WalletContext';
import { useProfile } from '@/hooks/useProfile';
import { format } from 'date-fns';

export const SubscriptionCard = () => {
  const { subscriptionData, loading, refreshSubscription, openCustomerPortal, createCheckout } = useSubscription();
  const { isConnected, tokenBalance } = useWalletContext();
  const { profile } = useProfile();

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

  // Check for wallet-based premium access
  const hasWalletPremium = isConnected && tokenBalance !== null && tokenBalance >= 10000;
  
  // Check for Stripe premium access
  const hasStripePremium = subscriptionData?.subscribed && subscriptionData?.subscription_tier === 'premium';
  
  // Check for database premium status (from profile)
  const hasProfilePremium = profile?.has_premium;
  
  // Unified premium status
  const isPremium = hasStripePremium || hasWalletPremium || hasProfilePremium;
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
                {isPremium ? 'Premium' : 'Free'}
              </p>
              {isPremium && (
                <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-orange-500">
                  Premium
                </Badge>
              )}
            </div>
            {isPremium && (
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs text-muted-foreground">
                  {hasStripePremium && 'Stripe Subscription'}
                  {hasWalletPremium && !hasStripePremium && (
                    <>
                      <Wallet className="h-3 w-3 inline mr-1" />
                      Solana Wallet Verified
                    </>
                  )}
                  {hasProfilePremium && !hasStripePremium && !hasWalletPremium && 'Premium Access'}
                </p>
              </div>
            )}
          </div>
        </div>

        {isSubscribed && subscriptionData?.subscription_end && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Renews {format(new Date(subscriptionData.subscription_end), 'MMM dd, yyyy')}</span>
          </div>
        )}

        <div className="flex gap-2">
          {!isPremium ? (
            <Button 
              onClick={handleUpgradeClick}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Premium
            </Button>
          ) : isSubscribed ? (
            <Button 
              onClick={openCustomerPortal}
              variant="outline" 
              className="flex-1"
            >
              <Settings className="mr-2 h-4 w-4" />
              Manage Subscription
            </Button>
          ) : (
            <Button 
              onClick={handleUpgradeClick}
              variant="outline"
              className="flex-1"
            >
              <Crown className="mr-2 h-4 w-4" />
              Also Available via Stripe
            </Button>
          )}
        </div>

        {!isPremium && (
          <CardDescription className="text-xs">
            Upgrade to unlock unlimited resume optimizations, cover letters, and premium templates.
          </CardDescription>
        )}
        
        {isPremium && !isSubscribed && (
          <CardDescription className="text-xs">
            You have premium access! You can also subscribe via Stripe for additional payment options.
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
};