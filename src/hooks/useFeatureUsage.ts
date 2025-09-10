import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';

export interface FeatureUsage {
  feature_type: string;
  current_usage: number;
  limit: number;
  can_use: boolean;
  limit_reached: boolean;
}

export interface FeatureLimits {
  resume_optimizations: number;
  interview_sessions: number;
  cover_letters: number;
  job_descriptions: number;
}

const FREE_LIMITS: FeatureLimits = {
  resume_optimizations: 2,
  interview_sessions: 1,
  cover_letters: 2,
  job_descriptions: 3,
};

const PREMIUM_LIMITS: FeatureLimits = {
  resume_optimizations: -1, // -1 means unlimited
  interview_sessions: -1,
  cover_letters: -1,
  job_descriptions: -1,
};

export const useFeatureUsage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [usage, setUsage] = useState<Record<string, FeatureUsage>>({});
  const [loading, setLoading] = useState(true);

  const isPremium = profile?.has_premium === true;
  const limits = isPremium ? PREMIUM_LIMITS : FREE_LIMITS;

  const fetchUsage = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const featureTypes = Object.keys(FREE_LIMITS);
      const usageData: Record<string, FeatureUsage> = {};

      for (const featureType of featureTypes) {
        const { data, error } = await supabase.rpc('can_use_feature', {
          p_user_id: user.id,
          p_feature_type: featureType,
        });

        if (error) {
          console.error(`Error checking usage for ${featureType}:`, error);
          continue;
        }

        const result = data[0];
        usageData[featureType] = {
          feature_type: featureType,
          current_usage: result.current_usage,
          limit: limits[featureType as keyof FeatureLimits],
          can_use: isPremium || result.can_use,
          limit_reached: !isPremium && result.limit_reached,
        };
      }

      setUsage(usageData);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFeatureAccess = async (featureType: keyof FeatureLimits): Promise<boolean> => {
    if (!user) return false;
    if (isPremium) return true;

    try {
      const { data, error } = await supabase.rpc('can_use_feature', {
        p_user_id: user.id,
        p_feature_type: featureType,
      });

      if (error) {
        console.error(`Error checking access for ${featureType}:`, error);
        return false;
      }

      return data[0]?.can_use || false;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  };

  const incrementUsage = async (featureType: keyof FeatureLimits): Promise<void> => {
    if (!user || isPremium) return;

    try {
      await supabase.rpc('increment_feature_usage', {
        p_user_id: user.id,
        p_feature_type: featureType,
      });

      // Refresh usage data
      await fetchUsage();
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [user, isPremium]);

  return {
    usage,
    loading,
    isPremium,
    limits,
    fetchUsage,
    checkFeatureAccess,
    incrementUsage,
  };
};