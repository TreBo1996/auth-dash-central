
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTemplatePreferences = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplateConfig, setSelectedTemplateConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserPreferences();
  }, []);

  const fetchUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
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
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.resume_templates) {
        setSelectedTemplateId(data.selected_template_id);
        setSelectedTemplateConfig(data.resume_templates.template_config);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTemplatePreference = async (templateId: string, templateConfig: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_template_preferences')
        .upsert({
          user_id: user.id,
          selected_template_id: templateId,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSelectedTemplateId(templateId);
      setSelectedTemplateConfig(templateConfig);

      toast({
        title: "Template Updated",
        description: "Your template preference has been saved.",
      });
    } catch (error) {
      console.error('Error updating template preference:', error);
      toast({
        title: "Error",
        description: "Failed to save template preference.",
        variant: "destructive"
      });
    }
  };

  return {
    selectedTemplateId,
    selectedTemplateConfig,
    loading,
    updateTemplatePreference,
    refetch: fetchUserPreferences
  };
};
