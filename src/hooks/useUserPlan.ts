
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserPlan = () => {
  const [planLevel, setPlanLevel] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserPlan();
  }, []);

  const fetchUserPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPlanLevel('free');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('plan_level')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching user plan:', fetchError);
        setError(fetchError.message);
        setPlanLevel('free'); // Fallback to free plan
      } else {
        setPlanLevel(data?.plan_level || 'free');
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch user plan');
      setPlanLevel('free'); // Fallback to free plan
    } finally {
      setLoading(false);
    }
  };

  return { planLevel, loading, error, refetch: fetchUserPlan };
};
