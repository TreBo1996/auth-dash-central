
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTemplatePreferences = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplateConfig, setSelectedTemplateConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserPreferences();
  }, []);

  const fetchUserPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('user_template_preferences')
        .select(`
          selected_template_id,
          resume_templates (
            id,
            name,
            template_config
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user preferences:', fetchError);
        setError(fetchError.message);
      } else if (data && data.resume_templates) {
        setSelectedTemplateId(data.selected_template_id);
        setSelectedTemplateConfig(data.resume_templates.template_config);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch template preferences');
    } finally {
      setLoading(false);
    }
  };

  const updateTemplatePreference = async (templateId: string, templateConfig: any) => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from('user_template_preferences')
        .upsert({
          user_id: user.id,
          selected_template_id: templateId,
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        console.error('Error updating template preference:', updateError);
        setError(updateError.message);
        toast({
          title: "Error",
          description: "Failed to save template preference.",
          variant: "destructive"
        });
        return;
      }

      setSelectedTemplateId(templateId);
      setSelectedTemplateConfig(templateConfig);

      toast({
        title: "Template Updated",
        description: "Your template preference has been saved.",
      });
    } catch (error) {
      console.error('Error updating template preference:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update template preference';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return {
    selectedTemplateId,
    selectedTemplateConfig,
    loading,
    error,
    updateTemplatePreference,
    refetch: fetchUserPreferences
  };
};
