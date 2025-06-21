
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResumePreviewProps {
  content: string;
  selectedTemplate: string;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  content,
  selectedTemplate
}) => {
  const getTemplateStyles = () => {
    switch (selectedTemplate) {
      case 'modern':
        return {
          container: 'bg-gradient-to-br from-blue-50 to-white',
          header: 'text-blue-600 border-l-4 border-blue-500 pl-3 bg-gradient-to-r from-blue-50 to-transparent py-2 -ml-3',
          text: 'text-gray-700'
        };
      case 'creative':
        return {
          container: 'bg-gradient-to-br from-purple-50 to-pink-50',
          header: 'text-purple-600 border-l-4 border-purple-500 pl-3 bg-gradient-to-r from-purple-50 to-transparent py-2 -ml-3',
          text: 'text-gray-700'
        };
      case 'classic':
      default:
        return {
          container: 'bg-white',
          header: 'text-gray-800 border-b-2 border-gray-300 pb-1',
          text: 'text-gray-700'
        };
    }
  };

  const styles = getTemplateStyles();

  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Check if line is a section header (all caps, short, and doesn't contain common words)
      const isHeader = line.toUpperCase() === line && 
                      line.trim().length > 0 && 
                      line.trim().length < 50 &&
                      !line.includes('•') &&
                      !line.includes('-') &&
                      !line.includes('(') &&
                      !line.includes('@');

      if (isHeader) {
        return (
          <h3 key={index} className={`text-lg font-semibold mt-6 mb-2 ${styles.header}`}>
            {line}
          </h3>
        );
      } else if (line.trim()) {
        return (
          <p key={index} className={`mb-2 ${styles.text} leading-relaxed`}>
            {line}
          </p>
        );
      } else {
        return <div key={index} className="mb-2"></div>;
      }
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Resume Preview
          <span className="text-sm font-normal text-gray-500">
            ({selectedTemplate} template)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`resume-preview template-${selectedTemplate} p-6 rounded-lg border ${styles.container}`}>
          {formatContent(content)}
        </div>
      </CardContent>
    </Card>
  );
};
