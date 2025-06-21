
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
    <div className="space-y-2">
      {Object.values(templateConfigs).map((template) => (
        <div key={template.id} className="space-y-1">
          <Button
            variant={selectedTemplate === template.id ? "default" : "outline"}
            className="w-full justify-start h-auto p-3 text-left"
            onClick={() => onTemplateSelect(template.id)}
          >
            <div className="space-y-1 w-full">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{template.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            </div>
          </Button>
          
          {/* Compact Color Preview */}
          <div className="flex gap-1 justify-center">
            <div 
              className="w-2 h-2 rounded-full border border-gray-200"
              style={{ backgroundColor: template.colors.primary }}
            />
            <div 
              className="w-2 h-2 rounded-full border border-gray-200"
              style={{ backgroundColor: template.colors.secondary }}
            />
            <div 
              className="w-2 h-2 rounded-full border border-gray-200"
              style={{ backgroundColor: template.colors.accent }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
