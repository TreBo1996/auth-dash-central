
import React, { useState, useEffect } from 'react';
import { MinimalistExecutiveTemplate } from './templates/MinimalistExecutiveTemplate';
import { ModernATSTemplate } from './templates/ModernATSTemplate';
import { CreativeProfessionalTemplate } from './templates/CreativeProfessionalTemplate';
import { AcademicResearchTemplate } from './templates/AcademicResearchTemplate';
import { TechnicalEngineeringTemplate } from './templates/TechnicalEngineeringTemplate';
import { fetchStructuredResumeData, StructuredResumeData } from './utils/fetchStructuredResumeData';
import { parseResumeContent } from './utils/parseResumeContent';
import { newTemplateConfigs } from './configs/newTemplateConfigs';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResumePreviewProps {
  template: string;
  resumeData: string;
  optimizedResumeId?: string;
  selectedColorScheme?: string;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  template,
  resumeData,
  optimizedResumeId,
  selectedColorScheme
}) => {
  const [structuredData, setStructuredData] = useState<StructuredResumeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

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
    
    // Get the selected color scheme
    const templateConfig = newTemplateConfigs[template];
    const colorScheme = selectedColorScheme 
      ? templateConfig.colorSchemes.find(scheme => scheme.id === selectedColorScheme)
      : templateConfig.colorSchemes.find(scheme => scheme.id === templateConfig.defaultColorScheme);
    
    const props = { resumeData: dataToUse, colorScheme };
    
    switch (template) {
      case 'minimalist-executive':
        return <MinimalistExecutiveTemplate {...props} />;
      case 'modern-ats':
        return <ModernATSTemplate {...props} />;
      case 'creative-professional':
        return <CreativeProfessionalTemplate {...props} />;
      case 'academic-research':
        return <AcademicResearchTemplate {...props} />;
      case 'technical-engineering':
        return <TechnicalEngineeringTemplate {...props} />;
      default:
        return <ModernATSTemplate {...props} />;
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
    <div 
      id="resume-preview" 
      className={`min-h-[800px] bg-white ${
        isMobile 
          ? 'w-full overflow-hidden' 
          : ''
      }`}
      style={{
        // Enhanced rendering properties for crisp text
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        fontSmooth: 'always',
        backfaceVisibility: 'hidden',
        perspective: '1000px',
        willChange: 'transform'
      }}
    >
      <div className="w-full">
        {renderTemplate()}
      </div>
    </div>
  );
};
