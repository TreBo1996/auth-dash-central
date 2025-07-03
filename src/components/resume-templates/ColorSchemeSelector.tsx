import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Palette } from 'lucide-react';
import { ColorScheme } from './configs/newTemplateConfigs';

interface ColorSchemeSelectorProps {
  colorSchemes: ColorScheme[];
  selectedScheme: string;
  onSchemeSelect: (schemeId: string) => void;
}

export const ColorSchemeSelector: React.FC<ColorSchemeSelectorProps> = ({
  colorSchemes,
  selectedScheme,
  onSchemeSelect
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Palette className="h-4 w-4" />
        Color Scheme
      </div>
      
      <div className="space-y-2">
        {colorSchemes.map((scheme) => (
          <Card 
            key={scheme.id} 
            className={`cursor-pointer transition-all hover:shadow-sm ${
              selectedScheme === scheme.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => onSchemeSelect(scheme.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium">{scheme.name}</div>
                  <div className="flex gap-1 mt-2">
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-200" 
                      style={{ backgroundColor: scheme.colors.primary }}
                    />
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-200" 
                      style={{ backgroundColor: scheme.colors.secondary }}
                    />
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-200" 
                      style={{ backgroundColor: scheme.colors.accent }}
                    />
                  </div>
                </div>
                {selectedScheme === scheme.id && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};