
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserPlan = () => {
  const [planLevel, setPlanLevel] = useState<string>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPlan();
  }, []);

  const fetchUserPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('plan_level')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setPlanLevel(data?.plan_level || 'free');
    } catch (error) {
      console.error('Error fetching user plan:', error);
      setPlanLevel('free');
    } finally {
      setLoading(false);
    }
  };

  return { planLevel, loading, refetch: fetchUserPlan };
};
