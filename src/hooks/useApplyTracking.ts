import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useApplyTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const { toast } = useToast();

  const trackApplyClick = async (jobSource: 'employer' | 'database', jobId: string) => {
    if (isTracking) return; // Prevent double tracking
    
    setIsTracking(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('job_apply_tracking')
        .insert({
          user_id: user?.id || null, // Allow null for non-authenticated users
          job_source: jobSource,
          job_id: jobId,
        });

      if (error) {
        console.error('Error tracking apply click:', error);
        // Don't show error to user as this shouldn't block the apply flow
      }
    } catch (error) {
      console.error('Error tracking apply click:', error);
      // Don't show error to user as this shouldn't block the apply flow
    } finally {
      setIsTracking(false);
    }
  };

  return { trackApplyClick, isTracking };
};