
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { templateConfigs } from './templateConfigs';

interface TemplateSelectorProps {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect
}) => {
  return (
    <div className="space-y-3">
      {Object.values(templateConfigs).map((template) => (
        <div key={template.id} className="space-y-2">
          <Button
            variant={selectedTemplate === template.id ? "default" : "outline"}
            className="w-full justify-start h-auto p-4"
            onClick={() => onTemplateSelect(template.id)}
          >
            <div className="text-left space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{template.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {template.description}
              </p>
            </div>
          </Button>
          
          {/* Color Preview */}
          <div className="flex gap-1 px-4">
            <div 
              className="w-3 h-3 rounded-full border border-gray-200"
              style={{ backgroundColor: template.colors.primary }}
            />
            <div 
              className="w-3 h-3 rounded-full border border-gray-200"
              style={{ backgroundColor: template.colors.secondary }}
            />
            <div 
              className="w-3 h-3 rounded-full border border-gray-200"
              style={{ backgroundColor: template.colors.accent }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
