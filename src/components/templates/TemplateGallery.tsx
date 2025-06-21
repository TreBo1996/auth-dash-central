import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResumeTemplateRenderer } from './ResumeTemplateRenderer';
import { ParsedResume } from '@/types/resume';

interface Template {
  id: string;
  name: string;
  description: string;
  premium_required: boolean;
  template_config: any;
}

interface TemplateGalleryProps {
  resume: ParsedResume;
  onTemplateSelect: (templateId: string, templateConfig: any) => void;
  selectedTemplateId?: string;
  userPlanLevel?: string;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  resume,
  onTemplateSelect,
  selectedTemplateId,
  userPlanLevel = 'free'
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('resume_templates')
        .select('*')
        .order('premium_required', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load resume templates.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canAccessTemplate = (template: Template) => {
    if (!template.premium_required) return true;
    return userPlanLevel === 'starter' || userPlanLevel === 'premium';
  };

  const handleTemplateSelect = (template: Template) => {
    if (!canAccessTemplate(template)) {
      toast({
        title: "Premium Template",
        description: "Upgrade to Starter or Premium to access this template.",
        variant: "destructive"
      });
      return;
    }

    onTemplateSelect(template.id, template.template_config);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a Template</h2>
        <p className="text-gray-600">Select a professional template for your resume</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          const hasAccess = canAccessTemplate(template);
          
          return (
            <Card 
              key={template.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              } ${!hasAccess ? 'opacity-60' : ''}`}
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {template.premium_required && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{template.description}</p>
                <div className="flex gap-2">
                  {template.premium_required ? (
                    <Badge variant="secondary">Premium</Badge>
                  ) : (
                    <Badge variant="outline">Free</Badge>
                  )}
                  {isSelected && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48 overflow-hidden rounded border bg-white">
                  <div className="scale-[0.3] origin-top-left transform-gpu">
                    <ResumeTemplateRenderer
                      resume={resume}
                      templateConfig={template.template_config}
                      templateName={template.name}
                    />
                  </div>
                </div>
                <Button
                  className="w-full mt-4"
                  variant={isSelected ? "default" : "outline"}
                  disabled={!hasAccess}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTemplateSelect(template);
                  }}
                >
                  {!hasAccess ? 'Upgrade Required' : isSelected ? 'Selected' : 'Use Template'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {userPlanLevel === 'free' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Unlock Premium Templates</h3>
          </div>
          <p className="text-blue-700 text-sm mb-3">
            Get access to professional premium templates with advanced styling and layouts.
          </p>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            Upgrade Plan
          </Button>
        </div>
      )}
    </div>
  );
};
