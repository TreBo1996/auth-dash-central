import html2pdf from 'html2pdf.js';
import { templateConfigs } from '@/components/resume-templates/templateConfigs';

// PDF generation options with more conservative settings
const getPDFOptions = () => {
  return {
    margin: [0.5, 0.6, 0.5, 0.6],
    filename: 'resume.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 1.5,
      useCORS: true,
      letterRendering: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      height: window.innerHeight,
      width: window.innerWidth,
      scrollX: 0,
      scrollY: 0,
      onrendered: (canvas: HTMLCanvasElement) => {
        console.log('Canvas rendered:', canvas.width, 'x', canvas.height);
      }
    },
    jsPDF: { 
      unit: 'in', 
      format: 'letter', 
      orientation: 'portrait',
      compress: true,
      precision: 16
    },
    pagebreak: { 
      mode: ['css'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: ['.avoid-page-break']
    }
  };
};

// Clean the HTML content with selective page break controls
const cleanHTMLForPDF = (element: HTMLElement): HTMLElement => {
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Remove any interactive elements that might cause issues
  const interactiveElements = clonedElement.querySelectorAll('button, input, select, textarea, [contenteditable]');
  interactiveElements.forEach(el => el.remove());
  
  // Add selective page break styles - only where really needed
  const pageBreakStyles = `
    <style>
      @page {
        size: 8.5in 11in;
        margin: 0.5in 0.6in;
      }
      
      /* Only apply page break controls to specific elements that need it */
      
      /* Keep bullet points together */
      li {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin-bottom: 3px !important;
      }
      
      /* Keep job sections together when possible */
      .job-entry, .experience-item {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Prevent headers from being orphaned */
      h1, h2, h3 {
        page-break-after: avoid !important;
        break-after: avoid !important;
        margin-bottom: 8px !important;
      }
      
      /* Keep unordered lists together when reasonable */
      ul {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      /* Force proper text rendering */
      * {
        color: #000000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif !important;
      }
      
      /* Better line spacing */
      p, li, div {
        line-height: 1.4 !important;
      }
      
      /* Margin controls */
      .space-y-1 > * + * { margin-top: 0.25rem !important; }
      .space-y-2 > * + * { margin-top: 0.5rem !important; }
      .space-y-3 > * + * { margin-top: 0.75rem !important; }
      .space-y-4 > * + * { margin-top: 1rem !important; }
      
      /* Grid layouts */
      .grid-cols-2 {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 1rem !important;
      }
    </style>
  `;
  
  // Insert the styles at the beginning
  clonedElement.insertAdjacentHTML('afterbegin', pageBreakStyles);
  
  // Add specific classes to elements that need page break protection
  const allElements = clonedElement.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    
    // Only target specific elements for page break protection
    if (htmlEl.tagName === 'LI') {
      htmlEl.classList.add('avoid-page-break');
    }
    
    // Job entries and experience sections
    if (htmlEl.classList.contains('mb-4') && htmlEl.querySelector('h3')) {
      htmlEl.classList.add('avoid-page-break', 'job-entry');
    }
    
    // Force text color to black
    if (htmlEl.style) {
      htmlEl.style.color = '#000000';
    }
  });
  
  return clonedElement;
};

// Add a small delay to ensure proper rendering
const waitForRender = (ms: number = 300) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const generatePDF = async (templateId: string, resumeContent: string, fileName: string) => {
  console.log('PDF Generation: Starting PDF generation for template:', templateId);
  
  const resumeElement = document.getElementById('resume-preview');
  if (!resumeElement) {
    console.error('PDF Generation: Resume preview element not found');
    throw new Error('Resume content not found');
  }

  try {
    // Wait for rendering to complete
    await waitForRender();
    
    // Clean the HTML content with selective page break controls
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

  // Simple print CSS without aggressive page break controls
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
          margin: 0.5in 0.6in; 
        }
        .no-print, nav, .sidebar, button, .btn { 
          display: none !important; 
        }
        #resume-preview { 
          box-shadow: none !important; 
          border: none !important; 
          background: white !important;
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
