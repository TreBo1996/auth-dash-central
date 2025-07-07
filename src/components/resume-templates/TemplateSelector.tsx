import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { newTemplateConfigs } from './configs/newTemplateConfigs';
import { PremiumBadge } from './PremiumBadge';
interface TemplateSelectorProps {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
  isMobile?: boolean;
}
export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  isMobile = false
}) => {
  if (isMobile) {
    return <div className="flex gap-3 overflow-x-auto pb-2">
        {Object.values(newTemplateConfigs).map(template => <div key={template.id} className="flex-shrink-0">
            <Button variant={selectedTemplate === template.id ? "default" : "outline"} className="h-auto p-3 min-w-[140px]" onClick={() => onTemplateSelect(template.id)}>
              <div className="space-y-1 text-center">
                <div className="font-medium text-sm flex items-center gap-1 justify-center flex-wrap">
                  {template.name}
                  {template.premiumRequired && <PremiumBadge size="sm" />}
                </div>
                {/* Compact Color Preview */}
                <div className="flex gap-1 justify-center">
                  <div className="w-2 h-2 rounded-full border border-gray-200" style={{
                backgroundColor: template.colors.primary
              }} />
                  <div className="w-2 h-2 rounded-full border border-gray-200" style={{
                backgroundColor: template.colors.secondary
              }} />
                  <div className="w-2 h-2 rounded-full border border-gray-200" style={{
                backgroundColor: template.colors.accent
              }} />
                </div>
              </div>
            </Button>
          </div>)}
      </div>;
  }
  return <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
      {Object.values(newTemplateConfigs).map(template => <div key={template.id} className="space-y-1">
          <Button variant={selectedTemplate === template.id ? "default" : "outline"} className="w-full justify-start h-auto p-3 text-left" onClick={() => onTemplateSelect(template.id)}>
            <div className="space-y-1 w-full">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{template.name}</span>
                {template.premiumRequired && <PremiumBadge size="sm" />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            </div>
          </Button>
          
          {/* Compact Color Preview */}
          <div className="flex gap-1 justify-center">
            <div className="w-2 h-2 rounded-full border border-gray-200" style={{
          backgroundColor: template.colors.primary
        }} />
            <div className="w-2 h-2 rounded-full border border-gray-200" style={{
          backgroundColor: template.colors.secondary
        }} />
            <div className="w-2 h-2 rounded-full border border-gray-200" style={{
          backgroundColor: template.colors.accent
        }} />
          </div>
        </div>)}
    </div>;
};