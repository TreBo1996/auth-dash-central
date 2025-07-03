import html2pdf from 'html2pdf.js';
import { StructuredResumeData } from '@/components/resume-templates/utils/fetchStructuredResumeData';

// PDF generation options optimized for resume templates
const getPDFOptions = (templateId: string) => {
  const baseOptions = {
    margin: [0.5, 0.5, 0.5, 0.5],
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      dpi: 300
    },
    jsPDF: { 
      unit: 'in', 
      format: 'letter', 
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { 
      mode: ['css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: ['.avoid-page-break', '.experience-item']
    }
  };

  return {
    ...baseOptions,
    filename: `resume-${templateId}.pdf`
  };
};

// Clean HTML for PDF generation with template-specific styles
const cleanHTMLForPDF = (element: HTMLElement, templateId: string): HTMLElement => {
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Remove interactive elements
  const interactiveElements = clonedElement.querySelectorAll('button, input, select, textarea, [contenteditable]');
  interactiveElements.forEach(el => el.remove());
  
  // Template-specific PDF styles
  const templateStyles = {
    'minimalist-executive': `
      <style>
        @page { size: 8.5in 11in; margin: 0.5in; }
        * { 
          color: #2d3748 !important; 
          font-family: Georgia, "Times New Roman", serif !important; 
        }
        .text-lg { font-size: 18px !important; }
        .text-base { font-size: 14px !important; }
        .text-sm { font-size: 12px !important; }
        .font-bold { font-weight: 700 !important; }
        .border-b { border-bottom: 1px solid #e2e8f0 !important; }
        .experience-item { page-break-inside: avoid !important; margin-bottom: 16px !important; }
        h1, h2, h3 { page-break-after: avoid !important; }
      </style>
    `,
    'modern-ats': `
      <style>
        @page { size: 8.5in 11in; margin: 0.5in; }
        * { 
          color: #1a202c !important; 
          font-family: Inter, "Helvetica Neue", sans-serif !important; 
        }
        .text-lg { font-size: 18px !important; }
        .text-base { font-size: 14px !important; }
        .text-sm { font-size: 12px !important; }
        .font-bold { font-weight: 600 !important; }
        .experience-item { page-break-inside: avoid !important; margin-bottom: 16px !important; }
        h1, h2, h3 { page-break-after: avoid !important; }
      </style>
    `,
    'creative-professional': `
      <style>
        @page { size: 8.5in 11in; margin: 0.5in; }
        * { 
          font-family: Montserrat, Arial, sans-serif !important; 
        }
        .text-lg { font-size: 18px !important; }
        .text-base { font-size: 14px !important; }
        .text-sm { font-size: 12px !important; }
        .font-bold { font-weight: 600 !important; }
        .experience-item { page-break-inside: avoid !important; margin-bottom: 16px !important; }
        h1, h2, h3 { page-break-after: avoid !important; }
      </style>
    `,
    'academic-research': `
      <style>
        @page { size: 8.5in 11in; margin: 0.75in; }
        * { 
          color: #1a1a1a !important; 
          font-family: "Times New Roman", Georgia, serif !important; 
        }
        .text-lg { font-size: 16px !important; }
        .text-base { font-size: 12px !important; }
        .text-sm { font-size: 11px !important; }
        .font-bold { font-weight: 700 !important; }
        .experience-item { page-break-inside: auto !important; margin-bottom: 12px !important; }
        h1, h2, h3 { page-break-after: avoid !important; }
      </style>
    `,
    'technical-engineering': `
      <style>
        @page { size: 8.5in 11in; margin: 0.5in; }
        * { 
          color: #2c5282 !important; 
          font-family: Inter, "Helvetica Neue", sans-serif !important; 
        }
        .text-lg { font-size: 18px !important; }
        .text-base { font-size: 14px !important; }
        .text-sm { font-size: 12px !important; }
        .font-bold { font-weight: 600 !important; }
        .experience-item { page-break-inside: avoid !important; margin-bottom: 16px !important; }
        h1, h2, h3 { page-break-after: avoid !important; }
      </style>
    `
  };

  // Insert template-specific styles
  const styles = templateStyles[templateId as keyof typeof templateStyles] || templateStyles['modern-ats'];
  clonedElement.insertAdjacentHTML('afterbegin', styles);
  
  return clonedElement;
};

export const generateNewProfessionalPDF = async (
  templateId: string, 
  resumeData: StructuredResumeData, 
  fileName: string
): Promise<void> => {
  console.log('generateNewProfessionalPDF: Starting generation for:', templateId);
  
  try {
    // Get the resume preview element
    const resumeElement = document.getElementById('resume-preview');
    if (!resumeElement) {
      throw new Error('Resume preview element not found');
    }

    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Clean and prepare HTML for PDF
    const cleanedHTML = cleanHTMLForPDF(resumeElement, templateId);
    
    // Generate PDF with template-specific options
    const options = getPDFOptions(templateId);
    
    console.log('generateNewProfessionalPDF: Converting HTML to PDF...');
    await html2pdf().set(options).from(cleanedHTML).save(fileName);
    
    console.log('generateNewProfessionalPDF: Generation successful');
  } catch (error) {
    console.error('generateNewProfessionalPDF: Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};