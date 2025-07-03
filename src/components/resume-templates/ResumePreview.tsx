
import React, { useState, useEffect } from 'react';
import { ModernTemplate } from './templates/ModernTemplate';
import { ClassicTemplate } from './templates/ClassicTemplate';
import { ProfessionalClassicTemplate } from './templates/ProfessionalClassicTemplate';
import { CreativeTemplate } from './templates/CreativeTemplate';
import { ExecutiveTemplate } from './templates/ExecutiveTemplate';
import { TechnicalTemplate } from './templates/TechnicalTemplate';
import { AcademicTemplate } from './templates/AcademicTemplate';
import { SidebarTemplate } from './templates/SidebarTemplate';
import { fetchStructuredResumeData, StructuredResumeData } from './utils/fetchStructuredResumeData';
import { parseResumeContent } from './utils/parseResumeContent';

interface ResumePreviewProps {
  template: string;
  resumeData: string;
  optimizedResumeId?: string;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  template,
  resumeData,
  optimizedResumeId
}) => {
  const [structuredData, setStructuredData] = useState<StructuredResumeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStructuredData = async () => {
      if (!optimizedResumeId) {
        // Fallback to text parsing for backward compatibility
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchStructuredResumeData(optimizedResumeId);
        setStructuredData(data);
        console.log('Loaded structured data successfully');
      } catch (err) {
        console.error('Error loading structured data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load structured data');
        // Fall back to text parsing if structured data fails
      } finally {
        setLoading(false);
      }
    };

    loadStructuredData();
  }, [optimizedResumeId]);

  const renderTemplate = () => {
    // Use structured data if available, otherwise fall back to text parsing
    const dataToUse = structuredData || parseResumeContent(resumeData);
    const props = { resumeData: dataToUse };
    
    switch (template) {
      case 'sidebar':
        return <SidebarTemplate {...props} />;
      case 'modern':
        return <ModernTemplate {...props} />;
      case 'classic':
        return <ProfessionalClassicTemplate {...props} />;
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

  if (loading) {
    return (
      <div id="resume-preview" className="min-h-[800px] bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !structuredData) {
    return (
      <div id="resume-preview" className="min-h-[800px] bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading resume data</p>
          <p className="text-sm text-gray-600">Falling back to text parsing...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="resume-preview" className="min-h-[800px] bg-white">
      {renderTemplate()}
    </div>
  );
};
