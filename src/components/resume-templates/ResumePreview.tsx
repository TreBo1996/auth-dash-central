
import React from 'react';
import { ModernTemplate } from './templates/ModernTemplate';
import { ClassicTemplate } from './templates/ClassicTemplate';
import { CreativeTemplate } from './templates/CreativeTemplate';
import { ExecutiveTemplate } from './templates/ExecutiveTemplate';
import { TechnicalTemplate } from './templates/TechnicalTemplate';
import { AcademicTemplate } from './templates/AcademicTemplate';
import { SidebarTemplate } from './templates/SidebarTemplate';

interface ResumePreviewProps {
  template: string;
  resumeData: string;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  template,
  resumeData
}) => {
  const renderTemplate = () => {
    const props = { resumeData };
    
    switch (template) {
      case 'sidebar':
        return <SidebarTemplate {...props} />;
      case 'modern':
        return <ModernTemplate {...props} />;
      case 'classic':
        return <ClassicTemplate {...props} />;
      case 'executive':
        return <ExecutiveTemplate {...props} />;
      case 'creative':
        return <CreativeTemplate {...props} />;
      case 'technical':
        return <TechnicalTemplate {...props} />;
      case 'academic':
        return <AcademicTemplate {...props} />;
      default:
        return <ModernTemplate {...props} />;
    }
  };

  return (
    <div id="resume-preview" className="min-h-[800px] bg-white">
      {renderTemplate()}
    </div>
  );
};
