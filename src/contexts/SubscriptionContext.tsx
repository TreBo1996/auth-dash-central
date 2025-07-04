import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

interface SubscriptionContextType {
  subscriptionData: SubscriptionData | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  createCheckout: (returnUrl?: string) => Promise<string | null>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshSubscription = useCallback(async () => {
    if (!user || !session) {
      setSubscriptionData(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionData({ subscribed: false, subscription_tier: null, subscription_end: null });
      } else {
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      setSubscriptionData({ subscribed: false, subscription_tier: null, subscription_end: null });
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  const createCheckout = useCallback(async (returnUrl?: string): Promise<string | null> => {
    if (!user || !session) {
      throw new Error('User must be authenticated to create checkout');
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          return_url: returnUrl || window.location.href,
        },
      });

      if (error) {
        console.error('Error creating checkout:', error);
        return null;
      }

      return data.url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      return null;
    }
  }, [user, session]);

  const openCustomerPortal = useCallback(async () => {
    if (!user || !session) {
      throw new Error('User must be authenticated to open customer portal');
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error opening customer portal:', error);
        return;
      }

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  }, [user, session]);

  // Check subscription on user change and periodically
  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  // Auto-refresh subscription every 30 seconds when user is active
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshSubscription();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, refreshSubscription]);

  const value = {
    subscriptionData,
    loading,
    refreshSubscription,
    createCheckout,
    openCustomerPortal,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};