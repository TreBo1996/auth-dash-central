
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Palette, Check } from 'lucide-react';

interface TemplateSelectorProps {
  selectedTemplate: string;
  onTemplateSelect: (template: string) => void;
}

const templates = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design',
    preview: 'bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-500'
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional professional layout',
    preview: 'bg-white border border-gray-300'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold and distinctive styling',
    preview: 'bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-purple-500'
  }
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Palette className="h-4 w-4" />
          Choose Template
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle>Resume Templates</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate === template.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => {
                onTemplateSelect(template.id);
                setIsOpen(false);
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {selectedTemplate === template.id && (
                    <Check className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{template.description}</p>
              </CardHeader>
              <CardContent>
                <div className={`h-32 rounded-md p-4 ${template.preview}`}>
                  <div className="h-2 bg-gray-300 rounded mb-2"></div>
                  <div className="h-1 bg-gray-200 rounded mb-1 w-3/4"></div>
                  <div className="h-1 bg-gray-200 rounded mb-3 w-1/2"></div>
                  <div className="h-1 bg-gray-200 rounded mb-1"></div>
                  <div className="h-1 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
