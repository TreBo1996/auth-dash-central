import html2pdf from 'html2pdf.js';
import { templateConfigs } from '@/components/resume-templates/templateConfigs';

// PDF generation options with simplified settings (pt units, 96 DPI)
const getPDFOptions = () => {
  return {
    margin: [36, 36, 36, 36], // 0.5in = 36pt margins
    filename: 'resume.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 1,
      useCORS: true,
      letterRendering: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      dpi: 96,
      onrendered: (canvas: HTMLCanvasElement) => {
        console.log('Canvas rendered:', canvas.width, 'x', canvas.height);
      }
    },
    jsPDF: { 
      unit: 'pt', // Changed from 'in' to 'pt' for better CSS consistency
      format: 'letter', 
      orientation: 'portrait',
      compress: true,
      precision: 16,
      putOnlyUsedFonts: true,
      floatPrecision: 16
    },
    pagebreak: { 
      mode: ['css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: ['.avoid-page-break', '.job-entry']
    }
  };
};

// Simplified HTML cleaning with focused page break controls
const cleanHTMLForPDF = (element: HTMLElement): HTMLElement => {
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Remove any interactive elements that might cause issues
  const interactiveElements = clonedElement.querySelectorAll('button, input, select, textarea, [contenteditable]');
  interactiveElements.forEach(el => el.remove());
  
  // Simplified page break styles - following the user's specified approach
  const pageBreakStyles = `
    <style>
      @page {
        size: 8.5in 11in;
        margin: 0.5in; /* Keep existing 0.5in margins */
      }
      
      /* Force proper text rendering and sizing */
      * {
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif !important;
      }
      
      /* Ensure full width utilization */
      #resume-preview {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* ---- PAGE-BREAK PATCH ---- */
      h1            { page-break-after: avoid !important; }
      h2, h3        { page-break-after: auto  !important;
                      break-after:     auto  !important;
                      page-break-inside: avoid !important; }

      .job-entry                { page-break-inside: auto  !important; }
      .job-entry > :first-child { page-break-after:  avoid !important; }

      /* Keep at least two lines together in any paragraph or list item */
      p, li, div { orphans:2 !important; widows:2 !important; }
    </style>
  `;
  
  // Insert the styles at the beginning
  clonedElement.insertAdjacentHTML('afterbegin', pageBreakStyles);
  
  // Force black text color
  const allElements = clonedElement.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style) {
      htmlEl.style.color = '#000000';
    }
  });
  
  return clonedElement;
};

// Add better error handling and content detection
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

  // Check if element has content
  if (!resumeElement.innerHTML.trim()) {
    console.error('PDF Generation: Resume element is empty');
    throw new Error('Resume content is empty');
  }

  try {
    console.log('PDF Generation: Element dimensions:', {
      width: resumeElement.offsetWidth,
      height: resumeElement.offsetHeight,
      scrollWidth: resumeElement.scrollWidth,
      scrollHeight: resumeElement.scrollHeight
    });

    // Wait for rendering to complete
    await waitForRender();
    
    // Clean the HTML content with simplified page break controls
    const cleanedElement = cleanHTMLForPDF(resumeElement);
    
    // Configure PDF options with the provided filename
    const options = {
      ...getPDFOptions(),
      filename: fileName || 'resume.pdf'
    };
    
    console.log('PDF Generation: Generating PDF with options:', options);
    
    // Generate and download the PDF
    const worker = html2pdf()
      .set(options)
      .from(cleanedElement);
    
    await worker.save();
    
    console.log('PDF Generation: Successfully downloaded PDF');
    
  } catch (error) {
    console.error('PDF Generation: Error generating PDF:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Canvas')) {
        throw new Error('Failed to render PDF content. Please try again.');
      } else if (error.message.includes('jsPDF')) {
        throw new Error('Failed to generate PDF file. Please check your content and try again.');
      }
    }
    
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

  // Simplified print CSS
  const printCSS = `
    <style>
      @media print {
        body { 
          margin: 0; 
          padding: 0; 
          font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif !important;
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
