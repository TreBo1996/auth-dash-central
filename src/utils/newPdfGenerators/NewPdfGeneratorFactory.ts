import jsPDF from 'jspdf';
import { StructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';
import { MinimalistExecutivePdfGenerator } from './MinimalistExecutivePdfGenerator';
import { ModernATSPdfGenerator } from './ModernATSPdfGenerator';
import { CreativeProfessionalPdfGenerator } from './CreativeProfessionalPdfGenerator';
import { AcademicResearchPdfGenerator } from './AcademicResearchPdfGenerator';
import { TechnicalEngineeringPdfGenerator } from './TechnicalEngineeringPdfGenerator';

export class NewPdfGeneratorFactory {
  static async generatePDF(templateId: string, resumeData: StructuredResumeData): Promise<jsPDF> {
    console.log('NewPdfGeneratorFactory: Generating PDF for template:', templateId);
    
    let generator;
    
    switch (templateId) {
      case 'minimalist-executive':
        generator = new MinimalistExecutivePdfGenerator();
        break;
      case 'modern-ats':
        generator = new ModernATSPdfGenerator();
        break;
      case 'creative-professional':
        generator = new CreativeProfessionalPdfGenerator();
        break;
      case 'academic-research':
        generator = new AcademicResearchPdfGenerator();
        break;
      case 'technical-engineering':
        generator = new TechnicalEngineeringPdfGenerator();
        break;
      default:
        console.warn('NewPdfGeneratorFactory: Unknown template, falling back to modern-ats');
        generator = new ModernATSPdfGenerator();
    }
    
    return await generator.generate(resumeData);
  }
}

export const generateNewProfessionalPDF = async (
  templateId: string, 
  resumeData: StructuredResumeData, 
  fileName: string
): Promise<void> => {
  console.log('generateNewProfessionalPDF: Starting generation for:', templateId);
  
  try {
    const pdf = await NewPdfGeneratorFactory.generatePDF(templateId, resumeData);
    console.log('generateNewProfessionalPDF: Generation successful, downloading...');
    pdf.save(fileName);
  } catch (error) {
    console.error('generateNewProfessionalPDF: Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};