
import html2pdf from 'html2pdf.js';
import { templateConfigs } from '@/components/resume-templates/templateConfigs';

// Basic PDF generation options - prioritizing functionality over quality initially
const getBasicPDFOptions = () => {
  return {
    margin: [36, 36, 36, 36], // 0.5in = 36pt margins
    filename: 'resume.pdf',
    image: { type: 'jpeg', quality: 0.8 }, // Moderate quality JPEG
    html2canvas: { 
      scale: 1, // Start with scale 1 for reliability
      useCORS: true,
      letterRendering: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      dpi: 96, // Standard DPI for basic functionality
      imageTimeout: 10000, // Shorter timeout
      onrendered: (canvas: HTMLCanvasElement) => {
        console.log('Canvas rendered - Basic settings:', canvas.width, 'x', canvas.height);
        console.log('Canvas area:', canvas.width * canvas.height, 'pixels');
      }
    },
    jsPDF: { 
      unit: 'pt',
      format: 'letter', 
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { 
      mode: ['css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: ['.avoid-page-break', '.job-entry']
    }
  };
};

// Enhanced PDF generation options - only used if basic works
const getEnhancedPDFOptions = () => {
  return {
    margin: [36, 36, 36, 36],
    filename: 'resume.pdf',
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { 
      scale: 1.5, // Moderate scale increase
      useCORS: true,
      letterRendering: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      dpi: 120, // Moderate DPI increase
      foreignObjectRendering: true,
      imageTimeout: 15000,
      onrendered: (canvas: HTMLCanvasElement) => {
        console.log('Canvas rendered - Enhanced settings:', canvas.width, 'x', canvas.height);
        if (canvas.width > 2500 || canvas.height > 3500) {
          console.warn('Large canvas detected - Enhanced quality might cause issues');
        }
      }
    },
    jsPDF: { 
      unit: 'pt',
      format: 'letter', 
      orientation: 'portrait',
      compress: true,
      precision: 16
    },
    pagebreak: { 
      mode: ['css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: ['.avoid-page-break', '.job-entry']
    }
  };
};

// Simplified HTML cleaning focused on PDF compatibility
const cleanHTMLForPDF = (element: HTMLElement): HTMLElement => {
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Remove interactive elements
  const interactiveElements = clonedElement.querySelectorAll('button, input, select, textarea, [contenteditable]');
  interactiveElements.forEach(el => el.remove());
  
  // PDF-specific styles with font size adjustments
  const pdfStyles = `
    <style>
      @page {
        size: 8.5in 11in;
        margin: 0.5in;
      }
      
      /* Force proper text rendering */
      * {
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-family: Arial, sans-serif !important;
      }
      
      /* Increase font sizes for better PDF rendering */
      body, div, p, span {
        font-size: 12px !important;
        line-height: 1.4 !important;
      }
      
      h1 {
        font-size: 24px !important;
        line-height: 1.3 !important;
      }
      
      h2 {
        font-size: 14px !important;
        line-height: 1.3 !important;
      }
      
      h3 {
        font-size: 12px !important;
        line-height: 1.3 !important;
      }
      
      /* Simplify layouts for PDF */
      .grid {
        display: block !important;
      }
      
      .grid-cols-2 > div {
        display: block !important;
        margin-bottom: 8px !important;
      }
      
      /* Ensure full width utilization */
      #resume-preview {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 16px !important;
      }
      
      /* Page break controls */
      h1, h2, h3 { 
        page-break-after: avoid !important; 
        break-after: avoid !important;
      }
      
      .job-entry { 
        page-break-inside: avoid !important; 
        break-inside: avoid !important;
      }
      
      /* Reduce excessive margins */
      .mb-6 { 
        margin-bottom: 12px !important; 
      }
      
      .mb-2 {
        margin-bottom: 6px !important;
      }
    </style>
  `;
  
  clonedElement.insertAdjacentHTML('afterbegin', pdfStyles);
  
  return clonedElement;
};

// Check if element has valid content
const validateResumeContent = (element: HTMLElement): boolean => {
  if (!element) {
    console.error('PDF Generation: Resume element is null');
    return false;
  }
  
  if (!element.innerHTML.trim()) {
    console.error('PDF Generation: Resume element is empty');
    return false;
  }
  
  const textContent = element.textContent?.trim() || '';
  if (textContent.length < 50) {
    console.error('PDF Generation: Resume content seems too short:', textContent.length, 'characters');
    return false;
  }
  
  console.log('PDF Generation: Content validation passed - text length:', textContent.length);
  return true;
};

const waitForRender = (ms: number = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const generatePDF = async (templateId: string, resumeContent: string, fileName: string) => {
  console.log('PDF Generation: Starting PDF generation for template:', templateId);
  
  const resumeElement = document.getElementById('resume-preview');
  if (!resumeElement) {
    console.error('PDF Generation: Resume preview element not found');
    throw new Error('Resume content not found');
  }

  // Validate content before proceeding
  if (!validateResumeContent(resumeElement)) {
    throw new Error('Resume content is empty or invalid');
  }

  console.log('PDF Generation: Element dimensions:', {
    width: resumeElement.offsetWidth,
    height: resumeElement.offsetHeight,
    scrollWidth: resumeElement.scrollWidth,
    scrollHeight: resumeElement.scrollHeight
  });

  try {
    // Wait for rendering to complete
    await waitForRender();
    
    // Clean the HTML content
    const cleanedElement = cleanHTMLForPDF(resumeElement);
    console.log('PDF Generation: HTML cleaned for PDF compatibility');
    
    // Try basic settings first
    const basicOptions = {
      ...getBasicPDFOptions(),
      filename: fileName || 'resume.pdf'
    };
    
    console.log('PDF Generation: Attempting with basic settings');
    
    try {
      const worker = html2pdf()
        .set(basicOptions)
        .from(cleanedElement);
      
      await worker.save();
      console.log('PDF Generation: Successfully generated PDF with basic settings');
      
    } catch (basicError) {
      console.warn('PDF Generation: Basic settings failed, trying enhanced settings:', basicError);
      
      // Try enhanced settings as fallback
      const enhancedOptions = {
        ...getEnhancedPDFOptions(),
        filename: fileName || 'resume.pdf'
      };
      
      const enhancedWorker = html2pdf()
        .set(enhancedOptions)
        .from(cleanedElement);
      
      await enhancedWorker.save();
      console.log('PDF Generation: Successfully generated PDF with enhanced settings');
    }
    
  } catch (error) {
    console.error('PDF Generation: All attempts failed:', error);
    
    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Canvas') || error.message.includes('canvas')) {
        throw new Error('PDF generation failed due to rendering issues. The resume content may be too complex. Please try again.');
      } else if (error.message.includes('jsPDF') || error.message.includes('pdf')) {
        throw new Error('PDF file creation failed. Please check your browser settings and try again.');
      } else if (error.message.includes('timeout')) {
        throw new Error('PDF generation timed out. Please try again.');
      }
    }
    
    throw new Error('PDF generation failed. Please try again or contact support if the issue persists.');
  }
};

// Keep the print function separate for users who want to print directly
export const printResume = (templateId: string, resumeContent: string) => {
  console.log('Print: Starting print dialog for template:', templateId);
  
  const resumeElement = document.getElementById('resume-preview');
  if (!resumeElement) {
    console.error('Print: Resume preview element not found');
    throw new Error('Resume content not found');
  }

  // Simplified print CSS
  const printCSS = `
    <style>
      @media print {
        body { 
          margin: 0; 
          padding: 0; 
          font-family: Arial, sans-serif !important;
        }
        @page { 
          size: 8.5in 11in; 
          margin: 0.5in; 
        }
        .no-print, nav, .sidebar, button, .btn { 
          display: none !important; 
        }
        #resume-preview { 
          box-shadow: none !important; 
          border: none !important; 
          background: white !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        li {
          page-break-inside: avoid !important;
        }
        h1, h2, h3 {
          page-break-after: avoid !important;
        }
      }
    </style>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Unable to open print window');
  }

  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Resume</title>
      ${printCSS}
    </head>
    <body>
      ${resumeElement.outerHTML}
      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
            window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(printHTML);
  printWindow.document.close();
};
