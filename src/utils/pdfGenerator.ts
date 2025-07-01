import html2pdf from 'html2pdf.js';
import { templateConfigs } from '@/components/resume-templates/templateConfigs';

// PDF generation options optimized for resumes
const getPDFOptions = () => {
  return {
    margin: [0.5, 0.75, 0.5, 0.75], // top, right, bottom, left in inches
    filename: 'resume.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
      allowTaint: false,
      backgroundColor: '#ffffff'
    },
    jsPDF: { 
      unit: 'in', 
      format: 'letter', 
      orientation: 'portrait',
      compress: true
    }
  };
};

// Clean the HTML content for better PDF generation
const cleanHTMLForPDF = (element: HTMLElement): HTMLElement => {
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Remove any interactive elements that might cause issues
  const interactiveElements = clonedElement.querySelectorAll('button, input, select, textarea, [contenteditable]');
  interactiveElements.forEach(el => el.remove());
  
  // Ensure all text is black for print
  const allElements = clonedElement.querySelectorAll('*');
  allElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style) {
      // Force text colors to black for better print readability
      if (htmlEl.tagName.match(/^H[1-6]$/)) {
        htmlEl.style.color = '#000000';
      }
    }
  });
  
  return clonedElement;
};

export const generatePDF = async (templateId: string, resumeContent: string, fileName: string) => {
  console.log('PDF Generation: Starting actual PDF generation for template:', templateId);
  
  const resumeElement = document.getElementById('resume-preview');
  if (!resumeElement) {
    console.error('PDF Generation: Resume preview element not found');
    throw new Error('Resume content not found');
  }

  try {
    // Clean the HTML content for PDF generation
    const cleanedElement = cleanHTMLForPDF(resumeElement);
    
    // Configure PDF options with the provided filename
    const options = {
      ...getPDFOptions(),
      filename: fileName || 'resume.pdf'
    };
    
    console.log('PDF Generation: Generating PDF with options:', options);
    
    // Generate and download the PDF
    await html2pdf()
      .set(options)
      .from(cleanedElement)
      .save();
    
    console.log('PDF Generation: Successfully generated and downloaded PDF');
    
  } catch (error) {
    console.error('PDF Generation: Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
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

  // Simple print CSS for clean printing
  const printCSS = `
    <style>
      @media print {
        body { margin: 0; padding: 0; }
        @page { size: 8.5in 11in; margin: 0.5in 0.75in; }
        .no-print, nav, .sidebar, button, .btn { display: none !important; }
        #resume-preview { 
          box-shadow: none !important; 
          border: none !important; 
          background: white !important;
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
